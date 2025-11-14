import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert, Tab, Tabs } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, DollarSign, TrendingUp, CheckCircle, AlertCircle, Copy, Filter, Download, BarChart3, MapPin, Calendar, Users, Zap } from 'lucide-react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import HotelsTabs from '../../components/HotelsTabs';
import '../../styles/hotel-outsourcing.css';
import api from '../../utils/Api';

const HotelOutsourcing = () => {
  // Active Tab State
  const [activeTab, setActiveTab] = useState('list');

  // Outsourcing Records State (start empty; data loaded from API)
  const [outsourcingRecords, setOutsourcingRecords] = useState([]);

  // Summary/Report Data (defaults)
  const [reportData] = useState({
    total_outsourced_bookings: 0,
    total_outsourced_amount: 0,
    total_paid: 0,
    total_pending: 0,
    total_booking_sales: 0,
    total_profit: 0,
    total_loss: 0,
    average_profit_margin: 0,
  });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [outForm, setOutForm] = useState({
    booking_id: '',
    hotel_name: '',
    room_type: 'Quad',
    room_no: '',
    currency: 'PKR',
    quantity: 1,
    check_in: '',
    check_out: '',
    remarks: '',
    booking_sale_price: '', // total sale amount for this booking (used to compute profit/loss)
    purchase_price: '', // optional: purchase price per night (if available)
  });

  const [paymentForm, setPaymentForm] = useState({
    status: 'paid',
    payment_date: new Date().toISOString().split('T')[0],
    payment_reference: '',
    remarks: '',
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    branch: '',
    hotel_name: '',
  });

  // Alert State
  const [alert, setAlert] = useState(null);

  // Statistics Component
  const StatsCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card className={`stats-card stats-${color} h-100`}>
      <Card.Body className="d-flex flex-column justify-content-between h-100">
        <div className="d-flex justify-content-between align-items-start w-100">
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

  // Fetch list from API
  const fetchOutsourcing = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/hotel-outsourcing/', { params: { limit: 200 } });
      // API may return paginated { data: [...] } or raw array
      const payload = res?.data?.data ?? res?.data ?? [];
      // Normalize items so UI fields exist. Prefer purchase_price for unit cost when available.
      const items = payload.map((item) => {
        const unitPrice = item.purchase_price ?? item.room_price ?? item.price ?? 0;
        const qty = item.quantity ?? 1;
        const nights = calculateNights(item.check_in, item.check_out) || item.nights || 0;
        const totalCost = item.total_cost ?? unitPrice * qty * nights;
        const bookingSale = Number(item.booking_sale_price) || Number(item.booking_sales) || 0;
        const profit = Number((bookingSale - totalCost).toFixed(2));
        return {
          ...item,
          // keep existing keys for compatibility
          room_price: item.room_price ?? item.price ?? null,
          purchase_price: item.purchase_price ?? null,
          quantity: qty,
          nights,
          total_cost: totalCost,
          booking_sale_price: bookingSale,
          profit_loss: profit,
        };
      });
      setOutsourcingRecords(items);
    } catch (err) {
      console.error('Failed to fetch outsourcing records', err);
      showAlert('danger', err?.response?.data?.detail || err.message || 'Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutsourcing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get Status Badge
  const getStatusBadge = (status) => {
    const badges = {
      paid: { bg: 'success', label: 'Paid ✓' },
      pending_payment: { bg: 'warning', label: 'Pending Payment' },
      cancelled: { bg: 'danger', label: 'Cancelled' },
    };
    return badges[status] || { bg: 'secondary', label: status };
  };

  // Safe number formatter
  const fmtNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : '0';
  };

  const fmtCurrency = (v) => `PKR ${fmtNum(v)}`;

  // Calculate nights
  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  // Handle Add Record
  const handleAddRecord = () => {
    setSelectedRecord(null);
    setOutForm({
      booking_id: '',
      hotel_name: '',
      room_type: 'Quad',
      room_no: '',
      currency: 'SAR',
      quantity: 1,
      check_in: '',
      check_out: '',
      remarks: '',
      booking_sale_price: '',
      purchase_price: '',
    });
    setShowAddModal(true);
  };

  // Handle Save Record
  const handleSaveRecord = async () => {
    if (!outForm.booking_id || !outForm.hotel_name || !outForm.purchase_price || !outForm.check_in || !outForm.check_out || !outForm.booking_sale_price) {
      showAlert('danger', 'Please fill all required fields (including Booking Sale Price and Purchase Price)');
      return;
    }

    setIsLoading(true);
    try {
      // Resolve booking identifier: accept numeric id or booking_number like BK-...
      let bookingIdToSend = null;
      const rawBooking = ('' + outForm.booking_id).trim();
      if (/^\d+$/.test(rawBooking)) {
        bookingIdToSend = parseInt(rawBooking, 10);
      } else {
        // Try to resolve by booking_number via bookings API
        try {
          // First try exact match param booking_number
          const resExact = await api.get('/bookings/', { params: { booking_number: rawBooking } });
          const listExact = resExact?.data?.data ?? resExact?.data ?? [];
          if (Array.isArray(listExact) && listExact.length > 0) {
            bookingIdToSend = listExact[0].id;
          } else {
            // Fallback to search param
            const resSearch = await api.get('/bookings/', { params: { search: rawBooking } });
            const listSearch = resSearch?.data?.data ?? resSearch?.data ?? [];
            if (Array.isArray(listSearch) && listSearch.length > 0) {
              bookingIdToSend = listSearch[0].id;
            }
          }
        } catch (err) {
          // ignore here and handle below
          console.warn('Booking lookup failed', err);
        }
      }

      if (!bookingIdToSend) {
        showAlert('danger', 'Could not resolve booking. Please enter a valid numeric Booking ID or a Booking Number (e.g. BK-20251107-DE0B).');
        setIsLoading(false);
        return;
      }

      const normalizeDate = (d) => {
        if (!d) return null;
        const s = String(d);
        // if iso datetime received, strip time portion
        if (s.includes('T')) return s.split('T')[0];
        return s;
      };

      const payload = {
        booking_id: bookingIdToSend,
        hotel_name: outForm.hotel_name,
        quantity: parseInt(outForm.quantity) || 1,
        check_in: normalizeDate(outForm.check_in),
        check_out: normalizeDate(outForm.check_out),
        remarks: outForm.remarks,
        // Business fields to compute profit/loss
        booking_sale_price: parseFloat(outForm.booking_sale_price) || 0,
        purchase_price: outForm.purchase_price ? parseFloat(outForm.purchase_price) : null,
      };
  // debug: show payload in browser console to inspect what's being sent
  console.debug('Creating outsourcing payload', payload);
  await api.post('/hotel-outsourcing/', payload);
      showAlert('success', 'Outsourced hotel record created successfully. Ledger entry auto-created.');
      setShowAddModal(false);
      await fetchOutsourcing();
    } catch (err) {
      console.error('Failed to create outsourcing record', err);
      const msg = err?.response?.data || err?.response?.data?.detail || err.message || 'Failed to create record';
      showAlert('danger', JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle View Record
  const handleViewRecord = (record) => {
    console.debug('handleViewRecord', record && record.id);
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  // Handle Delete Record
  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this outsourced hotel record?')) return;
    setIsLoading(true);
    try {
      console.debug('handleDeleteRecord deleting id', id);
      await api.delete(`/hotel-outsourcing/${id}/`);
      showAlert('success', 'Outsourced hotel record deleted successfully');
      await fetchOutsourcing();
    } catch (err) {
      console.error('Failed to delete record', err);
      showAlert('danger', err?.response?.data?.detail || err.message || 'Failed to delete record');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Payment Status Update
  const handlePaymentClick = (record) => {
    setSelectedRecord(record);
    setPaymentForm({
      status: record.status === 'paid' ? 'pending_payment' : 'paid',
      payment_date: new Date().toISOString().split('T')[0],
      payment_reference: '',
      remarks: '',
    });
    setShowPaymentModal(true);
  };

  // Handle Save Payment
  const handleSavePayment = async () => {
    setIsLoading(true);
    try {
      console.debug('handleSavePayment', selectedRecord && selectedRecord.id, paymentForm.status);
      const isPaid = paymentForm.status === 'paid';
      if (!selectedRecord || !selectedRecord.id) {
        showAlert('danger', 'No record selected for payment update');
        return;
      }
      await api.patch(`/hotel-outsourcing/${selectedRecord.id}/payment-status/`, { is_paid: isPaid });
      showAlert('success', `Payment status updated. Ledger entry ${isPaid ? 'settled' : 'moved to pending payables'}.`);
      setShowPaymentModal(false);
      await fetchOutsourcing();
    } catch (err) {
      console.error('Failed to update payment status', err);
      showAlert('danger', err?.response?.data?.detail || err.message || 'Failed to update payment status');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Records
  const filteredRecords = outsourcingRecords.filter(r => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.branch && r.branch !== filters.branch) return false;
    if (filters.hotel_name && !(r.hotel_name || '').toLowerCase().includes(filters.hotel_name.toLowerCase())) return false;
    return true;
  });

  // Calculate totals for filtered records
  const filterTotals = {
    total_cost: filteredRecords.reduce((sum, r) => sum + (Number(r.total_cost) || 0), 0),
    total_paid: filteredRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + (Number(r.total_cost) || 0), 0),
    total_pending: filteredRecords.filter(r => r.status === 'pending_payment').reduce((sum, r) => sum + (Number(r.total_cost) || 0), 0),
  };

  return (
    <>
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        <div className="col-12 col-lg-10">
          <div className="container-fluid">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <HotelsTabs />
              {alert && (
                <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
                  {alert.message}
                </Alert>
              )}

              {/* Header */}
              <Row className="mb-4 align-items-stretch">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1 text-nowrap" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Hotel Outsourcing Management</h2>
                  <p className="text-muted mb-0 text-truncate" style={{ maxWidth: '48rem' }}>Track external hotel bookings, payments, and profit/loss calculations</p>
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
          {/* <Row className="mb-4">
            <Col>
              <div className="outsourcing-tabs">
                <button
                  className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveTab('list')}
                >
                  <MapPin size={18} className="me-2" />
                  Outsourced Hotels
                </button>
                <button
                  className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
                  onClick={() => setActiveTab('payment')}
                >
                  <DollarSign size={18} className="me-2" />
                  Payment Tracking
                </button>
                <button
                  className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveTab('report')}
                >
                  <BarChart3 size={18} className="me-2" />
                  Reports & Analytics
                </button>
              </div>
            </Col>
          </Row> */}

          {/* ==================== LIST TAB ==================== */}
          {activeTab === 'list' && (
            <>
              {/* Stats */}
              <Row className="mb-4 align-items-stretch">
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={MapPin} title="Total Outsourced" value={outsourcingRecords.length} color="primary" subtitle="Active records" />
                </Col>
                  <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={DollarSign} title="Total Outsource Cost" value={fmtCurrency(filterTotals.total_cost)} color="warning" />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={CheckCircle} title="Paid" value={outsourcingRecords.filter(r => r.status === 'paid').length} color="success" subtitle={fmtCurrency(filterTotals.total_paid)} />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={AlertCircle} title="Pending Payment" value={outsourcingRecords.filter(r => r.status === 'pending_payment').length} color="danger" subtitle={fmtCurrency(filterTotals.total_pending)} />
                </Col>
              </Row>

              {/* Filters */}
              <Card className="outsourcing-card mb-4">
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
                          <option value="paid">Paid</option>
                          <option value="pending_payment">Pending Payment</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Branch</Form.Label>
                        <Form.Select
                          value={filters.branch}
                          onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                          size="sm"
                        >
                          <option value="">All Branches</option>
                          <option value="Karachi">Karachi</option>
                          <option value="Lahore">Lahore</option>
                          <option value="Islamabad">Islamabad</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Hotel Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={filters.hotel_name}
                          onChange={(e) => setFilters({ ...filters, hotel_name: e.target.value })}
                          placeholder="Search hotel"
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>&nbsp;</Form.Label>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setFilters({ status: '', branch: '', hotel_name: '' })}
                          className="w-100"
                        >
                          Clear Filters
                        </Button>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Records Table */}
              <Card className="outsourcing-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title className="mb-0">Outsourced Hotel Records</Card.Title>
                  </div>
                  <Button variant="primary" size="sm" onClick={handleAddRecord}>
                    <Plus size={18} className="me-2" />
                    Add Outsource
                  </Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>Booking</th>
                        <th>Hotel Name</th>
                        <th>Room Details</th>
                        <th>Dates</th>
                        <th>Cost (PKR)</th>
                        <th>Profit</th>
                        <th>Loss</th>
                        <th>Agent</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map(record => (
                        <tr key={record.id}>
                          <td>
                            <strong>{record.booking_no || record.booking_number}</strong>
                            <br />
                            <small className="text-muted">{record.passenger_name}</small>
                          </td>

                          <td>
                            <strong>{record.hotel_name}</strong>
                            <br />
                            <small className="text-muted">Rm: {record.room_no}</small>
                          </td>

                          <td>
                            <div>
                              <small>
                                <strong>{record.room_type}</strong>
                                <br />
                                Qty: {record.quantity} | {record.nights} nights
                              </small>
                            </div>
                          </td>

                          <td>
                            <small>
                              {(record.check_in ? new Date(record.check_in).toLocaleDateString() : '')} - {(record.check_out ? new Date(record.check_out).toLocaleDateString() : '')}
                            </small>
                          </td>

                          <td>
                            <strong>{fmtCurrency(record.total_cost)}</strong>
                          </td>

                          <td>
                            <div className={record.profit_loss > 0 ? 'text-success' : 'text-muted'}>
                              {record.profit_loss > 0 ? <strong>{fmtCurrency(record.profit_loss)}</strong> : <small className="text-muted">-</small>}
                            </div>
                          </td>
                          <td>
                            <div className={record.profit_loss < 0 ? 'text-danger' : 'text-muted'}>
                              {record.profit_loss < 0 ? <strong>{fmtCurrency(Math.abs(record.profit_loss))}</strong> : <small className="text-muted">-</small>}
                            </div>
                          </td>

                          <td>
                            <small>{record.agent_name}</small>
                            <br />
                            <small className="text-muted">{record.branch}</small>
                          </td>

                          <td>
                            <Badge bg={getStatusBadge(record.status).bg}>
                              {getStatusBadge(record.status).label}
                            </Badge>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <Button
                                type="button"
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleViewRecord(record)}
                                title="View"
                              >
                                <Eye size={16} />
                              </Button>
                              <Button
                                type="button"
                                variant={record.status === 'paid' ? 'outline-warning' : 'success'}
                                size="sm"
                                onClick={() => handlePaymentClick(record)}
                                title={record.status === 'paid' ? 'Mark Pending' : 'Mark Paid'}
                              >
                                {record.status === 'paid' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                              </Button>
                              <Button
                                type="button"
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteRecord(record.id)}
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

          {/* ==================== PAYMENT TAB ==================== */}
          {activeTab === 'payment' && (
            <>
              {/* Stats */}
              <Row className="mb-4 align-items-stretch">
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={DollarSign} title="Total Cost" value={fmtCurrency(reportData.total_outsourced_amount)} color="warning" />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={CheckCircle} title="Total Paid" value={fmtCurrency(reportData.total_paid)} color="success" />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={AlertCircle} title="Total Pending" value={fmtCurrency(reportData.total_pending)} color="danger" />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={Zap} title="Payment Rate" value={`${((reportData.total_paid / reportData.total_outsourced_amount) * 100).toFixed(1)}%`} color="info" subtitle="Amount paid" />
                </Col>
              </Row>

              {/* Payment Status Overview */}
              <Card className="outsourcing-card">
                <Card.Header>
                  <Card.Title className="mb-0">Payment Status Summary</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} className="mb-4">
                      <h6>Payment Distribution</h6>
                      <div className="status-item mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Paid Hotels</span>
                          <strong>{outsourcingRecords.filter(r => r.status === 'paid').length} records</strong>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div className="progress-bar bg-success" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                      <div className="status-item">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Pending Hotels</span>
                          <strong>{outsourcingRecords.filter(r => r.status === 'pending_payment').length} records</strong>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div className="progress-bar bg-warning" style={{ width: '40%' }}></div>
                        </div>
                      </div>
                    </Col>
                    <Col md={6} className="mb-4">
                      <h6>Financial Overview (PKR)</h6>
                      <div className="status-item mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Total Outsource Cost</span>
                          <strong>{fmtCurrency(reportData.total_outsourced_amount)}</strong>
                        </div>
                      </div>
                      <div className="status-item mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Amount Paid</span>
                          <strong className="text-success">{fmtCurrency(reportData.total_paid)}</strong>
                        </div>
                      </div>
                      <div className="status-item">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Amount Pending</span>
                          <strong className="text-danger">{fmtCurrency(reportData.total_pending)}</strong>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Pending Payables List */}
              <Card className="outsourcing-card mt-4">
                <Card.Header>
                  <Card.Title className="mb-0">Pending Payables (Action Required)</Card.Title>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>Hotel Name</th>
                        <th>Booking</th>
                        <th>Amount (PKR)</th>
                        <th>Branch</th>
                        <th>Created Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outsourcingRecords.filter(r => r.status === 'pending_payment').map(record => (
                        <tr key={record.id}>
                          <td><strong>{record.hotel_name}</strong></td>
                          <td>{record.booking_no}</td>
                          <td><strong className="text-danger">{fmtCurrency(record.total_cost)}</strong></td>
                          <td>{record.branch}</td>
                          <td>{record.created_at}</td>
                          <td>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handlePaymentClick(record)}
                            >
                              Mark as Paid
                            </Button>
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
                    icon={MapPin}
                    title="Total Outsourced"
                    value={reportData.total_outsourced_bookings}
                    color="primary"
                    subtitle="Hotel bookings"
                  />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard
                    icon={DollarSign}
                    title="Total Outsource Cost"
                    value={fmtCurrency(reportData.total_outsourced_amount)}
                    color="warning"
                    subtitle="External spend"
                  />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard
                    icon={TrendingUp}
                    title="Total Profit"
                    value={fmtCurrency(reportData.total_profit)}
                    color="success"
                    subtitle="Combined profit"
                  />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard
                    icon={BarChart3}
                    title="Avg Profit Margin"
                    value={`${reportData.average_profit_margin}%`}
                    color="info"
                    subtitle="Per booking"
                  />
                </Col>
              </Row>

              {/* Detailed Analytics */}
              <Row>
                <Col lg={6} className="mb-4">
                  <Card className="outsourcing-card">
                    <Card.Header>
                      <Card.Title className="mb-0">Outsourcing by Room Type</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      {['Quad', 'Double', 'Triple', 'Twin', 'Sharing'].map(type => {
                        const count = outsourcingRecords.filter(r => r.room_type === type).length;
                        const cost = outsourcingRecords.filter(r => r.room_type === type).reduce((sum, r) => sum + (Number(r.total_cost) || 0), 0);
                        return (
                          <div key={type} className="mb-3">
                            <div className="d-flex justify-content-between mb-2">
                              <span>{type}</span>
                              <small className="text-muted">{count} bookings | SAR {fmtNum(cost)}</small>
                            </div>
                            <div className="progress" style={{ height: '6px' }}>
                              <div 
                                className="progress-bar" 
                                style={{ width: `${(count / outsourcingRecords.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={6} className="mb-4">
                  <Card className="outsourcing-card">
                    <Card.Header>
                      <Card.Title className="mb-0">Outsourcing by Branch</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      {['Karachi', 'Lahore', 'Islamabad'].map(branch => {
                        const count = outsourcingRecords.filter(r => r.branch === branch).length;
                        const cost = outsourcingRecords.filter(r => r.branch === branch).reduce((sum, r) => sum + (Number(r.total_cost) || 0), 0);
                        return (
                          <div key={branch} className="mb-3">
                            <div className="d-flex justify-content-between mb-2">
                              <span>{branch}</span>
                              <small className="text-muted">{count} bookings | SAR {fmtNum(cost)}</small>
                            </div>
                            <div className="progress" style={{ height: '6px' }}>
                              <div 
                                className="progress-bar bg-info" 
                                style={{ width: `${(count / outsourcingRecords.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Profit/Loss Breakdown */}
              <Card className="outsourcing-card">
                <Card.Header>
                  <Card.Title className="mb-0">Profit/Loss Breakdown</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4} className="text-center mb-3">
                      <div className="breakdown-box">
                        <div className="breakdown-value text-primary">{fmtCurrency(reportData.total_booking_sales)}</div>
                        <div className="breakdown-label">Total Booking Sales</div>
                      </div>
                    </Col>
                    <Col md={4} className="text-center mb-3">
                      <div className="breakdown-box">
                        <div className="breakdown-value text-danger">-{fmtCurrency(reportData.total_outsourced_amount)}</div>
                        <div className="breakdown-label">Outsource Cost</div>
                      </div>
                    </Col>
                    <Col md={4} className="text-center mb-3">
                      <div className="breakdown-box">
                        <div className="breakdown-value text-success">={fmtCurrency(reportData.total_profit)}</div>
                        <div className="breakdown-label">Net Profit</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </>
          )}

          {/* ==================== MODALS ==================== */}

          {/* Add Outsource Modal */}
          <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Add Outsourced Hotel</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Booking ID / Booking No * </Form.Label>
                      <Form.Control
                        type="text"
                        value={outForm.booking_id}
                        onChange={(e) => setOutForm({ ...outForm, booking_id: e.target.value })}
                        placeholder="e.g., 101 or BK-20251107-DE0B"
                      />
                      <Form.Text className="text-muted">You can paste Booking ID (numeric) or Booking Number (e.g. BK-20251107-DE0B)</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hotel Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={outForm.hotel_name}
                        onChange={(e) => setOutForm({ ...outForm, hotel_name: e.target.value })}
                        placeholder="e.g., Swissotel Al Maqam"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Room Type *</Form.Label>
                      <Form.Select
                        value={outForm.room_type}
                        onChange={(e) => setOutForm({ ...outForm, room_type: e.target.value })}
                      >
                        <option value="Quad">Quad</option>
                        <option value="Double">Double</option>
                        <option value="Triple">Triple</option>
                        <option value="Twin">Twin</option>
                        <option value="Sharing">Sharing</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Room No</Form.Label>
                      <Form.Control
                        type="text"
                        value={outForm.room_no}
                        onChange={(e) => setOutForm({ ...outForm, room_no: e.target.value })}
                        placeholder="e.g., 302"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Qty</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={outForm.quantity}
                        onChange={(e) => setOutForm({ ...outForm, quantity: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Booking Sale Price (PKR) *</Form.Label>
                      <Form.Control
                        type="number"
                        value={outForm.booking_sale_price}
                        onChange={(e) => setOutForm({ ...outForm, booking_sale_price: e.target.value })}
                        placeholder="e.g., 35000"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Purchase Price (per night, PKR) *</Form.Label>
                      <Form.Control
                        type="number"
                        value={outForm.purchase_price}
                        onChange={(e) => setOutForm({ ...outForm, purchase_price: e.target.value })}
                        placeholder="e.g., 450"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>&nbsp;</Form.Label>
                      <div className="d-flex gap-3 align-items-center">
                        <Form.Check
                          type="checkbox"
                          label="Include Breakfast"
                          checked={outForm.include_breakfast || false}
                          onChange={(e) => setOutForm({ ...outForm, include_breakfast: e.target.checked })}
                        />
                        <Form.Check
                          type="checkbox"
                          label="Allow Reselling"
                          checked={outForm.reselling_allowed === true || outForm.reselling_allowed === "true" || outForm.reselling_allowed === 1 || outForm.reselling_allowed === "1"}
                          onChange={(e) => setOutForm({ ...outForm, reselling_allowed: e.target.checked })}
                        />
                        <Form.Check
                          type="checkbox"
                          label="Flexible Dates"
                          checked={outForm.flexible_dates || false}
                          onChange={(e) => setOutForm({ ...outForm, flexible_dates: e.target.checked })}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Check-In *</Form.Label>
                      <Form.Control
                        type="date"
                        value={outForm.check_in}
                        onChange={(e) => setOutForm({ ...outForm, check_in: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Check-Out *</Form.Label>
                      <Form.Control
                        type="date"
                        value={outForm.check_out}
                        onChange={(e) => setOutForm({ ...outForm, check_out: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={outForm.remarks}
                    onChange={(e) => setOutForm({ ...outForm, remarks: e.target.value })}
                    placeholder="e.g., Booked directly from outside source"
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveRecord}>
                Create Record (Auto-Ledger Entry)
              </Button>
            </Modal.Footer>
          </Modal>

          {/* View Record Modal */}
          <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Outsourced Hotel Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedRecord && (
                <div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <h6 className="mb-2 text-muted">Booking Information</h6>
                      <p className="mb-1"><strong>Booking No:</strong> {selectedRecord.booking_no}</p>
                      <p className="mb-1"><strong>Passenger:</strong> {selectedRecord.passenger_name}</p>
                      <p className="mb-1"><strong>Agent:</strong> {selectedRecord.agent_name}</p>
                    </div>
                    <div className="col-6">
                      <h6 className="mb-2 text-muted">Hotel Information</h6>
                      <p className="mb-1"><strong>Hotel Name:</strong> {selectedRecord.hotel_name}</p>
                      <p className="mb-1"><strong>Room Type:</strong> {selectedRecord.room_type} (#{selectedRecord.room_no})</p>
                      <p className="mb-1"><strong>Quantity:</strong> {selectedRecord.quantity} | <strong>Nights:</strong> {selectedRecord.nights}</p>
                    </div>
                  </div>
                  <hr />
                  <div className="row mb-3">
                    <div className="col-6">
                      <h6 className="mb-2 text-muted">Financial Details</h6>
                      <p className="mb-1"><strong>Price per Night:</strong> {fmtCurrency(selectedRecord.purchase_price ?? selectedRecord.room_price ?? 0)}</p>
                      <p className="mb-1"><strong>Total Cost:</strong> {fmtCurrency(selectedRecord.total_cost)}</p>
                      <p className="mb-1"><strong>Booking Sales:</strong> {fmtCurrency(selectedRecord.booking_sale_price)}</p>
                    </div>
                    <div className="col-6">
                      <h6 className="mb-2 text-muted">Profit/Loss Analysis</h6>
                      <p className="mb-1"><strong>Profit/Loss:</strong> <span className={selectedRecord.profit_loss > 0 ? 'text-success' : 'text-danger'}>{fmtCurrency(selectedRecord.profit_loss)}</span></p>
                      <p className="mb-1"><strong>Status:</strong> <Badge bg={getStatusBadge(selectedRecord.status).bg}>{getStatusBadge(selectedRecord.status).label}</Badge></p>
                      <p className="mb-1"><strong>Ledger:</strong> Linked ✓</p>
                    </div>
                  </div>
                  <hr />
                  <p className="mb-1"><strong>Check-In:</strong> {selectedRecord.check_in}</p>
                  <p className="mb-1"><strong>Check-Out:</strong> {selectedRecord.check_out}</p>
                  <p className="mb-1"><strong>Remarks:</strong> {selectedRecord.remarks}</p>
                </div>
              )}
            </Modal.Body>
          </Modal>

          {/* Payment Status Modal */}
          <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Update Payment Status</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedRecord && (
                <>
                  <div className="mb-4">
                    <h6 className="mb-2">Record Details</h6>
                    <div className="bg-light p-3 rounded">
                      <p className="mb-1"><strong>Hotel:</strong> {selectedRecord.hotel_name}</p>
                      <p className="mb-1"><strong>Amount:</strong> {fmtCurrency(selectedRecord.total_cost)}</p>
                      <p className="mb-0"><strong>Current Status:</strong> <Badge bg={getStatusBadge(selectedRecord.status).bg}>{getStatusBadge(selectedRecord.status).label}</Badge></p>
                    </div>
                  </div>

                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>New Status *</Form.Label>
                      <Form.Select
                        value={paymentForm.status}
                        onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                      >
                        <option value="paid">Mark as Paid</option>
                        <option value="pending_payment">Mark as Pending</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Payment Reference</Form.Label>
                      <Form.Control
                        type="text"
                        value={paymentForm.payment_reference}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                        placeholder="e.g., TXN-12345, CHQ-789"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Payment Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                      />
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Remarks</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={paymentForm.remarks}
                        onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                        placeholder="Optional remarks"
                      />
                    </Form.Group>
                  </Form>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button 
                variant={paymentForm.status === 'paid' ? 'success' : 'warning'} 
                onClick={handleSavePayment}
              >
                Update Status (Auto-Ledger Update)
              </Button>
            </Modal.Footer>
          </Modal>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default HotelOutsourcing;
