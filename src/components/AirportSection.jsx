import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Row, Col } from "react-bootstrap";
import { Plane, Edit3, Trash2 } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";

const demoAirportData = {
  date: "2025-10-17",
  airport_transfers: [
    {
      booking_id: "BKG-103",
      transfer_type: "pickup",
      flight_number: "SV802",
      flight_time: "15:30",
      pickup_point: "Jeddah Airport",
      drop_point: "Makkah Hotel",
      status: "waiting",
      pax_list: [
        { pax_id: "PAX003", first_name: "Omar", last_name: "Khan", contact: "+923009876543" },
      ],
    },
  ],
};

const AirportSection = () => {
  const [airportData, setAirportData] = useState(null);
  const [search, setSearch] = useState("");
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);

  useEffect(() => {
    setAirportData(demoAirportData);
  }, []);

  const fetchPaxDetails = (paxId) => {
    const details = getPaxDetails(paxId);
    setPaxDetails(details);
    setPaxModalOpen(true);
  };

  const statusVariant = (status) => {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s.includes("waiting")) return "warning";
    if (s.includes("departed")) return "info";
    if (s.includes("arrived")) return "success";
    if (s.includes("not_picked")) return "danger";
    return "secondary";
  };

  const matchesSearch = (text) => {
    if (!search) return true;
    return (text || "").toString().toLowerCase().includes(search.toLowerCase());
  };

  const handleStatusUpdate = (bookingId, paxId, status) => {
    setAirportData((prev) => ({
      ...prev,
      airport_transfers: prev.airport_transfers.map((a) => a.booking_id === bookingId ? ({ ...a, pax_list: a.pax_list.map(p => p.pax_id === paxId ? ({ ...p, status }) : p) }) : a)
    }));
  };

  return (
    <div>
      <h5 className="mb-3"><Plane size={18} className="me-2" />Airport Transfers</h5>
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control placeholder="Search by booking id, flight..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </Col>
      </Row>

      <Table hover responsive size="sm" className="align-middle">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Transfer Type</th>
            <th>Flight</th>
            <th>Flight Time</th>
            <th>Pickup</th>
            <th>Drop</th>
            <th>Status</th>
            <th>Pax</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(airportData?.airport_transfers || []).filter(a => (
            matchesSearch(a.booking_id) || matchesSearch(a.flight_number) || matchesSearch(a.pickup_point) || matchesSearch(a.drop_point) || (a.pax_list||[]).some(p => matchesSearch(p.first_name) || matchesSearch(p.last_name))
          )).map((a, i) => (
            <tr key={i}>
              <td>{a.booking_id}</td>
              <td>{a.transfer_type}</td>
              <td>{a.flight_number}</td>
              <td>{a.flight_time}</td>
              <td>{a.pickup_point}</td>
              <td>{a.drop_point}</td>
              <td><Badge bg={statusVariant(a.status)} className="text-capitalize">{a.status}</Badge></td>
              <td>
                {(a.pax_list || []).map((p) => (
                  <div key={p.pax_id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); fetchPaxDetails(p.pax_id); }} style={{ textDecoration: "none" }}>
                      {p.first_name} {p.last_name}
                    </a>
                    <Form.Select size="sm" style={{ width: 140 }} defaultValue={a.status} onChange={(e) => handleStatusUpdate(a.booking_id, p.pax_id, e.target.value)}>
                      <option value="waiting">waiting</option>
                      <option value="departed">departed</option>
                      <option value="arrived">arrived</option>
                      <option value="not_picked">not_picked</option>
                    </Form.Select>
                  </div>
                ))}
              </td>
              <td>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-secondary"><Edit3 size={14} /></Button>
                  <Button size="sm" variant="outline-danger"><Trash2 size={14} /></Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <PaxDetailsModal 
        show={paxModalOpen} 
        onHide={() => setPaxModalOpen(false)} 
        paxDetails={paxDetails} 
      />
    </div>
  );
};

export default AirportSection;
