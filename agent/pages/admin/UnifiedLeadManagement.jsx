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
  Tabs,
  Tab,
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
  Fingerprint,
  Users,
} from "lucide-react";
import axios from "axios";
import "./styles/leads.css";

const UnifiedLeadManagement = () => {
  // ============ STATE MANAGEMENT ============
  const [activeTab, setActiveTab] = useState("all");
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const itemsPerPage = 10;

  // ============ DEMO DATA ============
  const demoLeads = [
    {
      id: 1,
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      phone: "+92-300-1234567",
      type: "customer",
      status: "new",
      source: "website",
      branch: "Karachi",
      created: "2025-01-15",
      notes: "Interested in Umrah package",
      budget: "50000-100000",
    },
    {
      id: 2,
      name: "Fatima Khan",
      email: "fatima@example.com",
      phone: "+92-301-7654321",
      type: "passport",
      status: "contacted",
      source: "referral",
      branch: "Lahore",
      created: "2025-01-14",
      notes: "Passport application inquiry",
      passportType: "New",
    },
    {
      id: 3,
      name: "Muhammad Ali",
      email: "mali@example.com",
      phone: "+92-302-5555555",
      type: "customer",
      status: "qualified",
      source: "form",
      branch: "Islamabad",
      created: "2025-01-13",
      notes: "High priority customer",
      budget: "100000-200000",
    },
    {
      id: 4,
      name: "Zainab Ahmed",
      email: "zainab@example.com",
      phone: "+92-303-9999999",
      type: "passport",
      status: "new",
      source: "website",
      branch: "Karachi",
      created: "2025-01-12",
      notes: "Visa services inquiry",
      passportType: "Renewal",
    },
    {
      id: 5,
      name: "Hassan Khan",
      email: "hassan@example.com",
      phone: "+92-304-1111111",
      type: "customer",
      status: "converted",
      source: "email",
      branch: "Lahore",
      created: "2025-01-11",
      notes: "Successfully booked package",
      budget: "75000-150000",
    },
    {
      id: 6,
      name: "Aisha Malik",
      email: "aisha@example.com",
      phone: "+92-305-2222222",
      type: "passport",
      status: "contacted",
      source: "phone",
      branch: "Islamabad",
      created: "2025-01-10",
      notes: "Waiting for documentation",
      passportType: "New",
    },
  ];

  // ============ LIFECYCLE HOOKS ============
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls
        // const response = await axios.get(`/api/leads/`, { headers: { Authorization: `Bearer ${token}` } });
        setLeads(demoLeads);
        setBranches(["Karachi", "Lahore", "Islamabad", "Peshawar", "Quetta"]);
        setAlert({ show: true, type: "success", message: "Leads loaded successfully" });
      } catch (err) {
        console.error("Error fetching leads:", err);
        setAlert({ show: true, type: "danger", message: "Failed to load leads" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============ FILTERING & SEARCHING ============
  useEffect(() => {
    let filtered = leads;

    // Filter by type based on active tab
    if (activeTab === "customer") {
      filtered = filtered.filter((lead) => lead.type === "customer");
    } else if (activeTab === "passport") {
      filtered = filtered.filter((lead) => lead.type === "passport");
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm)
      );
    }

    // Apply branch filter
    if (selectedBranch) {
      filtered = filtered.filter((lead) => lead.branch === selectedBranch);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [activeTab, leads, searchTerm, selectedBranch, statusFilter]);

  // ============ STATISTICS ============
  const getStats = () => {
    let statLeads = leads;
    if (activeTab === "customer") {
      statLeads = leads.filter((l) => l.type === "customer");
    } else if (activeTab === "passport") {
      statLeads = leads.filter((l) => l.type === "passport");
    }

    return {
      total: statLeads.length,
      new: statLeads.filter((l) => l.status === "new").length,
      contacted: statLeads.filter((l) => l.status === "contacted").length,
      qualified: statLeads.filter((l) => l.status === "qualified").length,
      converted: statLeads.filter((l) => l.status === "converted").length,
    };
  };

  const stats = getStats();

  // ============ PAGINATION ============
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIdx, startIdx + itemsPerPage);

  // ============ BADGE HELPERS ============
  const getStatusBadge = (status) => {
    const variants = {
      new: "warning",
      contacted: "info",
      qualified: "primary",
      converted: "success",
      lost: "danger",
    };
    const labels = {
      new: "New",
      contacted: "Contacted",
      qualified: "Qualified",
      converted: "Converted",
      lost: "Lost",
    };
    return <Badge bg={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const getSourceBadge = (source) => {
    const variants = {
      website: "info",
      form: "primary",
      phone: "success",
      email: "secondary",
      referral: "warning",
    };
    return <Badge bg={variants[source] || "secondary"}>{source.toUpperCase()}</Badge>;
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case "customer":
        return <Users size={18} className="me-2" />;
      case "passport":
        return <Passport size={18} className="me-2" />;
      default:
        return <BarChart3 size={18} className="me-2" />;
    }
  };

  // ============ RENDER LEADS TABLE ============
  const renderLeadsTable = () => (
    <div style={{ overflowX: "auto" }}>
      <Table hover responsive>
        <thead style={{ backgroundColor: "#f8f9fa" }}>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Type</th>
            <th>Status</th>
            <th>Source</th>
            <th>Branch</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedLeads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <div>
                  <strong>{lead.name}</strong>
                </div>
              </td>
              <td>
                <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                  <div className="d-flex align-items-center gap-1">
                    <Mail size={14} /> {lead.email}
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-1">
                    <Phone size={14} /> {lead.phone}
                  </div>
                </div>
              </td>
              <td>
                <Badge bg={lead.type === "customer" ? "primary" : "info"}>
                  {lead.type === "customer" ? "Customer" : "Passport"}
                </Badge>
              </td>
              <td>{getStatusBadge(lead.status)}</td>
              <td>{getSourceBadge(lead.source)}</td>
              <td>{lead.branch}</td>
              <td>
                <small>{lead.created}</small>
              </td>
              <td>
                <div className="d-flex gap-1">
                  <Button variant="outline-primary" size="sm" title="View">
                    <Eye size={14} />
                  </Button>
                  <Button variant="outline-warning" size="sm" title="Edit">
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="outline-danger" size="sm" title="Delete">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <Container fluid className="p-0">
          <Header title="Lead Management" />
          <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <Container fluid className="p-0">
        <Header title="Lead Management Hub" />

        <div className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "calc(100vh - 80px)" }}>
          {/* Alert */}
          {alert.show && (
            <Alert
              variant={alert.type}
              onClose={() => setAlert({ ...alert, show: false })}
              dismissible
              className="mb-4"
            >
              {alert.message}
            </Alert>
          )}

          {/* Stats Cards */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <BarChart3 size={32} className="text-primary mb-2" />
                  <h6>Total Leads</h6>
                  <h3 className="text-primary mb-0">{stats.total}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <AlertCircle size={32} className="text-warning mb-2" />
                  <h6>New</h6>
                  <h3 className="text-warning mb-0">{stats.new}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <Clock size={32} className="text-info mb-2" />
                  <h6>Contacted</h6>
                  <h3 className="text-info mb-0">{stats.contacted}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <TrendingUp size={32} className="text-success mb-2" />
                  <h6>Converted</h6>
                  <h3 className="text-success mb-0">{stats.converted}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Search</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <Search size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Name, email, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Branch</Form.Label>
                    <Form.Select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                      <option value="">All Branches</option>
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="">All Status</option>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button variant="primary" className="w-100">
                    <Plus size={16} className="me-2" />
                    Add Lead
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabs */}
          <Card>
            <Card.Body className="p-0">
              <Tabs
                id="lead-tabs"
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-0"
              >
                <Tab eventKey="all" title={<><BarChart3 size={16} className="me-2" />All Leads</>}>
                  <div className="p-3">
                    {paginatedLeads.length > 0 ? (
                      <>
                        {renderLeadsTable()}
                        {totalPages > 1 && (
                          <Pagination className="justify-content-center mt-4">
                            <Pagination.First
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(1)}
                            />
                            <Pagination.Prev
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(currentPage - 1)}
                            />
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                              <Pagination.Item
                                key={i + 1}
                                active={i + 1 === currentPage}
                                onClick={() => setCurrentPage(i + 1)}
                              >
                                {i + 1}
                              </Pagination.Item>
                            ))}
                            <Pagination.Next
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(currentPage + 1)}
                            />
                            <Pagination.Last
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(totalPages)}
                            />
                          </Pagination>
                        )}
                      </>
                    ) : (
                      <Alert variant="info">No leads found</Alert>
                    )}
                  </div>
                </Tab>

                <Tab
                  eventKey="customer"
                  title={
                    <>
                      <Users size={16} className="me-2" />
                      Customer Leads ({leads.filter((l) => l.type === "customer").length})
                    </>
                  }
                >
                  <div className="p-3">
                    {paginatedLeads.length > 0 ? (
                      <>
                        {renderLeadsTable()}
                        {totalPages > 1 && (
                          <Pagination className="justify-content-center mt-4">
                            <Pagination.First
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(1)}
                            />
                            <Pagination.Prev
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(currentPage - 1)}
                            />
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                              <Pagination.Item
                                key={i + 1}
                                active={i + 1 === currentPage}
                                onClick={() => setCurrentPage(i + 1)}
                              >
                                {i + 1}
                              </Pagination.Item>
                            ))}
                            <Pagination.Next
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(currentPage + 1)}
                            />
                            <Pagination.Last
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(totalPages)}
                            />
                          </Pagination>
                        )}
                      </>
                    ) : (
                      <Alert variant="info">No customer leads found</Alert>
                    )}
                  </div>
                </Tab>

                <Tab
                  eventKey="passport"
                  title={
                    <>
                      <Fingerprint size={16} className="me-2" />
                      Passport Leads ({leads.filter((l) => l.type === "passport").length})
                    </>
                  }
                >
                  <div className="p-3">
                    {paginatedLeads.length > 0 ? (
                      <>
                        {renderLeadsTable()}
                        {totalPages > 1 && (
                          <Pagination className="justify-content-center mt-4">
                            <Pagination.First
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(1)}
                            />
                            <Pagination.Prev
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(currentPage - 1)}
                            />
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                              <Pagination.Item
                                key={i + 1}
                                active={i + 1 === currentPage}
                                onClick={() => setCurrentPage(i + 1)}
                              >
                                {i + 1}
                              </Pagination.Item>
                            ))}
                            <Pagination.Next
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(currentPage + 1)}
                            />
                            <Pagination.Last
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(totalPages)}
                            />
                          </Pagination>
                        )}
                      </>
                    ) : (
                      <Alert variant="info">No passport leads found</Alert>
                    )}
                  </div>
                </Tab>

                <Tab eventKey="stats" title={<><TrendingUp size={16} className="me-2" />Reports</>}>
                  <div className="p-3">
                    <Row>
                      <Col md={6}>
                        <Card>
                          <Card.Header>
                            <Card.Title className="mb-0">Lead Status Distribution</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                              <span>New</span>
                              <span className="badge bg-warning">{stats.new}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Contacted</span>
                              <span className="badge bg-info">{stats.contacted}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Qualified</span>
                              <span className="badge bg-primary">{stats.qualified}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Converted</span>
                              <span className="badge bg-success">{stats.converted}</span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card>
                          <Card.Header>
                            <Card.Title className="mb-0">Leads by Type</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Customer Leads</span>
                              <span className="badge bg-primary">
                                {leads.filter((l) => l.type === "customer").length}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Passport Leads</span>
                              <span className="badge bg-info">
                                {leads.filter((l) => l.type === "passport").length}
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default UnifiedLeadManagement;
