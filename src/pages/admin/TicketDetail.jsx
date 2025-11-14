import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { NavLink } from "react-router-dom";
import { Search } from "lucide-react";
import axios from "axios";
import { formatDateTimeForInput } from "../../utils/dateUtils";

const TicketDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("ticket");
  const [searchTerm, setSearchTerm] = useState("");
  const [airlines, setAirlines] = useState([]);
  const [cities, setCities] = useState([]);
  
  const tabs = [
    { name: "Ticket Bookings", path: "/ticket-booking" },
    { name: "Add Tickets", path: "/ticket-booking/add-ticket" },
  ];

  const token = localStorage.getItem("accessToken");
  const selectedOrg = JSON.parse(localStorage.getItem("selectedOrganization"));

  // Create mappings for airlines and cities
  const airlineMap = {};
  airlines.forEach((airline) => {
    airlineMap[airline.id] = airline.name;
  });

  const cityMap = {};
  cities.forEach((city) => {
    cityMap[city.id] = city.name;
  });

  useEffect(() => {
    const fetchAirlinesAndCities = async () => {
      const orgId = typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
      try {
        const [airlinesRes, citiesRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/airlines/?organization=${orgId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://127.0.0.1:8000/api/cities/?organization=${orgId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setAirlines(airlinesRes.data);
        setCities(citiesRes.data);
      } catch (err) {
        console.error("Error fetching reference data:", err);
      }
    };

    fetchAirlinesAndCities();
  }, [token]);

  useEffect(() => {
    const fetchTicketAndBookings = async () => {
      if (airlines.length === 0 || cities.length === 0) return;

      if (!id) {
        console.error("TicketDetail: missing ticket id in route params");
        setError("Ticket ID is missing from the URL");
        setLoading(false);
        setBookingsLoading(false);
        return;
      }

      const orgId = typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
      try {
        console.debug("Fetching ticket and bookings", { id, selectedOrg });
        const [ticketResponse, bookingsResponse] = await Promise.all([
          axios.get(
            `http://127.0.0.1:8000/api/tickets/${id}/?organization=${orgId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
          axios.get(
            `http://127.0.0.1:8000/api/bookings/`,
            {
              params: { ticket_id: id, organization: orgId },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        ]);

        if (ticketResponse.status >= 200 && ticketResponse.status < 300) {
          setTicket(ticketResponse.data);
        } else {
          throw new Error(`Ticket request failed with status ${ticketResponse.status}`);
        }

        if (bookingsResponse.status >= 200 && bookingsResponse.status < 300) {
          setBookings(bookingsResponse.data);
        } else {
          throw new Error(`Bookings request failed with status ${bookingsResponse.status}`);
        }

      } catch (err) {
        console.error("Error fetching ticket or bookings:", err);
        // If the backend reports 404 for this ticket, it's likely the list was populated
        // from stale cached data in localStorage. Clear the ticket list cache so the
        // UI can't keep showing a non-existent ticket and navigate back to the list.
        if (err.response && err.response.status === 404) {
          try {
            const orgId = typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
            const cacheKey = `ticketData-${orgId}`;
            localStorage.removeItem(cacheKey);
            console.warn(`TicketDetail: cleared stale cache ${cacheKey} after 404`);
          } catch (e) {
            console.warn("TicketDetail: failed to clear cache:", e);
          }
          setError("Ticket not found (it may have been deleted). Returning to list.");
          // navigate back to ticket list after a short delay so user sees the message
          setTimeout(() => navigate("/ticket-booking"), 900);
          return;
        }

        setError(err.message || "Failed to fetch ticket or bookings");
      } finally {
        setLoading(false);
        setBookingsLoading(false);
      }
    };

    // Only fetch when reference data is ready
    if (airlines.length > 0 && cities.length > 0) {
      fetchTicketAndBookings();
    }
  }, [id, airlines, cities, token, selectedOrg]);

  // Format date to DD/MM/YYYY hh:mm A format
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";

    const date = new Date(dateTimeString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  // Format date to DD/MM/YYYY format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Shimmer effect component
  const ShimmerEffect = ({ type = "text", className = "" }) => (
    <div 
      className={`shimmer ${className}`}
      style={{ 
        background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        borderRadius: type === "circle" ? "50%" : "4px",
        display: "inline-block"
      }}
    />
  );

  // Shimmer table row component
  const ShimmerTableRow = ({ columns }) => (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="py-3">
          <ShimmerEffect className="w-100" style={{ height: "20px" }} />
        </td>
      ))}
    </tr>
  );

  if (loading) {
    return (
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          <div className="col-12 col-lg-2">
            <Sidebar />
          </div>
          <div className="col-12 col-lg-10">
            <div className="container">
              <Header />
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading ticket details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-5 text-danger">Error: {error}</div>;
  }

  if (!ticket) {
    return <div className="text-center py-5">Ticket not found</div>;
  }

  // Prepare ticket data from API with airline name
  const ticketData = {
    airline: airlineMap[ticket.airline] || ticket.airline,
    flightNumber: ticket.flight_number || "N/A",
    meal: ticket.is_meal_included ? "Yes" : "No",
    type: ticket.is_refundable ? "Refundable" : "Non-refundable",
    pnr: ticket.pnr,
    price: `Rs. ${ticket?.adult_price?.toLocaleString?.() || "0"}/-`,
    totalSeats: ticket.left_seats,
    weight: `${ticket.baggage_weight || ticket.weight || 0} KG`,
    piece: ticket.baggage_pieces || ticket.pieces || 0,
    umrahSeat: ticket.is_umrah_seat ? "Yes" : "No",
    seatType: ticket.seat_type || "Economy",
    adultFare: ticket.adult_fare || 0,
    adultPurchasePrice: ticket.adult_purchase_price || 0,
    childFare: ticket.child_fare || 0,
    childPurchasePrice: ticket.child_purchase_price || 0,
    infantFare: ticket.infant_fare || 0,
    infantPurchasePrice: ticket.infant_purchase_price || 0,
  };

  // Prepare trip data from API with city names
  const firstTrip = ticket.trip_details[0];
  const tripData = {
    tripType: firstTrip?.trip_type || "N/A",
    departureDate: firstTrip
      ? formatDateTime(firstTrip.departure_date_time)
      : "N/A",
    arrivalDate: firstTrip
      ? formatDateTime(firstTrip.arrival_date_time)
      : "N/A",
    departure: firstTrip?.departure_city
      ? cityMap[firstTrip.departure_city] || firstTrip.departure_city
      : "N/A",
    arrival: firstTrip?.arrival_city
      ? cityMap[firstTrip.arrival_city] || firstTrip.arrival_city
      : "N/A",
  };

  // Determine flight type
  const flightType = ticket.stopover_details.length === 0 ? "Non-Stop" : "With Stopovers";

  // Prepare passenger data from bookings API
  const passengers = bookings.map((booking, index) => ({
    sno: index + 1,
    orderNo: booking.id || "N/A",
    passportNo: booking.person_passport_number || "N/A",
    group:booking.person_age_group || "N/A",
    title: booking.person_title || "N/A",
    gender: booking.person_title === "MR" ? "M" : (booking.person_title === "MRS" ? "F" : "N/A"),
    firstName: booking.person_first_name || "N/A",
    lastName: booking.person_last_name || "N/A",
    dob: formatDate(booking.person_date_of_birth) || "N/A",
    issueDate: booking.person_passpoet_issue_date ? formatDate(booking.person_passpoet_issue_date) : "N/A",
    expiryDate: booking.person_passport_expiry_date ? formatDate(booking.person_passport_expiry_date) : "N/A",
    country: booking.person_passport_country || "N/A",
    ticketPrice: booking.person_ticket_price ? `Rs. ${booking.person_ticket_price.toLocaleString()}/-` : "N/A",
    bookingStatus: booking.booking_status || "N/A",
    bookingCategory: booking.booking_category || "N/A"
  }));

  // Prepare agent data from the first booking (assuming all bookings for this ticket have the same agency)
  const firstBooking = bookings[0];
  const agentData = firstBooking ? {
    agencyCode: firstBooking.id || "N/A",
    name: firstBooking.agency_name || "N/A",
    contactNo1: firstBooking.agency_phone || "N/A",
    contactNo2: firstBooking.agency_name2 || "N/A",
    address: firstBooking.agency_address || "N/A",
    balance: firstBooking.total_ticket_amount_pkr ? `Rs. ${firstBooking.total_ticket_amount_pkr.toLocaleString()}/-` : "N/A",
    agreementStatus: firstBooking.agency_agreement_status ? "Active" : "Inactive",
    bookedAmount: firstBooking.total_ticket_amount_pkr ? `Rs. ${firstBooking.total_ticket_amount_pkr.toLocaleString()}/-` : "N/A",
    email: firstBooking.agency_email || "N/A",
    logo: firstBooking.agency_logo || null
  } : {
    agencyCode: "N/A",
    name: "N/A",
    contactNo1: "N/A",
    contactNo2: "N/A",
    address: "N/A",
    balance: "N/A",
    agreementStatus: "N/A",
    bookedAmount: "N/A",
    email: "N/A",
    logo: null
  };

  const handleEdit = () => {
    const editData = {
      airline: ticket.airline,
      meal: ticket.is_meal_included ? "Yes" : "No",
      ticketType: ticket.is_refundable ? "Refundable" : "Non-Refundable",
      pnr: ticket.pnr,
      adault_visa_price: ticket.price,
      totalSeats: ticket.left_seats.toString(),
      weight: ticket.weight.toString(),
      piece: ticket.pieces.toString(),
      umrahSeat: ticket.is_umrah_seat ? "Yes" : "No",
      // Add pricing fields
      adultSellingPrice: ticket.adult_fare?.toString() || "",
      adultPurchasePrice: ticket.adult_purchase_price?.toString() || "",
      childSellingPrice: ticket.child_fare?.toString() || "",
      childPurchasePrice: ticket.child_purchase_price?.toString() || "",
      infantSellingPrice: ticket.infant_fare?.toString() || "",
      infantPurchasePrice: ticket.infant_purchase_price?.toString() || "",
      tripType: ticket.trip_details[0]?.trip_type === "Return" ? "Round-trip" : "One-way",
      flightType: ticket.departure_stay_type || "Non-Stop",
      returnFlightType: ticket.return_stay_type || "Non-Stop",
      departureDateTime: formatDateTimeForInput(ticket.trip_details[0]?.departure_date_time),
      arrivalDateTime: formatDateTimeForInput(ticket.trip_details[0]?.arrival_date_time),
      departure: ticket.trip_details[0]?.departure_city,
      arrival: ticket.trip_details[0]?.arrival_city,
      // Add return trip data if exists
      ...(ticket.trip_details[1] && {
        returnDepartureDateTime: formatDateTimeForInput(ticket.trip_details[1]?.departure_date_time),
        returnArrivalDateTime: formatDateTimeForInput(ticket.trip_details[1]?.arrival_date_time),
        returnDeparture: ticket.trip_details[1]?.departure_city,
        returnArrival: ticket.trip_details[1]?.arrival_city,
      }),
      // Add stopover data if exists
      ...(ticket.stopover_details.length > 0 && {
        stopLocation1: ticket.stopover_details[0]?.stopover_city,
        stopTime1: ticket.stopover_details[0]?.stopover_duration,
      }),
      // Add return stopover data if exists
      ...(ticket.stopover_details.length > 1 && {
        returnStopLocation1: ticket.stopover_details[1]?.stopover_city,
        returnStopTime1: ticket.stopover_details[1]?.stopover_duration,
      }),
    };

    // Navigate to add-ticket route with state
    navigate("/ticket-booking/add-ticket", {
      state: { editData, ticketId: id },
    });
  };

  // Open the delete confirmation modal
  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  // Perform the actual delete request (called from modal)
  const performDelete = async () => {
    const orgId = typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    setDeleting(true);
    setError(null);
    try {
      await axios.delete(`http://127.0.0.1:8000/api/tickets/${id}/`, {
        params: { organization: orgId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage("Ticket deleted successfully.");
      setShowDeleteModal(false);
      // clear cached ticket list for this org so UI refreshes elsewhere
      try {
        localStorage.removeItem(`ticketData-${orgId}`);
      } catch (e) {
        // ignore
      }
      // navigate back after a short delay so user can see success message
      setTimeout(() => navigate("/ticket-booking"), 900);
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      setError(err.response?.data?.detail || err.message || "Failed to delete ticket");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          .shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
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
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${
                          tab.name === "Ticket Bookings"
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
              </div>
              <div
                className=" rounded-3 shodaw"
                style={{ backgroundColor: "#fff", minHeight: "100vh" }}
              >
                {/* Header */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0">
                      <div className="card-header border-0 bg-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">Ticket (Details)</h5>
                        <button
                          className="btn text-white"
                          style={{ background: "#1976D2" }}
                          onClick={handleEdit}
                        >
                          Edit
                        </button>
                      </div>
                      <div
                        className="card-body rounded-5"
                        style={{ background: "#F3FAFF" }}
                      >
                        <div className="row">
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Airline</small>
                            <div className="text-muted">{ticketData.airline}</div>
                          </div>
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Flight Number</small>
                            <div className="text-muted">{ticketData.flightNumber}</div>
                          </div>
                          <div className="col-md-1 mb-2">
                            <small className="fw-bold">Meal</small>
                            <div className="text-muted">{ticketData.meal}</div>
                          </div>
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Type</small>
                            <div className="text-muted">{ticketData.type}</div>
                          </div>
                          <div className="col-md-1 mb-2">
                            <small className="fw-bold">PNR</small>
                            <div className="d-flex align-items-center">
                              <div className="text-muted">{ticketData.pnr}</div>
                              {(ticket.reselling_allowed === true || ticket.reselling_allowed === "true" || ticket.reselling_allowed === 1 || ticket.reselling_allowed === "1") && String(ticket.organization) !== String(selectedOrg?.id) && (
                                <span className="badge bg-success ms-2">Reselling Allowed</span>
                              )}
                            </div>
                          </div>
                          <div className="col-md-1 mb-2">
                            <small className="fw-bold">Price</small>
                            <div className="text-muted">{ticketData.price}</div>
                          </div>
                          <div className="col-md-1 mb-2">
                            <small className="fw-bold">Total Seats</small>
                            <div className="text-muted">
                              {ticketData.totalSeats}
                            </div>
                          </div>
                          <div className="col-md-1 mb-2">
                            <small className="fw-bold">Weight</small>
                            <div className="text-muted">{ticketData.weight}</div>
                          </div>
                          <div className="col-md-1 mb-2">
                            <small className="fw-bold">Piece</small>
                            <div className="text-muted">{ticketData.piece}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0">
                      <div className="card-header border-0 bg-white">
                        <h5 className="mb-0 fw-bold">Trip (Details)</h5>
                      </div>
                      <div
                        className="card-body rounded-5"
                        style={{ background: "#F3FAFF" }}
                      >
                        <div className="row">
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Trip Type</small>
                            <div className="text-muted">{tripData.tripType}</div>
                          </div>
                          <div className="col-md-3 mb-2">
                            <small className="fw-bold">Departure Date & Time</small>
                            <div className="text-muted">
                              {tripData.departureDate}
                            </div>
                          </div>
                          <div className="col-md-3 mb-2">
                            <small className="fw-bold">Arrival Date & Time</small>
                            <div className="text-muted">{tripData.arrivalDate}</div>
                          </div>
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Departure</small>
                            <div className="text-muted">{tripData.departure}</div>
                          </div>
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Arrival</small>
                            <div className="text-muted">{tripData.arrival}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seat & Pricing Details */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0">
                      <div className="card-header border-0 bg-white">
                        <h5 className="mb-0 fw-bold">Seat & Pricing</h5>
                      </div>
                      <div
                        className="card-body rounded-5"
                        style={{ background: "#F3FAFF" }}
                      >
                        <div className="row">
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Seat type</small>
                            <div className="text-muted">{ticketData.seatType}</div>
                          </div>
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Adult fare</small>
                            <div className="text-muted">Rs. {Number(ticketData.adultFare || 0).toLocaleString()}/-</div>
                          </div>
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Adult purchase price</small>
                            <div className="text-muted">Rs. {Number(ticketData.adultPurchasePrice || 0).toLocaleString()}/-</div>
                          </div>
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Child fare</small>
                            <div className="text-muted">Rs. {Number(ticketData.childFare || 0).toLocaleString()}/-</div>
                          </div>
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Child purchase price</small>
                            <div className="text-muted">Rs. {Number(ticketData.childPurchasePrice || 0).toLocaleString()}/-</div>
                          </div>
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Infant fare</small>
                            <div className="text-muted">Rs. {Number(ticketData.infantFare || 0).toLocaleString()}/-</div>
                          </div>
                          <div className="col-md-2 mb-2">
                            <small className="fw-bold">Infant purchase price</small>
                            <div className="text-muted">Rs. {Number(ticketData.infantPurchasePrice || 0).toLocaleString()}/-</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flight Details */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0">
                      <div className="card-header border-0 bg-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">Flight (Details)</h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div
                            className="col-md-2 mb-2 ps-4 py-2 rounded-5"
                            style={{ background: "#F3FAFF" }}
                          >
                            <small className="fw-bold">Flight Number</small>
                            <div className="text-muted">{ticketData.flightNumber}</div>
                          </div>
                          <div
                            className="col-md-2 mb-2 ps-4 py-2 rounded-5"
                            style={{ background: "#F3FAFF" }}
                          >
                            <small className="fw-bold">Flight Type</small>
                            <div className="text-muted">{flightType}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Pax Details */}
                <div className="row mb-4">
                  <div className="col-12">
                    {/* <div className="card border-0"> */}
                      <div className="card-header border-0 bg-white">
                        <h5 className="mb-0 fw-bold">Confirm Pax Details</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table text-center table-hover">
                            <thead
                              className="table-light"
                              style={{ background: "#EAF2FF" }}
                            >
                              <tr>
                                <th className="fw-normal">SNO</th>
                                <th className="fw-normal">Order</th>
                                <th className="fw-normal">Title</th>
                                <th className="fw-normal">Group</th>
                                <th className="fw-normal">G</th>
                                <th className="fw-normal">F.Name</th>
                                <th className="fw-normal">L.Name</th>
                                <th className="fw-normal">DOB</th>
                                <th className="fw-normal">Passport</th>
                                <th className="fw-normal">Issue date</th>
                                <th className="fw-normal">Expiry date</th>
                                <th className="fw-normal">Country</th>
                                <th className="fw-normal">Ticket Price</th>
                                <th className="fw-normal">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {passengers.length > 0 ? (
                                passengers.map((passenger) => (
                                  <tr key={passenger.sno}>
                                    <td className="text-muted">{passenger.sno}</td>
                                    <td className="text-muted">
                                      {passenger.orderNo}
                                    </td>
                                    <td className="text-muted">{passenger.title}</td>
                                    <td className="text-muted">{passenger.group}</td>
                                    <td className="text-muted">{passenger.gender}</td>
                                    <td className="text-muted">
                                      {passenger.firstName}
                                    </td>
                                    <td className="text-muted">
                                      {passenger.lastName}
                                    </td>
                                    <td className="text-muted">{passenger.dob}</td>
                                    <td className="text-muted">
                                      {passenger.passportNo}
                                    </td>
                                    <td className="text-muted">
                                      {passenger.issueDate}
                                    </td>
                                    <td className="text-muted">
                                      {passenger.expiryDate}
                                    </td>
                                    <td className="text-muted">
                                      {passenger.country}
                                    </td>
                                    <td className="text-muted">
                                      {passenger.ticketPrice}
                                    </td>
                                    <td className="text-muted">
                                      <span 
                                        className={`badge ${
                                          passenger.bookingStatus === 'Confirmed' 
                                            ? 'bg-success' 
                                            : passenger.bookingStatus === 'Pending'
                                            ? 'bg-warning'
                                            : 'bg-secondary'
                                        }`}
                                      >
                                        {passenger.bookingStatus}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="13" className="text-center text-muted py-3">
                                    No passengers found for this ticket
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        {/* </div> */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agent Details */}
                {!bookingsLoading && bookings.length > 0 && (
                  <div className="row mb-4">
                    <div className="col-12">
                      {/* <div className="card border-0 "> */}
                        <div className="card-header border-0 bg-white">
                          <h5 className="mb-0 fw-bold">Agent Details</h5>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table text-center table-hover">
                              <thead className="table-light">
                                <tr>
                                  <th className="fw-normal">id</th>
                                  <th className="fw-normal">Name</th>
                                  <th className="fw-normal">Contact No 1.</th>
                                  <th className="fw-normal">Contact No 2.</th>
                                  <th className="fw-normal">Email</th>
                                  <th className="fw-normal">Address</th>
                                  <th className="fw-normal">BALANCE</th>
                                  <th className="fw-normal">Agreement</th>
                                  <th className="fw-normal">BOOKED AMOUNT</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="text-muted">
                                    {agentData.agencyCode}
                                  </td>
                                  <td className="text-muted">{agentData.name}</td>
                                  <td className="text-muted">
                                    {agentData.contactNo1}
                                  </td>
                                  <td className="text-muted">
                                    {agentData.contactNo2}
                                  </td>
                                  <td className="text-muted">{agentData.email}</td>
                                  <td className="text-muted">{agentData.address}</td>
                                  <td className="text-muted">{agentData.balance}</td>
                                  <td className="text-muted">
                                    <span 
                                      className={`badge ${
                                        agentData.agreementStatus === 'Active' 
                                          ? 'bg-success' 
                                          : 'bg-danger'
                                      }`}
                                    >
                                      {agentData.agreementStatus}
                                    </span>
                                  </td>
                                  <td className="text-muted">
                                    {agentData.bookedAmount}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          {/* {agentData.logo && (
                            <div className="mt-3 text-center">
                              <img 
                                src={`http://127.0.0.1:8000/${agentData.logo}`} 
                                alt="Agency Logo" 
                                style={{ maxWidth: '150px', maxHeight: '80px' }}
                                className="img-thumbnail"
                              />
                            </div>
                          )} */}
                        </div>
                      {/* </div> */}
                    </div>
                  </div>
                )}

                {/* Confirmation Section */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0">
                      <div className="card-body">
                        <div className="row text-center">
                          <div className="col-md-6">
                            <h6 className="fw-bold">Pnr Owner</h6>
                            {/* <p className="text-muted">Other</p> */}
                          </div>
                          <div className="col-md-6">
                            <h6 className="fw-bold">Confirmed by</h6>
                            {/* <p className="text-muted">saleem /2341</p> */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="row">
                  <div className="col-12">
                    <div className="d-flex justify-content-end gap-3 flex-wrap">
                      <button className="btn btn-primary px-4">Save</button>
                      <button className="btn btn-primary px-4">Issue Ticket</button>
                      <button className="btn btn-primary px-4">
                        Delete History
                      </button>
                      <button className="btn btn-primary px-4">
                        Save and close
                      </button>
                      <button className="btn btn-primary px-4">
                        Close Booking
                      </button>
                        <button
                          className="btn btn-danger"
                          onClick={handleDelete}
                          disabled={loading}
                        >
                          Delete
                        </button>
                    </div>
                  </div>
                </div>
              </div>

                {/* Success / Error alerts */}
                {successMessage && (
                  <div className="alert alert-success mt-3" role="alert">
                    {successMessage}
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger mt-3" role="alert">
                    {error}
                  </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                  <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div
                      className="modal d-block"
                      tabIndex="-1"
                      role="dialog"
                      style={{ zIndex: 1060 }}
                    >
                      <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Confirm Delete</h5>
                            <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowDeleteModal(false)}></button>
                          </div>
                          <div className="modal-body">
                            <p className="mb-2">Are you sure you want to delete this ticket?</p>
                            <p className="small text-muted">This action cannot be undone. Ticket: <strong>{ticket?.flight_number || ticket?.trip_details?.[0]?.flight_number || 'N/A'}</strong> — PNR: <strong>{ticket?.pnr || 'N/A'}</strong></p>
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
                            <button type="button" className="btn btn-danger" onClick={performDelete} disabled={deleting}>
                              {deleting ? 'Deleting…' : 'Delete Ticket'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;