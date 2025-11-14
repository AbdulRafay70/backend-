import React from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Card, Row, Col } from "react-bootstrap";
import { Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Transport = () => {
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
                  <Col><h5><Truck size={18} className="me-2" />Transport (Demo)</h5></Col>
                  <Col className="text-end"><Button variant="outline-secondary" onClick={() => navigate('/daily-operations')}>Back</Button></Col>
                </Row>

                <p>Demo transport entry:</p>
                <p>Booking: BKG-101 — Pickup: Makkah Hotel — Drop: Madinah Hotel — Vehicle: Hiace — Driver: Abdullah — Status: pending</p>
                <p>Pax: PAX001 — Ali Raza</p>

                <p>UI is demo-only. We'll wire network calls later when you ask.</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transport;
