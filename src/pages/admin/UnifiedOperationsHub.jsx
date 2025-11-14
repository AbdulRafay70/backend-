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
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Clock,
  BookOpen,
  Newspaper,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar as CalendarIcon,
} from "lucide-react";
import axios from "axios";

const UnifiedOperationsHub = () => {
  // ============ STATE MANAGEMENT ============
  const [activeTab, setActiveTab] = useState("operations");
  const [operations, setOperations] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [filteredOperations, setFilteredOperations] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const itemsPerPage = 10;

  // ============ DEMO DATA - DAILY OPERATIONS ============
  const demoOperations = [
    {
      id: 1,
      title: "Morning Briefing",
      description: "Daily team briefing on today's tasks",
      type: "briefing",
      status: "completed",
      assignedTo: "Ahmad Hassan",
      date: "2025-11-02",
      time: "09:00 AM",
      priority: "high",
    },
    {
      id: 2,
      title: "Check Umrah Bookings",
      description: "Review pending Umrah package bookings",
      type: "task",
      status: "in-progress",
      assignedTo: "Fatima Ahmed",
      date: "2025-11-02",
      time: "10:00 AM",
      priority: "high",
    },
    {
      id: 3,
      title: "Hotel Availability Update",
      description: "Update available hotels for next month",
      type: "task",
      status: "pending",
      assignedTo: "Muhammad Ali",
      date: "2025-11-02",
      time: "02:00 PM",
      priority: "medium",
    },
    {
      id: 4,
      title: "Customer Support Calls",
      description: "Handle customer inquiries and complaints",
      type: "support",
      status: "completed",
      assignedTo: "Ayesha Khan",
      date: "2025-11-01",
      time: "11:00 AM",
      priority: "medium",
    },
  ];

  // ============ DEMO DATA - BLOGS ============
  const demoBlogs = [
    {
      id: 1,
      title: "10 Best Umrah Packages for 2025",
      author: "Ahmad Hassan",
      category: "travel",
      status: "published",
      views: 1240,
      likes: 85,
      publishedAt: "2025-11-01",
      excerpt: "Explore the best umrah packages available for the upcoming season",
    },
    {
      id: 2,
      title: "How to Prepare for Your Umrah Journey",
      author: "Fatima Ahmed",
      category: "guide",
      status: "published",
      views: 856,
      likes: 62,
      publishedAt: "2025-10-28",
      excerpt: "Complete preparation guide for your spiritual journey",
    },
    {
      id: 3,
      title: "Visa Requirements and Documents",
      author: "Muhammad Ali",
      category: "documentation",
      status: "draft",
      views: 0,
      likes: 0,
      publishedAt: null,
      excerpt: "Updated visa requirements for Umrah in 2025",
    },
    {
      id: 4,
      title: "Tips for Budget-Friendly Umrah",
      author: "Ayesha Khan",
      category: "tips",
      status: "published",
      views: 2134,
      likes: 156,
      publishedAt: "2025-10-25",
      excerpt: "Save money on your umrah trip without compromising quality",
    },
  ];

  // ============ LIFECYCLE HOOKS ============
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls
        setOperations(demoOperations);
        setBlogs(demoBlogs);
        setAlert({ show: true, type: "success", message: "Operations and blogs loaded" });
      } catch (err) {
        console.error("Error fetching data:", err);
        setAlert({ show: true, type: "danger", message: "Failed to load data" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============ FILTERING & SEARCHING ============
  useEffect(() => {
    let filtered = operations;

    if (searchTerm) {
      filtered = filtered.filter(
        (op) =>
          op.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          op.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((op) => op.status === selectedStatus);
    }

    setFilteredOperations(filtered);
    setCurrentPage(1);
  }, [operations, searchTerm, selectedStatus, activeTab]);

  useEffect(() => {
    let filtered = blogs;

    if (searchTerm) {
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((blog) => blog.status === selectedStatus);
    }

    setFilteredBlogs(filtered);
    setCurrentPage(1);
  }, [blogs, searchTerm, selectedStatus, activeTab]);

  // ============ STATISTICS ============
  const getOperationStats = () => ({
    total: operations.length,
    completed: operations.filter((o) => o.status === "completed").length,
    inProgress: operations.filter((o) => o.status === "in-progress").length,
    pending: operations.filter((o) => o.status === "pending").length,
  });

  const getBlogStats = () => ({
    total: blogs.length,
    published: blogs.filter((b) => b.status === "published").length,
    draft: blogs.filter((b) => b.status === "draft").length,
    totalViews: blogs.reduce((sum, b) => sum + b.views, 0),
  });

  const opStats = getOperationStats();
  const blogStats = getBlogStats();

  // ============ PAGINATION ============
  const totalOpPages = Math.ceil(filteredOperations.length / itemsPerPage);
  const opStartIdx = (currentPage - 1) * itemsPerPage;
  const paginatedOperations = filteredOperations.slice(opStartIdx, opStartIdx + itemsPerPage);

  const totalBlogPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const blogStartIdx = (currentPage - 1) * itemsPerPage;
  const paginatedBlogs = filteredBlogs.slice(blogStartIdx, blogStartIdx + itemsPerPage);

  // ============ BADGE HELPERS ============
  const getStatusBadge = (status) => {
    const colors = {
      completed: "success",
      "in-progress": "warning",
      pending: "danger",
      published: "success",
      draft: "secondary",
    };
    return (
      <Badge bg={colors[status] || "secondary"}>
        {status === "completed" || status === "published" ? <CheckCircle size={12} className="me-1" /> : <AlertCircle size={12} className="me-1" />}
        {status.replace("-", " ").toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = { high: "danger", medium: "warning", low: "info" };
    return <Badge bg={colors[priority] || "secondary"}>{priority.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <Container fluid className="p-0">
          <Header title="Operations & Blog Management" />
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
        <Header title="Daily Operations & Blog Management Hub" />

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
              <Tabs id="ops-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-0">
                {/* ============ DAILY OPERATIONS TAB ============ */}
                <Tab eventKey="operations" title={<><Clock size={16} className="me-2" />Daily Operations</>}>
                  <div className="p-3">
                    {/* Stats Cards */}
                    <div className="mb-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #0d6efd" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Total Tasks</p>
                            <h3 style={{ fontSize: "2rem", color: "#0d6efd", fontWeight: "bold", margin: 0 }}>{opStats.total}</h3>
                          </div>
                          <Calendar size={32} style={{ color: "#0d6efd", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #198754" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Completed</p>
                            <h3 style={{ fontSize: "2rem", color: "#198754", fontWeight: "bold", margin: 0 }}>{opStats.completed}</h3>
                          </div>
                          <CheckCircle size={32} style={{ color: "#198754", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #ffc107" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>In Progress</p>
                            <h3 style={{ fontSize: "2rem", color: "#ffc107", fontWeight: "bold", margin: 0 }}>{opStats.inProgress}</h3>
                          </div>
                          <Clock size={32} style={{ color: "#ffc107", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #dc3545" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Pending</p>
                            <h3 style={{ fontSize: "2rem", color: "#dc3545", fontWeight: "bold", margin: 0 }}>{opStats.pending}</h3>
                          </div>
                          <AlertCircle size={32} style={{ color: "#dc3545", opacity: 0.2 }} />
                        </div>
                      </div>
                    </div>

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
                                placeholder="Search operations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </InputGroup>
                          </Col>
                          <Col md={6} className="d-flex gap-2">
                            <Form.Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ flex: 1 }}>
                              <option value="">All Status</option>
                              <option value="completed">Completed</option>
                              <option value="in-progress">In Progress</option>
                              <option value="pending">Pending</option>
                            </Form.Select>
                            <Button variant="primary">
                              <Plus size={16} className="me-2" />
                              New Task
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Operations Table */}
                    <div style={{ overflowX: "auto" }}>
                      <Table hover>
                        <thead style={{ backgroundColor: "#f8f9fa" }}>
                          <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Assigned To</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Date & Time</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedOperations.map((op) => (
                            <tr key={op.id}>
                              <td>
                                <strong>{op.title}</strong>
                                <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>{op.description}</div>
                              </td>
                              <td>
                                <Badge bg="light" text="dark">
                                  {op.type.toUpperCase()}
                                </Badge>
                              </td>
                              <td>{op.assignedTo}</td>
                              <td>{getStatusBadge(op.status)}</td>
                              <td>{getPriorityBadge(op.priority)}</td>
                              <td>
                                <Calendar size={14} className="me-1" />
                                {op.date} {op.time}
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
                    {totalOpPages > 1 && (
                      <Pagination className="justify-content-center mt-4">
                        <Pagination.First disabled={currentPage === 1} onClick={() => setCurrentPage(1)} />
                        <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />
                        {Array.from({ length: Math.min(5, totalOpPages) }, (_, i) => (
                          <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next disabled={currentPage === totalOpPages} onClick={() => setCurrentPage(currentPage + 1)} />
                        <Pagination.Last disabled={currentPage === totalOpPages} onClick={() => setCurrentPage(totalOpPages)} />
                      </Pagination>
                    )}
                  </div>
                </Tab>

                {/* ============ BLOG MANAGEMENT TAB ============ */}
                <Tab eventKey="blogs" title={<><Newspaper size={16} className="me-2" />Blog Management</>}>
                  <div className="p-3">
                    {/* Stats Cards */}
                    <div className="mb-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #0d6efd" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Total Blogs</p>
                            <h3 style={{ fontSize: "2rem", color: "#0d6efd", fontWeight: "bold", margin: 0 }}>{blogStats.total}</h3>
                          </div>
                          <BookOpen size={32} style={{ color: "#0d6efd", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #198754" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Published</p>
                            <h3 style={{ fontSize: "2rem", color: "#198754", fontWeight: "bold", margin: 0 }}>{blogStats.published}</h3>
                          </div>
                          <CheckCircle size={32} style={{ color: "#198754", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #ffc107" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Drafts</p>
                            <h3 style={{ fontSize: "2rem", color: "#ffc107", fontWeight: "bold", margin: 0 }}>{blogStats.draft}</h3>
                          </div>
                          <Clock size={32} style={{ color: "#ffc107", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #0dcaf0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Total Views</p>
                            <h3 style={{ fontSize: "2rem", color: "#0dcaf0", fontWeight: "bold", margin: 0 }}>{blogStats.totalViews}</h3>
                          </div>
                          <TrendingUp size={32} style={{ color: "#0dcaf0", opacity: 0.2 }} />
                        </div>
                      </div>
                    </div>

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
                                placeholder="Search blogs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </InputGroup>
                          </Col>
                          <Col md={6} className="d-flex gap-2">
                            <Form.Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ flex: 1 }}>
                              <option value="">All Status</option>
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                            </Form.Select>
                            <Button variant="primary">
                              <Plus size={16} className="me-2" />
                              New Blog
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Blogs Table */}
                    <div style={{ overflowX: "auto" }}>
                      <Table hover>
                        <thead style={{ backgroundColor: "#f8f9fa" }}>
                          <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Views</th>
                            <th>Likes</th>
                            <th>Published</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedBlogs.map((blog) => (
                            <tr key={blog.id}>
                              <td>
                                <strong>{blog.title}</strong>
                                <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>{blog.excerpt}</div>
                              </td>
                              <td>{blog.author}</td>
                              <td>
                                <Badge bg="light" text="dark">
                                  {blog.category}
                                </Badge>
                              </td>
                              <td>{getStatusBadge(blog.status)}</td>
                              <td>
                                <strong>{blog.views}</strong>
                              </td>
                              <td>
                                <strong>{blog.likes}</strong>
                              </td>
                              <td>
                                <Calendar size={14} className="me-1" />
                                {blog.publishedAt || "Not published"}
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
                    {totalBlogPages > 1 && (
                      <Pagination className="justify-content-center mt-4">
                        <Pagination.First disabled={currentPage === 1} onClick={() => setCurrentPage(1)} />
                        <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />
                        {Array.from({ length: Math.min(5, totalBlogPages) }, (_, i) => (
                          <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next disabled={currentPage === totalBlogPages} onClick={() => setCurrentPage(currentPage + 1)} />
                        <Pagination.Last disabled={currentPage === totalBlogPages} onClick={() => setCurrentPage(totalBlogPages)} />
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

export default UnifiedOperationsHub;
