import React, { useEffect, useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Bag, PersonAdd, PersonDash } from "react-bootstrap-icons";
import { Baby, Utensils } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const FlightBookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticket: passedTicket, cityMap, airlineMap } = location.state || {};
  const [ticket, setTicket] = useState(passedTicket || null);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketFetchFailed, setTicketFetchFailed] = useState(false);
  const [ticketFetchErrorMsg, setTicketFetchErrorMsg] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const countries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Congo-Brazzaville)",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Ivory Coast",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar (Burma)",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe"
  ];

  // Initialize passengers
  const [passengers, setPassengers] = useState(() => {
    const savedPassengers = localStorage.getItem("TicketPassengersDetails");
    if (savedPassengers) {
      return JSON.parse(savedPassengers);
    }

    const maxPassengers = Math.min(ticket?.seats || 9, 9);
    const initialPassengers = [];
    for (let i = 0; i < Math.min(maxPassengers, 1); i++) {
      initialPassengers.push({
        id: i + 1,
        type: "",
        title: "",
        firstName: "",
        lastName: "",
        passportNumber: "",
        dob: "",
        passportIssue: "",
        passportExpiry: "",
        country: "",
      });
    }
    return initialPassengers;
  });

  // Save passengers to localStorage
  useEffect(() => {
    localStorage.setItem("TicketPassengersDetails", JSON.stringify(passengers));
  }, [passengers]);

  // Cleanup localStorage
  useEffect(() => {
    return () => {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/booking")) {
        localStorage.removeItem("TicketPassengersDetails");
      }
    };
  }, []);

  const handleNavigation = (path, options = {}) => {
    navigate(path, {
      ...options,
      state: {
        ...options.state,
        ticket,
        cityMap,
        airlineMap,
        passengers
      }
    });
  };

  const handleCancel = () => {
    handleNavigation("/booking");
  };

  const removePassenger = (id) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((passenger) => passenger.id !== id));
    }
  };

  const updatePassenger = (id, field, value) => {
    setPassengers(
      passengers.map((passenger) =>
        passenger.id === id ? { ...passenger, [field]: value } : passenger
      )
    );
    // Clear error when field is updated
    if (formErrors[`passenger-${id}-${field}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`passenger-${id}-${field}`];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const needsFetch = () => {
      // If no passed ticket or no trip_details or missing outbound trip, we should fetch
      if (!passedTicket || !passedTicket.id) return false;
      const td = passedTicket.trip_details;
      if (!Array.isArray(td) || td.length === 0) return true;
      // If no 'Departure' trip present, fetch full details
      return !td.some(t => t && t.trip_type === "Departure");
    };

    if (!needsFetch()) {
      // Passed ticket already has trip details
      setTicket(passedTicket);
      setIsLoading(false);
      setTicketFetchFailed(false);
      return () => { mounted = false; };
    }

    const fetchTicket = async () => {
      try {
        // Try multiple token keys and auth header formats to account for different setups
        const tokenCandidates = [
          localStorage.getItem('agentAccessToken'),
          localStorage.getItem('accessToken'),
          localStorage.getItem('token'),
        ].filter(Boolean);

        const id = passedTicket && passedTicket.id;
        if (!id) {
          if (mounted) {
            setTicket(null);
            setTicketFetchFailed(true);
            setTicketFetchErrorMsg('Ticket id missing');
            setIsLoading(false);
          }
          return;
        }
        // Helper to attempt a fetch with given headers and return {ok, status, body}
        const tryFetch = async (url, headers) => {
          try {
            const resp = await fetch(url, { headers });
            let bodyText = null;
            try {
              bodyText = await resp.text();
            } catch (e) {
              bodyText = null;
            }
            return { ok: resp.ok, status: resp.status, bodyText, resp };
          } catch (e) {
            return { ok: false, status: null, bodyText: String(e), resp: null };
          }
        };

        // Attempt to determine organization id from common locations
        // First, try to read agentOrganization from localStorage which is used elsewhere in the app
        let parsedAgentOrg = null;
        try {
          const ao = localStorage.getItem('agentOrganization');
          if (ao) parsedAgentOrg = JSON.parse(ao);
        } catch (e) {
          parsedAgentOrg = null;
        }

        const agentOrgIds = Array.isArray(parsedAgentOrg && parsedAgentOrg.ids) ? parsedAgentOrg.ids : [];

        const orgCandidates = [
          // prefer an explicit owner id on passedTicket if present
          passedTicket && (passedTicket.owner_organization_id || passedTicket.organization_id || passedTicket.organization || passedTicket.org_id || passedTicket.org),
          // prefer one of the agent's organization ids if available
          ...(agentOrgIds || []),
          // legacy localStorage keys
          localStorage.getItem('organization'),
          localStorage.getItem('orgId'),
          localStorage.getItem('org_id'),
        ].filter(Boolean);

        // Build a prioritized list of organization ids to try.
        // Prefer the agent's org ids, then any owner org on the ticket, then legacy keys.
        const tryOrgIds = [];
        if (Array.isArray(agentOrgIds) && agentOrgIds.length) {
          tryOrgIds.push(...agentOrgIds);
        }
        // include owner organization from the passed ticket if present
        const ownerOrg = passedTicket && (passedTicket.owner_organization_id || passedTicket.organization_id || passedTicket.organization || passedTicket.org_id || passedTicket.org);
        if (ownerOrg && !tryOrgIds.includes(ownerOrg)) tryOrgIds.push(ownerOrg);
        // add other legacy candidates
        orgCandidates.forEach(o => {
          if (!tryOrgIds.includes(o)) tryOrgIds.push(o);
        });

        // Always include an empty attempt (no organization) as last resort
        tryOrgIds.push(null);

        const token = localStorage.getItem('agentAccessToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' };

        // Helper to decide whether a candidate contains an outbound trip
        const candidateHasOutbound = (candidate) => {
          if (!candidate) return false;
          const td = Array.isArray(candidate.trip_details) ? candidate.trip_details : [];
          // If explicit trip_type markers exist, prefer those
          if (td.some(t => t && t.trip_type === "Departure")) return true;
          // If no trip_type present but there is exactly one trip_details entry,
          // assume it's the outbound (common for one-way tickets). Also allow
          // top-level `trip_type: 'One-way'` as hint.
          if (td.length === 1) return true;
          if (candidate.trip_type && String(candidate.trip_type).toLowerCase().includes('one')) return td.length > 0;
          return false;
        };

        // Try each org id sequentially until we find a usable ticket
        for (let i = 0; i < tryOrgIds.length; i++) {
          const org = tryOrgIds[i];
          const queryUrl = org ? `http://127.0.0.1:8000/api/tickets/?id=${id}&organization=${org}` : `http://127.0.0.1:8000/api/tickets/?id=${id}`;
          console.debug('Attempting ticket fetch for organization:', org, 'url:', queryUrl);

          const resp = await tryFetch(queryUrl, headers);
          // If network level error, continue to next org
          if (!resp.resp) {
            console.warn('Network error when fetching', queryUrl, resp.bodyText);
            continue;
          }

          // parse JSON body using the text already read by tryFetch
          let parsed = null;
          if (resp.bodyText) {
            try {
              parsed = JSON.parse(resp.bodyText);
            } catch (e) {
              console.warn('Failed to parse JSON for', queryUrl, resp.bodyText);
              parsed = null;
            }
          } else {
            parsed = null;
          }

          if (resp.ok && parsed) {
            const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.results) ? parsed.results : (Array.isArray(parsed.data) ? parsed.data : []));
            console.debug('Received items count for org', org, items && items.length);
            if (items && items.length) {
              const candidate = items[0];
              if (candidateHasOutbound(candidate)) {
                if (mounted) {
                  setTicket(candidate);
                  setTicketFetchFailed(false);
                  setTicketFetchErrorMsg('');
                  setIsLoading(false);
                }
                return;
              }
              // If item exists but doesn't have outbound, log and continue
              console.warn('Ticket for id', id, 'returned for org', org, 'but missing explicit outbound trip_details', candidate);
            }
            // no items -> continue to next org
            continue;
          }

          // Handle 401/403 explicitly and stop trying further (authorization likely same across orgs)
          if (resp.status === 401) {
            if (mounted) {
              setTicket(null);
              setTicketFetchFailed(true);
              setTicketFetchErrorMsg('Unauthorized (401) - please log in or refresh your session');
              setIsLoading(false);
            }
            return;
          }
          if (resp.status === 403) {
            if (mounted) {
              setTicket(null);
              setTicketFetchFailed(true);
              setTicketFetchErrorMsg("Forbidden (403) - you don't have permission to view this ticket");
              setIsLoading(false);
            }
            return;
          }
          // otherwise continue to next org
        }

        // After exhausting attempts
        if (mounted) {
          setTicket(null);
          setTicketFetchFailed(true);
          setTicketFetchErrorMsg(`Ticket not returned for your organization(s) or missing outbound trip details (tried: ${tryOrgIds.filter(x => x !== null).join(', ')})`);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch ticket details', err);
        if (mounted) {
          setTicket(null);
          setTicketFetchFailed(true);
          setTicketFetchErrorMsg(String(err));
          setIsLoading(false);
        }
      }
    };

    fetchTicket();

    return () => { mounted = false; };
  }, [passedTicket, retryKey]);

  if (!ticket && isLoading) return null;

  if (!ticket && !isLoading) {
    return (
      <div className="card border-1 shadow-sm mb-4 rounded-2 border-black">
        <div className="card-body p-4">
          <h5>Ticket details not available</h5>
          <p className="text-danger">{ticketFetchErrorMsg || 'Ticket information could not be retrieved.'}</p>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-outline-secondary" onClick={handleCancel}>Back to bookings</button>
            <button className="btn btn-primary" onClick={() => { setRetryKey(k => k + 1); setIsLoading(true); setTicketFetchFailed(false); setTicketFetchErrorMsg(""); }}>Try again</button>
          </div>
        </div>
      </div>
    );
  }

  // Flight details processing
  const tripDetails = ticket.trip_details || [];
  const stopoverDetails = ticket.stopover_details || [];

  // Resolve city name whether the API returned an id, a string, or an object
  const resolveCityName = (city) => {
    if (!city && city !== 0) return "Unknown City";
    if (typeof city === "string") return city;
    if (typeof city === "number") return cityMap && cityMap[city] ? cityMap[city] : "Unknown City";
    if (typeof city === "object") {
      return city.name || city.city || city.display_name || "Unknown City";
    }
    return "Unknown City";
  };

  // Resolve airline info from a trip segment or fallback to ticket-level mapping
  const resolveAirlineInfoFromTrip = (trip) => {
    if (!trip) return {};
    const a = trip.airline;
    if (!a && ticket && ticket.airline) {
      // fallback to ticket.airline which may be id or object
      if (typeof ticket.airline === 'object') return { name: ticket.airline.name, logo: ticket.airline.logo };
      return airlineMap[ticket.airline] || {};
    }
    if (typeof a === 'number' || typeof a === 'string') return airlineMap && airlineMap[a] ? airlineMap[a] : {};
    if (typeof a === 'object') return { name: a.name, logo: a.logo };
    return {};
  };

  // Support tickets where trip_details entries don't include explicit
  // `trip_type` values (common for one-way tickets that only have a
  // single segment). Prefer an explicit Departure/Return marker, but
  // fall back to the first/second entries when missing.
  const outboundTrip = (tripDetails.find((t) => t && t.trip_type === "Departure") || (tripDetails.length ? tripDetails[0] : undefined));
  const returnTrip = (tripDetails.find((t) => t && t.trip_type === "Return") || (tripDetails.length > 1 ? tripDetails[1] : undefined));

  const outboundStopover =
    stopoverDetails.find((s) => s && s.trip_type === "Departure") ||
    (stopoverDetails.length ? stopoverDetails[0] : undefined);
  const returnStopover =
    stopoverDetails.find((s) => s && s.trip_type === "Return") ||
    (stopoverDetails.length > 1 ? stopoverDetails[1] : undefined);

  const airlineInfo = resolveAirlineInfoFromTrip(outboundTrip) || (airlineMap[ticket.airline] || {});

  if (!outboundTrip) {
    return (
      <div className="card border-1 shadow-sm mb-4 rounded-2 border-black">
        <div className="card-body p-4">
          <h5>Ticket ID: {ticket.id}</h5>
          <p className="text-danger">Missing outbound trip details</p>
        </div>
      </div>
    );
  }

  // Helper functions
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

  // Stopover summary helper: prefer stopover_city then arrival_city, include duration if present
  const stopoverSummary = (stopover) => {
    if (!stopover) return "Non-stop";
    const city = resolveCityName(stopover.stopover_city || stopover.arrival_city);
    const dur = stopover.stopover_duration || stopover.duration || null;
    if (city && dur) return `${city} (${dur})`;
    if (city) return city;
    return "1 Stop";
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

  // Styles
  const seatWarningStyle = ticket.left_seats <= 9 ? {
    color: "#FB4118",
    border: "1px solid #F14848",
    display: "inline-block",
    fontWeight: 500,
  } : {
    color: "#3391FF",
    border: "1px solid #3391FF",
    display: "inline-block",
    fontWeight: 500,
  };

  const refundableBadgeStyle = ticket.is_refundable ? {
    background: "#E4F0FF",
    color: "#206DA9",
  } : {
    background: "#FFE4E4",
    color: "#D32F2F",
  };

  // Price calculation
  const calculateTotalPrice = () => {
    let adultCount = 0;
    let childCount = 0;
    let infantCount = 0;

    passengers.forEach(passenger => {
      if (passenger.type === "Adult") adultCount++;
      if (passenger.type === "Child") childCount++;
      if (passenger.type === "Infant") infantCount++;
    });

    const adultPrice = ticket?.adult_price || 0;
    const childPrice = ticket?.child_price || 0;
    const infantPrice = ticket?.infant_price || 0;

    const adultTotal = adultCount * adultPrice;
    const childTotal = childCount * childPrice;
    const infantTotal = infantCount * infantPrice;

    return {
      adultCount,
      childCount,
      infantCount,
      adultPrice,
      childPrice,
      infantPrice,
      adultTotal,
      childTotal,
      infantTotal,
      grandTotal: adultTotal + childTotal + infantTotal,
      hasZeroPrice: adultPrice === 0 || childPrice === 0 || infantPrice === 0
    };
  };

  const priceDetails = calculateTotalPrice();

  const getTitleOptions = (passengerType) => {
    switch (passengerType) {
      case "Adult":
        return (
          <>
            <option value="">Select Title</option>
            <option value="MR">MR</option>
            <option value="MRS">MRS</option>
            <option value="MS">MS</option>
          </>
        );
      case "Child":
        return (
          <>
            <option value="">Select Title</option>
            <option value="MSTR">MSTR</option>
            <option value="MISS">MISS</option>
          </>
        );
      case "Infant":
        return (
          <>
            <option value="">Select Title</option>
            <option value="MSTR">MSTR</option>
            <option value="MISS">MISS</option>
          </>
        );
      default:
        return <option value="">Select Type First</option>;
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    passengers.forEach((passenger) => {
      const requiredFields = [
        'type', 'title', 'firstName', 'lastName',
        'passportNumber', 'dob', 'passportIssue',
        'passportExpiry', 'country'
      ];

      requiredFields.forEach(field => {
        const fieldKey = `passenger-${passenger.id}-${field}`;
        if (!passenger[field]) {
          errors[fieldKey] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
          isValid = false;
        }
      });

      // Validate dates
      if (passenger.passportExpiry && passenger.passportIssue) {
        const expiryDate = new Date(passenger.passportExpiry);
        const issueDate = new Date(passenger.passportIssue);
        if (expiryDate <= issueDate) {
          errors[`passenger-${passenger.id}-passportExpiry`] = "Passport expiry must be after issue date";
          isValid = false;
        }
      }

      // Validate DOB makes sense for passenger type
      if (passenger.dob) {
        const dobDate = new Date(passenger.dob);
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear();

        if (passenger.type === "Adult" && age < 12) {
          errors[`passenger-${passenger.id}-dob`] = "Adult must be 12+ years";
          isValid = false;
        } else if (passenger.type === "Child" && (age < 2 || age >= 12)) {
          errors[`passenger-${passenger.id}-dob`] = "Child must be 2-11 years";
          isValid = false;
        } else if (passenger.type === "Infant" && age >= 2) {
          errors[`passenger-${passenger.id}-dob`] = "Infant must be under 2 years";
          isValid = false;
        }
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleContinue = () => {
    if (validateForm()) {
      handleNavigation("/booking/review", {
        state: { ticket, cityMap, airlineMap, passengers }
      });
    }
  };

  const addPassenger = (type = "Adult") => {
    // For infants, we don't count against the seat limit
    if (type === "Infant") {
      const newPassenger = {
        id: passengers.length + 1,
        type: "Infant",
        title: "",
        firstName: "",
        lastName: "",
        passportNumber: "",
        dob: "",
        passportIssue: "",
        passportExpiry: "",
        country: ""
      };
      setPassengers([...passengers, newPassenger]);
      return;
    }

    // For adults/children, check seat availability
    const maxPassengers = Math.min(ticket?.seats);
    if (passengers.filter(p => p.type !== "Infant").length >= maxPassengers) return;

    const newPassenger = {
      id: passengers.length + 1,
      type: type,
      title: "",
      firstName: "",
      lastName: "",
      passportNumber: "",
      dob: "",
      passportIssue: "",
      passportExpiry: "",
      country: ""
    };

    setPassengers([...passengers, newPassenger]);
  };

  const handleFieldBlur = (passengerId, fieldName) => {
    setTouchedFields(prev => ({
      ...prev,
      [`passenger-${passengerId}-${fieldName}`]: true
    }));
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4">
              {/* Progress Steps */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="d-flex align-items-center me-4">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "30px", height: "30px", fontSize: "14px" }}>
                        1
                      </div>
                      <span className="ms-2 text-primary fw-bold">Booking Detail</span>
                    </div>
                    <div className="flex-grow-1 bg-primary" style={{ height: "2px", backgroundColor: "#dee2e6" }}></div>
                    <div className="d-flex align-items-center mx-4">
                      <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border"
                        style={{ width: "30px", height: "30px", fontSize: "14px" }}>
                        2
                      </div>
                      <span className="ms-2 text-muted">Booking Review</span>
                    </div>
                    <div className="flex-grow-1" style={{ height: "2px", backgroundColor: "#dee2e6" }}></div>
                    <div className="d-flex align-items-center">
                      <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border"
                        style={{ width: "30px", height: "30px", fontSize: "14px" }}>
                        3
                      </div>
                      <span className="ms-2 text-muted">Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Details Card */}
              <div className="row mb-4 p-2 d-flex gap-3 small">
                <div className="col-lg-7 rounded-2 border card-body p-2 small">
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
                      <h6 className="mb-0">
                        {formatTime(outboundTrip.departure_date_time)}
                      </h6>
                      <div className="text-muted small">
                        {formatDate(outboundTrip.departure_date_time)}
                      </div>
                      <div className="text-muted small">
                        {resolveCityName(outboundTrip.departure_city)}
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
                              <div className="position-relative d-flex flex-column align-items-center" style={{ margin: "0 10px" }}>
                                <span className="rounded-circle"
                                  style={{ width: "10px", height: "10px", backgroundColor: "#699FC9", position: "relative", zIndex: 1 }}></span>
                                <div className="text-muted small"
                                  style={{ position: "absolute", top: "14px", whiteSpace: "nowrap" }}>
                                  {resolveCityName(outboundStopover?.stopover_city) || "Unknown City"}
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
                        {stopoverSummary(outboundStopover)}
                      </div>
                    </div>
                    <div className="col-md-2 text-center text-md-start">
                      <h6 className="mb-0">
                        {formatTime(outboundTrip.arrival_date_time)}
                      </h6>
                      <div className="text-muted small">
                        {formatDate(outboundTrip.arrival_date_time)}
                      </div>
                      <div className="text-muted small">
                        {resolveCityName(outboundTrip.arrival_city)}
                      </div>
                    </div>
                    <div className="col-md-2 text-center">
                      <div className="fw-medium">
                        {getDuration(
                          outboundTrip.departure_date_time,
                          outboundTrip.arrival_date_time
                        )}
                      </div>
                      <div className="text-uppercase fw-semibold small mt-1" style={{ color: "#699FC9" }}>
                        {stopoverSummary(outboundStopover)}
                      </div>
                      <div className="small mt-1 px-2 py-1 rounded" style={seatWarningStyle}>
                        {ticket.left_seats <= 9
                          ? `Only ${ticket.left_seats} seats left`
                          : `${ticket.left_seats} seats left`}
                      </div>
                    </div>
                  </div>

                  {outboundStopover && (
                    <div className="row mt-3 p-3 border rounded-2" style={{ background: "#fbfcff" }}>
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <img
                            src={(outboundStopover.airline && outboundStopover.airline.logo) || airlineInfo.logo}
                            alt={(outboundStopover.airline && (outboundStopover.airline.name || "Airline")) || airlineInfo.name || "Airline"}
                            style={{ width: 48, height: 48, objectFit: "contain" }}
                            className="me-3"
                          />
                          <div>
                            <div className="fw-bold">{(outboundStopover.airline && outboundStopover.airline.name) || airlineInfo.name || "Unknown Airline"}</div>
                            <div className="small text-muted">{outboundStopover.flight_number ? `${outboundStopover.flight_number}` : ""}</div>
                          </div>
                        </div>

                        <div className="row mt-3">
                          <div className="col-md-3 text-center text-md-start">
                            <div className="fw-semibold">{formatTime(outboundStopover.departure_date_time)}</div>
                            <div className="text-muted small">{formatDate(outboundStopover.departure_date_time)}</div>
                            <div className="text-muted small">{resolveCityName(outboundStopover.departure_city || outboundTrip.arrival_city)}</div>
                          </div>

                          <div className="col-md-3 text-center">
                            <div className="fw-semibold">{getDuration(outboundStopover.departure_date_time, outboundStopover.arrival_date_time)}</div>
                            <div className="text-muted small">Stopover — {outboundStopover.stopover_duration || "--"}</div>
                          </div>

                          <div className="col-md-3 text-center text-md-start">
                            <div className="fw-semibold">{formatTime(outboundStopover.arrival_date_time)}</div>
                            <div className="text-muted small">{formatDate(outboundStopover.arrival_date_time)}</div>
                            <div className="text-muted small">{resolveCityName(outboundStopover.arrival_city)}</div>
                          </div>

                          <div className="col-md-3 text-center">
                            <div className="small mt-1 px-2 py-1 rounded" style={seatWarningStyle}>
                              {ticket.left_seats <= 9
                                ? `Only ${ticket.left_seats} seats left`
                                : `${ticket.left_seats} seats left`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Return Flight Segment (if exists) */}
                  {returnTrip && (
                    <>
                      <hr className="" />
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
                          <h6 className="mb-0">
                            {formatTime(returnTrip.departure_date_time)}
                          </h6>
                          <div className="text-muted small">
                            {formatDate(returnTrip.departure_date_time)}
                          </div>
                          <div className="text-muted small">
                            {resolveCityName(returnTrip.departure_city)}
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
                                  <div className="position-relative d-flex flex-column align-items-center" style={{ margin: "0 10px" }}>
                                    <span className="rounded-circle"
                                      style={{ width: "10px", height: "10px", backgroundColor: "#699FC9", position: "relative", zIndex: 1 }}></span>
                                    <div className="text-muted small"
                                      style={{ position: "absolute", top: "14px", whiteSpace: "nowrap" }}>
                                      {resolveCityName(returnStopover?.stopover_city) || "Unknown City"}
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
                            {stopoverSummary(returnStopover)}
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
                            {resolveCityName(returnTrip.arrival_city)}
                          </div>
                        </div>
                        <div className="col-md-2 text-center">
                          <div className="fw-medium">
                            {getDuration(
                              returnTrip.departure_date_time,
                              returnTrip.arrival_date_time
                            )}
                          </div>
                          <div className="text-uppercase fw-semibold small mt-1" style={{ color: "#699FC9" }}>
                            {stopoverSummary(returnStopover)}
                          </div>
                          <div className="small mt-1 px-2 py-1 rounded" style={seatWarningStyle}>
                            {ticket.left_seats <= 9
                              ? `Only ${ticket.left_seats} seats left`
                              : `${ticket.left_seats} seats left`}
                          </div>
                        </div>
                      </div>

                      {returnStopover && (
                        <div className="row mt-3 p-3 border rounded-2" style={{ background: "#fbfcff" }}>
                          <div className="col-12">
                            <div className="d-flex align-items-center">
                              <img
                                src={(returnStopover.airline && returnStopover.airline.logo) || airlineInfo.logo}
                                alt={(returnStopover.airline && (returnStopover.airline.name || "Airline")) || airlineInfo.name || "Airline"}
                                style={{ width: 48, height: 48, objectFit: "contain" }}
                                className="me-3"
                              />
                              <div>
                                <div className="fw-bold">{(returnStopover.airline && returnStopover.airline.name) || airlineInfo.name || "Unknown Airline"}</div>
                                <div className="small text-muted">{returnStopover.flight_number ? `${returnStopover.flight_number}` : ""}</div>
                              </div>
                            </div>

                            <div className="row mt-3">
                              <div className="col-md-3 text-center text-md-start">
                                <div className="fw-semibold">{formatTime(returnStopover.departure_date_time)}</div>
                                <div className="text-muted small">{formatDate(returnStopover.departure_date_time)}</div>
                                <div className="text-muted small">{resolveCityName(returnStopover.departure_city || returnTrip.departure_city)}</div>
                              </div>

                              <div className="col-md-3 text-center">
                                <div className="fw-semibold">{getDuration(returnStopover.departure_date_time, returnStopover.arrival_date_time)}</div>
                                <div className="text-muted small">Stopover — {returnStopover.stopover_duration || "--"}</div>
                              </div>

                              <div className="col-md-3 text-center text-md-start">
                                <div className="fw-semibold">{formatTime(returnStopover.arrival_date_time)}</div>
                                <div className="text-muted small">{formatDate(returnStopover.arrival_date_time)}</div>
                                <div className="text-muted small">{resolveCityName(returnStopover.arrival_city)}</div>
                              </div>

                              <div className="col-md-3 text-center">
                                <div className="small mt-1 px-2 py-1 rounded" style={seatWarningStyle}>
                                  {ticket.left_seats <= 9
                                    ? `Only ${ticket.left_seats} seats left`
                                    : `${ticket.left_seats} seats left`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </>
                  )}
                  <hr className="" />

                  <div className="row align-items-center gy-3">
                    <div className="col-md-7 d-flex flex-wrap gap-3 align-items-center">
                      <span className="badge px-3 py-2 rounded" style={refundableBadgeStyle}>
                        {ticket.is_refundable ? "Refundable" : "Non-Refundable"}
                      </span>

                      <span className="small" style={{ color: "#699FC9" }}>
                        <Bag /> {ticket.weight}kg Baggage ({ticket.pieces} pieces)
                      </span>

                      <span className="small" style={{ color: ticket.is_meal_included ? "#699FC9" : "#FB4118" }}>
                        <Utensils size={16} /> {ticket.is_meal_included ? "Meal Included" : "No Meal Included"}
                      </span>
                    </div>

                    <div className="col-md-5 text-md-end text-center d-flex justify-content-end">
                      <div className="d-flex flex-column me-3 align-items-center">
                        <div className="fw-bold">
                          {priceDetails.hasZeroPrice ? "Fare on call" : `PKR ${ticket.adult_price}`}{" "}
                          {!priceDetails.hasZeroPrice && <span className="text-muted fw-normal">/per person</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4 rounded-2 border small overflow">
                  <div className="py-2 px-3">
                    <h6 className="mb-0 fw-bold text-primary text-center">Payment Summary</h6>
                  </div>
                  <div className="px-3">
                    <div className="row mb-3">
                      <div className="col-md-4 fw-bold">Passenger</div>
                      <div className="col-md-4 text-end fw-bold">Price</div>
                      <div className="col-md-4 text-end fw-bold">Total</div>
                    </div>

                    {priceDetails.adultCount > 0 && (
                      <div className="row mb-2">
                        <div className="col-md-4">Adult x {priceDetails.adultCount}</div>
                        <div className="col-md-4 text-end">
                          {priceDetails.adultPrice === 0 ? "Fare on call" : `PKR ${priceDetails.adultPrice.toLocaleString()}`}
                        </div>
                        <div className="col-md-4 text-end">
                          {priceDetails.adultPrice === 0 ? "Fare on call" : `PKR ${priceDetails.adultTotal.toLocaleString()}`}
                        </div>
                      </div>
                    )}

                    {priceDetails.childCount > 0 && (
                      <div className="row mb-2">
                        <div className="col-md-4">Child x {priceDetails.childCount}</div>
                        <div className="col-md-4 text-end">
                          {priceDetails.childPrice === 0 ? "Fare on call" : `PKR ${priceDetails.childPrice.toLocaleString()}`}
                        </div>
                        <div className="col-md-4 text-end">
                          {priceDetails.childPrice === 0 ? "Fare on call" : `PKR ${priceDetails.childTotal.toLocaleString()}`}
                        </div>
                      </div>
                    )}

                    {priceDetails.infantCount > 0 && (
                      <div className="row mb-2">
                        <div className="col-md-4">Infant x {priceDetails.infantCount}</div>
                        <div className="col-md-4 text-end">
                          {priceDetails.infantPrice === 0 ? "Fare on call" : `PKR ${priceDetails.infantPrice.toLocaleString()}`}
                        </div>
                        <div className="col-md-4 text-end">
                          {priceDetails.infantPrice === 0 ? "Fare on call" : `PKR ${priceDetails.infantTotal.toLocaleString()}`}
                        </div>
                      </div>
                    )}

                    <hr className="" />

                    <div className="">
                      <div className="row fw-semibold d-flex align-items-center">
                        <h6 className="col-md-6 text-end fw-bold">Grand Total:</h6>
                        <div className="col-md-6 text-end fw-bold text-primary">
                          {priceDetails.grandTotal === 0 ? "Fare on call /." : `PKR ${priceDetails.grandTotal.toLocaleString()} /.`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passengers Passport Detail */}
              <div className="border-0 small">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-3 mt-3 fw-bold">Passengers Passport Detail</h5>
                  <div className="">
                    <button
                      className="btn btn-primary btn-sm me-2"
                      onClick={() => addPassenger("")}
                      disabled={passengers.filter(p => p.type !== "Infant").length >= Math.min(ticket?.seats)}
                    >
                      <PersonAdd size="30px" />
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removePassenger(passengers[passengers.length - 1]?.id)}
                      disabled={passengers.length <= 1}
                    >
                      <PersonDash size="30px" />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {passengers.map((passenger, index) => (
                    <div key={passenger.id} className={`p-3 ${index > 0 ? "mt-3" : ""}`}>
                      <h6 className="mb-3 fw-semibold">Pex{index + 1}</h6>
                      <div className="row g-3 flex-warp">
                        {/* Type Field */}
                        <div className="col-md-2">
                          <label htmlFor="" className="form-label">Type</label>
                          <select
                            className={`w-100 form-select shadow-none ${formErrors[`passenger-${passenger.id}-type`] ? "is-invalid" : ""}`}
                            required
                            value={passenger.type}
                            onChange={(e) => updatePassenger(passenger.id, "type", e.target.value)}
                            onBlur={() => handleFieldBlur(passenger.id, "type")}
                          >
                            <option value="">Select Type</option>
                            <option value="Adult">Adult</option>
                            <option value="Child">Child</option>
                            <option value="Infant">Infant</option>
                          </select>
                          {formErrors[`passenger-${passenger.id}-type`] && (
                            <div className="invalid-feedback">
                              {formErrors[`passenger-${passenger.id}-type`]}
                            </div>
                          )}
                        </div>

                        {/* Title Field */}
                        <div className="col-md-2">
                          <label htmlFor="" className="form-label">Title</label>
                          <select
                            className={`w-100 form-select shadow-none ${formErrors[`passenger-${passenger.id}-title`] ? "is-invalid" : ""}`}
                            required
                            value={passenger.title}
                            onChange={(e) => updatePassenger(passenger.id, "title", e.target.value)}
                            onBlur={() => handleFieldBlur(passenger.id, "title")}
                          >
                            {getTitleOptions(passenger.type)}
                          </select>
                          {formErrors[`passenger-${passenger.id}-title`] && (
                            <div className="invalid-feedback">
                              {formErrors[`passenger-${passenger.id}-title`]}
                            </div>
                          )}
                        </div>

                        {/* First Name Field */}
                        <div className="col-md-2">
                          <label htmlFor="" className="form-label">Name</label>
                          <input
                            type="text"
                            required
                            value={passenger.firstName}
                            onChange={(e) => updatePassenger(passenger.id, "firstName", e.target.value)}
                            onBlur={() => handleFieldBlur(passenger.id, "firstName")}
                            className={`form-control shadow-none ${formErrors[`passenger-${passenger.id}-firstName`] ? "is-invalid" : ""}`}
                          />
                          {formErrors[`passenger-${passenger.id}-firstName`] && (
                            <div className="invalid-feedback">
                              {formErrors[`passenger-${passenger.id}-firstName`]}
                            </div>
                          )}
                        </div>

                        {/* Last Name Field */}
                        <div className="col-md-2">
                          <label htmlFor="" className="form-label">Last Name</label>
                          <input
                            type="text"
                            required
                            value={passenger.lastName}
                            onChange={(e) => updatePassenger(passenger.id, "lastName", e.target.value)}
                            onBlur={() => handleFieldBlur(passenger.id, "lastName")}
                            className={`form-control rounded shadow-none ${formErrors[`passenger-${passenger.id}-lastName`] ? "is-invalid" : ""}`}
                          />
                          {formErrors[`passenger-${passenger.id}-lastName`] && (
                            <div className="invalid-feedback">
                              {formErrors[`passenger-${passenger.id}-lastName`]}
                            </div>
                          )}
                        </div>

                        {/* Passport Number Field */}
                        <div className="col-md-2">
                          <label htmlFor="" className="form-label">Passport Number</label>
                          <input
                            type="text"
                            required
                            value={passenger.passportNumber}
                            onChange={(e) => updatePassenger(passenger.id, "passportNumber", e.target.value)}
                            onBlur={() => handleFieldBlur(passenger.id, "passportNumber")}
                            className={`form-control rounded shadow-none ${formErrors[`passenger-${passenger.id}-passportNumber`] ? "is-invalid" : ""}`}
                          />
                          {formErrors[`passenger-${passenger.id}-passportNumber`] && (
                            <div className="invalid-feedback">
                              {formErrors[`passenger-${passenger.id}-passportNumber`]}
                            </div>
                          )}
                        </div>

                        {/* DOB Field */}
                        <div className="col-md-2">
                          <label htmlFor="" className="form-label">DOB</label>
                          <input
                            type="date"
                            required
                            value={passenger.dob}
                            onChange={(e) => updatePassenger(passenger.id, "dob", e.target.value)}
                            onBlur={() => handleFieldBlur(passenger.id, "dob")}
                            className={`form-control rounded shadow-none ${formErrors[`passenger-${passenger.id}-dob`] ? "is-invalid" : ""}`}
                          />
                          {formErrors[`passenger-${passenger.id}-dob`] && (
                            <div className="invalid-feedback">
                              {formErrors[`passenger-${passenger.id}-dob`]}
                            </div>
                          )}
                        </div>

                        {/* Passport Issue Field */}
                        <div className="col-md-2">
                          <label htmlFor="" className="form-label">Passport Issue</label>
                          <input
                            type="date"
                            required
                            value={passenger.passportIssue}
                            onChange={(e) => updatePassenger(passenger.id, "passportIssue", e.target.value)}
                            onBlur={() => handleFieldBlur(passenger.id, "passportIssue")}
                            className={`form-control rounded shadow-none ${formErrors[`passenger-${passenger.id}-passportIssue`] ? "is-invalid" : ""}`}
                          />
                          {formErrors[`passenger-${passenger.id}-passportIssue`] && (
                            <div className="invalid-feedback">
                              {formErrors[`passenger-${passenger.id}-passportIssue`]}
                            </div>
                          )}
                        </div>

                        {/* Passport Expiry Field */}
                        <div className="col-md-2">
                          <label htmlFor="" className="form-label">Passport Expiry</label>
                          <input
                            type="date"
                            required
                            value={passenger.passportExpiry}
                            onChange={(e) => updatePassenger(passenger.id, "passportExpiry", e.target.value)}
                            onBlur={() => handleFieldBlur(passenger.id, "passportExpiry")}
                            className={`form-control rounded shadow-none ${formErrors[`passenger-${passenger.id}-passportExpiry`] ? "is-invalid" : ""}`}
                          />
                          {formErrors[`passenger-${passenger.id}-passportExpiry`] && (
                            <div className="invalid-feedback">
                              {formErrors[`passenger-${passenger.id}-passportExpiry`]}
                            </div>
                          )}
                        </div>

                        {/* Country Field */}
                        <div className="col-md-2">
                          <label className="form-label">Country</label>
                          <select
                            className={`form-select shadow-none ${formErrors[`passenger-${passenger.id}-country`] ? "is-invalid" : ""}`}
                            required
                            value={passenger.country}
                            onChange={(e) => updatePassenger(passenger.id, "country", e.target.value)}
                            onBlur={() => handleFieldBlur(passenger.id, "country")}
                          >
                            <option value="">Select Country</option>
                            {countries.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </select>
                          {formErrors[`passenger-${passenger.id}-country`] && (
                            <div className="invalid-feedback">
                              {formErrors[`passenger-${passenger.id}-country`]}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="row my-4">
                <div className="col-12 text-end">
                  <button onClick={handleCancel} className="btn btn-outline-secondary me-2">
                    Cancel
                  </button>
                  <button onClick={handleContinue} id="btn" className="btn">
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightBookingForm;