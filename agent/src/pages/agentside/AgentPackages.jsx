import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ShimmerCard = () => {
  return (
    <div className="row p-3 rounded-4 mb-4 border bg-white">
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
  );
};

const ShimmerLoader = ({ count = 3 }) => {
  return (
    <div className="shimmer-packages-container">
      {Array.from({ length: count }).map((_, index) => (
        <ShimmerCard key={index} />
      ))}
    </div>
  );
};

const AgentPackages = () => {
  // Bed count per room type (business rule)
  const bedsPerRoomType = {
    // Sharing should be treated as a single-adult, single-family room
    sharing: 1,
    quint: 5,
    quad: 4,
    triple: 3,
    double: 2,
    single: 1,
  };
  const tabs = [
    { name: "Umrah Package", path: "/packages" },
    { name: "Umrah Calculater", path: "/packages/umrah-calculater" },
  ];
  const navigate = useNavigate();

  const [packageData, setPackageData] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  // selectedRooms: map of roomType -> count (number of rooms selected for that type)
  const [selectedRooms, setSelectedRooms] = useState({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsPackage, setDetailsPackage] = useState(null);
  const token = localStorage.getItem('agentAccessToken');

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0];
  };

  const orgId = getOrgId();

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔍 Fetching packages...");
      console.log("  - Token:", token ? "✓ Present" : "✗ Missing");
      console.log("  - Org ID:", orgId || "✗ Missing");

      // Don't fetch if we don't have token or orgId
      if (!token || !orgId) {
        console.warn("⚠️ Missing token or organization ID. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [packageRes, airlinesRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/umrah-packages/?organization=${orgId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          axios.get("http://127.0.0.1:8000/api/airlines/", {
            params: { organization: orgId },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        const packages = packageRes.data.filter(
          (pkg) => pkg.organization === orgId
        );
        
        if (packages.length === 0) {
          console.warn("⚠️ No umrah packages found for organization ID:", orgId);
          console.warn("� Please add packages for this organization in the Django admin panel.");
        }
        
        setPackageData(packages);
        setAirlines(airlinesRes.data);
      } catch (err) {
        console.error("❌ Failed to fetch packages:", err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.error("❌ Authentication error. Please log in again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, orgId]);

  const formatDateTime = (dateStr) => {
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

  const packagesRef = useRef(null);

  // Function to export packages as PDF
  const exportPackagesToPDF = async () => {
  try {
    toast.info("Generating PDF...", { autoClose: 2000 });

    const packagesContainer = packagesRef.current;
    if (!packagesContainer) {
      toast.error("No packages found to export");
      return;
    }

    const packageElements = packagesContainer.querySelectorAll('.package-card');
    if (packageElements.length === 0) {
      toast.error("No packages found to export");
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);

    let currentY = margin;
    let packagesPerPage = 0;

    for (let i = 0; i < packageElements.length; i++) {
      const packageElement = packageElements[i];

      // Convert package element to canvas
      const canvas = await html2canvas(packageElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);

      // Calculate height to maintain aspect ratio
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add package to PDF
      pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight);

      // Update Y for next package
      currentY += imgHeight + 5;
      packagesPerPage++;

      // If 3 packages added, start a new page
      if (packagesPerPage === 3 && i < packageElements.length - 1) {
        pdf.addPage();
        currentY = margin;
        packagesPerPage = 0;
      }
    }

    pdf.save(`umrah-packages-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF exported successfully!");
  } catch (error) {
    console.error("Error exporting PDF:", error);
    toast.error("Failed to export PDF");
  }
};



  // Show loading shimmer while fetching
  if (loading) {
    return (
      <>
        <style>
          {`
            @keyframes shimmer {
              0% { background-position: -468px 0; }
              100% { background-position: 468px 0; }
            }
            .shimmer-packages-container { padding: 1rem; }
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
            .shimmer-title { width: 200px; height: 30px; }
            .shimmer-logo { width: 80px; height: 80px; border-radius: 50%; }
            .shimmer-label { width: 80px; height: 14px; }
            .shimmer-text { width: 120px; height: 18px; }
            .shimmer-seats { width: 60px; height: 30px; }
            .shimmer-seats-text { width: 80px; height: 20px; }
            .shimmer-price-label { width: 60px; height: 16px; }
            .shimmer-price { width: 90px; height: 24px; }
            .shimmer-price-subtext { width: 50px; height: 12px; }
            .shimmer-button { height: 40px; border-radius: 20px; }
            .shimmer-right-title { width: 150px; height: 24px; }
            .shimmer-right-label { width: 80px; height: 14px; }
            .shimmer-right-text { width: 180px; height: 16px; }
          `}
        </style>
        <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
          <div className="row g-0">
            <div className="col-12 col-lg-2">
              <AgentSidebar />
            </div>
            <div className="col-12 col-lg-10 ps-lg-5">
              <div className="container">
                <AgentHeader />
                <div className="px-3 mt-3 px-lg-4">
                  <div className="row">
                    <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                      <nav className="nav flex-wrap gap-2">
                        {tabs.map((tab, index) => (
                          <NavLink
                            key={index}
                            to={tab.path}
                            className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${
                              tab.name === "Umrah Package"
                                ? "text-primary fw-semibold"
                                : "text-muted"
                            }`}
                            style={{ backgroundColor: "transparent" }}
                          >
                            {tab.name}
                          </NavLink>
                        ))}
                      </nav>
                      <div className="d-flex gap-2 mt-2 mb-3 mt-md-0">
                        <div className="btn text-white" id="btn">
                          Export Package
                        </div>
                      </div>
                    </div>
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

  // Show "no packages" message when loaded but empty
  if (!packageData.length) {
    return (
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          <div className="col-12 col-lg-2">
            <AgentSidebar />
          </div>
          <div className="col-12 col-lg-10 ps-lg-5">
            <div className="container">
              <AgentHeader />
              <div className="px-3 mt-3 px-lg-4">
                <div className="row">
                  <div className="d-flex flex-wrap justify-content-between align-items-center w-100 mb-4">
                    <nav className="nav flex-wrap gap-2">
                      {tabs.map((tab, index) => (
                        <NavLink
                          key={index}
                          to={tab.path}
                          className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${
                            tab.name === "Umrah Package"
                              ? "text-primary fw-semibold"
                              : "text-muted"
                          }`}
                          style={{ backgroundColor: "transparent" }}
                        >
                          {tab.name}
                        </NavLink>
                      ))}
                    </nav>
                  </div>
                  <div className="row">
                    <div className="col-12">
                      <div className="text-center py-5">
                        <div className="mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" fill="#dee2e6" viewBox="0 0 16 16">
                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7z"/>
                          </svg>
                        </div>
                        <h4 className="text-muted mb-3">No Umrah Packages Found</h4>
                        <p className="text-muted">
                          There are currently no umrah packages available for your organization (ID: {orgId}).
                        </p>
                        <p className="text-muted small">
                          Please contact your administrator to add packages to your organization.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const calculatePackagePrice = (pkg, roomType) => {
    const ticketInfo = pkg?.ticket_details?.[0]?.ticket_info;

    // Base price components (same for all room types)
    const basePrice =
      (pkg.adault_visa_price || 0) +
      (pkg.transport_price || 0) +
      (ticketInfo?.adult_price || 0) +
      (pkg.food_price || 0) +
      (pkg.makkah_ziyarat_price || 0) +
      (pkg.madinah_ziyarat_price || 0);

    // Calculate hotel cost based on room type
    let hotelCost = 0;

    switch (roomType) {
      case 'sharing':
        hotelCost = pkg?.hotel_details?.reduce((sum, hotel) => {
          return sum + (hotel.sharing_bed_price || 0) * (hotel.number_of_nights || 0);
        }, 0) || 0;
        break;
      case 'quint':
        hotelCost = pkg?.hotel_details?.reduce((sum, hotel) => {
          return sum + (hotel.quaint_bed_price || 0) * (hotel.number_of_nights || 0);
        }, 0) || 0;
        break;
      case 'quad':
        hotelCost = pkg?.hotel_details?.reduce((sum, hotel) => {
          return sum + (hotel.quad_bed_price || 0) * (hotel.number_of_nights || 0);
        }, 0) || 0;
        break;
      case 'triple':
        hotelCost = pkg?.hotel_details?.reduce((sum, hotel) => {
          return sum + (hotel.triple_bed_price || 0) * (hotel.number_of_nights || 0);
        }, 0) || 0;
        break;
      case 'double':
        hotelCost = pkg?.hotel_details?.reduce((sum, hotel) => {
          return sum + (hotel.double_bed_price || 0) * (hotel.number_of_nights || 0);
        }, 0) || 0;
        break;
      default:
        hotelCost = 0;
    }

    return basePrice + hotelCost;
  };

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -468px 0; }
            100% { background-position: 468px 0; }
          }
          .shimmer-packages-container { padding: 1rem; }
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
          .shimmer-title { width: 200px; height: 30px; }
          .shimmer-logo { width: 80px; height: 80px; border-radius: 50%; }
          .shimmer-label { width: 80px; height: 14px; }
          .shimmer-text { width: 120px; height: 18px; }
          .shimmer-seats { width: 60px; height: 30px; }
          .shimmer-seats-text { width: 80px; height: 20px; }
          .shimmer-price-label { width: 60px; height: 16px; }
          .shimmer-price { width: 90px; height: 24px; }
          .shimmer-price-subtext { width: 50px; height: 12px; }
          .shimmer-button { height: 40px; border-radius: 20px; }
          .shimmer-right-title { width: 150px; height: 24px; }
          .shimmer-right-label { width: 80px; height: 14px; }
          .shimmer-right-text { width: 180px; height: 16px; }

          /* Simple Package Card Styles */
          .package-card {
            background: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: box-shadow 0.3s ease;
          }
          .package-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        `}
      </style>
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          <div className="col-12 col-lg-2">
            <AgentSidebar />
          </div>
          <div className="col-12 col-lg-10 ps-lg-5">
            <div className="container">
              <AgentHeader />
              <div className="px-3 mt-3 ps-lg-4">
                <div className="row">
                  <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                    <nav className="nav flex-wrap gap-2">
                      {tabs.map((tab, index) => (
                        <NavLink
                          key={index}
                          to={tab.path}
                          className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${
                            tab.name === "Umrah Package"
                              ? "text-primary fw-semibold"
                              : "text-muted"
                          }`}
                          style={{ backgroundColor: "transparent" }}
                        >
                          {tab.name}
                        </NavLink>
                      ))}
                    </nav>
                    <div className="d-flex gap-2 mt-2 mb-3 mt-md-0">
                      <Link to="" className="btn text-white" id="btn" onClick={exportPackagesToPDF}>
                        Export Package
                      </Link>
                    </div>
                  </div>
                  <div className="row" ref={packagesRef}>
                    <div className="col-12">
                      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
                      {packageData.map((pkg, index) => {
                        const ticketInfo = pkg?.ticket_details?.[0]?.ticket_info;
                        const tripDetails = ticketInfo?.trip_details || [];
                        const flightFrom = tripDetails[0];
                        const flightTo = tripDetails[1];
                        const airline = airlines.find((a) => a.id === ticketInfo?.airline);

                        // Calculate prices for different room types
                        const sharingPrice = calculatePackagePrice(pkg, 'sharing');
                        const quintPrice = calculatePackagePrice(pkg, 'quint');
                        const quadPrice = calculatePackagePrice(pkg, 'quad');
                        const triplePrice = calculatePackagePrice(pkg, 'triple');
                        const doublePrice = calculatePackagePrice(pkg, 'double');
                        
                        const infantPrices = (ticketInfo?.infant_price || 0) + (pkg.infant_visa_price || 0);
                        const childPrices = (pkg?.adault_visa_price || 0) - (pkg?.child_visa_price || 0);

                        return (
                           <div key={index} className="border rounded-3 mb-4 package-card" style={{padding: "24px", background: "white"}}>
                            {/* Title and Seats Row */}
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <h4 className="fw-bold mb-0" style={{fontSize: "22px", color: "#333"}}>
                                {pkg?.title || "Umrah Package"}
                              </h4>
                              <div className="text-end">
                                <h3 className="fw-bold mb-0" style={{color: "#dc3545", fontSize: "32px"}}>{pkg?.total_seats || "0"}</h3>
                                <div className="text-danger fw-semibold" style={{fontSize: "14px"}}>Seats Left</div>
                              </div>
                            </div>

                            {/* Hotel and Package Details */}
                            <div className="row mb-3 g-3">
                              <div className="col-6 col-md-2">
                                <div className="text-uppercase fw-bold text-muted" style={{fontSize: "11px", marginBottom: "4px"}}>MAKKAH HOTEL:</div>
                                <div style={{fontSize: "14px", color: "#333"}}>{pkg?.hotel_details?.[0]?.hotel_info?.name || "N/A"}</div>
                              </div>
                              <div className="col-6 col-md-2">
                                <div className="text-uppercase fw-bold text-muted" style={{fontSize: "11px", marginBottom: "4px"}}>MADINA HOTEL:</div>
                                <div style={{fontSize: "14px", color: "#333"}}>{pkg?.hotel_details?.[1]?.hotel_info?.name || "N/A"}</div>
                              </div>
                              <div className="col-4 col-md-2">
                                <div className="text-uppercase fw-bold text-muted" style={{fontSize: "11px", marginBottom: "4px"}}>ZAYARAT:</div>
                                <div style={{fontSize: "14px", color: "#333"}}>
                                  {pkg?.makkah_ziyarat_price || pkg?.madinah_ziyarat_price ? "YES" : "N/A"}
                                </div>
                              </div>
                              <div className="col-4 col-md-2">
                                <div className="text-uppercase fw-bold text-muted" style={{fontSize: "11px", marginBottom: "4px"}}>FOOD:</div>
                                <div style={{fontSize: "14px", color: "#333"}}>
                                  {pkg?.food_price > 0 ? "INCLUDED" : "N/A"}
                                </div>
                              </div>
                              <div className="col-4 col-md-4">
                                <div className="text-uppercase fw-bold text-muted" style={{fontSize: "11px", marginBottom: "4px"}}>RULES:</div>
                                <div style={{fontSize: "13px", color: "#333", lineHeight: "1.4"}}>{pkg?.rules || "N/A"}</div>
                              </div>
                            </div>
                            {/* Pricing Section */}
                            <div className="row g-2 mb-3">
                              {pkg.is_sharing_active && (
                                <div className="col-6 col-sm-4 col-lg-2 text-center">
                                  <div className="text-uppercase fw-bold" style={{fontSize: "12px", marginBottom: "6px"}}>SHARING</div>
                                  <div className="fw-bold text-primary" style={{fontSize: "18px"}}>
                                    Rs. {sharingPrice.toLocaleString()}/
                                  </div>
                                  <small className="text-muted" style={{fontSize: "11px"}}>per adult</small>
                                </div>
                              )}
                              {pkg.is_quaint_active && (
                                <div className="col-6 col-sm-4 col-lg-2 text-center">
                                  <div className="text-uppercase fw-bold" style={{fontSize: "12px", marginBottom: "6px"}}>QUINT</div>
                                  <div className="fw-bold text-primary" style={{fontSize: "18px"}}>
                                    Rs. {quintPrice.toLocaleString()}/
                                  </div>
                                  <small className="text-muted" style={{fontSize: "11px"}}>per adult</small>
                                </div>
                              )}
                              {pkg.is_quad_active && (
                                <div className="col-6 col-sm-4 col-lg-2 text-center">
                                  <div className="text-uppercase fw-bold" style={{fontSize: "12px", marginBottom: "6px"}}>QUAD BED</div>
                                  <div className="fw-bold text-primary" style={{fontSize: "18px"}}>
                                    Rs. {quadPrice.toLocaleString()}/
                                  </div>
                                  <small className="text-muted" style={{fontSize: "11px"}}>per adult</small>
                                </div>
                              )}
                              {pkg.is_triple_active && (
                                <div className="col-6 col-sm-4 col-lg-2 text-center">
                                  <div className="text-uppercase fw-bold" style={{fontSize: "12px", marginBottom: "6px"}}>TRIPLE BED</div>
                                  <div className="fw-bold text-primary" style={{fontSize: "18px"}}>
                                    Rs. {triplePrice.toLocaleString()}/
                                  </div>
                                  <small className="text-muted" style={{fontSize: "11px"}}>per adult</small>
                                </div>
                              )}
                              {pkg.is_double_active && (
                                <div className="col-6 col-sm-4 col-lg-2 text-center">
                                  <div className="text-uppercase fw-bold" style={{fontSize: "12px", marginBottom: "6px"}}>DOUBLE BED</div>
                                  <div className="fw-bold text-primary" style={{fontSize: "18px"}}>
                                    Rs. {doublePrice.toLocaleString()}/
                                  </div>
                                  <small className="text-muted" style={{fontSize: "11px"}}>per adult</small>
                                </div>
                              )}
                              <div className="col-6 col-sm-4 col-lg-2 text-center">
                                <div className="text-uppercase fw-bold" style={{fontSize: "12px", marginBottom: "6px"}}>PER INFANT</div>
                                <div className="fw-bold text-primary" style={{fontSize: "18px"}}>
                                  Rs. {infantPrices.toLocaleString()}/
                                </div>
                                <small className="text-muted" style={{fontSize: "11px"}}>per PEX</small>
                              </div>
                            </div>

                            {/* Child Discount */}
                            <div className="mb-3" style={{fontSize: "13px"}}>
                              Per Child <span className="text-primary fw-bold">Rs {childPrices}/.</span> discount.
                            </div>

                            {/* Book Now Button */}
                            <button
                              className="btn text-white w-100"
                              id="btn"
                              data-html2canvas-ignore="true"
                              style={{padding: "12px", fontSize: "16px", fontWeight: "600"}}
                              onClick={() => {
                                setSelectedPackage(pkg);
                                setSelectedRooms({}); // reset previous selections
                                setShowBookingModal(true);
                              }}
                            >
                              Book Now
                            </button>

                            {showBookingModal && selectedPackage && selectedPackage.id === pkg.id && (
                              <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.1' }}>
                                <div className="modal-dialog modal-dialog-centered modal-lg">
                                  <div className="modal-content">
                                    <div className="modal-header">
                                      <h5 className="modal-title">Select Room Type for {selectedPackage.title}</h5>
                                      <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => {
                                          setShowBookingModal(false);
                                          setSelectedRooms({});
                                        }}
                                      ></button>
                                    </div>
                                    <div className="modal-body">
                                      <div className="row">
                                        {(() => {
                                          const totalSeats = Number(selectedPackage.total_seats) || 0;
                                          const currentSelectedPax = Object.entries(selectedRooms).reduce((sum, [t, c]) => {
                                            return sum + (bedsPerRoomType[t] || 0) * c;
                                          }, 0);
                                          const remainingSeats = Math.max(0, totalSeats - currentSelectedPax);

                                          const isAllowed = (type) => (bedsPerRoomType[type] || 0) <= remainingSeats;

                                          const addRoom = (type) => {
                                            const needed = bedsPerRoomType[type] || 0;
                                            if (needed <= remainingSeats) {
                                              setSelectedRooms((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
                                            } else {
                                              toast.error('Not enough seats');
                                            }
                                          };

                                          const removeRoom = (type) => {
                                            setSelectedRooms((prev) => {
                                              const cur = prev[type] || 0;
                                              if (cur <= 1) {
                                                const copy = { ...prev };
                                                delete copy[type];
                                                return copy;
                                              }
                                              return { ...prev, [type]: cur - 1 };
                                            });
                                          };

                                          // Preview families list
                                          const familiesPreview = [];
                                          Object.entries(selectedRooms).forEach(([type, count]) => {
                                            for (let i = 0; i < count; i++) {
                                              familiesPreview.push({ roomType: type, adults: bedsPerRoomType[type] || 0, children: 0 });
                                            }
                                          });

                                          return (
                                            <>
                                              {/* Room type cards (click to add) */}
                                              {selectedPackage.is_sharing_active && (
                                                <div className="col-md-3 mb-3">
                                                  <div
                                                    className={`card h-100 border-secondary ${!(bedsPerRoomType['sharing'] <= remainingSeats) ? 'opacity-50' : ''}`}
                                                    style={{ transition: 'all 0.3s ease' }}
                                                  >
                                                    <div className="card-body text-center">
                                                      <h6 className="">SHARING</h6>
                                                      <div className="mb-2">
                                                        <h6 className="text-primary">Rs. {calculatePackagePrice(selectedPackage, 'sharing').toLocaleString()}</h6>
                                                        <small className="text-muted">per adult</small>
                                                      </div>
                                                      <div className="d-flex justify-content-center align-items-center gap-2">
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeRoom('sharing')} disabled={!selectedRooms['sharing']}>-</button>
                                                        <div className="px-2">{selectedRooms['sharing'] || 0}</div>
                                                        <button className="btn btn-sm btn-outline-primary" onClick={() => addRoom('sharing')} disabled={!(bedsPerRoomType['sharing'] <= remainingSeats)}>+</button>
                                                      </div>
                                                      {!(bedsPerRoomType['sharing'] <= remainingSeats) && <div className="small text-danger mt-2">Not enough seats</div>}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}

                                              {selectedPackage.is_quaint_active && (
                                                <div className="col-md-3 mb-3">
                                                  <div className={`card h-100 border-secondary ${!(bedsPerRoomType['quint'] <= remainingSeats) ? 'opacity-50' : ''}`} style={{ transition: 'all 0.3s ease' }}>
                                                    <div className="card-body text-center">
                                                      <h6 className="">QUINT</h6>
                                                      <div className="mb-2">
                                                        <h6 className="text-primary">Rs. {calculatePackagePrice(selectedPackage, 'quint').toLocaleString()}</h6>
                                                        <small className="text-muted">per adult</small>
                                                      </div>
                                                      <div className="d-flex justify-content-center align-items-center gap-2">
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeRoom('quint')} disabled={!selectedRooms['quint']}>-</button>
                                                        <div className="px-2">{selectedRooms['quint'] || 0}</div>
                                                        <button className="btn btn-sm btn-outline-primary" onClick={() => addRoom('quint')} disabled={!(bedsPerRoomType['quint'] <= remainingSeats)}>+</button>
                                                      </div>
                                                      {!(bedsPerRoomType['quint'] <= remainingSeats) && <div className="small text-danger mt-2">Not enough seats</div>}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}

                                              {selectedPackage.is_quad_active && (
                                                <div className="col-md-3 mb-3">
                                                  <div className={`card h-100 border-secondary ${!(bedsPerRoomType['quad'] <= remainingSeats) ? 'opacity-50' : ''}`} style={{ transition: 'all 0.3s ease' }}>
                                                    <div className="card-body text-center">
                                                      <h6 className="">QUAD BED</h6>
                                                      <div className="mb-2">
                                                        <h6 className="text-primary">Rs. {calculatePackagePrice(selectedPackage, 'quad').toLocaleString()}</h6>
                                                        <small className="text-muted">per adult</small>
                                                      </div>
                                                      <div className="d-flex justify-content-center align-items-center gap-2">
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeRoom('quad')} disabled={!selectedRooms['quad']}>-</button>
                                                        <div className="px-2">{selectedRooms['quad'] || 0}</div>
                                                        <button className="btn btn-sm btn-outline-primary" onClick={() => addRoom('quad')} disabled={!(bedsPerRoomType['quad'] <= remainingSeats)}>+</button>
                                                      </div>
                                                      {!(bedsPerRoomType['quad'] <= remainingSeats) && <div className="small text-danger mt-2">Not enough seats</div>}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}

                                              {selectedPackage.is_triple_active && (
                                                <div className="col-md-3 mb-3">
                                                  <div className={`card h-100 border-secondary ${!(bedsPerRoomType['triple'] <= remainingSeats) ? 'opacity-50' : ''}`} style={{ transition: 'all 0.3s ease' }}>
                                                    <div className="card-body text-center">
                                                      <h6 className="">TRIPLE BED</h6>
                                                      <div className="mb-2">
                                                        <h6 className="text-primary">Rs. {calculatePackagePrice(selectedPackage, 'triple').toLocaleString()}</h6>
                                                        <small className="text-muted">per adult</small>
                                                      </div>
                                                      <div className="d-flex justify-content-center align-items-center gap-2">
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeRoom('triple')} disabled={!selectedRooms['triple']}>-</button>
                                                        <div className="px-2">{selectedRooms['triple'] || 0}</div>
                                                        <button className="btn btn-sm btn-outline-primary" onClick={() => addRoom('triple')} disabled={!(bedsPerRoomType['triple'] <= remainingSeats)}>+</button>
                                                      </div>
                                                      {!(bedsPerRoomType['triple'] <= remainingSeats) && <div className="small text-danger mt-2">Not enough seats</div>}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}

                                              {selectedPackage.is_double_active && (
                                                <div className="col-md-3 mb-3">
                                                  <div className={`card h-100 border-secondary ${!(bedsPerRoomType['double'] <= remainingSeats) ? 'opacity-50' : ''}`} style={{ transition: 'all 0.3s ease' }}>
                                                    <div className="text-center card-body">
                                                      <h6 className="">DOUBLE BED</h6>
                                                      <div className="mb-2">
                                                        <h6 className="text-primary">Rs. {calculatePackagePrice(selectedPackage, 'double').toLocaleString()}</h6>
                                                        <small className="text-muted">per adult</small>
                                                      </div>
                                                      <div className="d-flex justify-content-center align-items-center gap-2">
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeRoom('double')} disabled={!selectedRooms['double']}>-</button>
                                                        <div className="px-2">{selectedRooms['double'] || 0}</div>
                                                        <button className="btn btn-sm btn-outline-primary" onClick={() => addRoom('double')} disabled={!(bedsPerRoomType['double'] <= remainingSeats)}>+</button>
                                                      </div>
                                                      {!(bedsPerRoomType['double'] <= remainingSeats) && <div className="small text-danger mt-2">Not enough seats</div>}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Summary / families preview */}
                                              <div className="col-12 mt-3">
                                                <div className="border rounded p-3">
                                                  <h6 className="mb-2">Selected Families / Rooms</h6>
                                                  {familiesPreview.length === 0 ? (
                                                    <div className="text-muted">No rooms selected</div>
                                                  ) : (
                                                    <ul className="list-unstyled mb-0">
                                                      {familiesPreview.map((f, i) => (
                                                        <li key={i} className="mb-1">Family {i + 1}: <strong className="text-capitalize">{f.roomType}</strong> — {f.adults} adult(s)</li>
                                                      ))}
                                                    </ul>
                                                  )}
                                                  <div className="mt-2 small text-muted">Total passengers selected: {currentSelectedPax} / {totalSeats}</div>
                                                </div>
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                    <div className="modal-footer">
                                      <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                          setShowBookingModal(false);
                                          setSelectedRooms({});
                                        }}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        className="btn"
                                        id="btn"
                                        disabled={Object.keys(selectedRooms).length === 0}
                                        onClick={() => {
                                          const selectedTypes = Object.entries(selectedRooms);
                                          if (selectedTypes.length === 0) {
                                            toast.error('Please select at least one room');
                                            return;
                                          }

                                          // Build families array and compute total price
                                          const families = [];
                                          let totalPrice = 0;
                                          selectedTypes.forEach(([type, count]) => {
                                            const adultsPerRoom = bedsPerRoomType[type] || 0;
                                            const pricePerAdult = calculatePackagePrice(selectedPackage, type);
                                            for (let i = 0; i < count; i++) {
                                              families.push({ roomType: type, adults: adultsPerRoom, children: 0 });
                                            }
                                            totalPrice += pricePerAdult * adultsPerRoom * count;
                                          });

                                          navigate('/packages/booking', {
                                            state: {
                                              package: selectedPackage,
                                              families,
                                              totalPrice,
                                            }
                                          });
                                          setShowBookingModal(false);
                                        }}
                                      >
                                        Proceed to Booking
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* JSON modal removed - full package details are shown on Booking Summary page */}
                          </div>
                        );
                      })}
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

export default AgentPackages;