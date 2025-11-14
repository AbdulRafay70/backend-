import React, { useState, useEffect, useCallback } from "react";
import { BedDouble, Search } from "lucide-react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Link, NavLink } from "react-router-dom";
import flightlogo from "../../assets/flightlogo.png";
import { Bag } from "react-bootstrap-icons";
import axios from "axios";
import AdminFooter from "../../components/AdminFooter";

const getOrgId = () => {
  const agentOrg = localStorage.getItem("agentOrganization");
  if (!agentOrg) return null;

  const orgData = JSON.parse(agentOrg);
  return orgData.ids[0]; // Get the first organization ID
};

const FlightCard = ({ ticket, airlineMap, cityMap }) => {
  if (!ticket) return null;

  // Get airline info
  const airlineInfo = airlineMap[ticket.airline] || {};

  // Safely get trip and stopover details
  const tripDetails = ticket.trip_details || [];
  const stopoverDetails = ticket.stopover_details || [];

  // FIX: Updated trip_type values to match backend data
  const outboundTrip = tripDetails.find((t) => t.trip_type === "Departure");
  const returnTrip = tripDetails.find((t) => t.trip_type === "Return");

  const outboundStopover = stopoverDetails.find(
    (s) => s.trip_type === "Departure"
  );
  const returnStopover = stopoverDetails.find((s) => s.trip_type === "Return");

  if (!outboundTrip) {
    return (
      <div className="card border-1 shadow-sm mb-4 rounded-2 ">
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
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (e) {
      return "--h --m";
    }
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
    <div className="card border-1 mb-4 small rounded-2 border">
      <div className="card-body p-4">
        {/* Outbound Flight Segment */}
        <div className="row align-items-center gy-3">
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
            <h5 className="mb-0 fw-bold">
              {formatTime(outboundTrip.departure_date_time)}
            </h5>
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
              {outboundStopover ? "1 Stop" : "Non-stop"}
            </div>
          </div>
          <div className="col-md-2 text-center text-md-start">
            <h5 className="mb-0 fw-bold">
              {formatTime(outboundTrip.arrival_date_time)}
            </h5>
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
              {outboundStopover ? "1 Stop" : "Non-stop"}
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
            <div className="row align-items-center gy-3 mt-3">
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
                <h5 className="mb-0 fw-bold">
                  {formatTime(returnTrip.departure_date_time)}
                </h5>
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
                  {outboundStopover ? "1 Stop" : "Non-stop"}
                </div>
              </div>
              <div className="col-md-2 text-center text-md-start">
                <h5 className="mb-0 fw-bold">
                  {formatTime(returnTrip.arrival_date_time)}
                </h5>
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
                  {returnStopover ? "1 Stop" : "Non-stop"}
                </div>
                {/* <div
                  className="small mt-1 px-2 py-1 rounded"
                  style={seatWarningStyle}
                > */}
                <div
                  className="small mt-1 px-2 py-1 rounded"
                  style={seatWarningStyle}
                >
                  {ticket.left_seats <= 9
                    ? `Only ${ticket.left_seats} seats left`
                    : `${ticket.left_seats} seats left`}
                </div>
                {/* </div> */}
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
              <Bag /> {ticket.weight}kg Baggage ({ticket.pieces} pieces)
            </span>

            <span
              className="small"
              style={{ color: ticket.is_meal_included ? "#699FC9" : "#FB4118" }}
            >
              {ticket.is_meal_included ? "Meal Included" : "No Meal Included"}
            </span>
          </div>

          <div className="col-md-5 text-md-end text-center d-flex align-items-center justify-content-end">
            <div className="d-flex flex-column me-3 align-items-center">
              <div className="fw-bold">
                PKR {ticket.adult_price}{" "}
                <span className="text-muted fw-normal">/per person</span>
              </div>
            </div>
            <Link
              to={`/booking/detail`}
              state={{ ticket, cityMap, airlineMap }}
              onClick={() => localStorage.removeItem('TicketPassengersDetails')}
            >
              <button
                id="btn" className="btn btn-sm w-100 rounded"
                style={{ padding: "0.5rem 1.5rem" }}
              >
                Continue
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
    <div className="card border-1 shadow-sm mb-4 rounded-2  shimmer">
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

  const token = localStorage.getItem("agentAccessToken");
  // const selectedOrg = JSON.parse();
  const orgId = getOrgId();

  const [cityCodeMap, setCityCodeMap] = useState({});
  const [routeFilters, setRouteFilters] = useState({}); // Changed to empty object

  const [airlineFilters, setAirlineFilters] = useState({});


  const [filteredTickets, setFilteredTickets] = useState([]);

  // Create axios instance with timeout
  const api = axios.create({
    timeout: 10000, // 10 seconds timeout
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    return Date.now() - cachedData.timestamp < oneHour;
  };

  const getTicketRoute = useCallback(
    (ticket) => {
      const tripDetails = ticket.trip_details || [];
      const outboundTrip = tripDetails.find((t) => t.trip_type === "Departure");
      const returnTrip = tripDetails.find((t) => t.trip_type === "Return");

      if (!outboundTrip) return "UNK-UNK";

      const depCode = cityCodeMap[outboundTrip.departure_city] || "UNK";
      const arrCode = cityCodeMap[outboundTrip.arrival_city] || "UNK";

      if (!returnTrip) {
        return `${depCode}-${arrCode}`;
      }

      const returnDepCode = cityCodeMap[returnTrip.departure_city] || "UNK";
      const returnArrCode = cityCodeMap[returnTrip.arrival_city] || "UNK";

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
      if (!orgId || !token) {
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

        if (cachedData && isCacheValid(cachedData)) {
          // Use cached data
          setTickets(cachedData.tickets);
          setAirlineMap(cachedData.airlineMap);
          setCityMap(cachedData.cityMap);
          setCityCodeMap(cachedData.cityCodeMap);

          // Initialize airline filters
          const initialAirlineFilters = {};
          Object.keys(cachedData.airlineMap).forEach((airlineId) => {
            const airlineName = cachedData.airlineMap[airlineId].name;
            initialAirlineFilters[airlineName] = false;
          });
          setAirlineFilters(initialAirlineFilters);

          setIsLoading(false);
          return;
        }

        // No valid cache, fetch fresh data
        const [ticketsResponse, airlinesResponse, citiesResponse] =
          await Promise.all([
            api.get(`http://127.0.0.1:8000/api/tickets/?organization=${orgId}`),
            api.get(`http://127.0.0.1:8000/api/airlines/?organization=${orgId}`),
            api.get(`http://127.0.0.1:8000/api/cities/?organization=${orgId}`),
          ]);

        const ticketsData = ticketsResponse.data;
        const airlinesData = airlinesResponse.data;
        const citiesData = citiesResponse.data;

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

        // Initialize airline filters
        const initialAirlineFilters = {};
        airlinesData.forEach((airline) => {
          initialAirlineFilters[airline.name] = false;
        });

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
        // FIX: Updated to match backend trip_type value
        ticket.trip_details.some((t) => t.trip_type === "Departure")
    );

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
        );
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
        );
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
              cmp = a.price - b.price;
              break;
            case "departureDate": {
              // FIX: Updated to match backend trip_type value
              const outboundA = a.trip_details?.find(
                (t) => t.trip_type === "Departure"
              );
              const outboundB = b.trip_details?.find(
                (t) => t.trip_type === "Departure"
              );
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
          <AgentSidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10 ps-lg-5">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4">
              {/* Navigation Tabs */}
              <div className="row ">
              <div className="d-flex flex-wrap justify-content-end align-items-center w-100">

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <div className="input-group" style={{ maxWidth: "300px" }}>
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
                  </div>
                  <div className="">
                    <button
                      className="btn text-white"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            

            {/* Flight Booking Interface */}
            <div className="container-fluid ">
              {/* Header */}
              <div className="shadow-sm p-3 mb-4 rounded">
                <h5 className="mb-4 fw-bold">Groups Tickets</h5>
                {/* Search Form */}
                <div className="row">
                  <div className="col-md-5">
                    <label htmlFor="" className="Control-label">Enter Destination</label>
                    <div className="input-group border rounded bg-light">
                      <span className="input-group-text border-0 text-primary">
                        <BedDouble />
                      </span>
                      <input
                        type="text"
                        className="form-control rounded shadow-none border-0 bg-light px-1 py-2"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Dubai (DXB)"
                      />
                    </div>
                  </div>

                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">Travel Date</label>
                    <div className="input-group">
                      <input
                        type="date"
                        className="form-control rounded shadow-none bg-light px-1 py-2"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-3 d-flex justify-content-center align-items-end">
                    <div>
                      <button
                        id="btn" className="btn me-2  px-4"
                        onClick={handleSearch}
                      >
                        Search
                      </button>
                    </div>
                    <div>
                      <button
                        id="btn" className="btn px-4"
                        onClick={handleShowAll}
                      >
                        Show All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Sort Options */}
              <div className=" mb-4 d-flex gap-5 justify-content-center flex-wrap">
                <div className="">
                  <h5 className="mb-0 fw-bold">Sort:</h5>
                </div>
                <div className="d-flex flex-wrap gap-3">
                  {Object.entries({
                    airline: "Airline",
                    price: "Price",
                    departureDate: "Departure Date",
                    umrahGroups: "Umrah Groups",
                  }).map(([key, label]) => (
                    <div className="form-check" key={key}>
                      <input
                        className="form-check-input "
                        type="checkbox"
                        checked={sortOptions[key]}
                        onChange={() => handleSortChange(key)}
                        id={key}
                      />
                      <label className="form-check-label" htmlFor={key}>
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="row">
                <div className="col-md-3">
                  {/* Route Filter */}
                  <div className="mb-4 border rounded">
                    <div className="mt-4 ps-4">
                      <h6 className="mb-4 fw-bold" style={{ color: "#548579" }}>
                        Route
                      </h6>
                    </div>
                    <div className="d-flex flex-column justify-content-start align-items-start gap-3 ps-4">
                      {/* Dynamic route filters */}
                      {Object.keys(routeFilters).map((route) => (
                        <div className="form-check d-flex align-items-center" key={route}>
                          <input
                            className="form-check-input  me-2"
                            type="checkbox"
                            checked={routeFilters[route]}
                            onChange={() => handleRouteFilterChange(route)}
                            id={route}
                          />
                          <label className="form-check-label small" htmlFor={route}>
                            {route}
                          </label>
                        </div>
                      ))}
                    </div>

                    {/* Airline Filter */}
                    <div className=" ps-4">
                      <h6 className="mb-4 fw-bold mt-4" style={{ color: "#548579" }}>
                        Airline
                      </h6>
                    </div>
                    <div className="d-flex flex-column mb-3 justify-content-start align-items-start gap-3 ps-4">
                      {Object.keys(airlineFilters).map((airlineName) => (
                        <div className="form-check d-flex align-items-center" key={airlineName}>
                          <input
                            className="form-check-input  me-2"
                            type="checkbox"
                            checked={airlineFilters[airlineName]}
                            onChange={() => handleAirlineFilterChange(airlineName)}
                            id={airlineName}
                          />
                          <label className="form-check-label small" htmlFor={airlineName}>
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
                        <a
                          href={`http://127.0.0.1:8000/api/tickets/?organization=${orgId}`}
                          className="btn btn-sm btn-outline-primary"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Test API
                        </a>
                      </div>
                    </div>
                  )}

                  {/* No tickets found */}
                  {!isLoading && !error && filteredTickets.length === 0 && (
                    <div className="text-center my-5">
                      <h5>No tickets found</h5>
                      <p>Try adjusting your search criteria</p>
                      <button
                        id="btn" className="btn mt-2"
                        onClick={handleShowAll}
                      >
                        Show All Tickets
                      </button>
                    </div>
                  )}

                  {/* Display filtered tickets */}
                  {!isLoading && !error && filteredTickets.length > 0 && (
                    <div>
                      {/* <div className="mb-3 text-muted">
                      Showing {filteredTickets.length} of {tickets.length}{" "}
                      tickets
                    </div> */}
                      {filteredTickets.map((ticket) => (
                        <FlightCard
                          key={ticket.id}
                          ticket={ticket}
                          airlineMap={airlineMap}
                          cityMap={cityMap}
                        />
                      ))}
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
