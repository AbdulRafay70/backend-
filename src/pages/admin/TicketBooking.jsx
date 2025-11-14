import React, { useState, useEffect, useCallback } from "react";
import { BedDouble, Search } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";
import flightlogo from "../../assets/flightlogo.png";
import { Bag } from "react-bootstrap-icons";
import axios from "axios";
import api from "../../utils/Api";
import AdminFooter from "../../components/AdminFooter";

// Helper function to get organization ID
const getOrgId = (org) => {
  console.log('getOrgId input:', org, 'type:', typeof org);
  if (org && typeof org === "object") {
    console.log('Returning org.id:', org.id);
    return org.id;
  }
  console.log('Returning org as-is:', org);
  return org;
};

const FlightCard = ({ ticket, airlineMap, cityMap, orgId }) => {
  if (!ticket) return null;

  // Get airline info
  const airlineInfo = airlineMap[ticket.airline] || {};

  // Determine displayed flight number: prefer top-level, otherwise use first trip_details.flight_number
  const displayedFlightNumber =
    ticket.flight_number ||
    (ticket.trip_details && ticket.trip_details[0] && ticket.trip_details[0].flight_number) ||
    "N/A";

  // Safely get trip and stopover details
  const tripDetails = ticket.trip_details || [];
  const stopoverDetails = ticket.stopover_details || [];

  // FIX: Updated trip_type values to match backend data
  const outboundTrip = tripDetails.find((t) => t.trip_type === "Departure") || tripDetails[0];
  const returnTrip = tripDetails.find((t) => t.trip_type === "Return");

  const outboundStopover = stopoverDetails.find(
    (s) => s.trip_type === "Departure"
  );
  const returnStopover = stopoverDetails.find((s) => s.trip_type === "Return");

  if (!outboundTrip) {
    return (
      <div className="card border-1 shadow-sm mb-4 rounded-2">
        <div className="card-body p-4">
          <h5>Ticket ID: {ticket.id}</h5>
          <p className="text-danger">Missing outbound trip details</p>
        </div>
      </div>
    );
  }

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "--:--";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-- ---";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });
    } catch (e) {
      return "-- ---";
    }
  };

  const getDuration = (departure, arrival) => {
    if (!departure || !arrival) return "--h --m";
    try {
      const dep = new Date(departure);
      const arr = new Date(arrival);
      const diff = Math.abs(arr - dep);
      const totalMinutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // Format rules:
      // - If duration is at least 1 hour and minutes == 0 -> show "N hour(s)"
      // - If duration is at least 1 hour and minutes > 0 -> show compact "Nh Mm" (e.g. "1h 30m")
      // - If duration is less than 1 hour -> show "Xm"
      if (hours > 0) {
        if (minutes === 0) {
          return `${hours} hour${hours > 1 ? "s" : ""}`;
        }
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch (e) {
      return "--h --m";
    }
  };

  // Compute stopover duration for a trip (returns string like "1h 20m")
  const computeStopoverDuration = (tripType) => {
    try {
      const stop = stopoverDetails.find((s) => s.trip_type === tripType);
      // If there's a stopover record with explicit times, use them
      if (stop) {
        const start =
          stop.arrival_date_time ||
          stop.stopover_arrival_date_time ||
          stop.arrival_time ||
          stop.stopover_arrival ||
          stop.arrival;
        const end =
          stop.departure_date_time ||
          stop.stopover_departure_date_time ||
          stop.departure_time ||
          stop.stopover_departure ||
          stop.departure;

        if (start && end) {
          return getDuration(start, end);
        }
      }

      // Fallback: infer from trip_details segments for the given tripType
      const legs = tripDetails.filter((t) => t.trip_type === tripType);
      if (legs.length > 1) {
        const firstArr = legs[0].arrival_date_time || legs[0].arrival;
        const secondDep = legs[1].departure_date_time || legs[1].departure;
        if (firstArr && secondDep) return getDuration(firstArr, secondDep);
      }

      return null;
    } catch (e) {
      return null;
    }
  };

  // Format a raw stopover_duration value (minutes or text) into a friendly string.
  const formatRawStopoverDuration = (raw) => {
    if (raw === null || raw === undefined) return null;
    // If it's a number, treat as total minutes
    if (typeof raw === "number") {
      const mins = raw;
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      if (hours > 0) {
        if (minutes === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }

    // If it's a numeric string like "120" or "120m", extract digits
    const trimmed = String(raw).trim();
    const onlyDigits = /^\d+$/;
    const digitsWithM = /^(\d+)\s*m(in)?$/i;
    const digitsWithH = /^(\d+)\s*h(ours?)?$/i;

    if (onlyDigits.test(trimmed)) {
      return formatRawStopoverDuration(Number(trimmed));
    }
    let m = trimmed.match(digitsWithM);
    if (m) return formatRawStopoverDuration(Number(m[1]));
    let h = trimmed.match(digitsWithH);
    if (h) {
      const hrs = Number(h[1]);
      return hrs === 1 ? `1 hour` : `${hrs} hours`;
    }

    // If it's already human readable like "1h 30m" or "2 hours", just return as-is
    return trimmed;
  };

  const formatStopoverDurationForDisplay = (tripType, stop) => {
    const computed = computeStopoverDuration(tripType);
    if (computed) return computed;
    if (!stop) return null;
    const raw = stop.stopover_duration;
    return formatRawStopoverDuration(raw);
  };

  // Determine seat warning style
  const seatWarningStyle =
    ticket.left_seats <= 9
      ? {
        color: "#FB4118",
        border: "1px solid #F14848",
        display: "inline-block",
        fontWeight: 500,
      }
      : {
        color: "#3391FF",
        border: "1px solid #3391FF",
        display: "inline-block",
        fontWeight: 500,
      };

  // Refundable badge style
  const refundableBadgeStyle = ticket.is_refundable
    ? {
      background: "#E4F0FF",
      color: "#206DA9",
    }
    : {
      background: "#FFE4E4",
      color: "#D32F2F",
    };

  return (
    <div className="card border mb-4 rounded-2">
      <div className="card-body p-4">
        {/* Outbound Flight Segment */}
        <div className="d-flex justify-conter-between align-items-center gy-3">
          <div className="col-md-2 text-center">
            <img
              src={airlineInfo.logo}
              alt={`${airlineInfo.name || "Airline"} logo`}
              className="img-fluid"
              style={{ maxHeight: "60px", objectFit: "contain" }}
            />
            <div className="text-muted mt-2 small fw-medium">
              {airlineInfo.name || "Unknown Airline"}
            </div>
            <div className="d-flex align-items-center justify-content-center gap-2">
              <div className="text-primary fw-bold small mt-1">{displayedFlightNumber}</div>
              {(ticket.reselling_allowed === true || ticket.reselling_allowed === "true" || ticket.reselling_allowed === 1 || ticket.reselling_allowed === "1") && String(ticket.organization) !== String(orgId) && (
                <span className="badge bg-success">Reselling</span>
              )}
            </div>
          </div>
          <div className="col-md-2 text-center text-md-start">
            <h6 className="mb-0">
              {formatTime(outboundTrip.departure_date_time)}
            </h6>
            <div className="text-muted small">
              {formatDate(outboundTrip.departure_date_time)}
            </div>
            <div className="text-muted small">
              {cityMap[outboundTrip.departure_city] || "Unknown City"}
            </div>
          </div>

          <div className="col-md-4 text-center">
            <div className="text-muted mb-1 small">
              {getDuration(
                outboundTrip.departure_date_time,
                outboundTrip.arrival_date_time
              )}
            </div>
            <div className="position-relative">
              <div className="d-flex align-items-center justify-content-center position-relative">
                {outboundStopover ? (
                  <>
                    <hr className="w-50 m-0" />
                    <div
                      className="position-relative d-flex flex-column align-items-center"
                      style={{ margin: "0 10px" }}
                    >
                      <span
                        className="rounded-circle"
                        style={{
                          width: "10px",
                          height: "10px",
                          backgroundColor: "#699FC9",
                          position: "relative",
                          zIndex: 1,
                        }}
                      ></span>
                      <div
                        className="text-muted small"
                        style={{
                          position: "absolute",
                          top: "14px", // adjust space between dot and text
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cityMap[outboundStopover.stopover_city] ||
                          "Unknown City"}
                      </div>
                    </div>
                    <hr className="w-50 m-0" />
                  </>
                ) : (
                  <hr className="w-100 m-0" />
                )}
              </div>
            </div>

            <div className="text-muted mt-4 small mt-1">
              {outboundStopover ? `${cityMap[outboundStopover.stopover_city] || 'Stopover'} Stopover — ${formatStopoverDurationForDisplay("Departure", outboundStopover) || "N/A"}` : "Non-stop"}
            </div>
          </div>
          <div className="col-md-2 text-center text-md-start">
            <h6 className="mb-0 ">
              {formatTime(outboundTrip.arrival_date_time)}
            </h6>
            <div className="text-muted small">
              {formatDate(outboundTrip.arrival_date_time)}
            </div>
            <div className="text-muted small">
              {cityMap[outboundTrip.arrival_city] || "Unknown City"}
            </div>
          </div>
          <div className="col-md-2 text-center">
            <div className="fw-medium">
              {getDuration(
                outboundTrip.departure_date_time,
                outboundTrip.arrival_date_time
              )}
            </div>
            <div
              className="text-uppercase fw-semibold small mt-1"
              style={{ color: "#699FC9" }}
            >
              {outboundStopover ? `${formatStopoverDurationForDisplay("Departure", outboundStopover) || "Stopover"}` : "Non-stop"}
            </div>
            <div
              className="small mt-1 px-2 py-1 rounded"
              style={seatWarningStyle}
            >
              {ticket.left_seats <= 9
                ? `Only ${ticket.left_seats} seats left`
                : `${ticket.left_seats} seats left`}
            </div>
          </div>
        </div>

        {/* Return Flight Segment (if exists) */}
        {returnTrip && (
          <>
            <hr className="my-4" />
            <div className="d-flex justify-conter-between align-items-center gy-3 mt-3">
              <div className="col-md-2 text-center">
                  <img
                    src={airlineInfo.logo}
                    alt={`${airlineInfo.name || "Airline"} logo`}
                    className="img-fluid"
                    style={{ maxHeight: "60px", objectFit: "contain" }}
                  />
                <div className="text-muted mt-2 small fw-medium">
                  {airlineInfo.name || "Unknown Airline"}
                </div>
              </div>
              <div className="col-md-2 text-center text-md-start">
                <h6 className="mb-0 ">
                  {formatTime(returnTrip.departure_date_time)}
                </h6>
                <div className="text-muted small">
                  {formatDate(returnTrip.departure_date_time)}
                </div>
                <div className="text-muted small">
                  {cityMap[returnTrip.departure_city] || "Unknown City"}
                </div>
              </div>

              <div className="col-md-4 text-center">
                <div className="text-muted mb-1 small">
                  {getDuration(
                    returnTrip.departure_date_time,
                    returnTrip.arrival_date_time
                  )}
                </div>
                <div className="position-relative">
                  <div className="d-flex align-items-center justify-content-center position-relative">
                    {returnStopover ? (
                      <>
                        <hr className="w-50 m-0" />
                        <div
                          className="position-relative d-flex flex-column align-items-center"
                          style={{ margin: "0 10px" }}
                        >
                          <span
                            className="rounded-circle"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor: "#699FC9",
                              position: "relative",
                              zIndex: 1,
                            }}
                          ></span>
                          <div
                            className="text-muted small"
                            style={{
                              position: "absolute",
                              top: "14px", // adjust space between dot and text
                              whiteSpace: "nowrap",
                            }}
                          >
                            {cityMap[returnStopover.stopover_city] ||
                              "Unknown City"}
                          </div>
                        </div>
                        <hr className="w-50 m-0" />
                      </>
                    ) : (
                      <hr className="w-100 m-0" />
                    )}
                  </div>
                </div>

                <div className="text-muted mt-4 small mt-1">
                  {returnStopover ? `${cityMap[returnStopover.stopover_city] || 'Stopover'} Stopover — ${formatStopoverDurationForDisplay("Return", returnStopover) || "N/A"}` : "Non-stop"}
                </div>
              </div>
              <div className="col-md-2 text-center text-md-start">
                <h6 className="mb-0 ">
                  {formatTime(returnTrip.arrival_date_time)}
                </h6>
                <div className="text-muted small">
                  {formatDate(returnTrip.arrival_date_time)}
                </div>
                <div className="text-muted small">
                  {cityMap[returnTrip.arrival_city] || "Unknown City"}
                </div>
              </div>
              <div className="col-md-2 text-center">
                <div className="fw-medium">
                  {getDuration(
                    returnTrip.departure_date_time,
                    returnTrip.arrival_date_time
                  )}
                </div>
                <div
                  className="text-uppercase fw-semibold small mt-1"
                  style={{ color: "#699FC9" }}
                >
                  {returnStopover ? `${formatStopoverDurationForDisplay("Return", returnStopover) || "1 Stop"}` : "Non-stop"}
                </div>
                {/* <div
                  className="small mt-1 px-2 py-1 rounded"
                  style={seatWarningStyle}
                >
                  {ticket.left_seats <= 9
                    ? `Only ${ticket.left_seats} seats left`
                    : `${ticket.left_seats} seats left`}
                </div> */}
              </div>
            </div>
          </>
        )}

        <hr className="my-4" />

        <div className="row align-items-center gy-3">
          <div className="col-md-7 d-flex flex-wrap gap-3 align-items-center">
            <span
              className="badge px-3 py-2 rounded"
              style={refundableBadgeStyle}
            >
              {ticket.is_refundable ? "Refundable" : "Non-Refundable"}
            </span>

            <span className="small" style={{ color: "#699FC9" }}>
              <Bag /> {ticket.baggage_weight || ticket.weight || 0}kg Baggage ({ticket.baggage_pieces || ticket.pieces || 0} pieces)
            </span>

            <span
              className="small"
              style={{ color: ticket.is_meal_included ? "#699FC9" : "#FB4118" }}
            >
              {ticket.is_meal_included ? "Meal Included" : "No Meal Included"}
            </span>
          </div>

          <div className="col-md-5 text-md-end text-center d-flex">
            <div className="d-flex flex-column me-3 align-items-center">
              <div className="fw-bold">
                PKR {ticket.adult_price}{" "}
                <span className="text-muted fw-normal">/per person</span>
              </div>
            </div>
            <Link to={`/ticket-booking/detail/${ticket.id}`}>
              <button
                className="btn btn-primary btn-sm w-100 rounded "
                style={{ padding: "0.5rem 1.5rem" }}
              >
                {(ticket.is_umrah_seat = "See Details")}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Shimmer Effect Component
const FlightCardShimmer = () => {
  return (
    <div className="card border-1 shadow-sm mb-4 rounded-2 shimmer">
      <div className="card-body p-4">
        <div className="row align-items-center gy-3">
          {/* Airline Logo */}
          <div className="col-md-2 text-center">
            <div
              className="shimmer-image rounded-3 shadow-sm border p-1 mx-auto"
              style={{ height: "60px", width: "60px" }}
            ></div>
            <div
              className="shimmer-line mt-2 mx-auto"
              style={{ width: "80px", height: "10px" }}
            ></div>
          </div>

          {/* Departure */}
          <div className="col-md-2 text-center text-md-start">
            <div
              className="shimmer-line"
              style={{
                width: "50px",
                height: "20px",
                margin: "0 auto 5px auto",
              }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "70px", height: "12px", margin: "0 auto" }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "60px", height: "12px", margin: "0 auto" }}
            ></div>
          </div>

          {/* Duration and stop */}
          <div className="col-md-4 text-center">
            <div
              className="shimmer-line"
              style={{
                width: "60px",
                height: "12px",
                margin: "0 auto 10px auto",
              }}
            ></div>
            <div className="d-flex align-items-center justify-content-center">
              <div
                className="shimmer-line"
                style={{ flex: 1, height: "1px" }}
              ></div>
              <div
                className="shimmer-dot rounded-circle mx-2"
                style={{ width: "10px", height: "10px" }}
              ></div>
              <div
                className="shimmer-line"
                style={{ flex: 1, height: "1px" }}
              ></div>
            </div>
            <div
              className="shimmer-line mt-1"
              style={{ width: "60px", height: "12px", margin: "0 auto" }}
            ></div>
          </div>

          {/* Arrival */}
          <div className="col-md-2 text-center text-md-start">
            <div
              className="shimmer-line"
              style={{
                width: "50px",
                height: "20px",
                margin: "0 auto 5px auto",
              }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "70px", height: "12px", margin: "0 auto" }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "60px", height: "12px", margin: "0 auto" }}
            ></div>
          </div>

          {/* Duration and button */}
          <div className="col-md-2 text-center">
            <div
              className="shimmer-line"
              style={{
                width: "70px",
                height: "20px",
                margin: "0 auto 5px auto",
              }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "80px", height: "20px", margin: "0 auto" }}
            ></div>
          </div>
        </div>

        <hr className="my-4" />

        <div className="row align-items-center gy-3">
          <div className="col-md-7 d-flex flex-wrap gap-3 align-items-center">
            <div
              className="shimmer-badge"
              style={{ width: "100px", height: "25px" }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "80px", height: "20px" }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "100px", height: "20px" }}
            ></div>
          </div>
          <div className="col-md-5 text-md-end text-center d-flex">
            <div className="d-flex flex-column me-3 align-items-center">
              <div
                className="shimmer-line"
                style={{ width: "100px", height: "20px" }}
              ></div>
            </div>
            <div
              className="shimmer-button"
              style={{ width: "100px", height: "38px" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TicketBooking = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [airlineMap, setAirlineMap] = useState({});
  const [cityMap, setCityMap] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [pnr, setPnr] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [sortOptions, setSortOptions] = useState({
    airline: false,
    price: false,
    departureDate: false,
    umrahGroups: false,
    closedBooking: false,
    travelDatePassed: false,
    deleteHistory: false,
  });

  const token = localStorage.getItem("accessToken");
  const selectedOrg = JSON.parse(localStorage.getItem("selectedOrganization"));
  const orgId = getOrgId(selectedOrg);

  // Check if we have required data
  if (!selectedOrg) {
    console.error('No selectedOrganization in localStorage');
    setError("No organization selected. Please select an organization first.");
    setIsLoading(false);
    return;
  }

  const [cityCodeMap, setCityCodeMap] = useState({});
  const [routeFilters, setRouteFilters] = useState({}); // Changed to empty object

  const [airlineFilters, setAirlineFilters] = useState({});

  const tabs = [
    { name: "Ticket Bookings", path: "/ticket-booking" },
    { name: "Add Tickets", path: "/ticket-booking/add-ticket" },
  ];

  const [filteredTickets, setFilteredTickets] = useState([]);

  // Use shared api wrapper (automatically attaches token)

  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds for debugging
    return Date.now() - cachedData.timestamp < fiveMinutes;
  };

  const getTicketRoute = useCallback(
    (ticket) => {
      const tripDetails = ticket.trip_details || [];
      const outboundTrip = tripDetails.find((t) => t.trip_type === "Departure") || tripDetails[0];
      const returnTrip = tripDetails.find((t) => t.trip_type === "Return");

      if (!outboundTrip) return "UNK-UNK";

      // Helper to resolve a city reference to a code string.
      const resolveCityCode = (cityRef) => {
        if (!cityRef && cityRef !== 0) return "UNK";
        // cityRef might be an object with id or code, or a numeric/string id
        if (typeof cityRef === "object") {
          if (cityRef.code) return cityRef.code;
          if (cityRef.id) {
            return (
              cityCodeMap[cityRef.id] ||
              cityCodeMap[String(cityRef.id)] ||
              cityMap[cityRef.id] ||
              "UNK"
            );
          }
        }
        // primitive id or string
        if (cityCodeMap[cityRef]) return cityCodeMap[cityRef];
        if (cityCodeMap[String(cityRef)]) return cityCodeMap[String(cityRef)];
        // fallback to city name if available
        if (cityMap[cityRef]) return cityMap[cityRef].substr(0, 3).toUpperCase();
        // as last resort, coerce to string and take first 3 chars
        try {
          return String(cityRef).substr(0, 3).toUpperCase();
        } catch (e) {
          return "UNK";
        }
      };

      const depCode = resolveCityCode(outboundTrip.departure_city);
      const arrCode = resolveCityCode(outboundTrip.arrival_city);

      if (!returnTrip) {
        return `${depCode}-${arrCode}`;
      }

      const returnDepCode = resolveCityCode(returnTrip.departure_city);
      const returnArrCode = resolveCityCode(returnTrip.arrival_city);

      if (arrCode === returnDepCode) {
        return `${depCode}-${arrCode}-${returnArrCode}`;
      }

      return `${depCode}-${arrCode}-${returnDepCode}-${returnArrCode}`;
    },
    [cityCodeMap]
  );

  // Fetch all data in parallel
  useEffect(() => {
    const fetchData = async () => {
      console.log('Auth data:', { token: token ? 'present' : 'missing', selectedOrg, orgId });

      if (!selectedOrg) {
        console.error('No selectedOrganization in localStorage');
        setError("No organization selected. Please select an organization first.");
        setIsLoading(false);
        return;
      }

      if (!orgId || !token) {
        console.error('Missing orgId or token:', { orgId, token: token ? 'present' : 'missing' });
        setError("Organization ID or token not found");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if we have valid cached data
        const cacheKey = `ticketData-${orgId}`;
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));

        console.log(`Org ID: ${orgId}, Cache key: ${cacheKey}`);
        console.log(`Cache exists: ${!!cachedData}, Cache valid: ${cachedData ? isCacheValid(cachedData) : false}`);

        // Use cache only when it appears valid and contains tickets.
        // A cached object with an empty tickets array can hide newly created tickets
        // (observed when some code seeded an empty cache with a future timestamp).
        if (cachedData && isCacheValid(cachedData) && Array.isArray(cachedData.tickets) && cachedData.tickets.length > 0) {
          // Use cached data
          console.log('Using cached data');
          setTickets(cachedData.tickets);
          setAirlineMap(cachedData.airlineMap);
          setCityMap(cachedData.cityMap);
          setCityCodeMap(cachedData.cityCodeMap);

          // Initialize airline filters (only for airlines that appear in tickets)
          const initialAirlineFilters = {};
          try {
            const airlineIdsInTickets = new Set(
              (cachedData.tickets || []).map((t) => (t && typeof t.airline === 'object' ? t.airline.id : t.airline)).filter(Boolean)
            );
            Object.keys(cachedData.airlineMap).forEach((airlineId) => {
              if (airlineIdsInTickets.has(Number(airlineId)) || airlineIdsInTickets.has(airlineId)) {
                const airlineName = cachedData.airlineMap[airlineId].name;
                initialAirlineFilters[airlineName] = false;
              }
            });
          } catch (e) {
            // Fallback: include all known airlines if something goes wrong parsing cached data
            Object.keys(cachedData.airlineMap).forEach((airlineId) => {
              const airlineName = cachedData.airlineMap[airlineId].name;
              initialAirlineFilters[airlineName] = false;
            });
          }
          setAirlineFilters(initialAirlineFilters);

          setIsLoading(false);
          return;
        }

        if (cachedData && isCacheValid(cachedData) && Array.isArray(cachedData.tickets) && cachedData.tickets.length === 0) {
          // Log an explicit warning to help debug stale/empty caches
          console.warn(`Found valid cache for ${cacheKey} but it contains 0 tickets — ignoring cache and fetching fresh data.`);
        }

        console.log('Fetching fresh data from API');
        // No valid cache, fetch fresh data from local API wrapper
        // declare these in outer scope so they are available after the try/catch
        let ticketsData = [];
        let airlinesData = [];
        let citiesData = [];
        try {
          const [ticketsResponse, airlinesResponse, citiesResponse] = await Promise.all([
            api.get(`/tickets/`, { params: { organization: orgId } }),
            api.get(`/airlines/`, { params: { organization: orgId } }),
            api.get(`/cities/`, { params: { organization: orgId } }),
          ]);

          console.log('API Responses:');
          console.log('Tickets response:', ticketsResponse);
          console.log('Tickets data:', ticketsResponse?.data);
          console.log('Airlines data:', airlinesResponse?.data);
          console.log('Cities data:', citiesResponse?.data);

          // Handle different response structures
          ticketsData = [];
          if (ticketsResponse?.data) {
            if (Array.isArray(ticketsResponse.data)) {
              ticketsData = ticketsResponse.data;
            } else if (ticketsResponse.data.data && Array.isArray(ticketsResponse.data.data)) {
              ticketsData = ticketsResponse.data.data;
            } else if (ticketsResponse.data.results && Array.isArray(ticketsResponse.data.results)) {
              ticketsData = ticketsResponse.data.results;
            }
          }

          airlinesData = Array.isArray(airlinesResponse?.data) ? airlinesResponse.data : [];
          citiesData = Array.isArray(citiesResponse?.data) ? citiesResponse.data : [];

          console.log(`Parsed data - Tickets: ${ticketsData.length}, Airlines: ${airlinesData.length}, Cities: ${citiesData.length}`);          console.log(`Parsed data - Tickets: ${ticketsData.length}, Airlines: ${airlinesData.length}, Cities: ${citiesData.length}`);
        } catch (apiError) {
          console.error('API call failed:', apiError);
          console.error('API error response:', apiError.response);
          throw apiError;
        }

        console.log(`Parsed data - Tickets: ${ticketsData.length}, Airlines: ${airlinesData.length}, Cities: ${citiesData.length}`);

        // Create airline map with names and logos
        const airlineMapData = airlinesData.reduce((map, airline) => {
          map[airline.id] = {
            name: airline.name,
            logo: airline.logo,
          };
          return map;
        }, {});

        // Create city map (for names)
        const cityMapData = citiesData.reduce((map, city) => {
          map[city.id] = city.name;
          return map;
        }, {});

        // Create city code map
        const cityCodeMapData = citiesData.reduce((map, city) => {
          map[city.id] = city.code;
          return map;
        }, {});

        // Initialize airline filters only for airlines present in the ticket results
        const initialAirlineFilters = {};
        try {
          const airlineIdsInTickets = new Set(
            (ticketsData || []).map((t) => (t && typeof t.airline === 'object' ? t.airline.id : t.airline)).filter(Boolean)
          );

          airlinesData.forEach((airline) => {
            // airline.id may be number or string depending on API
            if (airlineIdsInTickets.has(Number(airline.id)) || airlineIdsInTickets.has(airline.id)) {
              initialAirlineFilters[airline.name] = false;
            }
          });
        } catch (e) {
          // fallback: include all airlines
          airlinesData.forEach((airline) => {
            initialAirlineFilters[airline.name] = false;
          });
        }

        // Update state
        setTickets(ticketsData);
        setAirlineMap(airlineMapData);
        setCityMap(cityMapData);
        setCityCodeMap(cityCodeMapData);
        setAirlineFilters(initialAirlineFilters);

        // Cache the data with a timestamp
        const dataToCache = {
          tickets: ticketsData,
          airlineMap: airlineMapData,
          cityMap: cityMapData,
          cityCodeMap: cityCodeMapData,
          timestamp: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(dataToCache));

        console.log(`Fetched ${ticketsData.length} tickets for organization ${orgId}`);
      } catch (err) {
        let errorMessage = "Failed to load data";

        if (err.response) {
          // Server responded with error status
          errorMessage =
            err.response.data?.message ||
            err.response.data?.detail ||
            `Server error: ${err.response.status}`;
        } else if (err.request) {
          // Request was made but no response received
          errorMessage = "Network error: No response from server";
        } else if (err.code === "ECONNABORTED") {
          // Request timed out
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message) {
          // Other errors
          errorMessage = err.message;
        }

        setError(errorMessage);
        console.error("API error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, orgId]);

  // Filter and sort tickets
  useEffect(() => {
    if (isLoading) {
      setFilteredTickets([]);
      return;
    }

    if (!tickets.length) {
      setFilteredTickets([]);
      return;
    }

    let result = [...tickets];

    // Filter out tickets without trip details
    result = result.filter(
      (ticket) =>
        ticket.trip_details &&
        Array.isArray(ticket.trip_details) &&
        ticket.trip_details.length > 0
    );

    // Hide tickets from other organizations unless owner allowed reselling
    result = result.filter((ticket) => {
      // Accept several possible owner fields since backend responses vary
      const ticketOrg =
        ticket.organization ||
        ticket.organization_id ||
        ticket.inventory_owner_organization_id ||
        ticket.owner_organization_id ||
        ticket.inventory_owner_company ||
        null;
      const isExternalTicket = ticketOrg && String(ticketOrg) !== String(orgId);

      // Debug: log owner/resell state to help trace visibility issues
      console.debug("Ticket filter:", {
        ticketId: ticket.id,
        ticketOrg,
        viewingOrg: orgId,
        isExternalTicket,
        reselling_allowed: ticket.reselling_allowed,
      });

      const resellAllowed =
        ticket.reselling_allowed === true ||
        ticket.reselling_allowed === "true" ||
        ticket.reselling_allowed === 1 ||
        ticket.reselling_allowed === "1";

      if (isExternalTicket && !resellAllowed) {
        return false;
      }
      return true;
    });

    console.log(`After filtering: ${result.length} tickets from ${tickets.length} total`);

    // PNR search
    if (pnr) {
      result = result.filter((ticket) =>
        ticket.pnr.toLowerCase().includes(pnr.toLowerCase())
      );
    }

    // Destination search
    if (destination) {
      const destUpper = destination.toUpperCase();
      result = result.filter((ticket) => {
        // FIX: Updated to match backend trip_type value
        const outbound = ticket.trip_details?.find(
          (t) => t.trip_type === "Departure"
        ) || ticket.trip_details?.[0];
        if (!outbound) return false;
        const arrivalCity = cityMap[outbound.arrival_city] || "";
        return arrivalCity.toUpperCase().includes(destUpper);
      });
    }

    // Travel date filter
    if (travelDate) {
      const selectedDate = new Date(travelDate);
      result = result.filter((ticket) => {
        // FIX: Updated to match backend trip_type value
        const outbound = ticket.trip_details?.find(
          (t) => t.trip_type === "Departure"
        ) || ticket.trip_details?.[0];
        if (!outbound) return false;
        const depDate = new Date(outbound.departure_date_time);
        return (
          depDate.getDate() === selectedDate.getDate() &&
          depDate.getMonth() === selectedDate.getMonth() &&
          depDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }

    // Route filters
    const selectedRoutes = Object.entries(routeFilters)
      .filter(([_, selected]) => selected)
      .map(([route]) => route);

    if (selectedRoutes.length > 0) {
      result = result.filter((ticket) => {
        const ticketRoute = getTicketRoute(ticket);
        return selectedRoutes.includes(ticketRoute);
      });
    }

    // Airline filters
    const selectedAirlines = Object.entries(airlineFilters)
      .filter(([_, selected]) => selected)
      .map(([airline]) => airline);

    if (selectedAirlines.length > 0) {
      result = result.filter((ticket) => {
        const airlineName = airlineMap[ticket.airline]?.name;
        return airlineName && selectedAirlines.includes(airlineName);
      });
    }

    // Sorting
    const activeSorts = Object.entries(sortOptions)
      .filter(([_, selected]) => selected)
      .map(([key]) => key);

    if (activeSorts.length > 0) {
      result.sort((a, b) => {
        for (const key of activeSorts) {
          let cmp = 0;
          switch (key) {
            case "airline": {
              const airlineA = airlineMap[a.airline]?.name || "";
              const airlineB = airlineMap[b.airline]?.name || "";
              cmp = airlineA.localeCompare(airlineB);
              break;
            }
            case "price":
              cmp = a.adult_price - b.adult_price;
              break;
            case "departureDate": {
              // FIX: Updated to match backend trip_type value
              const outboundA = a.trip_details?.find(
                (t) => t.trip_type === "Departure"
              ) || a.trip_details?.[0];
              const outboundB = b.trip_details?.find(
                (t) => t.trip_type === "Departure"
              ) || b.trip_details?.[0];
              const dateA = outboundA
                ? new Date(outboundA.departure_date_time)
                : 0;
              const dateB = outboundB
                ? new Date(outboundB.departure_date_time)
                : 0;
              cmp = dateA - dateB;
              break;
            }
            case "umrahGroups":
              if (a.is_umrah_seat && !b.is_umrah_seat) cmp = -1;
              else if (!a.is_umrah_seat && b.is_umrah_seat) cmp = 1;
              break;
            default:
              cmp = 0;
          }
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    }

    setFilteredTickets(result);
  }, [
    tickets,
    pnr,
    destination,
    travelDate,
    routeFilters,
    airlineFilters,
    sortOptions,
    airlineMap,
    cityMap,
    isLoading,
    cityCodeMap,
    routeFilters,
    getTicketRoute,
  ]);

  // Generate unique routes from tickets
  useEffect(() => {
    if (tickets.length === 0 || Object.keys(cityCodeMap).length === 0) return;

    const uniqueRoutes = {};

    tickets.forEach((ticket) => {
      const route = getTicketRoute(ticket);
      uniqueRoutes[route] = true;
    });

    // Initialize routeFilters with unique routes
    const newRouteFilters = {};
    Object.keys(uniqueRoutes).forEach((route) => {
      newRouteFilters[route] = routeFilters[route] || false;
    });

    setRouteFilters(newRouteFilters);
  }, [tickets, cityCodeMap]);

  const handleSearch = () => {
    console.log("Searching:", { pnr, destination, travelDate });
  };

  const handleShowAll = () => {
    setPnr("");
    setDestination("");
    setTravelDate("");
    setRouteFilters({
      "LHE-DXB": false,
      "SKT-SHJ": false,
      "ISB-LHR": false,
    });

    // Reset route filters
    setRouteFilters((prev) => {
      const reset = { ...prev };
      for (const key in reset) {
        reset[key] = false;
      }
      return reset;
    });

    // Reset airline filters
    const resetAirlineFilters = { ...airlineFilters };
    for (const key in resetAirlineFilters) {
      resetAirlineFilters[key] = false;
    }
    setAirlineFilters(resetAirlineFilters);

    // Reset sort options
    setSortOptions({
      airline: false,
      price: false,
      departureDate: false,
      umrahGroups: false,
      closedBooking: false,
      travelDatePassed: false,
      deleteHistory: false,
    });
  };

  const handleSortChange = (key) => {
    setSortOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRouteFilterChange = (route) => {
    setRouteFilters((prev) => ({ ...prev, [route]: !prev[route] }));
  };

  const handleAirlineFilterChange = (airline) => {
    setAirlineFilters((prev) => ({ ...prev, [airline]: !prev[airline] }));
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
          }
          .shimmer-line, .shimmer-image, .shimmer-badge, .shimmer-button, .shimmer-dot {
            background: #e0e0e0;
            border-radius: 4px;
          }
        `}
      </style>


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
              <div className="row">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  {/* Navigation Tabs */}
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3  ${tab.name === "Ticket Bookings"
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
                  <div className="d-flex">
                    {/* <div className="input-group" style={{ maxWidth: "300px" }}>
                      <span className="input-group-text">
                        <Search />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search name, address, job, etc"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div> */}
                    <div className="mb-2">
                      <button
                        className="btn text-white"
                        style={{ background: "#1976D2" }}
                      >
                        Export
                      </button>
                    </div>
                  </div>
                </div>


                {/* Flight Booking Interface */}
                <div className="container-fluid min-vh-100">
                  {/* Header */}
                  <div className="shadow-sm p-3 mb-4 rounded">
                    <h5 className="mb-4 fw-bold">Groups Tickets</h5>

                    {/* Search Form */}
                    <div className="row g-3 d-flex flex-wrap justify-content-center align-items-center">
                      <div className="col-md-3">
                        <label htmlFor="" className="form-label">PNR</label>
                        <input
                          type="text"
                          className="form-control rounded shadow-none  px-1 py-2"
                          value={pnr}
                          onChange={(e) => setPnr(e.target.value)}
                          placeholder="SY192382"
                        />
                      </div>

                      <div className="col-md-3">
                        <label htmlFor="" className="form-label">
                          Enter Destination
                        </label>
                        <div className="input-group">
                          {/* <span className="input-group-text bg-white  text-primary">
                            <BedDouble />
                          </span> */}
                          <input
                            type="text"
                            className="form-control rounded shadow-none  px-1 py-2"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="Dubai (DXB)"
                          />
                        </div>
                      </div>

                      <div className="col-md-3">
                        <label htmlFor="" className="form-label">
                          Travel Date
                        </label>
                        <div className="input-group">
                          <input
                            type="date"
                            className="form-control rounded shadow-none  px-1 py-2"
                            value={travelDate}
                            onChange={(e) => setTravelDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-3 d-flex align-items-end ">

                        <button
                          className="btn btn-sm btn-primary me-2 px-4"
                          onClick={handleSearch}
                        >
                          Search
                        </button>


                        <button
                          className="btn btn-sm  btn-primary px-4"
                          onClick={handleShowAll}
                        >
                         All
                        </button>

                      </div>
                    </div>
                  </div>
                  {/* Sort Options */}
                  <div className=" mb-4 d-flex gap-5 flex-wrap">
                    <div className="">
                      <h5 className="mb-0 fw-bold">Sort:</h5>
                    </div>
                    <div className="d-flex gap-3 flex-nowrap overflow-auto">
                      {Object.entries({
                        airline: "Airline",
                        price: "Price",
                        departureDate: "Departure Date",
                        umrahGroups: "Umrah Groups",
                        closedBooking: "Closed Booking",
                        travelDatePassed: "Travel Date Passed",
                        deleteHistory: "Delete History",
                      }).map(([key, label]) => (
                        <div className="form-check" key={key}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={sortOptions[key]}
                            onChange={() => handleSortChange(key)}
                            id={key}
                          />
                          <label className="form-check-label text-nowrap" htmlFor={key}>
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>

                  </div>
                  <div className="row">
                    <div className="col-md-3">
                      {/* Route Filter */}
                      <div className="mb-4  border rounded">
                        <div className="mt-4">
                          <h6
                            className="mb-4 fw-bold text-center"
                            style={{ color: "#548579" }}
                          >
                            Route
                          </h6>
                        </div>
                        <div className="d-flex flex-md-column justify-content-start align-items-start gap-3 ps-4 overflow-auto flex-nowrap">
                          {/* Dynamic route filters */}
                          {Object.keys(routeFilters).map((route) => (
                            <div className="form-check" key={route}>
                              <input
                                className="form-check-input "
                                type="checkbox"
                                checked={routeFilters[route]}
                                onChange={() => handleRouteFilterChange(route)}
                                id={route}
                              />
                              <label
                                className="form-check-label small text-nowrap"
                                htmlFor={route}
                              >
                                {route}
                              </label>
                            </div>
                          ))}
                        </div>
                        {/* Airline Filter */}
                        <div className="">
                          <h6
                            className="mb-4 fw-bold mt-4 text-center"
                            style={{ color: "#548579" }}
                          >
                            Airline
                          </h6>
                        </div>
                        <div className="d-flex flex-md-column justify-content-start align-items-start gap-3 ps-4 overflow-auto flex-nowrap">
                          {/* Dynamic route filters */}
                          {Object.keys(airlineFilters).map((airlineName) => (
                            <div className="form-check" key={airlineName}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={airlineFilters[airlineName]}
                                onChange={() =>
                                  handleAirlineFilterChange(airlineName)
                                }
                                id={airlineName}
                              />
                              <label
                                className="form-check-label small text-nowrap"
                                htmlFor={airlineName}
                              >
                                {airlineName}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9">
                      {/* Loading state with shimmer effect */}
                      {isLoading && (
                        <>
                          <FlightCardShimmer />
                          <FlightCardShimmer />
                          <FlightCardShimmer />
                        </>
                      )}

                      {/* Error state */}
                      {!isLoading && error && (
                        <div className="alert alert-danger my-5">
                          <h5>Error Loading Data</h5>
                          <p className="mb-1">{error}</p>
                          <p className="small mb-0">Organization ID: {orgId}</p>
                          <div className="mt-3">
                            <button
                              className="btn btn-sm btn-outline-danger me-2"
                              onClick={() => window.location.reload()}
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      )}

                      {/* No tickets found */}
                      {!isLoading && !error && filteredTickets.length === 0 && (
                        <div className="text-center my-5">
                          <h5>No tickets found</h5>
                          <p>Try adjusting your search criteria</p>
                          <button
                            className="btn btn-primary mt-2"
                            onClick={handleShowAll}
                          >
                            Show All Tickets
                          </button>
                        </div>
                      )}

                      {/* Display filtered tickets */}
                      {!isLoading && !error && filteredTickets.length > 0 && (
                        <div className="small">
                          {/* <div className="mb-3 text-muted">
                      Showing {filteredTickets.length} of {tickets.length}{" "}
                      tickets
                    </div> */}
                          {filteredTickets.map((ticket, idx) => {
                            // Ensure a stable, unique key for each ticket entry.
                            // Prefer numeric `ticket.id` when present; otherwise
                            // fallback to a combination of pnr, organization and index.
                            const safeId = ticket.id !== undefined && ticket.id !== null
                              ? String(ticket.id)
                              : `${String(ticket.pnr || "pnr")}-${String(ticket.organization || ticket.organization_id || "org")}-${idx}`;

                            return (
                              <FlightCard
                                key={safeId}
                                ticket={ticket}
                                airlineMap={airlineMap}
                                cityMap={cityMap}
                                orgId={orgId}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
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

export default TicketBooking;
