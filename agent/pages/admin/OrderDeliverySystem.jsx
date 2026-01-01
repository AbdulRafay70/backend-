import { ArrowBigLeft, ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  NavLink,
  useLocation,
  Link,
} from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import axios from "axios";
import { Dropdown } from 'react-bootstrap';
import { Funnel, Gear } from 'react-bootstrap-icons';

const TravelBookingInvoice = () => {
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [showVisaInterface, setShowVisaInterface] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { orderNo } = useParams();

  // Fetch booking data
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `https://api.saer.pk/api/bookings/?organization=${organizationId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch booking data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Assuming the API returns an array, take the first matching booking
        const booking = data.results?.find(b => b.booking_number === orderNo) || data[0];
        console.log(booking.booking_number);
        console.log(orderNo);
        

        if (!booking) {
          throw new Error("Booking not found");
        }

        setBookingData(booking);

        // Now fetch agency data
        if (booking.agency) {
          const agencyResponse = await fetch(
            `https://api.saer.pk/api/agencies/?organization_id=${organizationId}&id=${booking.agency}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          }
          );

          if (agencyResponse.ok) {
            const agencyData = await agencyResponse.json();
            setAgencyData(agencyData.results?.[0] || agencyData[0] || null);
          }
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [orderNo]);

  const handleConfirmOrder = async () => {
    try {
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;
      const token = localStorage.getItem("accessToken");

      const response = await axios.patch(
        `https://api.saer.pk/api/bookings/${bookingData.id}/`,
        {
          status: 'under-process',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Update local state to reflect the change
        setBookingData({ ...bookingData, status: 'under-process' });
        alert('Order status updated to Under Process');
        // Optionally navigate back to order list
        // navigate("/order-delivery");
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Error updating order status. Please try again.');
    }
  };

  // Render Visa Interface if needed
  // if (showVisaInterface) {
  //   return (
  //     <VisaApplicationInterface
  //       onClose={() => setShowVisaInterface(false)}
  //       orderNo={orderNo}
  //     />
  //   );
  // }

  if (bookingData && bookingData.status === "under-process") {
    return (
      <VisaApplicationInterface
        onClose={() => navigate("/order-delivery")}
        orderNo={orderNo}
      />
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <h4 className="alert-heading">Error Loading Data</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="alert alert-warning m-4" role="alert">
        <h4 className="alert-heading">Booking Not Found</h4>
        <p>No booking found with number: {orderNo}</p>
        <button className="btn btn-secondary" onClick={() => navigate("/order-delivery")}>
          Go Back
        </button>
      </div>
    );
  }

  // Helper functions to extract data
  const getAgencyName = () => {
    return agencyData?.ageny_name || "N/A";
  };

  const getAgencyCode = () => {
    return agencyData?.id || "N/A";
  };

  const getContactInfo = () => {
    if (agencyData?.contacts?.length > 0) {
      return agencyData.contacts[0].phone_number;
    }
    return agencyData?.phone_number || "N/A";
  };

  const getAgentName = () => {
    // if (agencyData?.contacts?.length > 0) {
    //   return agencyData.contacts[0].name;
    // }
    // return "N/A";
    return agencyData?.name || "N/A";
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      "un-approved": "primary",
      "approved": "success",
      "rejected": "danger",
      "pending": "warning",
      "confirmed": "info"
    };

    const color = statusColors[status] || "secondary";
    return `<span class="badge bg-${color}">${status}</span>`;
  };

  const calculateTotalNights = () => {
    if (!bookingData.hotel_details) return 0;
    return bookingData.hotel_details.reduce((total, hotel) => total + hotel.number_of_nights, 0);
  };

  const calculateTotalHotelAmount = () => {
    if (!bookingData.hotel_details) return 0;
    return bookingData.hotel_details.reduce((total, hotel) => total + hotel.total_price, 0);
  };

  const getPassengerTypeCount = (type) => {
    if (!bookingData.person_details) return 0;
    return bookingData.person_details.filter(person => person.age_group === type).length;
  };

  // Separate component for the reject note modal
  const RejectNoteModal = ({ onClose, onReject }) => {
    return (
      <>
        <div
          className="modal-backdrop fade show"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1040,
          }}
        ></div>

        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            zIndex: 1045,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            role="document"
          >
            <div className="modal-content">
              <div className="modal-header text-center">
                <h5 className="modal-title fw-bold w-100">Add Notes</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                ></button>
              </div>

              <div className="modal-body">
                <fieldset className="border rounded p-3 mb-4 bg-light position-relative">
                  <legend className="float-none w-auto px-2 fs-6 fw-bold mb-0">
                    Notes
                  </legend>
                  <div className="text-muted">
                    Call 92 world tour tomorrow and he will pay all the money
                  </div>
                  <div className="mt-2">
                    <strong>Date Reminder</strong>
                    <div className="text-muted">{new Date().toLocaleDateString()}</div>
                  </div>
                  <div className="mt-2">
                    <strong>Employer name</strong>
                    <div className="text-muted">id/name</div>
                  </div>
                  <div className="position-absolute top-0 end-0 mt-2 me-3">
                    <Gear size={16} className="text-muted" />
                  </div>
                </fieldset>

                <fieldset className="border border-black p-2 rounded mb-4">
                  <legend className="float-none w-auto px-1 fs-6">
                    Notes
                  </legend>
                  <textarea
                    className="form-control shadow-none"
                    rows={4}
                    placeholder="Enter Notes"
                  ></textarea>
                </fieldset>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={onReject}>Reject Order</button>
                <button
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm">
        <div className="card-body">
          {/* Header Section */}
          <div className="row mb-4">
            <div className="col-md-9">
              <div className="mb-3">
                <ArrowBigLeft
                  size={"30px"}
                  onClick={() => navigate("/order-delivery")}
                  className="cursor-pointer mb-2"
                />
                <label className="me-2 form-label small text-muted">
                  Order Number (VOUCHER NO)
                </label>
                <h4 className="text-primary">{orderNo}</h4>

                <div className="d-flex flex-wrap mt-3">
                  <div className="me-4 mb-2">
                    <div className="fw-bold">Agent Name:</div>
                    <div>{getAgentName()}</div>
                  </div>
                  <div className="me-4 mb-2">
                    <div className="fw-bold">Agency Name:</div>
                    <div>{getAgencyName()}</div>
                  </div>
                  <div className="me-4 mb-2">
                    <div className="fw-bold">Contact:</div>
                    <div>{getContactInfo()}</div>
                  </div>
                  <div className="mb-2">
                    <button className="btn btn-primary ms-2">Print</button>
                    <button className="btn btn-outline-primary ms-2">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column gap-2">
                {/* Visa */}
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small fw-bold">Visa:</span>
                  <div className={`badge ${bookingData.total_visa_amount > 0 ? 'bg-info' : 'bg-secondary'}`}>
                    {bookingData.total_visa_amount > 0 ? 'Included' : 'N/A'}
                  </div>
                </div>

                {/* Hotel Voucher */}
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small fw-bold">Hotel Voucher:</span>
                  <div className={`badge ${bookingData.total_hotel_amount > 0 ? 'bg-info' : 'bg-secondary'}`}>
                    {bookingData.total_hotel_amount > 0 ? 'Included' : 'N/A'}
                  </div>
                </div>

                {/* Transport */}
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small fw-bold">Transport:</span>
                  <div className={`badge ${bookingData.total_transport_amount > 0 ? 'bg-info' : 'bg-secondary'}`}>
                    {bookingData.total_transport_amount > 0 ? 'Included' : 'N/A'}
                  </div>
                </div>

                {/* Tickets */}
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small fw-bold">Tickets:</span>
                  <div className={`badge ${bookingData.total_ticket_amount > 0 ? 'bg-info' : 'bg-secondary'}`}>
                    {bookingData.total_ticket_amount > 0 ? 'Included' : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="table-responsive mb-4">
            <table className="table table-sm text-center">
              <thead className="table-light">
                <tr>
                  <th className="fw-normal">Order No</th>
                  <th className="fw-normal">Agency Code</th>
                  <th className="fw-normal">Agreement Status</th>
                  <th className="fw-normal">Package No</th>
                  <th className="fw-normal">Total Pax</th>
                  <th className="fw-normal">Balance</th>
                  <th className="fw-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{orderNo}</td>
                  <td>{getAgencyCode()}</td>
                  <td>{agencyData?.agreement_status ? "Active" : "Inactive"}</td>
                  <td>N/A</td>
                  <td>{bookingData.total_pax}</td>
                  <td>PKR {bookingData.remaining_amount || 0}</td>
                  <td dangerouslySetInnerHTML={{ __html: getStatusBadge(bookingData.status) }}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Booking Overview */}
          <h6 className="fw-bold mb-3">Booking Overview</h6>

          {/* Pax Information */}
          <h6 className="fw-bold mb-3 mt-5">Pax Information</h6>
          <div className="table-responsive mb-4">
            <table className="table table-sm text-center">
              <thead className="table-light">
                <tr>
                  <th className="fw-normal">Passenger Name</th>
                  <th className="fw-normal">Passport No</th>
                  <th className="fw-normal">PAX</th>
                  <th className="fw-normal">DOB</th>
                  <th className="fw-normal">PHB</th>
                  <th className="fw-normal">Bed</th>
                  <th className="fw-normal">Total Pax</th>
                </tr>
              </thead>
              <tbody>
                {bookingData.person_details && bookingData.person_details.length > 0 ? (
                  bookingData.person_details.map((person, index) => (
                    <tr key={index}>
                      <td>{`${person.first_name} ${person.last_name}`}</td>
                      <td>{person.passport_number || "N/A"}</td>
                      <td>{person.age_group || "Adult"}</td>
                      <td>{person.date_of_birth ? new Date(person.date_of_birth).toLocaleDateString() : "N/A"}</td>
                      <td>MM055</td>
                      <td>True</td>
                      <td>{index === 0 ? `${bookingData.total_pax} Pax` : ""}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">No passenger data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Accommodation */}
          {bookingData.hotel_details && bookingData.hotel_details.length > 0 && (
            <>
              <h6 className="fw-bold mb-3 mt-5">Accommodation</h6>
              <div className="table-responsive mb-4">
                <table className="table table-sm text-center">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-normal">Hotel Name</th>
                      <th className="fw-normal">Check-in</th>
                      <th className="fw-normal">Check-Out</th>
                      <th className="fw-normal">Nights</th>
                      <th className="fw-normal">Type</th>
                      <th className="fw-normal">QTY</th>
                      <th className="fw-normal">Rate</th>
                      <th className="fw-normal">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingData.hotel_details.map((hotel, index) => (
                      <tr key={index}>
                        <td>Hotel {hotel.hotel}</td>
                        <td>{hotel.check_in_time ? new Date(hotel.check_in_time).toLocaleDateString() : "N/A"}</td>
                        <td>{hotel.check_out_time ? new Date(hotel.check_out_time).toLocaleDateString() : "N/A"}</td>
                        <td>{hotel.number_of_nights}</td>
                        <td>{hotel.room_type}</td>
                        <td>{hotel.quantity}</td>
                        <td>{hotel.is_price_pkr ? `PKR ${hotel.price}` : `SAR ${hotel.price}`}</td>
                        <td>{hotel.is_price_pkr ? `PKR ${hotel.total_price}` : `SAR ${hotel.total_price}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="d-flex justify-content-around align-items-center mt-3">
                  <div>Total Accommodation:</div>
                  <div className="d-flex gap-5">
                    <div>{calculateTotalNights()} Nights</div>
                    <div>SAR {calculateTotalHotelAmount()}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Transportation */}
          {bookingData.transport_details && bookingData.transport_details.length > 0 && (
            <div className="row">
              <div className="col-md-10">
                <h6 className="fw-bold mb-3 mt-5">Transportation</h6>
                <div className="table-responsive mb-4">
                  <table className="table table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Vehicle type</th>
                        <th>Route</th>
                        <th>Rate</th>
                        <th>QTY</th>
                        <th>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.transport_details.map((transport, index) => (
                        <tr key={index}>
                          <td>{transport.vehicle_type}</td>
                          <td>Route Information</td>
                          <td>{transport.is_price_pkr ? `PKR ${transport.price}` : `SAR ${transport.price}`}</td>
                          <td>1</td>
                          <td>{transport.is_price_pkr ? `PKR ${transport.total_price}` : `SAR ${transport.total_price}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-around">
                    <div>Total Transportation: </div>
                    <div>SAR {bookingData.total_transport_amount || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Umrah Visa & Tickets Rates Details */}
          <div className="row">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3 mt-5">
                Umrah Visa & Tickets Rates Details
              </h6>
              <div className="table-responsive mb-4">
                <table className="table table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Pax</th>
                      <th>Total Pax</th>
                      <th>Visa Rate</th>
                      <th>Ticket Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Adult</td>
                      <td>{getPassengerTypeCount("Adult")}</td>
                      <td>
                        SAR {bookingData.total_visa_amount || 0}
                      </td>
                      <td>
                        PKR{" "}
                        {getPassengerTypeCount("Adult") *
                          (bookingData?.ticket_details?.[0]?.adult_price || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td>Child</td>
                      <td>{getPassengerTypeCount("Child")}</td>
                      <td>
                        SAR {bookingData.total_visa_amount || 0}
                      </td>
                      <td>
                        PKR{" "}
                        {getPassengerTypeCount("Child") *
                          (bookingData?.ticket_details?.[0]?.child_price || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td>Infant</td>
                      <td>{getPassengerTypeCount("Infant")}</td>
                      <td>
                        SAR {bookingData.total_visa_amount || 0}
                      </td>
                      <td>
                        PKR{" "}
                        {getPassengerTypeCount("Infant") *
                          (bookingData?.ticket_details?.[0]?.infant_price || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td>Total</td>
                      <td>{bookingData.total_pax}</td>
                      <td>SAR {bookingData.total_visa_amount || 0}</td>
                      <td>PKR {bookingData.total_ticket_amount || 0}</td>
                    </tr>
                  </tbody>

                </table>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <h6 className="fw-bold mb-3 mt-5">Invoice Details</h6>
          <div className="row">
            {/* Left Column */}
            <div className="col-lg-8 col-md-7 col-12 mb-3">
              <div className="mb-2">
                <span>Booking Date: </span>
                <span className="fw-bold">{bookingData.date ? new Date(bookingData.date).toLocaleDateString() : "N/A"}</span>
                <span className="ms-4 d-block d-sm-inline">
                  Family Head:{" "}
                  <span className="fw-bold">
                    {bookingData.person_details?.find(p => p.is_family_head)?.first_name || "N/A"}
                  </span>
                </span>
              </div>
              <div className="mb-2">
                <span>Booking#: </span>
                <span className="fw-bold">{orderNo}</span>
                <span className="ms-4 d-block d-sm-inline">
                  Travel Date:{" "}
                  <span className="fw-bold">
                    {bookingData.ticket_details?.[0]?.trip_details?.[0]?.departure_date_time
                      ? new Date(bookingData.ticket_details[0].trip_details[0].departure_date_time).toLocaleString()
                      : "N/A"}
                  </span>
                </span>
              </div>
              <div className="mb-2">
                <span>Invoice Date: </span>
                <span className="fw-bold">{new Date().toLocaleDateString()}</span>
                <span className="ms-4 d-block d-sm-inline">
                  Return Date:{" "}
                  <span className="fw-bold">
                    {bookingData.ticket_details?.[0]?.trip_details?.[1]?.departure_date_time
                      ? new Date(bookingData.ticket_details[0].trip_details[1].departure_date_time).toLocaleString()
                      : "N/A"}
                  </span>
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-lg-4 col-md-5 col-12">
              <div className="card h-100">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Pax:</span>
                    <strong>{bookingData.total_pax}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Visa Rate:</span>
                    <strong>PKR {bookingData.total_visa_amount || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tickets:</span>
                    <strong>PKR {bookingData.total_ticket_amount || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Hotel:</span>
                    <strong>PKR {bookingData.total_hotel_amount || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Transport:</span>
                    <strong>PKR {bookingData.total_transport_amount || 0}</strong>
                  </div>
                  <hr />
                  <div
                    className="d-flex justify-content-between align-items-center py-2 px-3 text-white rounded-3"
                    style={{ background: "#1B78CE" }}
                  >
                    <span>
                      <strong>Net PKR:</strong>
                    </span>
                    <strong>PKR {bookingData.total_amount || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h6 className="fw-bold">
            Ticket Availability:{" "}
            <span className="fw-bold" style={{ color: "#8BD399" }}>
              Available
            </span>
          </h6>
          <h6 className="fw-bold">
            Hotel Availability:{" "}
            <span className="fw-bold" style={{ color: "#8BD399" }}>
              Available
            </span>
          </h6>

          <div className="d-flex flex-wrap gap-2 mt-5">
            <button
              className="btn btn-primary"
              onClick={handleConfirmOrder}
            >
              Confirm Order
            </button>

            <button
              className="btn btn-outline-danger"
              onClick={() => setShowRejectNote(true)}
            >
              Reject With Note
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/order-delivery")}
            >
              Close
            </button>
          </div>

          {/* Reject Note Modal */}
          {showRejectNote && (
            <RejectNoteModal
              onClose={() => setShowRejectNote(false)}
              onReject={() => {
                // Handle reject logic here
                setShowRejectNote(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const HotelVoucherInterface = ({ onClose, orderNo }) => {
  const [transportList, setTransportList] = useState([
    {
      transportType: "",
      transportSector: "",
      voucherNumber: "",
      selfTransport: false,
    },
  ]);

  const [bookingData, setBookingData] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch booking and agency data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");
        // Fetch booking data
        const bookingResponse = await axios.get(`https://api.saer.pk/api/bookings/?organization_id=${organizationId}&booking_number=${orderNo}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        });
        const booking = bookingResponse.data.results?.find(item => item.booking_number === orderNo) || bookingResponse.data[0];

        if (!booking) {
          throw new Error('Booking not found');
        }

        setBookingData(booking);

        // Fetch agency data
        if (booking.agency) {
          try {
            const agencyResponse = await axios.get(`https://api.saer.pk/api/agencies/?organization_id=${organizationId}&id=${booking.agency}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            });
            const agency = agencyResponse.data.results?.find(agency => agency.id === booking.agency) || agencyResponse.data[0];
            setAgencyData(agency);
          } catch (agencyError) {
            console.error('Error fetching agency data:', agencyError);
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderNo]);

  const handleTransportChange = (index, field, value) => {
    const updatedList = [...transportList];
    updatedList[index][field] = value;
    setTransportList(updatedList);
  };

  const addTransport = () => {
    setTransportList([
      ...transportList,
      {
        transportType: "",
        transportSector: "",
        voucherNumber: "",
        selfTransport: false,
      },
    ]);
  };

  const [departureFlight, setDepartureFlight] = useState({
    airline: "Board(s)v1",
    flightNumber: "Board(s)v2",
    from: "Aid",
    to: "Subbar",
    departure: "12-06-2024 / 12:30",
    arrival: "02-07-2024 / 14:30",
  });

  const [returnFlight, setReturnFlight] = useState({
    airline: "Board(s)v1",
    flightNumber: "Board(s)v2",
    status: "Aid",
    from: "Due",
    to: "Subbar",
    departure: "02-07-2024 / 14:30",
    arrival: "02-07-2024 / 14:30",
  });

  const [withoutFlight, setWithoutFlight] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedOption, setSelectedOption] = useState("with full transport");

  const [passengers, setPassengers] = useState([
    {
      id: 1,
      title: "Mr.",
      firstName: "",
      lastName: "",
      passportNumber: "",
      nationality: "",
    },
  ]);

  const addPassenger = () => {
    const newPassenger = {
      id: passengers.length + 1,
      title: "Mr.",
      firstName: "",
      lastName: "",
      passportNumber: "",
      nationality: "",
    };
    setPassengers([...passengers, newPassenger]);
  };

  const updatePassengerField = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index][field] = value;
    setPassengers(updatedPassengers);
  };

  const removePassenger = (index) => {
    const updated = [...passengers];
    updated.splice(index, 1);
    setPassengers(updated);
  };

  const [formData, setFormData] = useState({
    orderNo: orderNo || "",
    voucherNo: "",
  });

  const [hotelList, setHotelList] = useState([
    {
      hotelName: "",
      checkIn: "",
      checkOut: "",
      roomType: "",
      specialRequest: "",
      bookingType: "",
      voucherNumber: "",
      paymentType: "",
    },
  ]);

  const handleHotelChange = (index, field, value) => {
    const updatedHotels = [...hotelList];
    updatedHotels[index][field] = value;
    setHotelList(updatedHotels);
  };

  const addHotel = () => {
    setHotelList([
      ...hotelList,
      {
        hotelName: "",
        checkIn: "",
        checkOut: "",
        roomType: "",
        specialRequest: "",
        bookingType: "",
        voucherNumber: "",
        paymentType: "",
      },
    ]);
  };

  const [addVisaPrice, setAddVisaPrice] = useState(false);
  const [longTermVisa, setLongTermVisa] = useState(false);
  const [oneSideTransport, setOneSideTransport] = useState(false);
  const [fullTransport, setFullTransport] = useState(false);
  const [onlyVisa, setOnlyVisa] = useState(false);
  const [food, setFood] = useState(false);
  const [meccaZiarat, setMeccaZiarat] = useState(false);
  const [medinaZiarat, setMedinaZiarat] = useState(false);
  const [approve, setApprove] = useState(false);
  const [draft, setDraft] = useState(false);
  const [selectedShirka, setSelectedShirka] = useState("Rushd al Majd");

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading hotel voucher data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <h4 className="alert-heading">Error Loading Data</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="alert alert-warning m-4" role="alert">
        <h4 className="alert-heading">No Data Found</h4>
        <p>No booking data found for order number: {orderNo}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="">
        {/* Header */}
        <div className="row align-items-center mb-4">
          <div className="col">
            <div className="d-flex align-items-center">
              <h5 className="fw-bold mb-0">
                Passengers Details For Hotel Booking
              </h5>
            </div>
          </div>
        </div>

        {/* Order Summary Table */}
        <div className="table-responsive mb-4">
          <table className="table table-sm text-center">
            <thead className="table-light">
              <tr>
                <th>Order No</th>
                <th>Agency Code</th>
                <th>Agreement Status</th>
                <th>Package No</th>
                <th>Total Pax</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{orderNo}</td>
                <td>{bookingData.agency || "N/A"}</td>
                <td>{agencyData?.agreement_status ? "Active" : "Inactive"}</td>
                <td>{bookingData.id}</td>
                <td>{bookingData.total_pax}</td>
                <td>PKR {bookingData.remaining_amount || 0}</td>
                <td>
                  <span className="text-info">{bookingData.status || "N/A"}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Order Info */}
        <div className="row mb-4">
          {/* Order No Select */}
          <div className="col-md-3">
            <label className="form-label">Order No</label>
            <select
              value={formData.orderNo}
              onChange={(e) =>
                setFormData({ ...formData, orderNo: e.target.value })
              }
              className="form-select"
            >
              <option value="">Select Order</option>
              <option value="MAKKAH">MAKKAH</option>
              <option value="MADINA">MADINA</option>
            </select>
          </div>

          {/* Voucher No Input */}
          <div className="col-md-3">
            <label className="form-label">
              Voucher No.
            </label>
            <input
              type="text"
              value={formData.voucherNo}
              onChange={(e) =>
                setFormData({ ...formData, voucherNo: e.target.value })
              }
              className="form-control rounded shadow-none px-1 py-2"
              required
              placeholder="1234567"
            />
          </div>
        </div>

        {/* Passengers Table */}
        {bookingData.person_details?.map((passenger, index) => (
          <div key={passenger.id} className="row mb-4">
            {/* Title (Mr/Mrs) */}
            <div className="col-md-2">
              <label className="form-label">Title</label>
              <select
                value={passenger.person_title || "Mr."}
                onChange={(e) =>
                  updatePassengerField(index, "title", e.target.value)
                }
                className="form-select"
              >
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Miss">Miss</option>
              </select>
            </div>

            {/* First Name */}
            <div className="col-md-2">
              <label className="form-label">
                First Name
              </label>
              <input
                type="text"
                value={passenger.first_name}
                onChange={(e) =>
                  updatePassengerField(index, "firstName", e.target.value)
                }
                className="form-control rounded shadow-none px-1 py-2"
                placeholder="First Name"
              />
            </div>

            {/* Last Name */}
            <div className="col-md-2">
              <label className="form-label">
                Last Name
              </label>
              <input
                type="text"
                value={passenger.last_name}
                onChange={(e) =>
                  updatePassengerField(index, "lastName", e.target.value)
                }
                className="form-control rounded shadow-none px-1 py-2"
                placeholder="Last Name"
              />
            </div>

            {/* Passport Number */}
            <div className="col-md-2">
              <label className="form-label">
                Passport No.
              </label>
              <input
                type="text"
                value={passenger.passport_number}
                onChange={(e) =>
                  updatePassengerField(
                    index,
                    "passportNumber",
                    e.target.value
                  )
                }
                className="form-control rounded shadow-none px-1 py-2"
                placeholder="Passport Number"
              />
            </div>

            {/* Nationality */}
            <div className="col-md-2">
              <label className="form-label">Pnr</label>
              <input
                type="text"
                value={passenger.country}
                onChange={(e) =>
                  updatePassengerField(index, "nationality", e.target.value)
                }
                className="form-control rounded shadow-none px-1 py-2"
                placeholder="Nationality"
              />
            </div>

            {/* Remove Button */}
            <div className="col-md-2 d-flex align-items-end">
              <button
                type="button"
                onClick={() => removePassenger(index)}
                className="btn btn-danger mb-3"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="d-flex justify-content-between mb-4">
          <button className="btn btn-primary" onClick={addPassenger}>
            Add Passenger
          </button>
        </div>

        {/* Hotel Details */}
        {bookingData.hotel_details?.map((hotelDetails, index) => (
          <div key={index} className="mb-4 mt-5">
            <h5 className="mb-0 fw-bold">Hotel Details {index + 1}</h5>
            <div className="row flex-wrap">
              {/* Hotel Name */}
              <div className="col-md-2">
                <div className="mb-3">
                  <label className="form-label">Hotel Name</label>
                  <select
                    className="form-select"
                    value={hotelDetails.hotel || ""}
                    onChange={(e) =>
                      handleHotelChange(index, "hotelName", e.target.value)
                    }
                  >
                    <option value="">Select Hotel</option>
                    <option value="MAKKAH">MAKKAH</option>
                    <option value="MADINA">MADINA</option>
                  </select>
                </div>
              </div>

              {/* Check In */}
              <div className="col-md-2">
                <div className="mb-3">
                  <label className="form-label">Check In</label>
                  <input
                    type="date"
                    className="form-control rounded shadow-none px-1 py-2"
                    value={hotelDetails.check_in_time}
                    onChange={(e) =>
                      handleHotelChange(index, "checkIn", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Check Out */}
              <div className="col-md-2">
                <div className="mb-3">
                  <label className="form-label">Check Out</label>
                  <input
                    type="date"
                    className="form-control rounded shadow-none px-1 py-2"
                    value={hotelDetails.check_out_time}
                    onChange={(e) =>
                      handleHotelChange(index, "checkOut", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Room Type */}
              <div className="col-md-2">
                <div className="mb-3">
                  <label className="form-label">Room Type</label>
                  <select
                    className="form-select"
                    value={hotelDetails.room_type}
                    onChange={(e) =>
                      handleHotelChange(index, "roomType", e.target.value)
                    }
                  >
                    <option value="">Select Room Type</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Triple">Triple</option>
                  </select>
                </div>
              </div>

              {/* Special Request */}
              <div className="col-md-2">
                <div className="mb-3">
                  <label className="form-label">Special Request</label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none px-1 py-2"
                    value={hotelList[index]?.specialRequest || ""}
                    onChange={(e) =>
                      handleHotelChange(index, "specialRequest", e.target.value)
                    }
                    placeholder="Haram View"
                  />
                </div>
              </div>

              {/* Sharing Type */}
              <div className="col-md-2">
                <div className="mb-3">
                  <label className="form-label">Sharing Type</label>
                  <select
                    className="form-select"
                    value={hotelList[index]?.bookingType || ""}
                    onChange={(e) =>
                      handleHotelChange(index, "bookingType", e.target.value)
                    }
                  >
                    <option value="">Select Sharing Type</option>
                    <option value="Sharing">Sharing</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>

              {/* Voucher Number */}
              <div className="col-md-2">
                <div className="mb-3">
                  <label className="form-label">Voucher Number</label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none px-1 py-2"
                    value={hotelList[index]?.voucherNumber || ""}
                    onChange={(e) =>
                      handleHotelChange(index, "voucherNumber", e.target.value)
                    }
                    placeholder="156305a"
                  />
                </div>
              </div>

              {/* No. of Nights */}
              <div className="col-md-2">
                <div className="mb-3">
                  <label className="form-label">No. of Nights</label>
                  <input
                    type="number"
                    className="form-control rounded shadow-none px-1 py-2"
                    value={hotelDetails.number_of_nights}
                    onChange={(e) =>
                      handleHotelChange(index, "paymentType", e.target.value)
                    }
                    placeholder="2"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-primary" onClick={addHotel}>
          Add Hotel
        </button>

        {/* Transport Details */}
        <div className="mb-4 mt-5">
          <div className="">
            <h5 className="mb-2 fw-bold">Transport Details</h5>
          </div>
          <div>
            {bookingData.transport_details?.map((transport, index) => (
              <div key={index} className="row mb-4">
                <h6 className="mb-3 fw-bold">Transport {index + 1}</h6>

                {/* Transport Type */}
                <div className="col-md-3 mb-3">
                  <label className="form-label">Transport Type</label>
                  <input
                    type="text"
                    className="form-control shadow-none px-1 py-2"
                    value={transport.vehicle_type}
                    onChange={(e) =>
                      handleTransportChange(
                        index,
                        "transportType",
                        e.target.value
                      )
                    }
                  />
                </div>

                {/* Transport Sector */}
                <div className="col-md-3 mb-3">
                  <label className="form-label">Transport Sector</label>
                  <input
                    type="text"
                    className="form-control shadow-none px-1 py-2"
                    value={transport.transport_sector}
                    onChange={(e) =>
                      handleTransportChange(
                        index,
                        "transportSector",
                        e.target.value
                      )
                    }
                  />
                </div>

                {/* Voucher Number */}
                <div className="col-md-2 mb-3">
                  <label className="form-label">Voucher Number</label>
                  <input
                    type="text"
                    className="form-control shadow-none px-1 py-2"
                    value={transportList[index]?.voucherNumber || ""}
                    onChange={(e) =>
                      handleTransportChange(
                        index,
                        "voucherNumber",
                        e.target.value
                      )
                    }
                  />
                </div>

                {/* Self Transport */}
                <div className="col-md-3 mb-3">
                  <div className="form-check mt-4 ms-2 ps-2 pt-1">
                    <input
                      className="form-check-input border border-black"
                      type="checkbox"
                      checked={transportList[index]?.selfTransport || false}
                      onChange={(e) =>
                        handleTransportChange(
                          index,
                          "selfTransport",
                          e.target.checked
                        )
                      }
                    />
                    <label className="form-check-label ms-2">
                      Enable Self Transport
                    </label>
                  </div>
                </div>
              </div>
            ))}
            <button className="btn btn-primary" onClick={addTransport}>
              Add Route
            </button>
          </div>
        </div>

        {/* Flight Details */}
        <div className="">
          <div className="row">
            <h4 className="fw-bold mb-3">Flight Details (Departure Flight)</h4>
            <div className="col-12 d-flex flex-wrap gap-4">
              {/* Airline */}
              <div className="mb-3">
                <label className="form-label">Airline Name or Code</label>
                <select
                  className="form-select shadow-none"
                  value={departureFlight.airline}
                  onChange={(e) =>
                    setDepartureFlight({ ...departureFlight, airline: e.target.value })
                  }
                >
                  <option value="">Select Airline</option>
                  <option value="Saudia(sv)">Saudia (SV)</option>
                </select>
              </div>

              {/* From Sector */}
              <div className="mb-3">
                <label className="form-label">From Sector</label>
                <select
                  className="form-select shadow-none"
                  value={departureFlight.from}
                  onChange={(e) =>
                    setDepartureFlight({ ...departureFlight, from: e.target.value })
                  }
                >
                  <option value="">Select Sector</option>
                  <option value="LHE">LHE</option>
                </select>
              </div>

              {/* Flight Number */}
              <div className="mb-3">
                <label className="form-label">Flight Number</label>
                <select
                  className="form-select shadow-none"
                  value={departureFlight.flightNumber}
                  onChange={(e) =>
                    setDepartureFlight({ ...departureFlight, flightNumber: e.target.value })
                  }
                >
                  <option value="">Select Flight</option>
                  <option value="SV722">SV722</option>
                </select>
              </div>

              {/* To Sector */}
              <div className="mb-3">
                <label className="form-label">To Sector</label>
                <select
                  className="form-select shadow-none"
                  value={departureFlight.to}
                  onChange={(e) =>
                    setDepartureFlight({ ...departureFlight, to: e.target.value })
                  }
                >
                  <option value="">Select Sector</option>
                  <option value="JED">JED</option>
                </select>
              </div>

              {/* Travel Date & Time */}
              <div className="mb-3">
                <label className="form-label">Travel Date and Time</label>
                <input
                  type="datetime-local"
                  className="form-control rounded shadow-none px-1 py-2"
                  value={departureFlight.departure}
                  onChange={(e) =>
                    setDepartureFlight({ ...departureFlight, departure: e.target.value })
                  }
                />
              </div>

              {/* Return Date & Time */}
              <div className="mb-3">
                <label className="form-label">Return Date and Time</label>
                <input
                  type="datetime-local"
                  className="form-control rounded shadow-none px-1 py-2"
                  value={departureFlight.arrival}
                  onChange={(e) =>
                    setDepartureFlight({ ...departureFlight, arrival: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="">
          <div className="row">
            <h4 className="fw-bold mb-3">Flight Details (Return Flight)</h4>
            <div className="col-12 d-flex flex-wrap gap-5">
              <div className="mb-3">
                <label className="form-label">Airline Name or Code</label>
                <select
                  className="form-select"
                  value={returnFlight.airline}
                  onChange={(e) =>
                    setReturnFlight({ ...returnFlight, airline: e.target.value })
                  }
                >
                  <option value="Saudia(sv)">Saudia(sv)</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">From Sector</label>
                <select
                  className="form-select"
                  value={returnFlight.from}
                  onChange={(e) =>
                    setReturnFlight({ ...returnFlight, from: e.target.value })
                  }
                >
                  <option value="Lhe">Lhe</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Flight Number</label>
                <select
                  className="form-select"
                  value={returnFlight.flightNumber}
                  onChange={(e) =>
                    setReturnFlight({ ...returnFlight, flightNumber: e.target.value })
                  }
                >
                  <option value="Saudia(sv)">Saudia(sv)</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">To Sector</label>
                <select
                  className="form-select"
                  value={returnFlight.to}
                  onChange={(e) =>
                    setReturnFlight({ ...returnFlight, to: e.target.value })
                  }
                >
                  <option value="Jed">Jed</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Travel Date And Time</label>
                <input
                  type="datetime-local"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  value={returnFlight.departure}
                  onChange={(e) =>
                    setReturnFlight({ ...returnFlight, departure: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Return Date And Time</label>
                <input
                  type="datetime-local"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  value={returnFlight.arrival}
                  onChange={(e) =>
                    setReturnFlight({ ...returnFlight, arrival: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="row">
              <div className="col-12 d-flex mt-3 flex-wrap align-items-center gap-3 mb-3">
                <p className="mb-0">or</p>
                <button className="btn btn-primary px-3 py-2">
                  Select Flight
                </button>
                <p className="mb-0">or</p>
                <div className="form-check d-flex align-items-center">
                  <input
                    className="form-check-input border border-black me-2"
                    type="checkbox"
                    id="Without Flight"
                    checked={withoutFlight}
                    onChange={(e) => setWithoutFlight(e.target.checked)}
                    style={{ width: "1.3rem", height: "1.3rem" }}
                  />
                  <label className="form-check-label" htmlFor="Without Flight">
                    Without Flight
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-5 bg-white">
        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input border border-black me-2"
            type="checkbox"
            id="addVisaPrice"
            checked={addVisaPrice}
            onChange={(e) => setAddVisaPrice(e.target.checked)}
            style={{ width: "1.3rem", height: "1.3rem" }}
          />
          <label className="form-check-label" htmlFor="addVisaPrice">
            Add visa price
          </label>
        </div>

        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input border border-black me-2"
            type="checkbox"
            id="longTermVisa"
            checked={longTermVisa}
            onChange={(e) => setLongTermVisa(e.target.checked)}
            style={{ width: "1.3rem", height: "1.3rem" }}
          />
          <label className="form-check-label" htmlFor="longTermVisa">
            Long term Visa
          </label>
        </div>

        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input border border-black me-2"
            type="checkbox"
            id="oneSideTransport"
            checked={oneSideTransport}
            onChange={(e) => setOneSideTransport(e.target.checked)}
            style={{ width: "1.3rem", height: "1.3rem" }}
          />
          <label className="form-check-label" htmlFor="oneSideTransport">
            with one side transport
          </label>
        </div>

        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input border border-black me-2"
            type="checkbox"
            id="fullTransport"
            checked={fullTransport}
            onChange={(e) => setFullTransport(e.target.checked)}
            style={{ width: "1.3rem", height: "1.3rem" }}
          />
          <label className="form-check-label" htmlFor="fullTransport">
            with full transport
          </label>
        </div>

        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input border border-black me-2"
            type="checkbox"
            id="onlyVisa"
            checked={onlyVisa}
            onChange={(e) => setOnlyVisa(e.target.checked)}
            style={{ width: "1.3rem", height: "1.3rem" }}
          />
          <label className="form-check-label" htmlFor="onlyVisa">
            Only Visa
          </label>
        </div>

        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input border border-black me-2"
            type="checkbox"
            id="food"
            checked={food}
            onChange={(e) => setFood(e.target.checked)}
            style={{ width: "1.3rem", height: "1.3rem" }}
          />
          <label className="form-check-label" htmlFor="food">
            FOOD
          </label>
        </div>

        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input border border-black me-2"
            type="checkbox"
            id="meccaZiarat"
            checked={meccaZiarat}
            onChange={(e) => setMeccaZiarat(e.target.checked)}
            style={{ width: "1.3rem", height: "1.3rem" }}
          />
          <label className="form-check-label" htmlFor="meccaZiarat">
            Mecca Ziarat
          </label>
        </div>

        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input border border-black me-2"
            type="checkbox"
            id="medinaZiarat"
            checked={medinaZiarat}
            onChange={(e) => setMedinaZiarat(e.target.checked)}
            style={{ width: "1.3rem", height: "1.3rem" }}
          />
          <label className="form-check-label" htmlFor="medinaZiarat">
            Medina Ziarat
          </label>
        </div>

        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input border border-black me-2"
            type="checkbox"
            id="approve"
            checked={approve}
            onChange={(e) => setApprove(e.target.checked)}
            style={{ width: "1.3rem", height: "1.3rem" }}
          />
          <label className="form-check-label" htmlFor="approve">
            APPROVE
          </label>
        </div>

        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input border border-black me-2"
            type="checkbox"
            id="draft"
            checked={draft}
            onChange={(e) => setDraft(e.target.checked)}
            style={{ width: "1.3rem", height: "1.3rem" }}
          />
          <label className="form-check-label" htmlFor="draft">
            DRAFT
          </label>
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-4 mt-5 bg-white">
        <h5 className="mb-0 fw-bold">Notes</h5>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">Notes</label>
            <textarea
              className="form-control"
              rows={1}
              placeholder="Enter Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
          <div className="col-md-3">
            <label className="form-label">Shirka</label>
            <select
              className="form-select"
              name="shirka"
              value={selectedShirka}
              onChange={(e) => setSelectedShirka(e.target.value)}
            >
              <option value="Rushd al Majd">Rushd al Majd</option>
              <option value="Other Option">Other Option</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex flex-wrap gap-2 bg-white">
        <button className="btn btn-primary">Save</button>
        <button className="btn btn-primary">Save & Close</button>
        <button className="btn btn-outline-secondary">Close Only</button>
      </div>
    </div>
  );
};

const TicketsInterface = ({ orderNo }) => {
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [showChild, setShowChild] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch booking data
        const bookingResponse = await fetch(`https://api.saer.pk/api/bookings/?organization_id&booking_number=${orderNo}`);
        if (!bookingResponse.ok) {
          throw new Error('Failed to fetch booking data');
        }
        const bookingData = await bookingResponse.json();

        // Assuming the API returns an array, take the first item that matches our order number
        const booking = Array.isArray(bookingData)
          ? bookingData.find(item => item.booking_number === orderNo)
          : bookingData;

        setBookingData(booking);

        if (booking && booking.agency) {
          // Fetch agency data
          const agencyResponse = await fetch(`https://api.saer.pk/api/agencies/?organization_id&id=${booking.agency}`);
          if (!agencyResponse.ok) {
            throw new Error('Failed to fetch agency data');
          }
          const agencyData = await agencyResponse.json();

          // Assuming the API returns an array, find the matching agency
          const agency = Array.isArray(agencyData)
            ? agencyData.find(item => item.id === booking.agency)
            : agencyData;

          setAgencyData(agency);
        }
      } catch (err) {
        setError(err.message);
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderNo) {
      fetchData();
    }
  }, [orderNo]);

  if (loading) {
    return <div className="text-center p-4">Loading booking data...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-danger">Error: {error}</div>;
  }

  if (!bookingData) {
    return <div className="text-center p-4">No booking data found for order #{orderNo}</div>;
  }

  // Extract ticket details if available
  const ticketDetails = bookingData.ticket_details && bookingData.ticket_details.length > 0
    ? bookingData.ticket_details[0]
    : null;

  // Extract trip details if available
  const tripDetails = ticketDetails && ticketDetails.trip_details && ticketDetails.trip_details.length > 0
    ? ticketDetails.trip_details[0]
    : null;

  // Extract stopover details if available
  const stopoverDetails = ticketDetails && ticketDetails.stopover_details && ticketDetails.stopover_details.length > 0
    ? ticketDetails.stopover_details[0]
    : null;

  // Format date and time functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date) ? 'Invalid Time' : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid Time';
    }
  };

  // Calculate fare based on age group
  const getFareForPerson = (person) => {
    if (!ticketDetails) return 'N/A';

    if (person.age_group === 'adult') {
      return ticketDetails.adult_price || 'N/A';
    } else if (person.age_group === 'child') {
      return ticketDetails.child_price || 'N/A';
    } else if (person.age_group === 'infant') {
      return ticketDetails.infant_price || 'N/A';
    }
    return 'N/A';
  };

  return (
    <div className="bg-white p-4">
      <h5 className="fw-bold mb-3">Passengers Details For Tickets</h5>

      {/* Order Summary Table */}
      <div className="table-responsive mb-4">
        <table className="table table-sm text-center">
          <thead className="table-light">
            <tr>
              <th>Order No</th>
              <th>Agency Code</th>
              <th>Agreement Status</th>
              <th>Package No</th>
              <th>Total Pax</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{orderNo}</td>
              <td>{agencyData ? agencyData.id : 'N/A'}</td>
              <td>{agencyData ? (agencyData.agreement_status ? 'Active' : 'Inactive') : 'N/A'}</td>
              <td>{bookingData.id}</td>
              <td>{bookingData.total_pax || 0}</td>
              <td>PKR {bookingData.remaining_amount || 0}</td>
              <td>
                <span className="text-info">{bookingData.status || 'N/A'}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ticket Details */}
      {ticketDetails ? (
        <div className="card mb-4">
          <div className="card-body">
            {/* Departure Header */}
            <div
              className="container p-4 rounded-4"
              style={{ background: "#E5F2FF" }}
            >
              <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mb-4">
                {/* Flight Route Section */}
                <div className="d-flex align-items-center gap-4 flex-wrap">
                  {/* Departure */}
                  {tripDetails && (
                    <>
                      <div className="text-center">
                        <h5 className="fw-bold">Depart</h5>
                        <h2 className="fw-bold">{formatTime(tripDetails.departure_date_time)}</h2>
                        <p className="mb-1">{formatDate(tripDetails.departure_date_time)}</p>
                        <p className="fw-bold">{tripDetails.departure_city || 'N/A'}</p>
                      </div>

                      {/* Stopover */}
                      {stopoverDetails && (
                        <div className="text-center">
                          <h6 className="mb-0">1st stop at</h6>
                          <p className="fw-bold">{stopoverDetails.stopover_city || 'N/A'}</p>
                        </div>
                      )}

                      {/* Arrival */}
                      <div className="text-center">
                        <h5 className="fw-bold">Arrive</h5>
                        <h2 className="fw-bold">{formatTime(tripDetails.arrival_date_time)}</h2>
                        <p className="mb-1">{formatDate(tripDetails.arrival_date_time)}</p>
                        <p className="fw-bold">{tripDetails.arrival_city || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
                <div
                  className="d-none d-sm-block"
                  style={{
                    borderLeft: "2px dashed rgba(0, 0, 0, 0.3)",
                    height: "140px",
                  }}
                ></div>

                {/* Status and Class Info */}
                <div className="d-flex flex-column flex-md-row gap-5 text-center">
                  <div>
                    <div>
                      <h6 className="fw-bold mb-1">{ticketDetails.status || 'N/A'}</h6>
                      <div className="small">Status</div>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">{ticketDetails.trip_type || 'N/A'}</h6>
                      <div className="small">Class</div>
                    </div>
                  </div>
                  <div>
                    <div>
                      <h6 className="fw-bold mb-1">{ticketDetails.pnr || 'N/A'}</h6>
                      <div className="small">PNR</div>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">{ticketDetails.weight || 'N/A'} KG</h6>
                      <div className="small">Baggage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Details Tables */}
            <div className="mb-4 mt-5">
              <h5 className="fw-bold mb-3">Passenger Details</h5>
              {bookingData.person_details && bookingData.person_details.length > 0 ? (
                bookingData.person_details.map((person, index) => (
                  <div key={person.id || index} className="table-responsive mb-4">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th className="fw-normal">Pax NO</th>
                          <th className="fw-normal">Traveler Name</th>
                          <th className="fw-normal">Agency PNR</th>
                          <th className="fw-normal">Fare</th>
                          <th className="fw-normal">Age Group</th>
                          <th className="fw-normal">Passport No</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-bold">
                            <strong>{(index + 1).toString().padStart(2, "0")}</strong>
                          </td>
                          <td className="fw-bold">{person.first_name || ''} {person.last_name || ''}</td>
                          <td className="fw-bold">{ticketDetails.pnr || 'N/A'}</td>
                          <td className="fw-bold">
                            Rs {getFareForPerson(person)}/-
                          </td>
                          <td className="text-capitalize">{person.age_group || 'N/A'}</td>
                          <td>{person.passport_number || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Additional passenger details */}
                    <div className="mt-2 p-3 bg-light rounded">
                      <div className="row">
                        <div className="col-md-6">
                          <strong>Date of Birth:</strong> {formatDate(person.date_of_birth)}
                        </div>
                        <div className="col-md-6">
                          <strong>Passport Expiry:</strong> {formatDate(person.passport_expiry_date)}
                        </div>
                        <div className="col-md-6 mt-2">
                          <strong>Country:</strong> {person.country || 'N/A'}
                        </div>
                        <div className="col-md-6 mt-2">
                          <strong>Visa Status:</strong> {person.visa_status || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="alert alert-warning">
                  No passenger details available for this booking.
                </div>
              )}
            </div>

            {/* Total Balance Section */}
            <div className="row mb-4">
              <div
                className="col-md-6 p-4 rounded-4"
                style={{ background: "#E5F2FF" }}
              >
                <h6 className="fw-bold mb-3">Total Balance</h6>

                <div className="d-flex justify-content-between mb-2">
                  <h6 className="mb-0 fw-bold">Sub Total:</h6>
                  <h6 className="mb-0">Rs {bookingData.total_amount || 0}/-</h6>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <h6 className="mb-0 fw-bold">Paid:</h6>
                  <h6 className="mb-0 text-primary">
                    Rs {(bookingData.total_amount - bookingData.remaining_amount) || 0}/-
                  </h6>
                </div>

                <div className="d-flex justify-content-between">
                  <h6 className="mb-0 fw-bold">Pending:</h6>
                  <h6 className="mb-0">Rs {bookingData.remaining_amount || 0}/-</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info">
          No ticket details available for this booking.
        </div>
      )}

      {/* Action Buttons */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button className="btn btn-primary">Confirm Ticket</button>
        <button
          className="btn btn-primary"
          onClick={() => setShowChild(true)}
        >
          Set Infant And Child Fare
        </button>
        <button className="btn btn-outline-secondary">Remove from order</button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => setShowRejectNote(true)}
        >
          Reject With Note
        </button>
        <button className="btn btn-outline-secondary">Close</button>
      </div>

      {/* Reject Note Modal */}
      {showRejectNote && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add Notes</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectNote(false)}
                ></button>
              </div>

              <div className="modal-body">
                <fieldset className="border rounded p-3 mb-4 bg-light position-relative">
                  <legend className="float-none w-auto px-2 fs-6 fw-bold mb-0">
                    Notes
                  </legend>
                  <div className="text-muted">
                    Call 92 world tour tomorrow and he will pay all the money
                  </div>
                  <div className="mt-2">
                    <strong>Date Reminder</strong>
                    <div className="text-muted">18/01/2025</div>
                  </div>
                  <div className="mt-2">
                    <strong>Employer name</strong>
                    <div className="text-muted">id/name</div>
                  </div>
                </fieldset>

                <fieldset className="border border-secondary p-2 rounded mb-4">
                  <legend className="float-none w-auto px-1 fs-6">
                    Notes
                  </legend>
                  <textarea
                    className="form-control shadow-none"
                    rows={4}
                    placeholder="Enter Notes"
                  ></textarea>
                </fieldset>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary">Reject Order</button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowRejectNote(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Child Modal */}
      {showChild && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Child and Infant Fare
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowChild(false)}
                ></button>
              </div>

              <div className="modal-body">
                <fieldset className="border border-secondary p-2 rounded mb-4">
                  <legend className="float-none w-auto px-1 fs-6">
                    Child Fare
                  </legend>
                  <input
                    className="form-control shadow-none"
                    placeholder="Enter Child Fare"
                    defaultValue={ticketDetails?.child_price || ''}
                  />
                </fieldset>
                <fieldset className="border border-secondary p-2 rounded mb-4">
                  <legend className="float-none w-auto px-1 fs-6">
                    Infant Fare
                  </legend>
                  <input
                    className="form-control shadow-none"
                    placeholder="Enter Infant Fare"
                    defaultValue={ticketDetails?.infant_price || ''}
                  />
                </fieldset>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary">Set</button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowChild(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VisaApplicationInterface = ({ onClose }) => {
  const { orderNo } = useParams();
  const [activeTab, setActiveTab] = useState("visa");
  const [selectedShirka, setSelectedShirka] = useState("Rushd al Majd");
  const [selectedPassengers, setSelectedPassengers] = useState([]);
  const [bookingData, setBookingData] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch booking data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");
        // Fetch booking data
        const bookingResponse = await axios.get(
          `https://api.saer.pk/api/bookings/`,
          {
            params: {
              booking_number: organizationId,
              organization: orderNo,
            },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(orderNo)

        // API already filter karega, so first result pick kar lo
        const booking = bookingResponse.data;

        console.log("Matched Booking:", booking);

        if (!booking) {
          throw new Error("Booking not found");
        }

        setBookingData(booking);


        setSelectedPassengers(new Array(booking.person_details?.length || 0).fill(false));

        // Fetch agency data
        if (booking.agency) {
          try {
            const agencyResponse = await axios.get(`https://api.saer.pk/api/agencies/?organization=${organizationId}&id=${booking.agency}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            });
            const agency = agencyResponse.data.results?.find(agency => agency.id === booking.agency) || agencyResponse.data[0];
            setAgencyData(agency);
          } catch (agencyError) {
            console.error('Error fetching agency data:', agencyError);
            // Continue without agency data
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderNo]);

  const handlePassengerSelection = (index) => {
    const newSelection = [...selectedPassengers];
    newSelection[index] = !newSelection[index];
    setSelectedPassengers(newSelection);
  };

  if (loading) {
    return (
      <div className="container-fluid p-0" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-2">Loading booking data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-0" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <div className="alert alert-danger m-4" role="alert">
          <h4 className="alert-heading">Error Loading Data</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="container-fluid p-0" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <div className="alert alert-warning m-4" role="alert">
          <h4 className="alert-heading">No Data Found</h4>
          <p>No booking data found for order number: {orderNo}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="bg-white shadow-sm p-4">
        {/* Header */}
        <div className="row align-items-center mb-4">
          <div className="col-auto">
            <Link
              to={'/order-delivery'}
              className="btn btn-link p-0 text-dark" >
              <ArrowLeft />
            </Link>
          </div>
          <div className="col">
            <div className="d-flex align-items-center">
              <strong className="text-muted me-2">Order Number</strong>
              <span>({orderNo})</span>
            </div>
          </div>
          <div className="col-auto">
            <div className="row g-2">
              <div className="d-flex flex-column">
                <div className="me-3 fw-bold">Agent Name:</div>
                <div className="">{agencyData?.name || "N/A"}</div>
              </div>
              <div className="d-flex flex-wrap">
                <div className="mt-1 me-3">
                  <div className="me-3 fw-bold">Agency Name:</div>
                  <div className="">{agencyData?.ageny_name || "N/A"}</div>
                </div>
                <div className="mt-1 me-3">
                  <div className="me-3 fw-bold">Contact:</div>
                  <div className="">{agencyData?.phone_number || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-auto">
            <div className="d-flex flex-column gap-2">
              {/* Visa */}
              <div className="d-flex justify-content-end align-items-center">
                <span className="small fw-bold">Visa:</span>
                <div
                  className="text-white rounded-5 px-2 py-1"
                  style={{ background: "#43ABFF", minWidth: "100px" }}
                >
                  {bookingData.total_visa_amount > 0 ? "Included" : "N/A"}
                </div>
              </div>

              {/* Hotel Voucher */}
              <div className="d-flex justify-content-end align-items-center">
                <span className="small fw-bold">Hotel Voucher:</span>
                <div
                  className="text-white rounded-5 px-2 py-1"
                  style={{ background: "#43ABFF", minWidth: "100px" }}
                >
                  {bookingData.total_hotel_amount > 0 ? "Included" : "N/A"}
                </div>
              </div>

              {/* Transport */}
              <div className="d-flex justify-content-end align-items-center">
                <span className="small fw-bold">Transport:</span>
                <div
                  className="text-white rounded-5 px-2 py-1"
                  style={{ background: "#43ABFF", minWidth: "100px" }}
                >
                  {bookingData.total_transport_amount > 0 ? "Included" : "N/A"}
                </div>
              </div>

              {/* Tickets */}
              <div className="d-flex justify-content-end align-items-center">
                <span className="small fw-bold">Tickets:</span>
                <div
                  className="text-white rounded-5 px-2 py-1"
                  style={{ background: "#43ABFF", minWidth: "100px" }}
                >
                  {bookingData.total_ticket_amount > 0 ? "Included" : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 d-flex justify-content-between">
          <div className="d-flex gap-2">
            <button
              className={`btn ${activeTab === "visa" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setActiveTab("visa")}
            >
              Visa
            </button>
            <button
              className={`btn ${activeTab === "hotel" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setActiveTab("hotel")}
            >
              Hotel Voucher
            </button>
            <button
              className={`btn ${activeTab === "tickets" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setActiveTab("tickets")}
            >
              Tickets
            </button>
          </div>
          {/* Action Buttons */}
          <div className="row align-items-center">
            <div className="col-auto">
              <button className="btn btn-primary me-2">Print</button>
              <button className="btn btn-outline-primary me-2">Download</button>
              <button className="btn btn-info text-white">See Invoice</button>
            </div>
          </div>
        </div>

        {activeTab === "visa" && (
          <>
            {/* Order Summary Table */}
            <div className="table-responsive mb-4">
              <table className="table table-sm text-center">
                <thead className="table-light">
                  <tr>
                    <th>Order No</th>
                    <th>Agency Code</th>
                    <th>Agreement Status</th>
                    <th>Package No</th>
                    <th>Total Pax</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{orderNo}</td>
                    <td>{bookingData?.agency || "N/A"}</td>
                    <td>{agencyData?.agreement_status ? "Active" : "Inactive"}</td>
                    <td>{bookingData.id}</td>
                    <td>{bookingData.total_pax}</td>
                    <td>PKR {bookingData.remaining_amount || 0}</td>
                    <td>
                      <span className="text-info">{bookingData.status || "N/A"}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Select Umrah Visa Shirka */}
            <div className="row mb-4">
              <h5 className="fw-bold mb-3">Select Umrah Visa Shirka</h5>
              {bookingData.person_details?.map((passenger, index) => (
                <div className="col-md-3" key={index}>
                  <label htmlFor="" className="form-label">Shirka</label>
                  <select
                    className="form-select shadow-none"
                    name="shirka"
                    value={selectedShirka}
                    onChange={(e) => setSelectedShirka(e.target.value)}
                  >
                    <option value={passenger.shirka}>{passenger.shirka}</option>
                  </select>
                </div>
              ))}
            </div>

            {/* Passengers Details */}
            <div className="mb-4">
              <h5 className="fw-bold mb-3">Passengers Details For Umrah Package</h5>

              <div className="table-responsive">
                <table className="table table-hover">
                  <tbody>
                    {bookingData.person_details?.map((passenger, index) => (
                      <tr key={passenger.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedPassengers[index]}
                            onChange={() => handlePassengerSelection(index)}
                          />
                        </td>
                        <td>
                          <span className="fw-bold">Pax No. {index + 1}</span>
                        </td>
                        <td>
                          <div>
                            <div className="small text-muted">Type</div>
                            <div className="fw-bold">{passenger.age_group || "Adult"}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="small text-muted">Bed</div>
                            <div className="fw-bold">Yes</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="small text-muted">Passenger Name</div>
                            <div className="fw-bold">{passenger.first_name} {passenger.last_name}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="small text-muted">Passport Number</div>
                            <div className="fw-bold">{passenger.passport_number || "N/A"}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="small text-muted">Passport Expiry</div>
                            <div className="fw-bold">{passenger.passport_expiry_date || "N/A"}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="small text-muted">Status</div>
                            <div className={`fw-bold ${passenger.visa_status === "Approved" ? "text-success" : passenger.visa_status === "Rejected" ? "text-danger" : "text-info"}`}>
                              {passenger.visa_status || "Pending"}
                            </div>
                          </div>
                        </td>
                        <td>
                          {passenger.visa_status === "Approved" ? (
                            <button className="btn btn-primary btn-sm">
                              Download Passport
                            </button>
                          ) : passenger.visa_status === "Rejected" ? (
                            <span className="text-danger fw-bold">
                              Not Included
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-primary">Visa Applied</button>
              <button className="btn btn-primary">Send to Embassy</button>
              <button className="btn btn-primary">Visa approved</button>
              <button className="btn btn-outline-secondary">
                Application Reject
              </button>
            </div>
          </>
        )}
        {activeTab === "hotel" && (
          <HotelVoucherInterface onClose={onClose} orderNo={orderNo} />
        )}

        {activeTab === "tickets" && <TicketsInterface orderNo={orderNo} />}
      </div>
    </div>
  );
};

const OrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("paid");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Umrah Package");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status options for dropdown
  const statusOptions = ["all", "un-approve", "under-process", "delivered", "confirm", "cancelled"];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");

        const response = await axios.get(`https://api.saer.pk/api/bookings/?organization=${organizationId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        });
        setOrders(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch orders. Please try again later.");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, paymentFilter, searchTerm, activeTab]);

  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // For order link navigation based on activeTab and payment status
  const handleOrderClick = (order) => {
    // Don't navigate if order is unpaid
    if (!order.is_paid) {
      return;
    }

    if (order.status === "under-process") {
      navigate(`/order-delivery/visa/${order.booking_number}`);
    } else if (activeTab === "Umrah Package" && order.category === "Package") {
      navigate(`/order-delivery/${order.booking_number}`);
    } else if (activeTab === "Ticketing" && order.category === "Ticket_Booking") {
      navigate(`/order-delivery/ticketing/${order.booking_number}`);
    }
  };

  // Filter orders based on active tab, payment status, and other filters
  const filteredOrders = orders.filter((order) => {
    // Filter by tab (category)
    const matchesTab =
      (activeTab === "Umrah Package" && order.category === "Package") ||
      (activeTab === "Ticketing" && order.category === "Ticket_Booking");

    // Filter by payment status
    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && order.is_paid) ||
      (paymentFilter === "unpaid" && !order.is_paid);

    // Filter by status
    const matchesStatus =
      statusFilter === "all" ||
      (order.status && order.status.toLowerCase().includes(statusFilter.toLowerCase()));

    // Filter by search term (booking number)
    const matchesSearch =
      searchTerm === "" ||
      (order.booking_number && order.booking_number.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTab && matchesPayment && matchesStatus && matchesSearch;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="px-3 px-lg-4 my-3">
        <div className="bg-white rounded shadow-sm p-4 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 px-lg-4 my-3">
        <div className="bg-white rounded shadow-sm p-4 text-center text-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-3 px-lg-4 my-3">
        <div className="d-flex gap-4 mb-3">
          <Link
            className={`text-decoration-none ${paymentFilter === "paid" ? "text-primary" : "text-secondary"}`}
            onClick={() => setPaymentFilter("paid")}
          >
            Paid Orders
          </Link>
          <Link
            className={`text-decoration-none ${paymentFilter === "unpaid" ? "text-primary" : "text-secondary"}`}
            onClick={() => setPaymentFilter("unpaid")}
          >
            Un-paid Orders
          </Link>
        </div>
        <div className="bg-white rounded shadow-sm p-4">
          {/* Payment Status Filter Tabs */}
          <div className="mb-4">
            <div className="d-flex gap-2">
              <button
                className={`btn ${activeTab === "Umrah Package" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => handleTabChange("Umrah Package")}
              >
                Umrah Package
              </button>

              <button
                className={`btn ${activeTab === "Ticketing" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => handleTabChange("Ticketing")}
              >
                Ticketing
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div className="d-flex gap-2 flex-wrap">
              {/* Show dropdown filters only for unpaid orders */}
              {paymentFilter === "unpaid" ? (
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary">
                    <Funnel size={16} className="me-1" />
                    Filters
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {statusOptions.map((status, idx) => (
                      <Dropdown.Item
                        key={idx}
                        onClick={() => setStatusFilter(status)}
                        active={statusFilter === status}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                // Show regular button filters for paid orders
                <>
                  <button
                    className={`btn ${statusFilter === "all"
                      ? "btn-outline-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`btn ${statusFilter === "un-approve"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("un-approve")}
                  >
                    Un Approved
                  </button>
                  <button
                    className={`btn ${statusFilter === "under-process"
                      ? "btn-outline-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("under-process")}
                  >
                    Under-Process
                  </button>
                  <button
                    className={`btn ${statusFilter === "delivered"
                      ? "btn-outline-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("delivered")}
                  >
                    Delivered
                  </button>
                  <button
                    className={`btn ${statusFilter === "confirm"
                      ? "btn-outline-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("confirm")}
                  >
                    Confirm Orders
                  </button>
                  <button
                    className={`btn ${statusFilter === "cancelled"
                      ? "btn-outline-primary"
                      : "btn-outline-secondary"
                      }`}
                    onClick={() => setStatusFilter("cancelled")}
                  >
                    Cancelled
                  </button>
                </>
              )}
            </div>

            <div className="input-group" style={{ width: "250px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Order Number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="input-group-text">
                <Search size={16} />
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Order No</th>
                  <th>Agency Code</th>
                  <th>Agreement</th>
                  <th>Package No</th>
                  <th>Passport</th>
                  <th>Total Pax</th>
                  <th>Status</th>
                  <th>Payment</th>
                  {/* Add Action column for unpaid orders */}
                  {paymentFilter === "unpaid" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((order, index) => (
                    <tr key={index}>
                      <td>
                        <button
                          className={`btn btn-link p-0 text-decoration-underline ${order.is_paid ? 'text-primary' : 'text-muted'}`}
                          onClick={() => handleOrderClick(order)}
                          disabled={!order.is_paid}
                          title={!order.is_paid ? "Cannot open unpaid orders" : ""}
                        >
                          {order.booking_number}
                        </button>
                      </td>
                      <td>{order.agency || 'N/A'}</td>
                      <td>{order.agreement || 'N/A'}</td>
                      <td>{order.packageNo || 'N/A'}</td>
                      <td>
                        <span className="text-decoration-none">
                          Download
                        </span>
                      </td>
                      <td>{order.total_pax}</td>
                      <td>{order.status || 'N/A'}</td>
                      <td>
                        <span className={`badge ${order.is_paid ? 'bg-success' : 'bg-warning'}`}>
                          {order.is_paid ? 'paid' : 'unpaid'}
                        </span>
                      </td>
                      {/* Add Action column with dropdown for unpaid orders */}
                      {paymentFilter === "unpaid" && (
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle
                              variant="link"
                              className="text-decoration-none p-0"
                            >
                              <Gear size={18} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item className="text-primary">
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Item className="text-success">
                                Add Notes
                              </Dropdown.Item>
                              <Dropdown.Item className="text-danger">
                                Call done
                              </Dropdown.Item>
                              <Dropdown.Item>Cancel</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={paymentFilter === "unpaid" ? 9 : 8} className="text-center py-4">
                      No orders found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredOrders.length > itemsPerPage && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} entries
              </div>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                      <ChevronLeft size={14} />
                    </button>
                  </li>

                  {[...Array(totalPages)].map((_, i) => {
                    const pageNumber = i + 1;
                    // Show limited page numbers with ellipsis
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <li key={i} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => paginate(pageNumber)}>
                            {pageNumber}
                          </button>
                        </li>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <li key={i} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }
                    return null;
                  })}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                      <ChevronRight size={14} />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const OrderDeliverySystem = () => {
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

            <Routes>
              <Route index element={<OrderList />} />
              <Route path=":orderNo" element={<TravelBookingInvoice />} />
              <Route path="ticketing/:orderNo" element={<TravelBookingInvoice />} />
              <Route path="visa/:orderNo" element={<VisaApplicationInterface onClose={() => navigate("/order-delivery")} />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDeliverySystem;
