import React, { useState, useEffect } from "react";
import { 
  Card, 
  Row, 
  Col, 
  Badge, 
  Table, 
  Button, 
  Form, 
  Modal, 
  Alert,
  Spinner
} from "react-bootstrap";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X,
  Globe,
  CheckCircle,
  XCircle,
  Search
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../utils/Api";

const RulesManagement = () => {
  // State Management
  const [rules, setRules] = useState([]);
  const [filteredRules, setFilteredRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create or edit
  const [selectedRule, setSelectedRule] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPage, setFilterPage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    rule_type: "terms_and_conditions",
    pages_to_display: [],
    is_active: true,
    language: "en",
    created_by: "admin_001"
  });

  // Alert State
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Rule Types Configuration
  const ruleTypes = [
    { value: "terms_and_conditions", label: "Terms & Conditions" },
    { value: "cancellation_policy", label: "Cancellation Policy" },
    { value: "refund_policy", label: "Refund Policy" },
    { value: "commission_policy", label: "Commission Policy" },
    { value: "transport_policy", label: "Transport Policy" },
    { value: "document_policy", label: "Document Policy" },
    { value: "hotel_policy", label: "Hotel Policy" },
    { value: "visa_policy", label: "Visa Policy" }
  ];

  // Pages Configuration
  const availablePages = [
    { value: "booking_page", label: "Booking Page" },
    { value: "agent_portal", label: "Agent Portal" },
    { value: "hotel_page", label: "Hotel Page" },
    { value: "transport_page", label: "Transport Page" },
    { value: "visa_page", label: "Visa Page" },
    { value: "payment_page", label: "Payment Page" },
    { value: "dashboard", label: "Dashboard" }
  ];

  // Load rules from API on mount
  useEffect(() => {
    fetchRules();
  }, []);

  // API Functions
  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await api.get("/rules/list");
      setRules(response.data.rules || []);
      setAlert({ show: false, type: "", message: "" });
    } catch (error) {
      console.error("Error fetching rules:", error);
      showAlert("error", "Failed to load rules. Please try again.");
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (ruleData) => {
    try {
      const response = await api.post("/rules/create", ruleData);
      if (response.data.success) {
        await fetchRules(); // Refresh the list
        showAlert("success", "Rule created successfully");
        return true;
      } else {
        showAlert("error", response.data.message || "Failed to create rule");
        return false;
      }
    } catch (error) {
      console.error("Error creating rule:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || "Failed to create rule";
      showAlert("error", errorMessage);
      return false;
    }
  };

  const updateRule = async (ruleData) => {
    try {
      const response = await api.post("/rules/create", ruleData); // Same endpoint handles create/update
      if (response.data.success) {
        await fetchRules(); // Refresh the list
        showAlert("success", "Rule updated successfully");
        return true;
      } else {
        showAlert("error", response.data.message || "Failed to update rule");
        return false;
      }
    } catch (error) {
      console.error("Error updating rule:", error);
      const errorMessage = error.response?.data?.message || "Failed to update rule";
      showAlert("error", errorMessage);
      return false;
    }
  };

  const deleteRule = async (id) => {
    try {
      const response = await api.delete(`/rules/delete/${id}`);
      if (response.data.success) {
        await fetchRules(); // Refresh the list
        showAlert("success", "Rule deleted successfully");
        return true;
      } else {
        showAlert("error", response.data.message || "Failed to delete rule");
        return false;
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete rule";
      showAlert("error", errorMessage);
      return false;
    }
  };

  const toggleRuleStatus = async (id) => {
    try {
      // First get the current rule to toggle its status
      const rule = rules.find(r => r.id === id);
      if (!rule) return;

      const updatedRule = { ...rule, is_active: !rule.is_active };
      const response = await api.post("/rules/create", updatedRule);
      if (response.data.success) {
        await fetchRules(); // Refresh the list
        showAlert("success", "Rule status updated successfully");
      } else {
        showAlert("error", response.data.message || "Failed to update rule status");
      }
    } catch (error) {
      console.error("Error toggling rule status:", error);
      const errorMessage = error.response?.data?.message || "Failed to update rule status";
      showAlert("error", errorMessage);
    }
  };

  // Filter rules based on search and filters
  useEffect(() => {
    let result = [...rules];

    // Search filter
    if (searchQuery) {
      result = result.filter(rule =>
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      result = result.filter(rule => rule.rule_type === filterType);
    }

    // Page filter
    if (filterPage !== "all") {
      result = result.filter(rule => rule.pages_to_display.includes(filterPage));
    }

    // Status filter
    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      result = result.filter(rule => rule.is_active === isActive);
    }

    setFilteredRules(result);
  }, [searchQuery, filterType, filterPage, filterStatus, rules]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Handle multi-select pages
  const handlePagesChange = (page) => {
    setFormData(prev => {
      const pages = [...prev.pages_to_display];
      const index = pages.indexOf(page);
      if (index > -1) {
        pages.splice(index, 1);
      } else {
        pages.push(page);
      }
      return { ...prev, pages_to_display: pages };
    });
  };

  // Open create modal
  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      id: null,
      title: "",
      description: "",
      rule_type: "terms_and_conditions",
      pages_to_display: [],
      is_active: true,
      language: "en",
      created_by: "admin_001"
    });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (rule) => {
    setModalMode("edit");
    setFormData({
      id: rule.id,
      title: rule.title,
      description: rule.description,
      rule_type: rule.rule_type,
      pages_to_display: [...rule.pages_to_display],
      is_active: rule.is_active,
      language: rule.language,
      created_by: rule.created_by
    });
    setShowModal(true);
  };

  // Open view modal
  const openViewModal = (rule) => {
    setSelectedRule(rule);
    setShowViewModal(true);
  };

  // Handle form submit (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.title.trim() || !formData.description.trim()) {
      showAlert("error", "Title and description are required");
      setLoading(false);
      return;
    }

    if (formData.pages_to_display.length === 0) {
      showAlert("error", "Please select at least one page to display");
      setLoading(false);
      return;
    }

    // Prepare data for API - remove created_by as backend handles it from authenticated user
    const { created_by, ...apiData } = formData;

    let success = false;
    if (modalMode === "create") {
      success = await createRule(apiData);
    } else {
      success = await updateRule(apiData);
    }

    setLoading(false);
    if (success) {
      setShowModal(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      setLoading(true);
      const success = await deleteRule(id);
      setLoading(false);
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (id) => {
    setLoading(true);
    await toggleRuleStatus(id);
    setLoading(false);
  };

  // Show alert helper
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 3000);
  };

  // Get rule type label
  const getRuleTypeLabel = (value) => {
    const type = ruleTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  // Get page label
  const getPageLabel = (value) => {
    const page = availablePages.find(p => p.value === value);
    return page ? page.label : value;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-vh-100 bg-light">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container-fluid">
            <Header />
            <div className="p-3 p-lg-4">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                  <h3 className="mb-1">
                    <FileText size={28} className="me-2 text-primary" style={{ verticalAlign: "middle" }} />
                    Rules Management
                  </h3>
                  <small className="text-muted">
                    Manage Terms & Conditions, Policies, and Business Rules
                  </small>
                </div>
                <Button variant="primary" onClick={openCreateModal}>
                  <Plus size={18} className="me-2" />
                  Create New Rule
                </Button>
              </div>

              {/* Alert */}
              {alert.show && (
                <Alert variant={alert.type === "success" ? "success" : "danger"} dismissible onClose={() => setAlert({ ...alert, show: false })}>
                  {alert.message}
                </Alert>
              )}

              {/* Statistics Cards */}
              <Row className="mb-4">
                <Col xs={12} sm={6} lg={3} className="mb-3">
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="text-primary mb-2">
                        <FileText size={32} />
                      </div>
                      <h4 className="mb-1">{rules.length}</h4>
                      <small className="text-muted">Total Rules</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} lg={3} className="mb-3">
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="text-success mb-2">
                        <CheckCircle size={32} />
                      </div>
                      <h4 className="mb-1">{rules.filter(r => r.is_active).length}</h4>
                      <small className="text-muted">Active Rules</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} lg={3} className="mb-3">
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="text-danger mb-2">
                        <XCircle size={32} />
                      </div>
                      <h4 className="mb-1">{rules.filter(r => !r.is_active).length}</h4>
                      <small className="text-muted">Inactive Rules</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} lg={3} className="mb-3">
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="text-info mb-2">
                        <Globe size={32} />
                      </div>
                      <h4 className="mb-1">{rules.filter(r => r.language === "ur").length}</h4>
                      <small className="text-muted">Urdu Rules</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Filters */}
              <Card className="shadow-sm mb-4">
                <Card.Body>
                  <Row className="g-3">
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Search</Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type="text"
                            placeholder="Search rules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-5"
                          />
                          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Rule Type</Form.Label>
                        <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                          <option value="all">All Types</option>
                          {ruleTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Display Page</Form.Label>
                        <Form.Select value={filterPage} onChange={(e) => setFilterPage(e.target.value)}>
                          <option value="all">All Pages</option>
                          {availablePages.map(page => (
                            <option key={page.value} value={page.value}>{page.label}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Status</Form.Label>
                        <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                          <option value="all">All Status</option>
                          <option value="active">Active Only</option>
                          <option value="inactive">Inactive Only</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  {(searchQuery || filterType !== "all" || filterPage !== "all" || filterStatus !== "all") && (
                    <div className="mt-3">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterType("all");
                          setFilterPage("all");
                          setFilterStatus("all");
                        }}
                      >
                        <X size={14} className="me-1" />
                        Clear Filters
                      </Button>
                      <small className="text-muted ms-3">
                        Showing {filteredRules.length} of {rules.length} rules
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Rules Table */}
              <Card className="shadow-sm">
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Type</th>
                          <th className="d-none d-lg-table-cell">Display Pages</th>
                          <th className="d-none d-md-table-cell">Language</th>
                          <th>Status</th>
                          <th className="d-none d-xl-table-cell">Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRules.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-5">
                              <FileText size={48} className="text-muted mb-3" />
                              <p className="text-muted mb-0">No rules found</p>
                            </td>
                          </tr>
                        ) : (
                          filteredRules.map((rule) => (
                            <tr key={rule.id}>
                              <td>
                                <Badge bg="secondary">#{rule.id}</Badge>
                              </td>
                              <td>
                                <div className="fw-bold">{rule.title}</div>
                                <small className="text-muted d-lg-none">
                                  {rule.description.substring(0, 50)}...
                                </small>
                              </td>
                              <td>
                                <Badge bg="info" className="text-wrap">
                                  {getRuleTypeLabel(rule.rule_type)}
                                </Badge>
                              </td>
                              <td className="d-none d-lg-table-cell">
                                <div className="d-flex flex-wrap gap-1">
                                  {rule.pages_to_display.slice(0, 2).map((page, idx) => (
                                    <Badge key={idx} bg="secondary" className="text-wrap small">
                                      {getPageLabel(page)}
                                    </Badge>
                                  ))}
                                  {rule.pages_to_display.length > 2 && (
                                    <Badge bg="secondary" className="small">
                                      +{rule.pages_to_display.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="d-none d-md-table-cell">
                                <Badge bg={rule.language === "en" ? "primary" : "warning"}>
                                  {rule.language === "en" ? "English" : "Urdu"}
                                </Badge>
                              </td>
                              <td>
                                <Form.Check
                                  type="switch"
                                  checked={rule.is_active}
                                  onChange={() => toggleActiveStatus(rule.id)}
                                  label={rule.is_active ? "Active" : "Inactive"}
                                />
                              </td>
                              <td className="d-none d-xl-table-cell">
                                <small className="text-muted">
                                  {formatDate(rule.updated_at)}
                                </small>
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => openViewModal(rule)}
                                    title="View"
                                  >
                                    <Eye size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    onClick={() => openEditModal(rule)}
                                    title="Edit"
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDelete(rule.id)}
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === "create" ? "Create New Rule" : "Edit Rule"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={8} className="mb-3">
                <Form.Group>
                  <Form.Label>
                    Title <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter rule title"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label>Language</Form.Label>
                  <Form.Select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                  >
                    <option value="en">English</option>
                    <option value="ur">Urdu</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                Description <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter rule description"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Rule Type <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="rule_type"
                value={formData.rule_type}
                onChange={handleInputChange}
              >
                {ruleTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Display on Pages <span className="text-danger">*</span>
              </Form.Label>
              <div className="border rounded p-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                {availablePages.map((page) => (
                  <Form.Check
                    key={page.value}
                    type="checkbox"
                    id={`page-${page.value}`}
                    label={page.label}
                    checked={formData.pages_to_display.includes(page.value)}
                    onChange={() => handlePagesChange(page.value)}
                    className="mb-2"
                  />
                ))}
              </div>
              <Form.Text className="text-muted">
                Select one or more pages where this rule will be displayed
              </Form.Text>
            </Form.Group>

            <Form.Group>
              <Form.Check
                type="switch"
                id="is_active"
                name="is_active"
                label="Active (Rule will be displayed on selected pages)"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
              <X size={16} className="me-2" />
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="me-2" />
                  {modalMode === "create" ? "Create Rule" : "Update Rule"}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Rule Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRule && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Rule ID</small>
                  <Badge bg="secondary">#{selectedRule.id}</Badge>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Status</small>
                  <Badge bg={selectedRule.is_active ? "success" : "danger"}>
                    {selectedRule.is_active ? "Active" : "Inactive"}
                  </Badge>
                </Col>
              </Row>

              <hr />

              <div className="mb-3">
                <small className="text-muted d-block mb-1">Title</small>
                <h5>{selectedRule.title}</h5>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block mb-1">Description</small>
                <p className="mb-0">{selectedRule.description}</p>
              </div>

              <Row className="mb-3">
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Rule Type</small>
                  <Badge bg="info">{getRuleTypeLabel(selectedRule.rule_type)}</Badge>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Language</small>
                  <Badge bg={selectedRule.language === "en" ? "primary" : "warning"}>
                    {selectedRule.language === "en" ? "English" : "Urdu"}
                  </Badge>
                </Col>
              </Row>

              <div className="mb-3">
                <small className="text-muted d-block mb-2">Display on Pages</small>
                <div className="d-flex flex-wrap gap-2">
                  {selectedRule.pages_to_display.map((page, idx) => (
                    <Badge key={idx} bg="secondary">
                      {getPageLabel(page)}
                    </Badge>
                  ))}
                </div>
              </div>

              <hr />

              <Row>
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Created At</small>
                  <small>{formatDate(selectedRule.created_at)}</small>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Last Updated</small>
                  <small>{formatDate(selectedRule.updated_at)}</small>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={12}>
                  <small className="text-muted d-block mb-1">Created By</small>
                  <small>{selectedRule.created_by}</small>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          {selectedRule && (
            <Button variant="warning" onClick={() => {
              setShowViewModal(false);
              openEditModal(selectedRule);
            }}>
              <Edit size={16} className="me-2" />
              Edit Rule
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RulesManagement;
