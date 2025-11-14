import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Bag } from "react-bootstrap-icons";
import { Utensils } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const BookingReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticket, cityMap, airlineMap, passengers } = location.state || {};
  const [currentStep] = useState(2);
  const [passengerData, setPassengerData] = useState([]);
  const [expiryTime, setExpiryTime] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load passengers from localStorage if not passed via state
  useEffect(() => {
    if (!passengers || passengers.length === 0) {
      const savedPassengers = localStorage.getItem("PassengersDetails");
      if (savedPassengers) {
        setPassengerData(JSON.parse(savedPassengers));
      }
    } else {
      setPassengerData(passengers);
    }

    const fetchExpiryTime = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const orgId = getOrgId();
        const response = await axios.get(`http://127.0.0.1:8000/api/booking-expiry/?organization=${orgId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data && response.data.length > 0) {
          setExpiryTime(response.data[0].umrah_expiry_time || 24);
        }
      } catch (error) {
        console.error('Error fetching expiry time:', error);
      }
    };

    fetchExpiryTime();
  }, [passengers]);

  const steps = [
    { id: 1, title: "Booking Detail", completed: true },
    { id: 2, title: "Booking Review", completed: false, current: true },
  ];

  if (!ticket) return null;

  // Get airline info
  const airlineInfo = airlineMap[ticket.airline] || {};

  // Safely get trip and stopover details
  const tripDetails = ticket.trip_details || [];
  const stopoverDetails = ticket.stopover_details || [];

  const outboundTrip = tripDetails.find((t) => t.trip_type === "Departure");
  const returnTrip = tripDetails.find((t) => t.trip_type === "Return");

  const outboundStopover = stopoverDetails.find(
    (s) => s.trip_type === "Departure"
  );
  const returnStopover = stopoverDetails.find((s) => s.trip_type === "Return");

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

  // Format functions
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
        year: "numeric",
      });
    } catch (e) {
      return "-- ---";
    }
  };

  if (!ticket) {
    return (
      <div className="container-fluid p-3">
        <div className="row">
          <div className="col-lg-2 mb-3">
            <AgentSidebar />
          </div>
          <div className="col-lg-10">
            <AgentHeader />
            <div className="alert alert-danger mt-4">
              No ticket data found. Please go back and select a flight.
            </div>
            <Link to="/booking" id="btn" className="btn btn-primary">
              Back to Booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      grandTotal: adultTotal + childTotal + infantTotal
    };
  };

  const priceDetails = calculateTotalPrice();

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0];
  };

  const userId = localStorage.getItem("userId");
  const agencyId = Number(localStorage.getItem("agencyId"));
  const branchId = Number(localStorage.getItem("branchId"));

  // Helper function to generate booking number
  const generateBookingNumber = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `BK${timestamp}${randomStr}`.toUpperCase();
  };

  const prepareBookingData = () => {
    // Calculate price details
    const priceDetails = calculateTotalPrice();

    // Prepare ticket details - ensure all IDs are integers
    const ticketDetails = [{
      trip_details: tripDetails.map(trip => ({
        departure_date_time: trip.departure_date_time,
        arrival_date_time: trip.arrival_date_time,
        trip_type: trip.trip_type || "",
        departure_city: parseInt(trip.departure_city?.id || trip.departure_city) || 0, // ✅ ID only
        arrival_city: parseInt(trip.arrival_city?.id || trip.arrival_city) || 0       // ✅ ID only
      })),
      stopover_details: stopoverDetails.map(stopover => ({
        stopover_duration: stopover.stopover_duration || "",
        trip_type: stopover.trip_type || "",
        stopover_city: parseInt(stopover.stopover_city?.id || stopover.stopover_city) || 0 // ✅ ID only
      })),
      is_meal_included: ticket.is_meal_included || false,
      is_refundable: ticket.is_refundable || false,
      pnr: ticket.pnr || "",
      child_price: parseFloat(ticket.child_price) || 0,
      infant_price: parseFloat(ticket.infant_price) || 0,
      adult_price: parseFloat(ticket.adult_price) || 0,
      seats: parseInt(ticket.seats) || 0,
      weight: parseFloat(ticket.weight) || 0,
      pieces: parseInt(ticket.pieces) || 0,
      is_umrah_seat: ticket.is_umrah_seat || false,
      trip_type: ticket.trip_type || "",
      departure_stay_type: ticket.departure_stay_type || "",
      return_stay_type: ticket.return_stay_type || "",
      status: "Confirmed",
      is_price_pkr: true,
      riyal_rate: 0,
      ticket: parseInt(ticket.id || ticket.ticket) || 0 // ✅ ID only
    }];

    // Prepare person details
    const personDetails = passengerData.map(passenger => {
      const isTicketIncluded = ticketDetails && ticketDetails.length > 0;
      const ticketStatus = isTicketIncluded ? "NOT APPROVED" : "NOT INCLUDED";

      return {
        ziyarat_details: [],
        food_details: [],
        contact_details: [{
          phone_number: passenger.phone || "",
          remarks: passenger.remarks || ""
        }],
        age_group: passenger.type || "",
        person_title: passenger.title || "",
        first_name: passenger.firstName || "",
        last_name: passenger.lastName || "",
        passport_number: passenger.passportNumber || passenger.passportNo || "",
        date_of_birth: passenger.dob || "",
        passpoet_issue_date: passenger.passportIssue || passenger.ppIssueDate || "",
        passport_expiry_date: passenger.passportExpiry || passenger.ppExpiryDate || "",
        // passport_picture: "",
        country: passenger.country || "",
        is_visa_included: passenger.isVisaIncluded || false,
        is_ziyarat_included: passenger.isZiyaratIncluded || false,
        is_food_included: passenger.isFoodIncluded || false,
        visa_price: 0,
        // is_family_head: passenger.isFamilyHead || false,
        // family_number: parseInt(passenger.familyNumber),
        visa_status: "No",
        ticket_status: ticketStatus,
        ticket_remarks: passenger.ticketRemarks || "",
        visa_group_number: passenger.visaGroupNumber || "",
        ticket_voucher_number: "",
        ticker_brn: "",
        food_voucher_number: "",
        food_brn: "",
        ziyarat_voucher_number: "",
        ziyarat_brn: "",
        transport_voucher_number: "",
        transport_brn: "",
        // shirka: ,
      };
    });

    const orgId = parseInt(getOrgId());
    const userIdNum = parseInt(userId);
    const agencyIdNum = parseInt(agencyId);
    const branchIdNum = parseInt(branchId);

    // Prepare booking data
    const bookingData = {
      hotel_details: [],  // ✅ can map later if hotels are added
      transport_details: [], // ✅ can map later if transports are added
      ticket_details: ticketDetails,
      person_details: personDetails,
      payment_details: [],

      booking_number: generateBookingNumber(),
      expiry_time: new Date(Date.now() + expiryTime * 60 * 60 * 1000).toISOString(),

      total_pax: parseInt(passengerData.length),
      total_adult: parseInt(priceDetails.adultCount),
      total_infant: parseInt(priceDetails.infantCount),
      total_child: parseInt(priceDetails.childCount),

      total_ticket_amount: parseFloat(priceDetails.grandTotal),
      // total_hotel_amount: ,
      // total_transport_amount: ,
      // total_visa_amount: ,
      total_amount: parseFloat(priceDetails.grandTotal),

      is_paid: false,
      status: "un-approve",
      payment_status: "Pending",
      is_partial_payment_allowed: false,
      category: "Ticket_Booking",

      user: userIdNum,
      organization: orgId,
      branch: branchIdNum,
      agency: agencyIdNum
    };

    return bookingData;
  };

  // Function to handle booking submission
  const handleMakeBooking = async () => {
    setIsSubmitting(true);
    try {
      const bookingData = prepareBookingData();
      const token = localStorage.getItem("agentAccessToken");

      // Log the data being sent for debugging
      console.log("Booking data being sent:", JSON.stringify(bookingData, null, 2));

      // Make API call with proper axios syntax
      const response = await axios.post(
        `http://127.0.0.1:8000/api/bookings/`,
        bookingData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        const result = response.data;
        // Navigate to payment page with booking ID
        navigate('/booking/pay', {
          state: {
            bookingId: result.id,
            ticket,
            cityMap,
            airlineMap,
            passengers: passengerData
          }
        });
      } else {
        throw new Error('Booking submission failed');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);

      // More detailed error logging
      if (error.response) {
        // The server responded with an error status
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);

        // Check if it's an HTML response (server error page)
        if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
          alert('Server error occurred. Please check the console for details.');
        } else {
          alert(`Failed to submit booking: ${error.response.data.detail || error.response.statusText}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        alert('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        console.error('Error message:', error.message);
        alert('Failed to submit booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
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
              {/* Step Progress */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center flex-wrap">
                    {/* Step 1 */}
                    <div className="d-flex align-items-center me-4">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        1
                      </div>
                      <span className="ms-2 text-primary fw-bold">
                        Booking Detail
                      </span>
                    </div>

                    {/* Line 1 (active) */}
                    <div
                      className="flex-grow-1"
                      style={{ height: "2px", backgroundColor: "#0d6efd" }}
                    ></div>

                    {/* Step 2 (now marked complete) */}
                    <div className="d-flex align-items-center mx-4">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        2
                      </div>
                      <span className="ms-2 text-primary fw-bold">
                        Booking Review
                      </span>
                    </div>

                    {/* Line 2 (inactive) */}
                    <div
                      className="flex-grow-1"
                      style={{ height: "2px", backgroundColor: "#dee2e6" }}
                    ></div>

                    {/* Step 3 (still upcoming) */}
                    <div className="d-flex align-items-center">
                      <div
                        className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        3
                      </div>
                      <span className="ms-2 text-muted">Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Details Section */}
              <h5 className="mb-3 fw-bold">Flight Details</h5>
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
                                    top: "14px",
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
                                        top: "14px",
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
                          <div
                            className="text-uppercase fw-semibold small mt-1"
                            style={{ color: "#699FC9" }}
                          >
                            {returnStopover ? "1 Stop" : "Non-stop"}
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
                    </>
                  )}

                  <hr className="" />

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
                  <div className=" py-2 px-3">
                    <h6 className="mb-0 fw-bold text-primary text-center">Payment Summary</h6>
                    <hr />
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

                    <div className="row fw-semibold d-flex align-items-end">
                      <h6 className="col-md-6 text-end fw-bold">Grand Total:</h6>
                      <div className="col-md-6 text-end text-primary">
                        {priceDetails.hasZeroPrice ? "Fare on call" : `PKR ${priceDetails.grandTotal.toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Table */}
              <div className="bg-white rounded p-4 mb-4 shadow-sm">
                <h5 className="mb-3 fw-bold">Passengers Passport Detail</h5>
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Type</th>
                        <th>Title</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Passport No</th>
                        <th>DOB</th>
                        <th>PP Issue Date</th>
                        <th>PP Expiry Date</th>
                        <th>Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengerData.map((passenger, index) => (
                        <tr key={index}>
                          <td>{passenger.type}</td>
                          <td>{passenger.title}</td>
                          <td>{passenger.firstName}</td>
                          <td>{passenger.lastName}</td>
                          <td>{passenger.passportNumber || passenger.passportNo}</td>
                          <td>{formatDate(passenger.dob)}</td>
                          <td>{formatDate(passenger.passportIssue || passenger.ppIssueDate)}</td>
                          <td>{formatDate(passenger.passportExpiry || passenger.ppExpiryDate)}</td>
                          <td>{passenger.country}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-3">
                <Link
                  to="/booking/detail"
                  state={{ ticket, cityMap, airlineMap, passengers: passengerData }}
                  className="btn btn-secondary px-4"
                >
                  Back To Edit
                </Link>

                <button
                  onClick={handleMakeBooking}
                  disabled={isSubmitting}
                  className="btn btn-primary px-4"
                >
                  {isSubmitting ? 'Processing...' : 'Make Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingReview;