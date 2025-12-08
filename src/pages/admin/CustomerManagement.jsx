import React, { useState } from 'react';
import { Modal, Button, Form, Table, Badge, InputGroup, Row, Col, Card } from 'react-bootstrap';
import { User, Users, Database, GitBranch, BookOpen, Phone, Mail, MapPin, Search, Download, Plus, Edit, Trash2, Eye, FileText, Upload } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import CRMTabs from '../../components/CRMTabs';
import LeadManagement from './LeadManagement';

const CustomerManagement = () => {
  // State management
  const [crmActive, setCrmActive] = useState('Customers');
  const [activeMainTab, setActiveMainTab] = useState('walk-in');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
    source: 'Walk-in'
  });

  // Walk-in customers data
  const [customers, setCustomers] = useState([
    {
      id: 'CUST-001',
      name: 'Ahmed Hassan',
      phone: '+92-300-1234567',
      email: 'ahmed@email.com',
      address: 'Model Town, Lahore',
      city: 'Lahore',
      status: 'active',
      totalSpent: 150000,
      lastVisit: '2025-01-15',
      notes: 'Regular customer for Umrah packages',
      source: 'Walk-in'
    },
    {
      id: 'CUST-002',
      name: 'Fatima Khan',
      phone: '+92-321-7654321',
      email: 'fatima@email.com',
      address: 'Defence, Karachi',
      city: 'Karachi',
      status: 'inactive',
      totalSpent: 75000,
      lastVisit: '2024-12-20',
      notes: 'Interested in Hajj packages',
      source: 'Walk-in'
    }
  ]);

  // Auto-collected customers data (from APIs)
  const [allCustomers, setAllCustomers] = useState([
    {
      id: 'AUTO-001',
      name: 'Muhammad Ali',
      phone: '+92-333-1111111',
      email: 'ali@example.com',
      source: 'Booking',
      collectedAt: '2025-01-10 14:30',
      status: 'verified',
      bookingRef: 'BKG-2024-001'
    },
    {
      id: 'AUTO-002',
      name: 'Sara Ahmed',
      phone: '+92-345-2222222',
      email: 'sara@example.com',
      source: 'Passport Lead',
      collectedAt: '2025-01-09 09:15',
      status: 'pending',
      leadRef: 'LEAD-2024-045'
    }
  ]);

  // Bookings data for splitting
  const [bookings, setBookings] = useState([
    {
      booking_id: 'BKG-1023',
      customer_name: 'Ali Raza',
      total_pax: 5,
      total_amount: 500000,
      booking_date: '2025-10-15',
      travel_date: '2025-12-10',
      package_type: 'Umrah Premium',
      status: 'confirmed',
      pax_details: [
        { id: 'PAX-1', name: 'Ali Raza', age: 35, relation: 'Self' },
        { id: 'PAX-2', name: 'Fatima Raza', age: 32, relation: 'Wife' },
        { id: 'PAX-3', name: 'Ahmed Raza', age: 10, relation: 'Son' },
        { id: 'PAX-4', name: 'Sara Raza', age: 8, relation: 'Daughter' },
        { id: 'PAX-5', name: 'Hassan Ali', age: 65, relation: 'Father' }
      ]
    },
    {
      booking_id: 'BKG-1024',
      customer_name: 'Hassan Malik',
      total_pax: 3,
      total_amount: 350000,
      booking_date: '2025-09-25',
      travel_date: '2025-11-20',
      package_type: 'Umrah Economy',
      status: 'confirmed',
      pax_details: [
        { id: 'PAX-6', name: 'Hassan Malik', age: 40, relation: 'Self' },
        { id: 'PAX-7', name: 'Zainab Malik', age: 38, relation: 'Wife' },
        { id: 'PAX-8', name: 'Usman Malik', age: 12, relation: 'Son' }
      ]
    }
  ]);

  // Statistics
  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === 'active').length,
    inactiveCustomers: customers.filter(c => c.status === 'inactive').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0)
  };

  const dbStats = {
    totalCustomers: allCustomers.length,
    fromBookings: allCustomers.filter(c => c.source === 'Booking').length,
    fromLeads: allCustomers.filter(c => c.source === 'Passport Lead').length,
    fromBranch: allCustomers.filter(c => c.source === 'Area Branch').length,
    fromWalkIn: allCustomers.filter(c => c.source === 'Walk-in').length
  };

  const bookingStats = {
    totalBookings: bookings.length,
    totalPax: bookings.reduce((sum, b) => sum + b.total_pax, 0),
    totalRevenue: bookings.reduce((sum, b) => sum + b.total_amount, 0),
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length
  };

  // Filter functions
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeSubTab === 'all') return matchesSearch;
    if (activeSubTab === 'active') return matchesSearch && customer.status === 'active';
    if (activeSubTab === 'inactive') return matchesSearch && customer.status === 'inactive';
    return matchesSearch;
  });

  const filteredAllCustomers = allCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeSubTab === 'all') return matchesSearch;
    if (activeSubTab === 'booking') return matchesSearch && customer.source === 'Booking';
    if (activeSubTab === 'leads') return matchesSearch && customer.source === 'Passport Lead';
    if (activeSubTab === 'branch') return matchesSearch && customer.source === 'Area Branch';
    return matchesSearch;
  });

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.booking_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeSubTab === 'all') return matchesSearch;
    if (activeSubTab === 'confirmed') return matchesSearch && booking.status === 'confirmed';
    if (activeSubTab === 'pending') return matchesSearch && booking.status === 'pending';
    return matchesSearch;
  });

  // Event handlers
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      notes: '',
      source: 'Walk-in'
    });
  };

  const handleSplitClick = (booking) => {
    setSelectedBooking(booking);
    setShowSplitModal(true);
  };

  const handleSplitBooking = () => {
    // Handle booking split logic here
    console.log('Splitting booking:', selectedBooking);
    setShowSplitModal(false);
    setSelectedBooking(null);
  };

  // Table styles
  const tableStyles = `
    .customer-management-table th,
    .customer-management-table td {
      white-space: nowrap;
      vertical-align: middle;
    }
    
    .customer-management-table th:first-child,
    .customer-management-table td:first-child {
      position: sticky;
      left: 0;
      background-color: white;
      z-index: 1;
    }
    
    .customer-management-table thead th:first-child {
      z-index: 2;
    }
    
    .customer-management-table th {
      background: #1B78CE !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 12px !important;
      border: none !important;
      font-size: 0.9rem !important;
    }
    
    .customer-management-table td {
      padding: 12px !important;
      border-bottom: 1px solid #dee2e6 !important;
      font-size: 0.85rem !important;
    }
    
    .customer-management-table tbody tr:hover {
      background-color: #f8fafc !important;
    }
    
    .customer-management-table tbody tr:hover td:first-child {
      background-color: #f8fafc !important;
    }
  `;

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: tableStyles }} />
      
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container-fluid">
            <Header />

            <div className="px-3 px-lg-4 my-3">
              <CRMTabs activeName={crmActive} onSelect={(name) => setCrmActive(name)} />
              {crmActive === 'Follow Ups' && (
                <div className="mb-4">
                  <LeadManagement embedded={true} />
                </div>
              )}
              <div style={{ display: crmActive === 'Follow Ups' ? 'none' : 'block' }}>
              {/* Page Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <h4 className="mb-1" style={{ color: '#1B78CE', fontWeight: '600' }}>
                    Customer Management
                  </h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    Manage walk-in customers, customer database, and booking splits
                  </p>
                </div>
              </div>

              {/* Main Navigation Tabs */}
              <div className="row mb-4">
                <div className="col-12">
                  <nav>
                    <div className="nav d-flex flex-wrap gap-2">
                      <button
                        className={`nav-link btn btn-link ${activeMainTab === 'walk-in' ? 'fw-bold' : ''}`}
                        onClick={() => { setActiveMainTab('walk-in'); setSearchTerm(''); setActiveSubTab('all'); }}
                        style={{
                          color: activeMainTab === 'walk-in' ? '#1B78CE' : '#6c757d',
                          textDecoration: 'none',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          background: 'transparent',
                          fontFamily: 'Poppins, sans-serif',
                          borderBottom: activeMainTab === 'walk-in' ? '2px solid #1B78CE' : '2px solid transparent'
                        }}
                      >
                        <User size={16} className="me-2" />
                        Walk-in Customers
                      </button>
                      <button
                        className={`nav-link btn btn-link ${activeMainTab === 'database' ? 'fw-bold' : ''}`}
                        onClick={() => { setActiveMainTab('database'); setSearchTerm(''); setActiveSubTab('all'); }}
                        style={{
                          color: activeMainTab === 'database' ? '#1B78CE' : '#6c757d',
                          textDecoration: 'none',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          background: 'transparent',
                          fontFamily: 'Poppins, sans-serif',
                          borderBottom: activeMainTab === 'database' ? '2px solid #1B78CE' : '2px solid transparent'
                        }}
                      >
                        <Database size={16} className="me-2" />
                        Customer Database
                      </button>
                      <button
                        className={`nav-link btn btn-link ${activeMainTab === 'booking-split' ? 'fw-bold' : ''}`}
                        onClick={() => { setActiveMainTab('booking-split'); setSearchTerm(''); setActiveSubTab('all'); }}
                        style={{
                          color: activeMainTab === 'booking-split' ? '#1B78CE' : '#6c757d',
                          textDecoration: 'none',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          background: 'transparent',
                          fontFamily: 'Poppins, sans-serif',
                          borderBottom: activeMainTab === 'booking-split' ? '2px solid #1B78CE' : '2px solid transparent'
                        }}
                      >
                        <GitBranch size={16} className="me-2" />
                        Booking Split
                      </button>
                    </div>
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              {activeMainTab === 'walk-in' && (
                <div>
                  {/* Statistics Cards */}
                  <div className="row mb-4">
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #1B78CE' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Total Customers</h6>
                              <h4 className="mb-0" style={{ color: '#1B78CE' }}>{stats.totalCustomers}</h4>
                            </div>
                            <Users size={32} style={{ color: '#1B78CE', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #28a745' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Active Customers</h6>
                              <h4 className="mb-0" style={{ color: '#28a745' }}>{stats.activeCustomers}</h4>
                            </div>
                            <User size={32} style={{ color: '#28a745', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #ffc107' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Inactive Customers</h6>
                              <h4 className="mb-0" style={{ color: '#ffc107' }}>{stats.inactiveCustomers}</h4>
                            </div>
                            <User size={32} style={{ color: '#ffc107', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #17a2b8' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Total Revenue</h6>
                              <h4 className="mb-0" style={{ color: '#17a2b8' }}>PKR {stats.totalRevenue.toLocaleString()}</h4>
                            </div>
                            <BookOpen size={32} style={{ color: '#17a2b8', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>

                  {/* Filter Section */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        {/* Sub-navigation */}
                        <nav>
                          <div className="nav d-flex flex-wrap gap-2">
                            {['all', 'active', 'inactive'].map((tab) => (
                              <button
                                key={tab}
                                className={`nav-link btn btn-link ${activeSubTab === tab ? 'fw-bold' : ''}`}
                                onClick={() => setActiveSubTab(tab)}
                                style={{
                                  color: activeSubTab === tab ? '#1B78CE' : '#6c757d',
                                  textDecoration: 'none',
                                  padding: '0.375rem 0.75rem',
                                  border: 'none',
                                  background: 'transparent',
                                  fontSize: '0.875rem',
                                  borderBottom: activeSubTab === tab ? '2px solid #1B78CE' : '2px solid transparent'
                                }}
                              >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                              </button>
                            ))}
                          </div>
                        </nav>

                        {/* Action buttons */}
                        <div className="d-flex flex-wrap gap-2">
                          <InputGroup style={{ maxWidth: '250px' }}>
                            <InputGroup.Text style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                              <Search size={16} />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="Search customers..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ border: '1px solid #dee2e6' }}
                            />
                          </InputGroup>
                          <Button
                            variant="outline-primary"
                            onClick={() => {}}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            <Download size={16} className="me-1" />
                            Export
                          </Button>
                          <Button
                            style={{ backgroundColor: '#1B78CE', border: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => setShowAddModal(true)}
                          >
                            <Plus size={16} className="me-1" />
                            Add Customer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="row">
                    <div className="col-12">
                      <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <Table className="customer-management-table mb-0" style={{ minWidth: '800px' }}>
                          <thead>
                            <tr>
                              <th>Customer ID</th>
                              <th>Name</th>
                              <th>Phone</th>
                              <th>Email</th>
                              <th>City</th>
                              <th>Status</th>
                              <th>Total Spent</th>
                              <th>Last Visit</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCustomers.length === 0 ? (
                              <tr>
                                <td colSpan="9" className="text-center py-4">
                                  <div className="text-muted">
                                    <User size={48} className="mb-2" style={{ opacity: 0.5 }} />
                                    <p className="mb-0">No customers found</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredCustomers.map((customer) => (
                                <tr key={customer.id}>
                                  <td>{customer.id}</td>
                                  <td style={{ fontWeight: '500' }}>{customer.name}</td>
                                  <td>{customer.phone}</td>
                                  <td>{customer.email}</td>
                                  <td>{customer.city}</td>
                                  <td>
                                    <Badge bg={customer.status === 'active' ? 'success' : 'warning'}>
                                      {customer.status}
                                    </Badge>
                                  </td>
                                  <td style={{ fontWeight: '500' }}>PKR {customer.totalSpent.toLocaleString()}</td>
                                  <td>{customer.lastVisit}</td>
                                  <td>
                                    <div className="d-flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline-info"
                                        onClick={() => { setSelectedCustomer(customer); setShowViewModal(true); }}
                                      >
                                        <Eye size={14} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline-primary"
                                        onClick={() => { setSelectedCustomer(customer); setFormData(customer); setShowEditModal(true); }}
                                      >
                                        <Edit size={14} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() => { setSelectedCustomer(customer); setShowDeleteModal(true); }}
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeMainTab === 'database' && (
                <div>
                  {/* Customer Database Tab Content - Auto-collection functionality */}
                  <div className="alert alert-info mb-4">
                    <div className="d-flex align-items-center">
                      <Database size={20} className="me-2" />
                      <strong>Customer Database</strong> - Auto-collection from booking APIs, passport leads, and area branches
                    </div>
                  </div>

                  {/* Statistics for Database */}
                  <div className="row mb-4">
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #1B78CE' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Total Collected</h6>
                              <h4 className="mb-0" style={{ color: '#1B78CE' }}>{dbStats.totalCustomers}</h4>
                            </div>
                            <Database size={32} style={{ color: '#1B78CE', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #28a745' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">From Bookings</h6>
                              <h4 className="mb-0" style={{ color: '#28a745' }}>{dbStats.fromBookings}</h4>
                            </div>
                            <BookOpen size={32} style={{ color: '#28a745', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #ffc107' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">From Leads</h6>
                              <h4 className="mb-0" style={{ color: '#ffc107' }}>{dbStats.fromLeads}</h4>
                            </div>
                            <FileText size={32} style={{ color: '#ffc107', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #17a2b8' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">From Branches</h6>
                              <h4 className="mb-0" style={{ color: '#17a2b8' }}>{dbStats.fromBranch}</h4>
                            </div>
                            <MapPin size={32} style={{ color: '#17a2b8', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>

                  {/* Database actions and filters */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <nav>
                          <div className="nav d-flex flex-wrap gap-2">
                            {['all', 'booking', 'leads', 'branch'].map((tab) => (
                              <button
                                key={tab}
                                className={`nav-link btn btn-link ${activeSubTab === tab ? 'fw-bold' : ''}`}
                                onClick={() => setActiveSubTab(tab)}
                                style={{
                                  color: activeSubTab === tab ? '#1B78CE' : '#6c757d',
                                  textDecoration: 'none',
                                  padding: '0.375rem 0.75rem',
                                  border: 'none',
                                  background: 'transparent',
                                  fontSize: '0.875rem',
                                  borderBottom: activeSubTab === tab ? '2px solid #1B78CE' : '2px solid transparent'
                                }}
                              >
                                {tab === 'all' ? 'All Sources' : 
                                 tab === 'booking' ? 'From Bookings' :
                                 tab === 'leads' ? 'From Leads' : 'From Branches'}
                              </button>
                            ))}
                          </div>
                        </nav>

                        <div className="d-flex flex-wrap gap-2">
                          <InputGroup style={{ maxWidth: '250px' }}>
                            <InputGroup.Text style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                              <Search size={16} />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="Search database..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ border: '1px solid #dee2e6' }}
                            />
                          </InputGroup>
                          <Button
                            style={{ backgroundColor: '#28a745', border: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => {}}
                          >
                            <Upload size={16} className="me-1" />
                            Sync Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Database table placeholder */}
                  <div className="row">
                    <div className="col-12">
                      <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <Table className="customer-management-table mb-0" style={{ minWidth: '800px' }}>
                          <thead>
                            <tr>
                              <th>Customer ID</th>
                              <th>Name</th>
                              <th>Phone</th>
                              <th>Email</th>
                              <th>Source</th>
                              <th>Collected At</th>
                              <th>Status</th>
                              <th>Reference</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAllCustomers.length === 0 ? (
                              <tr>
                                <td colSpan="9" className="text-center py-4">
                                  <div className="text-muted">
                                    <Database size={48} className="mb-2" style={{ opacity: 0.5 }} />
                                    <p className="mb-0">No auto-collected customers found</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredAllCustomers.map((customer) => (
                                <tr key={customer.id}>
                                  <td>{customer.id}</td>
                                  <td style={{ fontWeight: '500' }}>{customer.name}</td>
                                  <td>{customer.phone}</td>
                                  <td>{customer.email}</td>
                                  <td>
                                    <Badge bg={
                                      customer.source === 'Booking' ? 'primary' :
                                      customer.source === 'Passport Lead' ? 'warning' : 'info'
                                    }>
                                      {customer.source}
                                    </Badge>
                                  </td>
                                  <td>{customer.collectedAt}</td>
                                  <td>
                                    <Badge bg={customer.status === 'verified' ? 'success' : 'secondary'}>
                                      {customer.status}
                                    </Badge>
                                  </td>
                                  <td>{customer.bookingRef || customer.leadRef || '-'}</td>
                                  <td>
                                    <div className="d-flex gap-1">
                                      <Button size="sm" variant="outline-info">
                                        <Eye size={14} />
                                      </Button>
                                      <Button size="sm" variant="outline-success">
                                        <Plus size={14} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeMainTab === 'booking-split' && (
                <div>
                  {/* Booking Split Tab Content */}
                  <div className="alert alert-warning mb-4">
                    <div className="d-flex align-items-center">
                      <GitBranch size={20} className="me-2" />
                      <strong>Booking Split</strong> - Split bookings functionality for managing passenger allocations
                    </div>
                  </div>

                  {/* Statistics for Booking Split */}
                  <div className="row mb-4">
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #6f42c1' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Total Bookings</h6>
                              <h4 className="mb-0" style={{ color: '#6f42c1' }}>{bookingStats.totalBookings}</h4>
                            </div>
                            <BookOpen size={32} style={{ color: '#6f42c1', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #28a745' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Total Passengers</h6>
                              <h4 className="mb-0" style={{ color: '#28a745' }}>{bookingStats.totalPax}</h4>
                            </div>
                            <Users size={32} style={{ color: '#28a745', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #17a2b8' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Total Revenue</h6>
                              <h4 className="mb-0" style={{ color: '#17a2b8' }}>PKR {bookingStats.totalRevenue.toLocaleString()}</h4>
                            </div>
                            <BookOpen size={32} style={{ color: '#17a2b8', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mb-3">
                      <Card style={{ borderLeft: '4px solid #ffc107' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Confirmed</h6>
                              <h4 className="mb-0" style={{ color: '#ffc107' }}>{bookingStats.confirmedBookings}</h4>
                            </div>
                            <GitBranch size={32} style={{ color: '#ffc107', opacity: 0.7 }} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>

                  {/* Booking filters */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <nav>
                          <div className="nav d-flex flex-wrap gap-2">
                            {['all', 'confirmed', 'pending'].map((tab) => (
                              <button
                                key={tab}
                                className={`nav-link btn btn-link ${activeSubTab === tab ? 'fw-bold' : ''}`}
                                onClick={() => setActiveSubTab(tab)}
                                style={{
                                  color: activeSubTab === tab ? '#1B78CE' : '#6c757d',
                                  textDecoration: 'none',
                                  padding: '0.375rem 0.75rem',
                                  border: 'none',
                                  background: 'transparent',
                                  fontSize: '0.875rem',
                                  borderBottom: activeSubTab === tab ? '2px solid #1B78CE' : '2px solid transparent'
                                }}
                              >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                              </button>
                            ))}
                          </div>
                        </nav>

                        <div className="d-flex flex-wrap gap-2">
                          <InputGroup style={{ maxWidth: '250px' }}>
                            <InputGroup.Text style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                              <Search size={16} />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="Search bookings..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ border: '1px solid #dee2e6' }}
                            />
                          </InputGroup>
                          <Button variant="outline-primary" style={{ whiteSpace: 'nowrap' }}>
                            <Download size={16} className="me-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bookings table */}
                  <div className="row">
                    <div className="col-12">
                      <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <Table className="customer-management-table mb-0" style={{ minWidth: '900px' }}>
                          <thead>
                            <tr>
                              <th>Booking ID</th>
                              <th>Customer Name</th>
                              <th>Total PAX</th>
                              <th>Total Amount</th>
                              <th>Booking Date</th>
                              <th>Travel Date</th>
                              <th>Package Type</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredBookings.length === 0 ? (
                              <tr>
                                <td colSpan="9" className="text-center py-4">
                                  <div className="text-muted">
                                    <GitBranch size={48} className="mb-2" style={{ opacity: 0.5 }} />
                                    <p className="mb-0">No bookings found</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredBookings.map((booking) => (
                                <tr key={booking.booking_id}>
                                  <td style={{ fontWeight: '500' }}>{booking.booking_id}</td>
                                  <td>{booking.customer_name}</td>
                                  <td>
                                    <Badge bg="info">{booking.total_pax} PAX</Badge>
                                  </td>
                                  <td style={{ fontWeight: '500' }}>PKR {booking.total_amount.toLocaleString()}</td>
                                  <td>{booking.booking_date}</td>
                                  <td>{booking.travel_date}</td>
                                  <td>
                                    <Badge bg={booking.package_type.includes('Premium') ? 'warning' : 'secondary'}>
                                      {booking.package_type}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge bg={booking.status === 'confirmed' ? 'success' : 'warning'}>
                                      {booking.status}
                                    </Badge>
                                  </td>
                                  <td>
                                    <div className="d-flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline-info"
                                        onClick={() => {}}
                                      >
                                        <Eye size={14} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        style={{ backgroundColor: '#6f42c1', border: 'none' }}
                                        onClick={() => handleSplitClick(booking)}
                                      >
                                        <GitBranch size={14} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Booking Split Modal */}
      <Modal show={showSplitModal} onHide={() => { setShowSplitModal(false); setSelectedBooking(null); }} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#6f42c1', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Split Booking - {selectedBooking?.booking_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Customer:</strong> {selectedBooking.customer_name}
                </div>
                <div className="col-md-6">
                  <strong>Total PAX:</strong> {selectedBooking.total_pax}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Total Amount:</strong> PKR {selectedBooking.total_amount.toLocaleString()}
                </div>
                <div className="col-md-6">
                  <strong>Package:</strong> {selectedBooking.package_type}
                </div>
              </div>
              
              <h6 className="mt-4 mb-3">Passenger Details:</h6>
              <Table size="sm" bordered>
                <thead>
                  <tr>
                    <th>PAX ID</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Relation</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBooking.pax_details.map((pax) => (
                    <tr key={pax.id}>
                      <td>{pax.id}</td>
                      <td>{pax.name}</td>
                      <td>{pax.age}</td>
                      <td>{pax.relation}</td>
                      <td>
                        <Form.Check type="checkbox" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="alert alert-info mt-3">
                <small>Select passengers to move to a new booking. This will create a separate booking for selected passengers.</small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowSplitModal(false); setSelectedBooking(null); }}>
            Cancel
          </Button>
          <Button style={{ backgroundColor: '#6f42c1', border: 'none' }} onClick={handleSplitBooking}>
            <GitBranch size={16} className="me-1" />
            Split Booking
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Customer Modal */}
      <Modal show={showAddModal} onHide={() => { setShowAddModal(false); resetForm(); }} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#1B78CE', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Add New Walk-in Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92-300-1234567"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="customer@email.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City *</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter complete address"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about the customer"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
            Cancel
          </Button>
          <Button style={{ backgroundColor: '#1B78CE', border: 'none' }}>
            <Plus size={16} className="me-1" />
            Add Customer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setSelectedCustomer(null); resetForm(); }} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#ffc107', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Edit Customer - {selectedCustomer?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92-300-1234567"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="customer@email.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City *</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter complete address"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about the customer"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedCustomer(null); resetForm(); }}>
            Cancel
          </Button>
          <Button style={{ backgroundColor: '#ffc107', border: 'none' }}>
            <Edit size={16} className="me-1" />
            Update Customer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Customer Modal */}
      <Modal show={showViewModal} onHide={() => { setShowViewModal(false); setSelectedCustomer(null); }} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#17a2b8', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Customer Details - {selectedCustomer?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCustomer && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Customer ID:</strong> {selectedCustomer.id}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong>{' '}
                  <Badge bg={selectedCustomer.status === 'active' ? 'success' : 'warning'}>
                    {selectedCustomer.status}
                  </Badge>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Name:</strong> {selectedCustomer.name}
                </Col>
                <Col md={6}>
                  <strong>Phone:</strong> {selectedCustomer.phone}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Email:</strong> {selectedCustomer.email}
                </Col>
                <Col md={6}>
                  <strong>City:</strong> {selectedCustomer.city}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Address:</strong> {selectedCustomer.address}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Total Spent:</strong> PKR {selectedCustomer.totalSpent.toLocaleString()}
                </Col>
                <Col md={6}>
                  <strong>Last Visit:</strong> {selectedCustomer.lastVisit}
                </Col>
              </Row>
              {selectedCustomer.notes && (
                <Row className="mb-3">
                  <Col md={12}>
                    <strong>Notes:</strong>
                    <div className="mt-1 p-2 bg-light rounded">{selectedCustomer.notes}</div>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowViewModal(false); setSelectedCustomer(null); }}>
            Close
          </Button>
          <Button
            style={{ backgroundColor: '#ffc107', border: 'none' }}
            onClick={() => {
              setFormData(selectedCustomer);
              setShowViewModal(false);
              setShowEditModal(true);
            }}
          >
            <Edit size={16} className="me-1" />
            Edit Customer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setSelectedCustomer(null); }}>
        <Modal.Header closeButton style={{ backgroundColor: '#dc3545', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Trash2 size={48} className="text-danger mb-3" />
            <h5>Are you sure you want to delete this customer?</h5>
            <p className="text-muted">
              Customer: <strong>{selectedCustomer?.name}</strong><br />
              This action cannot be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setSelectedCustomer(null); }}>
            Cancel
          </Button>
          <Button variant="danger">
            <Trash2 size={16} className="me-1" />
            Delete Customer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CustomerManagement;