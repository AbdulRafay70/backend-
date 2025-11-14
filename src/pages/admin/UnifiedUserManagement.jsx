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
  Users,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Shield,
  TrendingUp,
  Download,
} from "lucide-react";
import axios from "axios";

const UnifiedUserManagement = () => {
  // ============ STATE MANAGEMENT ============
  const [activeTab, setActiveTab] = useState("all");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "agent",
    status: "active",
    entityName: "",
    entityType: "individual",
  });

  const itemsPerPage = 10;

  // ============ DEMO DATA ============
  const demoUsers = [
    {
      id: 1,
      name: "Ahmad Hassan",
      email: "ahmad@saer.pk",
      phone: "+92 300 1234567",
      role: "admin",
      status: "active",
      type: "user",
      createdAt: "2025-01-01",
      lastLogin: "2025-11-02",
    },
    {
      id: 2,
      name: "Fatima Ahmed",
      email: "fatima@saer.pk",
      phone: "+92 300 2345678",
      role: "agent",
      status: "active",
      type: "user",
      createdAt: "2025-01-05",
      lastLogin: "2025-11-01",
    },
    {
      id: 3,
      name: "Muhammad Ali",
      email: "ali@saer.pk",
      phone: "+92 300 3456789",
      role: "subagent",
      status: "inactive",
      type: "user",
      createdAt: "2025-01-10",
      lastLogin: "2025-10-20",
    },
    {
      id: 4,
      name: "Ayesha Khan",
      email: "ayesha@saer.pk",
      phone: "+92 300 4567890",
      role: "operator",
      status: "active",
      type: "user",
      createdAt: "2025-01-15",
      lastLogin: "2025-11-02",
    },
    {
      id: 5,
      name: "Hassan Raza",
      email: "hassan@saer.pk",
      phone: "+92 300 5678901",
      role: "admin",
      status: "active",
      type: "user",
      createdAt: "2025-01-20",
      lastLogin: "2025-10-30",
    },
    {
      id: 6,
      name: "Saira Malik",
      email: "saira@saer.pk",
      phone: "+92 300 6789012",
      role: "agent",
      status: "active",
      type: "user",
      createdAt: "2025-02-01",
      lastLogin: "2025-11-02",
    },
  ];

  const roles = ["admin", "agent", "subagent", "operator"];
  const entityTypes = ["individual", "company", "agency", "partner"];

  // ============ LIFECYCLE HOOKS ============
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls
        // const response = await axios.get(`/api/users/`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(demoUsers);
        setAlert({ show: true, type: "success", message: "Users loaded successfully" });
      } catch (err) {
        console.error("Error fetching users:", err);
        setAlert({ show: true, type: "danger", message: "Failed to load users" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============ FILTERING & SEARCHING ============
  useEffect(() => {
    let filtered = users;

    // Filter by role based on active tab
    if (activeTab === "admin") {
      filtered = filtered.filter((user) => user.role === "admin");
    } else if (activeTab === "agents") {
      filtered = filtered.filter((user) => ["agent", "subagent"].includes(user.role));
    } else if (activeTab === "operators") {
      filtered = filtered.filter((user) => user.role === "operator");
    } else if (activeTab === "inactive") {
      filtered = filtered.filter((user) => user.status === "inactive");
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm)
      );
    }

    // Apply role filter
    if (selectedRole && activeTab === "all") {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [activeTab, users, searchTerm, selectedRole]);

  // ============ STATISTICS ============
  const getStats = () => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      admins: users.filter((u) => u.role === "admin").length,
      agents: users.filter((u) => ["agent", "subagent"].includes(u.role)).length,
    };
  };

  const stats = getStats();

  // ============ PAGINATION ============
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIdx, startIdx + itemsPerPage);

  // ============ BADGE HELPERS ============
  const getStatusBadge = (status) => {
    return status === "active" ? (
      <Badge bg="success">
        <CheckCircle size={14} className="me-1" />
        Active
      </Badge>
    ) : (
      <Badge bg="danger">
        <AlertCircle size={14} className="me-1" />
        Inactive
      </Badge>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: "primary",
      agent: "info",
      subagent: "warning",
      operator: "secondary",
    };
    return <Badge bg={roleColors[role] || "secondary"}>{role.toUpperCase()}</Badge>;
  };

  // ============ REGISTRATION HANDLERS ============
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!newUser.name || !newUser.email || !newUser.phone) {
      setAlert({ show: true, type: "danger", message: "Please fill all required fields" });
      return;
    }

    try {
      // TODO: Replace with actual API call
      const userId = users.length + 1;
      const registeredUser = {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        type: newUser.entityType,
        createdAt: new Date().toISOString().split("T")[0],
        lastLogin: new Date().toISOString().split("T")[0],
      };

      setUsers([...users, registeredUser]);
      setAlert({ show: true, type: "success", message: `${newUser.name} registered successfully!` });

      // Reset form and close modal
      setNewUser({
        name: "",
        email: "",
        phone: "",
        role: "agent",
        status: "active",
        entityName: "",
        entityType: "individual",
      });
      setShowModal(false);
    } catch (err) {
      console.error("Registration error:", err);
      setAlert({ show: true, type: "danger", message: "Failed to register user. Please try again." });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  // ============ RENDER USERS TABLE ============
  const renderUsersTable = () => (
    <div style={{ overflowX: "auto" }}>
      <Table hover responsive>
        <thead style={{ backgroundColor: "#f8f9fa" }}>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map((user) => (
            <tr key={user.id}>
              <td>
                <strong>{user.name}</strong>
              </td>
              <td>
                <Mail size={14} className="me-2" />
                {user.email}
              </td>
              <td>
                <Phone size={14} className="me-2" />
                {user.phone}
              </td>
              <td>{getRoleBadge(user.role)}</td>
              <td>{getStatusBadge(user.status)}</td>
              <td>
                <Calendar size={14} className="me-1" />
                {user.createdAt}
              </td>
              <td>{user.lastLogin}</td>
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
          <Header title="User Management" />
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
        <Header title="User Management Hub" />

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

          {/* Stats Cards - Grid Layout */}
          <div className="mb-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {/* Total Users Card */}
            <div style={{ padding: "1.5rem", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #0d6efd", backgroundColor: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem", fontWeight: "500" }}>Total Users</p>
                  <h3 style={{ fontSize: "2.5rem", color: "#0d6efd", fontWeight: "bold", margin: 0 }}>{stats.total}</h3>
                </div>
                <Users size={40} style={{ color: "#0d6efd", opacity: 0.2 }} />
              </div>
              <small style={{ color: "#6c757d" }}>All registered users</small>
            </div>

            {/* Active Users Card */}
            <div style={{ padding: "1.5rem", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #198754", backgroundColor: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem", fontWeight: "500" }}>Active Users</p>
                  <h3 style={{ fontSize: "2.5rem", color: "#198754", fontWeight: "bold", margin: 0 }}>{stats.active}</h3>
                </div>
                <CheckCircle size={40} style={{ color: "#198754", opacity: 0.2 }} />
              </div>
              <small style={{ color: "#6c757d" }}>Currently active</small>
            </div>

            {/* Inactive Users Card */}
            <div style={{ padding: "1.5rem", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #dc3545", backgroundColor: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem", fontWeight: "500" }}>Inactive Users</p>
                  <h3 style={{ fontSize: "2.5rem", color: "#dc3545", fontWeight: "bold", margin: 0 }}>{stats.inactive}</h3>
                </div>
                <AlertCircle size={40} style={{ color: "#dc3545", opacity: 0.2 }} />
              </div>
              <small style={{ color: "#6c757d" }}>Needs attention</small>
            </div>

            {/* Admins Card */}
            <div style={{ padding: "1.5rem", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #0dcaf0", backgroundColor: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem", fontWeight: "500" }}>Admins</p>
                  <h3 style={{ fontSize: "2.5rem", color: "#0dcaf0", fontWeight: "bold", margin: 0 }}>{stats.admins}</h3>
                </div>
                <Shield size={40} style={{ color: "#0dcaf0", opacity: 0.2 }} />
              </div>
              <small style={{ color: "#6c757d" }}>System admins</small>
            </div>

            {/* Agents Card */}
            <div style={{ padding: "1.5rem", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #fd7e14", backgroundColor: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem", fontWeight: "500" }}>Agents</p>
                  <h3 style={{ fontSize: "2.5rem", color: "#fd7e14", fontWeight: "bold", margin: 0 }}>{stats.agents}</h3>
                </div>
                <TrendingUp size={40} style={{ color: "#fd7e14", opacity: 0.2 }} />
              </div>
              <small style={{ color: "#6c757d" }}>Active agents</small>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
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
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Filter by Role</Form.Label>
                    <Form.Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                      <option value="">All Roles</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role.toUpperCase()}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button variant="primary" className="w-100" onClick={() => setShowModal(true)}>
                    <Plus size={16} className="me-2" />
                    Register New User
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabs */}
          <Card>
            <Card.Body className="p-0">
              <Tabs id="user-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-0">
                <Tab eventKey="all" title={<><Users size={16} className="me-2" />All Users</>}>
                  <div className="p-3">
                    {paginatedUsers.length > 0 ? (
                      <>
                        {renderUsersTable()}
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
                      <Alert variant="info">No users found</Alert>
                    )}
                  </div>
                </Tab>

                <Tab
                  eventKey="admin"
                  title={
                    <>
                      <Shield size={16} className="me-2" />
                      Admins ({users.filter((u) => u.role === "admin").length})
                    </>
                  }
                >
                  <div className="p-3">
                    {paginatedUsers.length > 0 ? (
                      <>
                        {renderUsersTable()}
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
                      <Alert variant="info">No admin users found</Alert>
                    )}
                  </div>
                </Tab>

                <Tab
                  eventKey="agents"
                  title={
                    <>
                      <UserPlus size={16} className="me-2" />
                      Agents & Subagents ({users.filter((u) => ["agent", "subagent"].includes(u.role)).length})
                    </>
                  }
                >
                  <div className="p-3">
                    {paginatedUsers.length > 0 ? (
                      <>
                        {renderUsersTable()}
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
                      <Alert variant="info">No agent users found</Alert>
                    )}
                  </div>
                </Tab>

                <Tab
                  eventKey="inactive"
                  title={
                    <>
                      <AlertCircle size={16} className="me-2" />
                      Inactive ({users.filter((u) => u.status === "inactive").length})
                    </>
                  }
                >
                  <div className="p-3">
                    {paginatedUsers.length > 0 ? (
                      <>
                        {renderUsersTable()}
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
                      <Alert variant="info">No inactive users found</Alert>
                    )}
                  </div>
                </Tab>

                <Tab eventKey="analytics" title={<><TrendingUp size={16} className="me-2" />Analytics</>}>
                  <div className="p-3">
                    <Row>
                      <Col md={6}>
                        <Card>
                          <Card.Header>
                            <Card.Title className="mb-0">Users by Role</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <div className="mb-2">
                              <span>Admins</span>
                              <span className="badge bg-primary float-end">{stats.admins}</span>
                            </div>
                            <div className="mb-2">
                              <span>Agents</span>
                              <span className="badge bg-info float-end">{stats.agents}</span>
                            </div>
                            <div className="mb-2">
                              <span>Operators</span>
                              <span className="badge bg-secondary float-end">
                                {users.filter((u) => u.role === "operator").length}
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card>
                          <Card.Header>
                            <Card.Title className="mb-0">Users by Status</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <div className="mb-2">
                              <span>Active Users</span>
                              <span className="badge bg-success float-end">{stats.active}</span>
                            </div>
                            <div className="mb-2">
                              <span>Inactive Users</span>
                              <span className="badge bg-danger float-end">{stats.inactive}</span>
                            </div>
                            <div className="progress mt-3">
                              <div
                                className="progress-bar bg-success"
                                style={{ width: `${(stats.active / stats.total) * 100}%` }}
                              >
                                {((stats.active / stats.total) * 100).toFixed(0)}%
                              </div>
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

          {/* Registration Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                <UserPlus size={20} className="me-2" />
                Register New User / Entity
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleRegisterSubmit}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="Enter full name"
                        value={newUser.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Email Address *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter email"
                        value={newUser.email}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Phone Number *</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        placeholder="+92 300 1234567"
                        value={newUser.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Entity Type</Form.Label>
                      <Form.Select name="entityType" value={newUser.entityType} onChange={handleInputChange}>
                        {entityTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">User Role *</Form.Label>
                      <Form.Select name="role" value={newUser.role} onChange={handleInputChange} required>
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Status</Form.Label>
                      <Form.Select name="status" value={newUser.status} onChange={handleInputChange}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Entity Name (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="entityName"
                    placeholder="e.g., Company name, Agency name"
                    value={newUser.entityName}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <div className="bg-light p-3 rounded mb-3">
                  <small className="text-muted">
                    <strong>Note:</strong> User will receive credentials via email. All required fields marked with * must be filled.
                  </small>
                </div>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRegisterSubmit}>
                <UserPlus size={16} className="me-2" />
                Register User
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </Container>
    </div>
  );
};

export default UnifiedUserManagement;
