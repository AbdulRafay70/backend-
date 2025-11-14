import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import AdminFooter from "../../components/AdminFooter";
import axios from "axios";

const FlightBookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initial form state - moved to top
  const INITIAL_FORM_STATE = {
    airline: "",
    meal: "Yes",
    ticketType: "Refundable",
    pnr: "",
    price: "",
    totalSeats: "",
    weight: "",
    piece: "0",
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
    adultSellingPrice: "",
    adultPurchasePrice: "",
    childSellingPrice: "",
    childPurchasePrice: "",
    infantSellingPrice: "",
    infantPurchasePrice: "",
    resellingAllowed: false,
  };

  // Get edit data from location state if available
  const { editData, ticketId } = location.state || {};
  // Initialize form state with edit data if available
  const [formData, setFormData] = useState(
    editData ? {
      ...editData,
      // Ensure pricing fields are properly mapped
      adultSellingPrice: editData.adultSellingPrice || editData.adult_fare || "",
      adultPurchasePrice: editData.adultPurchasePrice || editData.adult_purchase_price || editData.adult_price || "",
      childSellingPrice: editData.childSellingPrice || editData.child_fare || "",
      childPurchasePrice: editData.childPurchasePrice || editData.child_purchase_price || editData.child_price || "",
      infantSellingPrice: editData.infantSellingPrice || editData.infant_fare || "",
      infantPurchasePrice: editData.infantPurchasePrice || editData.infant_purchase_price || editData.infant_price || "",
      // Map other API fields if needed
      meal: editData.is_meal_included ? "Yes" : "No",
      ticketType: editData.is_refundable ? "Refundable" : "Non-Refundable",
      umrahSeat: editData.is_umrah_seat ? "Yes" : "No",
      resellingAllowed:
        editData.reselling_allowed === true ||
        editData.reselling_allowed === "true" ||
        editData.reselling_allowed === 1 ||
        editData.reselling_allowed === "1" ||
        editData.resellingAllowed === true ||
        editData.resellingAllowed === "true" ||
        !!editData.resellingAllowed,
    } : INITIAL_FORM_STATE
  );

  // Ensure formData reflects any editData changes (normalize reselling flag)
  useEffect(() => {
    if (!editData) return;

    const normalized = {
      resellingAllowed:
        editData.reselling_allowed === true ||
        editData.reselling_allowed === "true" ||
        editData.reselling_allowed === 1 ||
        editData.reselling_allowed === "1" ||
        editData.resellingAllowed === true ||
        editData.resellingAllowed === "true" ||
        !!editData.resellingAllowed,
    };

    setFormData((prev) => ({ ...prev, ...editData, ...normalized }));
  }, [editData]);

  // Debug: log incoming editData and formData for troubleshooting reselling flag
  useEffect(() => {
    console.debug("AddTicket - editData:", editData);
  }, [editData]);

  useEffect(() => {
    console.debug("AddTicket - formData (resellingAllowed):", {
      resellingAllowed: formData?.resellingAllowed,
      type: typeof formData?.resellingAllowed,
    });
  }, [formData]);


  const tabs = [
    { name: "Ticket Bookings", path: "/ticket-booking" },
    { name: "Add Tickets", path: "/ticket-booking/add-ticket" },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // // Initial form state
  // const INITIAL_FORM_STATE = {
  //   airline: "",
  //   meal: "Yes",
  //   ticketType: "Refundable",
  //   pnr: "",
  //   price: "",
  //   totalSeats: "",
  //   weight: "",
  //   piece: "",
  //   umrahSeat: "Yes",
  //   tripType: "One-way",
  //   flightType: "Non-Stop",
  //   returnFlightType: "Non-Stop",
  //   departureDateTime: "",
  //   arrivalDateTime: "",
  //   departure: "",
  //   arrival: "",
  //   returnDepartureDateTime: "",
  //   returnArrivalDateTime: "",
  //   returnDeparture: "",
  //   returnArrival: "",
  //   stopLocation1: "",
  //   stopTime1: "",
  //   stopLocation2: "",
  //   stopTime2: "",
  //   returnStopLocation1: "",
  //   returnStopTime1: "",
  //   returnStopLocation2: "",
  //   returnStopTime2: "",
  // };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // State for airlines and cities data
  const [airlines, setAirlines] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState({
    airlines: true,
    cities: true,
  });
  const [error, setError] = useState({
    airlines: null,
    cities: null,
  });

  // Fetch airlines and cities on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get organization from localStorage
        const orgData = JSON.parse(
          localStorage.getItem("selectedOrganization")
        );
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");

        if (!organizationId) {
          throw new Error("Organization ID not found");
        }
        if (!token) {
          throw new Error("Access token not found");
        }

        // Fetch Airlines
        setLoading((prev) => ({ ...prev, airlines: true }));
        setError((prev) => ({ ...prev, airlines: null }));
        const airlinesResponse = await axios.get(
          "http://127.0.0.1:8000/api/airlines/",
          {
            params: { organization: organizationId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAirlines(airlinesResponse.data);

        // Fetch Cities
        setLoading((prev) => ({ ...prev, cities: true }));
        setError((prev) => ({ ...prev, cities: null }));
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
        if (err.message.includes("airlines")) {
          setError((prev) => ({ ...prev, airlines: err.message }));
        } else {
          setError((prev) => ({ ...prev, cities: err.message }));
        }
      } finally {
        setLoading({
          airlines: false,
          cities: false,
        });
      }
    };

    fetchData();
  }, []);

  const [submitError, setSubmitError] = useState({ type: "", message: "" });
  const [resellingTouched, setResellingTouched] = useState(false);

  // Submit form to API
  const submitForm = async (action) => {
    setIsSubmitting(true);
    setSubmitError({ type: "", message: "" });

    try {
      // Get organization and token
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;
      const token = localStorage.getItem("accessToken");

      if (!organizationId || !token) {
        throw new Error("Organization or token not found");
      }

      // Clean and validate data
      const cleanPrice = formData.price
        ? parseFloat(formData.price.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanAdultSelling = formData.adultSellingPrice
        ? parseFloat(formData.adultSellingPrice.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanAdultPurchase = formData.adultPurchasePrice
        ? parseFloat(formData.adultPurchasePrice.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanChildSelling = formData.childSellingPrice
        ? parseFloat(formData.childSellingPrice.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanChildPurchase = formData.childPurchasePrice
        ? parseFloat(formData.childPurchasePrice.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanInfantSelling = formData.infantSellingPrice
        ? parseFloat(formData.infantSellingPrice.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanInfantPurchase = formData.infantPurchasePrice
        ? parseFloat(formData.infantPurchasePrice.replace(/[^0-9.]/g, ""))
        : 0;

      // Validate required fields
      if (!formData.airline || isNaN(parseInt(formData.airline))) {
        throw new Error("Please select a valid airline");
      }
      if (!formData.departure) {
        throw new Error("Departure city is required");
      }
      if (!formData.arrival) {
        throw new Error("Arrival city is required");
      }
      if (!formData.departureDateTime) {
        throw new Error("Departure date and time is required");
      }
      if (!formData.arrivalDateTime) {
        throw new Error("Arrival date and time is required");
      }
      if (!formData.totalSeats || parseInt(formData.totalSeats) <= 0) {
        throw new Error("Total seats must be greater than 0");
      }

      // Validate round-trip fields if applicable
      if (formData.tripType === "Round-trip") {
        if (!formData.returnDeparture) {
          throw new Error("Return departure city is required");
        }
        if (!formData.returnArrival) {
          throw new Error("Return arrival city is required");
        }
        if (!formData.returnDepartureDateTime) {
          throw new Error("Return departure date and time is required");
        }
        if (!formData.returnArrivalDateTime) {
          throw new Error("Return arrival date and time is required");
        }
      }

      // Prepare payload
      const payload = {
        is_meal_included: formData.meal === "Yes",
        is_refundable: formData.ticketType === "Refundable",
        pnr: formData.pnr || "N/A",
        // price: cleanPrice,
  // Purchase prices -> `*_price` (purchase / cost)
  adult_price: cleanAdultPurchase,
  child_price: cleanChildPurchase,
  infant_price: cleanInfantPurchase,
  // Selling prices -> store in `*_fare` (selling / fare)
  adult_fare: cleanAdultSelling,
  child_fare: cleanChildSelling,
  infant_fare: cleanInfantSelling,
        total_seats: parseInt(formData.totalSeats) || 0,
        left_seats: parseInt(formData.totalSeats) || 0,
        baggage_weight: parseFloat(formData.weight.replace(/[^0-9.]/g, '')) || 0,
        baggage_pieces: parseInt(formData.piece.replace(/[^0-9]/g, '')) || 0,
        is_umrah_seat: formData.umrahSeat === "Yes",
        trip_type: formData.tripType,
        departure_stay_type: formData.flightType,
        return_stay_type:
          formData.tripType === "Round-trip"
            ? formData.returnFlightType
            : "Non-Stop",
        organization: organizationId,
        // For creates: default to false unless the user explicitly toggled the checkbox.
        // For edits (ticketId present): preserve the current value.
        reselling_allowed: ticketId
          ? !!formData.resellingAllowed
          : resellingTouched
          ? !!formData.resellingAllowed
          : false,
        airline: parseInt(formData.airline),
        trip_details: [],
        stopover_details: [],
      };

      // Add departure trip details
      payload.trip_details.push({
        departure_date_time: new Date(formData.departureDateTime).toISOString(),
        arrival_date_time: new Date(formData.arrivalDateTime).toISOString(),
        trip_type: "Departure",
        departure_city: parseInt(formData.departure),
        arrival_city: parseInt(formData.arrival),
      });

      console.log('Final payload being sent:', payload);

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

      // Add stopover details
      if (formData.flightType === "1-Stop" && formData.stopLocation1) {
        payload.stopover_details.push({
          stopover_duration: formData.stopTime1,
          trip_type: "Departure",
          stopover_city: parseInt(formData.stopLocation1),
        });
      }

      if (
        formData.tripType === "Round-trip" &&
        formData.returnFlightType === "1-Stop" &&
        formData.returnStopLocation1
      ) {
        payload.stopover_details.push({
          stopover_duration: formData.returnStopTime1,
          trip_type: "Return",
          stopover_city: parseInt(formData.returnStopLocation1),
        });
      }

      let response;
      if (ticketId) {
        // Update existing ticket
        response = await axios.put(
          `http://127.0.0.1:8000/api/tickets/${ticketId}/`,
          payload,
          {
            params: { organization: organizationId },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // Create new ticket
        response = await axios.post(
          "http://127.0.0.1:8000/api/tickets/",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Show success message
      // On success
      setSubmitError({
        type: "success",
        message: ticketId
          ? "Ticket updated successfully!"
          : "Ticket created successfully!",
      });
      // Handle redirects based on action
      if (ticketId || action === "saveAndClose") {
        // Redirect after 1.5 seconds for updates or saveAndClose
        setTimeout(() => {
          navigate("/ticket-booking");
        }, 1000);
      } else if (action === "saveAndNew") {
        // Reset form for new entry
        setFormData({
          ...INITIAL_FORM_STATE,
          meal: "Yes",
          ticketType: "Refundable",
          umrahSeat: "Yes",
          tripType: "One-way",
          flightType: "Non-Stop",
          returnFlightType: "Non-Stop",
          adultSellingPrice: "",
          adultPurchasePrice: "",
          childSellingPrice: "",
          childPurchasePrice: "",
          infantSellingPrice: "",
          infantPurchasePrice: "",
          resellingAllowed: false,
        });
        setResellingTouched(false);
      }
    } catch (error) {
      console.error("API Error:", error);
      setSubmitError({
        type: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to save ticket",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => submitForm("save");
  const handleSaveAndNew = () => submitForm("saveAndNew");
  const handleSaveAndClose = () => submitForm("saveAndClose");

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
  const renderCityOptions = (field, currentValue, required = false) => {
    if (loading.cities) return <ShimmerLoader />;
    if (error.cities)
      return <div className="text-danger small">{error.cities}</div>;

    return (
      <select
        className="form-select  shadow-none"
        required={required}
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
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>

      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
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
            <div className="px-3 px-lg-4 my-3">
              {/* Navigation Tabs */}
              <div className="row ">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  {/* Navigation Tabs */}
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3  ${tab.name === "Add Tickets"
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
                        style={{ background: "#1976D2" }}
                      >
                        Export
                      </button>
                    </div>
                  </div>
                </div>

                {submitError.message && (
                  <div
                    className={`alert mx-3 alert-${submitError.type === "error" ? "danger" : "success"
                      }`}
                  >
                    {submitError.message}
                  </div>
                )}
                <div className="px-2 py-4 border rounded-4">
                  <div className="card border-0 rounded-3 p-2">
                    <div className="card-body">
                      {/* Ticket Details Section */}
                      <div className="mb-4">
                        <h5 className="card-title mb-3 fw-bold">Ticket (Details)</h5>
                        <div className="row g-3">
                          <div className="col-md-3">
                            <label htmlFor="" className="Control-label">
                              Select Airline
                            </label>
                            {loading.airlines ? (
                              <ShimmerLoader />
                            ) : error.airlines ? (
                              <div className="text-danger small">
                                {error.airlines}
                              </div>
                            ) : (
                              <select
                                className="form-select  shadow-none"
                                required
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
                            <label htmlFor="" className="Control-label">
                              Meal
                            </label>
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
                            <label htmlFor="" className="Control-label">
                              Type
                            </label>
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
                            <label htmlFor="" className="Control-label">
                              PNR
                            </label>
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="PND32323"
                              value={formData.pnr}
                              onChange={(e) =>
                                handleInputChange("pnr", e.target.value)
                              }
                            />
                          </div>
                          {/* <div className="col-md-3">
                      <fieldset
                        className="border border-black p-2 rounded mb-3"
                        style={{
                          paddingTop: "0.5rem",
                          paddingBottom: "0.5rem",
                        }}
                      >
                        <legend
                          className="float-none w-auto px-1 fs-6"
                          style={{
                            marginBottom: "0.25rem",
                            fontSize: "0.9rem",
                            lineHeight: "-1",
                          }}
                        >
                          Price
                        </legend>
                        <input
                          type="text"
                          className="form-control rounded shadow-none  px-1 py-2"
                          required
                          placeholder="Rs- 120,000/."
                          value={formData.price}
                          onChange={(e) =>
                            handleInputChange("price", e.target.value)
                          }
                        />
                      </fieldset>
                    </div> */}
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
                          <label htmlFor="" className="Control-label">
                            Weight
                          </label>
                          <input
                            type="text"
                            className="form-control rounded shadow-none  px-1 py-2"
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
                        <div className="col-md-4">
                          <label htmlFor="" className="Control-label">
                            Adult Prices
                          </label>
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Selling - Rs 120,000"
                              value={formData.adultSellingPrice}
                              onChange={(e) =>
                                handleInputChange("adultSellingPrice", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Purchasing - Rs 100,000"
                              value={formData.adultPurchasePrice}
                              onChange={(e) =>
                                handleInputChange("adultPurchasePrice", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <label htmlFor="" className="Control-label">
                            Child Prices
                          </label>
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Selling - Rs 100,000"
                              value={formData.childSellingPrice}
                              onChange={(e) =>
                                handleInputChange("childSellingPrice", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Purchasing - Rs 80,000"
                              value={formData.childPurchasePrice}
                              onChange={(e) =>
                                handleInputChange("childPurchasePrice", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <label htmlFor="" className="Control-label">
                            Infant Prices
                          </label>
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Selling - Rs 80,000"
                              value={formData.infantSellingPrice}
                              onChange={(e) =>
                                handleInputChange("infantSellingPrice", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Purchasing - Rs 60,000"
                              value={formData.infantPurchasePrice}
                              onChange={(e) =>
                                handleInputChange("infantPurchasePrice", e.target.value)
                              }
                            />
                          </div>
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
                          {renderCityOptions("departure", formData.departure, true)}
                        </div>
                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">
                            Arrival City
                          </label>
                          {renderCityOptions("arrival", formData.arrival, true)}
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
                                handleInputChange(
                                  "returnFlightType",
                                  e.target.value
                                )
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
                                  handleInputChange(
                                    "returnStopTime1",
                                    e.target.value
                                  )
                                }
                                placeholder="30 Minutes"
                              />
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Reselling Section */}
                    <div className="d-flex gap-5 p-4">
                      <div className="form-check d-flex align-items-center">
                        <input
                          className="form-check-input border border-black me-2"
                          type="checkbox"
                          id="reselling-allowed"
                          checked={!!formData.resellingAllowed}
                          onChange={(e) => {
                            handleInputChange("resellingAllowed", e.target.checked);
                            setResellingTouched(true);
                          }}
                          style={{ width: "1.3rem", height: "1.3rem" }}
                        />
                        <label className="form-check-label fw-medium" htmlFor="reselling-allowed">
                          Allow Reselling
                        </label>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="row">
                      <div className="col-12 d-flex flex-wrap justify-content-end gap-2 mt-4 pe-3">
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
                          className="btn btn-primary px-4"
                          onClick={handleSaveAndNew}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Saving..." : "Save and New"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary px-4"
                          onClick={handleSaveAndClose}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Saving..." : "Save and Close"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary px-4"
                          onClick={handleCancel}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                      </div>
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

export default FlightBookingForm;