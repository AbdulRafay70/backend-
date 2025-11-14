import React from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Card, Row, Col } from "react-bootstrap";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Ziyarat = () => {
  const navigate = useNavigate();
  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2"><Sidebar /></div>
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <Card className="shadow-sm p-3">
                <Row className="align-items-center mb-3">
                  <Col><h5><MapPin size={18} className="me-2" />Ziyarat (Demo)</h5></Col>
                  <Col className="text-end"><Button variant="outline-secondary" onClick={() => navigate('/daily-operations')}>Back</Button></Col>
                </Row>

                <p>This is a demo Ziyarat section with hard-coded details.</p>
                <p>Sample item: Booking BKG-101 — Location: Uhud Mountain — Pickup: 08:00 AM — Status: pending</p>
                <p>Pax list sample: PAX001 — Ali Raza</p>

                <p>When ready we will call the real API endpoints to fetch and update these records.</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ziyarat;
