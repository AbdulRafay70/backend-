import React, { useState, useEffect, useRef } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Search } from "lucide-react";
import { Gear } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import AdminFooter from "../../components/AdminFooter";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";

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

  const [makkahHotels, setMakkahHotels] = useState([]);
  const [madinahHotels, setMadinahHotels] = useState([]);

  // Refs for the tables
  const makkahTableRef = useRef(null);
  const madinahTableRef = useRef(null);

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
      const token = localStorage.getItem("agentAccessToken");
      if (!token) throw new Error("No access token found");

      const decoded = jwtDecode(token);
      const userId = decoded.user_id;
      if (!userId) throw new Error("User ID not found in token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      // 1. Fetch user details
      const userResponse = await axios.get(
        `http://127.0.0.1:8000/api/users/${userId}/`,
        config
      );

      // 2. Get organization ID(s) - handles both single and multiple orgs
      const orgDetails = userResponse.data.organization_details || [];
      const organizationIds = orgDetails.map((org) => org.id);

      localStorage.setItem(
        "agentOrganization",
        JSON.stringify({
          ids: organizationIds,
          names: orgDetails.map((org) => org.name),
          timestamp: new Date().getTime(),
        })
      );

      if (organizationIds.length === 0) {
        throw new Error("User has no organizations assigned");
      }

      // 3. Fetch hotels - support paginated responses and annotate with org info
      let allHotels = [];

      const normalize = (resp) => {
        if (!resp) return [];
        const d = resp.data;
        if (!d) return [];
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.results)) return d.results;
        if (Array.isArray(d?.data)) return d.data;
        return [];
      };

      if (organizationIds.length === 1) {
        // Single organization - simple request
        const response = await axios.get(`http://127.0.0.1:8000/api/hotels/`, {
          ...config,
          params: {
            organization: organizationIds[0],
          },
        });
        const orgId = organizationIds[0];
        const orgName = orgDetails.find((o) => o.id === orgId)?.name || null;
        allHotels = normalize(response).map((h) => ({ ...h, orgId, orgName }));
      } else {
        // Multiple organizations - fetch in parallel
        const requests = organizationIds.map((orgId) =>
          axios.get(`http://127.0.0.1:8000/api/hotels/`, {
            ...config,
            params: { organization: orgId },
          })
        );
        const responses = await Promise.all(requests);
        allHotels = responses.flatMap((response, idx) => {
          const orgId = organizationIds[idx];
          const orgName = orgDetails.find((o) => o.id === orgId)?.name || null;
          return normalize(response).map((h) => ({ ...h, orgId, orgName }));
        });
      }

      const normalizeCity = (city) => city?.toString().trim().toLowerCase() || "";

      // Normalize price objects to ensure `price` exists (fallback to `selling_price`)
      const normalizedAll = (allHotels || []).map(h => ({
        ...h,
        prices: Array.isArray(h.prices) ? h.prices.map(p => ({ ...p, price: (p.price ?? p.selling_price ?? ''), selling_price: (p.selling_price ?? p.price ?? null) })) : h.prices,
        orgName: h.orgName || h.organization_name || h.orgName || h.org || h.orgName || h.orgName
      }));

      // Deduplicate hotels by id: if same hotel appears for multiple orgs, merge org names
      const byId = {};
      normalizedAll.forEach(h => {
        const id = String(h.id);
        const orgName = h.orgName || h.orgName || h.orgId || h.org || h.organization || null;
        if (!byId[id]) {
          byId[id] = { ...h, orgNames: orgName ? [String(orgName)] : [] };
        } else {
          // merge org names
          const existing = byId[id];
          if (orgName && !existing.orgNames.includes(String(orgName))) existing.orgNames.push(String(orgName));
          // prefer to keep earliest available fields (address, prices etc.)
          if ((!existing.address || existing.address === '') && h.address) existing.address = h.address;
          if ((!existing.prices || existing.prices.length === 0) && (h.prices || []).length > 0) existing.prices = h.prices;
        }
      });

      const uniqueHotels = Object.values(byId).map(h => ({ ...h, orgName: (h.orgNames || []).join(', ') }));

      const makkah = uniqueHotels.filter((hotel) => normalizeCity(hotel.city) === "makkah");
      const madinah = uniqueHotels.filter((hotel) => normalizeCity(hotel.city) === "madina");

      setMakkahHotels(makkah);
      setMadinahHotels(madinah);
      setHotels(uniqueHotels);
      setTotalRecords(allHotels.length);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      setError(error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handlePageChange = (page) => setCurrentPage(page);

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHotels = filteredHotels.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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

    prices.forEach(price => {
      if (!price) return;
      // Only consider entries for the requested date range
      if (startDate && endDate && (price.start_date !== startDate || price.end_date !== endDate)) return;

      const rt = String(price.room_type || '').toLowerCase();

      let key = null;
      if (rt === 'single' || rt === 'only-room' || rt === 'only' || rt === 'single bed') key = 'Only-Room';
      else if (rt === 'sharing' || price.is_sharing_allowed) key = 'Sharing';
      else if (rt.includes('double')) key = 'Double Bed';
      else if (rt.includes('triple')) key = 'Triple Bed';
      else if (rt.includes('quad')) key = 'Quad Bed';
      else if (rt.includes('quint')) key = 'Quint Bed';

      if (!key) {
        // Fallbacks: some APIs use short names like 'double','triple' etc.
        if (rt === 'double') key = 'Double Bed';
        if (rt === 'triple') key = 'Triple Bed';
        if (rt === 'quad') key = 'Quad Bed';
        if (rt === 'quint') key = 'Quint Bed';
      }

      if (key && priceMap[key] == null) {
        priceMap[key] = price;
      }
    });

    return priceMap;
  };

  // Function to export hotels as PDF
  const exportHotelsToPDF = async () => {
    try {
      toast.info("Generating PDF...", { autoClose: 2000 });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      // Add title to the PDF
      pdf.setFontSize(18);
      pdf.text("Hotels List", pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });
      
      let currentY = 30;
      
      // Process Makkah hotels table
      if (makkahHotels.length > 0) {
        pdf.setFontSize(16);
        // pdf.text("Makkah Hotels", margin, currentY);
        currentY += 10;
        
        const makkahCanvas = await html2canvas(makkahTableRef.current, {
          scale: 1.5,
          useCORS: true,
          logging: false,
        });
        
        const makkahImgData = makkahCanvas.toDataURL('image/jpeg', 0.9);
        const imgWidth = contentWidth;
        const imgHeight = (makkahCanvas.height * imgWidth) / makkahCanvas.width;
        
        // Add new page if needed
        if (currentY + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.addImage(makkahImgData, 'JPEG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 15;
      }
      
      // Process Madinah hotels table
      if (madinahHotels.length > 0) {
        // Add new page if needed
        if (currentY > pdf.internal.pageSize.getHeight() - 50) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.setFontSize(16);
        // pdf.text("Madinah Hotels", margin, currentY);
        currentY += 10;
        
        const madinahCanvas = await html2canvas(madinahTableRef.current, {
          scale: 1.5,
          useCORS: true,
          logging: false,
        });
        
        const madinahImgData = madinahCanvas.toDataURL('image/jpeg', 0.9);
        const imgWidth = contentWidth;
        const imgHeight = (madinahCanvas.height * imgWidth) / madinahCanvas.width;
        
        // Add new page if needed
        if (currentY + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.addImage(madinahImgData, 'JPEG', margin, currentY, imgWidth, imgHeight);
      }
      
      // Save the PDF
      pdf.save(`hotels-list-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  // Modified renderHotelTable function to handle date ranges with oldest first
  const renderHotelTable = (title, data, tableRef) => (
    <div className="mb-5" ref={tableRef}>
      <h4 className="text-center fw-bold">{title} Hotels</h4>
      <div className="bg-white rounded shadow-sm">
        <div className="table-responsive scrollable">
          <table className="table mb-0 table-sm align-middle" style={{ fontSize: 13 }}>
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
            </colgroup>
            <thead className="table-light">
              <tr>
                <th>Hotel Name</th>
                <th>City</th>
                <th>Address</th>
                <th>Category</th>
                <th>Distance (m)</th>
                <th>Walk Time (min)</th>
                <th>Price Dates</th>
                <th>Sharing Price</th>
                <th>Quint Price</th>
                <th>Quad Price</th>
                <th>Triple Price</th>
                <th>Double Price</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Availability</th>
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
                  <td colSpan="15" className="text-center">
                    No hotels found
                  </td>
                </tr>
              ) : (
                data.flatMap((hotel) => {
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
                      <tr key={`${String(hotel.id)}-${String(hotel.orgId ?? hotel.organization ?? hotel.org ?? 'org')}-${String(groupIndex)}-${String(group[0]?.start_date ?? '')}`}>
                        {groupIndex === 0 ? (
                          <>
                            <td rowSpan={sortedGroups.length}>
                              <strong className="hotel-name" style={{ display: 'inline-block', maxWidth: '100%' }}>{hotel.name}</strong>
                            </td>
                            <td rowSpan={sortedGroups.length}>
                              {hotel.city_name ? hotel.city_name : (hotel.city || 'N/A')}
                            </td>
                            <td rowSpan={sortedGroups.length} style={{ color: "#1B78CE" }}>
                              <div style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hotel.address}</div>
                            </td>
                            <td rowSpan={sortedGroups.length}>{hotel.category}</td>
                            <td rowSpan={sortedGroups.length}>
                              {hotel.distance !== undefined && hotel.distance !== null && hotel.distance !== "" ? (
                                <span>{Number(hotel.distance).toLocaleString()} m</span>
                              ) : (
                                "N/A"
                              )}
                            </td>
                            <td rowSpan={sortedGroups.length}>
                              {(hotel.walking_time !== undefined && hotel.walking_time !== null && hotel.walking_time !== "") ? (
                                <span>{String(hotel.walking_time)} min</span>
                              ) : (
                                "N/A"
                              )}
                            </td>
                          </>
                        ) : null}

                        <td className={`small ${!isOldestGroup ? "text-danger " : ""}`}>
                          {formatDate(startDate)} - {formatDate(endDate)}
                        </td>

                        <td className={!isOldestGroup ? "text-danger " : ""} style={{ fontWeight: 600 }}>
                          {pricesByType['Sharing'] ? `PKR ${pricesByType['Sharing'].price}` : 'N/A'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""} style={{ fontWeight: 600 }}>
                          {pricesByType['Quint Bed'] ? `PKR ${pricesByType['Quint Bed'].price}` : 'N/A'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""} style={{ fontWeight: 600 }}>
                          {pricesByType['Quad Bed'] ? `PKR ${pricesByType['Quad Bed'].price}` : 'N/A'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""} style={{ fontWeight: 600 }}>
                          {pricesByType['Triple Bed'] ? `PKR ${pricesByType['Triple Bed'].price}` : 'N/A'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""} style={{ fontWeight: 600 }}>
                          {pricesByType['Double Bed'] ? `PKR ${pricesByType['Double Bed'].price}` : 'N/A'}
                        </td>

                        {groupIndex === 0 ? (
                          <>
                            <td rowSpan={sortedGroups.length} style={{ whiteSpace: 'nowrap' }}>
                              {hotel.contact_number ? (
                                <span>
                                  {hotel.contact_number}
                                </span>
                              ) : "N/A"}
                            </td>
                            <td rowSpan={sortedGroups.length}>
                              {hotel.is_active ? (
                                <span className="badge bg-success" style={{ fontSize: 12, padding: '6px 8px' }}>Active</span>
                              ) : (
                                <span className="badge bg-danger" style={{ fontSize: 12, padding: '6px 8px' }}>Inactive</span>
                              )}
                            </td>
                            <td rowSpan={sortedGroups.length}>
                              {hotel.available_start_date && hotel.available_end_date ? (
                                <small>
                                  {formatDate(hotel.available_start_date)} - {formatDate(hotel.available_end_date)}
                                </small>
                              ) : (
                                <span>Not Set</span>
                              )}
                            </td>
                          </>
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

  return (
    <div
      className=""
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <style>{`
  .shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`}</style>
      <style>{`
  /* Scrollable table with sticky header */
  .table-responsive.scrollable {
    max-height: 60vh; /* adjust as needed */
    overflow: auto;
  }

  .table-responsive.scrollable table thead th {
    position: sticky;
    top: 0;
    z-index: 3;
    background: #ffffff; /* ensure header has background */
    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  }

  /* Make first column stand out (optional) */
  .table td, .table th {
    vertical-align: middle;
    white-space: nowrap;
    text-align: center; /* center all cells by default */
  }

  /* Allow long addresses to be truncated inside cells */
  .hotel-name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
`}</style>
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10 ps-lg-4">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4">
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
                  <div className="d-flex">
                    <button className="btn" id="btn" onClick={exportHotelsToPDF}>Export</button>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="alert alert-danger mb-4">
                  {error}
                </div>
              )}

              {/* Page title */}
              <div className="mb-3">
                <h2 className="mb-1" style={{ fontWeight: 600, color: "#2c3e50" }}>Available Hotels</h2>
                <p className="text-muted mb-0">Manage and review hotel pricing and availability</p>
              </div>

              {/* Statistics Cards (Total, Active, Cities, Inactive) */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="card shadow-sm border-0">
                    <div className="card-body d-flex align-items-center">
                      <div className="p-2 rounded" style={{ backgroundColor: "#e3f2fd" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" fill="#1976d2"/></svg>
                      </div>
                      <div className="ms-3">
                        <small className="text-muted">Total Hotels</small>
                        <div className="h5 mb-0">{hotels.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card shadow-sm border-0">
                    <div className="card-body d-flex align-items-center">
                      <div className="p-2 rounded" style={{ backgroundColor: "#e8f5e9" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#388e3c" strokeWidth="2"/></svg>
                      </div>
                      <div className="ms-3">
                        <small className="text-muted">Active Hotels</small>
                        <div className="h5 mb-0">{hotels.filter(h => h.is_active).length}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card shadow-sm border-0">
                    <div className="card-body d-flex align-items-center">
                      <div className="p-2 rounded" style={{ backgroundColor: "#fff3e0" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#f57c00"/></svg>
                      </div>
                      <div className="ms-3">
                        <small className="text-muted">Cities</small>
                        <div className="h5 mb-0">{new Set(hotels.map(h => String(h.city).trim())).size}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card shadow-sm border-0">
                    <div className="card-body d-flex align-items-center">
                      <div className="p-2 rounded" style={{ backgroundColor: "#fce4ec" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2v20" stroke="#c2185b" strokeWidth="2"/></svg>
                      </div>
                      <div className="ms-3">
                        <small className="text-muted">Inactive</small>
                        <div className="h5 mb-0">{hotels.filter(h => !h.is_active).length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unified Hotels Table */}
              {renderHotelTable("Available Hotels", hotels, null)}

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