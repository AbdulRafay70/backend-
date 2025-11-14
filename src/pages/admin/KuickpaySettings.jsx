import React, { useState } from "react";
import { Card, Form, Button, Row, Col, Badge } from "react-bootstrap";
import { Settings } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

const KuickpaySettings = () => {
  const [config, setConfig] = useState({
    merchant_id: "M-123",
    api_key: "sk_test_XXXX",
    mode: "test",
    webhook_url: "https://example.com/webhooks/kuickpay",
  });

  const handleSave = (e) => {
    e.preventDefault();
    // demo-only: show console and pretend to save
    console.log("Saving Kuickpay config", config);
    alert("Kuickpay settings saved (demo)");
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <Card className="shadow-sm">
                <Card.Body>
                  <Row className="align-items-center mb-3">
                    <Col><h5><Settings size={18} className="me-2" />Kuickpay Settings</h5></Col>
                    <Col className="text-end"><Badge bg="info">Demo</Badge></Col>
                  </Row>

                  <Form onSubmit={handleSave}>
                    <Form.Group className="mb-3">
                      <Form.Label>Merchant ID</Form.Label>
                      <Form.Control value={config.merchant_id} onChange={(e) => setConfig(c => ({ ...c, merchant_id: e.target.value }))} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>API Key</Form.Label>
                      <Form.Control type="password" value={config.api_key} onChange={(e) => setConfig(c => ({ ...c, api_key: e.target.value }))} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Mode</Form.Label>
                      <Form.Select value={config.mode} onChange={(e) => setConfig(c => ({ ...c, mode: e.target.value }))}>
                        <option value="test">Test</option>
                        <option value="live">Live</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Webhook URL</Form.Label>
                      <Form.Control value={config.webhook_url} onChange={(e) => setConfig(c => ({ ...c, webhook_url: e.target.value }))} />
                    </Form.Group>

                    <div className="d-flex gap-2">
                      <Button type="submit" variant="primary">Save</Button>
                      <Button variant="outline-secondary" onClick={() => { setConfig({ merchant_id: "M-123", api_key: "sk_test_XXXX", mode: "test", webhook_url: "https://example.com/webhooks/kuickpay" }); }}>Reset</Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KuickpaySettings;
