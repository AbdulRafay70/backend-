import React, { useState } from "react";
import { Card, Row, Col, Badge, Table, Button, Form, Modal, Tabs, Tab, InputGroup } from "react-bootstrap";
import { MapPin, Hotel, Plane, Users, Calendar, ArrowRight, TrendingUp, Eye, Search, X } from "lucide-react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";

// Demo data for UI/UX demonstration
const demoPaxData = {
  locationOverview: {
    visaIssued: 15,
    arrivedKSA: 45,
    inMakkah: 30,
    inMadinah: 10,
    inJeddah: 5,
    exitedKSA: 8
  },
  hotelSummary: {
    currentCheckIns: 38,
    readyForCheckout: 5,
    checkedOutToday: 3,
    upcomingCheckIns: 7
  },
  transportSummary: {
    todaysTransfers: 12,
    upcomingZiyarat: 8,
    inProgress: 4,
    completed: 15
  },
  flightSummary: {
    todaysArrivals: 6,
    todaysDepartures: 4,
    upcomingFlights: 9
  },
  paxList: [
    {
      id: 1,
      name: "Ahmed Ali Khan",
      passport: "AB***456",
      bookingNo: "BKG-2025-001",
      currentCity: "Makkah",
      hotel: "Hilton Makkah",
      roomNo: "405",
      status: "active",
      statusBadge: "in_ksa",
      checkIn: "2025-10-15",
      checkOut: "2025-10-20",
      nextMovement: "Check-out scheduled",
      agent: "Abdul Rehman",
      branch: "Lahore Branch"
    },
    {
      id: 2,
      name: "Fatima Zahra",
      passport: "CD***789",
      bookingNo: "BKG-2025-002",
      currentCity: "Madinah",
      hotel: "Madinah Grand",
      roomNo: "302",
      status: "active",
      statusBadge: "in_ksa",
      checkIn: "2025-10-18",
      checkOut: "2025-10-23",
      nextMovement: "Ziyarat scheduled tomorrow",
      agent: "Abdul Rehman",
      branch: "Lahore Branch"
    },
    {
      id: 3,
      name: "Muhammad Usman",
      passport: "EF***012",
      bookingNo: "BKG-2025-003",
      currentCity: "Pakistan",
      hotel: "Pending",
      roomNo: "-",
      status: "pending",
      statusBadge: "visa_issued",
      checkIn: "-",
      checkOut: "-",
      nextMovement: "Flight on 2025-11-05",
      agent: "Abdul Rehman",
      branch: "Karachi Branch"
    }
  ],
  hotelDetails: [
    {
      id: 1,
      paxName: "Ahmed Ali Khan",
      hotel: "Hilton Makkah",
      city: "Makkah",
      roomNo: "405",
      checkIn: "2025-10-15",
      checkOut: "2025-10-20",
      bookingNo: "BKG-2025-001",
      agent: "Abdul Rehman",
      status: "checked_in"
    },
    {
      id: 2,
      paxName: "Fatima Zahra",
      hotel: "Madinah Grand",
      city: "Madinah",
      roomNo: "302",
      checkIn: "2025-10-18",
      checkOut: "2025-10-23",
      bookingNo: "BKG-2025-002",
      agent: "Abdul Rehman",
      status: "checked_in"
    },
    {
      id: 3,
      paxName: "Hassan Ahmed",
      hotel: "Makkah Tower",
      city: "Makkah",
      roomNo: "210",
      checkIn: "2025-10-20",
      checkOut: "2025-10-20",
      bookingNo: "BKG-2025-005",
      agent: "Sara Khan",
      status: "ready_checkout"
    }
  ],
  transportDetails: [
    {
      id: 1,
      paxName: "Ahmed Ali Khan",
      type: "Ziyarat",
      location: "Cave Hira",
      pickup: "Hilton Makkah",
      time: "08:00 AM",
      date: "2025-11-02",
      status: "scheduled",
      bookingNo: "BKG-2025-001"
    },
    {
      id: 2,
      paxName: "Fatima Zahra",
      type: "Transfer",
      location: "Madinah → Jeddah",
      pickup: "Madinah Grand",
      time: "10:30 AM",
      date: "2025-11-02",
      status: "in_progress",
      bookingNo: "BKG-2025-002"
    }
  ],
  flightDetails: [
    {
      id: 1,
      paxName: "Muhammad Usman",
      flightNo: "SV-802",
      from: "Islamabad (ISB)",
      to: "Jeddah (JED)",
      time: "05:30 PM",
      date: "2025-11-05",
      type: "arrival",
      bookingNo: "BKG-2025-003"
    },
    {
      id: 2,
      paxName: "Hassan Ahmed",
      flightNo: "PK-740",
      from: "Jeddah (JED)",
      to: "Lahore (LHE)",
      time: "11:45 PM",
      date: "2025-11-02",
      type: "departure",
      bookingNo: "BKG-2025-005"
    }
  ]
};

