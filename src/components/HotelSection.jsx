import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Badge, Row, Col, InputGroup } from "react-bootstrap";
import { Bed, Edit3, Trash2 } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";

const demoHotelData = {
  date: "2025-10-17",
  hotels: [
    {
      booking_id: "BKG-101",
      contact: "+923000709017",
      hotel_name: "Hilton Makkah",
      city: "Makkah",
      check_in: "2025-10-17",
      check_out: "2025-10-20",
      status: "pending",
      pax_list: [
        { pax_id: "PAX001", first_name: "Ali", last_name: "Raza", contact: "+923000709017", room_no: "204", bed_no: "B1", status: "pending" },
      ],
    },
    {
      booking_id: "BKG-102",
      contact: "+923001234567",
      hotel_name: "Makkah Grand",
      city: "Makkah",
      check_in: "2025-10-17",
      check_out: "2025-10-19",
      status: "checked_in",
      pax_list: [
        { pax_id: "PAX002", first_name: "Sara", last_name: "Ali", contact: "+923001234567", room_no: "101", bed_no: "A1", status: "checked_in" },
      ],
    },
  ],
};

const mockHotels = [
  { id: "H1", name: "Hilton Makkah", rooms: [{ id: "204", beds: ["B1", "B2"] }, { id: "205", beds: ["A1"] }] },
  { id: "H2", name: "Makkah Grand", rooms: [{ id: "101", beds: ["A1", "A2"] }] },
];

