import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import travel from "../../assets/travel.png";
import axios from "axios";


const OrderDeliveryDetailInvoice = () => {
  const navigate = useNavigate();
  const { orderNo } = useParams();
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [showChild, setShowChild] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderNo) {
      fetchData(orderNo);
    }
  }, [orderNo]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");
        // Fetch booking data
        const bookingResponse = await axios.get(`http://127.0.0.1:8000/api/bookings/?organization_id=${organizationId}&booking_number=${orderNo}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        });
        if (!bookingResponse.ok) {
          throw new Error('Failed to fetch booking data');
        }
        const bookingData = bookingResponse.data;

        // Assuming the API returns an array, take the first item that matches our order number
        const booking = Array.isArray(bookingData)
          ? bookingData.find(item => item.booking_number === orderNo)
          : bookingData;

        setBookingData(booking);

        if (booking && booking.agency) {
          // Fetch agency data
          const agencyResponse = await fetch(`http://127.0.0.1:8000/api/agencies/?organization_id&id=${booking.agency}`);
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

export default OrderDeliveryDetailInvoice;
