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
  Table,
  InputGroup,
  Pagination,
  Tabs,
  Tab,
  Modal,
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  DollarSign,
  CreditCard,
  Settings,
  TrendingUp,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Lock,
  Key,
  Webhook,
  Radio,
} from "lucide-react";
import axios from "axios";

const UnifiedFinancialHub = () => {
  // ============ STATE MANAGEMENT ============
  const [activeTab, setActiveTab] = useState("payments");
  const [payments, setPayments] = useState([]);
  const [kuickpayConfigs, setKuickpayConfigs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filteredWebhooks, setFilteredWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    merchant_id: "",
    api_key: "",
    webhook_url: "",
  });

  const itemsPerPage = 10;

  // ============ DEMO DATA - PAYMENTS ============
  const demoPayments = [
    {
      id: 1,
      orderId: "ORD-2025-001",
      customer: "Abdullah Ahmad",
      amount: 15000,
      currency: "PKR",
      method: "Card",
      status: "completed",
      date: "2025-11-02",
      transactionId: "TXN-2025-0001",
    },
    {
      id: 2,
      orderId: "ORD-2025-002",
      customer: "Fatima Khan",
      amount: 22500,
      currency: "PKR",
      method: "Bank Transfer",
      status: "pending",
      date: "2025-11-02",
      transactionId: "TXN-2025-0002",
    },
    {
      id: 3,
      orderId: "ORD-2025-003",
      customer: "Muhammad Hassan",
      amount: 30000,
      currency: "PKR",
      method: "JazzCash",
      status: "completed",
      date: "2025-11-01",
      transactionId: "TXN-2025-0003",
    },
    {
      id: 4,
      orderId: "ORD-2025-004",
      customer: "Ayesha Malik",
      amount: 18750,
      currency: "PKR",
      method: "Easypaisa",
      status: "failed",
      date: "2025-11-01",
      transactionId: "TXN-2025-0004",
    },
  ];

  // ============ DEMO DATA - KUICKPAY CONFIGS ============
  const demoKuickpayConfigs = [
    {
      id: 1,
      merchant_name: "Saer Tours",
      merchant_id: "SAE-2025-001",
      api_key: "sk_test_4eC39HqLyjWDarhtT321aBc",
      webhook_url: "https://api.saertours.com/webhooks/kuickpay",
      status: "active",
      createdAt: "2025-10-01",
      lastUpdated: "2025-11-02",
    },
  ];

  // ============ DEMO DATA - TRANSACTIONS ============
  const demoTransactions = [
    {
      id: 1,
      transactionId: "TXN-2025-0001",
      merchant: "Saer Tours",
      amount: 15000,
      fee: 450,
      netAmount: 14550,
      paymentMethod: "Card",
      status: "completed",
      date: "2025-11-02 10:30 AM",
      reference: "KUIC-20251102-001",
    },
    {
      id: 2,
      transactionId: "TXN-2025-0003",
      merchant: "Saer Tours",
      amount: 30000,
      fee: 900,
      netAmount: 29100,
      paymentMethod: "Bank Transfer",
      status: "completed",
      date: "2025-11-01 02:15 PM",
      reference: "KUIC-20251101-002",
    },
    {
      id: 3,
      transactionId: "TXN-2025-0002",
      merchant: "Saer Tours",
      amount: 22500,
      fee: 675,
      netAmount: 21825,
      paymentMethod: "JazzCash",
      status: "pending",
      date: "2025-11-02 11:45 AM",
      reference: "KUIC-20251102-003",
    },
  ];

  // ============ DEMO DATA - WEBHOOK LOGS ============
  const demoWebhookLogs = [
    {
      id: 1,
      event: "payment.completed",
      status: "success",
      transactionId: "TXN-2025-0001",
      timestamp: "2025-11-02 10:30:45",
      response: "Webhook processed successfully",
      retries: 0,
    },
    {
      id: 2,
      event: "payment.pending",
      status: "success",
      transactionId: "TXN-2025-0002",
      timestamp: "2025-11-02 11:45:12",
      response: "Webhook processed successfully",
      retries: 0,
    },
    {
      id: 3,
      event: "payment.failed",
      status: "failed",
      transactionId: "TXN-2025-0004",
      timestamp: "2025-11-01 03:20:30",
      response: "Connection timeout - retry 1",
      retries: 1,
    },
    {
      id: 4,
      event: "refund.initiated",
      status: "pending",
      transactionId: "TXN-2025-0005",
      timestamp: "2025-11-02 09:15:22",
      response: "Processing...",
      retries: 0,
    },
  ];

  // ============ LIFECYCLE HOOKS ============
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls
        setPayments(demoPayments);
        setKuickpayConfigs(demoKuickpayConfigs);
        setTransactions(demoTransactions);
        setWebhookLogs(demoWebhookLogs);

        // Initialize form with config data
        if (demoKuickpayConfigs.length > 0) {
          setSettingsForm({
            merchant_id: demoKuickpayConfigs[0].merchant_id,
            api_key: demoKuickpayConfigs[0].api_key,
            webhook_url: demoKuickpayConfigs[0].webhook_url,
          });
        }

        setAlert({ show: true, type: "success", message: "Financial data loaded successfully" });
      } catch (err) {
        console.error("Error fetching data:", err);
        setAlert({ show: true, type: "danger", message: "Failed to load financial data" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============ FILTERING & SEARCHING ============
  useEffect(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [payments, searchTerm, selectedStatus, activeTab]);

  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.reference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, searchTerm, selectedStatus, activeTab]);

  useEffect(() => {
    let filtered = webhookLogs;

    if (searchTerm) {
      filtered = filtered.filter(
        (w) =>
          w.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((w) => w.status === selectedStatus);
    }

    setFilteredWebhooks(filtered);
    setCurrentPage(1);
  }, [webhookLogs, searchTerm, selectedStatus, activeTab]);

  // ============ STATISTICS ============
  const getPaymentStats = () => ({
    total: payments.length,
    completed: payments.filter((p) => p.status === "completed").length,
    pending: payments.filter((p) => p.status === "pending").length,
    failed: payments.filter((p) => p.status === "failed").length,
    totalAmount: payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0),
  });

  const getKuickpayStats = () => ({
    totalTransactions: transactions.length,
    completedTransactions: transactions.filter((t) => t.status === "completed").length,
    totalRevenue: transactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.netAmount, 0),
    totalFees: transactions.reduce((sum, t) => sum + t.fee, 0),
  });

  const getWebhookStats = () => ({
    totalLogs: webhookLogs.length,
    successful: webhookLogs.filter((w) => w.status === "success").length,
    failed: webhookLogs.filter((w) => w.status === "failed").length,
    pending: webhookLogs.filter((w) => w.status === "pending").length,
  });

  const paymentStats = getPaymentStats();
  const kuickpayStats = getKuickpayStats();
  const webhookStats = getWebhookStats();

  // ============ PAGINATION ============
  const totalPaymentPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paymentStartIdx = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(paymentStartIdx, paymentStartIdx + itemsPerPage);

  const totalTransactionPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const transactionStartIdx = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(transactionStartIdx, transactionStartIdx + itemsPerPage);

  const totalWebhookPages = Math.ceil(filteredWebhooks.length / itemsPerPage);
  const webhookStartIdx = (currentPage - 1) * itemsPerPage;
  const paginatedWebhooks = filteredWebhooks.slice(webhookStartIdx, webhookStartIdx + itemsPerPage);

  // ============ BADGE HELPERS ============
  const getStatusBadge = (status) => {
    const colors = {
      completed: "success",
      pending: "warning",
      failed: "danger",
      success: "success",
    };
    return (
      <Badge bg={colors[status] || "secondary"}>
        {status === "completed" || status === "success" ? <CheckCircle size={12} className="me-1" /> : <AlertCircle size={12} className="me-1" />}
        {status.toUpperCase()}
      </Badge>
    );
  };

  // ============ FORM HANDLERS ============
  const handleSettingsInputChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSettingsSave = () => {
    // TODO: Implement actual API call to save settings
    setAlert({ show: true, type: "success", message: "Kuickpay settings updated successfully" });
    setShowSettingsModal(false);
  };

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <Container fluid className="p-0">
          <Header title="Financial Management" />
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
        <Header title="Financial Management Hub" />

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

          {/* Tabs */}
          <Card>
            <Card.Body className="p-0">
              <Tabs id="financial-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-0">
                {/* ============ PAYMENTS TAB ============ */}
                <Tab eventKey="payments" title={<><CreditCard size={16} className="me-2" />Payments</>}>
                  <div className="p-3">
                    {/* Stats Cards */}
                    <div className="mb-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #0d6efd" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Total Payments</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#0d6efd", fontWeight: "bold", margin: 0 }}>{paymentStats.total}</h3>
                          </div>
                          <CreditCard size={32} style={{ color: "#0d6efd", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #198754" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Completed</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#198754", fontWeight: "bold", margin: 0 }}>{paymentStats.completed}</h3>
                          </div>
                          <CheckCircle size={32} style={{ color: "#198754", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #ffc107" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Pending</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#ffc107", fontWeight: "bold", margin: 0 }}>{paymentStats.pending}</h3>
                          </div>
                          <AlertCircle size={32} style={{ color: "#ffc107", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #dc3545" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Failed</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#dc3545", fontWeight: "bold", margin: 0 }}>{paymentStats.failed}</h3>
                          </div>
                          <AlertCircle size={32} style={{ color: "#dc3545", opacity: 0.2 }} />
                        </div>
                      </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-3">
                      <Card.Body>
                        <Row className="g-3">
                          <Col md={6}>
                            <InputGroup>
                              <InputGroup.Text>
                                <Search size={16} />
                              </InputGroup.Text>
                              <Form.Control
                                placeholder="Search by Order ID, Customer, or Transaction ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </InputGroup>
                          </Col>
                          <Col md={6} className="d-flex gap-2">
                            <Form.Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ flex: 1 }}>
                              <option value="">All Status</option>
                              <option value="completed">Completed</option>
                              <option value="pending">Pending</option>
                              <option value="failed">Failed</option>
                            </Form.Select>
                            <Button variant="primary">
                              <Plus size={16} className="me-2" />
                              Record Payment
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Payments Table */}
                    <div style={{ overflowX: "auto" }}>
                      <Table hover>
                        <thead style={{ backgroundColor: "#f8f9fa" }}>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Transaction ID</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedPayments.map((payment) => (
                            <tr key={payment.id}>
                              <td>
                                <strong>{payment.orderId}</strong>
                              </td>
                              <td>{payment.customer}</td>
                              <td>
                                <strong>
                                  {payment.amount} {payment.currency}
                                </strong>
                              </td>
                              <td>
                                <Badge bg="light" text="dark">
                                  {payment.method}
                                </Badge>
                              </td>
                              <td>{getStatusBadge(payment.status)}</td>
                              <td>{payment.date}</td>
                              <td>
                                <code>{payment.transactionId}</code>
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button variant="outline-primary" size="sm">
                                    <Eye size={14} />
                                  </Button>
                                  <Button variant="outline-warning" size="sm">
                                    <Edit2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPaymentPages > 1 && (
                      <Pagination className="justify-content-center mt-4">
                        <Pagination.First disabled={currentPage === 1} onClick={() => setCurrentPage(1)} />
                        <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />
                        {Array.from({ length: Math.min(5, totalPaymentPages) }, (_, i) => (
                          <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next disabled={currentPage === totalPaymentPages} onClick={() => setCurrentPage(currentPage + 1)} />
                        <Pagination.Last disabled={currentPage === totalPaymentPages} onClick={() => setCurrentPage(totalPaymentPages)} />
                      </Pagination>
                    )}
                  </div>
                </Tab>

                {/* ============ KUICKPAY MANAGEMENT TAB ============ */}
                <Tab eventKey="kuickpay" title={<><DollarSign size={16} className="me-2" />Kuickpay Management</>}>
                  <div className="p-3">
                    {/* Stats Cards */}
                    <div className="mb-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #0d6efd" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Total Transactions</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#0d6efd", fontWeight: "bold", margin: 0 }}>{kuickpayStats.totalTransactions}</h3>
                          </div>
                          <BarChart3 size={32} style={{ color: "#0d6efd", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #198754" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Completed</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#198754", fontWeight: "bold", margin: 0 }}>{kuickpayStats.completedTransactions}</h3>
                          </div>
                          <CheckCircle size={32} style={{ color: "#198754", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #0dcaf0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Total Revenue</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#0dcaf0", fontWeight: "bold", margin: 0 }}>{kuickpayStats.totalRevenue?.toLocaleString()}</h3>
                          </div>
                          <TrendingUp size={32} style={{ color: "#0dcaf0", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #6f42c1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Total Fees</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#6f42c1", fontWeight: "bold", margin: 0 }}>{kuickpayStats.totalFees?.toLocaleString()}</h3>
                          </div>
                          <DollarSign size={32} style={{ color: "#6f42c1", opacity: 0.2 }} />
                        </div>
                      </div>
                    </div>

                    {/* Kuickpay Config Card */}
                    <Card className="mb-4">
                      <Card.Header className="bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">
                            <Lock size={16} className="me-2" />
                            Kuickpay Configuration
                          </h5>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => setShowSettingsModal(true)}
                          >
                            <Settings size={14} className="me-2" />
                            Edit Settings
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        {kuickpayConfigs.length > 0 ? (
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Merchant Name:</strong>
                                <p className="text-muted">{kuickpayConfigs[0].merchant_name}</p>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Merchant ID:</strong>
                                <p className="text-muted">
                                  <code>{kuickpayConfigs[0].merchant_id}</code>
                                </p>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Status:</strong>
                                <p className="text-muted">
                                  <Badge bg="success">Active</Badge>
                                </p>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Last Updated:</strong>
                                <p className="text-muted">{kuickpayConfigs[0].lastUpdated}</p>
                              </div>
                            </Col>
                          </Row>
                        ) : (
                          <Alert variant="info">No Kuickpay configuration found. Please add one.</Alert>
                        )}
                      </Card.Body>
                    </Card>

                    {/* Transactions Overview */}
                    <Card>
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">Recent Kuickpay Transactions</h5>
                      </Card.Header>
                      <Card.Body className="p-0">
                        <div style={{ overflowX: "auto" }}>
                          <Table hover className="mb-0">
                            <thead style={{ backgroundColor: "#f8f9fa" }}>
                              <tr>
                                <th>Transaction ID</th>
                                <th>Amount</th>
                                <th>Fee</th>
                                <th>Net Amount</th>
                                <th>Payment Method</th>
                                <th>Status</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.slice(0, 5).map((txn) => (
                                <tr key={txn.id}>
                                  <td>
                                    <code>{txn.transactionId}</code>
                                  </td>
                                  <td>{txn.amount} PKR</td>
                                  <td>{txn.fee} PKR</td>
                                  <td>
                                    <strong>{txn.netAmount} PKR</strong>
                                  </td>
                                  <td>
                                    <Badge bg="light" text="dark">
                                      {txn.paymentMethod}
                                    </Badge>
                                  </td>
                                  <td>{getStatusBadge(txn.status)}</td>
                                  <td>{txn.date}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </Tab>

                {/* ============ TRANSACTIONS TAB ============ */}
                <Tab eventKey="transactions" title={<><BarChart3 size={16} className="me-2" />Transactions</>}>
                  <div className="p-3">
                    {/* Filters */}
                    <Card className="mb-3">
                      <Card.Body>
                        <Row className="g-3">
                          <Col md={6}>
                            <InputGroup>
                              <InputGroup.Text>
                                <Search size={16} />
                              </InputGroup.Text>
                              <Form.Control
                                placeholder="Search by Transaction ID or Reference..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </InputGroup>
                          </Col>
                          <Col md={6} className="d-flex gap-2">
                            <Form.Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ flex: 1 }}>
                              <option value="">All Status</option>
                              <option value="completed">Completed</option>
                              <option value="pending">Pending</option>
                            </Form.Select>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Transactions Table */}
                    <div style={{ overflowX: "auto" }}>
                      <Table hover>
                        <thead style={{ backgroundColor: "#f8f9fa" }}>
                          <tr>
                            <th>Transaction ID</th>
                            <th>Merchant</th>
                            <th>Amount</th>
                            <th>Fee</th>
                            <th>Net Amount</th>
                            <th>Payment Method</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTransactions.map((txn) => (
                            <tr key={txn.id}>
                              <td>
                                <code>{txn.transactionId}</code>
                              </td>
                              <td>{txn.merchant}</td>
                              <td>{txn.amount} PKR</td>
                              <td>{txn.fee} PKR</td>
                              <td>
                                <strong>{txn.netAmount} PKR</strong>
                              </td>
                              <td>
                                <Badge bg="light" text="dark">
                                  {txn.paymentMethod}
                                </Badge>
                              </td>
                              <td>{getStatusBadge(txn.status)}</td>
                              <td>{txn.date}</td>
                              <td>
                                <small>{txn.reference}</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalTransactionPages > 1 && (
                      <Pagination className="justify-content-center mt-4">
                        <Pagination.First disabled={currentPage === 1} onClick={() => setCurrentPage(1)} />
                        <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />
                        {Array.from({ length: Math.min(5, totalTransactionPages) }, (_, i) => (
                          <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next disabled={currentPage === totalTransactionPages} onClick={() => setCurrentPage(currentPage + 1)} />
                        <Pagination.Last disabled={currentPage === totalTransactionPages} onClick={() => setCurrentPage(totalTransactionPages)} />
                      </Pagination>
                    )}
                  </div>
                </Tab>

                {/* ============ WEBHOOK LOGS TAB ============ */}
                <Tab eventKey="webhooks" title={<><Webhook size={16} className="me-2" />Webhook Logs</>}>
                  <div className="p-3">
                    {/* Stats */}
                    <div className="mb-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #0d6efd" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Total Logs</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#0d6efd", fontWeight: "bold", margin: 0 }}>{webhookStats.totalLogs}</h3>
                          </div>
                          <Radio size={32} style={{ color: "#0d6efd", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #198754" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Successful</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#198754", fontWeight: "bold", margin: 0 }}>{webhookStats.successful}</h3>
                          </div>
                          <CheckCircle size={32} style={{ color: "#198754", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #dc3545" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Failed</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#dc3545", fontWeight: "bold", margin: 0 }}>{webhookStats.failed}</h3>
                          </div>
                          <AlertCircle size={32} style={{ color: "#dc3545", opacity: 0.2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", borderTop: "4px solid #ffc107" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ marginBottom: "0.5rem", color: "#6c757d", fontSize: "0.85rem" }}>Pending</p>
                            <h3 style={{ fontSize: "1.75rem", color: "#ffc107", fontWeight: "bold", margin: 0 }}>{webhookStats.pending}</h3>
                          </div>
                          <AlertCircle size={32} style={{ color: "#ffc107", opacity: 0.2 }} />
                        </div>
                      </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-3">
                      <Card.Body>
                        <Row className="g-3">
                          <Col md={6}>
                            <InputGroup>
                              <InputGroup.Text>
                                <Search size={16} />
                              </InputGroup.Text>
                              <Form.Control
                                placeholder="Search by Event or Transaction ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </InputGroup>
                          </Col>
                          <Col md={6} className="d-flex gap-2">
                            <Form.Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ flex: 1 }}>
                              <option value="">All Status</option>
                              <option value="success">Successful</option>
                              <option value="failed">Failed</option>
                              <option value="pending">Pending</option>
                            </Form.Select>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Webhook Logs Table */}
                    <div style={{ overflowX: "auto" }}>
                      <Table hover>
                        <thead style={{ backgroundColor: "#f8f9fa" }}>
                          <tr>
                            <th>Event</th>
                            <th>Transaction ID</th>
                            <th>Status</th>
                            <th>Timestamp</th>
                            <th>Response</th>
                            <th>Retries</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedWebhooks.map((log) => (
                            <tr key={log.id}>
                              <td>
                                <Badge bg="light" text="dark">
                                  {log.event}
                                </Badge>
                              </td>
                              <td>
                                <code>{log.transactionId}</code>
                              </td>
                              <td>{getStatusBadge(log.status)}</td>
                              <td>{log.timestamp}</td>
                              <td>
                                <small className="text-muted">{log.response}</small>
                              </td>
                              <td>
                                <Badge bg={log.retries > 0 ? "warning" : "success"}>{log.retries}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalWebhookPages > 1 && (
                      <Pagination className="justify-content-center mt-4">
                        <Pagination.First disabled={currentPage === 1} onClick={() => setCurrentPage(1)} />
                        <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />
                        {Array.from({ length: Math.min(5, totalWebhookPages) }, (_, i) => (
                          <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next disabled={currentPage === totalWebhookPages} onClick={() => setCurrentPage(currentPage + 1)} />
                        <Pagination.Last disabled={currentPage === totalWebhookPages} onClick={() => setCurrentPage(totalWebhookPages)} />
                      </Pagination>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </div>

        {/* Settings Modal */}
        <Modal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <Settings size={20} className="me-2" />
              Kuickpay Settings
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>
                  <Key size={16} className="me-2" />
                  Merchant ID
                </Form.Label>
                <Form.Control
                  type="text"
                  name="merchant_id"
                  value={settingsForm.merchant_id}
                  onChange={handleSettingsInputChange}
                  placeholder="Enter Merchant ID"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  <Lock size={16} className="me-2" />
                  API Key
                </Form.Label>
                <Form.Control
                  type="password"
                  name="api_key"
                  value={settingsForm.api_key}
                  onChange={handleSettingsInputChange}
                  placeholder="Enter API Key"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  <Webhook size={16} className="me-2" />
                  Webhook URL
                </Form.Label>
                <Form.Control
                  type="url"
                  name="webhook_url"
                  value={settingsForm.webhook_url}
                  onChange={handleSettingsInputChange}
                  placeholder="Enter Webhook URL"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSettingsSave}>
              <Settings size={16} className="me-2" />
              Save Settings
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default UnifiedFinancialHub;
