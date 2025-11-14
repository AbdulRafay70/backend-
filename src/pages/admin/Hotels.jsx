import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import HotelsTabs from "../../components/HotelsTabs";
import { Search } from "lucide-react";
import { Gear } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import AdminFooter from "../../components/AdminFooter";
import api from "../../utils/Api";

const HotelRowSkeleton = () => {
  return (
    <tr>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "100%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "80%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "100%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "90%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "80%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
    </tr>
  );
};

const Hotels = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [cityMapping, setCityMapping] = useState({});
  const [cities, setCities] = useState([]);

  // Be tolerant when reading organization info from localStorage. Support a few possible keys
  const _orgRaw = localStorage.getItem("selectedOrganization") || localStorage.getItem("organization") || localStorage.getItem("selected_org");
  let parsedOrg = null;
  try {
    parsedOrg = _orgRaw ? JSON.parse(_orgRaw) : null;
  } catch (e) {
    parsedOrg = null;
  }
  // allow an env fallback for local development (optional)
  const defaultOrgFromEnv = import.meta.env.VITE_DEFAULT_ORG_ID ? Number(import.meta.env.VITE_DEFAULT_ORG_ID) : null;
  const [organizationId, setOrganizationId] = React.useState(parsedOrg?.id ?? defaultOrgFromEnv ?? null);
  const token = localStorage.getItem("accessToken");

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString + "T00:00:00Z");

    const day = date.getUTCDate();
    const month = date.toLocaleString("en-US", {
      month: "long",
      timeZone: "UTC",
    });
    const year = date.getUTCFullYear();

    return `${day} ${month} ${year}`;
  };

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError("");

      // If organizationId is present, include it as a query param. If not, attempt a fetch without org
      // (useful for development or to surface server errors — backend may still return 403).
      let response;
      if (organizationId) {
        response = await api.get(`/hotels/`, { params: { organization: organizationId } });
      } else {
        console.warn('No organization selected in localStorage. Attempting /hotels/ fetch without organization parameter.');
        response = await api.get(`/hotels/`);
      }

      // backend may return different shapes:
      // - array: [ {hotel}, ... ]
      // - DRF pagination: { count, next, previous, results: [...] }
      // - custom pagination: { total_records, limit, offset, data: [...] }
      const payload = response.data || {};
      let list = [];
      let total = 0;
      if (Array.isArray(payload)) {
        list = payload;
        total = payload.length;
      } else if (payload.results && Array.isArray(payload.results)) {
        list = payload.results;
        total = payload.count || payload.results.length || 0;
      } else if (payload.data && Array.isArray(payload.data)) {
        list = payload.data;
        total = payload.total_records || payload.data.length || 0;
      } else {
        // fallback: if payload looks like a single object representing one hotel, wrap it
        list = payload ? (payload.items || payload.rows || []) : [];
        total = Array.isArray(list) ? list.length : 0;
      }

      setHotels(list);
      setTotalRecords(total);

      // If no organizationId was set but hotels returned and include an organization, adopt it for further calls
      if (!organizationId && Array.isArray(list) && list.length > 0 && list[0].organization) {
        const inferredOrg = list[0].organization;
        try {
          localStorage.setItem('selectedOrganization', JSON.stringify({ id: inferredOrg, name: `Org ${inferredOrg}` }));
        } catch (e) {}
        setOrganizationId(inferredOrg);
      }

      // Also fetch city data to map IDs to names (will use updated organizationId if set above)
      await fetchCities(token);
    } catch (error) {
      // Show a clearer message for permission errors (403)
      if (error?.response?.status === 403) {
        setError('Permission denied (403): missing organization parameter or insufficient permissions. If you are developing locally, set selectedOrganization in localStorage or provide a valid token.');
      } else {
        setError("Failed to fetch hotel data. Please try again.");
      }
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (token) => {
    try {
      // If organizationId is present include it, otherwise attempt fetch without it (server may 403)
      let resp;
      if (organizationId) resp = await api.get(`/cities/`, { params: { organization: organizationId } });
      else resp = await api.get(`/cities/`);
      const cpayload = resp.data || {};
      let citiesArr = [];
      if (Array.isArray(cpayload)) citiesArr = cpayload;
      else if (cpayload.results && Array.isArray(cpayload.results)) citiesArr = cpayload.results;
      else if (cpayload.data && Array.isArray(cpayload.data)) citiesArr = cpayload.data;

      // Create a mapping of city IDs to names
      const mapping = {};
      const cityList = [];
      citiesArr.forEach(city => {
        mapping[city.id] = (city.name || '').toLowerCase();
        cityList.push({
          id: city.id,
          name: city.name,
          normalizedName: (city.name || '').toLowerCase()
        });
      });

      setCityMapping(mapping);
      setCities(cityList);
    } catch (error) {
      console.error("Failed to fetch cities:", error);
    }
  };

  // Delete hotel
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");

      await api.delete(`/hotels/${id}/`, { params: { organization: organizationId } });

      // Refresh data after deletion
      await fetchHotels();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete hotel.");
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handlePageChange = (page) => setCurrentPage(page);

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper: normalize strings for comparisons
  const normalize = (s = "") =>
    s
      .toString()
      .toLowerCase()
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const CITY_ALIASES = {
    makkah: ["makkah", "mecca"],
    madinah: ["madina", "madinah", "medina"],
  };

  const nameMatches = (name = "", aliases = []) => {
    const n = normalize(name);
    return aliases.some((a) => n === normalize(a));
  };

  // Build mapping from city id -> display name
  const cityIdToName = (cid) => {
    if (!cid) return null;
    const c = cities.find((x) => x.id === cid);
    if (c && c.name) return c.name;
    if (cityMapping && cityMapping[cid]) return cityMapping[cid];
    return null;
  };

  // Group hotels by city id (use 'unknown' for missing city)
  const hotelsByCityMap = {};
  filteredHotels.forEach((hotel) => {
    const key = hotel.city ?? 'unknown';
    if (!hotelsByCityMap[key]) hotelsByCityMap[key] = [];
    hotelsByCityMap[key].push(hotel);
  });

  // Determine ordering: Makkah first, Madinah second, then other cities alphabetically
  const makkahCityIds = cities.filter(c => nameMatches(c.name, CITY_ALIASES.makkah)).map(c=>c.id);
  const madinahCityIds = cities.filter(c => nameMatches(c.name, CITY_ALIASES.madinah)).map(c=>c.id);

  const orderedCityKeys = [];
  // add makkah ids present in map
  makkahCityIds.forEach(id => { if (hotelsByCityMap[id]) orderedCityKeys.push(id); });
  // add madinah ids
  madinahCityIds.forEach(id => { if (hotelsByCityMap[id] && !orderedCityKeys.includes(id)) orderedCityKeys.push(id); });

  // add remaining city ids
  Object.keys(hotelsByCityMap).forEach(k => {
    if (k === 'unknown') return;
    const num = Number(k);
    if (orderedCityKeys.includes(num)) return;
    orderedCityKeys.push(num);
  });

  // sort remaining keys alphabetically by city name
  orderedCityKeys.sort((a,b)=>{
    const an = cityIdToName(a) || (a === 'unknown' ? 'Unknown' : String(a));
    const bn = cityIdToName(b) || (b === 'unknown' ? 'Unknown' : String(b));
    return an.localeCompare(bn);
  });

  // Update pagination to use filteredHotels
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHotels = filteredHotels.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const renderPaginationItems = () => {
    const items = [];
    items.push(
      <li
        key="prev"
        className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
      >
        <button
          className="page-link"
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>
      </li>
    );
    for (let page = 1; page <= totalPages; page++) {
      items.push(
        <li
          key={page}
          className={`page-item ${currentPage === page ? "active" : ""}`}
        >
          <button className="page-link" onClick={() => handlePageChange(page)}>
            {page}
          </button>
        </li>
      );
    }
    items.push(
      <li
        key="next"
        className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
      >
        <button
          className="page-link"
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </li>
    );
    return items;
  };

  // Create a new file HotelRowSkeleton.js for this component
  const renderSkeletonRows = () => {
    return Array.from({ length: itemsPerPage }).map((_, index) => (
      <HotelRowSkeleton key={index} />
    ));
  };

  const getPricesByRoomType = (prices, startDate, endDate) => {
    if (!prices || prices.length === 0) return {};
    const priceMap = {
      'Only-Room': null,
      'Sharing': null,
      'Double Bed': null,
      'Triple Bed': null,
      'Quad Bed': null,
      'Quint Bed': null
    };

    const normalizeType = (t = '') =>
      t
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();

    const mapToKey = (raw) => {
      const n = normalizeType(raw);
      if (['single', 'onlyroom', 'only-room', 'only_room'].includes(n)) return 'Only-Room';
      if (['sharing', 'share', 'is_sharing_allowed'].includes(n)) return 'Sharing';
      if (['double', 'doublebed', 'double-bed', 'double_bed'].includes(n)) return 'Double Bed';
      if (['triple', 'triplebed', 'triple-bed', 'triple_bed'].includes(n)) return 'Triple Bed';
      if (['quad', 'quadbed', 'quad-bed', 'quad_bed'].includes(n)) return 'Quad Bed';
      if (['quint', 'quintbed', 'quint-bed', 'quint_bed'].includes(n)) return 'Quint Bed';
      // fallback: if raw matches one of the keys after normalization
      const keyMatch = Object.keys(priceMap).find(k => normalizeType(k) === n);
      return keyMatch || null;
    };

    prices.forEach(price => {
      const key = mapToKey(price.room_type);
      if (key && price.start_date === startDate && price.end_date === endDate) {
        priceMap[key] = price;
      }
    });

    return priceMap;
  };

  // Modified renderHotelTable function to handle date ranges with oldest first
  const renderHotelTable = (title, data) => (
    <div className="mb-5">
      <h4 className="text-center fw-bold">{title} Hotels</h4>
      <div className="bg-white rounded shadow-sm">
        <div className="table-responsive">
          <table className="table  mb-0">
            <thead className="table-light">
              <tr>
                <th>Hotel Name</th>
                <th>Category</th>
                <th>Address</th>
                <th>Available</th>
                <th>Price Dates</th>
                <th>Only Room</th>
                <th>Sharing</th>
                <th>Double</th>
                <th>Triple</th>
                <th>Quad</th>
                <th>Quint</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="small">
              {loading ? (
                <>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <HotelRowSkeleton key={idx} />
                  ))}
                </>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center">
                    No hotels found
                  </td>
                </tr>
              ) : (
                data.flatMap((hotel) => {
                  // Determine ownership so resellers cannot edit/delete owner items
                  const hotelOrg = hotel.organization || hotel.organization_id || hotel.owner_organization_id || hotel.org || null;
                  const isOwner = organizationId && hotelOrg && String(hotelOrg) === String(organizationId);
                  
                  const priceGroups = getAllPriceObjects(hotel.prices);

                  // Sort price groups with oldest dates first
                  const sortedGroups = [...priceGroups].sort((a, b) =>
                    new Date(a[0].start_date) - new Date(b[0].start_date)
                  );

                  return sortedGroups.map((group, groupIndex) => {
                    const isOldestGroup = groupIndex === 0;
                    const startDate = group[0]?.start_date;
                    const endDate = group[0]?.end_date;
                    const pricesByType = getPricesByRoomType(hotel.prices, startDate, endDate);

                    return (
                      <tr key={`${hotel.id}-${groupIndex}`}>
                        {groupIndex === 0 ? (
                          <>
                            <td rowSpan={sortedGroups.length}>
                              <div>
                                <strong>{hotel.name}</strong>
                                {/** Show badge only when hotel is resellable and owned by another org */}
                                {(hotel.reselling_allowed === true || hotel.reselling_allowed === "true" || hotel.reselling_allowed === 1 || hotel.reselling_allowed === "1") && String(hotel.organization) !== String(organizationId) && (
                                  <span className="badge bg-success ms-2">Reselling Allowed</span>
                                )}
                                <br />
                                <small className="text-muted">{hotel.distance}M</small>
                              </div>
                            </td>
                            <td rowSpan={sortedGroups.length}>{hotel.category}</td>
                            <td rowSpan={sortedGroups.length} style={{ color: "#1B78CE" }}>
                              {hotel.address}
                            </td>
                            <td rowSpan={sortedGroups.length}>
                              {formatDate(hotel.available_start_date)} -{" "}
                              {formatDate(hotel.available_end_date)}
                            </td>
                          </>
                        ) : null}

                        <td className={`small ${!isOldestGroup ? "text-danger " : ""}`}>
                          {formatDate(startDate)} - {formatDate(endDate)}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Only-Room'] ? 'Yes' : 'No'}
                        </td>

                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {
                            // Use hotel-level `reselling_allowed` to determine whether sharing/reselling is allowed.
                            (hotel.reselling_allowed === true || hotel.reselling_allowed === "true" || hotel.reselling_allowed === 1 || hotel.reselling_allowed === "1")
                              ? 'Allowed'
                              : 'Not allowed'
                          }
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Double Bed'] ? 'Yes' : 'No'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Triple Bed'] ? 'Yes' : 'No'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Quad Bed'] ? 'Yes' : 'No'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Quint Bed'] ? 'Yes' : 'No'}
                        </td>


                        {groupIndex === 0 ? (
                          <td rowSpan={sortedGroups.length}>
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="link"
                                className="text-decoration-none p-0"
                              >
                                <Gear size={18} />
                              </Dropdown.Toggle>
                                <Dropdown.Menu>
                                {isOwner ? (
                                  <>
                                    <Dropdown.Item as={Link} to={`/hotels/EditDetails/${hotel.id}`}>
                                      Edit Hotel Details
                                    </Dropdown.Item>
                                    <Dropdown.Item as={Link} to={`/hotels/EditPrices/${hotel.id}`}>
                                      Edit Hotel Price
                                    </Dropdown.Item>
                                    <Dropdown.Item className="text-danger" onClick={() => handleDelete(hotel.id)}>
                                      Delete
                                    </Dropdown.Item>
                                  </>
                                ) : (
                                  <>
                                    <Dropdown.Item disabled title="Not allowed to edit reseller item">Edit Hotel Details</Dropdown.Item>
                                    <Dropdown.Item disabled title="Not allowed to edit reseller item">Edit Hotel Price</Dropdown.Item>
                                    <Dropdown.Item disabled title="Not allowed to edit reseller item">Delete</Dropdown.Item>
                                  </>
                                )}
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        ) : null}
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Helper function to group prices by date ranges (oldest first)
  const getAllPriceObjects = (prices) => {
    if (!prices || prices.length === 0) return [];

    // Group prices by their date ranges
    const groupedByDate = prices.reduce((acc, price) => {
      const dateKey = `${price.start_date}-${price.end_date}`;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(price);
      return acc;
    }, {});

    // Convert to array of grouped prices sorted by date (oldest first)
    return Object.values(groupedByDate).sort((a, b) =>
      new Date(a[0].start_date) - new Date(b[0].start_date)
    );
  };

  // Function to get city name from ID
  const getCityName = (cityId) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : `City (ID: ${cityId})`;
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <HotelsTabs />
              {/* Navigation Tabs */}
              <div className="row ">
                {/* Header Controls */}
                <div className="row mb-4 align-items-center justify-content-end">
                  <div className="col-lg-9 col-md-8 d-flex align-items-center flex-wrap gap-2 justify-content-md-end">
                    {/* Search Bar */}
                    <div className="input-group" style={{ maxWidth: "300px" }}>
                      <span className="input-group-text">
                        <Search />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search name, address, etc"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Buttons */}
                    <Link
                      to="/hotels/add-hotels"
                      className="btn text-white"
                      style={{ background: "#1B78CE" }}
                    >
                      Add Hotels
                    </Link>
                    <button
                      className="btn text-white"
                      style={{ background: "#1B78CE" }}
                    >
                      Export
                    </button>
                  </div>
                </div>

                {/* Error message for delete */}
                {deleteError && (
                  <div className="alert alert-danger mb-3">{deleteError}</div>
                )}

                {/* Table: render one table per city in orderedCityKeys */}
                {orderedCityKeys.map((cityKey) => {
                  const hotelsForCity = hotelsByCityMap[cityKey] || [];
                  const title = cityIdToName(cityKey) || `City (ID: ${cityKey})`;
                  return (
                    <div key={String(cityKey)} className="mb-5">
                      {renderHotelTable(title, hotelsForCity)}
                    </div>
                  );
                })}

                {/* Unknown / ungrouped hotels */}
                {hotelsByCityMap['unknown'] && hotelsByCityMap['unknown'].length > 0 && (
                  <div className="mb-5">
                    {renderHotelTable('Other Cities', hotelsByCityMap['unknown'])}
                  </div>
                )}

                <div className="mt-3">
                  <AdminFooter />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hotels;