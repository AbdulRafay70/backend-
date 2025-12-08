import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
  Spinner,
  Modal,
  Table,
  InputGroup,
  Pagination,
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  Calendar,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  BarChart3,
  TrendingUp,
  FileText,
  Copy,
} from "lucide-react";
import axios from "axios";
import "./styles/customer-leads.css";

const CustomerLead = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchType, setSearchType] = useState("passport");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);

  const [selectedLead, setSelectedLead] = useState(null);

  const [leadForm, setLeadForm] = useState({
    branch_id: "",
    lead_type: "walkin",
    customer_name: "",
    passport_number: "",
    contact_number: "",
    cnic: "",
    email: "",
    address: "",
    notes: "",
    lead_status: "pending",
    source: "office_walkin",
    loan_amount: "",
    loan_date: "",
    loan_status: "pending",
    next_followup_date: "",
    next_followup_notes: "",
  });

  const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
  const organizationId = orgData?.id;
  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId") || "emp_001";

  const demoBranches = [
    { id: 1, name: "Lahore Main Branch" },
    { id: 2, name: "Karachi Branch" },
    { id: 3, name: "Islamabad Branch" },
    { id: 4, name: "Faisalabad Branch" },
    { id: 5, name: "Multan Branch" },
  ];

  const demoLeads = [
    {
      id: 1,
      branch_id: 1,
      branch_name: "Lahore Main Branch",
      lead_type: "walkin",
      customer_name: "Ahmed Khan",
      passport_number: "AB1234567",
      contact_number: "+923001234567",
      cnic: "35202-1234567-1",
      email: "ahmed@gmail.com",
      address: "Lahore, Pakistan",
      notes: "Visited office for Umrah info",
      lead_status: "active",
      source: "office_walkin",
      loan_amount: "50000",
      loan_date: "2025-11-01",
      loan_status: "active",
      next_followup_date: "2025-11-20",
      next_followup_notes: "Call for booking confirmation",
      created_by: "emp_001",
      created_at: "2025-11-01",
      updated_at: "2025-11-18",
    },
    {
      id: 2,
      branch_id: 2,
      branch_name: "Karachi Branch",
      lead_type: "call",
      customer_name: "Fatima Ali",
      passport_number: "CD9876543",
      contact_number: "+923012345678",
      cnic: "35401-2345678-9",
      email: "fatima@gmail.com",
      address: "Karachi, Pakistan",
      notes: "Called for Hajj package details",
      lead_status: "active",
      source: "phone_call",
      loan_amount: "75000",
      loan_date: "2025-10-15",
      loan_status: "completed",
      next_followup_date: "2025-11-25",
      next_followup_notes: "Payment reminder",
      created_by: "emp_002",
      created_at: "2025-10-15",
      updated_at: "2025-11-18",
    },
    {
      id: 3,
      branch_id: 3,
      branch_name: "Islamabad Branch",
      lead_type: "walkin",
      customer_name: "Muhammad Hassan",
      passport_number: "EF5555666",
      contact_number: "+923023456789",
      cnic: "31401-3456789-1",
      email: "hassan@gmail.com",
      address: "Islamabad, Pakistan",
      notes: "Walk-in for ticket booking",
      lead_status: "pending",
      source: "office_walkin",
      loan_amount: "30000",
      loan_date: "2025-11-15",
      loan_status: "pending",
      next_followup_date: "2025-11-22",
      next_followup_notes: "Follow up on payment",
      created_by: "emp_003",
      created_at: "2025-11-15",
      updated_at: "2025-11-18",
    },
    {
      id: 4,
      branch_id: 1,
      branch_name: "Lahore Main Branch",
      lead_type: "call",
      customer_name: "Sara Malik",
      passport_number: "GH7777888",
      contact_number: "+923034567890",
      cnic: "37201-4567890-2",
      email: "sara@gmail.com",
      address: "Lahore, Pakistan",
      notes: "Interested in family package",
      lead_status: "active",
      source: "whatsapp",
      loan_amount: "100000",
      loan_date: "2025-10-01",
      loan_status: "overdue",
      next_followup_date: "2025-11-19",
      next_followup_notes: "Urgent: Payment overdue",
      created_by: "emp_001",
      created_at: "2025-10-01",
      updated_at: "2025-11-18",
    },
    {
      id: 5,
      branch_id: 4,
      branch_name: "Faisalabad Branch",
      lead_type: "walkin",
      customer_name: "Usman Ahmed",
      passport_number: "IJ9999000",
      contact_number: "+923045678901",
      cnic: "32201-5678901-3",
      email: "usman@gmail.com",
      address: "Faisalabad, Pakistan",
      notes: "Inquiry for Umrah with family",
      lead_status: "inactive",
      source: "office_walkin",
      loan_amount: null,
      loan_date: null,
      loan_status: "pending",
      next_followup_date: null,
      next_followup_notes: null,
      created_by: "emp_004",
      created_at: "2025-11-10",
      updated_at: "2025-11-15",
    },
  ];

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://api.saer.pk/api/area-leads/`, {
        params: { organization: organizationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data && response.data.length > 0 ? response.data : demoLeads;
      setLeads(data);
      setFilteredLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
      setLeads(demoLeads);
      setFilteredLeads(demoLeads);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`https://api.saer.pk/api/branches/`, {
        params: { organization: organizationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(response.data && response.data.length > 0 ? response.data : demoBranches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      setBranches(demoBranches);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      showAlert("warning", "Please enter search query");
      return;
    }

    try {
      setSearching(true);
      const params = {};
      if (searchType === "passport") {
        params.passport_number = searchQuery;
      } else {
        params.contact_number = searchQuery;
      }

      const response = await axios.get(`https://api.saer.pk/api/area-leads/search`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearchResults(Array.isArray(response.data) ? response.data : [response.data]);
      showAlert("success", `Found ${Array.isArray(response.data) ? response.data.length : 1} result(s)`);
    } catch (error) {
      console.error("Error searching:", error);
      const results = demoLeads.filter((lead) => {
        if (searchType === "passport") {
          return lead.passport_number.includes(searchQuery);
        } else {
          return lead.contact_number.includes(searchQuery);
        }
      });

      setSearchResults(results);
      if (results.length === 0) {
        showAlert("warning", "No results found");
      } else {
        showAlert("success", `Found ${results.length} result(s)`);
      }
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchLeads();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const handleAddLead = async () => {
    if (
      !leadForm.customer_name ||
      !leadForm.contact_number ||
      !leadForm.branch_id ||
      !leadForm.passport_number
    ) {
      showAlert("error", "Please fill all required fields");
      return;
    }

    try {
      const payload = {
        ...leadForm,
        organization_id: organizationId,
        created_by: userId,
      };

      await axios.post(`https://api.saer.pk/api/area-leads/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert("success", "Lead created successfully!");
      setShowAddModal(false);
      fetchLeads();
      resetForm();
    } catch (error) {
      showAlert("error", error.response?.data?.message || "Failed to create lead");
    }
  };

  const handleEditLead = async () => {
    try {
      await axios.put(
        `https://api.saer.pk/api/area-leads/${selectedLead.id}/`,
        leadForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showAlert("success", "Lead updated successfully!");
      setShowEditModal(false);
      fetchLeads();
      resetForm();
    } catch (error) {
      showAlert("error", "Failed to update lead");
    }
  };

  const handleDeleteLead = async () => {
    try {
      await axios.delete(`https://api.saer.pk/api/area-leads/${selectedLead.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert("success", "Lead deleted successfully!");
      setShowDeleteModal(false);
      fetchLeads();
    } catch (error) {
      showAlert("error", "Failed to delete lead");
    }
  };

  const resetForm = () => {
    setLeadForm({
      branch_id: "",
      lead_type: "walkin",
      customer_name: "",
      passport_number: "",
      contact_number: "",
      cnic: "",
      email: "",
      address: "",
      notes: "",
      lead_status: "pending",
      source: "office_walkin",
      loan_amount: "",
      loan_date: "",
      loan_status: "pending",
      next_followup_date: "",
      next_followup_notes: "",
    });
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setLeadForm(lead);
    setShowEditModal(true);
  };

  const openViewModal = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

  const openLoanModal = (lead) => {
    setSelectedLead(lead);
    setLeadForm(lead);
    setShowLoanModal(true);
  };

  const openDeleteModal = (lead) => {
    setSelectedLead(lead);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    const statuses = {
      pending: { bg: "warning", label: "Pending" },
      active: { bg: "success", label: "Active" },
      inactive: { bg: "danger", label: "Inactive" },
      completed: { bg: "info", label: "Completed" },
    };
    return statuses[status] || { bg: "secondary", label: status };
  };

  const getLoanStatusBadge = (status) => {
    const statuses = {
      pending: { bg: "warning", label: "Pending" },
      active: { bg: "primary", label: "Active" },
      completed: { bg: "success", label: "Completed" },
      overdue: { bg: "danger", label: "Overdue" },
    };
    return statuses[status] || { bg: "secondary", label: status };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showAlert("success", "Copied to clipboard!");
  };

  const stats = {
    total: leads.length,
    active: leads.filter((l) => l.lead_status === "active").length,
    pending: leads.filter((l) => l.lead_status === "pending").length,
    overdueLoan: leads.filter((l) => l.loan_status === "overdue").length,
  };

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <Container fluid className="py-4 px-3 px-md-4">
          {alert.show && (
            <Alert
              variant={alert.type}
              dismissible
              onClose={() => setAlert({ ...alert, show: false })}
            >
              {alert.message}
            </Alert>
          )}

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col xs={12} sm={6} lg={3} className="mb-3">
              <Card className="stat-card h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Total Leads</p>
                      <h3 className="mb-0">{stats.total}</h3>
                    </div>
                    <BarChart3 size={40} className="text-primary opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3} className="mb-3">
              <Card className="stat-card h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Active Leads</p>
                      <h3 className="mb-0">{stats.active}</h3>
                    </div>
                    <CheckCircle size={40} className="text-success opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3} className="mb-3">
              <Card className="stat-card h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Pending</p>
                      <h3 className="mb-0">{stats.pending}</h3>
                    </div>
                    <AlertCircle size={40} className="text-warning opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3} className="mb-3">
              <Card className="stat-card h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Overdue Loans</p>
                      <h3 className="mb-0">{stats.overdueLoan}</h3>
                    </div>
                    <DollarSign size={40} className="text-danger opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Content Card */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom py-3">
              <Row className="align-items-center">
                <Col xs={12} md={6}>
                  <h5 className="mb-0">Customer Leads (Passport Based)</h5>
                </Col>
                <Col xs={12} md={6} className="text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end flex-wrap">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowSearchModal(true)}
                    className="btn-sm"
                  >
                    <Search size={16} className="me-2" />
                    Search Lead
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      resetForm();
                      setShowAddModal(true);
                    }}
                    className="btn-sm"
                  >
                    <Plus size={16} className="me-2" />
                    Add Lead
                  </Button>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : paginatedLeads.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No leads found</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="text-nowrap">Customer</th>
                          <th className="text-nowrap">Contact</th>
                          <th className="text-nowrap">Passport</th>
                          <th className="text-nowrap">Branch</th>
                          <th className="text-nowrap">Status</th>
                          <th className="text-nowrap">Loan</th>
                          <th className="text-nowrap">Follow-up</th>
                          <th className="text-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLeads.map((lead) => (
                          <tr key={lead.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                                  style={{ width: "32px", height: "32px", marginRight: "8px" }}
                                >
                                  <User size={16} />
                                </div>
                                <div>
                                  <p className="mb-0 fw-500">{lead.customer_name}</p>
                                  <small className="text-muted text-capitalize">{lead.lead_type}</small>
                                </div>
                              </div>
                            </td>
                            <td className="text-nowrap">
                              <p className="mb-0 d-flex align-items-center">
                                <Phone size={14} className="me-2 text-muted" />
                                {lead.contact_number}
                              </p>
                              <small className="text-muted">{lead.email}</small>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <code>{lead.passport_number}</code>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                  onClick={() => copyToClipboard(lead.passport_number)}
                                >
                                  <Copy size={14} />
                                </Button>
                              </div>
                            </td>
                            <td>
                              <small>{lead.branch_name}</small>
                            </td>
                            <td>
                              <Badge bg={getStatusBadge(lead.lead_status).bg}>
                                {getStatusBadge(lead.lead_status).label}
                              </Badge>
                            </td>
                            <td>
                              {lead.loan_amount ? (
                                <Badge bg={getLoanStatusBadge(lead.loan_status).bg}>
                                  {getLoanStatusBadge(lead.loan_status).label}
                                </Badge>
                              ) : (
                                <small className="text-muted">No Loan</small>
                              )}
                            </td>
                            <td>
                              {lead.next_followup_date ? (
                                <small className="d-flex align-items-center">
                                  <Calendar size={14} className="me-2 text-warning" />
                                  {new Date(lead.next_followup_date).toLocaleDateString()}
                                </small>
                              ) : (
                                <small className="text-muted">-</small>
                              )}
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => openViewModal(lead)}
                                  title="View"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => openLoanModal(lead)}
                                  title="Loan"
                                >
                                  <DollarSign size={14} />
                                </Button>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => openEditModal(lead)}
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => openDeleteModal(lead)}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="p-3 border-top d-flex justify-content-center">
                      <Pagination size="sm" className="mb-0">
                        <Pagination.First
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        />
                        <Pagination.Prev
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        />
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          return (
                            <Pagination.Item
                              key={page}
                              active={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Pagination.Item>
                          );
                        })}
                        <Pagination.Next
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        />
                        <Pagination.Last
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* Search Modal */}
        <Modal show={showSearchModal} onHide={() => setShowSearchModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Search Customer Lead</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Search by</Form.Label>
                    <Form.Select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                    >
                      <option value="passport">Passport Number</option>
                      <option value="contact">Contact Number</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-500">
                  {searchType === "passport" ? "Passport Number" : "Contact Number"}
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    placeholder={
                      searchType === "passport" ? "e.g., AB1234567" : "e.g., +923001234567"
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="primary" onClick={handleSearch} disabled={searching}>
                    {searching ? "Searching..." : "Search"}
                  </Button>
                </InputGroup>
              </Form.Group>

              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold mb-3">Results ({searchResults.length})</h6>
                  {searchResults.map((lead) => (
                    <Card key={lead.id} className="mb-2">
                      <Card.Body className="py-2">
                        <Row className="align-items-center">
                          <Col md={8}>
                            <h6 className="mb-1">{lead.customer_name}</h6>
                            <small className="text-muted">
                              {lead.contact_number} • {lead.passport_number}
                            </small>
                          </Col>
                          <Col md={4} className="text-md-end">
                            <Button
                              variant="sm"
                              size="sm"
                              onClick={() => {
                                setLeadForm(lead);
                                setSelectedLead(lead);
                                setShowSearchModal(false);
                                setShowViewModal(true);
                              }}
                            >
                              <Eye size={14} className="me-1" />
                              View
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Form>
          </Modal.Body>
        </Modal>

        {/* Add/Edit Modal */}
        <Modal
          show={showAddModal || showEditModal}
          onHide={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>{showEditModal ? "Edit Lead" : "Add Customer Lead"}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="max-height-modal">
            <Form>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={leadForm.customer_name}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, customer_name: e.target.value })
                      }
                      placeholder="Enter name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Passport *</Form.Label>
                    <Form.Control
                      type="text"
                      value={leadForm.passport_number}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, passport_number: e.target.value })
                      }
                      placeholder="AB1234567"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Contact *</Form.Label>
                    <Form.Control
                      type="tel"
                      value={leadForm.contact_number}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, contact_number: e.target.value })
                      }
                      placeholder="+92-300-1234567"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">CNIC</Form.Label>
                    <Form.Control
                      type="text"
                      value={leadForm.cnic}
                      onChange={(e) => setLeadForm({ ...leadForm, cnic: e.target.value })}
                      placeholder="35202-1234567-1"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      placeholder="example@gmail.com"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Branch *</Form.Label>
                    <Form.Select
                      value={leadForm.branch_id}
                      onChange={(e) => setLeadForm({ ...leadForm, branch_id: e.target.value })}
                    >
                      <option value="">Select</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-500">Address</Form.Label>
                <Form.Control
                  type="text"
                  value={leadForm.address}
                  onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                  placeholder="Enter address"
                />
              </Form.Group>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Lead Type</Form.Label>
                    <Form.Select
                      value={leadForm.lead_type}
                      onChange={(e) => setLeadForm({ ...leadForm, lead_type: e.target.value })}
                    >
                      <option value="walkin">Walk-in</option>
                      <option value="call">Call</option>
                      <option value="whatsapp">WhatsApp</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Status</Form.Label>
                    <Form.Select
                      value={leadForm.lead_status}
                      onChange={(e) => setLeadForm({ ...leadForm, lead_status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-500">Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  placeholder="Notes..."
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={showEditModal ? handleEditLead : handleAddLead}>
              {showEditModal ? "Update" : "Create"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View Modal */}
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Customer Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedLead && (
              <>
                <h6 className="fw-bold mb-3 text-primary">Personal Info</h6>
                <Row className="mb-4">
                  <Col md={6} className="mb-2">
                    <small className="text-muted">Name</small>
                    <p>{selectedLead.customer_name}</p>
                  </Col>
                  <Col md={6} className="mb-2">
                    <small className="text-muted">Passport</small>
                    <div className="d-flex gap-2">
                      <code>{selectedLead.passport_number}</code>
                      <Button variant="link" size="sm" className="p-0" onClick={() => copyToClipboard(selectedLead.passport_number)}>
                        <Copy size={14} />
                      </Button>
                    </div>
                  </Col>
                  <Col md={6} className="mb-2">
                    <small className="text-muted">Contact</small>
                    <p>{selectedLead.contact_number}</p>
                  </Col>
                  <Col md={6} className="mb-2">
                    <small className="text-muted">CNIC</small>
                    <p>{selectedLead.cnic || "N/A"}</p>
                  </Col>
                  <Col md={12} className="mb-2">
                    <small className="text-muted">Address</small>
                    <p>{selectedLead.address || "N/A"}</p>
                  </Col>
                </Row>

                <hr />

                <h6 className="fw-bold mb-3 text-primary">Lead Info</h6>
                <Row className="mb-4">
                  <Col md={6} className="mb-2">
                    <small className="text-muted">Branch</small>
                    <p>{selectedLead.branch_name}</p>
                  </Col>
                  <Col md={6} className="mb-2">
                    <small className="text-muted">Type</small>
                    <p className="text-capitalize">{selectedLead.lead_type}</p>
                  </Col>
                  <Col md={6} className="mb-2">
                    <small className="text-muted">Status</small>
                    <Badge bg={getStatusBadge(selectedLead.lead_status).bg}>
                      {getStatusBadge(selectedLead.lead_status).label}
                    </Badge>
                  </Col>
                </Row>

                {selectedLead.loan_amount && (
                  <>
                    <hr />
                    <h6 className="fw-bold mb-3 text-primary">Loan Info</h6>
                    <Row>
                      <Col md={6} className="mb-2">
                        <small className="text-muted">Amount</small>
                        <p>PKR {selectedLead.loan_amount}</p>
                      </Col>
                      <Col md={6} className="mb-2">
                        <small className="text-muted">Status</small>
                        <Badge bg={getLoanStatusBadge(selectedLead.loan_status).bg}>
                          {getLoanStatusBadge(selectedLead.loan_status).label}
                        </Badge>
                      </Col>
                    </Row>
                  </>
                )}
              </>
            )}
          </Modal.Body>
        </Modal>

        {/* Loan Modal */}
        <Modal show={showLoanModal} onHide={() => setShowLoanModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Manage Loan - {selectedLead?.customer_name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Amount (PKR)</Form.Label>
                    <Form.Control
                      type="number"
                      value={leadForm.loan_amount}
                      onChange={(e) => setLeadForm({ ...leadForm, loan_amount: e.target.value })}
                      placeholder="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={leadForm.loan_date}
                      onChange={(e) => setLeadForm({ ...leadForm, loan_date: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-500">Status</Form.Label>
                <Form.Select
                  value={leadForm.loan_status}
                  onChange={(e) => setLeadForm({ ...leadForm, loan_status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-500">Next Follow-up</Form.Label>
                <Form.Control
                  type="date"
                  value={leadForm.next_followup_date}
                  onChange={(e) => setLeadForm({ ...leadForm, next_followup_date: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-500">Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={leadForm.next_followup_notes}
                  onChange={(e) => setLeadForm({ ...leadForm, next_followup_notes: e.target.value })}
                  placeholder="Follow-up notes..."
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowLoanModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => { handleEditLead(); setShowLoanModal(false); }}>
              Save Loan Info
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Delete Lead</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Delete <strong>{selectedLead?.customer_name}</strong>? This cannot be undone.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteLead}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default CustomerLead;
