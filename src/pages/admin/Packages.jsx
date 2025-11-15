import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

const tabs = [
  { name: "Umrah Package", path: "/packages" },
  { name: "Visa and others", path: "/packages/visa-and-other" },
];

const ShimmerCard = () => {
  return (
    <div className="shimmer-card">
      <div className="row p-3 rounded-4 mb-4 border">
        {/* Left Section */}
        <div className="col-lg-8 col-md-12 mb-4">
          <div className="card border-0 h-100">
            <div className="card-body">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="shimmer shimmer-title"></div>
                <div className="shimmer shimmer-logo"></div>
              </div>

              {/* Hotel Info */}
              <div className="row mb-4">
                <div className="col-md-9">
                  <div className="row">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="col-6 col-sm-4 col-md-3 mb-3">
                        <div className="shimmer shimmer-label mb-2"></div>
                        <div className="shimmer shimmer-text"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-md-3 text-center">
                  <div className="shimmer shimmer-seats mb-2 mx-auto"></div>
                  <div className="shimmer shimmer-seats-text mx-auto"></div>
                </div>
              </div>

              {/* Pricing */}
              <div className="row mb-3 text-center">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="col-6 col-sm-4 col-md-2 mb-3">
                    <div className="shimmer shimmer-price-label mb-1 mx-auto"></div>
                    <div className="shimmer shimmer-price mb-1 mx-auto"></div>
                    <div className="shimmer shimmer-price-subtext mx-auto"></div>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="d-flex flex-wrap gap-3">
                <div className="shimmer shimmer-button flex-fill"></div>
                <div className="shimmer shimmer-button flex-fill"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="col-lg-4 col-md-12">
          <div className="card border-0 rounded-4 h-100" style={{ background: "#F7F8F8" }}>
            <div className="m-3 ps-3 pt-2 pb-2">
              <div className="shimmer shimmer-right-title mb-3"></div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="mb-2">
                  <div className="shimmer shimmer-right-label mb-1"></div>
                  <div className="shimmer shimmer-right-text"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShimmerLoader = ({ count = 3 }) => {
  return (
    <div className="shimmer-container">
      {Array.from({ length: count }).map((_, index) => (
        <ShimmerCard key={index} />
      ))}
    </div>
  );
};


const UmrahPackage = () => {
  const navigate = useNavigate();

  const [packageData, setPackageData] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    active: false,
    inactive: false,
    partialPayments: false,
    serviceCharges: false,
    includePast: false
  });

  const token = localStorage.getItem("accessToken");
  const selectedOrganization = JSON.parse(
    localStorage.getItem("selectedOrganization")
  );
  const organizationId = selectedOrganization?.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // If no organization is selected, fetch user's organizations and use the first one
        let orgId = organizationId;
        if (!orgId) {
          try {
            // Decode JWT token to get user ID
            const decoded = jwtDecode(token);
            const userId = decoded.user_id || decoded.id;

            const userRes = await axios.get(`https://api.saer.pk/api/users/${userId}/`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            const userOrgs = userRes.data.organization_details || [];
            if (userOrgs.length > 0) {
              orgId = userOrgs[0].id;
              // Optionally set it in localStorage for future use
              localStorage.setItem("selectedOrganization", JSON.stringify({ id: orgId, name: userOrgs[0].name }));
            }
          } catch (err) {
            console.error("Failed to fetch user organizations", err);
          }
        }

        if (!orgId) {
          toast.error("No organization found. Please contact administrator.");
          setLoading(false);
          return;
        }

        const [packageRes, hotelsRes, ticketsRes, airlinesRes] =
          await Promise.all([
            axios.get("https://api.saer.pk/api/umrah-packages/", {
              params: { organization: orgId, include_past: filters.includePast ? true : undefined },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
            axios.get("https://api.saer.pk/api/hotels/", {
              params: { organization: orgId },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
            axios.get("https://api.saer.pk/api/tickets/", {
              params: { organization: orgId },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
            axios.get("https://api.saer.pk/api/airlines/", {
              params: { organization: orgId },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
          ]);

        // Normalize package response which may be either an array or { message, data }
        let packagesPayload = packageRes.data;
        if (packagesPayload && packagesPayload.data) packagesPayload = packagesPayload.data;
        const packages = Array.isArray(packagesPayload) ? packagesPayload : (packagesPayload ? [packagesPayload] : []);

        // API now handles organization filtering server-side including linked organizations
        setPackageData(packages);
        setFilteredPackages(packages);
        setHotels(hotelsRes.data);
        setTickets(ticketsRes.data);
        setAirlines(airlinesRes.data);
      } catch (err) {
        console.error("API Error", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, organizationId, filters.includePast]);

  useEffect(() => {
    let filtered = packageData;

    if (filters.active || filters.inactive) {
      filtered = filtered.filter(pkg =>
        (filters.active && pkg.is_active) ||
        (filters.inactive && !pkg.is_active)
      );
    }

    if (filters.partialPayments) {
      filtered = filtered.filter(pkg => pkg.is_partial_payment_active);
    }

    // Hide packages from other organizations unless owner explicitly allowed reselling
    filtered = filtered.filter(pkg => {
      const pkgOrg = pkg.organization || pkg.organization_id || pkg.inventory_owner_organization_id || null;
      const isExternal = pkgOrg && String(pkgOrg) !== String(organizationId);
      if (isExternal && !pkg.reselling_allowed) return false;
      return true;
    });

    if (filters.serviceCharges) {
      filtered = filtered.filter(pkg => pkg.is_service_charge_active);
    }

    setFilteredPackages(filtered);
  }, [filters, packageData]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const d = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const t = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${d} ${t}`;
  };

  const handleFilterChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm("Are you sure you want to delete this package?"))
      return;

    try {
      await axios.delete(
        `https://api.saer.pk/api/umrah-packages/${packageId}/`,
        {
          params: { organization: organizationId },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setPackageData((prev) => prev.filter((pkg) => pkg.id !== packageId));
      toast.success("Package deleted successfully!");
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package.");
    }
  };

  if (loading) {
    return (
      <>
        {/* Keep all the header and navigation elements */}
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
                <div className="px-3 mt-3 px-lg-4">
                  {/* Navigation Tabs */}
                  <div className="row ">
                    <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                      <nav className="nav flex-wrap gap-2">
                        {tabs.map((tab, index) => (
                          <NavLink
                            key={index}
                            to={tab.path}
                            className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Umrah Package"
                              ? "text-primary fw-semibold"
                              : "text-muted"
                              }`}
                            style={{ backgroundColor: "transparent" }}
                          >
                            {tab.name}
                          </NavLink>
                        ))}
                      </nav>
                      <div className="d-flex gap-2 mt-2 mt-md-0">
                        <div className="btn text-white" style={{ background: "#1B78CE" }}>
                          Add Package
                        </div>
                        <div className="btn text-white" style={{ background: "#1B78CE" }}>
                          Export Package
                        </div>
                      </div>
                    </div>


                    <div className="d-flex flex-wrap gap-3 mb-3">
                      {/* Filter checkboxes */}
                      {['active', 'inactive', 'partialPayments', 'serviceCharges'].map((filter) => (
                        <div key={filter} className="form-group d-flex align-items-center">
                          <div className="form-check-input me-2 shimmer" style={{ width: '16px', height: '16px' }}></div>
                          <div className="shimmer shimmer-label" style={{ width: '120px', height: '16px' }}></div>
                        </div>
                      ))}
                    </div>


                    {/* Shimmer packages */}
                    <div className="row">
                      <div className="col-12">
                        <ShimmerLoader count={3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>
        {`
        /* Shimmer Animation */
@keyframes shimmer {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

.shimmer-container {
  padding: 1rem;
}

.shimmer-card {
  margin-bottom: 2rem;
}

.shimmer {
  animation-duration: 1.5s;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
  animation-name: shimmer;
  animation-timing-function: linear;
  background: #f6f7f8;
  background: linear-gradient(to right, #f6f6f6 8%, #e0e0e0 18%, #f6f6f6 33%);
  background-size: 800px 104px;
  border-radius: 4px;
}

/* Specific shimmer elements */
.shimmer-title {
  width: 200px;
  height: 30px;
}

.shimmer-logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.shimmer-label {
  width: 80px;
  height: 14px;
}

.shimmer-text {
  width: 120px;
  height: 18px;
}

.shimmer-seats {
  width: 60px;
  height: 30px;
}

.shimmer-seats-text {
  width: 80px;
  height: 20px;
}

.shimmer-price-label {
  width: 60px;
  height: 16px;
}

.shimmer-price {
  width: 90px;
  height: 24px;
}

.shimmer-price-subtext {
  width: 50px;
  height: 12px;
}

.shimmer-button {
  height: 40px;
  border-radius: 20px;
}

.shimmer-right-title {
  width: 150px;
  height: 24px;
}

.shimmer-right-label {
  width: 80px;
  height: 14px;
}

.shimmer-right-text {
  width: 180px;
  height: 16px;
}
      `}
      </style>
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="container-fluid p-0">
          <div className="row g-0">
            {/* Sidebar */}
            <div className="col-12 col-lg-2">
              <Sidebar />
            </div>
            {/* Main Content */}
            <div className="col-12 col-lg-10">
              <div className="container">
                <Header />
                <div className="px-3 my-3 px-lg-4">
                  {/* Navigation Tabs */}
                  <div className="row ">
                    <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                      {/* Navigation Tabs */}
                      <nav className="nav flex-wrap gap-2">
                        {tabs.map((tab, index) => (
                          <NavLink
                            key={index}
                            to={tab.path}
                            className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Umrah Package"
                              ? "text-primary fw-semibold"
                              : "text-muted"
                              }`}
                            style={{ backgroundColor: "transparent" }}
                          >
                            {tab.name}
                          </NavLink>
                        ))}
                      </nav>

                      {/* Action Buttons */}
                      <div className="d-flex gap-2 mt-2 mt-md-0">
                        <Link
                          to="/packages/add-packages"
                          className="btn text-white"
                          style={{ background: "#1B78CE" }}
                        >
                          Add Package
                        </Link>
                        <Link
                          to=""
                          className="btn text-white"
                          style={{ background: "#1B78CE" }}
                        >
                          Export Package
                        </Link>
                      </div>
                    </div>


                    <div className="d-flex flex-wrap gap-3 mb-3">
                      <div className="form-group d-flex align-items-center">
                        <input
                          type="checkbox"
                          checked={filters.active}
                          onChange={() => handleFilterChange('active')}
                          className="form-check-input me-2"
                        />
                        <label className="form-label mb-0">Package Active</label>
                      </div>
                      <div className="form-group d-flex align-items-center">
                        <input
                          type="checkbox"
                          checked={filters.inactive}
                          onChange={() => handleFilterChange('inactive')}
                          className="form-check-input me-2"
                        />
                        <label className="form-label mb-0">Package Inactive</label>
                      </div>
                      <div className="form-group d-flex align-items-center">
                        <input
                          type="checkbox"
                          checked={filters.partialPayments}
                          onChange={() => handleFilterChange('partialPayments')}
                          className="form-check-input me-2"
                        />
                        <label className="form-label mb-0">Partial Payments</label>
                      </div>
                      <div className="form-group d-flex align-items-center">
                        <input
                          type="checkbox"
                          checked={filters.serviceCharges}
                          onChange={() => handleFilterChange('serviceCharges')}
                          className="form-check-input me-2"
                        />
                        <label className="form-label mb-0">Service Charges</label>
                      </div>
                      <div className="form-group d-flex align-items-center">
                        <input
                          type="checkbox"
                          checked={filters.includePast}
                          onChange={() => handleFilterChange('includePast')}
                          className="form-check-input me-2"
                        />
                        <label className="form-label mb-0">Include Past Packages</label>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-12">
                        <div className="">
                          <ToastContainer position="top-right" autoClose={3000} theme="colored" />
                          {filteredPackages.length === 0 ? (
                            <div className="text-center py-5">
                              <h4>No packages found matching your criteria</h4>
                              <p>Try adjusting your filters or add a new package</p>
                            </div>
                          ) : (
                            filteredPackages.map((pkg, index) => {
                              const hotelDetails = pkg?.hotel_details?.map((hotelEntry) => {
                                const hotelInfo = hotels.find(
                                  (h) => h.id === hotelEntry.hotel_info?.id
                                );
                                return {
                                  city: hotelInfo?.city || "N/A",
                                  name: hotelInfo?.name || "N/A",
                                  nights: hotelEntry?.number_of_nights || 0,
                                  prices: hotelInfo?.prices?.[0] || {},
                                  // include hotel-level reselling flag for display
                                  reselling_allowed: hotelInfo?.reselling_allowed || false,
                                };
                              });

                              const ticketInfo = pkg?.ticket_details?.[0]?.ticket_info;
                              const tripDetails = ticketInfo?.trip_details || [];

                              // Calculate sharing hotel cost
                              const sharingHotelTotal = pkg?.hotel_details?.reduce((sum, hotel) => {
                                const perNight = hotel.sharing_bed_price || 0;
                                const nights = hotel.number_of_nights || 0;
                                return sum + perNight * nights;
                              }, 0);

                              // Calculate total sharing
                              const sharingPrices =
                                (pkg.adault_visa_price || 0) +
                                (pkg.transport_price || 0) +
                                (ticketInfo?.adult_price || 0) +
                                (pkg.food_price || 0) +
                                (pkg.makkah_ziyarat_price || 0) +
                                (pkg.madinah_ziyarat_price || 0);

                              const totalSharing = sharingHotelTotal + sharingPrices;

                              // Calculate total QUINT price
                              const quintPrices =
                                (pkg.adault_visa_price || 0) +
                                (pkg.transport_price || 0) +
                                (ticketInfo?.adult_price || 0) +
                                (pkg.food_price || 0) +
                                (pkg.makkah_ziyarat_price || 0) +
                                (pkg.madinah_ziyarat_price || 0);

                              const quintHotels = pkg?.hotel_details?.reduce((sum, hotel) => {
                                const perNight =
                                  hotel.quaint_bed_price || hotel.quaint_bed_price || 0;
                                const nights = hotel.number_of_nights || 0;
                                return sum + perNight * nights;
                              }, 0);

                              const totalQuint = quintPrices + quintHotels;

                              // Calculate total QUAD price
                              const quadPrices =
                                (pkg.adault_visa_price || 0) +
                                (pkg.transport_price || 0) +
                                (ticketInfo?.adult_price || 0) +
                                (pkg.food_price || 0) +
                                (pkg.makkah_ziyarat_price || 0) +
                                (pkg.madinah_ziyarat_price || 0);

                              const quadHotels = pkg?.hotel_details?.reduce((sum, hotel) => {
                                const perNight = hotel.quad_bed_price || 0;
                                const nights = hotel.number_of_nights || 0;
                                return sum + perNight * nights;
                              }, 0);

                              const totalQuad = quadPrices + quadHotels;

                              // TRIPLE BED calculation
                              const triplePrices =
                                (pkg.adault_visa_price || 0) +
                                (pkg.transport_price || 0) +
                                (ticketInfo?.adult_price || 0) +
                                (pkg.food_price || 0) +
                                (pkg.makkah_ziyarat_price || 0) +
                                (pkg.madinah_ziyarat_price || 0);

                              const tripleHotels = pkg?.hotel_details?.reduce((sum, hotel) => {
                                const perNight = hotel.triple_bed_price || 0;
                                const nights = hotel.number_of_nights || 0;
                                return sum + perNight * nights;
                              }, 0);

                              const totalTriple = triplePrices + tripleHotels;

                              // DOUBLE BED calculation
                              const doublePrices =
                                (pkg.adault_visa_price || 0) +
                                (pkg.transport_price || 0) +
                                (ticketInfo?.adult_price || 0) +
                                (pkg.food_price || 0) +
                                (pkg.makkah_ziyarat_price || 0) +
                                (pkg.madinah_ziyarat_price || 0);

                              const doubleHotels = pkg?.hotel_details?.reduce((sum, hotel) => {
                                const perNight = hotel.double_bed_price || 0;
                                const nights = hotel.number_of_nights || 0;
                                return sum + perNight * nights;
                              }, 0);

                              const totalDouble = doublePrices + doubleHotels;

                              const infantPrices =
                                (ticketInfo?.infant_price || 0)

                              const infantHotels = pkg?.infant_visa_price;

                              const totalinfant = infantPrices + infantHotels;

                              const childPrices =
                                (pkg?.adault_visa_price || 0) -
                                (pkg?.child_visa_price || 0);

                              const flightFrom = tripDetails[0];
                              const flightTo = tripDetails[1];
                              const airline = airlines.find((a) => a.id === ticketInfo?.airline);

                              const matchedAirline = airlines.find(
                                (a) => a.code?.toLowerCase() === airline?.code?.toLowerCase()
                              );

                              return (
                                <div key={index} className="row p-3 rounded-4 mb-4 small border">
                                  <div className="col-lg-8 col-md-12 mb-4">
                                    <div className="card border-0 h-100" >
                                      <div className="">
                                        <div className="d-flex justify-content-between align-items-center">
                                          <div>
                                            <h4 className="card-title mb-1 fw-bold">
                                              {pkg?.title || "Umrah Package"}
                                              
                                            </h4>
                                            {/* {!pkg.is_active && (
                                        <span className="badge bg-danger">Inactive</span>
                                      )}
                                      {pkg.is_partial_payment_active && (
                                        <span className="badge bg-warning text-dark ms-1">Partial Payment</span>
                                      )}
                                      {pkg.is_service_charge_active && (
                                        <span className="badge bg-info text-dark ms-1">Service Charge</span>
                                      )} */}
                                          </div>
                                          {matchedAirline?.logo && (
                                            <img
                                              src={matchedAirline.logo}
                                              alt={matchedAirline.code}
                                              style={{
                                                height: "80px",
                                                width: "80px",
                                                objectFit: "contain",
                                              }}
                                            />
                                          )}
                                        </div>
                                        {/* Hotel Info Row */}
                                        <div className="row mb-4">
                                          <div className="col-md-9">
                                            <div className="row text-muted small">
                                              <div className="col-6 col-sm-4 col-md-3 mb-2">
                                                <p className="fw-bold mb-1 small">MAKKAH HOTEL:</p>
                                                <div>{hotelDetails?.[0]?.name || "N/A"}</div>
                                              </div>
                                              <div className="col-6 col-sm-4 col-md-3 mb-2">
                                                <p className="fw-bold mb-1 small">MADINA HOTEL:</p>
                                                <div>{hotelDetails?.[1]?.name || "N/A"}</div>
                                              </div>
                                              <div className="col-6 col-sm-4 col-md-2 mb-2">
                                                <p className="fw-bold mb-1 small">ZAYARAT:</p>
                                                <div>
                                                  {pkg?.makkah_ziyarat_price ||
                                                    pkg?.madinah_ziyarat_price
                                                    ? "YES"
                                                    : "N/A"}
                                                </div>
                                              </div>
                                              <div className="col-6 col-sm-4 col-md-2 mb-2">
                                                <p className="fw-bold mb-1 small">FOOD:</p>
                                                <div>
                                                  {pkg?.food_price > 0 ? "INCLUDED" : "N/A"}
                                                </div>
                                              </div>
                                              <div className="col-6 col-sm-4 col-md-2 mb-2">
                                                <p className="fw-bold mb-1 small">RULES:</p>
                                                <div>{pkg?.rules || "N/A"}</div>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="col-md-3 text-center d-flex flex-column justify-content-center align-items-center">
                                            <h3 className="mb-1">{pkg?.total_seats || "0"}</h3>
                                            <h5 className="text-danger">Seats Left</h5>
                                          </div>
                                        </div>

                                        {/* Pricing Section */}
                                        <div className="row mb-3 text-center text-dark">
                                          {/* {pkg.is_sharing_active && ( */}
                                          <div className="col-6 col-sm-4 col-md-2 mb-3">
                                            <strong className="d-block">SHARING</strong>
                                            <div className="fw-bold text-primary">
                                              Rs. {totalSharing.toLocaleString()}/.
                                            </div>
                                            <small className="text-muted">per adult</small>
                                          </div>
                                          {/* )} */}

                                          {/* {pkg.is_quaint_active && ( */}
                                          <div className="col-6 col-sm-4 col-md-2 mb-3">
                                            <strong className="d-block">QUINT</strong>
                                            <div className="fw-bold text-primary">
                                              Rs. {totalQuint.toLocaleString()}/.
                                            </div>
                                            <small className="text-muted">per adult</small>
                                          </div>
                                          {/* )} */}

                                          {/* {pkg.is_quad_active && ( */}
                                          <div className="col-6 col-sm-4 col-md-2 mb-3">
                                            <strong className="d-block">QUAD BED</strong>
                                            <div className="fw-bold text-primary">
                                              Rs. {totalQuad.toLocaleString()}/.
                                            </div>
                                            <small className="text-muted">per adult</small>
                                          </div>
                                          {/* )} */}

                                          {/* {pkg.is_triple_active && ( */}
                                          <div className="col-6 col-sm-4 col-md-2 mb-3">
                                            <strong className="d-block">TRIPLE BED</strong>
                                            <div className="fw-bold text-primary">
                                              Rs. {totalTriple.toLocaleString()}/.
                                            </div>
                                            <small className="text-muted">per adult</small>
                                          </div>
                                          {/* )} */}

                                          {/* {pkg.is_double_active && ( */}
                                          <div className="col-6 col-sm-4 col-md-2 mb-3">
                                            <strong className="d-block">DOUBLE BED</strong>
                                            <div className="fw-bold text-primary">
                                              Rs. {totalDouble.toLocaleString()}/.
                                            </div>
                                            <small className="text-muted">per adult</small>
                                          </div>
                                          {/* )} */}

                                          <div className="col-6 col-sm-4 col-md-2 mb-3">
                                            <strong className="d-block">PER INFANT</strong>
                                            <div className="fw-bold text-primary">
                                              Rs. {totalinfant.toLocaleString()}/.
                                            </div>
                                            <small className="text-muted">per PEX</small>
                                          </div>

                                          <div className="col-12 mt-2">
                                            <small className="text-muted">
                                              Per Child <span className="text-primary fw-bold">Rs {childPrices}/.</span> discount.
                                            </small>
                                          </div>
                                        </div>

                                        {/* Buttons */}
                                        <div className="d-flex flex-wrap gap-3">
                                          <button
                                            className="btn flex-fill text-white"
                                            style={{ background: "#1B78CE" }}
                                            onClick={() =>
                                              navigate(`/packages/edit/${pkg.id}`)
                                            }
                                          >
                                            Edit
                                          </button>
                                          <button
                                            className="btn text-white flex-fill"
                                            style={{ background: "#1B78CE" }}
                                            onClick={() => handleDeletePackage(pkg.id)}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                        <div className="d-flex mt-3 flex-wrap">
                                          <button
                                            className="btn flex-fill text-white"
                                            style={{ background: "#1B78CE" }}
                                            onClick={() =>
                                              navigate(`/packages/details/${pkg.id}`)
                                            }
                                          >
                                            See Details
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Section (Flight + Summary) */}
                                  <div className="col-lg-4 col-md-12">
                                    <div
                                      className="card border-0 rounded-4 h-100"
                                      style={{ background: "#F7F8F8" }}
                                    >
                                      <div className="m-3 ps-3 pt-2 pb-2">
                                        <h5 className="fw-bold mb-2 text-dark">Umrah Package</h5>

                                        <div className="mb-1">
                                          <h6 className="fw-bold mb-1 text-muted fst-italic">
                                            Hotels:
                                          </h6>
                                          <div className="small text-dark">
                                            {hotelDetails?.map((h, i) => (
                                              <div key={i}>
                                                {h.nights} Nights at {h.city} ({h.name})
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="mb-1">
                                          <h6 className="fw-bold mb-1 text-muted fst-italic">
                                            Umrah Visa:
                                          </h6>
                                          <div className="small text-dark">
                                            {pkg?.adault_visa_price > 0 ? "INCLUDED" : "N/A"}
                                          </div>
                                        </div>

                                        <div className="mb-2">
                                          <h6 className="fw-bold mb-1 text-muted fst-italic">
                                            Transport:
                                          </h6>
                                          <div className="small text-dark">
                                            {pkg?.transport_details
                                              ?.map((t) => t.transport_sector_info?.name)
                                              .join(" - ") || "N/A"}
                                          </div>
                                        </div>

                                        <div className="mb-1">
                                          <h6 className="fw-bold mb-1 text-muted fst-italic">
                                            Flight:
                                          </h6>
                                          <div className="small text-dark">
                                            <div>
                                              <strong>Travel Date:</strong> <br />
                                              {flightFrom?.departure_date_time &&
                                                flightFrom?.arrival_date_time ? (
                                                <>
                                                  {airline?.code || "XX"} {ticketInfo?.pnr} -{" "}
                                                  {formatDateTime(flightFrom?.departure_date_time)}{" "}
                                                  - {formatDateTime(flightFrom?.arrival_date_time)}
                                                </>
                                              ) : (
                                                <>N/A</>
                                              )}
                                            </div>
                                            <div>
                                              <strong>Return Date:</strong> <br />
                                              {flightTo?.departure_date_time &&
                                                flightTo?.arrival_date_time ? (
                                                <>
                                                  {airline?.code || "XX"} {ticketInfo?.pnr} -{" "}
                                                  {formatDateTime(flightTo?.departure_date_time)} -{" "}
                                                  {formatDateTime(flightTo?.arrival_date_time)}
                                                </>
                                              ) : (
                                                <>N/A</>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="mb-1">
                                          <h6 className="fw-bold mb-1 text-muted fst-italic">
                                            ZAYARAT:
                                          </h6>
                                          <div className="small text-dark">
                                            {pkg?.makkah_ziyarat_price || pkg?.madinah_ziyarat_price
                                              ? "YES"
                                              : "N/A"}
                                          </div>
                                        </div>

                                        <div className="mb-1">
                                          <h6 className="fw-bold mb-1 text-muted fst-italic">
                                            FOOD:
                                          </h6>
                                          <div className="small text-dark">
                                            {pkg?.food_price > 0 ? "INCLUDED" : "N/A"}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UmrahPackage;