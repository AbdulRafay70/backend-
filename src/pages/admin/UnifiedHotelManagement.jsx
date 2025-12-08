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
  Modal,
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
  Filter,
  MapPin,
  Star,
  DollarSign,
  Users,
  Calendar,
  Settings,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import axios from "axios";

const UnifiedHotelManagement = () => {
  // ============ STATE MANAGEMENT ============
  const [activeTab, setActiveTab] = useState("all");
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const itemsPerPage = 10;

  // ============ DEMO DATA ============
  const demoHotels = [
    {
      id: 1,
      name: "Makkah Luxury Hotel",
      city: "Makkah",
      rating: 5,
      rooms: 150,
      available_rooms: 45,
      price_per_night: 25000,
      status: "active",
      type: "hotel",
      distance_from_haram: 0.5,
      amenities: ["WiFi", "AC", "Prayer Room", "Parking"],
      outsourced: false,
      availability: 30,
      created: "2025-01-01",
    },
    {
      id: 2,
      name: "Medina Grand Hotel",
      city: "Medina",
      rating: 4.8,
      rooms: 200,
      available_rooms: 78,
      price_per_night: 18000,
      status: "active",
      type: "hotel",
      distance_from_haram: 1.2,
      amenities: ["WiFi", "Restaurant", "AC", "24/7 Support"],
      outsourced: false,
      availability: 45,
      created: "2025-01-05",
    },
    {
      id: 3,
      name: "Budget Inn Makkah",
      city: "Makkah",
      rating: 3.5,
      rooms: 80,
      available_rooms: 12,
      price_per_night: 12000,
      status: "active",
      type: "hotel",
      distance_from_haram: 2.5,
      amenities: ["WiFi", "Basic AC"],
      outsourced: false,
      availability: 15,
      created: "2025-01-08",
    },
    {
      id: 4,
      name: "Partner Hotel Jeddah",
      city: "Jeddah",
      rating: 4.2,
      rooms: 120,
      available_rooms: 35,
      price_per_night: 15000,
      status: "active",
      type: "outsourced",
      distance_from_haram: 85,
      amenities: ["WiFi", "Restaurant", "Gym"],
      outsourced: true,
      availability: 20,
      created: "2025-01-10",
    },
    {
      id: 5,
      name: "Elite Rooms Makkah",
      city: "Makkah",
      rating: 4.5,
      rooms: 95,
      available_rooms: 22,
      price_per_night: 20000,
      status: "inactive",
      type: "hotel",
      distance_from_haram: 1.8,
      amenities: ["WiFi", "AC", "Restaurant"],
      outsourced: false,
      availability: 0,
      created: "2025-01-12",
    },
    {
      id: 6,
      name: "Medina Premium Stay",
      city: "Medina",
      rating: 4.6,
      rooms: 160,
      available_rooms: 58,
      price_per_night: 22000,
      status: "active",
      type: "hotel",
      distance_from_haram: 0.8,
      amenities: ["WiFi", "Restaurant", "AC", "Laundry"],
      outsourced: false,
      availability: 50,
      created: "2025-01-15",
    },
  ];

  // ============ LIFECYCLE HOOKS ============
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls
        // const response = await axios.get(`/api/hotels/`, { headers: { Authorization: `Bearer ${token}` } });
        setHotels(demoHotels);
        setCities(["Makkah", "Medina", "Jeddah", "Riyadh"]);
        setAlert({ show: true, type: "success", message: "Hotels loaded successfully" });
      } catch (err) {
        console.error("Error fetching hotels:", err);
        setAlert({ show: true, type: "danger", message: "Failed to load hotels" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============ FILTERING & SEARCHING ============
  useEffect(() => {
    let filtered = hotels;

    // Filter by type based on active tab
    if (activeTab === "outsourced") {
      filtered = filtered.filter((hotel) => hotel.outsourced === true);
    } else if (activeTab === "internal") {
      filtered = filtered.filter((hotel) => hotel.outsourced === false);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (hotel) =>
          hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hotel.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply city filter
    if (selectedCity) {
      filtered = filtered.filter((hotel) => hotel.city === selectedCity);
    }

    setFilteredHotels(filtered);
    setCurrentPage(1);
  }, [activeTab, hotels, searchTerm, selectedCity]);

  // ============ STATISTICS ============
  const getStats = () => {
    let statHotels = hotels;
    if (activeTab === "outsourced") {
      statHotels = hotels.filter((h) => h.outsourced === true);
    } else if (activeTab === "internal") {
      statHotels = hotels.filter((h) => h.outsourced === false);
    }

    return {
      total: statHotels.length,
      active: statHotels.filter((h) => h.status === "active").length,
      inactive: statHotels.filter((h) => h.status === "inactive").length,
      available_rooms: statHotels.reduce((sum, h) => sum + h.available_rooms, 0),
      avg_price: Math.round(statHotels.reduce((sum, h) => sum + h.price_per_night, 0) / statHotels.length),
    };
  };

  const stats = getStats();

  // ============ PAGINATION ============
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedHotels = filteredHotels.slice(startIdx, startIdx + itemsPerPage);

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

  const getTypeBadge = (outsourced) => {
    return outsourced ? (
      <Badge bg="info">Outsourced</Badge>
    ) : (
      <Badge bg="primary">Internal</Badge>
    );
  };

  const getRatingBadge = (rating) => {
    return (
      <Badge bg={rating >= 4.5 ? "success" : rating >= 4 ? "info" : "warning"}>
        <Star size={14} className="me-1" />
        {rating}
      </Badge>
    );
  };

  // ============ RENDER HOTELS TABLE ============
  const renderHotelsTable = () => (
    <div style={{ overflowX: "auto" }}>
      <Table hover responsive>
        <thead style={{ backgroundColor: "#f8f9fa" }}>
          <tr>
            <th>Hotel Name</th>
            <th>City</th>
            <th>Type</th>
            <th>Rating</th>
            <th>Total/Available</th>
            <th>Price/Night</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedHotels.map((hotel) => (
            <tr key={hotel.id}>
              <td>
                <div>
                  <strong>{hotel.name}</strong>
                  <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                    {hotel.distance_from_haram && (
                      <>
                        <MapPin size={12} className="me-1" />
                        {hotel.distance_from_haram} km
                      </>
                    )}
                  </div>
                </div>
              </td>
              <td>{hotel.city}</td>
              <td>{getTypeBadge(hotel.outsourced)}</td>
              <td>{getRatingBadge(hotel.rating)}</td>
              <td>
                <strong>{hotel.available_rooms}</strong>/{hotel.rooms}
              </td>
              <td>
                <strong>PKR {hotel.price_per_night.toLocaleString()}</strong>
              </td>
              <td>{getStatusBadge(hotel.status)}</td>
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
          <Header title="Hotel Management" />
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
        <Header title="Hotel Management Hub" />

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

          {/* Stats Cards */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <Package size={32} className="text-primary mb-2" />
                  <h6>Total Hotels</h6>
                  <h3 className="text-primary mb-0">{stats.total}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <CheckCircle size={32} className="text-success mb-2" />
                  <h6>Active</h6>
                  <h3 className="text-success mb-0">{stats.active}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <Users size={32} className="text-info mb-2" />
                  <h6>Rooms Available</h6>
                  <h3 className="text-info mb-0">{stats.available_rooms}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <DollarSign size={32} className="text-warning mb-2" />
                  <h6>Avg Price/Night</h6>
                  <h3 className="text-warning mb-0">PKR {stats.avg_price.toLocaleString()}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Search</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <Search size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Hotel name, city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>City</Form.Label>
                    <Form.Select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                      <option value="">All Cities</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>&nbsp;</Form.Label>
                    <div style={{ marginTop: "0.5rem" }}>
                      <small className="text-muted">Showing {filteredHotels.length} hotel(s)</small>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button variant="primary" className="w-100">
                    <Plus size={16} className="me-2" />
                    Add Hotel
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabs */}
          <Card>
            <Card.Body className="p-0">
              <Tabs
                id="hotel-tabs"
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-0"
              >
                <Tab eventKey="all" title={<><Package size={16} className="me-2" />All Hotels</>}>
                  <div className="p-3">
                    {paginatedHotels.length > 0 ? (
                      <>
                        {renderHotelsTable()}
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
                      <Alert variant="info">No hotels found</Alert>
                    )}
                  </div>
                </Tab>

                <Tab
                  eventKey="internal"
                  title={
                    <>
                      <CheckCircle size={16} className="me-2" />
                      Internal ({hotels.filter((h) => !h.outsourced).length})
                    </>
                  }
                >
                  <div className="p-3">
                    {paginatedHotels.length > 0 ? (
                      <>
                        {renderHotelsTable()}
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
                      <Alert variant="info">No internal hotels found</Alert>
                    )}
                  </div>
                </Tab>

                <Tab
                  eventKey="outsourced"
                  title={
                    <>
                      <AlertCircle size={16} className="me-2" />
                      Outsourced ({hotels.filter((h) => h.outsourced).length})
                    </>
                  }
                >
                  <div className="p-3">
                    {paginatedHotels.length > 0 ? (
                      <>
                        {renderHotelsTable()}
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
                      <Alert variant="info">No outsourced hotels found</Alert>
                    )}
                  </div>
                </Tab>

                <Tab eventKey="availability" title={<><Calendar size={16} className="me-2" />Availability</>}>
                  <div className="p-3">
                    <Row>
                      {paginatedHotels.map((hotel) => (
                        <Col md={6} lg={4} key={hotel.id} className="mb-3">
                          <Card>
                            <Card.Header className="bg-light">
                              <Card.Title className="mb-0">{hotel.name}</Card.Title>
                            </Card.Header>
                            <Card.Body>
                              <div className="mb-2">
                                <small className="text-muted">Available Rooms</small>
                                <div className="progress">
                                  <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{
                                      width: `${(hotel.available_rooms / hotel.rooms) * 100}%`,
                                    }}
                                    aria-valuenow={hotel.available_rooms}
                                    aria-valuemin={0}
                                    aria-valuemax={hotel.rooms}
                                  >
                                    {hotel.available_rooms}/{hotel.rooms}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex justify-content-between">
                                <small>
                                  <strong>{hotel.available_rooms}</strong> available
                                </small>
                                <small className="text-muted">{hotel.availability} days ahead</small>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Tab>

                <Tab eventKey="pricing" title={<><DollarSign size={16} className="me-2" />Pricing</>}>
                  <div className="p-3">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Hotel</th>
                          <th>Price/Night</th>
                          <th>Total Rooms</th>
                          <th>Monthly Revenue Est.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedHotels.map((hotel) => {
                          const monthlyRevenue = hotel.price_per_night * hotel.available_rooms * 30;
                          return (
                            <tr key={hotel.id}>
                              <td>{hotel.name}</td>
                              <td>
                                <strong>PKR {hotel.price_per_night.toLocaleString()}</strong>
                              </td>
                              <td>{hotel.rooms}</td>
                              <td>PKR {monthlyRevenue.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </Tab>

                <Tab eventKey="analytics" title={<><TrendingUp size={16} className="me-2" />Analytics</>}>
                  <div className="p-3">
                    <Row>
                      <Col md={6}>
                        <Card>
                          <Card.Header>
                            <Card.Title className="mb-0">Hotels by Type</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Internal Hotels</span>
                              <span className="badge bg-primary">
                                {hotels.filter((h) => !h.outsourced).length}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Outsourced Hotels</span>
                              <span className="badge bg-info">
                                {hotels.filter((h) => h.outsourced).length}
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card>
                          <Card.Header>
                            <Card.Title className="mb-0">Hotels by Status</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Active Hotels</span>
                              <span className="badge bg-success">
                                {hotels.filter((h) => h.status === "active").length}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Inactive Hotels</span>
                              <span className="badge bg-danger">
                                {hotels.filter((h) => h.status === "inactive").length}
                              </span>
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
        </div>
      </Container>
    </div>
  );
};

export default UnifiedHotelManagement;
