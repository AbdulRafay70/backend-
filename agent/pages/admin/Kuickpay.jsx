import React, { useState } from "react";
import { Nav, Card, Row, Col, Form, Button, InputGroup, Table, Modal, Badge } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Settings, FileText, Server, Search, BarChart2 } from "lucide-react";

const demoTransactions = [
  { transaction_id: "KP-0001", booking_id: "BKG-101", amount: 120.0, currency: "PKR", status: "success", payment_method: "card", created_at: "2025-10-31T10:00:00Z", merchant_id: "M-123", reference: "ref-001", raw: { provider_response: { code: "00", message: "Approved" } } },
  { transaction_id: "KP-0002", booking_id: "BKG-102", amount: 200.0, currency: "PKR", status: "pending", payment_method: "bank", created_at: "2025-10-31T11:00:00Z", merchant_id: "M-123", reference: "ref-002", raw: { provider_response: { code: "01", message: "Pending" } } }
];

const demoWebhooks = [
  { id: 1, event: "payment.success", received_at: "2025-10-31T10:01:00Z", payload: { transaction_id: "KP-0001", status: "success" } },
  { id: 2, event: "payment.failed", received_at: "2025-10-31T11:02:00Z", payload: { transaction_id: "KP-0003", status: "failed" } }
];

const Kuickpay = () => {
  const [active, setActive] = useState("settings");

  // settings state
  const [config, setConfig] = useState({ merchant_id: "M-123", api_key: "sk_test_XXXX", mode: "test", webhook_url: "https://example.com/webhooks/kuickpay" });

  // transactions state
  const [transactions] = useState(demoTransactions);
  const [txQuery, setTxQuery] = useState("");
  const [txSelected, setTxSelected] = useState(null);

  // webhooks state
  const [webhooks] = useState(demoWebhooks);
  const [whSelected, setWhSelected] = useState(null);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    console.log("Save Kuickpay settings", config);
    alert("Settings saved (demo)");
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
              <Card className="shadow-sm p-3">
                <Nav variant="tabs" activeKey={active} onSelect={(k) => setActive(k)} className="mb-3">
                  <Nav.Item>
                    <Nav.Link eventKey="settings"><Settings size={14} className="me-1" />Settings</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="transactions"><FileText size={14} className="me-1" />Transactions</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="webhooks"><Server size={14} className="me-1" />Webhooks</Nav.Link>
                  </Nav.Item>
                </Nav>

                {active === "settings" && (
                  <div>
                    <Row className="align-items-center mb-3">
                      <Col><h5><Settings size={18} className="me-2" />Kuickpay Settings <Badge bg="info">Demo</Badge></h5></Col>
                    </Row>
                    <form onSubmit={handleSaveSettings}>
                      <Row className="g-3">
                        <Col md={6}><Form.Label>Merchant ID</Form.Label><Form.Control value={config.merchant_id} onChange={(e) => setConfig(c => ({ ...c, merchant_id: e.target.value }))} /></Col>
                        <Col md={6}><Form.Label>API Key</Form.Label><Form.Control type="password" value={config.api_key} onChange={(e) => setConfig(c => ({ ...c, api_key: e.target.value }))} /></Col>
                        <Col md={4}><Form.Label>Mode</Form.Label><Form.Select value={config.mode} onChange={(e) => setConfig(c => ({ ...c, mode: e.target.value }))}><option value="test">Test</option><option value="live">Live</option></Form.Select></Col>
                        <Col md={8}><Form.Label>Webhook URL</Form.Label><Form.Control value={config.webhook_url} onChange={(e) => setConfig(c => ({ ...c, webhook_url: e.target.value }))} /></Col>
                        <Col md={12} className="mt-2"><div className="d-flex gap-2"><Button type="submit">Save</Button><Button variant="outline-secondary" onClick={() => setConfig({ merchant_id: "M-123", api_key: "sk_test_XXXX", mode: "test", webhook_url: "https://example.com/webhooks/kuickpay" })}>Reset</Button></div></Col>
                      </Row>
                    </form>
                  </div>
                )}

                {active === "transactions" && (
                  <div>
                    <Row className="align-items-center mb-3">
                      <Col><h5><FileText size={18} className="me-2" />Transactions</h5></Col>
                      <Col className="text-end"><Button variant="outline-secondary" size="sm"><BarChart2 size={14} className="me-1" />Export</Button></Col>
                    </Row>
                    <Row className="mb-3"><Col md={6}><InputGroup><InputGroup.Text><Search size={14} /></InputGroup.Text><Form.Control placeholder="Search transaction id, booking id, status" value={txQuery} onChange={(e) => setTxQuery(e.target.value)} /></InputGroup></Col></Row>
                    <Table hover responsive size="sm"><thead><tr><th>Transaction</th><th>Booking</th><th>Amount</th><th>Method</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                      <tbody>
                        {transactions.filter(r => !txQuery || r.transaction_id.includes(txQuery) || r.booking_id.includes(txQuery) || r.status.includes(txQuery)).map(r => (
                          <tr key={r.transaction_id}><td>{r.transaction_id}</td><td>{r.booking_id}</td><td>{r.amount} {r.currency}</td><td>{r.payment_method}</td><td className="text-capitalize">{r.status}</td><td>{new Date(r.created_at).toLocaleString()}</td><td><Button size="sm" variant="outline-primary" onClick={() => setTxSelected(r)}>View</Button></td></tr>
                        ))}
                      </tbody>
                    </Table>

                    <Modal show={!!txSelected} onHide={() => setTxSelected(null)} size="lg">
                      <Modal.Header closeButton><Modal.Title>Transaction {txSelected?.transaction_id}</Modal.Title></Modal.Header>
                      <Modal.Body>{txSelected && <pre style={{ background: "#f8f9fa", padding: 12 }}>{JSON.stringify(txSelected, null, 2)}</pre>}</Modal.Body>
                      <Modal.Footer><Button variant="secondary" onClick={() => setTxSelected(null)}>Close</Button></Modal.Footer>
                    </Modal>
                  </div>
                )}

                {active === "webhooks" && (
                  <div>
                    <Row className="align-items-center mb-3"><Col><h5><Server size={18} className="me-2" />Webhook Logs</h5></Col><Col className="text-end"><small className="text-muted">Demo</small></Col></Row>
                    <Table hover responsive size="sm"><thead><tr><th>ID</th><th>Event</th><th>Received</th><th>Actions</th></tr></thead>
                      <tbody>
                        {webhooks.map(w => (
                          <tr key={w.id}><td>{w.id}</td><td>{w.event}</td><td>{new Date(w.received_at).toLocaleString()}</td><td><Button size="sm" onClick={() => setWhSelected(w)}>View</Button></td></tr>
                        ))}
                      </tbody>
                    </Table>

                    <Modal show={!!whSelected} onHide={() => setWhSelected(null)}>
                      <Modal.Header closeButton><Modal.Title>Webhook #{whSelected?.id}</Modal.Title></Modal.Header>
                      <Modal.Body><pre style={{ background: "#f8f9fa", padding: 12 }}>{JSON.stringify(whSelected, null, 2)}</pre></Modal.Body>
                      <Modal.Footer><Button variant="secondary" onClick={() => setWhSelected(null)}>Close</Button></Modal.Footer>
                    </Modal>
                  </div>
                )}

              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kuickpay;
