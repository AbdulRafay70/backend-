import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Badge, Modal, Alert, Tabs, Tab } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { 
  Building2, Phone, Mail, Calendar, MessageSquare, TrendingUp, 
  AlertTriangle, CheckCircle, XCircle, Clock, Users, Briefcase,
  FileText, Edit, Trash2, Plus, Search, Filter, Eye, Star,
  ThumbsUp, ThumbsDown, BarChart3, PieChart, Activity
} from "lucide-react";
import axios from "axios";

const AgencyProfile = () => {
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [activeTab, setActiveTab] = useState("overview");

  // Form states
  const [historyForm, setHistoryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "discussion",
    note: ""
  });

  const [conflictForm, setConflictForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: "",
    resolved: false,
    resolution_note: ""
  });

  const [communicationForm, setCommunicationForm] = useState({
    date: new Date().toISOString().split('T')[0],
    by: "Admin",
    message: ""
  });

  const [companyForm, setCompanyForm] = useState({
    organization_id: "",
    organization_name: "",
    work_type: []
  });

  // Relationship types with colors
  const relationshipTypes = {
    discussion: { label: "Discussion", color: "#0dcaf0", icon: MessageSquare },
    meeting: { label: "Meeting", color: "#198754", icon: Users },
    conflict: { label: "Conflict", color: "#dc3545", icon: AlertTriangle },
    payment: { label: "Payment", color: "#ffc107", icon: TrendingUp },
    update: { label: "Update", color: "#6c757d", icon: FileText }
  };

  // Status colors
  const statusColors = {
    active: { bg: "#d1fae5", text: "#065f46", icon: CheckCircle },
    inactive: { bg: "#fee2e2", text: "#991b1b", icon: XCircle },
    risky: { bg: "#fef3c7", text: "#92400e", icon: AlertTriangle },
    dispute: { bg: "#fecaca", text: "#7f1d1d", icon: AlertTriangle }
  };

  // Demo data for testing
  const demoAgencies = [
    {
      agency_id: 1,
      agency_name: "Al Saer Travels",
      contact_person: "Ahmed Khan",
      contact_number: "+92-3001234567",
      relationship_status: "active"
    },
    {
      agency_id: 2,
      agency_name: "Dream Travels",
      contact_person: "Fatima Ali",
      contact_number: "+92-3009876543",
      relationship_status: "risky"
    },
    {
      agency_id: 3,
      agency_name: "Sky High Tours",
      contact_person: "Usman Malik",
      contact_number: "+92-3005555555",
      relationship_status: "inactive"
    }
  ];

  const demoProfile = {
    agency_id: 1,
    agency_name: "Al Saer Travels",
    contact_person: "Ahmed Khan",
    contact_number: "+92-3001234567",
    relationship_status: "active",
    relation_history: [
      {
        date: "2025-10-15",
        type: "discussion",
        note: "Talked about new Umrah rates and seasonal packages"
      },
      {
        date: "2025-09-20",
        type: "conflict",
        note: "Delayed payment for 2 weeks - resolved after discussion"
      },
      {
        date: "2025-08-10",
        type: "meeting",
        note: "Office meeting to discuss partnership terms"
      }
    ],
    working_with_companies: [
      {
        organization_id: 1,
        organization_name: "Saer.pk",
        work_type: ["Umrah Packages", "Tickets", "Hotels"]
      },
      {
        organization_id: 2,
        organization_name: "Al Noor Travels",
        work_type: ["Hotels", "Visa"]
      }
    ],
    performance_summary: {
      total_bookings: 85,
      on_time_payments: 79,
      late_payments: 6,
      disputes: 1,
      remarks: "Overall good performance, some delay in payments during peak season."
    },
    recent_communication: [
      {
        date: "2025-10-10",
        by: "Admin",
        message: "Confirmed next Umrah batch for December"
      },
      {
        date: "2025-10-05",
        by: "Sales Team",
        message: "Shared updated hotel rates for Makkah and Madina"
      }
    ],
    conflict_history: [
      {
        date: "2025-08-25",
        reason: "Misunderstanding over refund policy",
        resolved: true,
        resolution_note: "Clarified policy and issued refund"
      }
    ]
  };

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = () => {
    // In production, fetch from API
    // For now, using demo data
    setAgencies(demoAgencies);
  };

  const loadAgencyProfile = async (agencyId) => {
    setLoading(true);
    try {
      // In production:
      // const response = await axios.get(`http://127.0.0.1:8000/api/agency/profile?agency_id=${agencyId}`);
      // setSelectedAgency(response.data);
      
      // Using demo data
      setSelectedAgency(demoProfile);
      showAlert("success", "Agency profile loaded successfully!");
    } catch (error) {
      console.error("Error loading agency profile:", error);
      showAlert("danger", "Failed to load agency profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHistory = () => {
    if (!historyForm.note) {
      showAlert("warning", "Please enter a note");
      return;
    }

    const updatedProfile = {
      ...selectedAgency,
      relation_history: [historyForm, ...selectedAgency.relation_history]
    };

    setSelectedAgency(updatedProfile);
    setHistoryForm({ date: new Date().toISOString().split('T')[0], type: "discussion", note: "" });
    setShowHistoryModal(false);
    showAlert("success", "Relationship history added successfully!");
  };

  const handleAddConflict = () => {
    if (!conflictForm.reason) {
      showAlert("warning", "Please enter conflict reason");
      return;
    }

    const updatedProfile = {
      ...selectedAgency,
      conflict_history: [conflictForm, ...selectedAgency.conflict_history]
    };

    setSelectedAgency(updatedProfile);
    setConflictForm({ date: new Date().toISOString().split('T')[0], reason: "", resolved: false, resolution_note: "" });
    setShowConflictModal(false);
    showAlert("success", "Conflict record added successfully!");
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  const getStatusBadge = (status) => {
    const statusInfo = statusColors[status] || statusColors.active;
    const Icon = statusInfo.icon;
    return (
      <Badge 
        style={{ 
          backgroundColor: statusInfo.bg, 
          color: statusInfo.text,
          padding: "8px 16px",
          fontWeight: 500,
          fontSize: "14px"
        }}
      >
        <Icon size={16} style={{ marginRight: "6px" }} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRelationTypeIcon = (type) => {
    const typeInfo = relationshipTypes[type] || relationshipTypes.discussion;
    const Icon = typeInfo.icon;
    return <Icon size={20} style={{ color: typeInfo.color }} />;
  };

  const filteredAgencies = agencies.filter(agency =>
    agency.agency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
    <div className="page-container" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Sidebar />
      <div className="content-wrapper" style={{ flex: 1, overflow: "auto" }}>
          <Header />
          
          <Container fluid className="p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1" style={{ fontWeight: 600, color: "#2c3e50" }}>
                  <Building2 size={32} className="me-2" style={{ color: "#1B78CE" }} />
                  Agency Relationship Management
                </h2>
                <p className="text-muted mb-0">View and manage agency profiles, relationships, and performance</p>
              </div>
            </div>

            {/* Alert */}
            {alert.show && (
              <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, type: "", message: "" })}>
                {alert.message}
              </Alert>
            )}

            <Row className="g-4">
              {/* Agencies List - Left Sidebar */}
              <Col lg={4}>
                <Card className="shadow-sm" style={{ border: "none", height: "calc(100vh - 220px)" }}>
                  <Card.Body className="p-0">
                    <div className="p-3 border-bottom" style={{ backgroundColor: "#f8f9fa" }}>
                      <h5 className="mb-3" style={{ fontWeight: 600 }}>
                        <Users size={20} className="me-2" />
                        Agencies ({filteredAgencies.length})
                      </h5>
                      <Form.Control
                        type="text"
                        placeholder="Search agencies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ borderRadius: "8px" }}
                      />
                    </div>

                    <div style={{ overflowY: "auto", height: "calc(100% - 140px)" }}>
                      {filteredAgencies.map((agency) => (
                        <div
                          key={agency.agency_id}
                          onClick={() => loadAgencyProfile(agency.agency_id)}
                          style={{
                            padding: "16px",
                            borderBottom: "1px solid #e9ecef",
                            cursor: "pointer",
                            backgroundColor: selectedAgency?.agency_id === agency.agency_id ? "#e3f2fd" : "white",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedAgency?.agency_id === agency.agency_id ? "#e3f2fd" : "white"}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0" style={{ fontWeight: 600, color: "#2c3e50" }}>
                              {agency.agency_name}
                            </h6>
                            {getStatusBadge(agency.relationship_status)}
                          </div>
                          <p className="mb-1 text-muted" style={{ fontSize: "14px" }}>
                            <Phone size={14} className="me-1" />
                            {agency.contact_person}
                          </p>
                          <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>
                            {agency.contact_number}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Agency Profile Details - Main Content */}
              <Col lg={8}>
                {selectedAgency ? (
                  <div>
                    {/* Profile Header Card */}
                    <Card className="shadow-sm mb-4" style={{ border: "none" }}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h3 style={{ fontWeight: 600, color: "#2c3e50" }}>
                              {selectedAgency.agency_name}
                            </h3>
                            <p className="text-muted mb-2">{selectedAgency.contact_person}</p>
                            <div className="d-flex gap-3">
                              <span className="text-muted">
                                <Phone size={16} className="me-1" />
                                {selectedAgency.contact_number}
                              </span>
                            </div>
                          </div>
                          <div className="text-end">
                            {getStatusBadge(selectedAgency.relationship_status)}
                            <div className="mt-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                style={{ borderRadius: "8px" }}
                              >
                                <Edit size={16} className="me-1" />
                                Edit Profile
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Performance Summary Cards */}
                        <Row className="g-3">
                          <Col md={3}>
                            <div className="text-center p-3" style={{ backgroundColor: "#e3f2fd", borderRadius: "12px" }}>
                              <Briefcase size={24} style={{ color: "#1976d2", marginBottom: "8px" }} />
                              <h4 className="mb-0" style={{ color: "#1976d2", fontWeight: 600 }}>
                                {selectedAgency.performance_summary.total_bookings}
                              </h4>
                              <small className="text-muted">Total Bookings</small>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div className="text-center p-3" style={{ backgroundColor: "#d1fae5", borderRadius: "12px" }}>
                              <CheckCircle size={24} style={{ color: "#059669", marginBottom: "8px" }} />
                              <h4 className="mb-0" style={{ color: "#059669", fontWeight: 600 }}>
                                {selectedAgency.performance_summary.on_time_payments}
                              </h4>
                              <small className="text-muted">On-Time Payments</small>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div className="text-center p-3" style={{ backgroundColor: "#fef3c7", borderRadius: "12px" }}>
                              <Clock size={24} style={{ color: "#d97706", marginBottom: "8px" }} />
                              <h4 className="mb-0" style={{ color: "#d97706", fontWeight: 600 }}>
                                {selectedAgency.performance_summary.late_payments}
                              </h4>
                              <small className="text-muted">Late Payments</small>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div className="text-center p-3" style={{ backgroundColor: "#fee2e2", borderRadius: "12px" }}>
                              <AlertTriangle size={24} style={{ color: "#dc2626", marginBottom: "8px" }} />
                              <h4 className="mb-0" style={{ color: "#dc2626", fontWeight: 600 }}>
                                {selectedAgency.performance_summary.disputes}
                              </h4>
                              <small className="text-muted">Disputes</small>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Tabs for Different Sections */}
                    <Card className="shadow-sm" style={{ border: "none" }}>
                      <Card.Body className="p-0">
                        <Tabs
                          activeKey={activeTab}
                          onSelect={(k) => setActiveTab(k)}
                          className="px-3 pt-3"
                          style={{ borderBottom: "2px solid #e9ecef" }}
                        >
                          <Tab eventKey="overview" title={<span><Activity size={16} className="me-1" />Overview</span>}>
                            <div className="p-4">
                              {/* Working Companies */}
                              <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h5 style={{ fontWeight: 600 }}>
                                    <Briefcase size={20} className="me-2" />
                                    Working With Companies
                                  </h5>
                                  <Button variant="outline-primary" size="sm" style={{ borderRadius: "8px" }}>
                                    <Plus size={16} className="me-1" />
                                    Add Company
                                  </Button>
                                </div>
                                <Row className="g-3">
                                  {selectedAgency.working_with_companies.map((company, index) => (
                                    <Col md={6} key={index}>
                                      <Card style={{ border: "1px solid #e9ecef", borderRadius: "12px" }}>
                                        <Card.Body>
                                          <h6 style={{ fontWeight: 600, color: "#2c3e50" }}>
                                            {company.organization_name}
                                          </h6>
                                          <div className="mt-2">
                                            {company.work_type.map((type, idx) => (
                                              <Badge
                                                key={idx}
                                                bg="light"
                                                text="dark"
                                                className="me-2 mb-1"
                                                style={{ fontWeight: 400 }}
                                              >
                                                {type}
                                              </Badge>
                                            ))}
                                          </div>
                                        </Card.Body>
                                      </Card>
                                    </Col>
                                  ))}
                                </Row>
                              </div>

                              {/* Performance Remarks */}
                              <div className="mb-4">
                                <h5 style={{ fontWeight: 600 }} className="mb-3">
                                  <BarChart3 size={20} className="me-2" />
                                  Performance Remarks
                                </h5>
                                <Alert variant="info" style={{ borderRadius: "12px", border: "none" }}>
                                  <FileText size={20} className="me-2" />
                                  {selectedAgency.performance_summary.remarks}
                                </Alert>
                              </div>
                            </div>
                          </Tab>

                          <Tab eventKey="history" title={<span><Clock size={16} className="me-1" />Relation History</span>}>
                            <div className="p-4">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 style={{ fontWeight: 600 }}>Relationship Timeline</h5>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setShowHistoryModal(true)}
                                  style={{ borderRadius: "8px" }}
                                >
                                  <Plus size={16} className="me-1" />
                                  Add Entry
                                </Button>
                              </div>

                              <div style={{ position: "relative", paddingLeft: "40px" }}>
                                {selectedAgency.relation_history.map((entry, index) => (
                                  <div key={index} className="mb-4" style={{ position: "relative" }}>
                                    {/* Timeline dot */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: "-32px",
                                        top: "8px",
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        backgroundColor: relationshipTypes[entry.type]?.color || "#6c757d",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                    >
                                      {getRelationTypeIcon(entry.type)}
                                    </div>

                                    {/* Timeline line */}
                                    {index !== selectedAgency.relation_history.length - 1 && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          left: "-16px",
                                          top: "40px",
                                          width: "2px",
                                          height: "calc(100% + 16px)",
                                          backgroundColor: "#e9ecef"
                                        }}
                                      />
                                    )}

                                    <Card style={{ border: "1px solid #e9ecef", borderRadius: "12px" }}>
                                      <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                          <Badge
                                            style={{
                                              backgroundColor: relationshipTypes[entry.type]?.color || "#6c757d",
                                              fontWeight: 500
                                            }}
                                          >
                                            {relationshipTypes[entry.type]?.label || entry.type}
                                          </Badge>
                                          <small className="text-muted">
                                            <Calendar size={14} className="me-1" />
                                            {new Date(entry.date).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </small>
                                        </div>
                                        <p className="mb-0" style={{ color: "#495057" }}>{entry.note}</p>
                                      </Card.Body>
                                    </Card>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </Tab>

                          <Tab eventKey="communication" title={<span><MessageSquare size={16} className="me-1" />Communication</span>}>
                            <div className="p-4">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 style={{ fontWeight: 600 }}>Recent Communication</h5>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  style={{ borderRadius: "8px" }}
                                >
                                  <Plus size={16} className="me-1" />
                                  Add Message
                                </Button>
                              </div>

                              {selectedAgency.recent_communication.map((comm, index) => (
                                <Card key={index} className="mb-3" style={{ border: "1px solid #e9ecef", borderRadius: "12px" }}>
                                  <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <div>
                                        <Badge bg="secondary" className="me-2">{comm.by}</Badge>
                                        <small className="text-muted">
                                          <Calendar size={14} className="me-1" />
                                          {new Date(comm.date).toLocaleDateString()}
                                        </small>
                                      </div>
                                    </div>
                                    <p className="mb-0">{comm.message}</p>
                                  </Card.Body>
                                </Card>
                              ))}
                            </div>
                          </Tab>

                          <Tab eventKey="conflicts" title={<span><AlertTriangle size={16} className="me-1" />Conflicts</span>}>
                            <div className="p-4">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 style={{ fontWeight: 600 }}>Conflict History</h5>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setShowConflictModal(true)}
                                  style={{ borderRadius: "8px" }}
                                >
                                  <Plus size={16} className="me-1" />
                                  Report Conflict
                                </Button>
                              </div>

                              {selectedAgency.conflict_history.map((conflict, index) => (
                                <Card key={index} className="mb-3" style={{ border: "1px solid #e9ecef", borderRadius: "12px" }}>
                                  <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                      <div className="d-flex align-items-center gap-2">
                                        <AlertTriangle size={20} style={{ color: conflict.resolved ? "#059669" : "#dc2626" }} />
                                        <div>
                                          <small className="text-muted">
                                            <Calendar size={14} className="me-1" />
                                            {new Date(conflict.date).toLocaleDateString()}
                                          </small>
                                        </div>
                                      </div>
                                      {conflict.resolved ? (
                                        <Badge bg="success">
                                          <CheckCircle size={14} className="me-1" />
                                          Resolved
                                        </Badge>
                                      ) : (
                                        <Badge bg="danger">
                                          <XCircle size={14} className="me-1" />
                                          Pending
                                        </Badge>
                                      )}
                                    </div>
                                    <h6 style={{ fontWeight: 600, color: "#2c3e50" }}>Reason:</h6>
                                    <p className="mb-2">{conflict.reason}</p>
                                    {conflict.resolved && conflict.resolution_note && (
                                      <>
                                        <h6 style={{ fontWeight: 600, color: "#2c3e50" }}>Resolution:</h6>
                                        <Alert variant="success" className="mb-0" style={{ borderRadius: "8px" }}>
                                          {conflict.resolution_note}
                                        </Alert>
                                      </>
                                    )}
                                  </Card.Body>
                                </Card>
                              ))}
                            </div>
                          </Tab>
                        </Tabs>
                      </Card.Body>
                    </Card>
                  </div>
                ) : (
                  <Card className="shadow-sm" style={{ border: "none", height: "calc(100vh - 220px)" }}>
                    <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                      <Building2 size={64} style={{ color: "#cbd5e1", marginBottom: "16px" }} />
                      <h4 className="text-muted">Select an agency to view profile</h4>
                      <p className="text-muted">Choose an agency from the list to see detailed relationship information</p>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          </Container>
      </div>

      {/* Add History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <Clock size={24} className="me-2" />
            Add Relationship History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={historyForm.date}
                onChange={(e) => setHistoryForm({ ...historyForm, date: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={historyForm.type}
                onChange={(e) => setHistoryForm({ ...historyForm, type: e.target.value })}
              >
                {Object.entries(relationshipTypes).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Note *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={historyForm.note}
                onChange={(e) => setHistoryForm({ ...historyForm, note: e.target.value })}
                placeholder="Enter detailed note about this interaction..."
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddHistory}>
            <Plus size={18} className="me-1" />
            Add Entry
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Conflict Modal */}
      <Modal show={showConflictModal} onHide={() => setShowConflictModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <AlertTriangle size={24} className="me-2" />
            Report Conflict
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={conflictForm.date}
                onChange={(e) => setConflictForm({ ...conflictForm, date: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reason *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={conflictForm.reason}
                onChange={(e) => setConflictForm({ ...conflictForm, reason: e.target.value })}
                placeholder="Describe the conflict..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Conflict Resolved"
                checked={conflictForm.resolved}
                onChange={(e) => setConflictForm({ ...conflictForm, resolved: e.target.checked })}
              />
            </Form.Group>

            {conflictForm.resolved && (
              <Form.Group className="mb-3">
                <Form.Label>Resolution Note</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={conflictForm.resolution_note}
                  onChange={(e) => setConflictForm({ ...conflictForm, resolution_note: e.target.value })}
                  placeholder="How was this conflict resolved..."
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConflictModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleAddConflict}>
            <Plus size={18} className="me-1" />
            Add Conflict
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
    
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

export default AgencyProfile;
