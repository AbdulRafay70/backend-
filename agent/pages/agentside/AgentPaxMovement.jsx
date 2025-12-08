import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Badge, Modal, Spinner, Alert } from "react-bootstrap";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { 
  Plane, MapPin, Users, Search, Edit, CheckCircle, XCircle, AlertCircle,
  Clock, Bell, Calendar, Eye
} from "lucide-react";

const AgentPaxMovement = () => {
  const [passengers, setPassengers] = useState([]);
  const [filteredPassengers, setFilteredPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPax, setSelectedPax] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [notifications, setNotifications] = useState([]);

  const [flightFormData, setFlightFormData] = useState({
    flight_no: "",
    departure_airport: "",
    arrival_airport: "",
    departure_time: "",
    departure_date: "",
    arrival_time: "",
    arrival_date: "",
    current_city: ""
  });

  // Status options
  const statusOptions = [
    { value: "in_pakistan", label: "In Pakistan", color: "#6c757d", icon: "🇵🇰" },
    { value: "entered_ksa", label: "Entered KSA", color: "#ffc107", icon: "✈️" },
    { value: "in_ksa", label: "In KSA", color: "#0dcaf0", icon: "🕋" },
    { value: "in_makkah", label: "In Makkah", color: "#198754", icon: "🕋" },
    { value: "in_madina", label: "In Madina", color: "#20c997", icon: "🕌" },
    { value: "in_jeddah", label: "In Jeddah", color: "#0d6efd", icon: "🏙️" },
    { value: "exit_pending", label: "Exit Pending", color: "#fd7e14", icon: "⏳" },
    { value: "exited_ksa", label: "Exited KSA", color: "#198754", icon: "✅" },
  ];

  // Demo data
  const demoPassengers = [
    {
      id: "pax1",
      pax_id: "PAX001",
      name: "Ahmed Ali",
      passport_no: "AB1234567",
      booking_date: "2024-10-15T10:00:00",
      status: "in_makkah",
      current_city: "Makkah",
      verified_exit: false,
      needs_update: false,
      flights: [
        {
          flight_no: "PK-740",
          departure_airport: "Islamabad (ISB)",
          arrival_airport: "Jeddah (JED)",
          departure_date: "2024-10-20",
          departure_time: "03:00 AM",
          arrival_date: "2024-10-20",
          arrival_time: "07:30 AM",
          type: "entry"
        }
      ],
      last_updated: "2024-10-22T14:30:00"
    },
    {
      id: "pax2",
      pax_id: "PAX002",
      name: "Fatima Khan",
      passport_no: "CD7654321",
      booking_date: "2024-10-18T09:00:00",
      status: "in_madina",
      current_city: "Madina",
      verified_exit: false,
      needs_update: false,
      flights: [
        {
          flight_no: "SV-722",
          departure_airport: "Karachi (KHI)",
          arrival_airport: "Jeddah (JED)",
          departure_date: "2024-10-25",
          departure_time: "02:30 AM",
          arrival_date: "2024-10-25",
          arrival_time: "06:45 AM",
          type: "entry"
        }
      ],
      last_updated: "2024-10-28T11:00:00"
    },
    {
      id: "pax3",
      pax_id: "PAX003",
      name: "Usman Malik",
      passport_no: "EF9876543",
      booking_date: "2024-10-10T15:30:00",
      status: "exit_pending",
      current_city: "Jeddah",
      verified_exit: false,
      needs_update: true, // Admin rejected, needs update
      flights: [
        {
          flight_no: "PK-740",
          departure_airport: "Lahore (LHE)",
          arrival_airport: "Jeddah (JED)",
          departure_date: "2024-10-15",
          departure_time: "04:00 AM",
          arrival_date: "2024-10-15",
          arrival_time: "08:30 AM",
          type: "entry"
        },
        {
          flight_no: "PK-741",
          departure_airport: "Jeddah (JED)",
          arrival_airport: "Lahore (LHE)",
          departure_date: "2024-11-01",
          departure_time: "10:00 PM",
          arrival_date: "2024-11-02",
          arrival_time: "06:00 AM",
          type: "exit"
        }
      ],
      last_updated: "2024-11-01T10:00:00"
    }
  ];

  const demoNotifications = [
    {
      id: 1,
      pax_id: "PAX003",
      pax_name: "Usman Malik",
      message: "Exit verification failed. Please update correct flight information.",
      timestamp: "2024-11-01T10:30:00",
      read: false
    }
  ];

  useEffect(() => {
    loadPassengers();
    loadNotifications();
  }, []);

  useEffect(() => {
    filterPassengers();
  }, [passengers, searchQuery]);

  const loadPassengers = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch("/pax-movement/agent-list");
      // const data = await response.json();
      // setPassengers(data);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPassengers(demoPassengers);
    } catch (error) {
      console.error("Error loading passengers:", error);
      showAlert("danger", "Failed to load passenger data");
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = () => {
    setNotifications(demoNotifications);
  };

  const filterPassengers = () => {
    let filtered = [...passengers];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pax =>
        pax.name.toLowerCase().includes(query) ||
        pax.passport_no.toLowerCase().includes(query) ||
        pax.pax_id.toLowerCase().includes(query)
      );
    }

    setFilteredPassengers(filtered);
  };

  const getStatusBadge = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    if (!statusObj) return null;

    return (
      <Badge 
        style={{ 
          backgroundColor: statusObj.color,
          padding: "6px 12px",
          fontSize: "13px",
          fontWeight: 500
        }}
      >
        <span className="me-1">{statusObj.icon}</span>
        {statusObj.label}
      </Badge>
    );
  };

  const handleViewDetails = (pax) => {
    setSelectedPax(pax);
    setShowDetailsModal(true);
  };

  const handleUpdateFlight = (pax) => {
    setSelectedPax(pax);
    const lastFlight = pax.flights[pax.flights.length - 1] || {};
    setFlightFormData({
      flight_no: lastFlight.flight_no || "",
      departure_airport: lastFlight.departure_airport || "",
      arrival_airport: lastFlight.arrival_airport || "",
      departure_time: lastFlight.departure_time || "",
      departure_date: lastFlight.departure_date || "",
      arrival_time: lastFlight.arrival_time || "",
      arrival_date: lastFlight.arrival_date || "",
      current_city: pax.current_city || ""
    });
    setShowFlightModal(true);
  };

  const handleFlightSubmit = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/pax-movement/update/${selectedPax.id}`, {
      //   method: "PUT",
      //   body: JSON.stringify(flightFormData)
      // });

      // Update local state
      const updatedPassengers = passengers.map(pax =>
        pax.id === selectedPax.id
          ? { 
              ...pax, 
              flights: [...pax.flights, { ...flightFormData, type: "exit" }],
              current_city: flightFormData.current_city,
              status: "exit_pending",
              needs_update: false,
              last_updated: new Date().toISOString()
            }
          : pax
      );
      setPassengers(updatedPassengers);

      // Clear notification if any
      const updatedNotifications = notifications.filter(n => n.pax_id !== selectedPax.pax_id);
      setNotifications(updatedNotifications);

      showAlert("success", "Flight information updated successfully");
      setShowFlightModal(false);
    } catch (error) {
      console.error("Error updating flight:", error);
      showAlert("danger", "Failed to update flight information");
    }
  };

  const markNotificationRead = (notificationId) => {
    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
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

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const needsUpdateCount = passengers.filter(p => p.needs_update).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        <div className="col-12 col-lg-10">
          <AgentHeader />
          
          <Container fluid className="p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1" style={{ fontWeight: 600, color: "#2c3e50" }}>
                <Plane size={32} className="me-2" style={{ color: "#1B78CE" }} />
                My Passengers Movement
              </h2>
              <p className="text-muted mb-0">Track and update your passengers' travel information</p>
            </div>
            <Button
              variant="outline-primary"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: 500,
                position: "relative"
              }}
              onClick={loadPassengers}
            >
              <Bell size={20} className="me-2" />
              Notifications
              {unreadNotifications > 0 && (
                <Badge 
                  bg="danger" 
                  pill 
                  style={{ 
                    position: "absolute", 
                    top: "-8px", 
                    right: "-8px",
                    fontSize: "10px"
                  }}
                >
                  {unreadNotifications}
                </Badge>
              )}
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

          {/* Notifications Card */}
          {notifications.length > 0 && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <h6 className="mb-3" style={{ fontWeight: 600 }}>
                  <AlertCircle size={20} className="me-2 text-warning" />
                  Action Required
                </h6>
                {notifications.map((notification) => (
                  <Alert 
                    key={notification.id}
                    variant="warning"
                    dismissible
                    onClose={() => markNotificationRead(notification.id)}
                    className="mb-2"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{notification.pax_name} ({notification.pax_id})</strong>
                        <p className="mb-0 mt-1">{notification.message}</p>
                        <small className="text-muted">{formatDate(notification.timestamp)}</small>
                      </div>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => {
                          const pax = passengers.find(p => p.pax_id === notification.pax_id);
                          if (pax) handleUpdateFlight(pax);
                        }}
                      >
                        Update Now
                      </Button>
                    </div>
                  </Alert>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Total Passengers</p>
                      <h4 className="mb-0" style={{ fontWeight: 600 }}>{passengers.length}</h4>
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

            <Col md={3} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "13px" }}>In KSA</p>
                      <h4 className="mb-0" style={{ fontWeight: 600 }}>
                        {passengers.filter(p => p.status.includes("ksa") || p.status.includes("makkah") || p.status.includes("madina")).length}
                      </h4>
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
                      <MapPin size={24} style={{ color: "#198754" }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Exit Pending</p>
                      <h4 className="mb-0" style={{ fontWeight: 600 }}>
                        {passengers.filter(p => p.status === "exit_pending").length}
                      </h4>
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
                      <Clock size={24} style={{ color: "#fd7e14" }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Needs Update</p>
                      <h4 className="mb-0" style={{ fontWeight: 600 }}>{needsUpdateCount}</h4>
                    </div>
                    <div 
                      style={{ 
                        width: "50px", 
                        height: "50px", 
                        borderRadius: "12px", 
                        backgroundColor: needsUpdateCount > 0 ? "#dc354520" : "#19875420",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <AlertCircle size={24} style={{ color: needsUpdateCount > 0 ? "#dc3545" : "#198754" }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Search */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-3">
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
                  placeholder="Search by name, passport, or pax ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    paddingLeft: "40px", 
                    borderRadius: "8px",
                    border: "1px solid #dee2e6"
                  }}
                />
              </div>
            </Card.Body>
          </Card>

          {/* Passengers Table */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-3">Loading passengers...</p>
                </div>
              ) : filteredPassengers.length === 0 ? (
                <div className="text-center py-5">
                  <Users size={64} className="text-muted mb-3" />
                  <h5 className="text-muted">No passengers found</h5>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <Table hover className="mb-0" style={{ minWidth: "1000px" }}>
                    <thead style={{ backgroundColor: "#f8f9fa" }}>
                      <tr>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "120px" }}>Pax ID</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "180px" }}>Name</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "140px" }}>Passport</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "160px" }}>Status</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "120px" }}>City</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "180px" }}>Last Updated</th>
                        <th style={{ padding: "16px", fontWeight: 600, minWidth: "150px", textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPassengers.map((pax) => (
                        <tr key={pax.id} style={{ backgroundColor: pax.needs_update ? "#fff3cd" : "transparent" }}>
                          <td style={{ padding: "16px" }}>
                            <span style={{ fontWeight: 500, color: "#1B78CE" }}>{pax.pax_id}</span>
                          </td>
                          <td style={{ padding: "16px", fontWeight: 500 }}>
                            {pax.name}
                            {pax.needs_update && (
                              <Badge bg="danger" className="ms-2" style={{ fontSize: "10px" }}>
                                Update Required
                              </Badge>
                            )}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span className="text-muted">{pax.passport_no}</span>
                          </td>
                          <td style={{ padding: "16px" }}>
                            {getStatusBadge(pax.status)}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <div className="d-flex align-items-center gap-2">
                              <MapPin size={16} className="text-muted" />
                              <span>{pax.current_city}</span>
                            </div>
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span className="text-muted" style={{ fontSize: "13px" }}>
                              {formatDate(pax.last_updated)}
                            </span>
                          </td>
                          <td style={{ padding: "16px", textAlign: "center" }}>
                            <div className="d-flex gap-2 justify-content-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewDetails(pax)}
                                style={{ borderRadius: "6px" }}
                              >
                                <Eye size={16} />
                              </Button>
                              <Button
                                variant={pax.needs_update ? "warning" : "outline-warning"}
                                size="sm"
                                onClick={() => handleUpdateFlight(pax)}
                                style={{ borderRadius: "6px" }}
                              >
                                <Edit size={16} />
                              </Button>
                            </div>
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

        {/* Details Modal - Same as admin, simplified */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Passenger Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPax && (
            <div>
              <Row className="mb-4">
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1">Pax ID</p>
                  <p className="mb-0" style={{ fontWeight: 500 }}>{selectedPax.pax_id}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1">Name</p>
                  <p className="mb-0" style={{ fontWeight: 500 }}>{selectedPax.name}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1">Passport</p>
                  <p className="mb-0">{selectedPax.passport_no}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1">Status</p>
                  {getStatusBadge(selectedPax.status)}
                </Col>
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1">Current City</p>
                  <p className="mb-0">{selectedPax.current_city}</p>
                </Col>
              </Row>

              <h6 className="mb-3">Flight Details</h6>
              {selectedPax.flights.map((flight, index) => (
                <Card key={index} className="mb-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <Card.Body>
                    <Badge bg={flight.type === "entry" ? "info" : "warning"} className="mb-2">
                      {flight.type === "entry" ? "Entry Flight" : "Exit Flight"}
                    </Badge>
                    <p className="mb-1"><strong>Flight:</strong> {flight.flight_no}</p>
                    <p className="mb-1"><strong>From:</strong> {flight.departure_airport}</p>
                    <p className="mb-1"><strong>To:</strong> {flight.arrival_airport}</p>
                    <p className="mb-0"><strong>Date:</strong> {flight.departure_date} at {flight.departure_time}</p>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

        {/* Update Flight Modal - Same as admin */}
        <Modal show={showFlightModal} onHide={() => setShowFlightModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <Plane size={24} className="me-2" />
              Update Flight Information
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Label>Flight Number *</Form.Label>
                  <Form.Control
                    type="text"
                    value={flightFormData.flight_no}
                    onChange={(e) => setFlightFormData({ ...flightFormData, flight_no: e.target.value })}
                    placeholder="PK-740"
                    required
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Current City *</Form.Label>
                    <Form.Select
                      value={flightFormData.current_city}
                      onChange={(e) => setFlightFormData({ ...flightFormData, current_city: e.target.value })}
                      required
                    >
                      <option value="">Select city...</option>
                      <option value="Makkah">Makkah</option>
                      <option value="Madina">Madina</option>
                      <option value="Jeddah">Jeddah</option>
                      <option value="Pakistan">Pakistan</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Departure Airport *</Form.Label>
                  <Form.Control
                    type="text"
                    value={flightFormData.departure_airport}
                    onChange={(e) => setFlightFormData({ ...flightFormData, departure_airport: e.target.value })}
                    placeholder="Jeddah (JED)"
                    required
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Arrival Airport *</Form.Label>
                  <Form.Control
                    type="text"
                    value={flightFormData.arrival_airport}
                    onChange={(e) => setFlightFormData({ ...flightFormData, arrival_airport: e.target.value })}
                    placeholder="Lahore (LHE)"
                    required
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Departure Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={flightFormData.departure_date}
                    onChange={(e) => setFlightFormData({ ...flightFormData, departure_date: e.target.value })}
                    required
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Departure Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={flightFormData.departure_time}
                    onChange={(e) => setFlightFormData({ ...flightFormData, departure_time: e.target.value })}
                    required
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Arrival Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={flightFormData.arrival_date}
                    onChange={(e) => setFlightFormData({ ...flightFormData, arrival_date: e.target.value })}
                    required
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Arrival Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={flightFormData.arrival_time}
                    onChange={(e) => setFlightFormData({ ...flightFormData, arrival_time: e.target.value })}
                    required
                  />
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFlightModal(false)}>
              Cancel
            </Button>
            <Button 
              style={{ background: "#1B78CE", border: "none" }}
              onClick={handleFlightSubmit}
            >
              <CheckCircle size={18} className="me-2" />
              Update Flight
            </Button>
          </Modal.Footer>
        </Modal>
        </div>
      </div>
    </div>
  );
};

export default AgentPaxMovement;
