import React from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Card, Row, Col } from "react-bootstrap";
import { Bed } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hotel = () => {
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
                  <Col><h5><Bed size={18} className="me-2" />Hotel Check-in / Check-out (Demo)</h5></Col>
                  <Col className="text-end"><Button variant="outline-secondary" onClick={() => navigate('/daily-operations')}>Back</Button></Col>
                </Row>

                <p>This is a demo Hotel section. Data is hard-coded for now; it will be wired to the real API later.</p>
                <p>Sample booking summary:</p>
                <p>Booking ID: BKG-101 — Hotel: Hilton Makkah — Check In: 2025-10-17 — Check Out: 2025-10-20 — Status: pending</p>
                <p>Sample pax entry: PAX001 — Ali Raza — Room: 204 — Bed: B1 — Status: pending</p>

                <p>You can perform demo actions like assign room/bed or change status; these will update local UI only (no network calls).</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hotel;
