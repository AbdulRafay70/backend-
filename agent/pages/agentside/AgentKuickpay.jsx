import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Badge, Modal, Spinner, Alert, InputGroup, Nav } from "react-bootstrap";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import axios from "axios";
import {
  CreditCard,
  FileText,
  Search,
  Eye,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  Send,
  Info,
} from "lucide-react";

const AgentKuickpay = () => {
  // State Management
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [activeTab, setActiveTab] = useState("payment");

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    booking_id: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    amount: "",
    description: "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // Inquiry Form State
  const [inquiryForm, setInquiryForm] = useState({
    transaction_id: "",
  });
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState(null);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Demo Data
  useEffect(() => {
    setTransactions([
      {
        id: 1,
        transaction_id: "KP-2024-0001",
        booking_id: "BKG-1001",
        customer_name: "Ahmed Hassan",
        amount: 50000,
        currency: "PKR",
        status: "success",
        payment_method: "credit_card",
        created_at: "2024-11-01T10:30:00Z",
        updated_at: "2024-11-01T10:30:45Z",
        reference: "REF-001",
        card_last4: "4242",
        card_brand: "Visa",
      },
      {
        id: 2,
        transaction_id: "KP-2024-0002",
        booking_id: "BKG-1002",
        customer_name: "Fatima Khan",
        amount: 75000,
        currency: "PKR",
        status: "pending",
        payment_method: "bank_transfer",
        created_at: "2024-11-01T11:15:00Z",
        updated_at: "2024-11-01T11:15:00Z",
        reference: "REF-002",
        bank_name: "HBL",
      },
      {
        id: 3,
        transaction_id: "KP-2024-0003",
        booking_id: "BKG-1003",
        customer_name: "Muhammad Bilal",
        amount: 120000,
        currency: "PKR",
        status: "success",
        payment_method: "debit_card",
        created_at: "2024-10-31T14:20:00Z",
        updated_at: "2024-10-31T14:20:30Z",
        reference: "REF-003",
        card_last4: "5555",
        card_brand: "Mastercard",
      },
      {
        id: 4,
        transaction_id: "KP-2024-0004",
        booking_id: "BKG-1004",
        customer_name: "Ayesha Malik",
        amount: 95000,
        currency: "PKR",
        status: "failed",
        payment_method: "credit_card",
        created_at: "2024-10-31T09:45:00Z",
        updated_at: "2024-10-31T09:45:15Z",
        reference: "REF-004",
        card_last4: "1234",
        card_brand: "Visa",
        failure_reason: "Insufficient funds",
      },
      {
        id: 5,
        transaction_id: "KP-2024-0005",
        booking_id: "BKG-1005",
        customer_name: "Usman Ali",
        amount: 60000,
        currency: "PKR",
        status: "success",
        payment_method: "credit_card",
        created_at: "2024-10-30T16:30:00Z",
        updated_at: "2024-10-30T16:30:25Z",
        reference: "REF-005",
        card_last4: "9876",
        card_brand: "Visa",
      },
      {
        id: 6,
        transaction_id: "KP-2024-0006",
        booking_id: "BKG-1006",
        customer_name: "Sara Ahmed",
        amount: 85000,
        currency: "PKR",
        status: "refunded",
        payment_method: "debit_card",
        created_at: "2024-10-29T13:10:00Z",
        updated_at: "2024-10-30T10:00:00Z",
        reference: "REF-006",
        card_last4: "3456",
        card_brand: "Mastercard",
        refund_reason: "Booking cancelled by customer",
      },
    ]);
  }, []);

  // API Functions
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setPaymentResult(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/kuickpay/payment/",
        {
          ...paymentForm,
          amount: parseFloat(paymentForm.amount),
          return_url: `${window.location.origin}/kuickpay`,
          cancel_url: `${window.location.origin}/kuickpay`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setPaymentResult({
        success: true,
        data: response.data,
      });

      showAlert("success", "Payment initiated successfully!");

      // If there's a payment URL, redirect
      if (response.data.payment_url) {
        setTimeout(() => {
          window.open(response.data.payment_url, "_blank");
        }, 1500);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentResult({
        success: false,
        error: error.response?.data?.message || error.message || "Failed to initiate payment",
      });
      showAlert("danger", error.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryResult(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/kuickpay/inquiry/",
        {
          transaction_id: inquiryForm.transaction_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setInquiryResult({
        success: true,
        data: response.data,
      });

      showAlert("success", "Transaction details retrieved successfully!");
    } catch (error) {
      console.error("Inquiry error:", error);
      setInquiryResult({
        success: false,
        error: error.response?.data?.message || error.message || "Failed to retrieve transaction details",
      });
      showAlert("danger", error.response?.data?.message || "Failed to retrieve transaction details");
    } finally {
      setInquiryLoading(false);
    }
  };

  // Statistics
  const statistics = {
    total: transactions.length,
    success: transactions.filter((t) => t.status === "success").length,
    pending: transactions.filter((t) => t.status === "pending").length,
    failed: transactions.filter((t) => t.status === "failed").length,
    refunded: transactions.filter((t) => t.status === "refunded").length,
    total_amount: transactions
      .filter((t) => t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0),
  };

  // Filtered Transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      searchTerm === "" ||
      transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.booking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const statusConfig = {
      success: { bg: "success", text: "Success", icon: CheckCircle },
      pending: { bg: "warning", text: "Pending", icon: Clock },
      failed: { bg: "danger", text: "Failed", icon: XCircle },
      refunded: { bg: "info", text: "Refunded", icon: RefreshCw },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge bg={config.bg} className="d-flex align-items-center gap-1" style={{ fontSize: "0.85rem" }}>
        <Icon size={14} />
        {config.text}
      </Badge>
    );
  };

  // Payment Method Badge
  const getPaymentMethodBadge = (method) => {
    const methodConfig = {
      credit_card: { bg: "primary", text: "Credit Card", icon: "💳" },
      debit_card: { bg: "info", text: "Debit Card", icon: "💳" },
      bank_transfer: { bg: "secondary", text: "Bank Transfer", icon: "🏦" },
      wallet: { bg: "warning", text: "Wallet", icon: "👛" },
    };

    const config = methodConfig[method] || { bg: "secondary", text: method, icon: "💰" };

    return (
      <Badge bg={config.bg} style={{ fontSize: "0.85rem" }}>
        {config.icon} {config.text}
      </Badge>
    );
  };

  // Open Details Modal
  const openDetailsModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  // Show Alert
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  // Format Currency
  const formatCurrency = (amount, currency = "PKR") => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Format Date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <AgentSidebar />
        <div style={{ flex: 1, overflow: "auto" }}>
          <AgentHeader />
          <Container fluid className="p-4">
            {/* Alert */}
            {alert.show && (
              <Alert variant={alert.type} onClose={() => setAlert({ show: false })} dismissible className="mb-3">
                {alert.message}
              </Alert>
            )}

            {/* Page Header */}
            <Row className="mb-4">
              <Col>
                <h2 className="mb-1 fw-bold">
                  <CreditCard size={32} className="me-2" />
                  Kuickpay Payment Gateway
                </h2>
                <p className="text-muted">Initiate payments and check transaction status</p>
              </Col>
            </Row>

            {/* Navigation Tabs */}
            <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="payment">
                  <Send size={16} className="me-2" />
                  Initiate Payment
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="inquiry">
                  <Search size={16} className="me-2" />
                  Payment Inquiry
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="transactions">
                  <FileText size={16} className="me-2" />
                  Transaction History
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {/* Payment Form Tab */}
            {activeTab === "payment" && (
              <Card className="shadow-sm">
                <Card.Body>
                  <h4 className="mb-4">
                    <Send size={24} className="me-2" />
                    Initiate Payment
                  </h4>
                  
                  <Form onSubmit={handlePaymentSubmit}>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Booking ID *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter booking ID"
                            value={paymentForm.booking_id}
                            onChange={(e) => setPaymentForm({ ...paymentForm, booking_id: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Amount (PKR) *</Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="Enter amount"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            required
                            min="1"
                            step="0.01"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Customer Name *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter customer name"
                            value={paymentForm.customer_name}
                            onChange={(e) => setPaymentForm({ ...paymentForm, customer_name: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Customer Email *</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="Enter customer email"
                            value={paymentForm.customer_email}
                            onChange={(e) => setPaymentForm({ ...paymentForm, customer_email: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Customer Phone *</Form.Label>
                          <Form.Control
                            type="tel"
                            placeholder="Enter customer phone"
                            value={paymentForm.customer_phone}
                            onChange={(e) => setPaymentForm({ ...paymentForm, customer_phone: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Payment description (optional)"
                            value={paymentForm.description}
                            onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2">
                      <Button type="submit" variant="primary" disabled={paymentLoading}>
                        {paymentLoading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send size={18} className="me-2" />
                            Initiate Payment
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={() => {
                          setPaymentForm({
                            booking_id: "",
                            customer_name: "",
                            customer_email: "",
                            customer_phone: "",
                            amount: "",
                            description: "",
                          });
                          setPaymentResult(null);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </Form>

                  {/* Payment Result */}
                  {paymentResult && (
                    <div className="mt-4">
                      {paymentResult.success ? (
                        <Alert variant="success">
                          <h5>
                            <CheckCircle size={20} className="me-2" />
                            Payment Initiated Successfully!
                          </h5>
                          <hr />
                          <div>
                            <strong>Transaction ID:</strong> {paymentResult.data.transaction_id}
                          </div>
                          {paymentResult.data.payment_url && (
                            <div className="mt-2">
                              <strong>Payment URL:</strong>{" "}
                              <a href={paymentResult.data.payment_url} target="_blank" rel="noopener noreferrer">
                                {paymentResult.data.payment_url}
                              </a>
                            </div>
                          )}
                          <div className="mt-3">
                            <pre style={{ background: "#f8f9fa", padding: "12px", borderRadius: "4px", fontSize: "0.85rem" }}>
                              {JSON.stringify(paymentResult.data, null, 2)}
                            </pre>
                          </div>
                        </Alert>
                      ) : (
                        <Alert variant="danger">
                          <h5>
                            <XCircle size={20} className="me-2" />
                            Payment Failed
                          </h5>
                          <hr />
                          <div>{paymentResult.error}</div>
                        </Alert>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Inquiry Form Tab */}
            {activeTab === "inquiry" && (
              <Card className="shadow-sm">
                <Card.Body>
                  <h4 className="mb-4">
                    <Search size={24} className="me-2" />
                    Payment Inquiry
                  </h4>

                  <Form onSubmit={handleInquirySubmit}>
                    <Row className="mb-3">
                      <Col md={8}>
                        <Form.Group>
                          <Form.Label>Transaction ID *</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <Info size={16} />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="Enter Kuickpay transaction ID (e.g., KP-2024-0001)"
                              value={inquiryForm.transaction_id}
                              onChange={(e) => setInquiryForm({ transaction_id: e.target.value })}
                              required
                            />
                          </InputGroup>
                          <Form.Text className="text-muted">
                            Enter the transaction ID to check its current status and details
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2">
                      <Button type="submit" variant="primary" disabled={inquiryLoading}>
                        {inquiryLoading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <Search size={18} className="me-2" />
                            Check Status
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={() => {
                          setInquiryForm({ transaction_id: "" });
                          setInquiryResult(null);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </Form>

                  {/* Inquiry Result */}
                  {inquiryResult && (
                    <div className="mt-4">
                      {inquiryResult.success ? (
                        <Alert variant="success">
                          <h5>
                            <CheckCircle size={20} className="me-2" />
                            Transaction Details Retrieved
                          </h5>
                          <hr />
                          <Row>
                            <Col md={6}>
                              <div className="mb-2">
                                <strong>Transaction ID:</strong> {inquiryResult.data.transaction_id}
                              </div>
                              <div className="mb-2">
                                <strong>Booking ID:</strong> {inquiryResult.data.booking_id}
                              </div>
                              <div className="mb-2">
                                <strong>Amount:</strong> {inquiryResult.data.currency} {inquiryResult.data.amount}
                              </div>
                              <div className="mb-2">
                                <strong>Status:</strong> {getStatusBadge(inquiryResult.data.status)}
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-2">
                                <strong>Payment Method:</strong> {inquiryResult.data.payment_method}
                              </div>
                              <div className="mb-2">
                                <strong>Customer:</strong> {inquiryResult.data.customer_name}
                              </div>
                              <div className="mb-2">
                                <strong>Created:</strong> {formatDate(inquiryResult.data.created_at)}
                              </div>
                              {inquiryResult.data.updated_at && (
                                <div className="mb-2">
                                  <strong>Updated:</strong> {formatDate(inquiryResult.data.updated_at)}
                                </div>
                              )}
                            </Col>
                          </Row>
                          <div className="mt-3">
                            <strong>Full Response:</strong>
                            <pre style={{ background: "#f8f9fa", padding: "12px", borderRadius: "4px", fontSize: "0.85rem", maxHeight: "300px", overflow: "auto" }}>
                              {JSON.stringify(inquiryResult.data, null, 2)}
                            </pre>
                          </div>
                        </Alert>
                      ) : (
                        <Alert variant="danger">
                          <h5>
                            <XCircle size={20} className="me-2" />
                            Inquiry Failed
                          </h5>
                          <hr />
                          <div>{inquiryResult.error}</div>
                        </Alert>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Transaction History Tab */}
            {activeTab === "transactions" && (
              <>
            {/* Statistics Cards */}
            <Row className="mb-4">
              <Col md={3} sm={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#e3f2fd" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Total Transactions</p>
                        <h3 className="mb-0 fw-bold">{statistics.total}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#2196f3" }}
                      >
                        <FileText size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} sm={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#e8f5e9" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Successful</p>
                        <h3 className="mb-0 fw-bold">{statistics.success}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#4caf50" }}
                      >
                        <CheckCircle size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} sm={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#fff3e0" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Pending</p>
                        <h3 className="mb-0 fw-bold">{statistics.pending}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#ff9800" }}
                      >
                        <Clock size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} sm={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#f3e5f5" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Total Revenue</p>
                        <h3 className="mb-0 fw-bold" style={{ fontSize: "1.3rem" }}>
                          {formatCurrency(statistics.total_amount)}
                        </h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#9c27b0" }}
                      >
                        <DollarSign size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Additional Stats */}
            <Row className="mb-4">
              <Col md={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#ffebee" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Failed Transactions</p>
                        <h3 className="mb-0 fw-bold">{statistics.failed}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#f44336" }}
                      >
                        <XCircle size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: "#e0f2f1" }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1">Refunded</p>
                        <h3 className="mb-0 fw-bold">{statistics.refunded}</h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", backgroundColor: "#009688" }}
                      >
                        <RefreshCw size={24} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Search and Filters */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="position-relative">
                      <Search className="position-absolute" style={{ top: "12px", left: "12px" }} size={18} />
                      <Form.Control
                        type="text"
                        placeholder="Search by transaction ID, booking ID, customer name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: "40px" }}
                      />
                    </div>
                  </Col>

                  <Col md={3}>
                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="success">✅ Success</option>
                      <option value="pending">⏳ Pending</option>
                      <option value="failed">❌ Failed</option>
                      <option value="refunded">🔄 Refunded</option>
                    </Form.Select>
                  </Col>

                  <Col md={3} className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                      className="w-50"
                    >
                      Clear
                    </Button>
                    <Button variant="outline-primary" className="w-50">
                      <Download size={18} className="me-2" />
                      Export
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Transactions Table */}
            <Card className="shadow-sm border-0">
              <Card.Body style={{ overflowX: "auto" }}>
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-5">
                    <AlertCircle size={48} className="text-muted mb-3" />
                    <h5 className="text-muted">No transactions found</h5>
                    <p className="text-muted">Try adjusting your filters or search query</p>
                  </div>
                ) : (
                  <table className="table table-hover">
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th style={{ minWidth: "140px" }}>Transaction ID</th>
                        <th style={{ minWidth: "120px" }}>Booking ID</th>
                        <th style={{ minWidth: "150px" }}>Customer</th>
                        <th style={{ minWidth: "120px" }}>Amount</th>
                        <th style={{ minWidth: "140px" }}>Payment Method</th>
                        <th style={{ minWidth: "120px" }}>Status</th>
                        <th style={{ minWidth: "160px" }}>Date & Time</th>
                        <th style={{ minWidth: "100px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="fw-semibold">{transaction.transaction_id}</td>
                          <td>{transaction.booking_id}</td>
                          <td>{transaction.customer_name}</td>
                          <td className="fw-bold text-success">{formatCurrency(transaction.amount)}</td>
                          <td>{getPaymentMethodBadge(transaction.payment_method)}</td>
                          <td>{getStatusBadge(transaction.status)}</td>
                          <td>
                            <Calendar size={14} className="me-1 text-muted" />
                            {formatDate(transaction.created_at)}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => openDetailsModal(transaction)}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card.Body>
            </Card>

      {/* Transaction Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FileText size={24} className="me-2" />
            Transaction Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <div>
              <Row className="g-3">
                <Col md={6}>
                  <div className="border-bottom pb-2 mb-2">
                    <small className="text-muted d-block mb-1">Transaction ID</small>
                    <div className="fw-bold">{selectedTransaction.transaction_id}</div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="border-bottom pb-2 mb-2">
                    <small className="text-muted d-block mb-1">Booking ID</small>
                    <div className="fw-bold">{selectedTransaction.booking_id}</div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="border-bottom pb-2 mb-2">
                    <small className="text-muted d-block mb-1">Customer Name</small>
                    <div className="fw-bold">{selectedTransaction.customer_name}</div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="border-bottom pb-2 mb-2">
                    <small className="text-muted d-block mb-1">Amount</small>
                    <div className="fw-bold text-success">{formatCurrency(selectedTransaction.amount)}</div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="border-bottom pb-2 mb-2">
                    <small className="text-muted d-block mb-1">Payment Method</small>
                    <div>{getPaymentMethodBadge(selectedTransaction.payment_method)}</div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="border-bottom pb-2 mb-2">
                    <small className="text-muted d-block mb-1">Status</small>
                    <div>{getStatusBadge(selectedTransaction.status)}</div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="border-bottom pb-2 mb-2">
                    <small className="text-muted d-block mb-1">Reference</small>
                    <div className="fw-bold">{selectedTransaction.reference}</div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="border-bottom pb-2 mb-2">
                    <small className="text-muted d-block mb-1">Created At</small>
                    <div className="fw-bold">{formatDate(selectedTransaction.created_at)}</div>
                  </div>
                </Col>

                {selectedTransaction.card_last4 && (
                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Card Details</small>
                      <div className="fw-bold">
                        {selectedTransaction.card_brand} •••• {selectedTransaction.card_last4}
                      </div>
                    </div>
                  </Col>
                )}

                {selectedTransaction.bank_name && (
                  <Col md={6}>
                    <div className="border-bottom pb-2 mb-2">
                      <small className="text-muted d-block mb-1">Bank Name</small>
                      <div className="fw-bold">{selectedTransaction.bank_name}</div>
                    </div>
                  </Col>
                )}

                {selectedTransaction.failure_reason && (
                  <Col md={12}>
                    <Alert variant="danger" className="mb-0">
                      <strong>Failure Reason:</strong> {selectedTransaction.failure_reason}
                    </Alert>
                  </Col>
                )}

                {selectedTransaction.refund_reason && (
                  <Col md={12}>
                    <Alert variant="info" className="mb-0">
                      <strong>Refund Reason:</strong> {selectedTransaction.refund_reason}
                    </Alert>
                  </Col>
                )}

                <Col md={12}>
                  <div className="border-bottom pb-2 mb-2">
                    <small className="text-muted d-block mb-1">Last Updated</small>
                    <div className="fw-bold">{formatDate(selectedTransaction.updated_at)}</div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedTransaction && selectedTransaction.status === "success" && (
            <Button variant="primary">
              <Download size={18} className="me-2" />
              Download Receipt
            </Button>
          )}
        </Modal.Footer>
      </Modal>
              </>
            )}

          </Container>
        </div>
      </div>

      {/* Responsive CSS */}
      <style jsx>{`
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

export default AgentKuickpay;
