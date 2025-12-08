import React, { useState } from "react";
import { Card, Table, Button, Modal, Row, Col, Form, InputGroup } from "react-bootstrap";
import { FileText, Search, BarChart2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

const demoTransactions = [
  {
    transaction_id: "KP-0001",
    booking_id: "BKG-101",
    amount: 120.0,
    currency: "PKR",
    status: "success",
    payment_method: "card",
    created_at: "2025-10-31T10:00:00Z",
    merchant_id: "M-123",
    reference: "ref-001",
    raw: { provider_response: { code: "00", message: "Approved" } }
  },
  {
    transaction_id: "KP-0002",
    booking_id: "BKG-102",
    amount: 200.0,
    currency: "PKR",
    status: "pending",
    payment_method: "bank",
    created_at: "2025-10-31T11:00:00Z",
    merchant_id: "M-123",
    reference: "ref-002",
    raw: { provider_response: { code: "01", message: "Pending" } }
  }
];

const KuickpayTransactions = () => {
  const [rows] = useState(demoTransactions);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const filtered = rows.filter(r => !query || r.transaction_id.includes(query) || r.booking_id.includes(query) || r.status.includes(query));

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
                    <Col><h5><FileText size={18} className="me-2" />Kuickpay Transactions</h5></Col>
                    <Col className="text-end"><Button variant="outline-secondary" size="sm"><BarChart2 size={14} className="me-1" />Export</Button></Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <InputGroup>
                        <InputGroup.Text><Search size={14} /></InputGroup.Text>
                        <Form.Control placeholder="Search transaction id, booking id, status" value={query} onChange={(e) => setQuery(e.target.value)} />
                      </InputGroup>
                    </Col>
                  </Row>

                  <Table hover responsive size="sm">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Booking</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.transaction_id}>
                          <td>{r.transaction_id}</td>
                          <td>{r.booking_id}</td>
                          <td>{r.amount} {r.currency}</td>
                          <td>{r.payment_method}</td>
                          <td className="text-capitalize">{r.status}</td>
                          <td>{new Date(r.created_at).toLocaleString()}</td>
                          <td><Button size="sm" variant="outline-primary" onClick={() => setSelected(r)}>View</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <Modal show={!!selected} onHide={() => setSelected(null)} size="lg">
                    <Modal.Header closeButton>
                      <Modal.Title>Transaction {selected?.transaction_id}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {selected && (
                        <pre style={{ background: "#f8f9fa", padding: 12 }}>{JSON.stringify(selected, null, 2)}</pre>
                      )}
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

export default KuickpayTransactions;
