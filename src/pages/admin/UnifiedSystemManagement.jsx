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
  Table,
  InputGroup,
  Pagination,
  Tabs,
  Tab,
  Modal,
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Settings,
  FileText,
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock,
  Copy,
  Download,
  TrendingUp,
  Clock,
  User,
} from "lucide-react";
import axios from "axios";

const UnifiedSystemManagement = () => {
  // ============ STATE MANAGEMENT ============
  const [activeTab, setActiveTab] = useState("rules");
  const [rules, setRules] = useState([]);
  const [forms, setForms] = useState([]);
  const [filteredRules, setFilteredRules] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const itemsPerPage = 10;

  // ============ DEMO DATA - RULES ============
  const demoRules = [
    {
      id: 1,
      name: "Package Discount Rule",
      description: "Apply 10% discount on packages over PKR 100,000",
      category: "discount",
      status: "active",
      priority: "high",
      applicableUsers: ["admin", "agent"],
      createdAt: "2025-01-15",
      updatedAt: "2025-11-02",
    },
    {
      id: 2,
      name: "Commission Rate Rule",
      description: "Set commission rate to 5% for agents",
      category: "commission",
      status: "active",
      priority: "high",
      applicableUsers: ["admin"],
      createdAt: "2025-01-10",
      updatedAt: "2025-10-28",
    },
    {
      id: 3,
      name: "Hotel Booking Limit",
      description: "Maximum 5 hotel bookings per transaction",
      category: "booking",
      status: "inactive",
      priority: "medium",
      applicableUsers: ["agent", "subagent"],
      createdAt: "2025-01-20",
      updatedAt: "2025-10-15",
    },
    {
      id: 4,
      name: "Refund Policy",
      description: "Refunds allowed within 7 days of booking",
      category: "policy",
      status: "active",
      priority: "high",
      applicableUsers: ["admin", "agent", "subagent"],
      createdAt: "2025-02-01",
      updatedAt: "2025-11-01",
    },
    {
      id: 5,
      name: "User Role Permissions",
      description: "Define permissions for each user role",
      category: "permissions",
      status: "active",
      priority: "critical",
      applicableUsers: ["admin"],
      createdAt: "2025-01-05",
      updatedAt: "2025-11-02",
    },
    {
      id: 6,
      name: "Age Verification",
      description: "Verify user age for Umrah bookings",
      category: "verification",
      status: "inactive",
      priority: "low",
      applicableUsers: ["admin"],
      createdAt: "2025-02-10",
      updatedAt: "2025-10-25",
    },
  ];

  // ============ DEMO DATA - FORMS ============
  const demoForms = [
    {
      id: 1,
      name: "Umrah Booking Form",
      description: "Main form for umrah package bookings",
      type: "booking",
      status: "published",
      fields: 12,
      submissions: 234,
      createdAt: "2025-01-01",
      lastModified: "2025-11-01",
    },
    {
      id: 2,
      name: "Customer Feedback Form",
      description: "Collect feedback from customers",
      type: "survey",
      status: "published",
      fields: 8,
      submissions: 89,
      createdAt: "2025-01-20",
      lastModified: "2025-10-30",
    },
    {
      id: 3,
      name: "Partner Registration",
      description: "Form for new partner registration",
      type: "registration",
      status: "draft",
      fields: 15,
      submissions: 0,
      createdAt: "2025-02-05",
      lastModified: "2025-11-02",
    },
    {
      id: 4,
      name: "Hotel Complaint Form",
      description: "Report hotel-related complaints",
      type: "support",
      status: "published",
      fields: 10,
      submissions: 23,
      createdAt: "2025-01-30",
      lastModified: "2025-10-28",
    },
    {
      id: 5,
      name: "Group Booking Request",
      description: "Form for group booking requests",
      type: "booking",
      status: "published",
      fields: 18,
      submissions: 45,
      createdAt: "2025-02-01",
      lastModified: "2025-11-01",
    },
    {
      id: 6,
      name: "Staff Performance Review",
      description: "Internal staff performance evaluation",
      type: "evaluation",
      status: "draft",
      fields: 20,
      submissions: 0,
      createdAt: "2025-02-10",
      lastModified: "2025-11-02",
    },
  ];

  // ============ LIFECYCLE HOOKS ============
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls
        setRules(demoRules);
        setForms(demoForms);
        setAlert({ show: true, type: "success", message: "System data loaded successfully" });
      } catch (err) {
        console.error("Error fetching data:", err);
        setAlert({ show: true, type: "danger", message: "Failed to load system data" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============ FILTERING & SEARCHING ============
  useEffect(() => {
    let filtered = rules;

    if (searchTerm) {
      filtered = filtered.filter(
        (rule) =>
          rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rule.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((rule) => rule.status === selectedStatus);
    }

    setFilteredRules(filtered);
    setCurrentPage(1);
  }, [rules, searchTerm, selectedStatus, activeTab]);

  useEffect(() => {
    let filtered = forms;

    if (searchTerm) {
      filtered = filtered.filter(
        (form) =>
          form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((form) => form.status === selectedStatus);
    }

    setFilteredForms(filtered);
    setCurrentPage(1);
  }, [forms, searchTerm, selectedStatus, activeTab]);

  // ============ STATISTICS ============
  const getRulesStats = () => ({
    total: rules.length,
    active: rules.filter((r) => r.status === "active").length,
    inactive: rules.filter((r) => r.status === "inactive").length,
    critical: rules.filter((r) => r.priority === "critical").length,
  });

  const getFormsStats = () => ({
    total: forms.length,
    published: forms.filter((f) => f.status === "published").length,
    draft: forms.filter((f) => f.status === "draft").length,
    totalSubmissions: forms.reduce((sum, f) => sum + f.submissions, 0),
  });

  const rulesStats = getRulesStats();
  const formsStats = getFormsStats();

  // ============ PAGINATION ============
  const totalRulesPages = Math.ceil(filteredRules.length / itemsPerPage);
  const ruleStartIdx = (currentPage - 1) * itemsPerPage;
  const paginatedRules = filteredRules.slice(ruleStartIdx, ruleStartIdx + itemsPerPage);

  const totalFormsPages = Math.ceil(filteredForms.length / itemsPerPage);
  const formStartIdx = (currentPage - 1) * itemsPerPage;
  const paginatedForms = filteredForms.slice(formStartIdx, formStartIdx + itemsPerPage);

  // ============ BADGE HELPERS ============
  const getStatusBadge = (status) => {
    const colors = { active: "success", inactive: "danger", published: "success", draft: "warning" };
    return (
      <Badge bg={colors[status] || "secondary"}>
        {status === "active" || status === "published" ? (
          <CheckCircle size={14} className="me-1" />
        ) : (
          <AlertCircle size={14} className="me-1" />
        )}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = { critical: "danger", high: "warning", medium: "info", low: "secondary" };
    return <Badge bg={colors[priority] || "secondary"}>{priority.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <Container fluid className="p-0">
          <Header title="System Management" />
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
        <Header title="System Management Hub" />

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

          {/* Tabs */}
          <Card>
            <Card.Body className="p-0">
              <Tabs id="system-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-0">
                {/* ============ RULES TAB ============ */}
                <Tab eventKey="rules" title={<><Settings size={16} className="me-2" />Business Rules</>}>
                  <div className="p-3">
                    {/* Stats Cards */}
                    <Row className="mb-4">
                      <Col md={3} className="mb-3">
                        <Card className="text-center">
                          <Card.Body>
                            <FileText size={32} className="text-primary mb-2" />
                            <h6>Total Rules</h6>
                            <h3 className="text-primary mb-0">{rulesStats.total}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Card className="text-center">
                          <Card.Body>
                            <CheckCircle size={32} className="text-success mb-2" />
                            <h6>Active</h6>
                            <h3 className="text-success mb-0">{rulesStats.active}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Card className="text-center">
                          <Card.Body>
                            <AlertCircle size={32} className="text-danger mb-2" />
                            <h6>Critical</h6>
                            <h3 className="text-danger mb-0">{rulesStats.critical}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Card className="text-center">
                          <Card.Body>
                            <Lock size={32} className="text-warning mb-2" />
                            <h6>Inactive</h6>
                            <h3 className="text-warning mb-0">{rulesStats.inactive}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {/* Filters */}
                    <Card className="mb-3">
                      <Card.Body>
                        <Row className="g-3">
                          <Col md={6}>
                            <InputGroup>
                              <InputGroup.Text>
                                <Search size={16} />
                              </InputGroup.Text>
                              <Form.Control
                                placeholder="Search rules..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </InputGroup>
                          </Col>
                          <Col md={6} className="d-flex gap-2">
                            <Form.Select
                              value={selectedStatus}
                              onChange={(e) => setSelectedStatus(e.target.value)}
                              style={{ flex: 1 }}
                            >
                              <option value="">All Status</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </Form.Select>
                            <Button variant="primary">
                              <Plus size={16} className="me-2" />
                              Add Rule
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Rules Table */}
                    <div style={{ overflowX: "auto" }}>
                      <Table hover>
                        <thead style={{ backgroundColor: "#f8f9fa" }}>
                          <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Updated</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRules.map((rule) => (
                            <tr key={rule.id}>
                              <td>
                                <strong>{rule.name}</strong>
                              </td>
                              <td>{rule.description}</td>
                              <td>
                                <Badge bg="light" text="dark">
                                  {rule.category}
                                </Badge>
                              </td>
                              <td>{getPriorityBadge(rule.priority)}</td>
                              <td>{getStatusBadge(rule.status)}</td>
                              <td>
                                <Clock size={14} className="me-1" />
                                {rule.updatedAt}
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button variant="outline-primary" size="sm">
                                    <Eye size={14} />
                                  </Button>
                                  <Button variant="outline-warning" size="sm">
                                    <Edit2 size={14} />
                                  </Button>
                                  <Button variant="outline-danger" size="sm">
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
                    {totalRulesPages > 1 && (
                      <Pagination className="justify-content-center mt-4">
                        <Pagination.First
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(1)}
                        />
                        <Pagination.Prev
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        />
                        {Array.from({ length: Math.min(5, totalRulesPages) }, (_, i) => (
                          <Pagination.Item
                            key={i + 1}
                            active={i + 1 === currentPage}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next
                          disabled={currentPage === totalRulesPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        />
                        <Pagination.Last
                          disabled={currentPage === totalRulesPages}
                          onClick={() => setCurrentPage(totalRulesPages)}
                        />
                      </Pagination>
                    )}
                  </div>
                </Tab>

                {/* ============ FORMS TAB ============ */}
                <Tab eventKey="forms" title={<><FileText size={16} className="me-2" />Forms & Surveys</>}>
                  <div className="p-3">
                    {/* Stats Cards */}
                    <Row className="mb-4">
                      <Col md={3} className="mb-3">
                        <Card className="text-center">
                          <Card.Body>
                            <FileText size={32} className="text-primary mb-2" />
                            <h6>Total Forms</h6>
                            <h3 className="text-primary mb-0">{formsStats.total}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Card className="text-center">
                          <Card.Body>
                            <CheckCircle size={32} className="text-success mb-2" />
                            <h6>Published</h6>
                            <h3 className="text-success mb-0">{formsStats.published}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Card className="text-center">
                          <Card.Body>
                            <AlertCircle size={32} className="text-warning mb-2" />
                            <h6>Drafts</h6>
                            <h3 className="text-warning mb-0">{formsStats.draft}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Card className="text-center">
                          <Card.Body>
                            <TrendingUp size={32} className="text-info mb-2" />
                            <h6>Submissions</h6>
                            <h3 className="text-info mb-0">{formsStats.totalSubmissions}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {/* Filters */}
                    <Card className="mb-3">
                      <Card.Body>
                        <Row className="g-3">
                          <Col md={6}>
                            <InputGroup>
                              <InputGroup.Text>
                                <Search size={16} />
                              </InputGroup.Text>
                              <Form.Control
                                placeholder="Search forms..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </InputGroup>
                          </Col>
                          <Col md={6} className="d-flex gap-2">
                            <Form.Select
                              value={selectedStatus}
                              onChange={(e) => setSelectedStatus(e.target.value)}
                              style={{ flex: 1 }}
                            >
                              <option value="">All Status</option>
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                            </Form.Select>
                            <Button variant="primary">
                              <Plus size={16} className="me-2" />
                              Create Form
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Forms Table */}
                    <div style={{ overflowX: "auto" }}>
                      <Table hover>
                        <thead style={{ backgroundColor: "#f8f9fa" }}>
                          <tr>
                            <th>Form Name</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Fields</th>
                            <th>Submissions</th>
                            <th>Last Modified</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedForms.map((form) => (
                            <tr key={form.id}>
                              <td>
                                <strong>{form.name}</strong>
                                <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                                  {form.description}
                                </div>
                              </td>
                              <td>
                                <Badge bg="light" text="dark">
                                  {form.type}
                                </Badge>
                              </td>
                              <td>{getStatusBadge(form.status)}</td>
                              <td>
                                <strong>{form.fields}</strong>
                              </td>
                              <td>
                                <TrendingUp size={14} className="me-1" />
                                {form.submissions}
                              </td>
                              <td>{form.lastModified}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button variant="outline-primary" size="sm">
                                    <Eye size={14} />
                                  </Button>
                                  <Button variant="outline-warning" size="sm">
                                    <Edit2 size={14} />
                                  </Button>
                                  <Button variant="outline-danger" size="sm">
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
                    {totalFormsPages > 1 && (
                      <Pagination className="justify-content-center mt-4">
                        <Pagination.First
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(1)}
                        />
                        <Pagination.Prev
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        />
                        {Array.from({ length: Math.min(5, totalFormsPages) }, (_, i) => (
                          <Pagination.Item
                            key={i + 1}
                            active={i + 1 === currentPage}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next
                          disabled={currentPage === totalFormsPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        />
                        <Pagination.Last
                          disabled={currentPage === totalFormsPages}
                          onClick={() => setCurrentPage(totalFormsPages)}
                        />
                      </Pagination>
                    )}
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

export default UnifiedSystemManagement;
