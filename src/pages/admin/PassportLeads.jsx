import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Badge, Modal, Tab, Tabs, Alert, Spinner } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  FileText,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Search,
  Filter,
  Plus,
  Edit2,
  Eye,
  Bell,
  RefreshCw,
  Download,
  Upload,
  MessageSquare,
  Users,
  TrendingUp,
} from "lucide-react";

const PassportLeads = () => {
  // State Management
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  // Selected Items
  const [selectedLead, setSelectedLead] = useState(null);

  // Form State
  const [leadForm, setLeadForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_cnic: "",
    agent_id: "",
    agent_name: "",
    passport_number: "",
    passport_status: "pending_collection",
    collection_date: "",
    expected_delivery_date: "",
    actual_delivery_date: "",
    urgency: "normal",
    notes: "",
    documents_received: false,
    documents_list: [],
  });

  // Follow-up Form
  const [followUpForm, setFollowUpForm] = useState({
    follow_up_date: "",
    follow_up_type: "phone",
    follow_up_notes: "",
    next_follow_up_date: "",
    status_update: "",
  });

  // Follow-up History
  const [followUpHistory, setFollowUpHistory] = useState([]);

  // Demo Data
  useEffect(() => {
    setLeads([
      {
        id: 1,
        customer_name: "Ahmed Hassan",
        customer_phone: "+92-300-1234567",
        customer_email: "ahmed@example.com",
        customer_cnic: "12345-1234567-1",
        agent_id: "AG001",
        agent_name: "Ali Travels",
        passport_number: "AB1234567",
        passport_status: "pending_collection",
        collection_date: "",
        expected_delivery_date: "2024-12-15",
        actual_delivery_date: "",
        urgency: "high",
        notes: "Customer needs passport urgently for visa application",
        documents_received: false,
        documents_list: [],
        created_at: "2024-11-25",
        follow_ups: [
          {
            id: 1,
            date: "2024-11-26",
            type: "phone",
            notes: "Called customer, waiting for documents",
            next_follow_up: "2024-11-28",
            status: "pending_collection",
          },
        ],
      },
      {
        id: 2,
        customer_name: "Fatima Khan",
        customer_phone: "+92-321-9876543",
        customer_email: "fatima@example.com",
        customer_cnic: "54321-7654321-2",
        agent_id: "AG002",
        agent_name: "Pak Tours",
        passport_number: "CD9876543",
        passport_status: "collected",
        collection_date: "2024-11-20",
        expected_delivery_date: "2024-12-05",
        actual_delivery_date: "",
        urgency: "normal",
        notes: "Standard processing",
        documents_received: true,
        documents_list: ["CNIC Copy", "Photos", "Application Form"],
        created_at: "2024-11-18",
        follow_ups: [
          {
            id: 1,
            date: "2024-11-19",
            type: "email",
            notes: "Email sent to customer with requirements",
            next_follow_up: "2024-11-22",
            status: "pending_collection",
          },
          {
            id: 2,
            date: "2024-11-20",
            type: "phone",
            notes: "Passport collected from customer",
            next_follow_up: "2024-11-27",
            status: "collected",
          },
        ],
      },
      {
        id: 3,
        customer_name: "Muhammad Bilal",
        customer_phone: "+92-333-5555555",
        customer_email: "bilal@example.com",
        customer_cnic: "67890-6789012-3",
        agent_id: "AG001",
        agent_name: "Ali Travels",
        passport_number: "EF5555555",
        passport_status: "in_process",
        collection_date: "2024-11-15",
        expected_delivery_date: "2024-12-01",
        actual_delivery_date: "",
        urgency: "urgent",
        notes: "Expedited processing requested",
        documents_received: true,
        documents_list: ["CNIC Copy", "Photos", "Old Passport", "Application Form"],
        created_at: "2024-11-12",
        follow_ups: [
          {
            id: 1,
            date: "2024-11-15",
            type: "phone",
            notes: "Passport collected, sent to passport office",
            next_follow_up: "2024-11-22",
            status: "in_process",
          },
          {
            id: 2,
            date: "2024-11-22",
            type: "visit",
            notes: "Visited passport office, processing in progress",
            next_follow_up: "2024-11-29",
            status: "in_process",
          },
        ],
      },
      {
        id: 4,
        customer_name: "Ayesha Malik",
        customer_phone: "+92-345-7777777",
        customer_email: "ayesha@example.com",
        customer_cnic: "11111-1111111-1",
        agent_id: "AG003",
        agent_name: "Global Travels",
        passport_number: "GH7777777",
        passport_status: "ready",
        collection_date: "2024-11-08",
        expected_delivery_date: "2024-11-25",
        actual_delivery_date: "",
        urgency: "normal",
        notes: "Passport ready for delivery",
        documents_received: true,
        documents_list: ["CNIC Copy", "Photos", "Application Form"],
        created_at: "2024-11-05",
        follow_ups: [
          {
            id: 1,
            date: "2024-11-24",
            type: "whatsapp",
            notes: "Informed customer passport is ready",
            next_follow_up: "2024-11-26",
            status: "ready",
          },
        ],
      },
      {
        id: 5,
        customer_name: "Usman Ali",
        customer_phone: "+92-300-9999999",
        customer_email: "usman@example.com",
        customer_cnic: "22222-2222222-2",
        agent_id: "AG002",
        agent_name: "Pak Tours",
        passport_number: "IJ9999999",
        passport_status: "delivered",
        collection_date: "2024-10-28",
        expected_delivery_date: "2024-11-15",
        actual_delivery_date: "2024-11-14",
        urgency: "normal",
        notes: "Successfully completed",
        documents_received: true,
        documents_list: ["CNIC Copy", "Photos", "Application Form"],
        created_at: "2024-10-25",
        follow_ups: [
          {
            id: 1,
            date: "2024-11-14",
            type: "visit",
            notes: "Passport delivered to customer",
            next_follow_up: "",
            status: "delivered",
          },
        ],
      },
    ]);
  }, []);

  // Statistics
  const statistics = {
    total: leads.length,
    pending_collection: leads.filter((l) => l.passport_status === "pending_collection").length,
    collected: leads.filter((l) => l.passport_status === "collected").length,
    in_process: leads.filter((l) => l.passport_status === "in_process").length,
    ready: leads.filter((l) => l.passport_status === "ready").length,
    delivered: leads.filter((l) => l.passport_status === "delivered").length,
    urgent: leads.filter((l) => l.urgency === "urgent").length,
    high: leads.filter((l) => l.urgency === "high").length,
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchTerm === "" ||
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.passport_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customer_phone.includes(searchTerm) ||
      lead.agent_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.passport_status === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || lead.urgency === urgencyFilter;
    const matchesAgent = agentFilter === "all" || lead.agent_id === agentFilter;

    return matchesSearch && matchesStatus && matchesUrgency && matchesAgent;
  });

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_collection: { bg: "warning", text: "Pending Collection", icon: Clock },
      collected: { bg: "info", text: "Collected", icon: FileText },
      in_process: { bg: "primary", text: "In Process", icon: RefreshCw },
      ready: { bg: "success", text: "Ready", icon: CheckCircle },
      delivered: { bg: "secondary", text: "Delivered", icon: UserCheck },
      cancelled: { bg: "danger", text: "Cancelled", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending_collection;
    const Icon = config.icon;

    return (
      <Badge bg={config.bg} className="d-flex align-items-center gap-1" style={{ fontSize: "0.85rem" }}>
        <Icon size={14} />
        {config.text}
      </Badge>
    );
  };

  // Urgency Badge Helper
  const getUrgencyBadge = (urgency) => {
    const urgencyConfig = {
      urgent: { bg: "danger", text: "🔥 Urgent" },
      high: { bg: "warning", text: "⚠️ High" },
      normal: { bg: "info", text: "📋 Normal" },
      low: { bg: "secondary", text: "⬇️ Low" },
    };

    const config = urgencyConfig[urgency] || urgencyConfig.normal;

    return (
      <Badge bg={config.bg} style={{ fontSize: "0.85rem" }}>
        {config.text}
      </Badge>
    );
  };

  // Handle Add Lead
  const handleAddLead = () => {
    // API call to add lead
    const newLead = {
      id: leads.length + 1,
      ...leadForm,
      created_at: new Date().toISOString().split("T")[0],
      follow_ups: [],
    };

    setLeads([...leads, newLead]);
    setShowAddModal(false);
    resetLeadForm();
    showAlert("success", "Lead added successfully!");
  };

  // Handle Edit Lead
  const handleEditLead = () => {
    // API call to update lead
    const updatedLeads = leads.map((lead) => (lead.id === selectedLead.id ? { ...selectedLead, ...leadForm } : lead));

    setLeads(updatedLeads);
    setShowEditModal(false);
    setSelectedLead(null);
    resetLeadForm();
    showAlert("success", "Lead updated successfully!");
  };

  // Handle Add Follow-up
  const handleAddFollowUp = () => {
    if (!selectedLead) return;

    const newFollowUp = {
      id: selectedLead.follow_ups.length + 1,
      date: followUpForm.follow_up_date,
      type: followUpForm.follow_up_type,
      notes: followUpForm.follow_up_notes,
      next_follow_up: followUpForm.next_follow_up_date,
      status: followUpForm.status_update || selectedLead.passport_status,
    };

    const updatedLeads = leads.map((lead) =>
      lead.id === selectedLead.id
        ? {
            ...lead,
            follow_ups: [...lead.follow_ups, newFollowUp],
            passport_status: followUpForm.status_update || lead.passport_status,
          }
        : lead
    );

    setLeads(updatedLeads);
    setSelectedLead({
      ...selectedLead,
      follow_ups: [...selectedLead.follow_ups, newFollowUp],
      passport_status: followUpForm.status_update || selectedLead.passport_status,
    });
    resetFollowUpForm();
    showAlert("success", "Follow-up added successfully!");
  };

  // Reset Forms
  const resetLeadForm = () => {
    setLeadForm({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_cnic: "",
      agent_id: "",
      agent_name: "",
      passport_number: "",
      passport_status: "pending_collection",
      collection_date: "",
      expected_delivery_date: "",
      actual_delivery_date: "",
      urgency: "normal",
      notes: "",
      documents_received: false,
      documents_list: [],
    });
  };

  const resetFollowUpForm = () => {
    setFollowUpForm({
      follow_up_date: "",
      follow_up_type: "phone",
      follow_up_notes: "",
      next_follow_up_date: "",
      status_update: "",
    });
  };

  // Show Alert
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  // Open Modals
  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setLeadForm({
      customer_name: lead.customer_name,
      customer_phone: lead.customer_phone,
      customer_email: lead.customer_email,
      customer_cnic: lead.customer_cnic,
      agent_id: lead.agent_id,
      agent_name: lead.agent_name,
      passport_number: lead.passport_number,
      passport_status: lead.passport_status,
      collection_date: lead.collection_date,
      expected_delivery_date: lead.expected_delivery_date,
      actual_delivery_date: lead.actual_delivery_date,
      urgency: lead.urgency,
      notes: lead.notes,
      documents_received: lead.documents_received,
      documents_list: lead.documents_list,
    });
    setShowEditModal(true);
  };

  const openViewModal = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

  const openFollowUpModal = (lead) => {
    setSelectedLead(lead);
    setFollowUpForm({
      ...followUpForm,
      follow_up_date: new Date().toISOString().split("T")[0],
    });
    setShowFollowUpModal(true);
  };

  return (
    <>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: "auto" }}>
          <Header />
          <Container fluid className="p-4">
            {/* Alert */}
            {alert.show && (
              <Alert variant={alert.type} onClose={() => setAlert({ show: false })} dismissible className="mb-3">
                {alert.message}
              </Alert>
            )}

            {/* Page Header */}
            <Row className="mb-4">
              <Col>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="mb-1 fw-bold">
                      <FileText size={32} className="me-2" />
                      Passport Leads & Follow-up
                    </h2>
                    <p className="text-muted">Track and manage passport collection and delivery process</p>
                  </div>
                  <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} className="me-2" />
                    Add New Lead
                  </Button>
                </div>
              </Col>
            </Row>

            {/* Statistics Cards */}
            <Row className="mb-4">
              <Col md={3} sm={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#e3f2fd" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Total Leads</p>
                        <h3 className="mb-0 fw-bold">{statistics.total}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#2196f3" }}
                      >
                        <Users size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} sm={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#fff3e0" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Pending Collection</p>
                        <h3 className="mb-0 fw-bold">{statistics.pending_collection}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#ff9800" }}
                      >
                        <Clock size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} sm={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#e1f5fe" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">In Process</p>
                        <h3 className="mb-0 fw-bold">{statistics.in_process}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#03a9f4" }}
                      >
                        <RefreshCw size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} sm={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#e8f5e9" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Ready/Delivered</p>
                        <h3 className="mb-0 fw-bold">{statistics.ready + statistics.delivered}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#4caf50" }}
                      >
                        <CheckCircle size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Urgent Cards */}
            <Row className="mb-4">
              <Col md={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#ffebee" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">🔥 Urgent Cases</p>
                        <h3 className="mb-0 fw-bold">{statistics.urgent}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#f44336" }}
                      >
                        <AlertCircle size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#fff9c4" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">⚠️ High Priority</p>
                        <h3 className="mb-0 fw-bold">{statistics.high}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#fbc02d" }}
                      >
                        <TrendingUp size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Search and Filters */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body>
                <Row className="g-3">
                  <Col md={3}>
                    <div className="position-relative">
                      <Search className="position-absolute" style={{ top: "12px", left: "12px" }} size={18} />
                      <Form.Control
                        type="text"
                        placeholder="Search by name, passport, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: "40px" }}
                      />
                    </div>
                  </Col>

                  <Col md={2}>
                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="pending_collection">Pending Collection</option>
                      <option value="collected">Collected</option>
                      <option value="in_process">In Process</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </Form.Select>
                  </Col>

                  <Col md={2}>
                    <Form.Select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
                      <option value="all">All Priority</option>
                      <option value="urgent">🔥 Urgent</option>
                      <option value="high">⚠️ High</option>
                      <option value="normal">📋 Normal</option>
                      <option value="low">⬇️ Low</option>
                    </Form.Select>
                  </Col>

                  <Col md={2}>
                    <Form.Select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
                      <option value="all">All Agents</option>
                      <option value="AG001">Ali Travels</option>
                      <option value="AG002">Pak Tours</option>
                      <option value="AG003">Global Travels</option>
                    </Form.Select>
                  </Col>

                  <Col md={3} className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setUrgencyFilter("all");
                        setAgentFilter("all");
                      }}
                      className="w-100"
                    >
                      Clear Filters
                    </Button>
                    <Button variant="outline-primary" className="w-100">
                      <Download size={18} className="me-2" />
                      Export
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Leads Table */}
            <Card className="shadow-sm border-0">
              <Card.Body style={{ overflowX: "auto" }}>
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading leads...</p>
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-5">
                    <AlertCircle size={48} className="text-muted mb-3" />
                    <h5 className="text-muted">No leads found</h5>
                    <p className="text-muted">Try adjusting your filters or add a new lead</p>
                  </div>
                ) : (
                  <table className="table table-hover">
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th style={{ minWidth: "50px" }}>ID</th>
                        <th style={{ minWidth: "150px" }}>Customer Name</th>
                        <th style={{ minWidth: "120px" }}>Phone</th>
                        <th style={{ minWidth: "120px" }}>Passport No.</th>
                        <th style={{ minWidth: "120px" }}>Agent</th>
                        <th style={{ minWidth: "140px" }}>Status</th>
                        <th style={{ minWidth: "110px" }}>Priority</th>
                        <th style={{ minWidth: "120px" }}>Expected Date</th>
                        <th style={{ minWidth: "100px" }}>Documents</th>
                        <th style={{ minWidth: "100px" }}>Follow-ups</th>
                        <th style={{ minWidth: "180px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td>{lead.id}</td>
                          <td className="fw-semibold">{lead.customer_name}</td>
                          <td>
                            <Phone size={14} className="me-1 text-muted" />
                            {lead.customer_phone}
                          </td>
                          <td>
                            <FileText size={14} className="me-1 text-muted" />
                            {lead.passport_number}
                          </td>
                          <td>{lead.agent_name}</td>
                          <td>{getStatusBadge(lead.passport_status)}</td>
                          <td>{getUrgencyBadge(lead.urgency)}</td>
                          <td>
                            <Calendar size={14} className="me-1 text-muted" />
                            {lead.expected_delivery_date || "N/A"}
                          </td>
                          <td>
                            {lead.documents_received ? (
                              <Badge bg="success">
                                <CheckCircle size={14} className="me-1" />
                                Received
                              </Badge>
                            ) : (
                              <Badge bg="warning">
                                <Clock size={14} className="me-1" />
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td>
                            <Badge bg="info">
                              <MessageSquare size={14} className="me-1" />
                              {lead.follow_ups.length}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => openFollowUpModal(lead)}
                                title="Add Follow-up"
                              >
                                <Bell size={16} />
                              </Button>
                              <Button size="sm" variant="outline-primary" onClick={() => openViewModal(lead)} title="View Details">
                                <Eye size={16} />
                              </Button>
                              <Button size="sm" variant="outline-info" onClick={() => openEditModal(lead)} title="Edit">
                                <Edit2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>

      {/* Add Lead Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Plus size={24} className="me-2" />
            Add New Passport Lead
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label>Customer Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter customer name"
                  value={leadForm.customer_name}
                  onChange={(e) => setLeadForm({ ...leadForm, customer_name: e.target.value })}
                  required
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Phone Number *</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="+92-300-1234567"
                  value={leadForm.customer_phone}
                  onChange={(e) => setLeadForm({ ...leadForm, customer_phone: e.target.value })}
                  required
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="customer@example.com"
                  value={leadForm.customer_email}
                  onChange={(e) => setLeadForm({ ...leadForm, customer_email: e.target.value })}
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>CNIC</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="12345-1234567-1"
                  value={leadForm.customer_cnic}
                  onChange={(e) => setLeadForm({ ...leadForm, customer_cnic: e.target.value })}
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Agent *</Form.Label>
                <Form.Select
                  value={leadForm.agent_id}
                  onChange={(e) => {
                    const agentId = e.target.value;
                    const agentNames = { AG001: "Ali Travels", AG002: "Pak Tours", AG003: "Global Travels" };
                    setLeadForm({ ...leadForm, agent_id: agentId, agent_name: agentNames[agentId] || "" });
                  }}
                  required
                >
                  <option value="">Select Agent</option>
                  <option value="AG001">Ali Travels</option>
                  <option value="AG002">Pak Tours</option>
                  <option value="AG003">Global Travels</option>
                </Form.Select>
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Passport Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="AB1234567"
                  value={leadForm.passport_number}
                  onChange={(e) => setLeadForm({ ...leadForm, passport_number: e.target.value })}
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Priority *</Form.Label>
                <Form.Select
                  value={leadForm.urgency}
                  onChange={(e) => setLeadForm({ ...leadForm, urgency: e.target.value })}
                  required
                >
                  <option value="urgent">🔥 Urgent</option>
                  <option value="high">⚠️ High</option>
                  <option value="normal">📋 Normal</option>
                  <option value="low">⬇️ Low</option>
                </Form.Select>
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Expected Delivery Date</Form.Label>
                <Form.Control
                  type="date"
                  value={leadForm.expected_delivery_date}
                  onChange={(e) => setLeadForm({ ...leadForm, expected_delivery_date: e.target.value })}
                />
              </Col>

              <Col md={12} className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Add any additional notes..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddLead}>
            <Plus size={18} className="me-2" />
            Add Lead
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Edit2 size={24} className="me-2" />
            Edit Passport Lead
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label>Customer Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={leadForm.customer_name}
                  onChange={(e) => setLeadForm({ ...leadForm, customer_name: e.target.value })}
                  required
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Phone Number *</Form.Label>
                <Form.Control
                  type="tel"
                  value={leadForm.customer_phone}
                  onChange={(e) => setLeadForm({ ...leadForm, customer_phone: e.target.value })}
                  required
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Status *</Form.Label>
                <Form.Select
                  value={leadForm.passport_status}
                  onChange={(e) => setLeadForm({ ...leadForm, passport_status: e.target.value })}
                  required
                >
                  <option value="pending_collection">Pending Collection</option>
                  <option value="collected">Collected</option>
                  <option value="in_process">In Process</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Priority *</Form.Label>
                <Form.Select
                  value={leadForm.urgency}
                  onChange={(e) => setLeadForm({ ...leadForm, urgency: e.target.value })}
                  required
                >
                  <option value="urgent">🔥 Urgent</option>
                  <option value="high">⚠️ High</option>
                  <option value="normal">📋 Normal</option>
                  <option value="low">⬇️ Low</option>
                </Form.Select>
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Collection Date</Form.Label>
                <Form.Control
                  type="date"
                  value={leadForm.collection_date}
                  onChange={(e) => setLeadForm({ ...leadForm, collection_date: e.target.value })}
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Expected Delivery Date</Form.Label>
                <Form.Control
                  type="date"
                  value={leadForm.expected_delivery_date}
                  onChange={(e) => setLeadForm({ ...leadForm, expected_delivery_date: e.target.value })}
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Actual Delivery Date</Form.Label>
                <Form.Control
                  type="date"
                  value={leadForm.actual_delivery_date}
                  onChange={(e) => setLeadForm({ ...leadForm, actual_delivery_date: e.target.value })}
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Documents Received"
                  checked={leadForm.documents_received}
                  onChange={(e) => setLeadForm({ ...leadForm, documents_received: e.target.checked })}
                  className="mt-4"
                />
              </Col>

              <Col md={12} className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditLead}>
            <Edit2 size={18} className="me-2" />
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Lead Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Eye size={24} className="me-2" />
            Passport Lead Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLead && (
            <Tabs defaultActiveKey="details" className="mb-3">
              {/* Details Tab */}
              <Tab eventKey="details" title="Details">
                <Row className="g-3">
                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Customer Name</small>
                      <div className="fw-bold">{selectedLead.customer_name}</div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Phone Number</small>
                      <div className="fw-bold">
                        <Phone size={14} className="me-1" />
                        {selectedLead.customer_phone}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Email</small>
                      <div className="fw-bold">
                        <Mail size={14} className="me-1" />
                        {selectedLead.customer_email || "N/A"}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">CNIC</small>
                      <div className="fw-bold">{selectedLead.customer_cnic || "N/A"}</div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Passport Number</small>
                      <div className="fw-bold">
                        <FileText size={14} className="me-1" />
                        {selectedLead.passport_number || "N/A"}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Agent</small>
                      <div className="fw-bold">{selectedLead.agent_name}</div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Status</small>
                      <div>{getStatusBadge(selectedLead.passport_status)}</div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Priority</small>
                      <div>{getUrgencyBadge(selectedLead.urgency)}</div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Collection Date</small>
                      <div className="fw-bold">
                        <Calendar size={14} className="me-1" />
                        {selectedLead.collection_date || "Not Collected"}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Expected Delivery</small>
                      <div className="fw-bold">
                        <Calendar size={14} className="me-1" />
                        {selectedLead.expected_delivery_date || "N/A"}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Actual Delivery</small>
                      <div className="fw-bold">
                        <Calendar size={14} className="me-1" />
                        {selectedLead.actual_delivery_date || "Not Delivered"}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Documents</small>
                      <div>
                        {selectedLead.documents_received ? (
                          <Badge bg="success">
                            <CheckCircle size={14} className="me-1" />
                            Received
                          </Badge>
                        ) : (
                          <Badge bg="warning">
                            <Clock size={14} className="me-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Col>

                  <Col md={12}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Notes</small>
                      <div className="fw-bold">{selectedLead.notes || "No notes"}</div>
                    </div>
                  </Col>
                </Row>
              </Tab>

              {/* Follow-ups Tab */}
              <Tab eventKey="followups" title={`Follow-ups (${selectedLead.follow_ups.length})`}>
                {selectedLead.follow_ups.length === 0 ? (
                  <div className="text-center py-4">
                    <MessageSquare size={48} className="text-muted mb-3" />
                    <p className="text-muted">No follow-ups recorded yet</p>
                  </div>
                ) : (
                  <div>
                    {selectedLead.follow_ups.map((followUp) => (
                      <Card key={followUp.id} className="mb-3 border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <Badge bg="primary" className="me-2">
                                {followUp.type.toUpperCase()}
                              </Badge>
                              {getStatusBadge(followUp.status)}
                            </div>
                            <small className="text-muted">
                              <Calendar size={14} className="me-1" />
                              {followUp.date}
                            </small>
                          </div>
                          <p className="mb-2">{followUp.notes}</p>
                          {followUp.next_follow_up && (
                            <small className="text-muted">
                              <Bell size={14} className="me-1" />
                              Next Follow-up: {followUp.next_follow_up}
                            </small>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          <Button variant="success" onClick={() => {
            setShowViewModal(false);
            openFollowUpModal(selectedLead);
          }}>
            <Bell size={18} className="me-2" />
            Add Follow-up
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Follow-up Modal */}
      <Modal show={showFollowUpModal} onHide={() => setShowFollowUpModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Bell size={24} className="me-2" />
            Add Follow-up - {selectedLead?.customer_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label>Follow-up Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={followUpForm.follow_up_date}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, follow_up_date: e.target.value })}
                  required
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Follow-up Type *</Form.Label>
                <Form.Select
                  value={followUpForm.follow_up_type}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, follow_up_type: e.target.value })}
                  required
                >
                  <option value="phone">📞 Phone Call</option>
                  <option value="email">📧 Email</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="visit">🏢 Office Visit</option>
                  <option value="sms">📱 SMS</option>
                </Form.Select>
              </Col>

              <Col md={12} className="mb-3">
                <Form.Label>Follow-up Notes *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Enter details of the follow-up..."
                  value={followUpForm.follow_up_notes}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, follow_up_notes: e.target.value })}
                  required
                />
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Update Status (Optional)</Form.Label>
                <Form.Select
                  value={followUpForm.status_update}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, status_update: e.target.value })}
                >
                  <option value="">Keep Current Status</option>
                  <option value="pending_collection">Pending Collection</option>
                  <option value="collected">Collected</option>
                  <option value="in_process">In Process</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Col>

              <Col md={6} className="mb-3">
                <Form.Label>Next Follow-up Date (Optional)</Form.Label>
                <Form.Control
                  type="date"
                  value={followUpForm.next_follow_up_date}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, next_follow_up_date: e.target.value })}
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFollowUpModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAddFollowUp}>
            <Bell size={18} className="me-2" />
            Add Follow-up
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Responsive CSS */}
      <style jsx>{`
        @media (max-width: 991.98px) {
          .page-container {
            flex-direction: column !important;
          }
          .content-wrapper {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
};

export default PassportLeads;
