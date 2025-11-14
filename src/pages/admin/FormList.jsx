import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert, Tab, Nav } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, Search, Copy, CheckCircle, AlertCircle, Layers } from 'lucide-react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import '../../styles/form-system.css';

const FormList = () => {
  const [activeTab, setActiveTab] = useState('list');
  
  // Demo Forms Data
  const [forms, setForms] = useState([
    {
      id: 1,
      form_unique_id: 'UMRLEAD2025',
      form_title: 'Umrah Leads Form',
      linked_blog_id: 1,
      is_linked_with_blog: true,
      form_page_url: '/forms/umrah-leads-form/',
      display_position: 'end_of_blog',
      status: 'active',
      field_count: 4,
      button_count: 2,
      created_at: '2025-10-15',
      submissions: 47,
      fields: [
        { label: 'Full Name', type: 'text', required: true, width: 'full' },
        { label: 'Contact Number', type: 'text', required: true, width: 'half' },
        { label: 'Package Type', type: 'dropdown', required: true, width: 'half', options: ['Economy', 'Premium', '5-Star'] },
        { label: 'Message', type: 'textarea', required: false, width: 'full' }
      ],
      buttons: [
        { label: 'Submit', action: 'submit' },
        { label: 'Call Now', action: 'redirect', url: 'tel:+923001234567' }
      ]
    },
    {
      id: 2,
      form_unique_id: 'VISALEAD2025',
      form_title: 'Visa Application Form',
      linked_blog_id: 2,
      is_linked_with_blog: true,
      form_page_url: '/forms/visa-application/',
      display_position: 'sidebar',
      status: 'active',
      field_count: 6,
      button_count: 1,
      created_at: '2025-10-10',
      submissions: 32,
      fields: [
        { label: 'Full Name', type: 'text', required: true },
        { label: 'Email', type: 'email', required: true },
        { label: 'Passport Number', type: 'text', required: true },
        { label: 'Visa Type', type: 'dropdown', required: true, options: ['Single', 'Multiple', 'Business'] },
        { label: 'DOB', type: 'date', required: true },
        { label: 'Comments', type: 'textarea', required: false }
      ],
      buttons: [
        { label: 'Apply Now', action: 'submit' }
      ]
    },
    {
      id: 3,
      form_unique_id: 'HOTELLEADS',
      form_title: 'Hotel Booking Form',
      linked_blog_id: null,
      is_linked_with_blog: false,
      form_page_url: '/forms/hotel-booking/',
      display_position: 'standalone',
      status: 'draft',
      field_count: 5,
      button_count: 2,
      created_at: '2025-11-01',
      submissions: 0,
      fields: [
        { label: 'Guest Name', type: 'text', required: true },
        { label: 'Email', type: 'email', required: true },
        { label: 'Check-in Date', type: 'date', required: true },
        { label: 'Check-out Date', type: 'date', required: true },
        { label: 'Room Preference', type: 'dropdown', required: true, options: ['Single', 'Double', 'Suite'] }
      ],
      buttons: [
        { label: 'Book Now', action: 'submit' },
        { label: 'View Hotels', action: 'redirect', url: '/hotels' }
      ]
    }
  ]);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    linked: ''
  });

  // Modal States
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [alert, setAlert] = useState(null);

  // Statistics Component
  const StatsCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card className={`stats-card stats-${color}`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <small className="text-muted">{title}</small>
            <h4 className="mb-1">{value}</h4>
            {subtitle && <small className="text-secondary">{subtitle}</small>}
          </div>
          <Icon size={32} className={`text-${color}`} />
        </div>
      </Card.Body>
    </Card>
  );

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleDelete = () => {
    if (selectedForm) {
      setForms(forms.filter(f => f.id !== selectedForm.id));
      showAlert('success', `Form "${selectedForm.form_title}" deleted successfully`);
      setShowDeleteModal(false);
      setSelectedForm(null);
    }
  };

  const handleViewForm = (form) => {
    setSelectedForm(form);
    setShowViewModal(true);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(window.location.origin + url);
    showAlert('success', 'URL copied to clipboard!');
  };

  // Filtered Forms
  let filteredForms = forms;
  if (filters.search) {
    filteredForms = filteredForms.filter(f =>
      f.form_title.toLowerCase().includes(filters.search.toLowerCase()) ||
      f.form_unique_id.toLowerCase().includes(filters.search.toLowerCase())
    );
  }
  if (filters.status) {
    filteredForms = filteredForms.filter(f => f.status === filters.status);
  }
  if (filters.linked !== '') {
    filteredForms = filteredForms.filter(f =>
      filters.linked === 'true' ? f.is_linked_with_blog : !f.is_linked_with_blog
    );
  }

  // Statistics
  const stats = {
    total_forms: forms.length,
    active_forms: forms.filter(f => f.status === 'active').length,
    total_submissions: forms.reduce((sum, f) => sum + f.submissions, 0),
    linked_forms: forms.filter(f => f.is_linked_with_blog).length
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <Container fluid className="p-0">
        <Header title="Custom Forms Manager" />

        <div className="form-manager py-4 px-4">
          {alert && (
            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
              {alert.message}
            </Alert>
          )}

          {/* Header */}
          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">Custom Lead Forms</h2>
                  <p className="text-muted mb-0">Create & manage forms for blogs and standalone pages</p>
                </div>
                <Button variant="primary" size="sm" href="/form-builder">
                  <Plus size={18} className="me-2" />
                  Create Form
                </Button>
              </div>
            </Col>
          </Row>

          {/* Navigation Tabs */}
          <Row className="mb-4">
            <Col>
              <div className="form-tabs">
                <button
                  className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveTab('list')}
                >
                  <Layers size={18} className="me-2" />
                  All Forms
                </button>
                <button
                  className={`tab-btn ${activeTab === 'linked' ? 'active' : ''}`}
                  onClick={() => setActiveTab('linked')}
                >
                  <CheckCircle size={18} className="me-2" />
                  Blog Linked
                </button>
                <button
                  className={`tab-btn ${activeTab === 'standalone' ? 'active' : ''}`}
                  onClick={() => setActiveTab('standalone')}
                >
                  <AlertCircle size={18} className="me-2" />
                  Standalone
                </button>
              </div>
            </Col>
          </Row>

          {activeTab === 'list' && (
            <>
              {/* Stats */}
              <Row className="mb-4">
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={Layers} title="Total Forms" value={stats.total_forms} color="primary" />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={CheckCircle} title="Active" value={stats.active_forms} color="success" />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={AlertCircle} title="Submissions" value={stats.total_submissions} color="info" />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={Layers} title="Blog Linked" value={stats.linked_forms} color="warning" />
                </Col>
              </Row>

              {/* Filters */}
              <Card className="form-card mb-4">
                <Card.Header>
                  <Card.Title className="mb-0">Filters</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Search</Form.Label>
                        <Form.Control
                          type="text"
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          placeholder="Form name or ID..."
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          value={filters.status}
                          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                          size="sm"
                        >
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Type</Form.Label>
                        <Form.Select
                          value={filters.linked}
                          onChange={(e) => setFilters({ ...filters, linked: e.target.value })}
                          size="sm"
                        >
                          <option value="">All Types</option>
                          <option value="true">Blog Linked</option>
                          <option value="false">Standalone</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>&nbsp;</Form.Label>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setFilters({ search: '', status: '', linked: '' })}
                          className="w-100"
                        >
                          Clear
                        </Button>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Forms Table */}
              <Card className="form-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">Forms List ({filteredForms.length})</Card.Title>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>Form Title</th>
                        <th>Unique ID</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Fields</th>
                        <th>Submissions</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredForms.map(form => (
                        <tr key={form.id}>
                          <td>
                            <strong>{form.form_title}</strong>
                          </td>
                          <td>
                            <code>{form.form_unique_id}</code>
                          </td>
                          <td>
                            <Badge bg={form.is_linked_with_blog ? 'info' : 'secondary'}>
                              {form.is_linked_with_blog ? 'Blog Linked' : 'Standalone'}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={form.status === 'active' ? 'success' : form.status === 'draft' ? 'warning' : 'danger'}>
                              {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                            </Badge>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">{form.field_count} fields</span>
                          </td>
                          <td>
                            <strong>{form.submissions}</strong>
                          </td>
                          <td><small>{form.created_at}</small></td>
                          <td>
                            <div className="action-buttons">
                              <Button variant="outline-info" size="sm" onClick={() => handleViewForm(form)} title="View">
                                <Eye size={16} />
                              </Button>
                              <Button variant="outline-primary" size="sm" href={`/form-builder/${form.id}`} title="Edit">
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedForm(form);
                                  setShowDeleteModal(true);
                                }}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}

          {activeTab === 'linked' && (
            <Card className="form-card">
              <Card.Header>
                <Card.Title className="mb-0">Blog-Linked Forms ({forms.filter(f => f.is_linked_with_blog).length})</Card.Title>
              </Card.Header>
              <Card.Body>
                {forms.filter(f => f.is_linked_with_blog).length > 0 ? (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Form</th>
                        <th>Blog ID</th>
                        <th>Position</th>
                        <th>Submissions</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forms.filter(f => f.is_linked_with_blog).map(form => (
                        <tr key={form.id}>
                          <td><strong>{form.form_title}</strong></td>
                          <td><code>#{form.linked_blog_id}</code></td>
                          <td><Badge bg="light">{form.display_position}</Badge></td>
                          <td>{form.submissions}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" onClick={() => handleViewForm(form)}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted text-center py-4">No blog-linked forms yet</p>
                )}
              </Card.Body>
            </Card>
          )}

          {activeTab === 'standalone' && (
            <Card className="form-card">
              <Card.Header>
                <Card.Title className="mb-0">Standalone Forms ({forms.filter(f => !f.is_linked_with_blog).length})</Card.Title>
              </Card.Header>
              <Card.Body>
                {forms.filter(f => !f.is_linked_with_blog).length > 0 ? (
                  <div className="row">
                    {forms.filter(f => !f.is_linked_with_blog).map(form => (
                      <div key={form.id} className="col-md-6 mb-4">
                        <Card className="form-preview-card h-100">
                          <Card.Body>
                            <h6>{form.form_title}</h6>
                            <p className="text-muted small">{form.field_count} fields • {form.button_count} buttons</p>
                            <div className="mb-3">
                              <small className="text-muted">Page URL:</small>
                              <div className="d-flex align-items-center gap-2">
                                <code style={{ fontSize: '0.85rem' }}>{form.form_page_url}</code>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => handleCopyUrl(form.form_page_url)}
                                >
                                  <Copy size={14} />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Button size="sm" variant="outline-primary" className="me-2" onClick={() => handleViewForm(form)}>
                                Preview
                              </Button>
                              <Button size="sm" variant="outline-success" href={form.form_page_url} target="_blank">
                                Open Page
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-4">No standalone forms yet</p>
                )}
              </Card.Body>
            </Card>
          )}

          {/* View Form Modal */}
          <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Form Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedForm && (
                <div>
                  <Row className="mb-4">
                    <Col md={6}>
                      <h6>Basic Info</h6>
                      <p><strong>Title:</strong> {selectedForm.form_title}</p>
                      <p><strong>ID:</strong> <code>{selectedForm.form_unique_id}</code></p>
                      <p><strong>Status:</strong> <Badge bg={selectedForm.status === 'active' ? 'success' : 'warning'}>{selectedForm.status}</Badge></p>
                    </Col>
                    <Col md={6}>
                      <h6>Linking</h6>
                      <p><strong>Linked with Blog:</strong> {selectedForm.is_linked_with_blog ? '✓ Yes' : '✗ No'}</p>
                      {selectedForm.is_linked_with_blog && <p><strong>Blog ID:</strong> <code>#{selectedForm.linked_blog_id}</code></p>}
                      <p><strong>Page URL:</strong> <code>{selectedForm.form_page_url}</code></p>
                    </Col>
                  </Row>

                  <hr />

                  <h6 className="mb-3">Fields ({selectedForm.field_count})</h6>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedForm.fields.map((field, idx) => (
                      <Card key={idx} className="mb-2">
                        <Card.Body className="py-2">
                          <div className="d-flex justify-content-between">
                            <div>
                              <strong>{field.label}</strong>
                              <br />
                              <small className="text-muted">{field.type}</small>
                            </div>
                            <div>
                              {field.required && <Badge bg="danger">Required</Badge>}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>

                  <hr className="my-3" />

                  <h6>Submission Stats</h6>
                  <p className="mb-0"><strong>{selectedForm.submissions}</strong> submissions received</p>
                </div>
              )}
            </Modal.Body>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Delete Form</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Are you sure you want to delete "<strong>{selectedForm?.form_title}</strong>"? This action cannot be undone.
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete Form
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </Container>
    </div>
  );
};

export default FormList;
