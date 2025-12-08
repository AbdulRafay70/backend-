import React from "react";
import { Modal, Button, Table, Badge, Row, Col } from "react-bootstrap";

const demoPaxDetails = {
  PAX001: {
    pax_id: "PAX001",
    first_name: "Ali",
    last_name: "Raza",
    passport_no: "AB123456",
    family_no: "FAM-20",
    booking_id: "BKG-101",
    package_type: "Umrah",
    flight: { departure: "LHE", arrival: "JED", flight_time: "2025-10-17 15:30" },
    hotel: [{ name: "Hilton Makkah", check_in: "2025-10-17", check_out: "2025-10-20" }],
    transport: [{ pickup: "Airport", drop: "Hotel", status: "completed" }],
    ziyarats: [{ location: "Uhud", status: "completed" }],
    food: [{ meal_type: "Dinner", status: "served" }],
  },
  PAX002: {
    pax_id: "PAX002",
    first_name: "Sara",
    last_name: "Ali",
    passport_no: "CD987654",
    family_no: "FAM-21",
    booking_id: "BKG-102",
    package_type: "Umrah",
    flight: { departure: "KHI", arrival: "JED", flight_time: "2025-10-17 10:00" },
    hotel: [{ name: "Makkah Grand", check_in: "2025-10-17", check_out: "2025-10-19" }],
    transport: [],
    ziyarats: [],
    food: [],
  },
  PAX003: {
    pax_id: "PAX003",
    first_name: "Omar",
    last_name: "Khan",
    passport_no: "EF456789",
    family_no: "FAM-22",
    booking_id: "BKG-103",
    package_type: "Umrah",
    flight: { departure: "ISB", arrival: "JED", flight_time: "2025-10-17 12:00" },
    hotel: [{ name: "Makkah Tower", check_in: "2025-10-17", check_out: "2025-10-22" }],
    transport: [{ pickup: "Airport", drop: "Hotel", status: "pending" }],
    ziyarats: [{ location: "Cave Hira", status: "pending" }],
    food: [{ meal_type: "Lunch", status: "pending" }],
  },
};

const statusVariant = (status) => {
  if (!status) return "secondary";
  const s = status.toLowerCase();
  if (s.includes("pending") || s.includes("waiting")) return "warning";
  if (s.includes("checked_in") || s.includes("arrived") || s.includes("served") || s.includes("started") || s.includes("departed") || s.includes("completed")) return "success";
  if (s.includes("checked_out")) return "primary";
  if (s.includes("canceled") || s.includes("not_picked")) return "danger";
  return "secondary";
};

// Export function to get pax details
export const getPaxDetails = (paxId) => {
  return demoPaxDetails[paxId] || {
    pax_id: paxId,
    first_name: "Unknown",
    last_name: "",
    booking_id: "",
    passport_no: "",
    hotel: [],
    transport: [],
    ziyarats: [],
    food: [],
  };
};

const PaxDetailsModal = ({ show, onHide, paxDetails }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Pax Details {paxDetails ? `— ${paxDetails.first_name} ${paxDetails.last_name}` : ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {paxDetails ? (
          <div>
            <Row className="mb-3">
              <Col md={6}>
                <h6>Personal</h6>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Pax ID</strong></td>
                      <td>{paxDetails.pax_id}</td>
                    </tr>
                    <tr>
                      <td><strong>Name</strong></td>
                      <td>{paxDetails.first_name} {paxDetails.last_name}</td>
                    </tr>
                    <tr>
                      <td><strong>Passport</strong></td>
                      <td>{paxDetails.passport_no}</td>
                    </tr>
                    <tr>
                      <td><strong>Family No</strong></td>
                      <td>{paxDetails.family_no}</td>
                    </tr>
                    <tr>
                      <td><strong>Booking</strong></td>
                      <td>{paxDetails.booking_id}</td>
                    </tr>
                    <tr>
                      <td><strong>Package</strong></td>
                      <td>{paxDetails.package_type}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6>Flight</h6>
                {paxDetails.flight ? (
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Departure</strong></td>
                        <td>{paxDetails.flight.departure}</td>
                      </tr>
                      <tr>
                        <td><strong>Arrival</strong></td>
                        <td>{paxDetails.flight.arrival}</td>
                      </tr>
                      <tr>
                        <td><strong>Time</strong></td>
                        <td>{paxDetails.flight.flight_time}</td>
                      </tr>
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-muted">No flight info</div>
                )}
              </Col>
            </Row>

            <Row>
              <Col md={6} className="mb-3">
                <h6>Hotel</h6>
                {(paxDetails.hotel || []).length > 0 ? (
                  (paxDetails.hotel || []).map((h, i) => (
                    <div key={i} className="border rounded p-2 mb-2">
                      <div><strong>{h.name}</strong></div>
                      <div>Check In: {h.check_in} — Check Out: {h.check_out}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted">No hotel bookings</div>
                )}
              </Col>
              <Col md={6} className="mb-3">
                <h6>Transport</h6>
                {(paxDetails.transport || []).length > 0 ? (
                  (paxDetails.transport || []).map((t, i) => (
                    <div key={i} className="border rounded p-2 mb-2">
                      <div>{t.pickup} → {t.drop}</div>
                      <div>
                        <Badge bg={statusVariant(t.status)} className="text-capitalize">
                          {t.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted">No transport bookings</div>
                )}
              </Col>
            </Row>

            <Row>
              <Col md={6} className="mb-3">
                <h6>Ziyarats</h6>
                {(paxDetails.ziyarats || []).length > 0 ? (
                  (paxDetails.ziyarats || []).map((z, i) => (
                    <div key={i} className="border rounded p-2 mb-2">
                      <div>{z.location}</div>
                      <div>
                        <Badge bg={statusVariant(z.status)} className="text-capitalize">
                          {z.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted">No ziyarat bookings</div>
                )}
              </Col>
              <Col md={6} className="mb-3">
                <h6>Food</h6>
                {(paxDetails.food || []).length > 0 ? (
                  (paxDetails.food || []).map((f, i) => (
                    <div key={i} className="border rounded p-2 mb-2">
                      <div>{f.meal_type} — {f.status}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted">No food bookings</div>
                )}
              </Col>
            </Row>
          </div>
        ) : (
          <div className="text-muted">No details available</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaxDetailsModal;
