import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Send, Check, AlertCircle } from 'lucide-react';
import '../styles/form-system.css';

const FormPage = () => {
  const { formId } = useParams();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alert, setAlert] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Demo forms data - replace with API call
  const demoForms = {
    'umrah-leads-form': {
      form_unique_id: 'UMRLEAD2025',
      form_title: 'Umrah Leads - Get Your Free Consultation',
      description: 'Fill this form to get free consultation for your umrah journey',
      fields: [
        { id: 1, label: 'Full Name', type: 'text', placeholder: 'Your full name', required: true, width: 'full' },
        { id: 2, label: 'Email Address', type: 'email', placeholder: 'your@email.com', required: true, width: 'half' },
        { id: 3, label: 'Contact Number', type: 'tel', placeholder: '+92-3XX-XXXXXXX', required: true, width: 'half' },
        { id: 4, label: 'Preferred Month for Umrah', type: 'dropdown', options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], required: true, width: 'half' },
        { id: 5, label: 'Group Size', type: 'dropdown', options: ['Solo', '2-5 People', '6-10 People', '10+ People'], required: true, width: 'half' },
        { id: 6, label: 'Additional Notes', type: 'textarea', placeholder: 'Tell us about your preferences...', required: false, width: 'full' }
      ],
      buttons: [
        { id: 1, label: 'Submit My Leads', action: 'submit' }
      ],
      notes: [
        { id: 1, text: 'Our team will contact you within 24 hours with personalized packages', position: 'below_submit_button' }
      ]
    },
    'visa-application-form': {
      form_unique_id: 'VISALEAD2025',
      form_title: 'Visa Application Query Form',
      description: 'Get expert help with your visa application',
      fields: [
        { id: 1, label: 'Full Name', type: 'text', placeholder: 'Your name', required: true, width: 'full' },
        { id: 2, label: 'Email', type: 'email', placeholder: 'email@example.com', required: true, width: 'half' },
        { id: 3, label: 'Phone', type: 'tel', placeholder: '+92-XXX-XXXXXXX', required: true, width: 'half' },
        { id: 4, label: 'Visa Type', type: 'dropdown', options: ['Umrah', 'Visit', 'Business', 'Other'], required: true, width: 'full' },
        { id: 5, label: 'Current Status', type: 'dropdown', options: ['Planning', 'Documents Ready', 'Applied', 'Approved'], required: true, width: 'half' },
        { id: 6, label: 'Questions/Concerns', type: 'textarea', placeholder: 'What would you like to know?', required: false, width: 'full' }
      ],
      buttons: [
        { id: 1, label: 'Get Consultation', action: 'submit' }
      ],
      notes: [
        { id: 1, text: 'Expert visa consultants will review your query and respond within 48 hours', position: 'below_submit_button' }
      ]
    },
    'hotel-booking-form': {
      form_unique_id: 'HOTELLEADS',
      form_title: 'Hotel Booking Inquiry',
      description: 'Book your accommodation with special discounts',
      fields: [
        { id: 1, label: 'Full Name', type: 'text', placeholder: 'Your name', required: true, width: 'full' },
        { id: 2, label: 'Email Address', type: 'email', placeholder: 'your@email.com', required: true, width: 'half' },
        { id: 3, label: 'Phone Number', type: 'tel', placeholder: '+92-3XX-XXXXXXX', required: true, width: 'half' },
        { id: 4, label: 'Check-in Date', type: 'date', required: true, width: 'half' },
        { id: 5, label: 'Check-out Date', type: 'date', required: true, width: 'half' }
      ],
      buttons: [
        { id: 1, label: 'Book Now', action: 'submit' }
      ],
      notes: [
        { id: 1, text: 'Get instant confirmation and special discounts', position: 'below_submit_button' }
      ]
    }
  };

  const form = demoForms[formId];

  const handleFieldChange = (fieldId, value) => {
    setFormData({ ...formData, [fieldId]: value });
    if (fieldErrors[fieldId]) {
      setFieldErrors({ ...fieldErrors, [fieldId]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    form.fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        errors[field.id] = `${field.label} is required`;
      }
    });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setAlert({ type: 'danger', message: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/forms/${form.form_unique_id}/submit/`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...formData, form_id: form.form_unique_id })
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmitted(true);
      setFormData({});
      setAlert(null);
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error) {
      setAlert({ type: 'danger', message: 'Submission failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          <AlertCircle className="me-2" size={20} />
          Form not found. The form ID "{formId}" does not exist.
        </Alert>
      </Container>
    );
  }

  return (
    <div className="form-page-wrapper">
      {/* Header */}
      <div className="form-page-header py-5 text-center" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        <Container>
          <h1 className="form-page-title">{form.form_title}</h1>
          {form.description && (
            <p className="form-page-description mt-2">{form.description}</p>
          )}
        </Container>
      </div>

      {/* Main Content */}
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Success Message */}
            {submitted && (
              <Alert variant="success" className="mb-4">
                <div className="d-flex align-items-center">
                  <Check size={24} className="me-3" />
                  <div>
                    <strong>Thank you!</strong>
                    <p className="mb-0 mt-1">Your form has been submitted successfully. We will contact you soon.</p>
                  </div>
                </div>
              </Alert>
            )}

            {/* Error/Info Alerts */}
            {alert && (
              <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
                {alert.message}
              </Alert>
            )}

            {/* Form Card */}
            {!submitted && (
              <Card className="form-card shadow-sm">
                <Card.Body className="p-4">
                  <Form onSubmit={handleSubmit}>
                    {/* Notes Above Form */}
                    {form.notes.filter(n => n.position === 'above_form').map(note => (
                      <Alert key={note.id} variant="info" className="mb-4">
                        {note.text}
                      </Alert>
                    ))}

                    {/* Form Fields Grid */}
                    <Row className="g-3">
                      {form.fields.map((field) => {
                        const colClass = field.width === 'half' ? 'col-md-6' : field.width === 'third' ? 'col-md-4' : 'col-12';
                        
                        return (
                          <div key={field.id} className={colClass}>
                            <Form.Group>
                              <Form.Label className="fw-500 mb-2">
                                {field.label}
                                {field.required && <span className="text-danger ms-1">*</span>}
                              </Form.Label>

                              {field.type === 'textarea' ? (
                                <Form.Control
                                  as="textarea"
                                  rows={4}
                                  placeholder={field.placeholder}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  isInvalid={!!fieldErrors[field.id]}
                                  className="form-field"
                                />
                              ) : field.type === 'dropdown' ? (
                                <Form.Select
                                  value={formData[field.id] || ''}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  isInvalid={!!fieldErrors[field.id]}
                                  className="form-field"
                                >
                                  <option value="">Select {field.label}</option>
                                  {field.options && field.options.map((opt, idx) => (
                                    <option key={idx} value={opt}>{opt}</option>
                                  ))}
                                </Form.Select>
                              ) : (
                                <Form.Control
                                  type={field.type}
                                  placeholder={field.placeholder}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  isInvalid={!!fieldErrors[field.id]}
                                  className="form-field"
                                />
                              )}

                              {fieldErrors[field.id] && (
                                <Form.Control.Feedback type="invalid" className="d-block mt-2">
                                  {fieldErrors[field.id]}
                                </Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </div>
                        );
                      })}
                    </Row>

                    {/* Submit Button */}
                    <div className="mt-4 pt-3">
                      {form.buttons.map((btn) => (
                        <Button
                          key={btn.id}
                          type={btn.action === 'submit' ? 'submit' : 'button'}
                          size="lg"
                          className="w-100 fw-600"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send size={18} className="me-2" />
                              {btn.label}
                            </>
                          )}
                        </Button>
                      ))}
                    </div>

                    {/* Notes Below Form */}
                    {form.notes.filter(n => n.position === 'below_submit_button').map(note => (
                      <Alert key={note.id} variant="light" className="mt-4 py-3">
                        <small className="text-muted">
                          ℹ️ {note.text}
                        </small>
                      </Alert>
                    ))}
                  </Form>
                </Card.Body>
              </Card>
            )}

            {/* Success Redirect Notice */}
            {submitted && (
              <Card className="text-center py-5">
                <div>
                  <div style={{ fontSize: '3rem', color: '#28a745', marginBottom: '1rem' }}>✓</div>
                  <h5 className="mb-3">Form Submitted Successfully!</h5>
                  <p className="text-muted mb-3">Redirecting to home page in a few seconds...</p>
                  <Button href="/" variant="primary">Go to Home Page</Button>
                </div>
              </Card>
            )}
          </Col>

          {/* Sidebar Info */}
          <Col lg={4} className="mt-4 mt-lg-0">
            <Card className="form-info-card shadow-sm">
              <Card.Body>
                <h6 className="mb-3">Form Information</h6>
                <hr />
                <p className="mb-2">
                  <strong>Form ID:</strong><br />
                  <code style={{ fontSize: '0.85rem' }}>{form.form_unique_id}</code>
                </p>
                <p className="mb-2">
                  <strong>Fields:</strong><br />
                  {form.fields.length} fields
                </p>
                <p className="mb-2">
                  <strong>Required:</strong><br />
                  {form.fields.filter(f => f.required).length} fields
                </p>
                <hr />
                <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: 0 }}>
                  💡 All fields marked with <span className="text-danger">*</span> are required
                </p>
              </Card.Body>
            </Card>

            {/* Quick Info */}
            <Card className="form-help-card shadow-sm mt-3">
              <Card.Body>
                <h6 className="mb-3">Need Help?</h6>
                <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: 0 }}>
                  If you have any questions, please contact our support team at <strong>support@saer.pk</strong> or call <strong>+92-XXX-XXXXXXX</strong>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <div style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', paddingTop: '2rem', paddingBottom: '2rem', marginTop: '3rem' }}>
        <Container>
          <Row className="text-center text-muted">
            <Col md={4} className="mb-3 mb-md-0">
              <p className="mb-1" style={{ fontSize: '0.9rem' }}>
                <strong>Fast Response</strong><br />
                We respond within 24 hours
              </p>
            </Col>
            <Col md={4} className="mb-3 mb-md-0">
              <p className="mb-1" style={{ fontSize: '0.9rem' }}>
                <strong>Secure & Private</strong><br />
                Your data is completely safe
              </p>
            </Col>
            <Col md={4}>
              <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                <strong>Free Consultation</strong><br />
                No hidden charges
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default FormPage;