const PaxMovement = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPax, setSelectedPax] = useState(null);
  const [showPaxDetailModal, setShowPaxDetailModal] = useState(false);

  const getStatusBadge = (status) => {
    const badges = {
      in_ksa: { bg: "success", text: "In KSA", icon: "🟢" },
      visa_issued: { bg: "warning", text: "Visa Issued", icon: "🟡" },
      exited: { bg: "secondary", text: "Exited", icon: "🔴" },
      pending: { bg: "info", text: "Pending", icon: "🔵" },
      active: { bg: "success", text: "Active", icon: "✅" }
    };
    return badges[status] || badges.pending;
  };

  const openDetailsModal = (section) => {
    setSelectedSection(section);
    setShowDetailsModal(true);
  };

  const openPaxDetailModal = (pax) => {
    setSelectedPax(pax);
    setShowPaxDetailModal(true);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Filter passengers based on search query
  const filteredPaxList = demoPaxData.paxList.filter((pax) => {
    const query = searchQuery.toLowerCase();
    return (
      pax.name.toLowerCase().includes(query) ||
      pax.bookingNo.toLowerCase().includes(query) ||
      pax.passport.toLowerCase().includes(query) ||
      pax.currentCity.toLowerCase().includes(query)
    );
  });

  // Get movement history for a specific pax
  const getPaxMovementHistory = (paxName) => {
    const movements = [];
    
    // Check hotel records
    const hotelRecord = demoPaxData.hotelDetails.find(h => h.paxName === paxName);
    if (hotelRecord) {
      movements.push({
        type: "Hotel",
        icon: "🏨",
        details: `${hotelRecord.hotel}, ${hotelRecord.city}`,
        subDetails: `Room ${hotelRecord.roomNo} | ${hotelRecord.checkIn} to ${hotelRecord.checkOut}`,
        status: hotelRecord.status,
        date: hotelRecord.checkIn
      });
    }

    // Check transport records
    const transportRecords = demoPaxData.transportDetails.filter(t => t.paxName === paxName);
    transportRecords.forEach(t => {
      movements.push({
        type: t.type,
        icon: t.type === "Ziyarat" ? "🕌" : "🚐",
        details: t.location,
        subDetails: `Pickup: ${t.pickup} | ${t.date} ${t.time}`,
        status: t.status,
        date: t.date
      });
    });

    // Check flight records
    const flightRecords = demoPaxData.flightDetails.filter(f => f.paxName === paxName);
    flightRecords.forEach(f => {
      movements.push({
        type: "Flight",
        icon: "✈️",
        details: `${f.flightNo} | ${f.from} → ${f.to}`,
        subDetails: `${f.date} ${f.time}`,
        status: f.type,
        date: f.date
      });
    });

    return movements.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const renderOverviewCards = () => (
    <Row className="g-3 mb-4">
      <Col xs={6} md={4} lg={2}>
        <Card className="text-center shadow-sm h-100 cursor-pointer hover-shadow" onClick={() => openDetailsModal("visa_issued")}>
          <Card.Body className="p-3">
            <div className="mb-2">🟡</div>
            <h4 className="mb-1 text-warning">{demoPaxData.locationOverview.visaIssued}</h4>
            <small className="text-muted">Visa Issued</small>
            <div className="mt-2"><small className="text-muted">In Pakistan</small></div>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={6} md={4} lg={2}>
        <Card className="text-center shadow-sm h-100 cursor-pointer hover-shadow" onClick={() => openDetailsModal("arrived_ksa")}>
          <Card.Body className="p-3">
            <div className="mb-2">🟢</div>
            <h4 className="mb-1 text-success">{demoPaxData.locationOverview.arrivedKSA}</h4>
            <small className="text-muted">Arrived KSA</small>
            <div className="mt-2"><small className="text-muted">Total in KSA</small></div>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={6} md={4} lg={2}>
        <Card className="text-center shadow-sm h-100 cursor-pointer hover-shadow" onClick={() => openDetailsModal("in_makkah")}>
          <Card.Body className="p-3">
            <div className="mb-2">🕋</div>
            <h4 className="mb-1 text-primary">{demoPaxData.locationOverview.inMakkah}</h4>
            <small className="text-muted">In Makkah</small>
            <div className="mt-2"><small className="text-muted">Holy City</small></div>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={6} md={4} lg={2}>
        <Card className="text-center shadow-sm h-100 cursor-pointer hover-shadow" onClick={() => openDetailsModal("in_madinah")}>
          <Card.Body className="p-3">
            <div className="mb-2">🕌</div>
            <h4 className="mb-1 text-info">{demoPaxData.locationOverview.inMadinah}</h4>
            <small className="text-muted">In Madinah</small>
            <div className="mt-2"><small className="text-muted">Holy City</small></div>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={6} md={4} lg={2}>
        <Card className="text-center shadow-sm h-100 cursor-pointer hover-shadow" onClick={() => openDetailsModal("in_jeddah")}>
          <Card.Body className="p-3">
            <div className="mb-2">🏙️</div>
            <h4 className="mb-1 text-secondary">{demoPaxData.locationOverview.inJeddah}</h4>
            <small className="text-muted">In Jeddah</small>
            <div className="mt-2"><small className="text-muted">Gateway City</small></div>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={6} md={4} lg={2}>
        <Card className="text-center shadow-sm h-100 cursor-pointer hover-shadow" onClick={() => openDetailsModal("exited")}>
          <Card.Body className="p-3">
            <div className="mb-2">🔴</div>
            <h4 className="mb-1 text-danger">{demoPaxData.locationOverview.exitedKSA}</h4>
            <small className="text-muted">Exited KSA</small>
            <div className="mt-2"><small className="text-muted">Returned</small></div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderHotelSummary = () => (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex align-items-center">
          <Hotel size={20} className="me-2 text-primary" />
          <h5 className="mb-0">Hotel Stay Summary</h5>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col xs={6} md={3}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("current_checkins")}>
              <h3 className="text-success mb-2">{demoPaxData.hotelSummary.currentCheckIns}</h3>
              <small className="text-muted">Current Check-Ins</small>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("ready_checkout")}>
              <h3 className="text-warning mb-2">{demoPaxData.hotelSummary.readyForCheckout}</h3>
              <small className="text-muted">Ready for Checkout</small>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("checked_out_today")}>
              <h3 className="text-secondary mb-2">{demoPaxData.hotelSummary.checkedOutToday}</h3>
              <small className="text-muted">Checked Out Today</small>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("upcoming_checkins")}>
              <h3 className="text-info mb-2">{demoPaxData.hotelSummary.upcomingCheckIns}</h3>
              <small className="text-muted">Upcoming Check-Ins</small>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  const renderTransportSummary = () => (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex align-items-center">
          <MapPin size={20} className="me-2 text-danger" />
          <h5 className="mb-0">Transport & Ziyarat Movement</h5>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col xs={6} md={3}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("todays_transfers")}>
              <h3 className="text-primary mb-2">{demoPaxData.transportSummary.todaysTransfers}</h3>
              <small className="text-muted">Today's Transfers</small>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("upcoming_ziyarat")}>
              <h3 className="text-info mb-2">{demoPaxData.transportSummary.upcomingZiyarat}</h3>
              <small className="text-muted">Upcoming Ziyarat</small>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("in_progress")}>
              <h3 className="text-warning mb-2">{demoPaxData.transportSummary.inProgress}</h3>
              <small className="text-muted">In Progress</small>
            </div>
          </Col>
          <Col xs={6} md={3}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("completed")}>
              <h3 className="text-success mb-2">{demoPaxData.transportSummary.completed}</h3>
              <small className="text-muted">Completed</small>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  const renderFlightSummary = () => (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex align-items-center">
          <Plane size={20} className="me-2 text-success" />
          <h5 className="mb-0">Flight Summary</h5>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col xs={6} md={4}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("todays_arrivals")}>
              <h3 className="text-success mb-2">{demoPaxData.flightSummary.todaysArrivals}</h3>
              <small className="text-muted">Today's Arrivals</small>
              <div className="mt-2"><small className="text-muted">From Pakistan</small></div>
            </div>
          </Col>
          <Col xs={6} md={4}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("todays_departures")}>
              <h3 className="text-danger mb-2">{demoPaxData.flightSummary.todaysDepartures}</h3>
              <small className="text-muted">Today's Departures</small>
              <div className="mt-2"><small className="text-muted">To Pakistan</small></div>
            </div>
          </Col>
          <Col xs={12} md={4}>
            <div className="text-center p-3 bg-light rounded cursor-pointer hover-bg-primary" onClick={() => openDetailsModal("upcoming_flights")}>
              <h3 className="text-info mb-2">{demoPaxData.flightSummary.upcomingFlights}</h3>
              <small className="text-muted">Upcoming Flights</small>
              <div className="mt-2"><small className="text-muted">Next 3 Days</small></div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  const renderPaxListTable = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center mb-2 mb-md-0">
            <Users size={20} className="me-2 text-primary" />
            <h5 className="mb-0">All Passengers ({filteredPaxList.length})</h5>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <InputGroup style={{ width: "250px" }}>
              <Form.Control
                size="sm"
                placeholder="Search pax, booking, passport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button variant="outline-secondary" size="sm" onClick={clearSearch}>
                  <X size={16} />
                </Button>
              )}
              <Button variant="primary" size="sm">
                <Search size={16} />
              </Button>
            </InputGroup>
            <Form.Select size="sm" style={{ width: "auto" }} value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
              <option value="all">All Locations</option>
              <option value="pakistan">In Pakistan</option>
              <option value="ksa">In KSA</option>
              <option value="makkah">Makkah</option>
              <option value="madinah">Madinah</option>
              <option value="jeddah">Jeddah</option>
            </Form.Select>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {filteredPaxList.length === 0 ? (
          <div className="text-center py-5">
            <Users size={48} className="text-muted mb-3" />
            <p className="text-muted">No passengers found matching "{searchQuery}"</p>
            <Button variant="outline-primary" size="sm" onClick={clearSearch}>Clear Search</Button>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <Table hover className="mb-0" style={{ minWidth: "1000px" }}>
              <thead className="bg-light">
                <tr>
                  <th style={{ minWidth: "150px" }}>Pax Name</th>
                  <th style={{ minWidth: "120px" }}>Passport</th>
                  <th style={{ minWidth: "130px" }}>Booking No</th>
                  <th style={{ minWidth: "120px" }}>Current City</th>
                  <th style={{ minWidth: "150px" }}>Hotel</th>
                  <th style={{ minWidth: "100px" }}>Room</th>
                  <th style={{ minWidth: "120px" }}>Status</th>
                  <th style={{ minWidth: "100px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaxList.map((pax) => {
                  const badge = getStatusBadge(pax.statusBadge);
                  return (
                    <tr key={pax.id}>
                      <td>
                        <div className="fw-bold">{pax.name}</div>
                      </td>
                      <td>{pax.passport}</td>
                      <td><Badge bg="secondary">{pax.bookingNo}</Badge></td>
                      <td>{pax.currentCity}</td>
                      <td>{pax.hotel}</td>
                      <td>{pax.roomNo}</td>
                      <td>
                        <Badge bg={badge.bg}>{badge.icon} {badge.text}</Badge>
                      </td>
                      <td>
                        <Button size="sm" variant="outline-primary" onClick={() => openPaxDetailModal(pax)}>
                          <Eye size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div className="min-vh-100 bg-light">
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        <div className="col-12 col-lg-10">
          <div className="container-fluid">
            <AgentHeader />
            <div className="p-3 p-lg-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <div>
                  <h3 className="mb-1">Pax Movement Dashboard</h3>
                  <small className="text-muted">Real-time passenger tracking and movement status</small>
                </div>
                <div className="d-flex gap-2 mt-2 mt-md-0">
                  <Button variant="outline-primary" size="sm">
                    <Calendar size={16} className="me-1" /> Filter by Date
                  </Button>
                  <Button variant="primary" size="sm">
                    <TrendingUp size={16} className="me-1" /> Export Report
                  </Button>
                </div>
              </div>

              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
                <Tab eventKey="overview" title="Overview">
                  <>
                    {renderOverviewCards()}
                    <Row>
                      <Col lg={12}>{renderHotelSummary()}</Col>
                      <Col lg={12}>{renderTransportSummary()}</Col>
                      <Col lg={12}>{renderFlightSummary()}</Col>
                    </Row>
                  </>
                </Tab>
                <Tab eventKey="hotels" title="Hotels">
                  <Card className="shadow-sm">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">Hotel Details</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive" style={{ overflowX: "auto" }}>
                        <Table hover className="mb-0" style={{ minWidth: "900px" }}>
                          <thead className="bg-light">
                            <tr>
                              <th style={{ minWidth: "150px" }}>Pax Name</th>
                              <th style={{ minWidth: "150px" }}>Hotel</th>
                              <th style={{ minWidth: "120px" }}>City</th>
                              <th style={{ minWidth: "100px" }}>Room No</th>
                              <th style={{ minWidth: "120px" }}>Check-In</th>
                              <th style={{ minWidth: "120px" }}>Check-Out</th>
                              <th style={{ minWidth: "130px" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {demoPaxData.hotelDetails.map((hotel) => (
                              <tr key={hotel.id}>
                                <td>{hotel.paxName}</td>
                                <td>{hotel.hotel}</td>
                                <td>{hotel.city}</td>
                                <td>{hotel.roomNo}</td>
                                <td>{hotel.checkIn}</td>
                                <td>{hotel.checkOut}</td>
                                <td>
                                  <Badge bg={hotel.status === "checked_in" ? "success" : "warning"}>
                                    {hotel.status === "checked_in" ? "Checked In" : "Ready Checkout"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Tab>
                <Tab eventKey="transport" title="Transport & Ziyarat">
                  <Card className="shadow-sm">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">Transport & Ziyarat Details</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive" style={{ overflowX: "auto" }}>
                        <Table hover className="mb-0" style={{ minWidth: "900px" }}>
                          <thead className="bg-light">
                            <tr>
                              <th style={{ minWidth: "150px" }}>Pax Name</th>
                              <th style={{ minWidth: "120px" }}>Type</th>
                              <th style={{ minWidth: "150px" }}>Location</th>
                              <th style={{ minWidth: "150px" }}>Pickup</th>
                              <th style={{ minWidth: "180px" }}>Date & Time</th>
                              <th style={{ minWidth: "130px" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {demoPaxData.transportDetails.map((transport) => (
                              <tr key={transport.id}>
                                <td>{transport.paxName}</td>
                                <td><Badge bg="info">{transport.type}</Badge></td>
                                <td>{transport.location}</td>
                                <td>{transport.pickup}</td>
                                <td>{transport.date} {transport.time}</td>
                                <td>
                                  <Badge bg={transport.status === "in_progress" ? "warning" : "secondary"}>
                                    {transport.status === "in_progress" ? "In Progress" : "Scheduled"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Tab>
                <Tab eventKey="flights" title="Flights">
                  <Card className="shadow-sm">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">Flight Details</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive" style={{ overflowX: "auto" }}>
                        <Table hover className="mb-0" style={{ minWidth: "800px" }}>
                          <thead className="bg-light">
                            <tr>
                              <th style={{ minWidth: "150px" }}>Pax Name</th>
                              <th style={{ minWidth: "130px" }}>Flight No</th>
                              <th style={{ minWidth: "200px" }}>Route</th>
                              <th style={{ minWidth: "180px" }}>Date & Time</th>
                              <th style={{ minWidth: "120px" }}>Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {demoPaxData.flightDetails.map((flight) => (
                              <tr key={flight.id}>
                                <td>{flight.paxName}</td>
                                <td><Badge bg="dark">{flight.flightNo}</Badge></td>
                                <td>
                                  {flight.from} <ArrowRight size={14} className="mx-1" /> {flight.to}
                                </td>
                                <td>{flight.date} {flight.time}</td>
                                <td>
                                  <Badge bg={flight.type === "arrival" ? "success" : "danger"}>
                                    {flight.type === "arrival" ? "Arrival" : "Departure"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Tab>
                <Tab eventKey="all_pax" title="All Passengers">
                  {renderPaxListTable()}
                </Tab>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedSection === "pax_details" ? "Passenger Details" : "Filtered Passengers"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <small className="text-muted">Showing passengers for: <strong>{selectedSection}</strong></small>
          </div>
          <Table hover size="sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Booking No</th>
                <th>Status</th>
                <th>Next Movement</th>
              </tr>
            </thead>
            <tbody>
              {demoPaxData.paxList.slice(0, 3).map((pax) => (
                <tr key={pax.id}>
                  <td>{pax.name}</td>
                  <td>{pax.bookingNo}</td>
                  <td><Badge bg={getStatusBadge(pax.statusBadge).bg}>{getStatusBadge(pax.statusBadge).text}</Badge></td>
                  <td><small className="text-muted">{pax.nextMovement}</small></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowDetailsModal(false)}>Close</Button>
          <Button variant="primary" size="sm">Export List</Button>
        </Modal.Footer>
      </Modal>

      {/* Individual Pax Detail Modal */}
      <Modal show={showPaxDetailModal} onHide={() => setShowPaxDetailModal(false)} size="xl">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <div className="d-flex align-items-center gap-2">
              <Users size={24} />
              <div>
                <div>{selectedPax?.name}</div>
                <small className="opacity-75">Complete Movement History</small>
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPax && (
            <>
              {/* Passenger Basic Info */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                  <Row>
                    <Col md={6} lg={3} className="mb-3 mb-lg-0">
                      <small className="text-muted d-block mb-1">Passenger Name</small>
                      <div className="fw-bold">{selectedPax.name}</div>
                    </Col>
                    <Col md={6} lg={3} className="mb-3 mb-lg-0">
                      <small className="text-muted d-block mb-1">Passport Number</small>
                      <div className="fw-bold">{selectedPax.passport}</div>
                    </Col>
                    <Col md={6} lg={3} className="mb-3 mb-lg-0">
                      <small className="text-muted d-block mb-1">Booking Number</small>
                      <Badge bg="secondary" className="fs-6">{selectedPax.bookingNo}</Badge>
                    </Col>
                    <Col md={6} lg={3}>
                      <small className="text-muted d-block mb-1">Current Status</small>
                      <Badge bg={getStatusBadge(selectedPax.statusBadge).bg} className="fs-6">
                        {getStatusBadge(selectedPax.statusBadge).icon} {getStatusBadge(selectedPax.statusBadge).text}
                      </Badge>
                    </Col>
                  </Row>
                  <hr className="my-3" />
                  <Row>
                    <Col md={4} className="mb-3 mb-md-0">
                      <small className="text-muted d-block mb-1">Current Location</small>
                      <div className="d-flex align-items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        <span className="fw-bold">{selectedPax.currentCity}</span>
                      </div>
                    </Col>
                    <Col md={4} className="mb-3 mb-md-0">
                      <small className="text-muted d-block mb-1">Current Hotel</small>
                      <div className="d-flex align-items-center gap-2">
                        <Hotel size={16} className="text-success" />
                        <span>{selectedPax.hotel}</span>
                      </div>
                    </Col>
                    <Col md={4}>
                      <small className="text-muted d-block mb-1">Room Number</small>
                      <div className="fw-bold">{selectedPax.roomNo}</div>
                    </Col>
                  </Row>
                  <hr className="my-3" />
                  <Row>
                    <Col md={4} className="mb-3 mb-md-0">
                      <small className="text-muted d-block mb-1">Check-In Date</small>
                      <div>{selectedPax.checkIn}</div>
                    </Col>
                    <Col md={4} className="mb-3 mb-md-0">
                      <small className="text-muted d-block mb-1">Check-Out Date</small>
                      <div>{selectedPax.checkOut}</div>
                    </Col>
                    <Col md={4}>
                      <small className="text-muted d-block mb-1">Next Movement</small>
                      <div className="text-warning fw-bold">{selectedPax.nextMovement}</div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Movement History Timeline */}
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">📍 Movement History & Timeline</h6>
                </Card.Header>
                <Card.Body>
                  {getPaxMovementHistory(selectedPax.name).length === 0 ? (
                    <div className="text-center py-4">
                      <MapPin size={48} className="text-muted mb-3" />
                      <p className="text-muted">No movement history available yet</p>
                    </div>
                  ) : (
                    <div className="timeline">
                      {getPaxMovementHistory(selectedPax.name).map((movement, index) => (
                        <div key={index} className="timeline-item mb-4">
                          <Row>
                            <Col xs="auto">
                              <div className="timeline-icon bg-light rounded-circle p-3 shadow-sm">
                                <span style={{ fontSize: "24px" }}>{movement.icon}</span>
                              </div>
                            </Col>
                            <Col>
                              <Card className="border">
                                <Card.Body className="p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="mb-0">{movement.type}</h6>
                                    <Badge bg={
                                      movement.status === "checked_in" ? "success" :
                                      movement.status === "scheduled" ? "info" :
                                      movement.status === "in_progress" ? "warning" :
                                      movement.status === "arrival" ? "success" :
                                      movement.status === "departure" ? "danger" : "secondary"
                                    }>
                                      {movement.status.replace("_", " ").toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="mb-1 fw-bold">{movement.details}</p>
                                  <small className="text-muted">{movement.subDetails}</small>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Agent & Branch Info */}
              <Card className="mt-4 border-0 shadow-sm bg-light">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <small className="text-muted d-block mb-1">Handled by Agent</small>
                      <div className="fw-bold">{selectedPax.agent}</div>
                    </Col>
                    <Col md={6}>
                      <small className="text-muted d-block mb-1">Branch</small>
                      <div className="fw-bold">{selectedPax.branch}</div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaxDetailModal(false)}>Close</Button>
          <Button variant="outline-primary">Print Details</Button>
          <Button variant="primary">Track Live Location</Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          transform: translateY(-2px);
        }
        .hover-bg-primary:hover {
          background-color: #e7f3ff !important;
        }
        .timeline {
          position: relative;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 31px;
          top: 40px;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #0d6efd 0%, #e9ecef 100%);
        }
        .timeline-item:last-child .timeline::before {
          display: none;
        }
        .timeline-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #fff;
          z-index: 1;
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default PaxMovement;