const HotelSection = () => {
  const [hotelData, setHotelData] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(demoHotelData.date || "");
  const [hotelFilter, setHotelFilter] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedBed, setSelectedBed] = useState("");
  const [selectedPaxId, setSelectedPaxId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalInfo, setStatusModalInfo] = useState({ bookingId: null, paxId: null, status: "", updatedBy: "" });
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);

  useEffect(() => {
    setHotelData(demoHotelData);
  }, []);

  const statusVariant = (status) => {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s.includes("pending") || s.includes("waiting")) return "warning";
    if (s.includes("checked_in") || s.includes("arrived") || s.includes("served")) return "success";
    if (s.includes("checked_out") || s.includes("completed")) return "primary";
    if (s.includes("canceled") || s.includes("not_picked")) return "danger";
    return "secondary";
  };

  const matchesSearch = (text) => {
    if (!search) return true;
    return (text || "").toString().toLowerCase().includes(search.toLowerCase());
  };

  const fetchPaxDetails = (paxId) => {
    const details = getPaxDetails(paxId);
    setPaxDetails(details);
    setPaxModalOpen(true);
  };

  const openAssign = (booking, pax) => {
    setSelectedBooking(booking);
    setSelectedPaxId(pax?.pax_id || null);
    const hotelId = mockHotels.find((h) => h.name === booking.hotel_name)?.id || "";
    setSelectedHotel(hotelId);
    setSelectedRoom(pax?.room_no || "");
    setSelectedBed(pax?.bed_no || "");
    setShowAssign(true);
  };

  const handleSave = () => {
    if (selectedBooking && selectedPaxId) {
      setHotelData((prev) => ({
        ...prev,
        hotels: (prev.hotels || []).map((h) => {
          if (h.booking_id !== selectedBooking.booking_id) return h;
          return {
            ...h,
            pax_list: (h.pax_list || []).map((p) => p.pax_id === selectedPaxId ? ({ ...p, room_no: selectedRoom, bed_no: selectedBed, status: p.status === 'pending' ? 'checked_in' : p.status }) : p)
          };
        })
      }));
    }
    console.log("Assigned:", { bookingId: selectedBooking?.booking_id, paxId: selectedPaxId, hotel: selectedHotel, room: selectedRoom, bed: selectedBed });
    setShowAssign(false);
  };

  const roomsForHotel = (hotelId) => {
    const h = mockHotels.find((x) => x.id === hotelId);
    return h ? h.rooms : [];
  };

  const openStatusModal = (bookingId, paxId, status) => {
    setStatusModalInfo({ bookingId, paxId, status, updatedBy: "" });
    setShowStatusModal(true);
  };

  const handleConfirmStatusUpdate = () => {
    const { bookingId, paxId, status } = statusModalInfo;
    setHotelData((prev) => ({
      ...prev,
      hotels: prev.hotels.map((h) => h.booking_id === bookingId ? ({ ...h, pax_list: h.pax_list.map(p => p.pax_id === paxId ? ({ ...p, status }) : p) }) : h)
    }));
    setShowStatusModal(false);
  };

  return (
    <div>
      <h5 className="mb-3"><Bed size={18} className="me-2" />Hotel Check-in / Check-out</h5>
      
      <Row className="align-items-center mb-3">
        <Col md={3} className="mb-2 mb-md-0">
          <InputGroup>
            <InputGroup.Text>Date</InputGroup.Text>
            <Form.Control type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </InputGroup>
        </Col>
        <Col md={3} className="mb-2 mb-md-0">
          <InputGroup>
            <InputGroup.Text>Hotel</InputGroup.Text>
            <Form.Select value={hotelFilter} onChange={(e) => setHotelFilter(e.target.value)}>
              <option value="">All hotels</option>
              {mockHotels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </Form.Select>
          </InputGroup>
        </Col>
        <Col md={4} className="mb-2 mb-md-0">
          <Form.Control placeholder="Search by booking id, pax name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </Col>
      </Row>

      <Table hover responsive size="sm" className="align-middle">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Hotel</th>
            <th>City</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Status</th>
            <th>Pax</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(hotelData?.hotels || []).filter(h => (
            (matchesSearch(h.booking_id) || matchesSearch(h.hotel_name) || matchesSearch(h.city) || (h.pax_list||[]).some(p => matchesSearch(p.first_name) || matchesSearch(p.last_name)))
            && (hotelFilter === "" || h.hotel_name === (mockHotels.find(hh => hh.id === hotelFilter)?.name || ""))
          )).map((h, idx) => (
            <tr key={idx}>
              <td>{h.booking_id}</td>
              <td>{h.hotel_name}</td>
              <td>{h.city}</td>
              <td>{h.check_in}</td>
              <td>{h.check_out}</td>
              <td><Badge bg={statusVariant(h.status)} className="text-capitalize">{h.status}</Badge></td>
              <td>
                {(h.pax_list || []).map((p) => (
                  <div key={p.pax_id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); fetchPaxDetails(p.pax_id); }} style={{ textDecoration: "none" }}>
                      {p.first_name} {p.last_name}
                    </a>
                    <Form.Select size="sm" style={{ width: 140 }} value={p.status || "pending"} onChange={(e) => openStatusModal(h.booking_id, p.pax_id, e.target.value)}>
                      <option value="pending">pending</option>
                      <option value="checked_in">checked_in</option>
                      <option value="checked_out">checked_out</option>
                    </Form.Select>
                    <Button size="sm" variant="outline-primary" onClick={() => openAssign(h, p)} title="Assign room/bed"><Bed size={14} /></Button>
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

      <Modal show={showAssign} onHide={() => setShowAssign(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Room & Bed</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Hotel</Form.Label>
              <Form.Select value={selectedHotel} onChange={(e) => { setSelectedHotel(e.target.value); setSelectedRoom(""); setSelectedBed(""); }}>
                <option value="">Select hotel</option>
                {mockHotels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Room</Form.Label>
              <Form.Select value={selectedRoom} onChange={(e) => { setSelectedRoom(e.target.value); setSelectedBed(""); }}>
                <option value="">Select room</option>
                {roomsForHotel(selectedHotel).map((r) => (
                  <option key={r.id} value={r.id}>{r.id}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Bed</Form.Label>
              <Form.Select value={selectedBed} onChange={(e) => setSelectedBed(e.target.value)}>
                <option value="">Select bed</option>
                {roomsForHotel(selectedHotel).find((r) => r.id === selectedRoom)?.beds?.map((bed) => (
                  <option key={bed} value={bed}>{bed}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Check-in / Check-out</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Booking ID</Form.Label>
              <Form.Control readOnly value={statusModalInfo.bookingId || ""} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Pax ID</Form.Label>
              <Form.Control readOnly value={statusModalInfo.paxId || ""} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Status</Form.Label>
              <Form.Select value={statusModalInfo.status} onChange={(e) => setStatusModalInfo(s => ({ ...s, status: e.target.value }))}>
                <option value="pending">pending</option>
                <option value="checked_in">checked_in</option>
                <option value="checked_out">checked_out</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Updated By (Employee ID)</Form.Label>
              <Form.Control placeholder="EMP-12" value={statusModalInfo.updatedBy} onChange={(e) => setStatusModalInfo(s => ({ ...s, updatedBy: e.target.value }))} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmStatusUpdate}>Confirm</Button>
        </Modal.Footer>
      </Modal>

      <PaxDetailsModal 
        show={paxModalOpen} 
        onHide={() => setPaxModalOpen(false)} 
        paxDetails={paxDetails} 
      />
    </div>
  );
};

export default HotelSection;
