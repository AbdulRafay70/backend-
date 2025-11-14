import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Row, Col } from "react-bootstrap";
import { Truck, Edit3, Trash2 } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";

const demoTransportData = {
  date: "2025-10-17",
  transports: [
    {
      booking_id: "BKG-101",
      pickup: "Makkah Hotel",
      drop: "Madinah Hotel",
      vehicle: "Hiace",
      driver_name: "Abdullah",
      status: "pending",
      pax_list: [
        { pax_id: "PAX001", first_name: "Ali", last_name: "Raza", contact: "+923000709017" },
      ],
    },
  ],
};

const TransportSection = () => {
  const [transportData, setTransportData] = useState(null);
  const [search, setSearch] = useState("");
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);

  useEffect(() => {
    setTransportData(demoTransportData);
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
    if (s.includes("departed")) return "info";
    if (s.includes("arrived")) return "success";
    if (s.includes("canceled")) return "danger";
    return "secondary";
  };

  const matchesSearch = (text) => {
    if (!search) return true;
    return (text || "").toString().toLowerCase().includes(search.toLowerCase());
  };

  const handleStatusUpdate = (bookingId, paxId, status) => {
    setTransportData((prev) => ({
      ...prev,
      transports: prev.transports.map((t) => t.booking_id === bookingId ? ({ ...t, pax_list: t.pax_list.map(p => p.pax_id === paxId ? ({ ...p, status }) : p) }) : t)
    }));
  };

  return (
    <div>
      <h5 className="mb-3"><Truck size={18} className="me-2" />Transport</h5>
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control placeholder="Search by booking id, pickup, drop..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </Col>
      </Row>

      <Table hover responsive size="sm" className="align-middle">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Pickup</th>
            <th>Drop</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Status</th>
            <th>Pax</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(transportData?.transports || []).filter(t => (
            matchesSearch(t.booking_id) || matchesSearch(t.pickup) || matchesSearch(t.drop) || (t.pax_list||[]).some(p => matchesSearch(p.first_name) || matchesSearch(p.last_name))
          )).map((t, i) => (
            <tr key={i}>
              <td>{t.booking_id}</td>
              <td>{t.pickup}</td>
              <td>{t.drop}</td>
              <td>{t.vehicle}</td>
              <td>{t.driver_name}</td>
              <td><Badge bg={statusVariant(t.status)} className="text-capitalize">{t.status}</Badge></td>
              <td>
                {(t.pax_list || []).map((p) => (
                  <div key={p.pax_id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); fetchPaxDetails(p.pax_id); }} style={{ textDecoration: "none" }}>
                      {p.first_name} {p.last_name}
                    </a>
                    <Form.Select size="sm" style={{ width: 140 }} defaultValue={t.status} onChange={(e) => handleStatusUpdate(t.booking_id, p.pax_id, e.target.value)}>
                      <option value="pending">pending</option>
                      <option value="departed">departed</option>
                      <option value="arrived">arrived</option>
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

export default TransportSection;
