import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Link,
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Lightweight JWT decoder to avoid bundle issues with ESM/CommonJS interop
const decodeJwt = (token) => {
  if (!token || typeof token !== "string") return {};
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    // Decode UTF-8 properly
    const jsonPayload = decodeURIComponent(
      Array.prototype.map
        .call(binary, (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    try {
      // fallback simple parse
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e2) {
      return {};
    }
  }
};

const tabs = [
  { name: "Umrah Package", path: "/packages" },
  { name: "Visa and others", path: "/packages/visa-and-other" },
];

const FlightModal = ({
  show,
  onClose,
  flights,
  onSelect,
  airlinesMap,
  citiesMap,
}) => {
  return (
    <div
      className={`modal ${show ? "d-block" : "d-none"}`}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Select Flight</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Airline</th>
                  <th>PNR</th>
                  <th>Trip Type</th>
                  <th>Departure</th>
                  <th>Return</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Adult Price</th>
                  <th>Child Price</th>
                  <th>Infant Price</th>
                  <th>Seats</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {flights.map((flightRaw) => {
                  // Support different API shapes: some endpoints return a wrapper
                  // object with `ticket_info` or `ticket`, others return the ticket
                  // fields at top-level. Normalize to `ticket` for rendering.
                  const ticket = flightRaw.ticket_info ?? flightRaw.ticket ?? flightRaw;

                  // Prefer explicit trip_type markers, but fall back to the
                  // first trip_details element when trip_type is not provided
                  // (many ticket objects only include an array of segments).
                  const departureTrip =
                    ticket.trip_details?.find((t) => ((t && t.trip_type) ? String(t.trip_type).toLowerCase() : "") === "departure")
                    || (ticket.trip_details && ticket.trip_details.length > 0 ? ticket.trip_details[0] : undefined);
                  const returnTrip =
                    ticket.trip_details?.find((t) => ((t && t.trip_type) ? String(t.trip_type).toLowerCase() : "") === "return")
                    || undefined;

                  const safeNumber = (v) => {
                    const n = Number(v);
                    return Number.isFinite(n) ? n : 0;
                  };

                  const formatPrice = (v) => {
                    try {
                      return safeNumber(v).toLocaleString();
                    } catch (e) {
                      return String(v || "0");
                    }
                  };

                  const airlineName = airlinesMap[ticket.airline ?? ticket.airline_id]?.name || "N/A";
                  const pnr = ticket.pnr ?? ticket.ticket_pnr ?? "N/A";
                  const seats = ticket.left_seats ?? flightRaw.left_seats ?? "N/A";

                  return (
                    <tr key={ticket.id ?? flightRaw.id}>
                      <td>{airlineName}</td>
                      <td>{pnr}</td>
                      <td>
                        {ticket.trip_type ? ticket.trip_type : (returnTrip ? "Round Trip" : "One Way")}
                        {ticket.is_umrah_seat && " (Umrah)"}
                      </td>
                      <td>
                        {departureTrip?.departure_date_time
                          ? new Date(departureTrip.departure_date_time).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : departureTrip?.departure_date || departureTrip?.departure_date_time || "N/A"}
                      </td>
                      <td>
                        {returnTrip?.arrival_date_time
                          ? new Date(returnTrip.arrival_date_time).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : returnTrip?.arrival_date || returnTrip?.arrival_date_time || "-"}
                      </td>
                      <td>
                        {departureTrip?.departure_city
                          ? (citiesMap[departureTrip.departure_city]?.code || citiesMap[departureTrip.departure_city]?.name || "-")
                          : "N/A"}
                      </td>
                      <td>
                        {departureTrip?.arrival_city
                          ? (citiesMap[departureTrip.arrival_city]?.code || citiesMap[departureTrip.arrival_city]?.name || "-")
                          : "-"}
                      </td>
                      <td className="text-success fw-bold">Rs. {formatPrice(ticket.adult_price ?? ticket.adult_fare ?? ticket.adultFare ?? ticket.adult ?? ticket.adault_price ?? 0)}</td>
                      <td className="text-success fw-bold">Rs. {formatPrice(ticket.child_price ?? ticket.child_fare ?? ticket.childFare ?? ticket.child ?? 0)}</td>
                      <td className="text-success fw-bold">Rs. {formatPrice(ticket.infant_price ?? ticket.infant_fare ?? ticket.infantFare ?? ticket.infant ?? 0)}</td>
                      <td>{seats}</td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => onSelect(ticket)}>
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddPackages = ({ mode = "add" }) => {
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [originalPackageData, setOriginalPackageData] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState(() => {
    try {
      const raw = localStorage.getItem("selectedOrganization");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // If stored value is a primitive (id only), normalize to object
      if (typeof parsed === "number" || typeof parsed === "string") {
        return { id: Number(parsed), name: "" };
      }
      // If already an object with id, return as-is
      if (parsed && (parsed.id || parsed.id === 0)) return parsed;
      return null;
    } catch (e) {
      return null;
    }
  });
  const organizationId = selectedOrganization?.id;

  const [packageTitle, setPackageTitle] = useState("");
  const [rules, setRules] = useState("");
  const [totalSeats, setTotalSeats] = useState(0);
  // Visa prices: keep selling & purchase separately
  const [adultVisaSellingPrice, setAdultVisaSellingPrice] = useState(0);
  const [adultVisaPurchasePrice, setAdultVisaPurchasePrice] = useState(0);
  const [childVisaSellingPrice, setChildVisaSellingPrice] = useState(0);
  const [childVisaPurchasePrice, setChildVisaPurchasePrice] = useState(0);
  const [infantVisaSellingPrice, setInfantVisaSellingPrice] = useState(0);
  const [infantVisaPurchasePrice, setInfantVisaPurchasePrice] = useState(0);
  // Extras: food / ziyaarat / transport with selling & purchase
  const [foodSellingPrice, setFoodSellingPrice] = useState(0);
  const [foodPurchasePrice, setFoodPurchasePrice] = useState(0);
  // Dropdown options from backend
  const [foodOptions, setFoodOptions] = useState([]);
  const [ziaratOptions, setZiyaratOptions] = useState([]);

  // Helper to pick a sensible display label from backend option objects
  const getOptionLabel = (opt) => {
    if (!opt) return "";
    return (
      // Prefer explicit meal_type if present (daily food uses this)
      opt.meal_type ||
      opt.meal_type_name ||
      opt.food_name ||
      opt.ziarat_title ||
      opt.name ||
      opt.title ||
      opt.display_name ||
      opt.label ||
      opt.name_en ||
      (opt.id ? `#${opt.id}` : "")
    );
  };

  // Debug when options change so we can inspect backend shapes
  useEffect(() => {
    try {
      console.debug("foodOptions count:", Array.isArray(foodOptions) ? foodOptions.length : 0, "sample:", foodOptions[0]);
    } catch (e) {}
  }, [foodOptions]);

  useEffect(() => {
    try {
      console.debug("ziaratOptions count:", Array.isArray(ziaratOptions) ? ziaratOptions.length : 0, "sample:", ziaratOptions[0]);
    } catch (e) {}
  }, [ziaratOptions]);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [selectedMeccaZiyaratId, setSelectedMeccaZiyaratId] = useState("");
  const [selectedMadinaZiyaratId, setSelectedMadinaZiyaratId] = useState("");
  const [meccaZiyaaratSellingPrice, setMeccaZiyaaratSellingPrice] = useState(0);
  const [meccaZiyaaratPurchasePrice, setMeccaZiyaaratPurchasePrice] = useState(0);
  const [madinaZiyaaratSellingPrice, setMadinaZiyaaratSellingPrice] = useState(0);
  const [madinaZiyaaratPurchasePrice, setMadinaZiyaaratPurchasePrice] = useState(0);
  const [transportSellingPrice, setTransportSellingPrice] = useState(0);
  const [transportPurchasePrice, setTransportPurchasePrice] = useState(0);
  const [isQuaintActive, setIsQuaintActive] = useState(true);
  const [isSharingActive, setIsSharingActive] = useState(true);
  const [isQuadActive, setIsQuadActive] = useState(true);
  const [isTripleActive, setIsTripleActive] = useState(true);
  const [isDoubleActive, setIsDoubleActive] = useState(true);
  const [adaultPartialPayment, setAdultPartialPayment] = useState(0);
  const [childPartialPayment, setChildPartialPayment] = useState(0);
  const [infantPartialPayment, setInfantPartialPayment] = useState(0);
  const [partialTrue, setPartialTrue] = useState(false);
  const [adultFrom, setAdultFrom] = useState(0);
  const [adultTo, setAdultTo] = useState(0);
  const [maxChilds, setMaxChilds] = useState(0);
  const [maxInfants, setMaxInfants] = useState(0);
  const [chargePerAdult, setChargePerAdult] = useState(0);
  const [chargePerChild, setChargePerChild] = useState(0);
  const [chargePerInfant, setChargePerInfant] = useState(0);
  const [activeServiceCharge, setActiveServiceCharge] = useState(false);
  // Helper to show empty input when value is zero so placeholder is visible
  const displayIfNonZero = (v) => {
    if (v === 0 || v === "0" || v === 0.0) return "";
    return v ?? "";
  };

  // Dev helper: create a minimal test package for organization 11
  const testCreatePackage = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Not authenticated — please log in.");
        navigate("/login");
        return;
      }

      // Persist selectedOrganization to help other components
      try {
        localStorage.setItem("selectedOrganization", JSON.stringify({ id: 11, name: "Org 11" }));
        setSelectedOrganization({ id: 11, name: "Org 11" });
      } catch (e) {}

      const baseUrl = "http://127.0.0.1:8000/api/umrah-packages/";
      const requestUrl = `${baseUrl}?organization=11`;

      // Minimal payload accepted by backend for testing
      const payload = {
        title: "Test Package (org 11)",
        hotel_details: [],
        transport_details: [],
        ticket_details: [],
        discount_details: [],
        inclusions: [],
        exclusions: [],
        package_type: "umrah",
        status: "active",
        start_date: null,
        end_date: null,
        total_seats: 1,
        max_capacity: 1,
        inventory_owner_organization_id: 11,
        organization: 11,
        is_active: true,
        reselling_allowed: false,
      };

      console.debug("testCreatePackage: sending payload", payload);

      const res = await axios.post(requestUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.debug("testCreatePackage: response", res);
      toast.success("Test package created (org 11) — check network/console for details.");
    } catch (err) {
      console.error("testCreatePackage error:", err, err?.response?.data);
      if (err?.response?.status === 403) {
        toast.error("403 creating test package — backend reports insufficient permissions or missing organization param.");
      } else {
        toast.error("Failed to create test package — see console for details.");
      }
    }
  };

  // Dev helper: quick backend connectivity check for key endpoints (org 11)
  const checkBackendConnection = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Not authenticated — please log in.");
      navigate("/login");
      return;
    }

    const endpoints = [
      { name: "Food Prices", url: "http://127.0.0.1:8000/api/food-prices/?organization=11" },
      { name: "Ziarat Prices", url: "http://127.0.0.1:8000/api/ziarat-prices/?organization=11" },
      { name: "Tickets", url: "http://127.0.0.1:8000/api/tickets/?organization=11" },
    ];

    for (const ep of endpoints) {
      try {
        console.debug(`checkBackendConnection: requesting ${ep.name} -> ${ep.url}`);
        const res = await axios.get(ep.url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.debug(`checkBackendConnection: ${ep.name} response:`, res?.data?.length ?? res?.data ?? res);
        toast.success(`${ep.name} reachable (status ${res.status})`);
      } catch (err) {
        console.error(`checkBackendConnection: ${ep.name} failed:`, err, err?.response?.data);
        if (err?.response?.status === 403) {
          toast.error(`${ep.name} returned 403 — check organization param and permissions`);
        } else {
          toast.error(`${ep.name} check failed — see console`);
        }
      }
    }
  };
  const [packageStatus, setPackageStatus] = useState(true);
  const [resellingAllowed, setResellingAllowed] = useState(false);

  const [hotels, setHotels] = useState([
    {
      hotelName: "",
      hotelId: 0,
      checkIn: "",
      nights: "",
      checkOut: "",
      // For each bed type we now keep selling and purchasing prices
      sharingSellingPrice: "",
      sharingPurchasePrice: "",
      quintSellingPrice: "",
      quintPurchasePrice: "",
      quadSellingPrice: "",
      quadPurchasePrice: "",
      tripleSellingPrice: "",
      triplePurchasePrice: "",
      doubleSellingPrice: "",
      doublePurchasePrice: "",
    },
  ]);

  const [routes, setRoutes] = useState([
    {
      transportType: "",
      transportSector: "",
      transportSellingPrice: "",
      transportPurchasePrice: "",
    },
  ]);

  const [discounts, setDiscounts] = useState([
    {
      discountAdultFrom: "",
      discountAdultTo: "",
      maxDiscount: "",
    },
  ]);

  const [showFlightModal, setShowFlightModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);



  const [flightNumber, setFlightNumber] = useState("");
  const [airlineName, setAirlineName] = useState("");
  const [fromSector, setFromSector] = useState("");
  const [toSector, setToSector] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [ticketId, setTicketId] = useState(0);
  const [pnr, setPnr] = useState("");
  const [returnAirline, setReturnAirline] = useState("");
  const [returnFromSector, setReturnFromSector] = useState("");
  const [returnFlightNumber, setReturnFlightNumber] = useState("");
  const [returnToSector, setReturnToSector] = useState("");
  const [returnDepartureDate, setReturnDepartureDate] = useState("");
  const [returnReturnDate, setReturnReturnDate] = useState("");
  const [withoutFlight, setWithoutFlight] = useState(false);
  const [selfTransport, setSelfTransport] = useState(false);
  const [flightOptions, setFlightOptions] = useState("select");
  const [showCustomTicketModal, setShowCustomTicketModal] = useState(false);

  const [hotelsList, setHotelsList] = useState([]);
  const [ticketsList, setTicketsList] = useState([]);
  const [transportSectors, setTransportSectors] = useState([]);
  const [airlinesMap, setAirlinesMap] = useState({});
  const [citiesMap, setCitiesMap] = useState({});

  const { id } = useParams();
  const navigate = useNavigate();

  // Ensure selectedOrganization is set
  useEffect(() => {
    const ensureOrganization = async () => {
      const token = localStorage.getItem("accessToken");

      if (!selectedOrganization && token) {
        try {
          // Decode JWT token to get user ID
          const decoded = decodeJwt(token);
          const userId = decoded.user_id || decoded.id;

          const userRes = await axios.get(`http://127.0.0.1:8000/api/users/${userId}/`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const userOrgs = userRes.data.organization_details || [];
          if (userOrgs.length > 0) {
            const orgData = { id: userOrgs[0].id, name: userOrgs[0].name };
            localStorage.setItem("selectedOrganization", JSON.stringify(orgData));
            setSelectedOrganization(orgData);
          }
        } catch (err) {
          console.error("Failed to fetch user organizations", err);
        }
      }
    };

    ensureOrganization();
  }, [selectedOrganization]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Wait until we have an organization selected before making API calls
    if (!organizationId) {
      // ensureOrganization effect will populate selectedOrganization shortly
      return;
    }

    if (!organizationId) {
      // Organization not yet selected; skip fetching until it's available
      return;
    }

    if (mode === "edit") {
      const fetchPackageData = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await axios.get(
            `http://127.0.0.1:8000/api/umrah-packages/${id}/`,
            {
              params: { organization: organizationId },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          try {
            console.debug("fetchPackageData: transport_details from server:", response.data.transport_details);
          } catch (e) {}
          setOriginalPackageData(response.data);
          populateFormData(response.data);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching package data:", error);
          toast.error("Failed to load package data");
          setIsLoading(false);
        }
      };

      fetchPackageData();
    }

    fetchHotels();
    fetchTickets();
    fetchTransportSectors();
    fetchAirlines();
    fetchCities();
    fetchFoodOptions();
    fetchZiaratOptions();
  }, [id, mode, organizationId]);

  const populateFormData = (pkgData) => {
    // Debug: log incoming hotel_details to help diagnose missing selling/purchase values
    try {
      console.debug("populateFormData incoming hotel_details:", pkgData?.hotel_details);
    } catch (e) {
      // ignore console errors in non-browser env
    }
    setPackageTitle(pkgData.title);
    setRules(pkgData.rules);
    setTotalSeats(pkgData.total_seats);
  // Visa prices: prefer explicit selling/purchase fields if present
  setAdultVisaSellingPrice(pkgData.adault_visa_selling_price ?? pkgData.adault_visa_price ?? 0);
  setAdultVisaPurchasePrice(pkgData.adault_visa_purchase_price ?? 0);
  setChildVisaSellingPrice(pkgData.child_visa_selling_price ?? pkgData.child_visa_price ?? 0);
  setChildVisaPurchasePrice(pkgData.child_visa_purchase_price ?? 0);
  setInfantVisaSellingPrice(pkgData.infant_visa_selling_price ?? pkgData.infant_visa_price ?? 0);
  setInfantVisaPurchasePrice(pkgData.infant_visa_purchase_price ?? 0);

  // Extras (food, ziyaarat, transport)
  setFoodSellingPrice(pkgData.food_selling_price ?? pkgData.food_price ?? 0);
  setFoodPurchasePrice(pkgData.food_purchase_price ?? 0);
  // Selected option ids (if backend provides them)
  setSelectedFoodId(pkgData.food_price_id ?? "");
  setMeccaZiyaaratSellingPrice(pkgData.makkah_ziyarat_selling_price ?? pkgData.makkah_ziyarat_price ?? 0);
  setMeccaZiyaaratPurchasePrice(pkgData.makkah_ziyarat_purchase_price ?? 0);
  setSelectedMeccaZiyaratId(pkgData.makkah_ziyarat_id ?? "");
  setMadinaZiyaaratSellingPrice(pkgData.madinah_ziyarat_selling_price ?? pkgData.madinah_ziyarat_price ?? 0);
  setMadinaZiyaaratPurchasePrice(pkgData.madinah_ziyarat_purchase_price ?? 0);
  setSelectedMadinaZiyaratId(pkgData.madinah_ziyarat_id ?? "");
  setTransportSellingPrice(pkgData.transport_selling_price ?? pkgData.transport_price ?? 0);
  setTransportPurchasePrice(pkgData.transport_purchase_price ?? 0);
  // Tax rate field removed from form - backend will use default or existing value

    // Populate hotel details
    const hotelDetails = pkgData.hotel_details.map((hotel) => ({
      hotelName: hotel.hotel_info?.name || "",
      hotelId: hotel.hotel,
      checkIn: (() => {
        const d = hotel.check_in_date ?? hotel.check_in_time ?? hotel.check_in ?? hotel.checkIn ?? null;
        return d ? formatDateForInput(new Date(d)) : "";
      })(),
      nights: (() => {
        const n = hotel.number_of_nights ?? hotel.number_of_nights_count ?? hotel.nights ?? hotel.numberOfNights ?? "";
        return n !== null && n !== undefined ? (String(n) === "" ? "" : Number(n)) : "";
      })(),
      checkOut: (() => {
        const d = hotel.check_out_date ?? hotel.check_out_time ?? hotel.check_out ?? hotel.checkOut ?? null;
        return d ? formatDateForInput(new Date(d)) : "";
      })(),
      // try to populate new selling/purchase fields if backend provides them,
      // fall back to existing single price fields for compatibility
      // Treat a selling price of 0 as "not provided" and fall back to legacy price
      sharingSellingPrice:
        (hotel.sharing_bed_selling_price && Number(hotel.sharing_bed_selling_price) > 0)
          ? hotel.sharing_bed_selling_price
          : hotel.sharing_bed_price || "",
      sharingPurchasePrice:
        (hotel.sharing_bed_purchase_price && Number(hotel.sharing_bed_purchase_price) > 0)
          ? hotel.sharing_bed_purchase_price
          : "",
      quintSellingPrice:
        (hotel.quaint_bed_selling_price && Number(hotel.quaint_bed_selling_price) > 0)
          ? hotel.quaint_bed_selling_price
          : hotel.quaint_bed_price || "",
      quintPurchasePrice:
        (hotel.quaint_bed_purchase_price && Number(hotel.quaint_bed_purchase_price) > 0)
          ? hotel.quaint_bed_purchase_price
          : "",
      quadSellingPrice:
        (hotel.quad_bed_selling_price && Number(hotel.quad_bed_selling_price) > 0)
          ? hotel.quad_bed_selling_price
          : hotel.quad_bed_price || "",
      quadPurchasePrice:
        (hotel.quad_bed_purchase_price && Number(hotel.quad_bed_purchase_price) > 0)
          ? hotel.quad_bed_purchase_price
          : "",
      tripleSellingPrice:
        (hotel.triple_bed_selling_price && Number(hotel.triple_bed_selling_price) > 0)
          ? hotel.triple_bed_selling_price
          : hotel.triple_bed_price || "",
      triplePurchasePrice:
        (hotel.triple_bed_purchase_price && Number(hotel.triple_bed_purchase_price) > 0)
          ? hotel.triple_bed_purchase_price
          : "",
      doubleSellingPrice:
        (hotel.double_bed_selling_price && Number(hotel.double_bed_selling_price) > 0)
          ? hotel.double_bed_selling_price
          : hotel.double_bed_price || "",
      doublePurchasePrice:
        (hotel.double_bed_purchase_price && Number(hotel.double_bed_purchase_price) > 0)
          ? hotel.double_bed_purchase_price
          : "",
    }));
    setHotels(hotelDetails);
    try {
      console.debug("populateFormData set hotels:", hotelDetails);
    } catch (e) {}

    // Populate transport details (guard against undefined and log for debugging)
    const transportDetails = (pkgData.transport_details || []).map((transport) => ({
      transportType: transport.vehicle_type,
      // transport_sector may be an id or nested object `transport_sector_info`
      transportSector: transport.transport_sector || transport.transport_sector_info?.id || "",
      // Prefer explicit fields on the transport object, then transport_sector_info prices,
      // then fall back to package-level transport price fields for compatibility.
      transportSellingPrice:
        transport.transport_selling_price ??
        transport.transport_sector_info?.adault_price ??
        pkgData.transport_selling_price ??
        "",
      transportPurchasePrice:
        transport.transport_purchase_price ??
        pkgData.transport_purchase_price ??
        "",
    }));
    try {
      console.debug("populateFormData transport_details raw:", pkgData.transport_details, "computed:", transportDetails);
    } catch (e) {}
    // Ensure the transport UI still renders on edit even when there are no
    // transport_details returned by the server. We keep a single empty route
    // so the user can add transport info.
    const finalTransportDetails = transportDetails.length > 0
      ? transportDetails
      : [
          {
            transportType: "",
            transportSector: "",
            transportSellingPrice: "",
            transportPurchasePrice: "",
          },
        ];
    setRoutes(finalTransportDetails);
    setSelfTransport(transportDetails.length === 0);

    // Populate ticket details
    if (pkgData.ticket_details?.length > 0) {
      const ticket = pkgData.ticket_details[0].ticket_info;
      setSelectedFlight(ticket);
      setTicketId(ticket.id);
      setPnr(ticket.pnr);
      setFlightOptions("select");

      // Set flight details
      const departureTrip = ticket.trip_details?.find(
        (t) => (t.trip_type || "").toLowerCase() === "departure"
      );
      if (departureTrip) {
        setAirlineName(airlinesMap[ticket.airline]?.name || "");
        setFlightNumber(departureTrip.flight_number || "");
        setFromSector(citiesMap[departureTrip.departure_city]?.code || "");
        setToSector(citiesMap[departureTrip.arrival_city]?.code || "");
        setDepartureDate(
          departureTrip.departure_date_time
            ? formatDateTimeForInput(departureTrip.departure_date_time)
            : ""
        );
        setReturnDate(
          departureTrip.arrival_date_time
            ? formatDateTimeForInput(departureTrip.arrival_date_time)
            : ""
        );
      }
    } else {
      setWithoutFlight(true);
      setFlightOptions("none");
    }

    // Populate discount details
    const discountDetails = pkgData.discount_details.map((discount) => ({
      discountAdultFrom: discount.adault_from,
      discountAdultTo: discount.adault_to,
      maxDiscount: discount.max_discount,
    }));
    setDiscounts(discountDetails);

    // Populate other fields
    setIsQuaintActive(pkgData.is_quaint_active);
    setIsSharingActive(pkgData.is_sharing_active);
    setIsQuadActive(pkgData.is_quad_active);
    setIsTripleActive(pkgData.is_triple_active);
    setIsDoubleActive(pkgData.is_double_active);
    setAdultPartialPayment(pkgData.adault_partial_payment);
    setChildPartialPayment(pkgData.child_partial_payment);
    setInfantPartialPayment(pkgData.infant_partial_payment);
    setPartialTrue(pkgData.is_partial_payment_active);
    setAdultFrom(pkgData.filght_min_adault_age);
    setAdultTo(pkgData.filght_max_adault_age);
    setMaxChilds(pkgData.max_chilld_allowed);
    setMaxInfants(pkgData.max_infant_allowed);
    setChargePerAdult(pkgData.adault_service_charge);
    setChargePerChild(pkgData.child_service_charge);
    setChargePerInfant(pkgData.infant_service_charge);
    setActiveServiceCharge(pkgData.is_service_charge_active);
    setPackageStatus(pkgData.is_active);
    setResellingAllowed(
      pkgData.reselling_allowed === true ||
      pkgData.reselling_allowed === "true" ||
      pkgData.reselling_allowed === 1 ||
      pkgData.reselling_allowed === "1"
    );
  };

  const fetchHotels = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Not authenticated — please log in.");
        navigate("/login");
        return;
      }

      const params = {};
      if (organizationId) params.organization = organizationId;

      const response = await axios.get("http://127.0.0.1:8000/api/hotels/", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Normalize response: support arrays and paginated { results: [] }
      let data = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];

      // Fallback: if org-scoped request returned empty, try global list
      if (data.length === 0 && organizationId) {
        const fallback = await axios.get("http://127.0.0.1:8000/api/hotels/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = Array.isArray(fallback.data) ? fallback.data : fallback.data?.results ?? [];
      }

      setHotelsList(data);
    } catch (error) {
      console.error("Error fetching hotels:", error, error?.response?.status, error?.response?.data);
      if (error?.response?.status === 403) {
        toast.error("Access denied (403) when fetching hotels — your token may be expired or your account lacks permissions.");
      } else if (error?.code === "ECONNREFUSED" || error?.message?.includes("Network Error")) {
        toast.error("Cannot reach backend API — is the server running? (check http://127.0.0.1:8000)");
      } else {
        toast.error(error?.response?.data?.detail || "Failed to fetch hotels");
      }
      setHotelsList([]);
    }
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Not authenticated — please log in.");
        navigate("/login");
        return;
      }

      // Debug: show what organizationId we will send
      try {
        console.debug("fetchTickets: organizationId ->", organizationId);
      } catch (e) {}

      // Build URL explicitly including the organization query param to avoid
      // any serializer/interceptor removing params unexpectedly.
      const baseUrl = "http://127.0.0.1:8000/api/tickets/";
      const requestUrl = organizationId
        ? `${baseUrl}?organization=${encodeURIComponent(organizationId)}`
        : baseUrl;

      const response = await axios.get(requestUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];

      if (data.length === 0 && organizationId) {
        const fallback = await axios.get("http://127.0.0.1:8000/api/tickets/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = Array.isArray(fallback.data) ? fallback.data : fallback.data?.results ?? [];
      }

      setTicketsList(data);
    } catch (error) {
      console.error("Error fetching tickets:", error, error?.response?.status, error?.response?.data);
      if (error?.response?.status === 403) {
        toast.error("Access denied (403) when fetching tickets — token may be expired or you lack permissions. Please log in again.");
        // Extra debug when backend reports missing organization parameter
        try {
          const raw = localStorage.getItem("selectedOrganization");
          console.debug("fetchTickets: selectedOrganization (raw):", raw);
        } catch (e) {}
        // Optionally clear token to force re-auth
        // localStorage.removeItem('accessToken');
      } else if (error?.code === "ECONNREFUSED" || error?.message?.includes("Network Error") || error?.message?.includes("ECONNRESET")) {
        toast.error("Cannot reach backend API — is the server running? (check http://127.0.0.1:8000)");
      } else {
        toast.error(error?.response?.data?.detail || "Failed to fetch tickets");
      }
      setTicketsList([]);
    }
  };

  const fetchTransportSectors = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Not authenticated — please log in.");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://127.0.0.1:8000/api/transport-sector-prices/",
        {
          params: { organization: organizationId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTransportSectors(response.data);
    } catch (error) {
      console.error("Error fetching transport sectors:", error, error?.response?.status, error?.response?.data);
      if (error?.response?.status === 403) {
        toast.error("Access denied (403) when fetching transport sectors — check permissions or token.");
      } else if (error?.code === "ECONNREFUSED" || error?.message?.includes("Network Error")) {
        toast.error("Cannot reach backend API — is the server running? (check http://127.0.0.1:8000)");
      } else {
        toast.error("Failed to fetch transport sectors");
      }
      setTransportSectors([]);
    }
  };

  const fetchFoodOptions = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const params = {};
      if (organizationId) params.organization = organizationId;
      const response = await axios.get("http://127.0.0.1:8000/api/food-prices/", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];
      if (Array.isArray(data) && data.length > 0) {
        setFoodOptions(data);
        try { console.debug("fetchFoodOptions: loaded from /api/food-prices/ count:", data.length); } catch(e){}
      } else {
        // Fallback: some deployments expose daily food endpoint with names at /api/daily/food/
        try {
          const fallbackUrl = "http://127.0.0.1:8000/api/daily/food/" + (organizationId ? `?organization=${encodeURIComponent(organizationId)}` : "");
          console.debug("fetchFoodOptions: falling back to", fallbackUrl);
          const fb = await axios.get(fallbackUrl, { headers: { Authorization: `Bearer ${token}` } });
          // Normalize possible shapes from daily food API into {id, name, selling_price, purchase_price}
          // daily/food returns an object { date, meals: [...] } whereas other endpoints return arrays.
          let fbData = [];
          if (Array.isArray(fb.data)) {
            fbData = fb.data;
          } else if (Array.isArray(fb.data?.results)) {
            fbData = fb.data.results;
          } else if (Array.isArray(fb.data?.meals)) {
            fbData = fb.data.meals;
          } else if (Array.isArray(fb.data?.meals_list)) {
            fbData = fb.data.meals_list;
          }

          fbData = fbData.map((item, idx) => {
            // If the item has meal_type, prefer using that as the display label.
            const mealType = item.meal_type || item.meal_type_name;
            return {
              id: item.id ?? item.food_id ?? item.booking_id ?? mealType ?? idx,
              name:
                mealType && typeof mealType === "string"
                  ? (mealType.charAt(0).toUpperCase() + mealType.slice(1))
                  : item.name ?? item.food_name ?? item.title ?? item.display_name ?? item.meal_name ?? `#${item.id ?? idx}`,
              selling_price: item.selling_price ?? item.price ?? item.cost ?? null,
              purchase_price: item.purchase_price ?? item.cost_price ?? null,
              raw: item,
            };
          });
          setFoodOptions(fbData);
          try { console.debug("fetchFoodOptions: loaded from /api/daily/food/ count:", fbData.length); } catch(e){}
        } catch (fbErr) {
          console.error("fetchFoodOptions fallback error:", fbErr);
          setFoodOptions([]);
        }
      }
    } catch (error) {
      console.error("Error fetching food options:", error);
    }
  };

  const fetchZiaratOptions = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const params = {};
      if (organizationId) params.organization = organizationId;
      const response = await axios.get("http://127.0.0.1:8000/api/ziarat-prices/", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];
      setZiyaratOptions(data);
      try { console.debug("fetchZiaratOptions: loaded", Array.isArray(data) ? data.slice(0,3) : data); } catch(e) {}
    } catch (error) {
      console.error("Error fetching ziarat options:", error);
    }
  };

  const fetchAirlines = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Not authenticated — please log in.");
        navigate("/login");
        return;
      }

      const params = {};
      if (organizationId) params.organization = organizationId;

      const response = await axios.get("http://127.0.0.1:8000/api/airlines/", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];

      if (data.length === 0 && organizationId) {
        const fallback = await axios.get("http://127.0.0.1:8000/api/airlines/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = Array.isArray(fallback.data) ? fallback.data : fallback.data?.results ?? [];
      }

      const map = {};
      data.forEach((airline) => {
        map[airline.id] = { name: airline.name };
      });
      setAirlinesMap(map);
    } catch (error) {
      console.error("Error fetching airlines:", error, error?.response?.status, error?.response?.data);
      if (error?.response?.status === 403) {
        toast.error("Access denied (403) when fetching airlines — check permissions or token.");
      } else if (error?.code === "ECONNREFUSED" || error?.message?.includes("Network Error")) {
        toast.error("Cannot reach backend API — is the server running? (check http://127.0.0.1:8000)");
      } else {
        toast.error("Failed to fetch airlines");
      }
    }
  };

  const fetchCities = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Not authenticated — please log in.");
        navigate("/login");
        return;
      }

      const params = {};
      if (organizationId) params.organization = organizationId;

      const response = await axios.get("http://127.0.0.1:8000/api/cities/", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];

      if (data.length === 0 && organizationId) {
        // try global fallback
        const fallback = await axios.get("http://127.0.0.1:8000/api/cities/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = Array.isArray(fallback.data) ? fallback.data : fallback.data?.results ?? [];
      }

      const map = {};
      data.forEach((city) => {
        map[city.id] = { code: city.code, name: city.name };
      });
      setCitiesMap(map);
    } catch (error) {
      console.error("Error fetching cities:", error, error?.response?.status, error?.response?.data);
      if (error?.response?.status === 403) {
        toast.error("Access denied (403) when fetching cities — check permissions or token.");
      } else if (error?.code === "ECONNREFUSED" || error?.message?.includes("Network Error")) {
        toast.error("Cannot reach backend API — is the server running? (check http://127.0.0.1:8000)");
      } else {
        toast.error("Failed to fetch cities");
      }
    }
  };

  const handleFlightSelect = (flight) => {
    setSelectedFlight(flight);
    setTicketId(flight.id);
    setPnr(flight.pnr);

    // Process departure trip
    const departureTrip = flight.trip_details?.find(
      (t) => t.trip_type === "departure"
    );
    if (departureTrip) {
      setAirlineName(airlinesMap[flight.airline]?.name || "");
      setFlightNumber(departureTrip.flight_number || "");
      setFromSector(citiesMap[departureTrip.departure_city]?.code || "");
      setToSector(citiesMap[departureTrip.arrival_city]?.code || "");

      if (departureTrip.departure_date_time) {
        setDepartureDate(
          formatDateTimeForInput(departureTrip.departure_date_time)
        );
      }
      if (departureTrip.arrival_date_time) {
        setReturnDate(formatDateTimeForInput(departureTrip.arrival_date_time));
      }
    }

    // Process return trip
    const returnTrip = flight.trip_details?.find(
      (t) => t.trip_type === "return"
    );
    if (returnTrip) {
      setReturnAirline(airlinesMap[flight.airline]?.name || "");
      setReturnFlightNumber(returnTrip.flight_number || "");
      setReturnFromSector(citiesMap[returnTrip.departure_city]?.code || "");
      setReturnToSector(citiesMap[returnTrip.arrival_city]?.code || "");

      if (returnTrip.departure_date_time) {
        setReturnDepartureDate(
          formatDateTimeForInput(returnTrip.departure_date_time)
        );
      }
      if (returnTrip.arrival_date_time) {
        setReturnReturnDate(
          formatDateTimeForInput(returnTrip.arrival_date_time)
        );
      }
    }

    setShowFlightModal(false);
  };

  const resetFlightFields = () => {
    setPnr("");
    setAirlineName("");
    setFlightNumber("");
    setFromSector("");
    setToSector("");
    setDepartureDate("");
    setReturnDate("");
    setReturnAirline("");
    setReturnFlightNumber("");
    setReturnFromSector("");
    setReturnToSector("");
    setReturnDepartureDate("");
    setReturnReturnDate("");
    setTicketId(0);
  };

  const formatDateTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toISOString().slice(0, 16);
  };

  const handleWithoutFlightChange = (e) => {
    const isChecked = e.target.checked;
    setWithoutFlight(isChecked);

    if (isChecked) {
      resetFlightFields();
      setSelectedFlight(null);
    }
  };

  const addHotel = () => {
    setHotels([
      ...hotels,
      {
        hotelName: "",
        hotelId: 0,
        checkIn: "",
        nights: "",
        checkOut: "",
        sharingSellingPrice: "",
        sharingPurchasePrice: "",
        quintSellingPrice: "",
        quintPurchasePrice: "",
        quadSellingPrice: "",
        quadPurchasePrice: "",
        tripleSellingPrice: "",
        triplePurchasePrice: "",
        doubleSellingPrice: "",
        doublePurchasePrice: "",
      },
    ]);
  };

  const addRoute = () => {
    setRoutes([
      ...routes,
      {
        transportType: "",
        transportSector: "",
        transportSellingPrice: "",
        transportPurchasePrice: "",
      },
    ]);
  };

  const addDiscount = () => {
    setDiscounts([
      ...discounts,
      {
        discountAdultFrom: "",
        discountAdultTo: "",
        maxDiscount: "",
      },
    ]);
  };

  const handleHotelChange = (index, field, value) => {
    const updatedHotels = [...hotels];
    updatedHotels[index][field] = value;
    setHotels(updatedHotels);
  };

  const handleRouteChange = (index, field, value) => {
    const updatedRoutes = [...routes];
    updatedRoutes[index][field] = value;
    setRoutes(updatedRoutes);
  };

  const handleDiscountChange = (index, field, value) => {
    const updatedDiscounts = [...discounts];
    updatedDiscounts[index][field] = value;
    setDiscounts(updatedDiscounts);
  };

  const removeHotel = (indexToRemove) => {
    setHotels((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const removeRoute = (indexToRemove) => {
    setRoutes((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const removeDiscount = (indexToRemove) => {
    setDiscounts((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleNightsChange = (index, value) => {
    const updatedHotels = [...hotels];
    const nights = parseInt(value) || 0;
    updatedHotels[index].nights = value;

    if (updatedHotels[index].checkIn) {
      const checkInDate = new Date(updatedHotels[index].checkIn);
      checkInDate.setDate(checkInDate.getDate() + nights);
      updatedHotels[index].checkOut = formatDateForInput(checkInDate);
    }

    setHotels(updatedHotels);
  };

  const handleCheckInChange = (index, value) => {
    const updatedHotels = [...hotels];
    updatedHotels[index].checkIn = value;

    if (updatedHotels[index].nights) {
      const nights = parseInt(updatedHotels[index].nights) || 0;
      const checkInDate = new Date(value);
      checkInDate.setDate(checkInDate.getDate() + nights);
      updatedHotels[index].checkOut = formatDateForInput(checkInDate);
    }

    setHotels(updatedHotels);
  };

  const handleCheckOutChange = (index, value) => {
    const updatedHotels = [...hotels];
    updatedHotels[index].checkOut = value;

    if (updatedHotels[index].checkIn && value) {
      const checkIn = new Date(updatedHotels[index].checkIn);
      const checkOut = new Date(value);
      const diffTime = Math.abs(checkOut - checkIn);
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      updatedHotels[index].nights = nights;
    }

    setHotels(updatedHotels);
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    const iso = date.toISOString();
    return iso.substring(0, 10); // "YYYY-MM-DD"
  };

  const validateForm = () => {
    if (!packageTitle) {
      toast.error("Please enter package title");
      return false;
    }

    if (
      hotels.some(
        (hotel) => ((!hotel.hotelId && !hotel.hotelName) || !hotel.checkIn || !hotel.nights)
      )
    ) {
      toast.error("Please fill all required hotel fields");
      return false;
    }

    if (routes.some((route) => !route.transportType && !selfTransport)) {
      toast.error("Please fill all required transport fields");
      return false;
    }

    // Require extras selections
    if (!selectedFoodId) {
      toast.error("Please select a Food option");
      return false;
    }
    if (!selectedMeccaZiyaratId) {
      toast.error("Please select a Mecca Ziyarat option");
      return false;
    }
    if (!selectedMadinaZiyaratId) {
      toast.error("Please select a Madina Ziyarat option");
      return false;
    }

    if (
      discounts.some(
        (discount) =>
          !discount.discountAdultFrom ||
          !discount.discountAdultTo ||
          !discount.maxDiscount
      )
    ) {
      toast.error("Please fill all required discount fields");
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setPackageTitle("");
    setRules("");
    setTotalSeats(0);
  setAdultVisaSellingPrice(0);
  setAdultVisaPurchasePrice(0);
  setChildVisaSellingPrice(0);
  setChildVisaPurchasePrice(0);
  setInfantVisaSellingPrice(0);
  setInfantVisaPurchasePrice(0);
  setFoodSellingPrice(0);
  setFoodPurchasePrice(0);
  setMeccaZiyaaratSellingPrice(0);
  setMeccaZiyaaratPurchasePrice(0);
  setMadinaZiyaaratSellingPrice(0);
  setMadinaZiyaaratPurchasePrice(0);
  setTransportSellingPrice(0);
  setTransportPurchasePrice(0);

    setHotels([
      {
        hotelName: "",
        hotelId: 0,
        checkIn: "",
        nights: "",
        checkOut: "",
        sharingSellingPrice: "",
        sharingPurchasePrice: "",
        quintSellingPrice: "",
        quintPurchasePrice: "",
        quadSellingPrice: "",
        quadPurchasePrice: "",
        tripleSellingPrice: "",
        triplePurchasePrice: "",
        doubleSellingPrice: "",
        doublePurchasePrice: "",
      },
    ]);

    setRoutes([{ transportType: "", transportSector: "" }]);
    setDiscounts([
      { discountAdultFrom: "", discountAdultTo: "", maxDiscount: "" },
    ]);

    resetFlightFields();
    setSelectedFlight(null);
    setWithoutFlight(false);
    setSelfTransport(false);
    setFlightOptions("select");

    setIsQuaintActive(true);
    setIsSharingActive(true);
    setIsQuadActive(true);
    setIsTripleActive(true);
    setIsDoubleActive(true);
    setAdultPartialPayment(0);
    setChildPartialPayment(0);
    setInfantPartialPayment(0);
    setPartialTrue(false);
    setAdultFrom(0);
    setAdultTo(0);
    setMaxChilds(0);
    setMaxInfants(0);
    setChargePerAdult(0);
    setChargePerChild(0);
    setChargePerInfant(0);
    setActiveServiceCharge(false);
    setPackageStatus(true);
    setResellingAllowed(false);
  };

  // Normalize free-text transport type into one of allowed vehicle choices
  const normalizeVehicleType = (input) => {
    if (!input) return "sedan";
    const v = String(input).toLowerCase();
    if (v.includes("luxury") || v.includes("luxury_bus")) return "luxury_bus";
    if (v.includes("hiace")) return "hiace";
    if (v.includes("minibus")) return "minibus";
    if (v.includes("coaster")) return "coaster";
    if (v.includes("van")) return "van";
    if (v.includes("suv") || v.includes("jeep")) return "suv";
    if (v.includes("bus")) return "bus";
    return "sedan";
  };

  // Determine transport_type (shared vs private) from free-text input
  const determineTransportType = (input) => {
    if (!input) return "private";
    const v = String(input).toLowerCase();
    if (v.includes("shared") || v.includes("company") || v.includes("charter")) return "shared";
    return "private";
  };

  const handleSubmit = async (action) => {
    if (!validateForm()) return;

    try {
      // Prepare hotel details with correct time format
      const hotelDetails = hotels.map((hotel) => ({
        check_in_time: hotel.checkIn ? `${hotel.checkIn}` : null,
        check_out_time: hotel.checkOut ? `${hotel.checkOut}` : null,
        number_of_nights: parseInt(hotel.nights) || 0,
        // Backwards-compatible single-price fields set to selling price
        quaint_bed_price: parseFloat(hotel.quintSellingPrice) || 0,
        sharing_bed_price: parseFloat(hotel.sharingSellingPrice) || 0,
        quad_bed_price: parseFloat(hotel.quadSellingPrice) || 0,
        triple_bed_price: parseFloat(hotel.tripleSellingPrice) || 0,
        double_bed_price: parseFloat(hotel.doubleSellingPrice) || 0,
        // New explicit selling / purchasing fields
        quaint_bed_selling_price: parseFloat(hotel.quintSellingPrice) || 0,
        quaint_bed_purchase_price: parseFloat(hotel.quintPurchasePrice) || 0,
        sharing_bed_selling_price: parseFloat(hotel.sharingSellingPrice) || 0,
        sharing_bed_purchase_price: parseFloat(hotel.sharingPurchasePrice) || 0,
        quad_bed_selling_price: parseFloat(hotel.quadSellingPrice) || 0,
        quad_bed_purchase_price: parseFloat(hotel.quadPurchasePrice) || 0,
        triple_bed_selling_price: parseFloat(hotel.tripleSellingPrice) || 0,
        triple_bed_purchase_price: parseFloat(hotel.triplePurchasePrice) || 0,
        double_bed_selling_price: parseFloat(hotel.doubleSellingPrice) || 0,
        double_bed_purchase_price: parseFloat(hotel.doublePurchasePrice) || 0,
        hotel: hotel.hotelId || 0,
      }));

      // Prepare transport details and normalize vehicle_type & transport_type
      const transportDetails = selfTransport
        ? []
        : routes.map((route) => ({
          vehicle_type: normalizeVehicleType(route.transportType),
          transport_type: determineTransportType(route.transportType),
          transport_sector: parseInt(route.transportSector) || 0,
        }));

      // Prepare ticket details if flight is selected
      const ticketDetails = withoutFlight
        ? [] // Don't send ticket details at all
        : [
          {
            ticket: parseInt(ticketId), // Assume ticketId is valid
          },
        ];

      // Prepare discount details
      const discountDetails = discounts.map((discount) => ({
        adault_from: parseInt(discount.discountAdultFrom) || 0,
        adault_to: parseInt(discount.discountAdultTo) || 0,
        max_discount: parseFloat(discount.maxDiscount) || 0,
      }));

      // Prepare the complete package data (includes extra optional fields expected by backend)
      const packageData = {
        hotel_details: hotelDetails.map((h) => ({
          // backend expects dates named check_in_date / check_out_date
          check_in_date: h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time || h.check_in_time,
          check_out_date: h.check_out_time || h.check_out_time || h.check_out_time || h.check_out_time || h.check_out_time || h.check_out_time || h.check_out_time || h.check_out_time || h.check_out_time || h.check_out_time || h.check_out_time || h.check_out_time,
          number_of_nights: h.number_of_nights || h.number_of_nights || parseInt(h.nights) || 0,
          // keep legacy single-price fields but prefer explicit selling prices
          quaint_bed_price:
            parseFloat(h.quaint_bed_selling_price || h.quaint_bed_price || h.quintSellingPrice) || 0,
          sharing_bed_price:
            parseFloat(h.sharing_bed_selling_price || h.sharing_bed_price || h.sharingSellingPrice) || 0,
          quad_bed_price:
            parseFloat(h.quad_bed_selling_price || h.quad_bed_price || h.quadSellingPrice) || 0,
          triple_bed_price:
            parseFloat(h.triple_bed_selling_price || h.triple_bed_price || h.tripleSellingPrice) || 0,
          double_bed_price:
            parseFloat(h.double_bed_selling_price || h.double_bed_price || h.doubleSellingPrice) || 0,
          // explicit selling/purchase fields
          quaint_bed_selling_price: parseFloat(h.quaint_bed_selling_price || h.quintSellingPrice) || 0,
          quaint_bed_purchase_price: parseFloat(h.quaint_bed_purchase_price || h.quintPurchasePrice) || 0,
          sharing_bed_selling_price: parseFloat(h.sharing_bed_selling_price || h.sharingSellingPrice) || 0,
          sharing_bed_purchase_price: parseFloat(h.sharing_bed_purchase_price || h.sharingPurchasePrice) || 0,
          quad_bed_selling_price: parseFloat(h.quad_bed_selling_price || h.quadSellingPrice) || 0,
          quad_bed_purchase_price: parseFloat(h.quad_bed_purchase_price || h.quadPurchasePrice) || 0,
          triple_bed_selling_price: parseFloat(h.triple_bed_selling_price || h.tripleSellingPrice) || 0,
          triple_bed_purchase_price: parseFloat(h.triple_bed_purchase_price || h.triplePurchasePrice) || 0,
          double_bed_selling_price: parseFloat(h.double_bed_selling_price || h.doubleSellingPrice) || 0,
          double_bed_purchase_price: parseFloat(h.double_bed_purchase_price || h.doublePurchasePrice) || 0,
          hotel: h.hotel || h.hotelId || 0,
          // (Do not duplicate `reselling_allowed` per-hotel here;
          // a single top-level `reselling_allowed` field will be sent.)
        })),
        transport_details: transportDetails.map((t) => ({
          vehicle_type: t.vehicle_type || t.vehicle_type || t.vehicle_type || t.transportType || t.transportType || t.transportType || t.transport_type || "sedan",
          transport_type: t.transport_type || t.transport_type || t.transport_type || (t.transportType ? "private" : "private"),
          transport_sector: parseInt(t.transport_sector || t.transport_sector || t.transportSector) || 0,
        })),
        ticket_details: ticketDetails,
        discount_details: discountDetails,
        inclusions: [],
        exclusions: [],
        title: packageTitle,
        description: "",
        package_type: "umrah",
        status: packageStatus ? "active" : "inactive",
        start_date: (hotels[0] && hotels[0].checkIn) || null,
        end_date: (hotels[0] && hotels[0].checkOut) || null,
        max_capacity: parseInt(totalSeats) || 0,
        total_seats: parseInt(totalSeats) || 0,
        booked_seats: 0,
        confirmed_seats: 0,
  price_per_person: parseFloat(0) || 0,
        rules: rules,
  // Legacy single-value fields (for backward compatibility) set to selling prices
  child_visa_price: parseFloat(childVisaSellingPrice) || 0,
  infant_visa_price: parseFloat(infantVisaSellingPrice) || 0,
  adault_visa_price: parseFloat(adultVisaSellingPrice) || 0,
  food_price: parseFloat(foodSellingPrice) || 0,
  makkah_ziyarat_price: parseFloat(meccaZiyaaratSellingPrice) || 0,
  madinah_ziyarat_price: parseFloat(madinaZiyaaratSellingPrice) || 0,
  transport_price: parseFloat(transportSellingPrice) || 0,

  // Explicit selling / purchase fields
  adault_visa_selling_price: parseFloat(adultVisaSellingPrice) || 0,
  adault_visa_purchase_price: parseFloat(adultVisaPurchasePrice) || 0,
  child_visa_selling_price: parseFloat(childVisaSellingPrice) || 0,
  child_visa_purchase_price: parseFloat(childVisaPurchasePrice) || 0,
  infant_visa_selling_price: parseFloat(infantVisaSellingPrice) || 0,
  infant_visa_purchase_price: parseFloat(infantVisaPurchasePrice) || 0,

  food_selling_price: parseFloat(foodSellingPrice) || 0,
  food_purchase_price: parseFloat(foodPurchasePrice) || 0,
  makkah_ziyarat_selling_price: parseFloat(meccaZiyaaratSellingPrice) || 0,
  makkah_ziyarat_purchase_price: parseFloat(meccaZiyaaratPurchasePrice) || 0,
  madinah_ziyarat_selling_price: parseFloat(madinaZiyaaratSellingPrice) || 0,
  madinah_ziyarat_purchase_price: parseFloat(madinaZiyaaratPurchasePrice) || 0,
  transport_selling_price: parseFloat(transportSellingPrice) || 0,
  transport_purchase_price: parseFloat(transportPurchasePrice) || 0,
  // IDs for selected extras from backend
  food_price_id: selectedFoodId ? parseInt(selectedFoodId) : null,
  makkah_ziyarat_id: selectedMeccaZiyaratId ? parseInt(selectedMeccaZiyaratId) : null,
  madinah_ziyarat_id: selectedMadinaZiyaratId ? parseInt(selectedMadinaZiyaratId) : null,
        is_active: packageStatus,
        is_quaint_active: isQuaintActive,
        is_sharing_active: isSharingActive,
        is_quad_active: isQuadActive,
        is_triple_active: isTripleActive,
        is_double_active: isDoubleActive,
        adault_service_charge: parseFloat(chargePerAdult) || 0,
        child_service_charge: parseFloat(chargePerChild) || 0,
        infant_service_charge: parseFloat(chargePerInfant) || 0,
        is_service_charge_active: activeServiceCharge,
        adault_partial_payment: parseFloat(adaultPartialPayment) || 0,
        child_partial_payment: parseFloat(childPartialPayment) || 0,
        infant_partial_payment: parseFloat(infantPartialPayment) || 0,
        is_partial_payment_active: partialTrue,
        min_partial_percent: "1.4",
        min_partial_amount: "0",
        filght_min_adault_age: parseInt(adultFrom) || 0,
        filght_max_adault_age: parseInt(adultTo) || 0,
        max_chilld_allowed: parseInt(maxChilds) || 0,
        max_infant_allowed: parseInt(maxInfants) || 0,
        inventory_owner_organization_id: organizationId || 0,
        // Ensure we always send a true boolean (avoid string 'false' being truthy)
        reselling_allowed: !!resellingAllowed,
        is_public: true,
        available_start_date: (hotels[0] && hotels[0].checkIn) || null,
        available_end_date: (hotels[0] && hotels[0].checkOut) || null,
        area_agent_commission_adult: 0,
        area_agent_commission_child: 0,
        area_agent_commission_infant: 0,
        branch_commission_adult: 0,
        branch_commission_child: 0,
        branch_commission_infant: 0,
        markup_percent: "0",
        organization: organizationId,
        
      };

      const token = localStorage.getItem("accessToken");

      if (!token) {
        // No token: avoid sending unauthenticated requests and guide user to login
        toast.error("Not authenticated — please log in.");
        navigate("/login");
        return;
      }

      // Debug: log package payload to browser console so we can verify which
      // top-level extras and hotel fields are being sent to the API.
      try {
        console.debug("packageData payload (before save):", packageData);
        // Also log the JSON that will be sent (useful to inspect in browser console)
        // Ensure we include alternate spellings for ziarat fields so backend
        // accepts purchase prices regardless of naming inconsistencies.
        // Some environments/models use `ziyarat` while others use `ziarat`.
        try {
          // copy purchase price under alternate keys
          packageData.makkah_ziarat_purchase_price = packageData.makkah_ziyarat_purchase_price;
        } catch (e) {}
        try {
          packageData.madinah_ziarat_purchase_price = packageData.madinah_ziyarat_purchase_price;
        } catch (e) {}

        console.debug("packageData JSON:", JSON.stringify(packageData));
        // Extra debug: explicitly log food/ziyarat fields we recently added
        console.debug("packageData extras - food_price_id, makkah_ziyarat_id, madinah_ziyarat_id:", {
          food_price_id: packageData.food_price_id,
          makkah_ziyarat_id: packageData.makkah_ziyarat_id,
          madinah_ziyarat_id: packageData.madinah_ziyarat_id,
          food_selling_price: packageData.food_selling_price,
          food_purchase_price: packageData.food_purchase_price,
          makkah_ziyarat_selling_price: packageData.makkah_ziyarat_selling_price,
          makkah_ziyarat_purchase_price: packageData.makkah_ziyarat_purchase_price,
          madinah_ziyarat_selling_price: packageData.madinah_ziyarat_selling_price,
          madinah_ziyarat_purchase_price: packageData.madinah_ziyarat_purchase_price,
        });
      } catch (e) {}

      if (mode === "edit") {
        // Update existing package
        await axios.put(
          `http://127.0.0.1:8000/api/umrah-packages/${id}/`,
          packageData,
          {
            params: { organization: organizationId },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Package updated successfully!");
      } else {
        // Create new package
        await axios.post(
          "http://127.0.0.1:8000/api/umrah-packages/",
          packageData,
          {
            params: { organization: organizationId },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Package created successfully!");
      }

      // Handle success actions
      if (action === "saveAndNew") {
        resetForm();
      } else if (action === "saveAndClose" || action === "save") {
        navigate("/packages");
      }
    } catch (error) {
      console.error("Error saving package:", error, error?.response?.data);
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.message || error?.response?.data?.detail || JSON.stringify(error?.response?.data || {});
      if (status === 401) {
        toast.error("Unauthorized (401) — your session may have expired. Please log in again.");
        // Clear possibly expired token and redirect to login
        try { localStorage.removeItem("accessToken"); } catch (e) {}
        navigate("/login");
      } else {
        toast.error(serverMsg || `Failed to save package (${status || "error"})`);
      }
    }
  };

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const CustomTicketModal = ({ show, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      airline: "",
      meal: "Yes",
      ticketType: "Refundable",
      pnr: "",
      price: "",
      totalSeats: "",
      weight: "",
      piece: "",
      umrahSeat: "Yes",
      tripType: "One-way",
      flightType: "Non-Stop",
      returnFlightType: "Non-Stop",
      departureDateTime: "",
      arrivalDateTime: "",
      departure: "",
      arrival: "",
      returnDepartureDateTime: "",
      returnArrivalDateTime: "",
      returnDeparture: "",
      returnArrival: "",
      stopLocation1: "",
      stopTime1: "",
      stopLocation2: "",
      stopTime2: "",
      returnStopLocation1: "",
      returnStopTime1: "",
      returnStopLocation2: "",
      returnStopTime2: "",
      childPrice: "",
      infantPrice: "",
      adultPrice: "",
      status: "umrah package custom ticket",
    });

    const [airlines, setAirlines] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState({ airlines: true, cities: true });
    const [error, setError] = useState({ airlines: null, cities: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const orgData = JSON.parse(
            localStorage.getItem("selectedOrganization")
          );
          const organizationId = orgData?.id;

          // Fetch Airlines
          const airlinesResponse = await axios.get(
            "http://127.0.0.1:8000/api/airlines/",
            {
              params: { organization: organizationId },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setAirlines(airlinesResponse.data);

          // Fetch Cities
          const citiesResponse = await axios.get(
            "http://127.0.0.1:8000/api/cities/",
            {
              params: { organization: organizationId },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setCities(citiesResponse.data);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError({
            airlines: err.message.includes("airlines") ? err.message : null,
            cities: err.message.includes("cities") ? err.message : null,
          });
        } finally {
          setLoading({ airlines: false, cities: false });
        }
      };

      fetchData();
    }, []);

    const handleInputChange = (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        const token = localStorage.getItem("accessToken");
        const orgData = JSON.parse(
          localStorage.getItem("selectedOrganization")
        );
        const organizationId = orgData?.id;

        // Prepare payload
        const payload = {
          is_meal_included: formData.meal === "Yes",
          is_refundable: formData.ticketType === "Refundable",
          pnr: formData.pnr || "N/A",
          adult_price:
            parseFloat(formData.adultPrice.replace(/[^0-9.]/g, "")) || 0,
          child_price:
            parseFloat(formData.childPrice.replace(/[^0-9.]/g, "")) || 0,
          infant_price:
            parseFloat(formData.infantPrice.replace(/[^0-9.]/g, "")) || 0,
          seats: parseInt(formData.totalSeats) || 0,
          weight: parseFloat(formData.weight) || 0,
          pieces: parseInt(formData.piece) || 0,
          is_umrah_seat: formData.umrahSeat === "Yes",
          trip_type: formData.tripType,
          departure_stay_type: formData.flightType,
          return_stay_type:
            formData.tripType === "Round-trip"
              ? formData.returnFlightType
              : "Non-Stop",
          organization: organizationId,
          airline: parseInt(formData.airline),
          trip_details: [],
          stopover_details: [],
        };

        // Add departure trip details
        payload.trip_details.push({
          departure_date_time: new Date(
            formData.departureDateTime
          ).toISOString(),
          arrival_date_time: new Date(formData.arrivalDateTime).toISOString(),
          trip_type: "Departure",
          departure_city: parseInt(formData.departure),
          arrival_city: parseInt(formData.arrival),
        });

        // Add return trip details if round-trip
        if (formData.tripType === "Round-trip") {
          payload.trip_details.push({
            departure_date_time: new Date(
              formData.returnDepartureDateTime
            ).toISOString(),
            arrival_date_time: new Date(
              formData.returnArrivalDateTime
            ).toISOString(),
            trip_type: "Return",
            departure_city: parseInt(formData.returnDeparture),
            arrival_city: parseInt(formData.returnArrival),
          });
        }

        // Add stopover details if needed
        if (formData.flightType === "1-Stop" && formData.stopLocation1) {
          payload.stopover_details.push({
            stopover_duration: formData.stopTime1,
            trip_type: "Departure",
            stopover_city: parseInt(formData.stopLocation1),
          });
        }

        const response = await axios.post(
          "http://127.0.0.1:8000/api/tickets/",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Call onSubmit with the created ticket data
        onSubmit(response.data);
        onClose();
      } catch (error) {
        console.error("Error creating ticket:", error);
        toast.error("Failed to create ticket");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSave = async () => {
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem("accessToken");
        const orgData = JSON.parse(
          localStorage.getItem("selectedOrganization")
        );
        const organizationId = orgData?.id;

        // Prepare payload
        const payload = {
          is_meal_included: formData.meal === "Yes",
          is_refundable: formData.ticketType === "Refundable",
          pnr: formData.pnr || "N/A",
          adult_price:
            parseFloat(formData.adultPrice.replace(/[^0-9.]/g, "")) || 0,
          child_price:
            parseFloat(formData.childPrice.replace(/[^0-9.]/g, "")) || 0,
          infant_price:
            parseFloat(formData.infantPrice.replace(/[^0-9.]/g, "")) || 0,
          seats: parseInt(formData.totalSeats) || 0,
          weight: parseFloat(formData.weight) || 0,
          pieces: parseInt(formData.piece) || 0,
          is_umrah_seat: formData.umrahSeat === "Yes",
          trip_type: formData.tripType,
          departure_stay_type: formData.flightType,
          return_stay_type:
            formData.tripType === "Round-trip"
              ? formData.returnFlightType
              : "Non-Stop",
          organization: organizationId,
          airline: parseInt(formData.airline),
          trip_details: [],
          stopover_details: [],
        };

        // Add departure trip details
        payload.trip_details.push({
          departure_date_time: new Date(
            formData.departureDateTime
          ).toISOString(),
          arrival_date_time: new Date(formData.arrivalDateTime).toISOString(),
          trip_type: "Departure",
          departure_city: parseInt(formData.departure),
          arrival_city: parseInt(formData.arrival),
        });

        // Add return trip details if round-trip
        if (formData.tripType === "Round-trip") {
          payload.trip_details.push({
            departure_date_time: new Date(
              formData.returnDepartureDateTime
            ).toISOString(),
            arrival_date_time: new Date(
              formData.returnArrivalDateTime
            ).toISOString(),
            trip_type: "Return",
            departure_city: parseInt(formData.returnDeparture),
            arrival_city: parseInt(formData.returnArrival),
          });
        }

        // Add stopover details if needed
        if (formData.flightType === "1-Stop" && formData.stopLocation1) {
          payload.stopover_details.push({
            stopover_duration: formData.stopTime1,
            trip_type: "Departure",
            stopover_city: parseInt(formData.stopLocation1),
          });
        }

        const response = await axios.post(
          "http://127.0.0.1:8000/api/tickets/",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        onSubmit(response.data);
        onClose();
      } catch (error) {
        console.error("Error creating ticket:", error);
        toast.error("Failed to create ticket");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCancel = () => {
      navigate("/ticket-booking");
    };

    // Shimmer loading component
    const ShimmerLoader = () => (
      <div
        className="shimmer-loader"
        style={{
          height: "38px",
          background:
            "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          borderRadius: "4px",
          animation: "shimmer 1.5s infinite",
        }}
      ></div>
    );

    // Helper to render city dropdown options
    const renderCityOptions = (field, currentValue) => {
      if (loading.cities) return <ShimmerLoader />;
      if (error.cities)
        return <div className="text-danger small">{error.cities}</div>;

      return (
        <select
          className="form-select  shadow-none"
          value={currentValue}
          onChange={(e) => handleInputChange(field, e.target.value)}
        >
          <option value="">Select a city</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.code} ({city.name})
            </option>
          ))}
        </select>
      );
    };

    return (
      <div
        className={`modal ${show ? "d-block" : "d-none"}`}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">Create Custom Ticket</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              {/* Ticket Details Section */}
              <div className="mb-4">
                <h5 className="card-title mb-3 fw-bold">Ticket (Details)</h5>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">Select Airline</label>
                    {loading.airlines ? (
                      <ShimmerLoader />
                    ) : error.airlines ? (
                      <div className="text-danger small">
                        {error.airlines}
                      </div>
                    ) : (
                      <select
                        className="form-select  shadow-none"
                        value={formData.airline}
                        onChange={(e) =>
                          handleInputChange("airline", e.target.value)
                        }
                      >
                        <option value="">Select an airline</option>
                        {airlines.map((airline) => (
                          <option key={airline.id} value={airline.id}>
                            {airline.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="col-md-2">
                    <label htmlFor="" className="Control-label">Meal</label>

                    <select
                      className="form-select  shadow-none"
                      value={formData.meal}
                      onChange={(e) =>
                        handleInputChange("meal", e.target.value)
                      }
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label htmlFor="" className="Control-label">Type</label>

                    <select
                      className="form-select  shadow-none"
                      value={formData.ticketType}
                      onChange={(e) =>
                        handleInputChange("ticketType", e.target.value)
                      }
                    >
                      <option value="Refundable">Refundable</option>
                      <option value="Non-Refundable">Non-Refundable</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label htmlFor="" className="Control-label">PNR</label>

                    <input
                      type="text"
                      className="form-control rounded shadow-none  px-1 py-2"
                      required
                      placeholder="PND32323"
                      value={formData.pnr}
                      onChange={(e) =>
                        handleInputChange("pnr", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="row g-3 mt-2">
                <div className="col-md-2">
                  <label htmlFor="" className="Control-label">
                    Total Seats
                  </label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none  px-1 py-2"
                    required
                    placeholder="30"
                    value={formData.totalSeats}
                    onChange={(e) =>
                      handleInputChange("totalSeats", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label htmlFor="" className="Control-label">Weight</label>

                  <input
                    type="text"
                    className="form-control rounded shadow-none  px-1 py-2"
                    required
                    placeholder="30 KG"
                    value={formData.weight}
                    onChange={(e) =>
                      handleInputChange("weight", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label htmlFor="" className="Control-label">
                    Piece
                  </label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none  px-1 py-2"
                    required
                    placeholder="2"
                    value={formData.piece}
                    onChange={(e) =>
                      handleInputChange("piece", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label htmlFor="" className="Control-label">
                    Umrah Seat
                  </label>
                  <select
                    className="form-select  shadow-none"
                    value={formData.umrahSeat}
                    onChange={(e) =>
                      handleInputChange("umrahSeat", e.target.value)
                    }
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label htmlFor="" className="Control-label">Adult Price</label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none  px-1 py-2"
                    placeholder="Rs- 120,000/."
                    value={formData.adultPrice}
                    onChange={(e) =>
                      handleInputChange("adultPrice", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="" className="Control-label">
                    Child Price
                  </label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none  px-1 py-2"
                    placeholder="Rs- 100,000/."
                    value={formData.childPrice}
                    onChange={(e) =>
                      handleInputChange("childPrice", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="" className="Control-label">Infant Price</label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none  px-1 py-2"
                    placeholder="Rs- 80,000/."
                    value={formData.infantPrice}
                    onChange={(e) =>
                      handleInputChange("infantPrice", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Trip Details Section */}
            <div className="mb-4 p-3">
              <h5 className="card-title mb-3 fw-bold">Trip (Details)</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <label htmlFor="" className="Control-label">
                    Trip Type
                  </label>
                  <select
                    className="form-select  shadow-none"
                    value={formData.tripType}
                    onChange={(e) =>
                      handleInputChange("tripType", e.target.value)
                    }
                  >
                    <option value="One-way">One-way</option>
                    <option value="Round-trip">Round-trip</option>
                  </select>
                </div>
              </div>

              {/* Departure and Arrival Fields */}
              <div className="row g-3 mt-2">
                <div className="col-md-3">
                  <label htmlFor="" className="Control-label">

                    Departure Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control rounded shadow-none  px-1 py-2"
                    required
                    value={formData.departureDateTime}
                    onChange={(e) =>
                      handleInputChange("departureDateTime", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="" className="Control-label">

                    Arrival Date & Time

                  </label>
                  <input
                    type="datetime-local"
                    className="form-control rounded shadow-none  px-1 py-2"
                    required
                    value={formData.arrivalDateTime}
                    onChange={(e) =>
                      handleInputChange("arrivalDateTime", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="" className="Control-label">

                    Departure City
                  </label>
                  {renderCityOptions("departure", formData.departure)}
                </div>
                <div className="col-md-3">
                  <label htmlFor="" className="Control-label">

                    Arrival City
                  </label>
                  {renderCityOptions("arrival", formData.arrival)}
                </div>
              </div>

              {/* Round Trip Additional Fields */}
              {formData.tripType === "Round-trip" && (
                <div className="row g-3 mt-2">
                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">
                      Return Departure Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control rounded shadow-none  px-1 py-2"
                      required
                      value={formData.returnDepartureDateTime}
                      onChange={(e) =>
                        handleInputChange(
                          "returnDepartureDateTime",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">

                      Return Arrival Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control rounded shadow-none  px-1 py-2"
                      required
                      value={formData.returnArrivalDateTime}
                      onChange={(e) =>
                        handleInputChange(
                          "returnArrivalDateTime",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">

                      Return Departure City
                    </label>
                    {renderCityOptions(
                      "returnDeparture",
                      formData.returnDeparture
                    )}
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">

                      Return Arrival City
                    </label>
                    {renderCityOptions(
                      "returnArrival",
                      formData.returnArrival
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stay Details Section */}
            <div className="mb-4 p-3">
              <h5 className="card-title mb-3 fw-bold">Stay (Details)</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <label htmlFor="" className="Control-label">

                    Flight Type (Departure)
                  </label>
                  <select
                    className="form-select  shadow-none"
                    value={formData.flightType}
                    onChange={(e) =>
                      handleInputChange("flightType", e.target.value)
                    }
                  >
                    <option value="Non-Stop">Non-Stop</option>
                    <option value="1-Stop">1-Stop</option>
                  </select>
                </div>

                {formData.tripType === "Round-trip" && (
                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">

                      Flight Type (Return)
                    </label>
                    <select
                      className="form-select  shadow-none"
                      value={formData.returnFlightType}
                      onChange={(e) =>
                        handleInputChange("returnFlightType", e.target.value)
                      }
                    >
                      <option value="Non-Stop">Non-Stop</option>
                      <option value="1-Stop">1-Stop</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 1-Stop Fields for Departure */}
              {formData.flightType === "1-Stop" && (
                <div className="row g-3 mt-2">
                  <div className="col-12">
                    <h6 className="text-muted">Departure Stop</h6>
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">

                      1st Stop At
                    </label>
                    {renderCityOptions(
                      "stopLocation1",
                      formData.stopLocation1
                    )}
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">

                      Wait Time
                    </label>
                    <input
                      type="text"
                      className="form-control rounded shadow-none  px-1 py-2"
                      value={formData.stopTime1}
                      onChange={(e) =>
                        handleInputChange("stopTime1", e.target.value)
                      }
                      placeholder="30 Minutes"
                    />
                  </div>
                </div>
              )}

              {/* 1-Stop Fields for Return Trip */}
              {formData.tripType === "Round-trip" &&
                formData.returnFlightType === "1-Stop" && (
                  <div className="row g-3 mt-2">
                    <div className="col-12">
                      <h6 className="text-muted">Return Stop</h6>
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="" className="Control-label">

                        1st Stop At
                      </label>
                      {renderCityOptions(
                        "returnStopLocation1",
                        formData.returnStopLocation1
                      )}
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="" className="Control-label">

                        Wait Time
                      </label>
                      <input
                        type="text"
                        className="form-control rounded shadow-none  px-1 py-2"
                        value={formData.returnStopTime1}
                        onChange={(e) =>
                          handleInputChange("returnStopTime1", e.target.value)
                        }
                        placeholder="30 Minutes"
                      />
                    </div>
                  </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="row">
              <div className="col-12 d-flex flex-wrap justify-content-end gap-2 mt-4 pe-3">
                {/* ... other modal content ... */}
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={handleSave}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary px-4"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                {/* Toasts */}
                <ToastContainer />
                <div className="px-3 mt-3 px-lg-4">
                  {/* Navigation Tabs */}
                  <div className="row ">
              <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                {/* Navigation Tabs */}
                <nav className="nav flex-wrap gap-2">
                  {tabs.map((tab, index) => (
                    <NavLink
                      key={index}
                      to={tab.path}
                      className={`nav-link btn btn-link text-decoration-none px-0 me-3  ${tab.name === "Umrah Package"
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
                <div className="d-flex gap-2 mb-3">
                  <div className="d-flex gap-2 mt-2 mt-md-0">
                    <Link
                      to="/packages"
                      className="btn text-white"
                      style={{ background: "#1B78CE" }}
                    >
                      Back to Packages
                    </Link>
                  </div>
                  <div className="d-flex gap-2 mt-2 mt-md-0">
                    <Link
                      to=""
                      className="btn text-white"
                      style={{ background: "#1B78CE" }}
                    >
                      Export Package
                    </Link>
                  </div>
                </div>
              </div>
            

            <div className="border rounded-4 mb-3">
              {/* Package Detail Section */}
              <div className="p-4">
                <div className="row">
                  <h4 className="fw-bold mb-3">
                    {mode === "edit" ? "Edit Package" : "Add New Package"}
                  </h4>
                  <div className="col-12 d-flex flex-wrap gap-5">
                    <div>
                      <label htmlFor="" className="Control-label">Package Title</label>
                      <input
                        type="text"
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="4 Star Umrah package"
                        value={packageTitle}
                        onChange={(e) => setPackageTitle(e.target.value)}
                      />
                    </div>

                    <div><label htmlFor="" className="Control-label">Rules</label>

                      <input
                        type="text"
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="N/A"
                        value={rules}
                        onChange={(e) => setRules(e.target.value)}
                      /></div>
                  </div>
                </div>
              </div>

              {/* Custom Umrah Package Section */}
              <div className="p-4">
                <div className="row">
                  <h4 className="fw-bold mb-3">Custom Umrah Package</h4>
                  <div className="col-12">
                    <div className="d-flex flex-wrap gap-4 align-items-start">
                      <div>
                        <label htmlFor="" className="Control-label">Total Seats</label>

                        <input
                          type="number"
                          className="form-control rounded shadow-none "
                          required
                          placeholder="0"
                          value={totalSeats}
                          onChange={(e) =>
                            setTotalSeats(parseInt(e.target.value) || 0)
                          }
                        />
                      </div>


                      {/* Extras & Visa Pricing - improved layout */}
                      <div className="card w-100 mb-3 shadow-sm">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">Extras & Visa Pricing</h6>
                            <small className="text-muted">Define selling price (what customer pays) and purchase cost (your cost)</small>
                          </div>

                          <div className="row gy-3">
                            {/* Food option select + prices */}
                            <div className="col-12 col-md-6">
                              <label className="form-label fw-semibold">Food</label>
                              <select
                                className="form-select mb-2"
                                required
                                value={selectedFoodId}
                                onChange={(e) => {
                                  const id = e.target.value;
                                  setSelectedFoodId(id);
                                  const opt = foodOptions.find((o) => String(o.id) === String(id));
                                  if (opt) {
                                    // Backend sometimes returns a single `price` which is the purchase/cost price.
                                    // Ensure we put that backend price into the Purchase field and only use
                                    // explicit `selling_price` for Selling when available.
                                    const purchasePrice =
                                      opt.purchase_price ?? opt.price ?? opt.cost ?? opt.food_purchase_price ?? opt.purchase_price ?? 0;
                                    const sellingPrice = opt.selling_price ?? 0;
                                    setFoodPurchasePrice(purchasePrice);
                                    setFoodSellingPrice(sellingPrice);
                                  } else {
                                    setFoodSellingPrice(0);
                                    setFoodPurchasePrice(0);
                                  }
                                }}
                              >
                                <option value="">Select Food Option</option>
                                {foodOptions.map((opt) => (
                                      <option key={opt.id} value={opt.id}>
                                        {getOptionLabel(opt)}
                                      </option>
                                ))}
                              </select>

                              <div className="input-group">
                                <span className="input-group-text">Selling</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Selling Price (Rs)"
                                  value={displayIfNonZero(foodSellingPrice)}
                                  onChange={(e) => setFoodSellingPrice(e.target.value)}
                                />
                                <span className="input-group-text">Purchase</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Purchase Cost (Rs)"
                                  value={displayIfNonZero(foodPurchasePrice)}
                                  onChange={(e) => setFoodPurchasePrice(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Mecca Ziyarat select + prices */}
                            <div className="col-12 col-md-6">
                              <label className="form-label fw-semibold">Mecca Ziyaarat</label>
                              <select
                                className="form-select mb-2"
                                required
                                value={selectedMeccaZiyaratId}
                                onChange={(e) => {
                                  const id = e.target.value;
                                  setSelectedMeccaZiyaratId(id);
                                  const opt = ziaratOptions.find((o) => String(o.id) === String(id));
                                  if (opt) {
                                    setMeccaZiyaaratSellingPrice(opt.selling_price ?? opt.price ?? opt.ziyarat_price ?? 0);
                                    setMeccaZiyaaratPurchasePrice(opt.purchase_price ?? opt.cost ?? opt.ziyarat_purchase_price ?? 0);
                                  } else {
                                    setMeccaZiyaaratSellingPrice(0);
                                    setMeccaZiyaaratPurchasePrice(0);
                                  }
                                }}
                              >
                                <option value="">Select Mecca Ziyaarat</option>
                                {ziaratOptions.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {getOptionLabel(opt)}
                                  </option>
                                ))}
                              </select>

                              <div className="input-group">
                                <span className="input-group-text">Selling</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Selling Price (Rs)"
                                  value={displayIfNonZero(meccaZiyaaratSellingPrice)}
                                  onChange={(e) => setMeccaZiyaaratSellingPrice(e.target.value)}
                                />
                                <span className="input-group-text">Purchase</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Purchase Cost (Rs)"
                                  value={displayIfNonZero(meccaZiyaaratPurchasePrice)}
                                  onChange={(e) => setMeccaZiyaaratPurchasePrice(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Madina Ziyarat select + prices */}
                            <div className="col-12 col-md-6 mt-3">
                              <label className="form-label fw-semibold">Madina Ziyaarat</label>
                              <select
                                className="form-select mb-2"
                                required
                                value={selectedMadinaZiyaratId}
                                onChange={(e) => {
                                  const id = e.target.value;
                                  setSelectedMadinaZiyaratId(id);
                                  const opt = ziaratOptions.find((o) => String(o.id) === String(id));
                                  if (opt) {
                                    setMadinaZiyaaratSellingPrice(opt.selling_price ?? opt.price ?? opt.ziyarat_price ?? 0);
                                    setMadinaZiyaaratPurchasePrice(opt.purchase_price ?? opt.cost ?? opt.ziyarat_purchase_price ?? 0);
                                  } else {
                                    setMadinaZiyaaratSellingPrice(0);
                                    setMadinaZiyaaratPurchasePrice(0);
                                  }
                                }}
                              >
                                <option value="">Select Madina Ziyaarat</option>
                                {ziaratOptions.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {getOptionLabel(opt)}
                                  </option>
                                ))}
                              </select>

                              <div className="input-group">
                                <span className="input-group-text">Selling</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Selling Price (Rs)"
                                  value={displayIfNonZero(madinaZiyaaratSellingPrice)}
                                  onChange={(e) => setMadinaZiyaaratSellingPrice(e.target.value)}
                                />
                                <span className="input-group-text">Purchase</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Purchase Cost (Rs)"
                                  value={displayIfNonZero(madinaZiyaaratPurchasePrice)}
                                  onChange={(e) => setMadinaZiyaaratPurchasePrice(e.target.value)}
                                />
                              </div>
                            </div>

                            {[
                              ["adultVisa", "Adult Visa"],
                              ["childVisa", "Child Visa"],
                              ["infantVisa", "Infant Visa"],
                            ].map(([key, label]) => (
                              <div key={key} className="col-12 col-md-6">
                                <label className="form-label fw-semibold">{label}</label>
                                <div className="input-group">
                                  <span className="input-group-text">Selling</span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Selling Price (Rs)"
                                    value={displayIfNonZero(
                                      key === "adultVisa"
                                        ? adultVisaSellingPrice
                                        : key === "childVisa"
                                        ? childVisaSellingPrice
                                        : infantVisaSellingPrice
                                    )}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (key === "adultVisa") setAdultVisaSellingPrice(v);
                                      else if (key === "childVisa") setChildVisaSellingPrice(v);
                                      else setInfantVisaSellingPrice(v);
                                    }}
                                  />
                                  <span className="input-group-text">Purchase</span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Purchase Cost (Rs)"
                                    value={displayIfNonZero(
                                      key === "adultVisa"
                                        ? adultVisaPurchasePrice
                                        : key === "childVisa"
                                        ? childVisaPurchasePrice
                                        : infantVisaPurchasePrice
                                    )}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (key === "adultVisa") setAdultVisaPurchasePrice(v);
                                      else if (key === "childVisa") setChildVisaPurchasePrice(v);
                                      else setInfantVisaPurchasePrice(v);
                                    }}
                                  />
                                </div>
                                
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotel Details Sections */}
              {hotels.map((hotel, index) => (
                <React.Fragment key={index}>
                  <div className="p-4">
                    <div className="row">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h4 className="fw-bold mb-3">
                          Hotel Details {index + 1}
                        </h4>
                        <div className="d-flex gap-2">
                          {index === 0 && (
                            <button
                              onClick={addHotel}
                              className="btn btn-primary px-3 py-2"
                            >
                              Add Hotel
                            </button>
                          )}
                          {hotels.length > 1 && (
                            <button
                              onClick={() => removeHotel(index)}
                              className="btn btn-danger px-3 py-2"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="col-12 d-flex flex-wrap gap-5">
                        <div>
                          <label htmlFor="" className="Control-label">Hotel Name</label>

                          <select
                            className="form-select"
                            value={hotel.hotelName}
                            onChange={(e) => {
                              const selectedHotel = hotelsList.find(
                                (h) => h.name === e.target.value
                              );
                              handleHotelChange(
                                index,
                                "hotelName",
                                e.target.value
                              );
                              handleHotelChange(
                                index,
                                "hotelId",
                                selectedHotel?.id || 0
                              );
                            }}
                          >
                            <option value="">Select Hotel</option>
                            {hotelsList.map((hotel) => (
                              <option key={hotel.id} value={hotel.name}>
                                {hotel.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="" className="Control-label">Check In</label>

                          <input
                            type="date"
                            className="form-control  px-1 py-2"
                            value={hotel.checkIn}
                            onChange={(e) =>
                              handleCheckInChange(index, e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label htmlFor="" className="Control-label">No. of Nights</label>

                          <input
                            type="number"
                            className="form-control  px-1 py-2"
                            value={hotel.nights}
                            onChange={(e) =>
                              handleNightsChange(index, e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label htmlFor="" className="Control-label">Check Out</label>

                          <input
                            type="date"
                            className="form-control  px-1 py-2"
                            value={hotel.checkOut}
                            onChange={(e) =>
                              handleCheckOutChange(index, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="row">
                      <h4 className="fw-bold mb-3">Hotel {index + 1} Pricing</h4>
                      {/* Column headings for Selling / Purchasing */}
                      <div className="d-flex align-items-center mb-2" style={{ gap: "0.5rem" }}>
                        <div style={{ minWidth: "180px" }} />
                        <div style={{ minWidth: "180px", fontWeight: 600 }}>Selling Price (Rs)</div>
                        <div style={{ minWidth: "180px", fontWeight: 600 }}>Purchase Cost (Rs)</div>
                      </div>

                      <div className="col-12 d-flex flex-wrap gap-4 align-items-start">
                        {[
                          ["sharing", "Sharing"],
                          ["quint", "Quint Bed"],
                          ["quad", "Quad Bed"],
                          ["triple", "Triple Bed"],
                          ["double", "Double Bed"],
                        ].map(([base, label]) => (
                          <div key={base} className="d-flex flex-column align-items-start">
                            <label className="Control-label">{label}</label>
                            <div className="d-flex gap-2">
                              <div className="input-group" style={{ minWidth: "180px" }}>
                                <span className="input-group-text">Selling</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Selling Price (Rs)"
                                  value={displayIfNonZero(hotel[`${base}SellingPrice`])}
                                  onChange={(e) =>
                                    handleHotelChange(index, `${base}SellingPrice`, e.target.value)
                                  }
                                />
                              </div>
                              <div className="input-group" style={{ minWidth: "180px" }}>
                                <span className="input-group-text">Purchase</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Purchase Cost (Rs)"
                                  value={displayIfNonZero(hotel[`${base}PurchasePrice`])}
                                  onChange={(e) =>
                                    handleHotelChange(index, `${base}PurchasePrice`, e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}

              {/* Transport Details Sections */}
              {routes.map((route, index) => (
                <div className="p-4" key={index}>
                  <div className="row">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h4 className="fw-bold mb-3">
                        Transport Details {index + 1}
                      </h4>
                      <div className="d-flex gap-2">
                        {index === 0 && (
                          <button
                            onClick={addRoute}
                            className="btn btn-primary px-3 py-2"
                          >
                            Add Route
                          </button>
                        )}
                        {routes.length > 1 && (
                          <button
                            onClick={() => removeRoute(index)}
                            className="btn btn-danger px-3 py-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="card mb-3 p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">Transport Details {index + 1}</h6>
                          <small className="text-muted">Vehicle type, sector and pricing</small>
                        </div>

                        <div className="d-flex flex-wrap gap-3 align-items-start">
                          <div style={{ minWidth: 200 }}>
                            <label htmlFor={`vehicle_type_${index}`} className="Control-label">Vehicle Type</label>
                            <select
                              id={`vehicle_type_${index}`}
                              className="form-select rounded shadow-none px-1 py-2"
                              value={route.transportType}
                              onChange={(e) => handleRouteChange(index, "transportType", e.target.value)}
                              required
                              disabled={selfTransport}
                            >
                              <option value="">Select vehicle</option>
                              <option value="sedan">Sedan</option>
                              <option value="suv">SUV</option>
                              <option value="van">Van</option>
                              <option value="minibus">Minibus</option>
                              <option value="coaster">Coaster</option>
                              <option value="bus">Bus</option>
                              <option value="luxury_bus">Luxury Bus</option>
                              <option value="hiace">Hiace</option>
                            </select>
                          </div>

                          <div style={{ minWidth: 240 }}>
                            <label htmlFor="" className="Control-label">Transport Sector</label>
                            <select
                              className="form-select rounded shadow-none"
                              value={route.transportSector}
                              onChange={(e) =>
                                handleRouteChange(
                                  index,
                                  "transportSector",
                                  e.target.value
                                )
                              }
                              disabled={selfTransport}
                              required
                            >
                              <option value="">Select Transport Sector</option>
                              {transportSectors.map((sector) => (
                                <option key={sector.id} value={sector.id}>
                                  {sector.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {index === 0 && (
                            <div className="form-check d-flex align-items-center">
                              <input
                                className="form-check-input border border-black me-2"
                                type="checkbox"
                                id="self"
                                checked={selfTransport}
                                onChange={(e) => {
                                  setSelfTransport(e.target.checked);
                                  if (e.target.checked) {
                                    setRoutes([
                                      { transportType: "", transportSector: "" },
                                    ]);
                                  }
                                }}
                                style={{ width: "1.3rem", height: "1.3rem" }}
                              />
                              <label className="form-check-label" htmlFor="self">
                                Self
                              </label>
                            </div>
                          )}

                        </div>

                        <div className="mt-3" style={{ width: "100%" }}>
                          <label className="form-label fw-semibold">Transport Pricing</label>
                          <div className="input-group">
                            <span className="input-group-text">Selling</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Selling Price (Rs)"
                                value={displayIfNonZero(route.transportSellingPrice)}
                                onChange={(e) => handleRouteChange(index, 'transportSellingPrice', e.target.value)}
                                required
                                min="0"
                            />
                            <span className="input-group-text">Purchase</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Purchase Cost (Rs)"
                                value={displayIfNonZero(route.transportPurchasePrice)}
                                onChange={(e) => handleRouteChange(index, 'transportPurchasePrice', e.target.value)}
                                required
                                min="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Flight Details Section */}
              <div className="p-4">
                <div className="row">
                  {/* Flight Selection Buttons */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="fw-bold">Flight Details</h4>
                    <div className="d-flex gap-3 align-items-center justify-content-between">
                      <button
                        className="btn btn-primary px-3 py-2 w-100"
                        onClick={() => setShowFlightModal(true)}
                      >
                        Select Flight
                      </button>
                    </div>
                  </div>

                  {/* Selected Flight Alert */}
                  {selectedFlight && !withoutFlight && (
                    <div className="alert alert-info mb-4">
                      <div className="d-flex justify-content-between align-items-start">
                        <div style={{ minWidth: 0 }}>
                          <strong>Selected Flight</strong>
                          <div className="mt-2">
                            <div><strong>Airline:</strong> {airlinesMap[selectedFlight.airline]?.name || 'N/A'}</div>
                            <div><strong>PNR:</strong> {selectedFlight.pnr || 'N/A'}</div>
                            <div><strong>Seats:</strong> {selectedFlight.seats ?? 'N/A'}</div>
                            <div className="mt-2"><strong>Prices:</strong></div>
                            <div className="ms-3">Adult: Rs. {selectedFlight.adult_price?.toLocaleString() ?? '0'}</div>
                            <div className="ms-3">Child: Rs. {selectedFlight.child_price?.toLocaleString() ?? '0'}</div>
                            <div className="ms-3">Infant: Rs. {selectedFlight.infant_price?.toLocaleString() ?? '0'}</div>

                            <div className="mt-2"><strong>Trip Segments:</strong></div>
                            <div className="ms-3">
                              {selectedFlight.trip_details && selectedFlight.trip_details.length > 0 ? (
                                selectedFlight.trip_details.map((seg, i) => (
                                  <div key={i} className="mb-2">
                                    <div><strong>Type:</strong> {seg.trip_type || 'N/A'}</div>
                                    <div><strong>Flight #:</strong> {seg.flight_number || 'N/A'}</div>
                                    <div>
                                      <strong>Departure:</strong>{' '}
                                      {seg.departure_date_time ? new Date(seg.departure_date_time).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </div>
                                    <div>
                                      <strong>Arrival:</strong>{' '}
                                      {seg.arrival_date_time ? new Date(seg.arrival_date_time).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </div>
                                    <div>
                                      <strong>From:</strong>{' '}{seg.departure_city ? (citiesMap[seg.departure_city]?.code || citiesMap[seg.departure_city]?.name || 'N/A') : 'N/A'}
                                      {'  '}
                                      <strong>To:</strong>{' '}{seg.arrival_city ? (citiesMap[seg.arrival_city]?.code || citiesMap[seg.arrival_city]?.name || 'N/A') : 'N/A'}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div>N/A</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="ms-3">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setSelectedFlight(null);
                              resetFlightFields();
                            }}
                          >
                            Change Flight
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Flight Modal */}
              <FlightModal
                show={showFlightModal}
                onClose={() => setShowFlightModal(false)}
                flights={ticketsList}
                onSelect={handleFlightSelect}
                airlinesMap={airlinesMap}
                citiesMap={citiesMap}
              />
              <CustomTicketModal
                show={showCustomTicketModal}
                onClose={() => setShowCustomTicketModal(false)}
                onSubmit={(ticket) => {
                  setTicketId(ticket.id);
                  setSelectedFlight(ticket);
                  setFlightOptions("custom");
                  setShowCustomTicketModal(false);
                  toast.success("Custom ticket created successfully!");
                }}
              />

              {/* Which Room Types Allowed */}
              <div className="p-4">
                <h4 className="fw-bold mb-3">Which Room Types Allowed</h4>
                <div className="flex-wrap d-flex gap-5 px-4">
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="quaint-active"
                      checked={isQuaintActive}
                      onChange={(e) => setIsQuaintActive(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="quaint-active">
                      Quaint Active
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="sharing-active"
                      checked={isSharingActive}
                      onChange={(e) => setIsSharingActive(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="sharing-active">
                      Sharing Active
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="quad-active"
                      checked={isQuadActive}
                      onChange={(e) => setIsQuadActive(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="quad-active">
                      Quad Active
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="triple-active"
                      checked={isTripleActive}
                      onChange={(e) => setIsTripleActive(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="triple-active">
                      Triple Active
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="double-active"
                      checked={isDoubleActive}
                      onChange={(e) => setIsDoubleActive(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="double-active">
                      Double Active
                    </label>
                  </div>
                </div>
                </div>
              </div>

              {/* Partial Payments Section */}
              <div className="row p-4">
                <h4 className="mb-3 fw-bold">Partial Payments</h4>
                <div className="col-12 d-flex flex-wrap gap-5">
                  <div className=" mb-3">
                    <div className="form-group">
                      <label htmlFor="" className="Control-label">Adult Payment</label>

                      <input
                        type="number"
                        className="form-control  shadow-none"
                        id="adult-partial"
                        value={adaultPartialPayment}
                        onChange={(e) => setAdultPartialPayment(e.target.value)}
                        min="0"
                        step="1"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div className=" mb-3">
                    <div>
                      <label htmlFor="" className="Control-label">Child Payment</label>

                      <input
                        type="number"
                        className="form-control  shadow-none"
                        id="child-partial"
                        value={childPartialPayment}
                        onChange={(e) => setChildPartialPayment(e.target.value)}
                        min="0"
                        step="1"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div className=" mb-3">
                    <div className="form-group">
                      <label htmlFor="" className="Control-label">Infant Payment</label>

                      <input
                        type="number"
                        className="form-control  shadow-none"
                        id="infant-partial"
                        value={infantPartialPayment}
                        onChange={(e) =>
                          setInfantPartialPayment(e.target.value)
                        }
                        min="0"
                        step="1"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                  <div className="form-check d-flex align-items-center">
                    <input
                      className="form-check-input border border-black me-2"
                      type="checkbox"
                      id="activePartial"
                      checked={partialTrue}
                      onChange={(e) => setPartialTrue(e.target.checked)}
                      style={{ width: "1.3rem", height: "1.3rem" }}
                    />
                    <label className="form-check-label" htmlFor="activePartial">
                      Active
                    </label>
                  </div>
                </div>
              </div>

              {/* Flight Conditions Section */}
              <div className="p-4">
                <div className="row">
                  <h4 className="fw-bold mb-3">Flight Conditions</h4>
                  <div className="col-12 d-flex flex-wrap gap-5">
                    <div><label htmlFor="" className="Control-label">If Adult from</label>

                      <input
                        type="text"
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="7"
                        value={adultFrom}
                        onChange={(e) => setAdultFrom(e.target.value)}
                      /></div>

                    <div><label htmlFor="" className="Control-label">To Adult</label>

                      <input
                        type="text"
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="10"
                        value={adultTo}
                        onChange={(e) => setAdultTo(e.target.value)}
                      /></div>

                    <div>
                      <label htmlFor="" className="Control-label">Max Childs Allowed</label>

                      <input
                        type="text"
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="01"
                        value={maxChilds}
                        onChange={(e) => setMaxChilds(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="" className="Control-label">Max Infants Allowed</label>

                      <input
                        type="text"
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="01"
                        value={maxInfants}
                        onChange={(e) => setMaxInfants(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Discounts Sections */}
              {discounts.map((discount, index) => (
                <div className="p-4" key={index}>
                  <div className="row">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h4 className="fw-bold mb-3">Discounts {index + 1}</h4>
                      <div className="d-flex gap-2">
                        {index === 0 && (
                          <button
                            onClick={addDiscount}
                            className="btn btn-primary px-3 py-2"
                          >
                            Add Discounts
                          </button>
                        )}
                        {discounts.length > 1 && (
                          <button
                            onClick={() => removeDiscount(index)}
                            className="btn btn-danger px-3 py-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-12 d-flex flex-wrap gap-5">
                      <div>
                        <label htmlFor="" className="Control-label">If Adult from</label>

                        <input
                          type="text"
                          className="form-control rounded shadow-none  px-1 py-2"
                          required
                          placeholder="7"
                          value={discount.discountAdultFrom}
                          onChange={(e) =>
                            handleDiscountChange(
                              index,
                              "discountAdultFrom",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div><label htmlFor="" className="Control-label">To Adult</label>

                        <input
                          type="text"
                          className="form-control rounded shadow-none  px-1 py-2"
                          required
                          placeholder="10"
                          value={discount.discountAdultTo}
                          onChange={(e) =>
                            handleDiscountChange(
                              index,
                              "discountAdultTo",
                              e.target.value
                            )
                          }
                        /></div>

                      <div>
                        <label htmlFor="" className="Control-label">Max Discount</label>

                        <input
                          type="text"
                          className="form-control rounded shadow-none  px-1 py-2"
                          required
                          placeholder="01"
                          value={discount.maxDiscount}
                          onChange={(e) =>
                            handleDiscountChange(
                              index,
                              "maxDiscount",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Service Charges Section */}
              <div className="p-4">
                <div className="row">
                  <h4 className="fw-bold mb-3">
                    Service Charges for Area Customers
                  </h4>
                  <div className="col-12 d-flex flex-wrap gap-5">
                    <div>
                      <label htmlFor="" className="Control-label">Charges per adult</label>

                      <input
                        type="text"
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="7"
                        value={chargePerAdult}
                        onChange={(e) => setChargePerAdult(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="" className="Control-label">Child</label>

                      <input
                        type="text"
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="10"
                        value={chargePerChild}
                        onChange={(e) => setChargePerChild(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="" className="Control-label">Infant</label>

                      <input
                        type="text"
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="01"
                        value={chargePerInfant}
                        onChange={(e) => setChargePerInfant(e.target.value)}
                      />
                    </div>
                    <div className="form-check d-flex align-items-center">
                      <input
                        className="form-check-input border border-black me-2"
                        type="checkbox"
                        id="activeServiceCharge"
                        checked={activeServiceCharge}
                        onChange={(e) => setActiveServiceCharge(e.target.checked)}
                        style={{ width: "1.3rem", height: "1.3rem" }}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="activeServiceCharge"
                      >
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Status Section */}
              <div className="d-flex gap-5 p-4">
                <div className="form-check d-flex align-items-center">
                  <input
                    className="form-check-input border border-black me-2"
                    type="radio"
                    id="package-active"
                    name="package-status"
                    checked={packageStatus === true}
                    onChange={() => setPackageStatus(true)}
                    style={{ width: "1.3rem", height: "1.3rem" }}
                  />
                  <label className="form-check-label" htmlFor="package-active">
                    Package Active
                  </label>
                </div>

                <div className="form-check d-flex align-items-center">
                  <input
                    className="form-check-input border border-black me-2"
                    type="radio"
                    id="package-inactive"
                    name="package-status"
                    checked={packageStatus === false}
                    onChange={() => setPackageStatus(false)}
                    style={{ width: "1.3rem", height: "1.3rem" }}
                  />
                  <label className="form-check-label" htmlFor="package-inactive">
                    Package Inactive
                  </label>
                </div>
              </div>

              {/* Reselling Section */}
              <div className="d-flex gap-5 p-4">
                <div className="form-check d-flex align-items-center">
                  <input
                    className="form-check-input border border-black me-2"
                    type="checkbox"
                    id="reselling-allowed"
                    checked={resellingAllowed}
                    onChange={(e) => setResellingAllowed(e.target.checked)}
                    style={{ width: "1.3rem", height: "1.3rem" }}
                  />
                  <label className="form-check-label fw-medium" htmlFor="reselling-allowed">
                    Allow Reselling
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap gap-2 justify-content-end p-4">
                <button
                  className="btn btn-primary"
                  onClick={() => handleSubmit("save")}
                >
                  Save
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleSubmit("saveAndNew")}
                >
                  Save and New
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleSubmit("saveAndClose")}
                >
                  Save and close
                </button>
                {/* Dev/test helper: create a minimal package using organization 11 */}
                <button
                  className="btn btn-warning"
                  onClick={async () => {
                    await testCreatePackage();
                  }}
                  title="Creates a minimal test package with organization=11"
                >
                  Test Create Package (org 11)
                </button>
                <button
                  className="btn btn-info"
                  onClick={async () => {
                    await checkBackendConnection();
                  }}
                  title="Run quick backend checks for food/ziarat/tickets (org 11)"
                >
                  Check Backend (org 11)
                </button>
                <Link to="/packages" className="btn btn-outline-secondary">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default AddPackages;