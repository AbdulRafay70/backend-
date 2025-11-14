import React from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Card, Row, Col, Button } from "react-bootstrap";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pax = () => {
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
                  <Col><h5><User size={18} className="me-2" />Pax Details (Demo)</h5></Col>
                  <Col className="text-end"><Button variant="outline-secondary" onClick={() => navigate('/daily-operations')}>Back</Button></Col>
                </Row>

                <p>Demo Pax profile:</p>
                <p>Pax ID: PAX001 — Ali Raza — Passport: AB123456 — Booking: BKG-101</p>
                <p>Hotel: Hilton Makkah (2025-10-17 → 2025-10-20) — Flight: LHE → JED 2025-10-17 15:30</p>

                <p>All details are static placeholders for now; API wiring will come later.</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pax;
