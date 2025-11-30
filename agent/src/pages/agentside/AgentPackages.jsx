import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- Utility Components for Shimmer Loading (Kept as is) ---
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

// --- Missing Modal Component (Added for completeness) ---

/**
 * Renders a basic, non-functional modal to complete the parent component logic.
 * In a real application, this would contain the form/logic for selecting rooms and submitting the booking.
 */
const RoomBookingModal = ({ pkg, show, onClose, bedsPerRoomType, calculatePrice, rooms, setRooms }) => {
  if (!show || !pkg) return null;

  const roomTypes = Object.keys(bedsPerRoomType);

  const handleRoomChange = (roomType, increment) => {
    setRooms(prevRooms => {
      const currentCount = prevRooms[roomType] || 0;
      const newCount = currentCount + increment;
      if (newCount < 0) return prevRooms;
      if (newCount === 0) {
        const { [roomType]: _, ...rest } = prevRooms;
        return rest;
      }
      return { ...prevRooms, [roomType]: newCount };
    });
  };

  const totalAdults = Object.entries(rooms).reduce((sum, [type, count]) => {
    return sum + (bedsPerRoomType[type] || 0) * count;
  }, 0);

  const totalPrice = Object.entries(rooms).reduce((sum, [type, count]) => {
    return sum + calculatePrice(pkg, type) * count;
  }, 0);

  const handleBooking = () => {
    if (totalAdults === 0) {
      toast.error("Please select at least one room type.");
      return;
    }
    // In a real application, you would navigate or call an API here.
    toast.success(`Booking initiated for ${totalAdults} adults across ${Object.values(rooms).reduce((a, b) => a + b, 0)} rooms. Total: Rs. ${totalPrice.toLocaleString()}`);
    console.log("Booking Data:", { packageId: pkg.id, selectedRooms: rooms, totalAdults, totalPrice });
    onClose();
  };

  return (
    <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Book Package: {pkg.title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p className="fw-semibold">Select Room Type & Quantity:</p>
            <div className="row g-3">
              {roomTypes.map((roomType) => {
                const price = calculatePrice(pkg, roomType);
                const count = rooms[roomType] || 0;
                if (price === 0) return null; // Hide if price is 0 (i.e., not offered)

                return (
                  <div key={roomType} className="col-12 col-md-6">
                    <div className="d-flex justify-content-between align-items-center border p-3 rounded">
                      <div>
                        <div className="text-uppercase fw-bold" style={{ fontSize: "14px" }}>
                          {roomType} ({bedsPerRoomType[roomType]} Beds)
                        </div>
                        <div className="text-primary fw-bold">
                          Rs. {Number(price).toLocaleString()}/. <span className="text-muted small">per adult</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <button className="btn btn-sm btn-outline-danger me-2" onClick={() => handleRoomChange(roomType, -1)}>-</button>
                        <span className="fw-bold mx-2" style={{ width: '20px', textAlign: 'center' }}>{count}</span>
                        <button className="btn btn-sm btn-outline-success ms-2" onClick={() => handleRoomChange(roomType, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="modal-footer d-flex justify-content-between">
            <div>
              <p className="mb-0">Total Adults: <span className="fw-bold text-primary">{totalAdults}</span></p>
              <p className="mb-0">Total Estimated Price: <span className="fw-bold text-success">Rs. {totalPrice.toLocaleString()}/.</span></p>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleBooking}>Proceed to Booking</button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Component ---
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

  const getOrgIds = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return [];
    const orgData = JSON.parse(agentOrg);
    return Array.isArray(orgData.ids) ? orgData.ids : [];
  };

  const orgIds = getOrgIds();

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔍 Fetching packages...");
      console.log("  - Token:", token ? "✓ Present" : "✗ Missing");
      console.log("  - Org IDs:", orgIds && orgIds.length ? orgIds.join(',') : "✗ Missing");

      // Don't fetch if we don't have token or any organization IDs
      if (!token || !orgIds || orgIds.length === 0) {
        console.warn("⚠️ Missing token or organization ID(s). Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch packages and airlines for all organization IDs (agent may be linked to a parent org)
        const packagePromises = orgIds.map((id) =>
          axios.get(`http://127.0.0.1:8000/api/umrah-packages/?organization=${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        );

        const airlinePromises = orgIds.map((id) =>
          axios.get("http://127.0.0.1:8000/api/airlines/", {
            params: { organization: id },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        );

        const packageResponses = orgIds.length ? await Promise.all(packagePromises) : [];
        const airlineResponses = orgIds.length ? await Promise.all(airlinePromises) : [];

        // Flatten and deduplicate packages by id
        const allPackages = packageResponses
          .map((r) => r.data || [])
          .flat()
          .filter(Boolean);
        const packagesById = {};
        allPackages.forEach((p) => {
          if (!packagesById[p.id]) packagesById[p.id] = p;
        });
        const packages = Object.values(packagesById);

        // Flatten and dedupe airlines by id
        const allAirlines = airlineResponses
          .map((r) => r.data || [])
          .flat()
          .filter(Boolean);
        const airlinesById = {};
        allAirlines.forEach((a) => {
          if (!airlinesById[a.id]) airlinesById[a.id] = a;
        });
        const mergedAirlines = Object.values(airlinesById);

        if (packages.length === 0) {
          console.warn("⚠️ No umrah packages found for organization IDs:", orgIds);
          console.warn("Please add packages for these organizations in the Django admin panel.");
        }

        setPackageData(packages);
        setAirlines(mergedAirlines);
      } catch (err) {
        console.error("❌ Failed to fetch packages:", err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.error("❌ Authentication error. Please log in again.");
        }
        // Instead of toast.error here, let the UI show the 'no packages' message
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Dependency list cleaned up: token and a stable representation of orgIds
  }, [token, JSON.stringify(orgIds)]);

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
      // Packages per page logic is slightly flawed for dynamically sized content,
      // but keeping it as is for now, based on the original structure.
      // let packagesPerPage = 0; // Removed, as it causes issues with dynamic element height.

      for (let i = 0; i < packageElements.length; i++) {
        const packageElement = packageElements[i];

        // Convert package element to canvas
        const canvas = await html2canvas(packageElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          // Ignore the Book Now button within the card for PDF generation
          ignoreElements: (element) => element.getAttribute('data-html2canvas-ignore') === 'true',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);

        // Calculate height to maintain aspect ratio
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if the current package fits on the current page
        if (currentY + imgHeight + margin > pageHeight && i > 0) {
          pdf.addPage();
          currentY = margin;
        } else if (i > 0) {
          // Add a small space between cards
          currentY += 5;
        }

        // Add package to PDF
        pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight);

        // Update Y for next package
        currentY += imgHeight;
      }

      pdf.save(`umrah-packages-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };


  // --- Robust Package Price Calculation (copied from Packages.jsx) ---
  const computePackageTotals = (pkg, hotelsList = [], airlinesList = [], ticketsList = []) => {
    // Helper: pick first defined value from keys
    const pick = (obj, keys) => {
      if (!obj) return undefined;
      for (const k of keys) {
        if (typeof obj[k] !== 'undefined' && obj[k] !== null) return obj[k];
      }
      return undefined;
    };
    // Build hotelDetails with robust price picking
    const hotelDetails = (pkg?.hotel_details || []).map((hotelEntry) => {
      const hotelInfo = hotelsList.find((h) => h.id === hotelEntry.hotel_info?.id) || hotelEntry.hotel_info || {};
      const nights = hotelEntry?.number_of_nights || hotelEntry?.nights || hotelEntry?.total_nights || 0;
      // priceSources: prefer explicit entry values, then first prices entry, then hotelInfo root
      const priceSources = [hotelEntry || {}, (hotelInfo?.prices?.[0] || {}), hotelInfo || {}];
      // helper: try the usual keys and also include '*_bed_selling_price' variants
      const priceCandidates = (keys, altKeys = []) => {
        const candidates = [...keys, ...altKeys];
        for (const src of priceSources) {
          const v = pick(src, candidates);
          if (typeof v !== 'undefined' && v !== null) return v;
        }
        return undefined;
      };
      // try to read price from hotelInfo.prices[] matching a room_type
      const findPriceInPricesArray = (roomTypeNames = []) => {
        const pricesArr = hotelInfo?.prices || [];
        for (const p of pricesArr) {
          if (!p) continue;
          const rt = (p.room_type || '').toString().toLowerCase();
          if (roomTypeNames.some(rn => rt.includes(rn))) {
            return p.price || p.selling_price || p.purchase_price || undefined;
          }
        }
        return undefined;
      };
      const sharing = priceCandidates(
        ['sharing_bed_selling_price','sharing_bed_price','sharing_selling_price','sharing_price','sharing'],
        ['sharing_bed_purchase_price']
      ) || findPriceInPricesArray(['sharing','shared']);
      const quaint = priceCandidates(
        ['quaint_bed_selling_price','quaint_bed_price','quaint_selling_price','quaint_price','quaint'],
        ['quaint_bed_purchase_price']
      ) || findPriceInPricesArray(['quaint','quint','quintet']);
      const quad = priceCandidates(
        ['quad_bed_selling_price','quad_bed_price','quad_selling_price','quad_price','quad'],
        ['quad_bed_purchase_price']
      ) || findPriceInPricesArray(['quad']);
      const triple = priceCandidates(
        ['triple_bed_selling_price','triple_bed_price','triple_selling_price','triple_price','triple'],
        ['triple_bed_purchase_price']
      ) || findPriceInPricesArray(['triple']);
      const doubleBed = priceCandidates(
        ['double_bed_selling_price','double_bed_price','double_selling_price','double_price','double'],
        ['double_bed_purchase_price']
      ) || findPriceInPricesArray(['double']);
      const single = priceCandidates(
        ['single_bed_selling_price','single_bed_price','single_selling_price','single_price','single'],
        ['single_bed_purchase_price']
      ) || findPriceInPricesArray(['single']);
      return {
        ...hotelEntry,
        hotel_info: hotelInfo,
        nights,
        sharing_per_night: Number(sharing) || 0,
        quaint_per_night: Number(quaint) || 0,
        quad_per_night: Number(quad) || 0,
        triple_per_night: Number(triple) || 0,
        double_per_night: Number(doubleBed) || 0,
        single_per_night: Number(single) || 0,
      };
    });
    // helper to sum per-night prices across hotels
    const sumPerNight = (key) =>
      hotelDetails.reduce((s, h) => s + (Number(h[key] || 0) * (Number(h.nights || 0) || 0)), 0);
    // resolve package-level selling price fields with fallbacks
    const pkgPick = (keys) => {
      for (const k of keys) {
        if (typeof pkg?.[k] !== 'undefined' && pkg?.[k] !== null) return Number(pkg[k]) || 0;
      }
      return 0;
    };
    const food = pkgPick(['food_selling_price','food_price','food_selling_price']);
    const makkah = pkgPick(['makkah_ziyarat_selling_price','makkah_ziyarat_price']);
    const madinah = pkgPick(['madinah_ziyarat_selling_price','madinah_ziyarat_price']);
    const transport = pkgPick(['transport_selling_price','transport_price']);
    const visaAdult = pkgPick(['adault_visa_selling_price','adault_visa_price']);
    const ticketInfo = pkg?.ticket_details?.[0]?.ticket_info || {};
    let adultTicketRaw = pick(ticketInfo, ['adult_selling_price', 'adult_price', 'adult_fare', 'adult_ticket_price']);
    let childTicketRaw = pick(ticketInfo, ['child_selling_price', 'child_price', 'child_fare', 'child_ticket_price']);
    let ticketAdult = Number(adultTicketRaw) || 0;
    let ticketChild = Number(childTicketRaw) || 0;
    const adultCost = food + makkah + madinah + transport + visaAdult + ticketAdult;
    // hotel totals per bed-type
    const sharingHotelTotal = sumPerNight('sharing_per_night');
    const quaintHotelTotal = sumPerNight('quaint_per_night');
    const quadHotelTotal = sumPerNight('quad_per_night');
    const tripleHotelTotal = sumPerNight('triple_per_night');
    const doubleHotelTotal = sumPerNight('double_per_night');
    const singleHotelTotal = sumPerNight('single_per_night');
    const totalSharing = adultCost + sharingHotelTotal;
    const totalQuint = adultCost + quaintHotelTotal;
    const totalQuad = adultCost + quadHotelTotal;
    const totalTriple = adultCost + tripleHotelTotal;
    const totalDouble = adultCost + doubleHotelTotal;
    const totalSingle = adultCost + singleHotelTotal;
    // Infant price should be ticket selling price + infant visa selling price.
    let infantTicketRaw = pick(ticketInfo, ['infant_selling_price', 'infant_price', 'infant_ticket_selling_price', 'infant_ticket_price', 'infantTicketPrice','infant_fare']);
    let infantTicket = Number(infantTicketRaw) || 0;
    const infantVisa = pkgPick(['infant_visa_selling_price', 'infant_visa_price', 'infant_visa_cost']);
    const totalInfant = Number(infantTicket) + Number(infantVisa || 0);
    return {
      hotelDetails,
      adultCost,
      totalSharing,
      totalQuint,
      totalQuad,
      totalTriple,
      totalDouble,
      totalSingle,
      totalInfant,
    };
  };

  // New function to get price by room type (for UI compatibility)
  const calculatePackagePrice = (pkg, roomType) => {
    const totals = computePackageTotals(pkg, [], [], []);
    switch (roomType) {
      case 'sharing': return totals.totalSharing;
      case 'quint': return totals.totalQuint;
      case 'quad': return totals.totalQuad;
      case 'triple': return totals.totalTriple;
      case 'double': return totals.totalDouble;
      case 'single': return totals.totalSingle;
      case 'infant': return totals.totalInfant;
      default: return 0;
    }
  };

  // Helper: resolve airline name from various possible shapes
  const resolveAirlineName = (pkg, ticketInfo) => {
    const info = ticketInfo || pkg?.ticket_details?.[0]?.ticket_info || pkg?.ticket_info || pkg?.ticket;
    if (!info) return null;
    // explicit name present
    if (info.airline_name) return info.airline_name;
    // airline may be an object
    if (info.airline && typeof info.airline === 'object') return info.airline.name || info.airline.code || null;

    // airline identifier can appear under different keys
    const aid = info.airline || info.airline_id || info.airlineCode || info.airline_code || info.airlineId;
    if (aid != null) {
      const aidStr = String(aid).toLowerCase();
      // try to match by numeric id, code (case-insensitive), or name
      const found = airlines.find((a) => {
        if (!a) return false;
        if (String(a.id) === String(aid)) return true;
        if (a.code && String(a.code).toLowerCase() === aidStr) return true;
        if (a.name && String(a.name).toLowerCase() === aidStr) return true;
        return false;
      });
      if (found) return found.name + (found.code ? ` (${found.code})` : '');
      // fallback: return raw id/code as string
      return String(aid);
    }

    // last-resort: check ticketInfo for any field that looks like an airline name/code
    if (info.airline_code) return info.airline_code;
    return null;
  };

  const resolveDateField = (ticketInfo, fieldName) => {
    if (!ticketInfo) return null;

    // helper to validate a candidate is a date-like string
    const isValidDate = (val) => {
      if (!val) return false;
      if (typeof val === 'string' || typeof val === 'number') {
        const d = new Date(val);
        return !isNaN(d.getTime());
      }
      return false;
    };

    // keys we commonly see for departure/return/travel dates
    const commonKeys = [
      fieldName,
      `${fieldName}`,
      'departure_date',
      'departure',
      'travel_date',
      'travel',
      'date',
      'return_date',
      'return',
      'start_date',
      'end_date'
    ];

    // direct check on the ticketInfo
    for (const k of commonKeys) {
      const v = ticketInfo[k];
      if (v && isValidDate(v)) return v;
    }

    // trip_details entries often contain departure/return
    if (Array.isArray(ticketInfo.trip_details)) {
      for (const trip of ticketInfo.trip_details) {
        for (const k of commonKeys) {
          const v = trip?.[k];
          if (v && isValidDate(v)) return v;
        }
        // scan all values inside trip for a date-like string
        for (const val of Object.values(trip || {})) {
          if (isValidDate(val)) return val;
        }
      }
    }

    // recursive scan for any nested date-like string (depth-limited)
    const scanObject = (obj, depth = 0) => {
      if (!obj || depth > 3) return null;
      if (typeof obj === 'string' && isValidDate(obj)) return obj;
      if (typeof obj !== 'object') return null;
      for (const [k, v] of Object.entries(obj)) {
        if (commonKeys.includes(k) && isValidDate(v)) return v;
        if (typeof v === 'string' && isValidDate(v)) return v;
        if (typeof v === 'object') {
          const found = scanObject(v, depth + 1);
          if (found) return found;
        }
      }
      return null;
    };

    return scanObject(ticketInfo) || null;
  };

  const resolveTransportDisplay = (pkg, orgIds = []) => {
    if (!pkg) return null;
    if (pkg.transport) return pkg.transport;
    if (pkg.transport_name) return pkg.transport_name;

    // transport_details can be an array; pick one that belongs to one of the agent orgIds
    const tDetails = pkg.transport_details;
    if (Array.isArray(tDetails) && tDetails.length) {
      // try to find a transport whose sector organization matches one of our orgIds
      for (const td of tDetails) {
        const sector = td.transport_sector_info || td.transport_sector || td.transport_sector_info?.organization ? td.transport_sector_info : null;
        const sectorOrg = sector?.organization ?? sector?.org ?? td.organization ?? null;
        if (sectorOrg != null && orgIds && orgIds.length) {
          for (const oid of orgIds) {
            if (String(sectorOrg) === String(oid)) {
              return sector.name || td.transport_sector_info?.name || td.transport_name || td.transport || null;
            }
          }
        }
      }
      // if none matched our orgIds, don't surface transport (respect org boundaries)
    }

    // Fallback: if transport_price exists and > 0, show Included
    if (pkg.transport_price) return 'Included';
    return null;
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
                        {/* Note: In loading state, clicking this would throw. It should be disabled or not shown. */}
                        <button className="btn text-white" id="btn" disabled>
                          Export Package
                        </button>
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
                          There are currently no umrah packages available for your organization (ID: {orgIds && orgIds.length ? orgIds.join(',') : 'N/A'}).
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
          .package-summary {
            background: #f7f8f9;
            border-radius: 10px;
            padding: 12px;
            height: auto;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            gap: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .package-summary h6 { margin: 0 0 6px 0; font-size: 16px; }
          .package-summary p { margin: 0 0 6px 0; line-height: .35; font-size: 14px; }
          .package-summary p.faint { color: #6c757d; font-size: 12px; margin-bottom: 2px; }
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
                      <Link to="#" className="btn text-white" id="btn" onClick={exportPackagesToPDF}>
                        Export Package
                      </Link>
                    </div>
                  </div>
                  <div className="row" ref={packagesRef}>
                    <div className="col-12">
                      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
                      {packageData.map((pkg, index) => {
                        const ticketInfo = pkg?.ticket_details?.[0]?.ticket_info || pkg?.ticket_info || pkg?.ticket;
                        // const tripDetails = ticketInfo?.trip_details || [];
                        // const flightFrom = tripDetails[0];
                        // const flightTo = tripDetails[1];
                        const airlineName = resolveAirlineName(pkg, ticketInfo) || (airlines.find((a) => String(a.id) === String(ticketInfo?.airline))?.name) || null;
                        // const airlineName = airline?.name || ticketInfo?.airline_name || "N/A";
                        // const packageType = (pkg?.package_type || pkg?.type || "Umrah").toString();

                        // Calculate prices for different room types
                        const sharingPrice = calculatePackagePrice(pkg, 'sharing');
                        const quintPrice = calculatePackagePrice(pkg, 'quint');
                        const quadPrice = calculatePackagePrice(pkg, 'quad');
                        const triplePrice = calculatePackagePrice(pkg, 'triple');
                        const doublePrice = calculatePackagePrice(pkg, 'double');
                        const singlePrice = calculatePackagePrice(pkg, 'single'); // Added single price

                        // The child/infant visa calculation — handled with robust fallbacks
                        const pickPkg = (obj, ...keys) => {
                          for (const k of keys) {
                            if (obj && obj[k] != null) return obj[k];
                          }
                          return undefined;
                        };

                        const adultVisa = Number(pickPkg(pkg, 'adault_visa_price', 'adault_visa_selling_price', 'adault_visa_selling', 'adault_visa_purchase_price') || 0);
                        const childVisa = Number(pickPkg(pkg, 'child_visa_price', 'child_visa_selling_price', 'child_visa_selling', 'child_visa_purchase_price') || 0);
                        const infantVisa = Number(pickPkg(pkg, 'infant_visa_price', 'infant_visa_selling_price', 'infant_visa_selling', 'infant_visa_purchase_price') || 0);
                        const ticketInfant = Number(pickPkg(ticketInfo || {}, 'infant_price') || 0);

                        const childPrices = Math.max(0, adultVisa - childVisa);
                        const infantPrices = ticketInfant + infantVisa;


                        return (
                          <div key={index} className="border rounded-3 mb-4 package-card" style={{padding: "24px", background: "white"}}>
                              <div className="row align-items-start">
                                <div className="col-lg-8">
                                {/* Title and Seats Row */}
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h4 className="fw-bold mb-0" style={{fontSize: "22px", color: "#333"}}>
                                      {pkg?.title || "Umrah Package"}
                                    </h4>
                                  </div>
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
                                {/* Hotel Prices - consolidated */}
                                <div className="mb-3">
                                  <h6 className="mb-2">Per Adult Package Price (Varies by Room Type)</h6>
                                  <div className="row g-2 text-center">
                                    <div className="col-4 col-sm-4 col-lg-2">
                                      <div className="text-uppercase fw-bold" style={{fontSize: "12px"}}>SHARING</div>
                                      <div className={sharingPrice > 0 ? "fw-bold text-primary" : "fw-bold text-muted"}>
                                        {sharingPrice > 0 ? `Rs. ${Number(sharingPrice || 0).toLocaleString()}/.` : "N/A"}
                                      </div>
                                      <small className="text-muted">per adult</small>
                                    </div>

                                    <div className="col-4 col-sm-4 col-lg-2">
                                      <div className="text-uppercase fw-bold" style={{fontSize: "12px"}}>QUINT</div>
                                      <div className={quintPrice > 0 ? "fw-bold text-primary" : "fw-bold text-muted"}>
                                        {quintPrice > 0 ? `Rs. ${Number(quintPrice || 0).toLocaleString()}/.` : "N/A"}
                                      </div>
                                      <small className="text-muted">per adult</small>
                                    </div>

                                    <div className="col-4 col-sm-4 col-lg-2">
                                      <div className="text-uppercase fw-bold" style={{fontSize: "12px"}}>QUAD BED</div>
                                      <div className={quadPrice > 0 ? "fw-bold text-primary" : "fw-bold text-muted"}>
                                        {quadPrice > 0 ? `Rs. ${Number(quadPrice || 0).toLocaleString()}/.` : "N/A"}
                                      </div>
                                      <small className="text-muted">per adult</small>
                                    </div>

                                    <div className="col-4 col-sm-4 col-lg-2">
                                      <div className="text-uppercase fw-bold" style={{fontSize: "12px"}}>TRIPLE BED</div>
                                      <div className={triplePrice > 0 ? "fw-bold text-primary" : "fw-bold text-muted"}>
                                        {triplePrice > 0 ? `Rs. ${Number(triplePrice || 0).toLocaleString()}/.` : "N/A"}
                                      </div>
                                      <small className="text-muted">per adult</small>
                                    </div>

                                    <div className="col-4 col-sm-4 col-lg-2">
                                      <div className="text-uppercase fw-bold" style={{fontSize: "12px"}}>DOUBLE BED</div>
                                      <div className={doublePrice > 0 ? "fw-bold text-primary" : "fw-bold text-muted"}>
                                        {doublePrice > 0 ? `Rs. ${Number(doublePrice || 0).toLocaleString()}/.` : "N/A"}
                                      </div>
                                      <small className="text-muted">per adult</small>
                                    </div>
                                    
                                    <div className="col-4 col-sm-4 col-lg-2">
                                      <div className="text-uppercase fw-bold" style={{fontSize: "12px"}}>SINGLE BED</div>
                                      <div className={singlePrice > 0 ? "fw-bold text-primary" : "fw-bold text-muted"}>
                                        {singlePrice > 0 ? `Rs. ${Number(singlePrice || 0).toLocaleString()}/.` : "N/A"}
                                      </div>
                                      <small className="text-muted">per adult</small>
                                    </div>

                                  </div>
                                </div>

                                {/* Child Discount & Infant Price */}
                                <div className="mb-3 d-flex gap-4" style={{fontSize: "13px"}}>
                                  {childPrices > 0 && (
                                    <div className="text-success">
                                      Per Child <span className="text-primary fw-bold">Rs {Number(childPrices).toLocaleString()}/.</span> discount.
                                    </div>
                                  )}
                                  <div className="text-info">
                                    Per Infant Price: <span className="text-primary fw-bold">Rs. {Number(infantPrices).toLocaleString()}/.</span>
                                  </div>
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
                              </div>

                              {/* Right Section (Summary) */}
                              <div className="col-lg-4">
                                <div className="package-summary">
                                  <h6 className="fw-bold mb-3 text-primary">Umrah Package</h6>

                                  <p className="text-muted small mb-1">Hotels:</p>
                                  <p className="fw-semibold mb-2">
                                    {pkg?.hotel_details?.[0]
                                      ? `${pkg.hotel_details[0].number_of_nights || 'N/A'} Nights at ${pkg.hotel_details[0].hotel_info?.name || 'N/A'}`
                                      : 'N/A'
                                    }
                                  </p>

                                  <p className="text-muted small mb-1">Umrah Visa:</p>
                                  <p className="fw-semibold mb-3">{pkg?.adault_visa_price !== undefined ? 'INCLUDED' : 'N/A'}</p>

                                  <p className="text-muted small mb-1">Transport:</p>
                                  <p className="fw-semibold mb-3">{resolveTransportDisplay(pkg, orgIds) || 'N/A'}</p>

                                  <p className="text-muted small mb-1">Flight:</p>
                                  <p className="fw-semibold mb-3">{airlineName || 'N/A'}</p>

                                  <p className="text-muted small mb-1">Travel Date:</p>
                                  <p className="fw-semibold mb-3">{resolveDateField(ticketInfo, 'departure_date') ? formatDateTime(resolveDateField(ticketInfo, 'departure_date')) : (resolveDateField(ticketInfo, 'departure') ? formatDateTime(resolveDateField(ticketInfo, 'departure')) : 'N/A')}</p>

                                  <p className="text-muted small mb-1">Return Date:</p>
                                  <p className="fw-semibold mb-3">{resolveDateField(ticketInfo, 'return_date') ? formatDateTime(resolveDateField(ticketInfo, 'return_date')) : (resolveDateField(ticketInfo, 'return') ? formatDateTime(resolveDateField(ticketInfo, 'return')) : 'N/A')}</p>

                                  <p className="text-muted small mb-1">ZAYARAT:</p>
                                  <p className="fw-semibold mb-3">{(pkg?.makkah_ziyarat_price || pkg?.madinah_ziyarat_price) ? 'YES' : 'N/A'}</p>

                                  <p className="text-muted small mb-1">FOOD:</p>
                                  <p className="fw-semibold mb-0">{pkg?.food_price > 0 ? 'INCLUDED' : 'N/A'}</p>
                                </div>
                              </div>
                            </div>
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

      {/* Booking Modal Call - COMPLETED THE MISSING JSX */}
      <RoomBookingModal
        pkg={selectedPackage}
        show={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        bedsPerRoomType={bedsPerRoomType}
        calculatePrice={calculatePackagePrice}
        rooms={selectedRooms}
        setRooms={setSelectedRooms}
      />
      {/* Details Modal Placeholder */}
      {showDetailsModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Package Details (Incomplete)</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Details for **{detailsPackage?.title}** would go here.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// --- Missing Export (Added) ---
export default AgentPackages;