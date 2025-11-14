import React, { useEffect, useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Bag, PersonAdd, PersonDash } from "react-bootstrap-icons";
import { Baby, Utensils } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const FlightBookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticket, cityMap, airlineMap } = location.state || {};
  const [isLoading, setIsLoading] = useState(true);
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
    if (ticket) {
      setIsLoading(false);
    }
  }, [ticket]);

  if (!ticket) return null;

  // Flight details processing
  const airlineInfo = airlineMap[ticket.airline] || {};
  const tripDetails = ticket.trip_details || [];
  const stopoverDetails = ticket.stopover_details || [];

  const outboundTrip = tripDetails.find((t) => t.trip_type === "Departure");
  const returnTrip = tripDetails.find((t) => t.trip_type === "Return");

  const outboundStopover = stopoverDetails.find((s) => s.trip_type === "Departure");
  const returnStopover = stopoverDetails.find((s) => s.trip_type === "Return");

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
                              <div className="position-relative d-flex flex-column align-items-center" style={{ margin: "0 10px" }}>
                                <span className="rounded-circle"
                                  style={{ width: "10px", height: "10px", backgroundColor: "#699FC9", position: "relative", zIndex: 1 }}></span>
                                <div className="text-muted small"
                                  style={{ position: "absolute", top: "14px", whiteSpace: "nowrap" }}>
                                  {cityMap[outboundStopover.stopover_city] || "Unknown City"}
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
                      <h6 className="mb-0">
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
                      <div className="text-uppercase fw-semibold small mt-1" style={{ color: "#699FC9" }}>
                        {outboundStopover ? "1 Stop" : "Non-stop"}
                      </div>
                      <div className="small mt-1 px-2 py-1 rounded" style={seatWarningStyle}>
                        {ticket.left_seats <= 9
                          ? `Only ${ticket.left_seats} seats left`
                          : `${ticket.left_seats} seats left`}
                      </div>
                    </div>
                  </div>

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
                                  <div className="position-relative d-flex flex-column align-items-center" style={{ margin: "0 10px" }}>
                                    <span className="rounded-circle"
                                      style={{ width: "10px", height: "10px", backgroundColor: "#699FC9", position: "relative", zIndex: 1 }}></span>
                                    <div className="text-muted small"
                                      style={{ position: "absolute", top: "14px", whiteSpace: "nowrap" }}>
                                      {cityMap[returnStopover.stopover_city] || "Unknown City"}
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
                            {returnStopover ? "1 Stop" : "Non-stop"}
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
                          <div className="text-uppercase fw-semibold small mt-1" style={{ color: "#699FC9" }}>
                            {returnStopover ? "1 Stop" : "Non-stop"}
                          </div>
                          <div className="small mt-1 px-2 py-1 rounded" style={seatWarningStyle}>
                            {ticket.left_seats <= 9
                              ? `Only ${ticket.left_seats} seats left`
                              : `${ticket.left_seats} seats left`}
                          </div>
                        </div>
                      </div>
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
                          {priceDetails.hasZeroPrice ? "Fare on call" : `PKR ${priceDetails.grandTotal.toLocaleString()}`} /.
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