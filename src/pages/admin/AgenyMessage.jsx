import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PartnersTabs from "../../components/PartnersTabs";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, UploadCloudIcon, Edit, Trash2, Plus, Send } from "lucide-react";
import { Dropdown, Table, Button, Form, Modal, Spinner, Alert, Row, Col, Card } from "react-bootstrap";

const AgencyDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Dummy data for agencies
  const dummyAgencies = {
    1: {
      id: 1,
      agency_name: "Al-Haramain Travels",
      phone_number: "+923001234567",
      email: "info@alharamain.com",
      address: "123 Main Street, Lahore",
      city: "Lahore",
      status: "Active",
    },
    2: {
      id: 2,
      agency_name: "Saer Travel Agency",
      phone_number: "+923217654321",
      email: "contact@saertravel.com",
      address: "456 Commercial Avenue, Karachi",
      city: "Karachi",
      status: "Active",
    },
    3: {
      id: 3,
      agency_name: "Makkah Tours",
      phone_number: "+923339876543",
      email: "support@makkahtours.com",
      address: "789 Business Road, Islamabad",
      city: "Islamabad",
      status: "Inactive",
    },
  };

  // Dummy data for main agents
  const dummyMainAgents = [
    { id: 1, first_name: "Ahmed Ali", email: "ahmed@example.com", phone: "+923001111111", is_active: true },
    { id: 2, first_name: "Fatima Khan", email: "fatima@example.com", phone: "+923002222222", is_active: true },
    { id: 3, first_name: "Usman Malik", email: "usman@example.com", phone: "+923003333333", is_active: false },
  ];

  // Dummy data for sub-agents
  const dummySubAgents = [
    { id: 1, first_name: "Ali Hassan", email: "ali@example.com", phone: "+923004444444", is_active: true },
    { id: 2, first_name: "Sara Ahmed", email: "sara@example.com", phone: "+923005555555", is_active: true },
  ];

  // Dummy messages data
  const dummyMessages = [
    { id: 1, sender: "Ahmed Ali", message: "Please update the package pricing for December.", date: "2025-11-01", time: "10:30 AM" },
    { id: 2, sender: "Fatima Khan", message: "Can we schedule a meeting to discuss new contracts?", date: "2025-11-02", time: "02:15 PM" },
    { id: 3, sender: "Admin", message: "Your commission for October has been processed.", date: "2025-11-02", time: "04:45 PM" },
  ];

  const [agencyData, setAgencyData] = useState(null);
  const [mainAgents, setMainAgents] = useState([]);
  const [subAgents, setSubAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Load dummy data based on ID
  useEffect(() => {
    // If no ID provided, show first agency
    const agencyId = id || "1";
    const agency = dummyAgencies[agencyId] || dummyAgencies[1];
    
    setAgencyData(agency);
    setMainAgents(dummyMainAgents);
    setSubAgents(dummySubAgents);
    setMessages(dummyMessages);
  }, [id]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        sender: "You",
        message: newMessage,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMsg]);
      setNewMessage("");
    }
  };

  if (!agencyData) {
    return (
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          <div className="col-12 col-lg-2">
            <Sidebar />
          </div>
          <div className="col-12 col-lg-10">
            <div className="container">
              <Header />
              <div className="p-3">
                <p>Agency not found</p>
                <Link to="/partners/agencies">Back to Agencies</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <PartnersTabs activeName="Messages" />

              <div className="p-3 bg-white border rounded-4 shadow-sm mt-3">
                <div className="d-flex align-items-center mb-4">
                  <Link to="/partners/agencies" className="me-3 text-decoration-none">
                    <ArrowBigLeft size={24} />
                  </Link>
                  <h5 className="mb-0 fw-semibold">Agency Messages - {agencyData.agency_name}</h5>
                </div>

                {/* Agency Info Card */}
                <Card className="mb-4">
                  <Card.Body>
                    <Row>
                      <Col md={3}>
                        <strong>Agency Name:</strong>
                        <p>{agencyData.agency_name}</p>
                      </Col>
                      <Col md={3}>
                        <strong>Phone:</strong>
                        <p>{agencyData.phone_number}</p>
                      </Col>
                      <Col md={3}>
                        <strong>Email:</strong>
                        <p>{agencyData.email}</p>
                      </Col>
                      <Col md={3}>
                        <strong>Status:</strong>
                        <p className={`fw-bold ${agencyData.status === "Active" ? "text-success" : "text-danger"}`}>
                          {agencyData.status}
                        </p>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <strong>Address:</strong>
                        <p>{agencyData.address}</p>
                      </Col>
                      <Col md={6}>
                        <strong>City:</strong>
                        <p>{agencyData.city}</p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Messages Section */}
                <div className="mb-4">
                  <h6 className="fw-semibold mb-3">Messages</h6>
                  <div className="border rounded p-3" style={{ maxHeight: "400px", overflowY: "auto", backgroundColor: "#f8f9fa" }}>
                    {messages.map((msg) => (
                      <Card key={msg.id} className="mb-3">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong className="text-primary">{msg.sender}</strong>
                              <p className="mb-1 mt-2">{msg.message}</p>
                            </div>
                            <small className="text-muted">
                              {msg.date} {msg.time}
                            </small>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="mt-3">
                    <Form.Group>
                      <div className="d-flex gap-2">
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Type your message here..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          variant="primary" 
                          onClick={handleSendMessage}
                          style={{ minWidth: "100px" }}
                        >
                          <Send size={18} className="me-1" />
                          Send
                        </Button>
                      </div>
                    </Form.Group>
                  </div>
                </div>

                {/* Main Agents Table */}
                <div className="mb-4">
                  <h6 className="fw-semibold mb-3">Main Agents</h6>
                  <Table striped bordered hover responsive>
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mainAgents.map((agent) => (
                        <tr key={agent.id}>
                          <td>{agent.first_name}</td>
                          <td>{agent.email}</td>
                          <td>{agent.phone}</td>
                          <td>
                            <span className={`badge ${agent.is_active ? "bg-success" : "bg-danger"}`}>
                              {agent.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <Button variant="link" size="sm" className="text-primary p-0 me-2">
                              <Edit size={16} /> Edit
                            </Button>
                            <Button variant="link" size="sm" className="text-danger p-0">
                              <Trash2 size={16} /> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Sub-Agents Table */}
                <div className="mb-4">
                  <h6 className="fw-semibold mb-3">Sub-Agents</h6>
                  <Table striped bordered hover responsive>
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subAgents.map((agent) => (
                        <tr key={agent.id}>
                          <td>{agent.first_name}</td>
                          <td>{agent.email}</td>
                          <td>{agent.phone}</td>
                          <td>
                            <span className={`badge ${agent.is_active ? "bg-success" : "bg-danger"}`}>
                              {agent.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <Button variant="link" size="sm" className="text-primary p-0 me-2">
                              <Edit size={16} /> Edit
                            </Button>
                            <Button variant="link" size="sm" className="text-danger p-0">
                              <Trash2 size={16} /> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2 justify-content-end mt-4">
                  <Button variant="outline-secondary" onClick={() => navigate("/partners/agencies")}>
                    Close
                  </Button>
                  <Button variant="primary">
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyDetails;