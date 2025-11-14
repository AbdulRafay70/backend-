import React, { useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
// import { Link, useLocation } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { CloudUpload, Search, Utensils } from "lucide-react";
import { Bag } from "react-bootstrap-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";

const BookingReview = () => {
  const [currentStep] = useState(2);
  const [showModal, setShowModal] = useState(false);
  const [currentPassport, setCurrentPassport] = useState(null);
  const { state } = useLocation();

  const navigate = useNavigate();

  const handleBackToEdit = () => {
    navigate(`/packages/custom-umrah/detail/${state.id}`, {
      state: {
        packageData: state.packageData,
        passengers: state.passengers || [],
        totalPrice: state.totalPrice || 0,
        cities: state.cities || [],
        id: state.id
      }
    });
  };

  // Use passed data or fallback to defaults
  const packageData = state?.packageData || {
    hotel_details: [],
    ticket_details: [],
    transport_details: [],
    total_adaults: 0,
    total_children: 0,
    total_infants: 0,
  };

  const passengers = state?.passengers || [];
  const totalPrice = state?.totalPrice || 0;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleShowPassport = (passportFile) => {
    setCurrentPassport(passportFile);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentPassport(null);
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

              {/* Package Details Card */}
              <div className="card mb-4">
                <div className="card-body" style={{ background: "#F2F9FF" }}>
                  <div className="row">
                    <div className="col-md-8">
                      <h4 className="mb-3 fw-bold">Custom Umrah Package</h4>

                      {/* Hotel Details */}
                      <div className="mb-2">
                        <strong>Hotels:</strong>
                        {packageData.hotel_details.map((hotel, index) => (
                          <div key={index} className="small text-muted">
                            {hotel.number_of_nights} Nights at {hotel.hotel_info?.name} ({hotel.room_type}) -
                            Check-in: {formatDate(hotel.check_in_time)},
                            Check-out: {formatDate(hotel.check_out_time)}
                          </div>
                        ))}
                      </div>

                      {/* Visa Details */}
                      <div className="mb-2">
                        <strong>Visa:</strong>
                        <div className="small text-muted">
                          Adults: {packageData.total_adaults} |
                          Children: {packageData.total_children} |
                          Infants: {packageData.total_infants}
                        </div>
                      </div>

                      {/* Transport Details */}
                      <div className="mb-2">
                        <strong>Transport:</strong>
                        {packageData.transport_details.map((transport, index) => (
                          <div key={index} className="small text-muted">
                            {transport.vehicle_type} -
                            Adult: SAR {transport.transport_sector_info?.adault_price} |
                            Child: SAR {transport.transport_sector_info?.child_price} |
                            Infant: SAR {transport.transport_sector_info?.infant_price}
                          </div>
                        ))}
                      </div>

                      {/* Flight Details */}
                      <div className="mb-2">
                        <strong>Flight:</strong>
                        {packageData.ticket_details.map((ticket, index) => (
                          <React.Fragment key={index}>
                            {ticket.ticket_info?.trip_details?.map((trip, tripIndex) => (
                              <div key={tripIndex} className="small text-muted">
                                {trip.trip_type === "Departure" ? "Travel Date" : "Return Date"}: {trip.departure_city} to {trip.arrival_city} -
                                {formatDate(trip.departure_date_time)} to {formatDate(trip.arrival_date_time)}
                              </div>
                            ))}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <h4 className="mb-3">Prices Summary</h4>

                      {/* Hotel Prices */}
                      <div className="mb-2">
                        <div className="small text-muted">Hotel Prices:</div>
                        {packageData.hotel_details.map((hotel, index) => (
                          <div key={index} className="small">
                            {hotel.hotel_info?.name} ({hotel.room_type}): SAR {hotel.price} for {hotel.number_of_nights} nights
                          </div>
                        ))}
                      </div>

                      {/* Transport Prices */}
                      <div className="mb-2">
                        <div className="small text-muted">Transport:</div>
                        <div className="small">
                          SAR {packageData.transport_details[0]?.transport_sector_info?.adault_price}/Adult |
                          SAR {packageData.transport_details[0]?.transport_sector_info?.child_price}/Child |
                          SAR {packageData.transport_details[0]?.transport_sector_info?.infant_price}/Infant
                        </div>
                      </div>

                      {/* Flight Prices */}
                      <div className="mb-2">
                        <div className="small text-muted">Flight:</div>
                        <div className="small">
                          SAR {packageData.ticket_details[0]?.ticket_info?.adult_price}/Adult |
                          SAR {packageData.ticket_details[0]?.ticket_info?.child_price}/Child |
                          SAR {packageData.ticket_details[0]?.ticket_info?.infant_price}/Infant
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className="mt-3 pt-2 border-top">
                        <h5 className="fw-bold">Total Price: SAR {totalPrice.toFixed(2)}</h5>
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
                        <th>Passport Expiry</th>
                        <th>Country</th>
                        <th>Passport Copy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((passenger, index) => (
                        <tr key={index}>
                          <td>{passenger.type}</td>
                          <td>{passenger.title}</td>
                          <td>{passenger.name}</td>
                          <td>{passenger.lName}</td>
                          <td>{passenger.passportNumber}</td>
                          <td>{formatDate(passenger.passportExpiry)}</td>
                          <td>{passenger.country}</td>
                          <td>
                            {passenger.passportFile ? (
                              <Button
                                variant="link"
                                onClick={() => handleShowPassport(passenger.passportFile)}
                                className="p-0"
                              >
                                View Passport
                              </Button>
                            ) : (
                              "Not Provided"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Passport View Modal */}
              <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Passport Copy</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                  {currentPassport ? (
                    typeof currentPassport === "string" ? (
                      // If it's a URL string
                      <img
                        src={currentPassport}
                        alt="Passport"
                        style={{ maxWidth: "100%", maxHeight: "70vh" }}
                      />
                    ) : (
                      // If it's a File object
                      <img
                        src={URL.createObjectURL(currentPassport)}
                        alt="Passport"
                        style={{ maxWidth: "100%", maxHeight: "70vh" }}
                      />
                    )
                  ) : (
                    <div>No passport image available</div>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-3">
                <button
                  onClick={handleBackToEdit}
                  className="btn btn-secondary px-4"
                >
                  Back To Edit
                </button>
                <Link
                  to="/packages/custom-umrah/pay"
                  className="btn px-4"
                  id="btn"
                  state={state} // Pass the same state forward
                >
                  Make Booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingReview;