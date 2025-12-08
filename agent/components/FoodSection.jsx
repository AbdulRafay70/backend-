import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Row, Col } from "react-bootstrap";
import { Coffee, Edit3, Trash2 } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";

const demoFoodData = {
  date: "2025-10-17",
  meals: [
    {
      booking_id: "BKG-101",
      meal_type: "Dinner",
      time: "08:00 PM",
      menu: "Biryani + Raita",
      location: "Makkah Hotel",
      status: "pending",
      pax_list: [
        { pax_id: "PAX001", first_name: "Ali", last_name: "Raza", contact: "+923000709017" },
      ],
    },
  ],
};

const FoodSection = () => {
  const [foodData, setFoodData] = useState(null);
  const [search, setSearch] = useState("");
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);

  useEffect(() => {
    setFoodData(demoFoodData);
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
    if (s.includes("served")) return "success";
    if (s.includes("canceled")) return "danger";
    return "secondary";
  };

  const matchesSearch = (text) => {
    if (!search) return true;
    return (text || "").toString().toLowerCase().includes(search.toLowerCase());
  };

  const handleStatusUpdate = (bookingId, paxId, status) => {
    setFoodData((prev) => ({
      ...prev,
      meals: prev.meals.map((f) => f.booking_id === bookingId ? ({ ...f, pax_list: f.pax_list.map(p => p.pax_id === paxId ? ({ ...p, status }) : p) }) : f)
    }));
  };

  return (
    <div>
      <h5 className="mb-3"><Coffee size={18} className="me-2" />Food / Meals</h5>
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control placeholder="Search by booking id, meal type..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </Col>
      </Row>

      <Table hover responsive size="sm" className="align-middle">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Meal Type</th>
            <th>Time</th>
            <th>Menu</th>
            <th>Location</th>
            <th>Status</th>
            <th>Pax</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(foodData?.meals || []).filter(f => (
            matchesSearch(f.booking_id) || matchesSearch(f.meal_type) || matchesSearch(f.location) || (f.pax_list||[]).some(p => matchesSearch(p.first_name) || matchesSearch(p.last_name))
          )).map((f, i) => (
            <tr key={i}>
              <td>{f.booking_id}</td>
              <td>{f.meal_type}</td>
              <td>{f.time}</td>
              <td>{f.menu}</td>
              <td>{f.location}</td>
              <td><Badge bg={statusVariant(f.status)} className="text-capitalize">{f.status}</Badge></td>
              <td>
                {(f.pax_list || []).map((p) => (
                  <div key={p.pax_id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); fetchPaxDetails(p.pax_id); }} style={{ textDecoration: "none" }}>
                      {p.first_name} {p.last_name}
                    </a>
                    <Form.Select size="sm" style={{ width: 140 }} defaultValue={f.status} onChange={(e) => handleStatusUpdate(f.booking_id, p.pax_id, e.target.value)}>
                      <option value="pending">pending</option>
                      <option value="served">served</option>
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

export default FoodSection;
