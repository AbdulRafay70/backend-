import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Row, Col } from "react-bootstrap";
import { MapPin, Edit3, Trash2 } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";

const demoZiyaratData = {
  date: "2025-10-17",
  ziyarats: [
    {
      booking_id: "BKG-101",
      location: "Uhud Mountain",
      pickup_time: "08:00 AM",
      status: "pending",
      pax_list: [
        { pax_id: "PAX001", first_name: "Ali", last_name: "Raza", contact: "+923000709017" },
      ],
    },
  ],
};

const ZiyaratSection = () => {
  const [ziyaratData, setZiyaratData] = useState(null);
  const [search, setSearch] = useState("");
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);

  useEffect(() => {
    setZiyaratData(demoZiyaratData);
  }, []);

  const fetchPaxDetails = (paxId) => {
    const details = getPaxDetails(paxId);
    setPaxDetails(details);
    setPaxModalOpen(true);
  };

  const statusVariant = (status) => {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s.includes("pending")) return "warning";
    if (s.includes("started")) return "info";
    if (s.includes("completed")) return "success";
    if (s.includes("canceled")) return "danger";
    return "secondary";
  };

  const matchesSearch = (text) => {
    if (!search) return true;
    return (text || "").toString().toLowerCase().includes(search.toLowerCase());
  };

  const handleStatusUpdate = (bookingId, paxId, status) => {
    setZiyaratData((prev) => ({
      ...prev,
      ziyarats: prev.ziyarats.map((z) => z.booking_id === bookingId ? ({ ...z, pax_list: z.pax_list.map(p => p.pax_id === paxId ? ({ ...p, status }) : p) }) : z)
    }));
  };

  return (
    <div>
      <h5 className="mb-3"><MapPin size={18} className="me-2" />Ziyarat</h5>
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control placeholder="Search by booking id, location, pax..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </Col>
      </Row>

      <Table hover responsive size="sm" className="align-middle">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Location</th>
            <th>Pickup Time</th>
            <th>Status</th>
            <th>Pax</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(ziyaratData?.ziyarats || []).filter(z => (
            matchesSearch(z.booking_id) || matchesSearch(z.location) || (z.pax_list||[]).some(p => matchesSearch(p.first_name) || matchesSearch(p.last_name))
          )).map((z, i) => (
            <tr key={i}>
              <td>{z.booking_id}</td>
              <td>{z.location}</td>
              <td>{z.pickup_time}</td>
              <td><Badge bg={statusVariant(z.status)} className="text-capitalize">{z.status}</Badge></td>
              <td>
                {(z.pax_list || []).map((p) => (
                  <div key={p.pax_id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); fetchPaxDetails(p.pax_id); }} style={{ textDecoration: "none" }}>
                      {p.first_name} {p.last_name}
                    </a>
                    <Form.Select size="sm" style={{ width: 140 }} defaultValue={z.status} onChange={(e) => handleStatusUpdate(z.booking_id, p.pax_id, e.target.value)}>
                      <option value="pending">pending</option>
                      <option value="started">started</option>
                      <option value="completed">completed</option>
                      <option value="canceled">canceled</option>
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

export default ZiyaratSection;
