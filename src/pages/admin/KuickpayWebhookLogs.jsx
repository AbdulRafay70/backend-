import React, { useState } from "react";
import { Card, Table, Button, Modal } from "react-bootstrap";
import { Server } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

const demoWebhooks = [
  { id: 1, event: "payment.success", received_at: "2025-10-31T10:01:00Z", payload: { transaction_id: "KP-0001", status: "success" } },
  { id: 2, event: "payment.failed", received_at: "2025-10-31T11:02:00Z", payload: { transaction_id: "KP-0003", status: "failed" } }
];

const KuickpayWebhookLogs = () => {
  const [rows] = useState(demoWebhooks);
  const [selected, setSelected] = useState(null);

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
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5><Server size={18} className="me-2" />Webhook Logs</h5>
                    <small className="text-muted">Demo</small>
                  </div>
                  <Table hover responsive size="sm">
                    <thead>
                      <tr><th>ID</th><th>Event</th><th>Received</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.id}><td>{r.id}</td><td>{r.event}</td><td>{new Date(r.received_at).toLocaleString()}</td><td><Button size="sm" onClick={() => setSelected(r)}>View</Button></td></tr>
                      ))}
                    </tbody>
                  </Table>

                  <Modal show={!!selected} onHide={() => setSelected(null)}>
                    <Modal.Header closeButton>
                      <Modal.Title>Webhook #{selected?.id}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <pre style={{ background: "#f8f9fa", padding: 12 }}>{JSON.stringify(selected, null, 2)}</pre>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
                    </Modal.Footer>
                  </Modal>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KuickpayWebhookLogs;
