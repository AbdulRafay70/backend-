import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Spinner } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { getUniversalList, registerUniversal } from "../../utils/Api";
import { 
  UserPlus, Users, Building2, Briefcase, Upload, X, 
  CheckCircle, AlertCircle, Phone, Mail, MapPin, CreditCard, FileText 
} from "lucide-react";

const UniversalRegister = () => {
  const [formData, setFormData] = useState({
    type: "agent",
    parent_id: "",
    name: "",
    email: "",
    phone: "",
    cnic_front: null,
    cnic_back: null,
    address: "",
    city: "",
    visiting_card: null,
    dts_license: null
  });

  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [filePreview, setFilePreview] = useState({
    cnic_front: null,
    cnic_back: null,
    visiting_card: null,
    dts_license: null
  });

  // Registration types with icons and descriptions
  const registrationTypes = [
    {
      value: "organization",
      label: "Organization",
      icon: <Building2 size={24} />,
      color: "#0d6efd",
      description: "Main organization/company"
    },
    {
      value: "branch",
      label: "Branch",
      icon: <Building2 size={24} />,
      color: "#198754",
      description: "Branch under organization"
    },
    {
      value: "agent",
      label: "Agent",
      icon: <Users size={24} />,
      color: "#fd7e14",
      description: "Agent under branch"
    },
    {
      value: "employee",
      label: "Employee",
      icon: <Briefcase size={24} />,
      color: "#6f42c1",
      description: "Employee (org/branch)"
    }
  ];

  // Load parent options based on type
  useEffect(() => {
    loadParentOptions();
  }, [formData.type]);

  const loadParentOptions = async () => {
    // Skip if organization (no parent needed)
    if (formData.type === "organization") {
      setParents([]);
      setFormData(prev => ({ ...prev, parent_id: "" }));
      return;
    }

    try {
      // Determine filter for parent type
      let params = {};
      if (formData.type === "branch") params = { type: "organization" };
      else if (formData.type === "agent") params = { type: "branch" };
      else if (formData.type === "employee") params = { type: "organization,branch" };

      const response = await getUniversalList(params);
      const payload = response?.data;
      let items = [];
      if (payload) {
        if (Array.isArray(payload.data)) items = payload.data;
        else if (payload.data && typeof payload.data === "object") items = [payload.data];
      }

      if (!items || items.length === 0) {
        // fallback demo options
        const demoParents = formData.type === "branch"
          ? [
              { id: "org1", name: "Saer.pk Corporation", type: "organization" },
              { id: "org2", name: "Al-Haramain Group", type: "organization" }
            ]
          : formData.type === "agent"
          ? [
              { id: "branch1", name: "Lahore Branch", type: "branch" },
              { id: "branch2", name: "Karachi Branch", type: "branch" },
              { id: "branch3", name: "Islamabad Branch", type: "branch" }
            ]
          : [
              { id: "org1", name: "Saer.pk Corporation", type: "organization" },
              { id: "branch1", name: "Lahore Branch", type: "branch" },
              { id: "branch2", name: "Karachi Branch", type: "branch" }
            ];
        setParents(demoParents);
      } else {
        const mapped = items.map(it => ({ id: it.id, name: it.name || it.organization_name || "", type: it.type }));
        setParents(mapped);
      }
    } catch (error) {
      console.error("Error loading parents:", error);
      showAlert("danger", "Failed to load parent options");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert("danger", "File size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        showAlert("danger", "Only JPG, PNG, and PDF files are allowed");
        return;
      }

      setFormData(prev => ({ ...prev, [fieldName]: file }));

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(prev => ({ ...prev, [fieldName]: reader.result }));
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(prev => ({ ...prev, [fieldName]: "pdf" }));
      }
    }
  };

  const removeFile = (fieldName) => {
    setFormData(prev => ({ ...prev, [fieldName]: null }));
    setFilePreview(prev => ({ ...prev, [fieldName]: null }));
  };

  const validateForm = () => {
    // Required fields
    if (!formData.name) {
      showAlert("danger", "Name is required");
      return false;
    }

    if (!formData.email) {
      showAlert("danger", "Email is required");
      return false;
    }

    if (!formData.phone) {
      showAlert("danger", "Phone is required");
      return false;
    }

    // Parent required for non-organization types
    if (formData.type !== "organization" && !formData.parent_id) {
      showAlert("danger", "Parent organization/branch is required");
      return false;
    }

    // City required for branch
    if (formData.type === "branch" && !formData.city) {
      showAlert("danger", "City is required for branch registration");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert("danger", "Invalid email format");
      return false;
    }

    // Phone validation (Pakistan format)
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      showAlert("danger", "Invalid phone number format");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== "") {
          // if value is File, append file, otherwise append scalar
          submitData.append(key, formData[key]);
        }
      });

      // Call API
      const response = await registerUniversal(submitData);
      const payload = response?.data;

      if (payload && (payload.message || payload.data)) {
        showAlert("success", payload.message || "Registered successfully");

        // Reset form
        setFormData({
          type: "agent",
          parent_id: "",
          name: "",
          email: "",
          phone: "",
          cnic_front: null,
          cnic_back: null,
          address: "",
          city: "",
          visiting_card: null,
          dts_license: null
        });
        setFilePreview({
          cnic_front: null,
          cnic_back: null,
          visiting_card: null,
          dts_license: null
        });
        // redirect to list to view created record
        setTimeout(() => {
          window.location.href = "/universal-list";
        }, 900);
      } else {
        showAlert("danger", "Registration failed. Please try again.");
      }

    } catch (error) {
      console.error("Registration error:", error, error.response?.data || {});
      const serverMsg = error?.response?.data?.message || error?.response?.data?.detail || error.message;
      showAlert("danger", serverMsg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  const getTypeColor = (type) => {
    const typeObj = registrationTypes.find(t => t.value === type);
    return typeObj ? typeObj.color : "#6c757d";
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
                <UserPlus size={32} className="me-2" style={{ color: "#1B78CE" }} />
                Universal Registration
              </h2>
              <p className="text-muted mb-0">Register organizations, branches, agents, and employees</p>
            </div>
          </div>

          {/* Alert */}
          {alert.show && (
            <Alert 
              variant={alert.type} 
              dismissible 
              onClose={() => setAlert({ show: false, type: "", message: "" })}
              className="mb-4"
            >
              {alert.type === "success" ? <CheckCircle size={20} className="me-2" /> : <AlertCircle size={20} className="me-2" />}
              {alert.message}
            </Alert>
          )}

          <Row>
            {/* Registration Type Selection */}
            <Col lg={12} className="mb-4">
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="mb-3" style={{ fontWeight: 600, color: "#2c3e50" }}>
                    Select Registration Type
                  </h5>
                  <Row>
                    {registrationTypes.map((type) => (
                      <Col md={6} lg={3} key={type.value} className="mb-3">
                        <div
                          onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                          style={{
                            border: formData.type === type.value ? `2px solid ${type.color}` : "2px solid #e0e0e0",
                            borderRadius: "12px",
                            padding: "20px",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            backgroundColor: formData.type === type.value ? `${type.color}10` : "white",
                            height: "100%"
                          }}
                          className="text-center"
                        >
                          <div style={{ color: type.color, marginBottom: "10px" }}>
                            {type.icon}
                          </div>
                          <h6 style={{ fontWeight: 600, color: formData.type === type.value ? type.color : "#2c3e50", marginBottom: "5px" }}>
                            {type.label}
                          </h6>
                          <small className="text-muted">{type.description}</small>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Registration Form */}
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-4">
                    <div 
                      style={{ 
                        width: "40px", 
                        height: "40px", 
                        borderRadius: "8px", 
                        backgroundColor: `${getTypeColor(formData.type)}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px"
                      }}
                    >
                      {registrationTypes.find(t => t.value === formData.type)?.icon}
                    </div>
                    <div>
                      <h5 className="mb-0" style={{ fontWeight: 600, color: "#2c3e50" }}>
                        {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Registration Form
                      </h5>
                      <small className="text-muted">Fill in all required information</small>
                    </div>
                  </div>

                  <Form onSubmit={handleSubmit}>
                    <Row>
                      {/* Parent Selection (conditional) */}
                      {formData.type !== "organization" && (
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label style={{ fontWeight: 500 }}>
                              <Building2 size={16} className="me-2" />
                              Parent {formData.type === "branch" ? "Organization" : formData.type === "agent" ? "Branch" : "Organization/Branch"} *
                            </Form.Label>
                            <Form.Select
                              name="parent_id"
                              value={formData.parent_id}
                              onChange={handleInputChange}
                              required
                              style={{ borderRadius: "8px", padding: "10px" }}
                            >
                              <option value="">Select parent...</option>
                              {parents.map((parent) => (
                                <option key={parent.id} value={parent.id}>
                                  {parent.name} {parent.type && `(${parent.type})`}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      )}

                      {/* Name */}
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 500 }}>
                            <Users size={16} className="me-2" />
                            {formData.type === "organization" || formData.type === "branch" ? "Name" : "Full Name"} *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={formData.type === "organization" ? "Company Name" : formData.type === "branch" ? "Branch Name" : "Full Name"}
                            required
                            style={{ borderRadius: "8px", padding: "10px" }}
                          />
                        </Form.Group>
                      </Col>

                      {/* Email */}
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 500 }}>
                            <Mail size={16} className="me-2" />
                            Email Address *
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="email@example.com"
                            required
                            style={{ borderRadius: "8px", padding: "10px" }}
                          />
                        </Form.Group>
                      </Col>

                      {/* Phone */}
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 500 }}>
                            <Phone size={16} className="me-2" />
                            Phone Number *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+92 300 1234567"
                            required
                            style={{ borderRadius: "8px", padding: "10px" }}
                          />
                        </Form.Group>
                      </Col>

                      {/* City (required for branch) */}
                      {formData.type === "branch" && (
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label style={{ fontWeight: 500 }}>
                              <MapPin size={16} className="me-2" />
                              City *
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              placeholder="Lahore"
                              required
                              style={{ borderRadius: "8px", padding: "10px" }}
                            />
                          </Form.Group>
                        </Col>
                      )}

                      {/* Address */}
                      <Col md={formData.type === "branch" ? 6 : 12} className="mb-3">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 500 }}>
                            <MapPin size={16} className="me-2" />
                            Address
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Complete address"
                            style={{ borderRadius: "8px", padding: "10px" }}
                          />
                        </Form.Group>
                      </Col>

                      {/* File Uploads */}
                      <Col lg={12} className="mb-3">
                        <hr className="my-4" />
                        <h6 style={{ fontWeight: 600, color: "#2c3e50", marginBottom: "20px" }}>
                          <FileText size={20} className="me-2" />
                          Document Uploads (Optional)
                        </h6>
                        <Row>
                          {/* CNIC Front */}
                          <Col md={6} className="mb-3">
                            <Form.Group>
                              <Form.Label style={{ fontWeight: 500 }}>
                                <CreditCard size={16} className="me-2" />
                                CNIC Front
                              </Form.Label>
                              <div 
                                style={{ 
                                  border: "2px dashed #dee2e6", 
                                  borderRadius: "8px", 
                                  padding: "20px",
                                  textAlign: "center",
                                  position: "relative"
                                }}
                              >
                                {!formData.cnic_front ? (
                                  <>
                                    <Upload size={32} className="text-muted mb-2" />
                                    <p className="text-muted mb-2">Click to upload CNIC front</p>
                                    <Form.Control
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => handleFileChange(e, "cnic_front")}
                                      style={{ 
                                        position: "absolute", 
                                        top: 0, 
                                        left: 0, 
                                        width: "100%", 
                                        height: "100%", 
                                        opacity: 0,
                                        cursor: "pointer"
                                      }}
                                    />
                                  </>
                                ) : (
                                  <div>
                                    {filePreview.cnic_front && filePreview.cnic_front !== "pdf" ? (
                                      <img src={filePreview.cnic_front} alt="CNIC Front" style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "8px" }} />
                                    ) : (
                                      <FileText size={48} className="text-primary mb-2" />
                                    )}
                                    <p className="mb-2 mt-2">{formData.cnic_front.name}</p>
                                    <Button 
                                      variant="danger" 
                                      size="sm" 
                                      onClick={() => removeFile("cnic_front")}
                                    >
                                      <X size={16} /> Remove
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Form.Group>
                          </Col>

                          {/* CNIC Back */}
                          <Col md={6} className="mb-3">
                            <Form.Group>
                              <Form.Label style={{ fontWeight: 500 }}>
                                <CreditCard size={16} className="me-2" />
                                CNIC Back
                              </Form.Label>
                              <div 
                                style={{ 
                                  border: "2px dashed #dee2e6", 
                                  borderRadius: "8px", 
                                  padding: "20px",
                                  textAlign: "center",
                                  position: "relative"
                                }}
                              >
                                {!formData.cnic_back ? (
                                  <>
                                    <Upload size={32} className="text-muted mb-2" />
                                    <p className="text-muted mb-2">Click to upload CNIC back</p>
                                    <Form.Control
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => handleFileChange(e, "cnic_back")}
                                      style={{ 
                                        position: "absolute", 
                                        top: 0, 
                                        left: 0, 
                                        width: "100%", 
                                        height: "100%", 
                                        opacity: 0,
                                        cursor: "pointer"
                                      }}
                                    />
                                  </>
                                ) : (
                                  <div>
                                    {filePreview.cnic_back && filePreview.cnic_back !== "pdf" ? (
                                      <img src={filePreview.cnic_back} alt="CNIC Back" style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "8px" }} />
                                    ) : (
                                      <FileText size={48} className="text-primary mb-2" />
                                    )}
                                    <p className="mb-2 mt-2">{formData.cnic_back.name}</p>
                                    <Button 
                                      variant="danger" 
                                      size="sm" 
                                      onClick={() => removeFile("cnic_back")}
                                    >
                                      <X size={16} /> Remove
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Form.Group>
                          </Col>

                          {/* Visiting Card */}
                          <Col md={6} className="mb-3">
                            <Form.Group>
                              <Form.Label style={{ fontWeight: 500 }}>
                                <FileText size={16} className="me-2" />
                                Visiting Card
                              </Form.Label>
                              <div 
                                style={{ 
                                  border: "2px dashed #dee2e6", 
                                  borderRadius: "8px", 
                                  padding: "20px",
                                  textAlign: "center",
                                  position: "relative"
                                }}
                              >
                                {!formData.visiting_card ? (
                                  <>
                                    <Upload size={32} className="text-muted mb-2" />
                                    <p className="text-muted mb-2">Click to upload visiting card</p>
                                    <Form.Control
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => handleFileChange(e, "visiting_card")}
                                      style={{ 
                                        position: "absolute", 
                                        top: 0, 
                                        left: 0, 
                                        width: "100%", 
                                        height: "100%", 
                                        opacity: 0,
                                        cursor: "pointer"
                                      }}
                                    />
                                  </>
                                ) : (
                                  <div>
                                    {filePreview.visiting_card && filePreview.visiting_card !== "pdf" ? (
                                      <img src={filePreview.visiting_card} alt="Visiting Card" style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "8px" }} />
                                    ) : (
                                      <FileText size={48} className="text-primary mb-2" />
                                    )}
                                    <p className="mb-2 mt-2">{formData.visiting_card.name}</p>
                                    <Button 
                                      variant="danger" 
                                      size="sm" 
                                      onClick={() => removeFile("visiting_card")}
                                    >
                                      <X size={16} /> Remove
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Form.Group>
                          </Col>

                          {/* DTS License */}
                          <Col md={6} className="mb-3">
                            <Form.Group>
                              <Form.Label style={{ fontWeight: 500 }}>
                                <FileText size={16} className="me-2" />
                                DTS License
                              </Form.Label>
                              <div 
                                style={{ 
                                  border: "2px dashed #dee2e6", 
                                  borderRadius: "8px", 
                                  padding: "20px",
                                  textAlign: "center",
                                  position: "relative"
                                }}
                              >
                                {!formData.dts_license ? (
                                  <>
                                    <Upload size={32} className="text-muted mb-2" />
                                    <p className="text-muted mb-2">Click to upload DTS license</p>
                                    <Form.Control
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => handleFileChange(e, "dts_license")}
                                      style={{ 
                                        position: "absolute", 
                                        top: 0, 
                                        left: 0, 
                                        width: "100%", 
                                        height: "100%", 
                                        opacity: 0,
                                        cursor: "pointer"
                                      }}
                                    />
                                  </>
                                ) : (
                                  <div>
                                    {filePreview.dts_license && filePreview.dts_license !== "pdf" ? (
                                      <img src={filePreview.dts_license} alt="DTS License" style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "8px" }} />
                                    ) : (
                                      <FileText size={48} className="text-primary mb-2" />
                                    )}
                                    <p className="mb-2 mt-2">{formData.dts_license.name}</p>
                                    <Button 
                                      variant="danger" 
                                      size="sm" 
                                      onClick={() => removeFile("dts_license")}
                                    >
                                      <X size={16} /> Remove
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Col>

                      {/* Submit Button */}
                      <Col lg={12} className="mt-3">
                        <div className="d-flex gap-3">
                          <Button
                            type="submit"
                            disabled={loading}
                            style={{
                              background: getTypeColor(formData.type),
                              border: "none",
                              padding: "12px 32px",
                              borderRadius: "8px",
                              fontWeight: 500
                            }}
                          >
                            {loading ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Registering...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={20} className="me-2" />
                                Register {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline-secondary"
                            onClick={() => {
                              setFormData({
                                type: "agent",
                                parent_id: "",
                                name: "",
                                email: "",
                                phone: "",
                                cnic_front: null,
                                cnic_back: null,
                                address: "",
                                city: "",
                                visiting_card: null,
                                dts_license: null
                              });
                              setFilePreview({
                                cnic_front: null,
                                cnic_back: null,
                                visiting_card: null,
                                dts_license: null
                              });
                            }}
                            style={{
                              padding: "12px 32px",
                              borderRadius: "8px",
                              fontWeight: 500
                            }}
                          >
                            <X size={20} className="me-2" />
                            Reset
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
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

export default UniversalRegister;
