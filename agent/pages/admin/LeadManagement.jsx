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
  Filter,
  Phone,
  Mail,
  Calendar,
  FileText,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  DollarSign,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import "./styles/leads.css";

const LeadManagement = () => {
  // State management
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    lead_status: "",
    conversion_status: "",
    branch_id: "",
    interested_in: "",
    lead_source: "",
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected item
  const [selectedLead, setSelectedLead] = useState(null);

  // Form state
  const [leadForm, setLeadForm] = useState({
    customer_full_name: "",
    passport_number: "",
    passport_expiry: "",
    contact_number: "",
    email: "",
    cnic_number: "",
    address: "",
    branch_id: "",
    lead_source: "walk-in",
    lead_status: "new",
    interested_in: "umrah_package",
    interested_travel_date: "",
    next_followup_date: "",
    next_followup_time: "",
    remarks: "",
    loan_promise_date: "",
    loan_status: "pending",
    conversion_status: "not_converted",
  });

  // Get organization and auth details
  const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
  const organizationId = orgData?.id;
  const token = localStorage.getItem("accessToken");

  // Demo branches data
  const demoBranches = [
    { id: 1, name: "Lahore Main Branch" },
    { id: 2, name: "Karachi Branch" },
    { id: 3, name: "Islamabad Branch" },
    { id: 4, name: "Faisalabad Branch" },
    { id: 5, name: "Multan Branch" },
  ];

  // Demo leads data
  const demoLeads = [
    {
      id: 1,
      customer_full_name: "Ahmed Ali",
      passport_number: "AB1234567",
      passport_expiry: "2028-03-01",
      contact_number: "+923001234567",
      email: "ahmed@example.com",
      cnic_number: "35201-1234567-8",
      address: "Lahore, Pakistan",
      branch_id: 1,
      branch_name: "Lahore Main Branch",
      lead_source: "walk-in",
      lead_status: "confirmed",
      interested_in: "umrah_package",
      interested_travel_date: "2025-12-01",
      next_followup_date: "2025-11-20",
      next_followup_time: "14:00",
      remarks: "Customer wants to travel in December",
      loan_promise_date: "2025-11-15",
      loan_status: "cleared",
      last_contacted_date: "2025-11-18",
      conversion_status: "converted_to_booking",
      booking_id: 101,
      pex_id: null,
      created_at: "2025-10-19",
      updated_at: "2025-11-18",
    },
    {
      id: 2,
      customer_full_name: "Fatima Khan",
      passport_number: "CD9876543",
      passport_expiry: "2027-06-15",
      contact_number: "+923012345678",
      email: "fatima@example.com",
      cnic_number: "35401-2345678-9",
      address: "Karachi, Pakistan",
      branch_id: 2,
      branch_name: "Karachi Branch",
      lead_source: "referral",
      lead_status: "followup",
      interested_in: "visa",
      interested_travel_date: "2025-11-25",
      next_followup_date: "2025-11-15",
      next_followup_time: "10:00",
      remarks: "Interested in Hajj visa, waiting for quotation",
      loan_promise_date: "2025-11-25",
      loan_status: "pending",
      last_contacted_date: "2025-11-10",
      conversion_status: "not_converted",
      booking_id: null,
      pex_id: null,
      created_at: "2025-10-20",
      updated_at: "2025-11-10",
    },
    {
      id: 3,
      customer_full_name: "Muhammad Hassan",
      passport_number: "EF5555666",
      passport_expiry: "2029-01-10",
      contact_number: "+923023456789",
      email: "hassan@example.com",
      cnic_number: "31401-3456789-1",
      address: "Islamabad, Pakistan",
      branch_id: 3,
      branch_name: "Islamabad Branch",
      lead_source: "call",
      lead_status: "new",
      interested_in: "ticket",
      interested_travel_date: "2025-12-15",
      next_followup_date: "2025-11-22",
      next_followup_time: "15:30",
      remarks: "First inquiry, needs package details",
      loan_promise_date: null,
      loan_status: "pending",
      last_contacted_date: "2025-11-18",
      conversion_status: "not_converted",
      booking_id: null,
      pex_id: null,
      created_at: "2025-11-18",
      updated_at: "2025-11-18",
    },
    {
      id: 4,
      customer_full_name: "Aisha Malik",
      passport_number: "GH7777888",
      passport_expiry: "2026-09-20",
      contact_number: "+923034567890",
      email: "aisha@example.com",
      cnic_number: "37201-4567890-2",
      address: "Faisalabad, Pakistan",
      branch_id: 4,
      branch_name: "Faisalabad Branch",
      lead_source: "facebook",
      lead_status: "followup",
      interested_in: "hotel",
      interested_travel_date: "2025-11-30",
      next_followup_date: "2025-11-19",
      next_followup_time: "11:00",
      remarks: "Needs hotel recommendations, 5-person group",
      loan_promise_date: "2025-11-30",
      loan_status: "overdue",
      last_contacted_date: "2025-11-17",
      conversion_status: "not_converted",
      booking_id: null,
      pex_id: null,
      created_at: "2025-10-25",
      updated_at: "2025-11-17",
    },
    {
      id: 5,
      customer_full_name: "Usman Ahmed",
      passport_number: "IJ9999000",
      passport_expiry: "2027-04-05",
      contact_number: "+923045678901",
      email: "usman@example.com",
      cnic_number: "32201-5678901-3",
      address: "Multan, Pakistan",
      branch_id: 5,
      branch_name: "Multan Branch",
      lead_source: "whatsapp",
      lead_status: "lost",
      interested_in: "umrah_package",
      interested_travel_date: "2025-12-20",
      next_followup_date: null,
      next_followup_time: null,
      remarks: "Budget too low, customer moved to competitor",
      loan_promise_date: null,
      loan_status: "pending",
      last_contacted_date: "2025-11-01",
      conversion_status: "lost",
      booking_id: null,
      pex_id: null,
      created_at: "2025-10-15",
      updated_at: "2025-11-01",
    },
    {
      id: 6,
      customer_full_name: "Sara Hussain",
      passport_number: "KL1111222",
      passport_expiry: "2028-07-12",
      contact_number: "+923056789012",
      email: "sara@example.com",
      cnic_number: "36201-6789012-4",
      address: "Lahore, Pakistan",
      branch_id: 1,
      branch_name: "Lahore Main Branch",
      lead_source: "walk-in",
      lead_status: "confirmed",
      interested_in: "transport",
      interested_travel_date: "2025-11-28",
      next_followup_date: "2025-11-20",
      next_followup_time: "09:00",
      remarks: "Booking confirmed for transport only",
      loan_promise_date: "2025-11-20",
      loan_status: "cleared",
      last_contacted_date: "2025-11-18",
      conversion_status: "converted_to_booking",
      booking_id: 102,
      pex_id: null,
      created_at: "2025-11-10",
      updated_at: "2025-11-18",
    },
  ];

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/leads/`, {
        params: { organization: organizationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(response.data && response.data.length > 0 ? response.data : demoLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      setLeads(demoLeads);
    } finally {
      setLoading(false);
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/branches/`, {
        params: { organization: organizationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(response.data && response.data.length > 0 ? response.data : demoBranches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      setBranches(demoBranches);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchLeads();
  }, []);

  // Filter leads based on search and filters
  useEffect(() => {
    let filtered = leads;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.customer_full_name?.toLowerCase().includes(searchLower) ||
          lead.contact_number?.includes(filters.search) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.passport_number?.includes(filters.search)
      );
    }

    if (filters.lead_status)
      filtered = filtered.filter((lead) => lead.lead_status === filters.lead_status);
    if (filters.conversion_status)
      filtered = filtered.filter((lead) => lead.conversion_status === filters.conversion_status);
    if (filters.branch_id)
      filtered = filtered.filter((lead) => lead.branch_id === parseInt(filters.branch_id));
    if (filters.interested_in)
      filtered = filtered.filter((lead) => lead.interested_in === filters.interested_in);
    if (filters.lead_source)
      filtered = filtered.filter((lead) => lead.lead_source === filters.lead_source);

    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [filters, leads]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Show alert helper
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  // Handle add lead
  const handleAddLead = async () => {
    if (!leadForm.customer_full_name || !leadForm.contact_number || !leadForm.branch_id) {
      showAlert("error", "Please fill all required fields");
      return;
    }

    try {
      const payload = {
        ...leadForm,
        organization_id: organizationId,
      };

      await axios.post(`http://127.0.0.1:8000/api/leads/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert("success", "Lead added successfully!");
      setShowAddModal(false);
      fetchLeads();
      resetForm();
    } catch (error) {
      showAlert("error", "Failed to add lead");
    }
  };

  // Handle edit lead
  const handleEditLead = async () => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/leads/${selectedLead.id}/`,
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

  // Handle delete lead
  const handleDeleteLead = async () => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/leads/${selectedLead.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert("success", "Lead deleted successfully!");
      setShowDeleteModal(false);
      fetchLeads();
    } catch (error) {
      showAlert("error", "Failed to delete lead");
    }
  };

  // Reset form
  const resetForm = () => {
    setLeadForm({
      customer_full_name: "",
      passport_number: "",
      passport_expiry: "",
      contact_number: "",
      email: "",
      cnic_number: "",
      address: "",
      branch_id: "",
      lead_source: "walk-in",
      lead_status: "new",
      interested_in: "umrah_package",
      interested_travel_date: "",
      next_followup_date: "",
      next_followup_time: "",
      remarks: "",
      loan_promise_date: "",
      loan_status: "pending",
      conversion_status: "not_converted",
    });
  };

  // Open edit modal
  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setLeadForm(lead);
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

  // Open delete modal
  const openDeleteModal = (lead) => {
    setSelectedLead(lead);
    setShowDeleteModal(true);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statuses = {
      new: { bg: "info", label: "New" },
      followup: { bg: "warning", label: "Follow-up" },
      confirmed: { bg: "success", label: "Confirmed" },
      lost: { bg: "danger", label: "Lost" },
    };
    return statuses[status] || { bg: "secondary", label: status };
  };

  // Get conversion badge
  const getConversionBadge = (status) => {
    const statuses = {
      not_converted: { bg: "secondary", label: "Not Converted" },
      converted_to_booking: { bg: "success", label: "Converted" },
      lost: { bg: "danger", label: "Lost" },
    };
    return statuses[status] || { bg: "secondary", label: status };
  };

  // Get loan status badge
  const getLoanStatusBadge = (status) => {
    const statuses = {
      pending: { bg: "warning", label: "Pending" },
      cleared: { bg: "success", label: "Cleared" },
      overdue: { bg: "danger", label: "Overdue" },
    };
    return statuses[status] || { bg: "secondary", label: status };
  };

  // Calculate statistics
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.lead_status === "new").length,
    converted: leads.filter((l) => l.conversion_status === "converted_to_booking").length,
    conversionRate:
      leads.length > 0
        ? Math.round(
            (leads.filter((l) => l.conversion_status === "converted_to_booking").length /
              leads.length) *
              100
          )
        : 0,
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <Container fluid className="py-4 px-3 px-md-4">
          {/* Alert */}
          {alert.show && (
            <Alert variant={alert.type} dismissible onClose={() => setAlert({ ...alert, show: false })}>
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
                      <p className="text-muted mb-1">New Leads</p>
                      <h3 className="mb-0">{stats.new}</h3>
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
                      <p className="text-muted mb-1">Converted</p>
                      <h3 className="mb-0">{stats.converted}</h3>
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
                      <p className="text-muted mb-1">Conversion Rate</p>
                      <h3 className="mb-0">{stats.conversionRate}%</h3>
                    </div>
                    <TrendingUp size={40} className="text-info opacity-50" />
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
                  <h5 className="mb-0">Lead Management</h5>
                </Col>
                <Col xs={12} md={6} className="text-md-end mt-3 mt-md-0">
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
              {/* Filters */}
              <div className="p-3 border-bottom bg-light">
                <Row className="g-2">
                  <Col xs={12} sm={6} lg={3}>
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-white border-end-0">
                        <Search size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Search by name, phone, email..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="border-start-0"
                      />
                    </InputGroup>
                  </Col>

                  <Col xs={12} sm={6} lg={3}>
                    <Form.Select
                      size="sm"
                      value={filters.lead_status}
                      onChange={(e) => setFilters({ ...filters, lead_status: e.target.value })}
                    >
                      <option value="">All Lead Status</option>
                      <option value="new">New</option>
                      <option value="followup">Follow-up</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="lost">Lost</option>
                    </Form.Select>
                  </Col>

                  <Col xs={12} sm={6} lg={3}>
                    <Form.Select
                      size="sm"
                      value={filters.branch_id}
                      onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                    >
                      <option value="">All Branches</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col xs={12} sm={6} lg={3}>
                    <Form.Select
                      size="sm"
                      value={filters.interested_in}
                      onChange={(e) => setFilters({ ...filters, interested_in: e.target.value })}
                    >
                      <option value="">All Services</option>
                      <option value="ticket">Ticket</option>
                      <option value="umrah_package">Umrah Package</option>
                      <option value="visa">Visa</option>
                      <option value="transport">Transport</option>
                      <option value="hotel">Hotel</option>
                    </Form.Select>
                  </Col>

                  <Col xs={12} sm={6} lg={3}>
                    <Form.Select
                      size="sm"
                      value={filters.conversion_status}
                      onChange={(e) => setFilters({ ...filters, conversion_status: e.target.value })}
                    >
                      <option value="">All Conversions</option>
                      <option value="not_converted">Not Converted</option>
                      <option value="converted_to_booking">Converted</option>
                      <option value="lost">Lost</option>
                    </Form.Select>
                  </Col>

                  <Col xs={12} sm={6} lg={3}>
                    <Form.Select
                      size="sm"
                      value={filters.lead_source}
                      onChange={(e) => setFilters({ ...filters, lead_source: e.target.value })}
                    >
                      <option value="">All Sources</option>
                      <option value="walk-in">Walk-in</option>
                      <option value="call">Call</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="facebook">Facebook</option>
                      <option value="referral">Referral</option>
                    </Form.Select>
                  </Col>

                  <Col xs={12}>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setFilters({
                          search: "",
                          lead_status: "",
                          conversion_status: "",
                          branch_id: "",
                          interested_in: "",
                          lead_source: "",
                        });
                      }}
                    >
                      Clear Filters
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Loading */}
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
                  {/* Table */}
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="text-nowrap">Name</th>
                          <th className="text-nowrap">Contact</th>
                          <th className="text-nowrap">Branch</th>
                          <th className="text-nowrap">Lead Status</th>
                          <th className="text-nowrap">Interested In</th>
                          <th className="text-nowrap">Source</th>
                          <th className="text-nowrap">Conversion</th>
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
                                  <p className="mb-0 fw-500">{lead.customer_full_name}</p>
                                  <small className="text-muted">{lead.passport_number}</small>
                                </div>
                              </div>
                            </td>
                            <td className="text-nowrap">
                              <div>
                                <p className="mb-0 d-flex align-items-center">
                                  <Phone size={14} className="me-2 text-muted" />
                                  {lead.contact_number}
                                </p>
                                <small className="text-muted d-flex align-items-center">
                                  <Mail size={14} className="me-2" />
                                  {lead.email}
                                </small>
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
                              <Badge bg="info">
                                {lead.interested_in === "umrah_package"
                                  ? "Umrah"
                                  : lead.interested_in.charAt(0).toUpperCase() +
                                    lead.interested_in.slice(1)}
                              </Badge>
                            </td>
                            <td>
                              <small className="text-capitalize">{lead.lead_source}</small>
                            </td>
                            <td>
                              <Badge bg={getConversionBadge(lead.conversion_status).bg}>
                                {getConversionBadge(lead.conversion_status).label}
                              </Badge>
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

                  {/* Pagination */}
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

        {/* Add/Edit Lead Modal */}
        <Modal show={showAddModal || showEditModal} onHide={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{showEditModal ? "Edit Lead" : "Add New Lead"}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="max-height-modal">
            <Form>
              {/* Row 1 */}
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={leadForm.customer_full_name}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, customer_full_name: e.target.value })
                      }
                      placeholder="Enter full name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Contact Number *</Form.Label>
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
              </Row>

              {/* Row 2 */}
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      placeholder="example@email.com"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Passport Number</Form.Label>
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

              {/* Row 3 */}
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Passport Expiry</Form.Label>
                    <Form.Control
                      type="date"
                      value={leadForm.passport_expiry}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, passport_expiry: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">CNIC Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={leadForm.cnic_number}
                      onChange={(e) => setLeadForm({ ...leadForm, cnic_number: e.target.value })}
                      placeholder="35201-1234567-8"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 4 */}
              <Row>
                <Col md={12} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Address</Form.Label>
                    <Form.Control
                      type="text"
                      value={leadForm.address}
                      onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 5 */}
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Branch *</Form.Label>
                    <Form.Select
                      value={leadForm.branch_id}
                      onChange={(e) => setLeadForm({ ...leadForm, branch_id: e.target.value })}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Lead Source</Form.Label>
                    <Form.Select
                      value={leadForm.lead_source}
                      onChange={(e) => setLeadForm({ ...leadForm, lead_source: e.target.value })}
                    >
                      <option value="walk-in">Walk-in</option>
                      <option value="call">Call</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="facebook">Facebook</option>
                      <option value="referral">Referral</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 6 */}
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Lead Status</Form.Label>
                    <Form.Select
                      value={leadForm.lead_status}
                      onChange={(e) => setLeadForm({ ...leadForm, lead_status: e.target.value })}
                    >
                      <option value="new">New</option>
                      <option value="followup">Follow-up</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="lost">Lost</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Interested In</Form.Label>
                    <Form.Select
                      value={leadForm.interested_in}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, interested_in: e.target.value })
                      }
                    >
                      <option value="ticket">Ticket</option>
                      <option value="umrah_package">Umrah Package</option>
                      <option value="visa">Visa</option>
                      <option value="transport">Transport</option>
                      <option value="hotel">Hotel</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 7 */}
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Interested Travel Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={leadForm.interested_travel_date}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, interested_travel_date: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Next Follow-up Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={leadForm.next_followup_date}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, next_followup_date: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 8 */}
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Next Follow-up Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={leadForm.next_followup_time}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, next_followup_time: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Loan Promise Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={leadForm.loan_promise_date}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, loan_promise_date: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 9 */}
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Loan Status</Form.Label>
                    <Form.Select
                      value={leadForm.loan_status}
                      onChange={(e) => setLeadForm({ ...leadForm, loan_status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="cleared">Cleared</option>
                      <option value="overdue">Overdue</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Conversion Status</Form.Label>
                    <Form.Select
                      value={leadForm.conversion_status}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, conversion_status: e.target.value })
                      }
                    >
                      <option value="not_converted">Not Converted</option>
                      <option value="converted_to_booking">Converted to Booking</option>
                      <option value="lost">Lost</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Remarks */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-500">Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={leadForm.remarks}
                  onChange={(e) => setLeadForm({ ...leadForm, remarks: e.target.value })}
                  placeholder="Add any remarks or notes..."
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={showEditModal ? handleEditLead : handleAddLead}
            >
              {showEditModal ? "Update Lead" : "Add Lead"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View Lead Modal */}
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Lead Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedLead && (
              <div>
                {/* Personal Info */}
                <h6 className="fw-bold mb-3 text-primary">Personal Information</h6>
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Full Name</p>
                    <p className="fw-500">{selectedLead.customer_full_name}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Passport Number</p>
                    <p className="fw-500">{selectedLead.passport_number}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Passport Expiry</p>
                    <p className="fw-500">{selectedLead.passport_expiry}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">CNIC Number</p>
                    <p className="fw-500">{selectedLead.cnic_number}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Contact Number</p>
                    <p className="fw-500">{selectedLead.contact_number}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Email</p>
                    <p className="fw-500">{selectedLead.email}</p>
                  </Col>
                  <Col md={12} className="mb-3">
                    <p className="text-muted small mb-1">Address</p>
                    <p className="fw-500">{selectedLead.address}</p>
                  </Col>
                </Row>

                <hr />

                {/* Lead Info */}
                <h6 className="fw-bold mb-3 text-primary">Lead Information</h6>
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Branch</p>
                    <p className="fw-500">{selectedLead.branch_name}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Lead Source</p>
                    <p className="fw-500 text-capitalize">{selectedLead.lead_source}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Lead Status</p>
                    <Badge bg={getStatusBadge(selectedLead.lead_status).bg}>
                      {getStatusBadge(selectedLead.lead_status).label}
                    </Badge>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Interested In</p>
                    <Badge bg="info">{selectedLead.interested_in}</Badge>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Interested Travel Date</p>
                    <p className="fw-500">{selectedLead.interested_travel_date}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Conversion Status</p>
                    <Badge bg={getConversionBadge(selectedLead.conversion_status).bg}>
                      {getConversionBadge(selectedLead.conversion_status).label}
                    </Badge>
                  </Col>
                </Row>

                <hr />

                {/* Follow-up Info */}
                <h6 className="fw-bold mb-3 text-primary">Follow-up Information</h6>
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Next Follow-up Date</p>
                    <p className="fw-500">{selectedLead.next_followup_date || "N/A"}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Next Follow-up Time</p>
                    <p className="fw-500">{selectedLead.next_followup_time || "N/A"}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Last Contacted</p>
                    <p className="fw-500">{selectedLead.last_contacted_date}</p>
                  </Col>
                </Row>

                <hr />

                {/* Loan Info */}
                <h6 className="fw-bold mb-3 text-primary">Loan Information</h6>
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Loan Promise Date</p>
                    <p className="fw-500">{selectedLead.loan_promise_date || "N/A"}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Loan Status</p>
                    <Badge bg={getLoanStatusBadge(selectedLead.loan_status).bg}>
                      {getLoanStatusBadge(selectedLead.loan_status).label}
                    </Badge>
                  </Col>
                </Row>

                <hr />

                {/* Remarks */}
                {selectedLead.remarks && (
                  <>
                    <h6 className="fw-bold mb-3 text-primary">Remarks</h6>
                    <p className="text-muted">{selectedLead.remarks}</p>
                  </>
                )}
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Delete Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Delete Lead</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete lead <strong>{selectedLead?.customer_full_name}</strong>?
            This action cannot be undone.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteLead}>
              Delete Lead
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default LeadManagement;
