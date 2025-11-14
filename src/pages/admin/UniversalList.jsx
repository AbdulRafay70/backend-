import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Badge, Modal, Spinner, Alert, Dropdown } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { getUniversalList, approveUniversal, rejectUniversal } from "../../utils/Api";
import { 
  Users, Building2, Briefcase, Search, Edit, Trash2, Eye, MoreVertical,
  Filter, UserPlus, Phone, Mail, MapPin, CheckCircle, XCircle, FileText
} from "lucide-react";

const UniversalList = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: ""
  });

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, searchQuery, filterType]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      // Call backend API
      const response = await getUniversalList();

      // response data might be { message, data } where data is object or array
      const payload = response?.data;
      let items = [];
      if (payload) {
        if (Array.isArray(payload.data)) items = payload.data;
        else if (payload.data && typeof payload.data === "object") items = [payload.data];
        else if (Array.isArray(payload)) items = payload;
      }

      // If API returned no items, set empty array
      if (!items || items.length === 0) {
        setRecords([]);
      } else {
        // normalize items
        const mapped = items.map((it) => ({
          id: it.id,
          type: it.type,
          parent_id: it.parent_id || null,
          parent_name: it.parent_name || (it.parent && it.parent.name) || "",
          name: it.name || "",
          email: it.email || "",
          phone: it.phone || "",
          address: it.address || "",
          city: it.city || "",
          created_at: it.created_at || it.created_at,
          // Keep raw status and is_active from server; UI will derive display
          status: it.status || null,
          is_active: !!it.is_active
        }));
        setRecords(mapped);
      }
    } catch (error) {
      console.error("Error loading records:", error, error.response?.data || {});
      const serverMsg = error?.response?.data?.message || error?.response?.data?.detail || error.message;
      showAlert("danger", serverMsg || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, []);

  const filterRecords = useCallback(() => {
    let filtered = [...records];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(record => record.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.name.toLowerCase().includes(query) ||
        record.email.toLowerCase().includes(query) ||
        record.phone.toLowerCase().includes(query) ||
        (record.parent_name && record.parent_name.toLowerCase().includes(query))
      );
    }

    setFilteredRecords(filtered);
  }, [records, searchQuery, filterType]);

  const getTypeIcon = (type) => {
    switch (type) {
      case "organization":
        return <Building2 size={18} />;
      case "branch":
        return <Building2 size={18} />;
      case "agent":
        return <Users size={18} />;
      case "employee":
        return <Briefcase size={18} />;
      default:
        return <Users size={18} />;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      organization: "primary",
      branch: "success",
      agent: "warning",
      employee: "info"
    };
    return (
      <Badge bg={colors[type]} className="d-flex align-items-center gap-1" style={{ width: "fit-content" }}>
        {getTypeIcon(type)}
        <span className="text-capitalize">{type}</span>
      </Badge>
    );
  };

  const getStatistics = () => {
    return {
      total: records.length,
      organizations: records.filter(r => r.type === "organization").length,
      branches: records.filter(r => r.type === "branch").length,
      agents: records.filter(r => r.type === "agent").length,
      employees: records.filter(r => r.type === "employee").length,
      active: records.filter(r => r.is_active === true).length
    };
  };

  const stats = getStatistics();

  const handleView = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setEditFormData({
      name: record.name,
      email: record.email,
      phone: record.phone,
      address: record.address || "",
      city: record.city || ""
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch(/universal/update/${selectedRecord.id}, {
      //   method: "PUT",
      //   body: JSON.stringify(editFormData)
      // });

      // Update local state
      const updatedRecords = records.map(record =>
        record.id === selectedRecord.id
          ? { ...record, ...editFormData }
          : record
      );
      setRecords(updatedRecords);
      
      showAlert("success", "Record updated successfully");
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating record:", error);
      showAlert("danger", "Failed to update record");
    }
  };

  const handleDeleteConfirm = (record) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch(/universal/delete/${selectedRecord.id}, {
      //   method: "DELETE"
      // });

      // Update local state
      const updatedRecords = records.filter(record => record.id !== selectedRecord.id);
      setRecords(updatedRecords);
      
      showAlert("success", "Record deleted successfully");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting record:", error);
      showAlert("danger", "Failed to delete record");
    }
  };

  const handleApprove = async (id) => {
    try {
      const ok = window.confirm("Are you sure you want to approve this registration?");
      if (!ok) return;
      await approveUniversal(id);
      const updated = records.map(r => r.id === id ? { ...r, status: "active" } : r);
      setRecords(updated);
      showAlert("success", "Registration approved");
    } catch (error) {
      console.error("Error approving registration:", error, error.response?.data || error.response || error);
      const status = error?.response?.status;
      // Prefer server-provided message (DRF returns {detail: '...'})
      const serverMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.response?.data;
      if (status === 403) {
        showAlert("danger", `Forbidden: you don't have permission to approve. ${serverMsg || ''}`);
      } else if (status === 401) {
        showAlert("danger", `Unauthorized: please login as admin. ${serverMsg || ''}`);
      } else {
        showAlert("danger", serverMsg || error?.message || "Failed to approve");
      }
    }
  };

  const handleReject = async (id) => {
    try {
      const reason = window.prompt("Rejection reason (optional):", "");
      const ok = window.confirm("Are you sure you want to reject this registration?");
      if (!ok) return;
      await rejectUniversal(id, { reason });
      const updated = records.map(r => r.id === id ? { ...r, status: "inactive" } : r);
      setRecords(updated);
      showAlert("success", "Registration rejected");
    } catch (error) {
      console.error("Error rejecting registration:", error, error.response?.data || error.response || error);
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.response?.data;
      if (status === 403) {
        showAlert("danger", `Forbidden: you don't have permission to reject. ${serverMsg || ''}`);
      } else if (status === 401) {
        showAlert("danger", `Unauthorized: please login as admin. ${serverMsg || ''}`);
      } else {
        showAlert("danger", serverMsg || error?.message || "Failed to reject");
      }
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

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
                <Users size={32} className="me-2" style={{ color: "#1B78CE" }} />
                Universal Registry
              </h2>
              <p className="text-muted mb-0">Manage all organizations, branches, agents, and employees</p>
            </div>
            <Button
              style={{
                background: "#1B78CE",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: 500
              }}
              onClick={() => window.location.href = "/universal-register"}
            >
              <UserPlus size={20} className="me-2" />
              Add New Record
            </Button>
          </div>

          {/* Alert */}
          {alert.show && (
            <Alert 
              variant={alert.type} 
              dismissible 
              onClose={() => setAlert({ show: false, type: "", message: "" })}
              className="mb-4"
            >
              {alert.message}
            </Alert>
          )}

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={6} lg={2} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Total Records</p>
                      <h3 className="mb-0" style={{ fontWeight: 600 }}>{stats.total}</h3>
                    </div>
                    <div 
                      style={{ 
                        width: "50px", 
                        height: "50px", 
                        borderRadius: "12px", 
                        backgroundColor: "#1B78CE20",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Users size={24} style={{ color: "#1B78CE" }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={2} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Organizations</p>
                      <h3 className="mb-0" style={{ fontWeight: 600 }}>{stats.organizations}</h3>
                    </div>
                    <div 
                      style={{ 
                        width: "50px", 
                        height: "50px", 
                        borderRadius: "12px", 
                        backgroundColor: "#0d6efd20",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Building2 size={24} style={{ color: "#0d6efd" }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={2} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Branches</p>
                      <h3 className="mb-0" style={{ fontWeight: 600 }}>{stats.branches}</h3>
                    </div>
                    <div 
                      style={{ 
                        width: "50px", 
                        height: "50px", 
                        borderRadius: "12px", 
                        backgroundColor: "#19875420",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Building2 size={24} style={{ color: "#198754" }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={2} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Agents</p>
                      <h3 className="mb-0" style={{ fontWeight: 600 }}>{stats.agents}</h3>
                    </div>
                    <div 
                      style={{ 
                        width: "50px", 
                        height: "50px", 
                        borderRadius: "12px", 
                        backgroundColor: "#fd7e1420",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Users size={24} style={{ color: "#fd7e14" }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={2} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Employees</p>
                      <h3 className="mb-0" style={{ fontWeight: 600 }}>{stats.employees}</h3>
                    </div>
                    <div 
                      style={{ 
                        width: "50px", 
                        height: "50px", 
                        borderRadius: "12px", 
                        backgroundColor: "#6f42c120",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Briefcase size={24} style={{ color: "#6f42c1" }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={2} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Active</p>
                      <h3 className="mb-0" style={{ fontWeight: 600 }}>{stats.active}</h3>
                    </div>
                    <div 
                      style={{ 
                        width: "50px", 
                        height: "50px", 
                        borderRadius: "12px", 
                        backgroundColor: "#19875420",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <CheckCircle size={24} style={{ color: "#198754" }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Search and Filter */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-3">
              <Row className="align-items-center">
                <Col md={6} className="mb-2 mb-md-0">
                  <div style={{ position: "relative" }}>
                    <Search 
                      size={20} 
                      style={{ 
                        position: "absolute", 
                        left: "12px", 
                        top: "50%", 
                        transform: "translateY(-50%)",
                        color: "#6c757d"
                      }} 
                    />
                    <Form.Control
                      type="text"
                      placeholder="Search by name, email, phone, or parent..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ 
                        paddingLeft: "40px", 
                        borderRadius: "8px",
                        border: "1px solid #dee2e6"
                      }}
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex gap-2 align-items-center">
                    <Filter size={20} className="text-muted" />
                    <Form.Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{ borderRadius: "8px", maxWidth: "200px" }}
                    >
                      <option value="all">All Types</option>
                      <option value="organization">Organizations</option>
                      <option value="branch">Branches</option>
                      <option value="agent">Agents</option>
                      <option value="employee">Employees</option>
                    </Form.Select>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Records Table */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-3">Loading records...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-5">
                  <Users size={64} className="text-muted mb-3" />
                  <h5 className="text-muted">No records found</h5>
                  <p className="text-muted">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <Table hover className="mb-0" style={{ minWidth: "1000px" }}>
                    <thead style={{ backgroundColor: "#f8f9fa" }}>
                      <tr>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "100px" }}>Type</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "200px" }}>Name</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "180px" }}>Parent</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "200px" }}>Email</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "150px" }}>Phone</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "120px" }}>City</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "180px" }}>Created At</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "100px" }}>Status</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "100px", textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id}>
                          <td style={{ padding: "16px" }}>
                            {getTypeBadge(record.type)}
                          </td>
                          <td style={{ padding: "16px", fontWeight: 500 }}>
                            {record.name}
                          </td>
                          <td style={{ padding: "16px" }}>
                            {record.parent_name ? (
                              <span className="text-muted">{record.parent_name}</span>
                            ) : (
                              <span className="text-muted fst-italic">Root</span>
                            )}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <div className="d-flex align-items-center gap-2">
                              <Mail size={16} className="text-muted" />
                              <span className="text-muted">{record.email}</span>
                            </div>
                          </td>
                          <td style={{ padding: "16px" }}>
                            <div className="d-flex align-items-center gap-2">
                              <Phone size={16} className="text-muted" />
                              <span className="text-muted">{record.phone}</span>
                            </div>
                          </td>
                          <td style={{ padding: "16px" }}>
                            <div className="d-flex align-items-center gap-2">
                              <MapPin size={14} className="text-muted" />
                              <span className="text-muted">{record.city || "-"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span className="text-muted" style={{ fontSize: "14px" }}>
                              {formatDate(record.created_at)}
                            </span>
                          </td>
                          <td style={{ padding: "16px" }}>
                            {(() => {
                              // Derive a safe display status:
                              // - If is_active is true -> active
                              // - If is_active is false and server status is explicitly 'inactive' or 'suspended' -> show that
                              // - Otherwise treat as 'pending'
                              let displayStatus = 'pending';
                              if (record.is_active) displayStatus = 'active';
                              else if (record.status && (record.status === 'inactive' || record.status === 'suspended')) displayStatus = record.status;

                              const variant = displayStatus === "active" ? "success" : (displayStatus === "pending" ? "warning" : "secondary");
                              return (
                                <Badge bg={variant} className="text-capitalize">
                                  {displayStatus}
                                </Badge>
                              );
                            })()}
                          </td>
                          <td style={{ padding: "16px", textAlign: "center" }}>
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="link"
                                className="text-decoration-none p-0"
                                style={{ boxShadow: "none" }}
                              >
                                <MoreVertical size={20} className="text-muted" />
                              </Dropdown.Toggle>
                              <Dropdown.Menu align="end">
                                <Dropdown.Item onClick={() => handleView(record)}>
                                  <Eye size={16} className="me-2" />
                                  View Details
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleEdit(record)}>
                                  <Edit size={16} className="me-2" />
                                  Edit
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleApprove(record.id)}>
                                  <CheckCircle size={16} className="me-2" />
                                  Approve
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleReject(record.id)}>
                                  <XCircle size={16} className="me-2" />
                                  Reject
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item 
                                  onClick={() => handleDeleteConfirm(record)}
                                  className="text-danger"
                                >
                                  <Trash2 size={16} className="me-2" />
                                  Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center gap-2">
              {selectedRecord && getTypeIcon(selectedRecord.type)}
              Record Details
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <Row>
              <Col md={6} className="mb-3">
                <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Type</p>
                {getTypeBadge(selectedRecord.type)}
              </Col>
              <Col md={6} className="mb-3">
                <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Status</p>
                {(() => {
                  const displayStatus = selectedRecord?.is_active ? 'active' : (selectedRecord?.status && (selectedRecord.status === 'inactive' || selectedRecord.status === 'suspended') ? selectedRecord.status : 'pending');
                  const variant = displayStatus === 'active' ? 'success' : (displayStatus === 'pending' ? 'warning' : 'secondary');
                  return <Badge bg={variant} className="text-capitalize">{displayStatus}</Badge>;
                })()}
              </Col>
              <Col md={12} className="mb-3">
                <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Name</p>
                <h5>{selectedRecord.name}</h5>
              </Col>
              {selectedRecord.parent_name && (
                <Col md={12} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Parent</p>
                  <p className="mb-0">{selectedRecord.parent_name}</p>
                </Col>
              )}
              <Col md={6} className="mb-3">
                <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                  <Mail size={14} className="me-1" />
                  Email
                </p>
                <p className="mb-0">{selectedRecord.email}</p>
              </Col>
              <Col md={6} className="mb-3">
                <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                  <Phone size={14} className="me-1" />
                  Phone
                </p>
                <p className="mb-0">{selectedRecord.phone}</p>
              </Col>
              {selectedRecord.city && (
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                    <MapPin size={14} className="me-1" />
                    City
                  </p>
                  <p className="mb-0">{selectedRecord.city}</p>
                </Col>
              )}
              {selectedRecord.address && (
                <Col md={12} className="mb-3">
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                    <MapPin size={14} className="me-1" />
                    Address
                  </p>
                  <p className="mb-0">{selectedRecord.address}</p>
                </Col>
              )}
              <Col md={12}>
                <p className="text-muted mb-1" style={{ fontSize: "14px" }}>Created At</p>
                <p className="mb-0">{formatDate(selectedRecord.created_at)}</p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <Edit size={24} className="me-2" />
            Edit Record
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone *</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.city}
                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            style={{ background: "#1B78CE", border: "none" }}
            onClick={handleEditSubmit}
          >
            <CheckCircle size={18} className="me-2" />
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <Trash2 size={24} className="me-2 text-danger" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this record?</p>
          {selectedRecord && (
            <div className="p-3" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
              <p className="mb-1"><strong>Name:</strong> {selectedRecord.name}</p>
              <p className="mb-1"><strong>Type:</strong> {selectedRecord.type}</p>
              <p className="mb-0"><strong>Email:</strong> {selectedRecord.email}</p>
            </div>
          )}
          <Alert variant="warning" className="mt-3 mb-0">
            <strong>Warning:</strong> This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={18} className="me-2" />
            Delete Record
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </div>
    
    <style>{`
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

export default UniversalList;