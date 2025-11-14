import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, DollarSign, TrendingUp, CheckCircle, AlertCircle, Copy, Filter, Download, BarChart3 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import './styles/commission-management.css';

const CommissionManagement = () => {
  // Active Tab State
  const [activeTab, setActiveTab] = useState('rules');

  // Rules State
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'Lahore Branch - Group Tickets',
      organization_id: 1,
      branch_id: 1,
      receiver_type: 'branch',
      applied_on_type: 'ticket',
      commission_type: 'fixed',
      commission_value: 922,
      min_sale_amount: null,
      active: true,
      created_at: '2025-01-15',
    },
    {
      id: 2,
      name: 'Karachi Area Agent - Umrah Packages',
      organization_id: 1,
      branch_id: 2,
      receiver_type: 'area_agent',
      applied_on_type: 'umrah',
      commission_type: 'fixed',
      commission_value: 1000,
      min_sale_amount: 150000,
      active: true,
      created_at: '2025-01-10',
    },
    {
      id: 3,
      name: 'Employee - Hotels',
      organization_id: 1,
      branch_id: 1,
      receiver_type: 'employee',
      applied_on_type: 'hotel',
      commission_type: 'fixed',
      commission_value: 200,
      min_sale_amount: null,
      active: true,
      created_at: '2025-01-05',
    },
  ]);

  // Earnings State
  const [earnings, setEarnings] = useState([
    {
      id: 101,
      booking_no: 'BKG-2541',
      service_type: 'umrah',
      earned_by_type: 'branch',
      earned_by_name: 'Lahore Branch',
      sale_amount: 185000,
      commission_amount: 5000,
      status: 'earned',
      redeemed: false,
      created_at: '2025-10-20',
    },
    {
      id: 102,
      booking_no: 'BKG-2542',
      service_type: 'ticket',
      earned_by_type: 'area_agent',
      earned_by_name: 'Ali Khan (Area Agent)',
      sale_amount: 50000,
      commission_amount: 922,
      status: 'pending',
      redeemed: false,
      created_at: '2025-10-18',
    },
    {
      id: 103,
      booking_no: 'BKG-2543',
      service_type: 'hotel',
      earned_by_type: 'employee',
      earned_by_name: 'Hassan Ahmed (Employee)',
      sale_amount: 45000,
      commission_amount: 3000,
      status: 'earned',
      redeemed: true,
      created_at: '2025-10-15',
    },
    {
      id: 104,
      booking_no: 'BKG-2544',
      service_type: 'ticket',
      earned_by_type: 'branch',
      earned_by_name: 'Karachi Branch',
      sale_amount: 92000,
      commission_amount: 1844,
      status: 'earned',
      redeemed: false,
      created_at: '2025-10-12',
    },
    {
      id: 105,
      booking_no: 'BKG-2545',
      service_type: 'umrah',
      earned_by_type: 'employee',
      earned_by_name: 'Fatima Khan (Employee)',
      sale_amount: 250000,
      commission_amount: 7500,
      status: 'pending',
      redeemed: false,
      created_at: '2025-10-10',
    },
  ]);

  // Report/Summary State
  const [reportData] = useState({
    date_range: 'Last 30 Days',
    branch_total: 85000,
    area_agent_total: 37000,
    employee_total: 18000,
    total_earned: 140000,
    total_pending: 45000,
    total_redeemed: 62000,
    service_breakdown: {
      tickets: 42000,
      umrah: 75000,
      hotels: 23000,
    },
  });

  // Modal States
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showEarningModal, setShowEarningModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [selectedEarning, setSelectedEarning] = useState(null);

  // Form States
  const [ruleForm, setRuleForm] = useState({
    name: '',
    organization_id: 1,
    branch_id: '',
    receiver_type: 'branch',
    applied_on_type: 'ticket',
    commission_type: 'fixed',
    commission_value: '',
    min_sale_amount: '',
  });

  const [redeemForm, setRedeemForm] = useState({
    payment_reference: '',
    paid_by: 'organization',
    remarks: '',
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    earned_by_type: '',
    service_type: '',
    date_from: '',
    date_to: '',
  });

  // Alert State
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

  // Show Alert
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Handle Rule Modal
  const handleAddRule = () => {
    setSelectedRule(null);
    setRuleForm({
      name: '',
      organization_id: 1,
      branch_id: '',
      receiver_type: 'branch',
      applied_on_type: 'ticket',
      commission_type: 'fixed',
      commission_value: '',
      min_sale_amount: '',
    });
    setShowRuleModal(true);
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setRuleForm(rule);
    setShowRuleModal(true);
  };

  const handleSaveRule = () => {
    if (!ruleForm.name || !ruleForm.commission_value) {
      showAlert('danger', 'Please fill all required fields');
      return;
    }

    if (selectedRule) {
      setRules(rules.map(r => r.id === selectedRule.id ? { ...ruleForm, id: selectedRule.id } : r));
      showAlert('success', 'Commission rule updated successfully');
    } else {
      setRules([...rules, { ...ruleForm, id: Math.max(...rules.map(r => r.id), 0) + 1, created_at: new Date().toISOString().split('T')[0] }]);
      showAlert('success', 'Commission rule created successfully');
    }
    setShowRuleModal(false);
  };

  const handleDeleteRule = (id) => {
    if (window.confirm('Are you sure you want to delete this commission rule?')) {
      setRules(rules.filter(r => r.id !== id));
      showAlert('success', 'Commission rule deleted successfully');
    }
  };

  // Handle Redeem
  const handleRedeemClick = (earning) => {
    setSelectedEarning(earning);
    setRedeemForm({
      payment_reference: '',
      paid_by: 'organization',
      remarks: '',
    });
    setShowRedeemModal(true);
  };

  const handleSaveRedeem = () => {
    if (!redeemForm.payment_reference) {
      showAlert('danger', 'Please enter payment reference');
      return;
    }

    setEarnings(earnings.map(e => 
      e.id === selectedEarning.id 
        ? { ...e, redeemed: true, status: 'paid' }
        : e
    ));
    
    showAlert('success', `Commission redeemed successfully. Ledger entry created: ${redeemForm.payment_reference}`);
    setShowRedeemModal(false);
  };

  // Get Badge Classes
  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'warning', label: 'Pending' },
      earned: { bg: 'success', label: 'Earned' },
      paid: { bg: 'info', label: 'Paid' },
      cancelled: { bg: 'danger', label: 'Cancelled' },
    };
    return badges[status] || { bg: 'secondary', label: status };
  };

  const getServiceBadge = (type) => {
    const badges = {
      ticket: { bg: 'primary', label: '✈️ Ticket' },
      umrah: { bg: 'success', label: '🕋️ Umrah' },
      hotel: { bg: 'info', label: '🏨 Hotel' },
    };
    return badges[type] || { bg: 'secondary', label: type };
  };

  const getReceiverBadge = (type) => {
    const badges = {
      branch: { bg: 'primary', label: 'Branch' },
      area_agent: { bg: 'warning', label: 'Area Agent' },
      employee: { bg: 'info', label: 'Employee' },
    };
    return badges[type] || { bg: 'secondary', label: type };
  };

  // Filtered Earnings
  const filteredEarnings = earnings.filter(e => {
    if (filters.status && e.status !== filters.status) return false;
    if (filters.earned_by_type && e.earned_by_type !== filters.earned_by_type) return false;
    if (filters.service_type && e.service_type !== filters.service_type) return false;
    return true;
  });

  return (
    <>
      <Sidebar />
      <Header />
      <Container fluid className="commission-management py-4">
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
              <h2 className="mb-1">Commission Management</h2>
              <p className="text-muted mb-0">Manage commission rules, track earnings, and redeem payments</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm">
                <Download size={18} className="me-2" />
                Export Report
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Navigation Tabs */}
      <Row className="mb-4">
        <Col>
          <div className="commission-tabs">
            <button
              className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              <BarChart3 size={18} className="me-2" />
              Commission Rules
            </button>
            <button
              className={`tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              <TrendingUp size={18} className="me-2" />
              Commission Earnings
            </button>
            <button
              className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              <BarChart3 size={18} className="me-2" />
              Reports & Summary
            </button>
          </div>
        </Col>
      </Row>

      {/* ==================== RULES TAB ==================== */}
      {activeTab === 'rules' && (
        <>
          {/* Stats */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <StatsCard icon={BarChart3} title="Total Rules" value={rules.length} color="primary" subtitle="Active commission rules" />
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <StatsCard icon={CheckCircle} title="Active" value={rules.filter(r => r.active).length} color="success" />
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <StatsCard icon={Filter} title="By Branch" value={new Set(rules.map(r => r.branch_id)).size} color="info" />
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <StatsCard icon={DollarSign} title="Receiver Types" value="3" color="warning" subtitle="Branch, Agent, Employee" />
            </Col>
          </Row>

          {/* Rules Table */}
          <Card className="commission-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <Card.Title className="mb-0">Commission Rules</Card.Title>
              </div>
              <Button variant="primary" size="sm" onClick={handleAddRule}>
                <Plus size={18} className="me-2" />
                Add Rule
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Rule Name</th>
                    <th>Receiver Type</th>
                    <th>Applied On</th>
                    <th>Commission</th>
                    <th>Min Sale</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => (
                    <tr key={rule.id}>
                      <td>
                        <strong>{rule.name}</strong>
                        <br />
                        <small className="text-muted">Rule ID: {rule.id}</small>
                      </td>
                      <td>
                        <Badge bg={getReceiverBadge(rule.receiver_type).bg}>
                          {getReceiverBadge(rule.receiver_type).label}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="light" text="dark">
                          {rule.applied_on_type === 'ticket' ? '✈️ Ticket' : rule.applied_on_type === 'umrah' ? '🕋️ Umrah' : '🏨 Hotel'}
                        </Badge>
                      </td>
                      <td>
                        <strong>
                          {rule.commission_type === 'fixed' ? `PKR ${rule.commission_value?.toLocaleString()}` : `${rule.commission_value}%`}
                        </strong>
                      </td>
                      <td>
                        {rule.min_sale_amount ? `PKR ${rule.min_sale_amount?.toLocaleString()}` : '-'}
                      </td>
                      <td>
                        <Badge bg={rule.active ? 'success' : 'danger'}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <small className="text-muted">{rule.created_at}</small>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
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

      {/* ==================== EARNINGS TAB ==================== */}
      {activeTab === 'earnings' && (
        <>
          {/* Stats */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <StatsCard icon={DollarSign} title="Total Earned" value={`PKR ${reportData.total_earned.toLocaleString()}`} color="success" />
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <StatsCard icon={AlertCircle} title="Pending" value={`PKR ${reportData.total_pending.toLocaleString()}`} color="warning" />
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <StatsCard icon={CheckCircle} title="Redeemed" value={`PKR ${reportData.total_redeemed.toLocaleString()}`} color="info" />
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <StatsCard icon={TrendingUp} title="Active Earnings" value={filteredEarnings.length} color="primary" subtitle="Commission records" />
            </Col>
          </Row>

          {/* Filters */}
          <Card className="commission-card mb-4">
            <Card.Header>
              <Card.Title className="mb-0">Filters</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      size="sm"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="earned">Earned</option>
                      <option value="paid">Paid</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label>Service Type</Form.Label>
                    <Form.Select
                      value={filters.service_type}
                      onChange={(e) => setFilters({ ...filters, service_type: e.target.value })}
                      size="sm"
                    >
                      <option value="">All Services</option>
                      <option value="ticket">Tickets</option>
                      <option value="umrah">Umrah</option>
                      <option value="hotel">Hotels</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label>Earned By</Form.Label>
                    <Form.Select
                      value={filters.earned_by_type}
                      onChange={(e) => setFilters({ ...filters, earned_by_type: e.target.value })}
                      size="sm"
                    >
                      <option value="">All Types</option>
                      <option value="branch">Branch</option>
                      <option value="area_agent">Area Agent</option>
                      <option value="employee">Employee</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label>&nbsp;</Form.Label>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setFilters({ status: '', earned_by_type: '', service_type: '', date_from: '', date_to: '' })}
                      className="w-100"
                    >
                      Clear Filters
                    </Button>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Earnings Table */}
          <Card className="commission-card">
            <Card.Header>
              <Card.Title className="mb-0">Commission Earnings</Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Booking No</th>
                    <th>Service Type</th>
                    <th>Earned By</th>
                    <th>Sale Amount</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Redeemed</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEarnings.map(earning => (
                    <tr key={earning.id}>
                      <td>
                        <strong>{earning.booking_no}</strong>
                      </td>
                      <td>
                        <Badge bg={getServiceBadge(earning.service_type).bg}>
                          {getServiceBadge(earning.service_type).label}
                        </Badge>
                      </td>
                      <td>
                        <div>
                          <strong>{earning.earned_by_name}</strong>
                          <br />
                          <small className="text-muted">{earning.earned_by_type}</small>
                        </div>
                      </td>
                      <td>
                        <strong>PKR {earning.sale_amount.toLocaleString()}</strong>
                      </td>
                      <td>
                        <div className="commission-amount">
                          <DollarSign size={14} className="me-1" />
                          <strong>PKR {earning.commission_amount.toLocaleString()}</strong>
                        </div>
                      </td>
                      <td>
                        <Badge bg={getStatusBadge(earning.status).bg}>
                          {getStatusBadge(earning.status).label}
                        </Badge>
                      </td>
                      <td>
                        {earning.redeemed ? (
                          <Badge bg="success">✓ Redeemed</Badge>
                        ) : (
                          <Badge bg="secondary">Not Redeemed</Badge>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">{earning.created_at}</small>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {!earning.redeemed && earning.status === 'earned' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleRedeemClick(earning)}
                              title="Redeem"
                            >
                              <CheckCircle size={16} />
                            </Button>
                          )}
                          <Button
                            variant="outline-info"
                            size="sm"
                            title="View Details"
                          >
                            <Eye size={16} />
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

      {/* ==================== REPORT TAB ==================== */}
      {activeTab === 'report' && (
        <>
          {/* Summary Statistics */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <StatsCard
                icon={DollarSign}
                title="Branch Total"
                value={`PKR ${reportData.branch_total.toLocaleString()}`}
                color="primary"
                subtitle="Commission earned"
              />
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <StatsCard
                icon={DollarSign}
                title="Area Agent Total"
                value={`PKR ${reportData.area_agent_total.toLocaleString()}`}
                color="success"
                subtitle="Commission earned"
              />
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <StatsCard
                icon={DollarSign}
                title="Employee Total"
                value={`PKR ${reportData.employee_total.toLocaleString()}`}
                color="info"
                subtitle="Commission earned"
              />
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <StatsCard
                icon={TrendingUp}
                title="Grand Total"
                value={`PKR ${(reportData.branch_total + reportData.area_agent_total + reportData.employee_total).toLocaleString()}`}
                color="warning"
                subtitle={reportData.date_range}
              />
            </Col>
          </Row>

          {/* Service Breakdown */}
          <Card className="commission-card mb-4">
            <Card.Header>
              <Card.Title className="mb-0">Commission by Service Type</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3">
                  <div className="service-breakdown-item">
                    <div className="service-icon ticket">✈️</div>
                    <div className="service-info">
                      <h5>Tickets</h5>
                      <p className="mb-0">PKR {reportData.service_breakdown.tickets.toLocaleString()}</p>
                      <small className="text-muted">30% of total</small>
                    </div>
                  </div>
                </Col>
                <Col md={4} className="mb-3">
                  <div className="service-breakdown-item">
                    <div className="service-icon umrah">🕋️</div>
                    <div className="service-info">
                      <h5>Umrah Packages</h5>
                      <p className="mb-0">PKR {reportData.service_breakdown.umrah.toLocaleString()}</p>
                      <small className="text-muted">53% of total</small>
                    </div>
                  </div>
                </Col>
                <Col md={4} className="mb-3">
                  <div className="service-breakdown-item">
                    <div className="service-icon hotel">🏨</div>
                    <div className="service-info">
                      <h5>Hotels</h5>
                      <p className="mb-0">PKR {reportData.service_breakdown.hotels.toLocaleString()}</p>
                      <small className="text-muted">17% of total</small>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Commission Status Overview */}
          <Card className="commission-card">
            <Card.Header>
              <Card.Title className="mb-0">Commission Status Overview</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-4">
                  <h6>By Status</h6>
                  <div className="status-item mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Earned (Not Redeemed)</span>
                      <strong>PKR {reportData.total_earned.toLocaleString()}</strong>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-success" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <div className="status-item mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Pending (Not Yet Earned)</span>
                      <strong>PKR {reportData.total_pending.toLocaleString()}</strong>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-warning" style={{ width: '32%' }}></div>
                    </div>
                  </div>
                  <div className="status-item">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Redeemed (Paid Out)</span>
                      <strong>PKR {reportData.total_redeemed.toLocaleString()}</strong>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-info" style={{ width: '44%' }}></div>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="mb-4">
                  <h6>Receiver Type Distribution</h6>
                  <div className="status-item mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Branch</span>
                      <strong>PKR {reportData.branch_total.toLocaleString()}</strong>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-primary" style={{ width: '61%' }}></div>
                    </div>
                  </div>
                  <div className="status-item mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Area Agent</span>
                      <strong>PKR {reportData.area_agent_total.toLocaleString()}</strong>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-warning" style={{ width: '26%' }}></div>
                    </div>
                  </div>
                  <div className="status-item">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Employee</span>
                      <strong>PKR {reportData.employee_total.toLocaleString()}</strong>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-info" style={{ width: '13%' }}></div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Add/Edit Rule Modal */}
      <Modal show={showRuleModal} onHide={() => setShowRuleModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedRule ? 'Edit Commission Rule' : 'Create Commission Rule'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Rule Name *</Form.Label>
              <Form.Control
                type="text"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder="e.g., Lahore Branch - Group Tickets"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Receiver Type *</Form.Label>
                  <Form.Select
                    value={ruleForm.receiver_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, receiver_type: e.target.value })}
                  >
                    <option value="branch">Branch</option>
                    <option value="area_agent">Area Agent</option>
                    <option value="employee">Employee</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Applied On *</Form.Label>
                  <Form.Select
                    value={ruleForm.applied_on_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, applied_on_type: e.target.value })}
                  >
                    <option value="ticket">Ticket</option>
                    <option value="umrah">Umrah Package</option>
                    <option value="hotel">Hotel</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Commission Type *</Form.Label>
                  <Form.Select
                    value={ruleForm.commission_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, commission_type: e.target.value })}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage (%)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Commission Value *</Form.Label>
                  <Form.Control
                    type="number"
                    value={ruleForm.commission_value}
                    onChange={(e) => setRuleForm({ ...ruleForm, commission_value: e.target.value })}
                    placeholder={ruleForm.commission_type === 'fixed' ? 'PKR 1000' : '5%'}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Minimum Sale Amount (Optional)</Form.Label>
              <Form.Control
                type="number"
                value={ruleForm.min_sale_amount}
                onChange={(e) => setRuleForm({ ...ruleForm, min_sale_amount: e.target.value })}
                placeholder="e.g., 150000"
              />
            </Form.Group>

            <Form.Group>
              <Form.Check
                type="checkbox"
                label="Active"
                checked={ruleForm.active !== false}
                onChange={(e) => setRuleForm({ ...ruleForm, active: e.target.checked })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRuleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveRule}>
            {selectedRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Redeem Modal */}
      <Modal show={showRedeemModal} onHide={() => setShowRedeemModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Redeem Commission</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEarning && (
            <>
              <div className="mb-4">
                <h6 className="mb-2">Commission Details</h6>
                <div className="bg-light p-3 rounded">
                  <div className="row mb-2">
                    <div className="col-6">Booking No:</div>
                    <div className="col-6 fw-bold">{selectedEarning.booking_no}</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-6">Earned By:</div>
                    <div className="col-6 fw-bold">{selectedEarning.earned_by_name}</div>
                  </div>
                  <div className="row">
                    <div className="col-6">Commission Amount:</div>
                    <div className="col-6 fw-bold text-success">PKR {selectedEarning.commission_amount.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Reference *</Form.Label>
                  <Form.Control
                    type="text"
                    value={redeemForm.payment_reference}
                    onChange={(e) => setRedeemForm({ ...redeemForm, payment_reference: e.target.value })}
                    placeholder="e.g., LEDG-5412, TXN-12345"
                  />
                  <small className="text-muted">This will be linked to the ledger entry</small>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Paid By</Form.Label>
                  <Form.Select
                    value={redeemForm.paid_by}
                    onChange={(e) => setRedeemForm({ ...redeemForm, paid_by: e.target.value })}
                  >
                    <option value="organization">Organization</option>
                    <option value="branch">Branch</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Remarks (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={redeemForm.remarks}
                    onChange={(e) => setRedeemForm({ ...redeemForm, remarks: e.target.value })}
                    placeholder="e.g., Commission payout for August"
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRedeemModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSaveRedeem}>
            Redeem Commission
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
    </>
  );
};

export default CommissionManagement;
