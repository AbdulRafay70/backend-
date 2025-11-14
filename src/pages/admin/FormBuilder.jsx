import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal, Alert, Tabs, Tab } from 'react-bootstrap';
import { Plus, Trash2, Copy, Eye, Save, RotateCcw, GripVertical } from 'lucide-react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import '../../styles/form-system.css';

const FormBuilder = () => {
  // Form Configuration
  const [formConfig, setFormConfig] = useState({
    form_title: 'My Custom Form',
    linked_blog_id: null,
    is_linked_with_blog: false,
    form_page_url: '/forms/my-custom-form/',
    display_position: 'end_of_blog',
    fields: [
      { id: 1, label: 'Full Name', type: 'text', placeholder: 'Enter your name', required: true, width: 'full' },
      { id: 2, label: 'Email', type: 'email', placeholder: 'your@email.com', required: true, width: 'half' },
      { id: 3, label: 'Contact', type: 'text', placeholder: '03xxxxxxxxx', required: true, width: 'half' }
    ],
    buttons: [
      { id: 1, label: 'Submit', action: 'submit' }
    ],
    notes: [
      { id: 1, text: 'We will contact you within 24 hours.', position: 'below_submit_button' }
    ]
  });

  const [showFieldModal, setShowFieldModal] = useState(false);
  const [selectedFieldIdx, setSelectedFieldIdx] = useState(null);
  const [fieldData, setFieldData] = useState({});
  const [alert, setAlert] = useState(null);

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'tel', label: 'Phone' },
    { value: 'date', label: 'Date' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' }
  ];

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleAddField = () => {
    setSelectedFieldIdx(null);
    setFieldData({
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
      width: 'full',
      options: []
    });
    setShowFieldModal(true);
  };

  const handleEditField = (idx) => {
    setSelectedFieldIdx(idx);
    setFieldData({ ...formConfig.fields[idx] });
    setShowFieldModal(true);
  };

  const handleSaveField = () => {
    if (!fieldData.label) {
      showAlert('danger', 'Field label is required');
      return;
    }

    let updatedFields = [...formConfig.fields];
    if (selectedFieldIdx !== null) {
      updatedFields[selectedFieldIdx] = { ...fieldData, id: updatedFields[selectedFieldIdx].id };
    } else {
      updatedFields.push({ ...fieldData, id: Math.max(...updatedFields.map(f => f.id), 0) + 1 });
    }

    setFormConfig({ ...formConfig, fields: updatedFields });
    showAlert('success', selectedFieldIdx !== null ? 'Field updated' : 'Field added');
    setShowFieldModal(false);
  };

  const handleDeleteField = (idx) => {
    setFormConfig({
      ...formConfig,
      fields: formConfig.fields.filter((_, i) => i !== idx)
    });
    showAlert('success', 'Field deleted');
  };

  const handleAddButton = () => {
    const newButton = { id: Math.max(...formConfig.buttons.map(b => b.id), 0) + 1, label: 'New Button', action: 'submit' };
    setFormConfig({ ...formConfig, buttons: [...formConfig.buttons, newButton] });
  };

  const handleDeleteButton = (idx) => {
    setFormConfig({ ...formConfig, buttons: formConfig.buttons.filter((_, i) => i !== idx) });
  };

  const handleSaveForm = () => {
    if (!formConfig.form_title) {
      showAlert('danger', 'Form title is required');
      return;
    }
    showAlert('success', 'Form saved successfully! Form ID: ' + Math.random().toString(36).substring(7).toUpperCase());
  };

  const handleUpdateConfig = (key, value) => {
    setFormConfig({ ...formConfig, [key]: value });
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <Container fluid className="p-0">
        <Header title="Form Builder" />

        <div className="form-builder py-4 px-4">
          {alert && (
            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
              {alert.message}
            </Alert>
          )}

          <Row>
            <Col lg={8}>
              {/* Form Configuration */}
              <Card className="form-card mb-4">
                <Card.Header>
                  <Card.Title className="mb-0">Form Configuration</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Form Title *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formConfig.form_title}
                      onChange={(e) => handleUpdateConfig('form_title', e.target.value)}
                      placeholder="e.g., Umrah Leads Form"
                    />
                    <small className="text-muted mt-1 d-block">
                      Auto URL: {`/forms/${formConfig.form_title.toLowerCase().replace(/\s+/g, '-')}/`}
                    </small>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Link with Blog Post"
                      checked={formConfig.is_linked_with_blog}
                      onChange={(e) => handleUpdateConfig('is_linked_with_blog', e.target.checked)}
                    />
                    <small className="text-muted d-block mt-2">
                      If checked, this form will appear below the selected blog post
                    </small>
                  </Form.Group>

                  {formConfig.is_linked_with_blog && (
                    <Form.Group className="mb-3">
                      <Form.Label>Blog Post ID</Form.Label>
                      <Form.Control
                        type="number"
                        value={formConfig.linked_blog_id || ''}
                        onChange={(e) => handleUpdateConfig('linked_blog_id', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="e.g., 12"
                      />
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label>Display Position</Form.Label>
                    <Form.Select
                      value={formConfig.display_position}
                      onChange={(e) => handleUpdateConfig('display_position', e.target.value)}
                    >
                      <option value="end_of_blog">End of Blog (Below Content)</option>
                      <option value="sidebar">Sidebar</option>
                      <option value="popup">Popup Modal</option>
                      <option value="standalone">Standalone Page</option>
                    </Form.Select>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Fields Builder */}
              <Card className="form-card mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">Form Fields ({formConfig.fields.length})</Card.Title>
                  <Button variant="primary" size="sm" onClick={handleAddField}>
                    <Plus size={16} className="me-2" />
                    Add Field
                  </Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {formConfig.fields.map((field, idx) => (
                      <div key={field.id} className="field-item">
                        <div className="d-flex align-items-center gap-2">
                          <GripVertical size={18} className="text-muted" />
                          <div className="flex-grow-1">
                            <strong>{field.label}</strong>
                            <br />
                            <small className="text-muted">
                              {field.type.charAt(0).toUpperCase() + field.type.slice(1)} {field.required && '• Required'}
                            </small>
                          </div>
                          <div className="action-buttons">
                            <Button variant="outline-secondary" size="sm" onClick={() => handleEditField(idx)}>
                              <Eye size={14} />
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteField(idx)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>

              {/* Form Buttons */}
              <Card className="form-card mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">Action Buttons ({formConfig.buttons.length})</Card.Title>
                  <Button variant="primary" size="sm" onClick={handleAddButton}>
                    <Plus size={16} className="me-2" />
                    Add Button
                  </Button>
                </Card.Header>
                <Card.Body>
                  {formConfig.buttons.map((btn, idx) => (
                    <div key={btn.id} className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong>{btn.label}</strong>
                          <br />
                          <small className="text-muted">{btn.action}</small>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteButton(idx)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      {btn.action === 'redirect' && btn.url && (
                        <small className="text-muted d-block">URL: {btn.url}</small>
                      )}
                    </div>
                  ))}
                </Card.Body>
              </Card>

              {/* Notes */}
              <Card className="form-card mb-4">
                <Card.Header>
                  <Card.Title className="mb-0">Helper Notes</Card.Title>
                </Card.Header>
                <Card.Body>
                  {formConfig.notes.map((note, idx) => (
                    <div key={note.id} className="mb-2 p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                      <p className="mb-1">{note.text}</p>
                      <small className="text-muted">{note.position}</small>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            {/* Preview Sidebar */}
            <Col lg={4}>
              <Card className="form-card sticky-top" style={{ top: '20px' }}>
                <Card.Header>
                  <Card.Title className="mb-0">Live Preview</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="form-preview">
                    <h6 className="mb-3">{formConfig.form_title}</h6>

                    {/* Preview Notes Above */}
                    {formConfig.notes.filter(n => n.position === 'above_form').map(note => (
                      <Alert key={note.id} variant="info" className="py-2 mb-3" style={{ fontSize: '0.9rem' }}>
                        {note.text}
                      </Alert>
                    ))}

                    {/* Preview Fields */}
                    <div style={{ marginBottom: '1rem' }}>
                      {formConfig.fields.map((field, idx) => (
                        <Form.Group key={field.id} className="mb-3">
                          <Form.Label style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {field.label}
                            {field.required && <span className="text-danger ms-1">*</span>}
                          </Form.Label>
                          {field.type === 'textarea' ? (
                            <Form.Control as="textarea" rows={2} placeholder={field.placeholder} disabled />
                          ) : field.type === 'dropdown' ? (
                            <Form.Select disabled placeholder={field.placeholder} />
                          ) : (
                            <Form.Control type={field.type} placeholder={field.placeholder} disabled />
                          )}
                          {field.options && (
                            <small className="text-muted d-block mt-1">
                              Options: {field.options.join(', ')}
                            </small>
                          )}
                        </Form.Group>
                      ))}
                    </div>

                    {/* Preview Buttons */}
                    <div className="d-flex gap-2 mb-3">
                      {formConfig.buttons.map((btn, idx) => (
                        <Button key={btn.id} size="sm" variant={idx === 0 ? 'primary' : 'outline-secondary'} disabled>
                          {btn.label}
                        </Button>
                      ))}
                    </div>

                    {/* Preview Notes Below */}
                    {formConfig.notes.filter(n => n.position === 'below_submit_button').map(note => (
                      <Alert key={note.id} variant="light" className="py-2" style={{ fontSize: '0.85rem' }}>
                        ℹ️ {note.text}
                      </Alert>
                    ))}
                  </div>

                  <hr />

                  <div className="d-grid gap-2">
                    <Button variant="primary" onClick={handleSaveForm}>
                      <Save size={18} className="me-2" />
                      Save Form
                    </Button>
                    <Button variant="outline-secondary" href="/form-list">
                      <RotateCcw size={18} className="me-2" />
                      Cancel
                    </Button>
                  </div>

                  <hr />

                  <div style={{ fontSize: '0.85rem' }}>
                    <h6>Form Details</h6>
                    <p className="mb-1"><strong>Fields:</strong> {formConfig.fields.length}</p>
                    <p className="mb-1"><strong>Buttons:</strong> {formConfig.buttons.length}</p>
                    <p className="mb-1"><strong>Type:</strong> {formConfig.is_linked_with_blog ? 'Blog-Linked' : 'Standalone'}</p>
                    <p className="mb-0"><strong>Page URL:</strong> <code>{formConfig.form_page_url}</code></p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Field Editor Modal */}
          <Modal show={showFieldModal} onHide={() => setShowFieldModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{selectedFieldIdx !== null ? 'Edit Field' : 'Add Field'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Field Label *</Form.Label>
                <Form.Control
                  type="text"
                  value={fieldData.label || ''}
                  onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
                  placeholder="e.g., Full Name"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Field Type *</Form.Label>
                <Form.Select
                  value={fieldData.type || 'text'}
                  onChange={(e) => setFieldData({ ...fieldData, type: e.target.value })}
                >
                  {fieldTypes.map(ft => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Placeholder Text</Form.Label>
                <Form.Control
                  type="text"
                  value={fieldData.placeholder || ''}
                  onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
                  placeholder="Hint text for users"
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Required Field"
                      checked={fieldData.required || false}
                      onChange={(e) => setFieldData({ ...fieldData, required: e.target.checked })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Width</Form.Label>
                    <Form.Select
                      value={fieldData.width || 'full'}
                      onChange={(e) => setFieldData({ ...fieldData, width: e.target.value })}
                    >
                      <option value="full">Full Width</option>
                      <option value="half">Half Width</option>
                      <option value="third">One Third</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {(fieldData.type === 'dropdown' || fieldData.type === 'radio' || fieldData.type === 'checkbox') && (
                <Form.Group className="mb-3">
                  <Form.Label>Options (comma-separated)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={(fieldData.options || []).join(', ')}
                    onChange={(e) => setFieldData({ ...fieldData, options: e.target.value.split(',').map(o => o.trim()) })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </Form.Group>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowFieldModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveField}>
                Save Field
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </Container>
    </div>
  );
};

export default FormBuilder;
