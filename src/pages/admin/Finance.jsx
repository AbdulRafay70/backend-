import React, { useState, useEffect } from "react";
import { Table, Button, Form, Card, Row, Col, Badge, Modal } from "react-bootstrap";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Download, Search, Filter } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import AdminFooter from "../../components/AdminFooter";
import { NavLink, useLocation } from "react-router-dom";

// Add table styles for preventing text wrap
const tableStyles = `
  .finance-table th,
  .finance-table td {
    white-space: nowrap;
    vertical-align: middle;
  }
  
  .finance-table th:first-child,
  .finance-table td:first-child {
    position: sticky;
    left: 0;
    background-color: white;
    z-index: 1;
  }
  
  .finance-table thead th:first-child {
    z-index: 2;
  }
`;

const Finance = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    { name: "Dashboard", path: "/finance", icon: <PieChart size={16} /> },
    { name: "Profit & Loss", path: "/finance/profit-loss" },
    { name: "Ledger", path: "/finance/ledger" },
    { name: "Expenses", path: "/finance/expenses" },
    { name: "Manual Posting", path: "/finance/manual-posting" },
    { name: "Tax Reports", path: "/finance/tax-reports" },
    { name: "Balance Sheet", path: "/finance/balance-sheet" },
    { name: "Audit Trail", path: "/finance/audit-trail" },
  ];

  // Determine which tab content to show based on current path
  const getActiveTab = () => {
    if (currentPath === "/finance") return "Dashboard";
    if (currentPath.includes("profit-loss")) return "Profit & Loss";
    if (currentPath.includes("ledger")) return "Ledger";
    if (currentPath.includes("expenses")) return "Expenses";
    if (currentPath.includes("manual-posting")) return "Manual Posting";
    if (currentPath.includes("tax-reports")) return "Tax Reports";
    if (currentPath.includes("balance-sheet")) return "Balance Sheet";
    if (currentPath.includes("audit-trail")) return "Audit Trail";
    return "Dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Add table styles */}
      <style>{tableStyles}</style>
      
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
              {/* Navigation Tabs */}
              <div className="row mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  {/* Navigation Tabs */}
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={({ isActive }) =>
                          `nav-link btn btn-link text-decoration-none px-3 py-2 border-0 ${
                            isActive || (tab.path === "/finance" && currentPath === "/finance")
                              ? "text-primary fw-bold border-bottom border-primary border-3"
                              : "text-secondary"
                          }`
                        }
                        end={tab.path === "/finance"}
                      >
                        {tab.icon && <span className="me-1">{tab.icon}</span>}
                        {tab.name}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "Dashboard" && <FinanceDashboard />}
              {activeTab === "Profit & Loss" && <ProfitLossReport />}
              {activeTab === "Ledger" && <FinancialLedger />}
              {activeTab === "Expenses" && <ExpenseManagement />}
              {activeTab === "Manual Posting" && <ManualPosting />}
              {activeTab === "Tax Reports" && <TaxReports />}
              {activeTab === "Balance Sheet" && <BalanceSheet />}
              {activeTab === "Audit Trail" && <AuditTrail />}
            </div>

            <AdminFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== TAB COMPONENTS ==========

// 1. Financial Dashboard
// ...existing code...
import { getFinanceDashboard } from "../../utils/Api";

const FinanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    setLoading(true);
    setError(null);
    getFinanceDashboard(period)
      .then((res) => {
        setDashboard(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      });
  }, [period]);

  const moduleLabels = {
    hotel: "Hotels",
    visa: "Visas",
    transport: "Transport",
    ticket: "Tickets",
    umrah: "Umrah",
    other: "Other",
  };

  return (
    <div>
      <h2 className="fw-bold mb-4">Financial Dashboard</h2>

      {/* Period Selector */}
      <div className="mb-3">
        <Form.Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ width: 200 }}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </Form.Select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-danger">{error}</div>
      ) : dashboard ? (
        <>
          {/* Stats Cards */}
          <Row className="g-3 mb-4">
            <Col md={6} lg={3} sm={6} xs={12}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body style={{ backgroundColor: "#d4edda" }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Total Income</p>
                      <h4 className="fw-bold mb-0">Rs. {dashboard.total_income}</h4>
                    </div>
                    <TrendingUp className="text-success" size={24} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3} sm={6} xs={12}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body style={{ backgroundColor: "#f8d7da" }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Total Expense</p>
                      <h4 className="fw-bold mb-0">Rs. {dashboard.total_expenses}</h4>
                    </div>
                    <TrendingDown className="text-danger" size={24} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3} sm={6} xs={12}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body style={{ backgroundColor: "#d1ecf1" }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Total Profit</p>
                      <h4 className="fw-bold mb-0">Rs. {dashboard.total_profit}</h4>
                    </div>
                    <DollarSign className="text-primary" size={24} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3} sm={6} xs={12}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body style={{ backgroundColor: "#fff3cd" }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Pending Journals</p>
                      <h4 className="fw-bold mb-0">{dashboard.pending_journals}</h4>
                    </div>
                    <PieChart className="text-warning" size={24} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Module-wise Breakdown */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <h5 className="fw-semibold mb-0">Module-wise Breakdown</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-success" size="sm">
                    <Download size={16} className="me-1" />
                    Export CSV
                  </Button>
                  <Button variant="outline-danger" size="sm">
                    <Download size={16} className="me-1" />
                    Export PDF
                  </Button>
                </div>
              </div>
              <Table responsive hover className="finance-table">
                <thead className="table-light">
                  <tr>
                    <th>Module</th>
                    <th>Income</th>
                    <th>Expense</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.breakdown_by_module &&
                    Object.entries(dashboard.breakdown_by_module).map(
                      ([svc, data]) => (
                        <tr key={svc}>
                          <td>{moduleLabels[svc] || svc}</td>
                          <td className="text-success">Rs. {data.income}</td>
                          <td className="text-danger">Rs. {data.expenses}</td>
                          <td className="fw-bold text-primary">Rs. {data.profit}</td>
                        </tr>
                      )
                    )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      ) : null}
      {/* Recent Transactions (unchanged) */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <h5 className="fw-semibold mb-0">Recent Transactions</h5>
            <div className="d-flex gap-2">
              <Button variant="outline-success" size="sm">
                <Download size={16} className="me-1" />
                Export CSV
              </Button>
              <Button variant="outline-danger" size="sm">
                <Download size={16} className="me-1" />
                Export PDF
              </Button>
            </div>
          </div>
          <Table responsive hover className="finance-table">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Reference No</th>
                <th>Module</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2025-10-17</td>
                <td>SAER-HTL-00125</td>
                <td>Hotel</td>
                <td>Makkah Hilton Booking</td>
                <td className="text-success fw-bold">Rs. 120,000</td>
                <td><span className="badge bg-success">Income</span></td>
              </tr>
              <tr>
                <td>2025-10-16</td>
                <td>SAER-VIS-00089</td>
                <td>Visa</td>
                <td>Umrah Visa Processing</td>
                <td className="text-danger fw-bold">Rs. 35,000</td>
                <td><span className="badge bg-danger">Expense</span></td>
              </tr>
              <tr>
                <td>2025-10-15</td>
                <td>SAER-TKT-00234</td>
                <td>Ticket</td>
                <td>Flight Booking - Jeddah</td>
                <td className="text-success fw-bold">Rs. 85,000</td>
                <td><span className="badge bg-success">Income</span></td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

// 2. Profit & Loss Report
const ProfitLossReport = () => {
  const [dateRange, setDateRange] = useState({ from: "2025-10-01", to: "2025-10-31" });
  const [selectedModule, setSelectedModule] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    branch: "all",
    profitRange: "all",
    transactionCount: "all",
  });

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const profitLossData = [
    {
      module: "Hotels",
      totalIncome: 5000000,
      totalExpense: 3000000,
      profit: 2000000,
      loss: 0,
      transactions: 125,
    },
    {
      module: "Visas",
      totalIncome: 2000000,
      totalExpense: 1600000,
      profit: 400000,
      loss: 0,
      transactions: 89,
    },
    {
      module: "Transport",
      totalIncome: 1000000,
      totalExpense: 700000,
      profit: 300000,
      loss: 0,
      transactions: 45,
    },
    {
      module: "Tickets",
      totalIncome: 4400000,
      totalExpense: 3400000,
      profit: 1000000,
      loss: 0,
      transactions: 234,
    },
    {
      module: "Umrah Packages",
      totalIncome: 8500000,
      totalExpense: 6200000,
      profit: 2300000,
      loss: 0,
      transactions: 67,
    },
  ];

  const totalIncome = profitLossData.reduce((sum, item) => sum + item.totalIncome, 0);
  const totalExpense = profitLossData.reduce((sum, item) => sum + item.totalExpense, 0);
  const totalProfit = profitLossData.reduce((sum, item) => sum + item.profit, 0);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <h2 className="fw-bold mb-0">Profit & Loss Reports</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-success" size="sm">
            <Download size={16} className="me-1" />
            Export CSV
          </Button>
          <Button variant="outline-danger" size="sm">
            <Download size={16} className="me-1" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3} sm={6} xs={12}>
              <Form.Label className="small fw-semibold">From Date</Form.Label>
              <Form.Control
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </Col>
            <Col md={3} sm={6} xs={12}>
              <Form.Label className="small fw-semibold">To Date</Form.Label>
              <Form.Control
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </Col>
            <Col md={3} sm={6} xs={12}>
              <Form.Label className="small fw-semibold">Module</Form.Label>
              <Form.Select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
                <option value="all">All Modules</option>
                <option value="hotels">Hotels</option>
                <option value="visas">Visas</option>
                <option value="transport">Transport</option>
                <option value="tickets">Tickets</option>
                <option value="umrah">Umrah Packages</option>
              </Form.Select>
            </Col>
            <Col md={3} sm={6} xs={12} className="d-flex align-items-end gap-2">
              <Button 
                variant="primary" 
                className="flex-grow-1"
                onClick={handleGenerateReport}
              >
                Generate Report
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowMoreFilters(!showMoreFilters)}
              >
                <Filter size={16} />
              </Button>
            </Col>
          </Row>

          {/* Advanced Filters */}
          {showMoreFilters && (
            <Row className="g-3 mt-2 pt-3 border-top">
              <Col md={4}>
                <Form.Label className="small fw-semibold">Branch</Form.Label>
                <Form.Select 
                  value={advancedFilters.branch} 
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, branch: e.target.value })}
                >
                  <option value="all">All Branches</option>
                  <option value="islamabad">Islamabad</option>
                  <option value="lahore">Lahore</option>
                  <option value="karachi">Karachi</option>
                  <option value="rawalpindi">Rawalpindi</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">Profit Range</Form.Label>
                <Form.Select 
                  value={advancedFilters.profitRange} 
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, profitRange: e.target.value })}
                >
                  <option value="all">All Ranges</option>
                  <option value="0-500000">0 - 500,000 PKR</option>
                  <option value="500000-1000000">500,000 - 1,000,000 PKR</option>
                  <option value="1000000-2000000">1,000,000 - 2,000,000 PKR</option>
                  <option value="2000000+">2,000,000+ PKR</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">Transaction Count</Form.Label>
                <Form.Select 
                  value={advancedFilters.transactionCount} 
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, transactionCount: e.target.value })}
                >
                  <option value="all">All Counts</option>
                  <option value="0-50">0 - 50</option>
                  <option value="50-100">50 - 100</option>
                  <option value="100-200">100 - 200</option>
                  <option value="200+">200+</option>
                </Form.Select>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: "#d4edda" }}>
            <Card.Body>
              <h6 className="text-muted mb-2">Total Income</h6>
              <h3 className="fw-bold text-success mb-0">Rs. {totalIncome.toLocaleString()}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: "#f8d7da" }}>
            <Card.Body>
              <h6 className="text-muted mb-2">Total Expense</h6>
              <h3 className="fw-bold text-danger mb-0">Rs. {totalExpense.toLocaleString()}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: "#d1ecf1" }}>
            <Card.Body>
              <h6 className="text-muted mb-2">Net Profit</h6>
              <h3 className="fw-bold text-primary mb-0">Rs. {totalProfit.toLocaleString()}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h5 className="fw-semibold mb-3">Module-wise Breakdown</h5>
          <Table responsive hover className="finance-table">
            <thead className="table-light">
              <tr>
                <th>Module</th>
                <th>Total Income</th>
                <th>Total Expense</th>
                <th>Profit</th>
                <th>Loss</th>
                <th>Transactions</th>
                <th>Profit Margin</th>
              </tr>
            </thead>
            <tbody>
              {profitLossData.map((item, index) => {
                const profitMargin = ((item.profit / item.totalIncome) * 100).toFixed(2);
                return (
                  <tr key={index}>
                    <td className="fw-semibold">{item.module}</td>
                    <td className="text-success">Rs. {item.totalIncome.toLocaleString()}</td>
                    <td className="text-danger">Rs. {item.totalExpense.toLocaleString()}</td>
                    <td className="fw-bold text-primary">Rs. {item.profit.toLocaleString()}</td>
                    <td>Rs. {item.loss.toLocaleString()}</td>
                    <td>{item.transactions}</td>
                    <td>
                      <span className="badge bg-success">{profitMargin}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="table-light fw-bold">
              <tr>
                <td>TOTAL</td>
                <td className="text-success">Rs. {totalIncome.toLocaleString()}</td>
                <td className="text-danger">Rs. {totalExpense.toLocaleString()}</td>
                <td className="text-primary">Rs. {totalProfit.toLocaleString()}</td>
                <td>Rs. 0</td>
                <td>{profitLossData.reduce((sum, item) => sum + item.transactions, 0)}</td>
                <td>
                  <span className="badge bg-success">
                    {((totalProfit / totalIncome) * 100).toFixed(2)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
      </Card>

      {/* Generate Report Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Profit & Loss Report Generated</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <div className="mb-3">
              <span className="badge bg-success fs-5 p-3">
                ✓ Report Successfully Generated
              </span>
            </div>
          </div>

          <Card className="border-0 bg-light mb-3">
            <Card.Body>
              <h6 className="fw-bold mb-3">Report Parameters:</h6>
              <Row className="g-2">
                <Col md={6}>
                  <p className="mb-1"><strong>Date Range:</strong></p>
                  <p className="text-muted">{dateRange.from} to {dateRange.to}</p>
                </Col>
                <Col md={6}>
                  <p className="mb-1"><strong>Module:</strong></p>
                  <p className="text-muted">{selectedModule === "all" ? "All Modules" : selectedModule}</p>
                </Col>
                {advancedFilters.branch !== "all" && (
                  <Col md={6}>
                    <p className="mb-1"><strong>Branch:</strong></p>
                    <p className="text-muted">{advancedFilters.branch}</p>
                  </Col>
                )}
                {advancedFilters.profitRange !== "all" && (
                  <Col md={6}>
                    <p className="mb-1"><strong>Profit Range:</strong></p>
                    <p className="text-muted">{advancedFilters.profitRange}</p>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              <h6 className="fw-bold mb-3">Summary:</h6>
              <Row className="text-center">
                <Col md={4}>
                  <div className="p-3 bg-success bg-opacity-10 rounded">
                    <p className="small text-muted mb-1">Total Income</p>
                    <h5 className="text-success fw-bold mb-0">Rs. {totalIncome.toLocaleString()}</h5>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-danger bg-opacity-10 rounded">
                    <p className="small text-muted mb-1">Total Expense</p>
                    <h5 className="text-danger fw-bold mb-0">Rs. {totalExpense.toLocaleString()}</h5>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-primary bg-opacity-10 rounded">
                    <p className="small text-muted mb-1">Net Profit</p>
                    <h5 className="text-primary fw-bold mb-0">Rs. {totalProfit.toLocaleString()}</h5>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <div className="alert alert-info mb-0">
            <strong>📊 Note:</strong> The detailed report is displayed in the table below. You can export it using the CSV or PDF export buttons.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-success" onClick={() => setShowReportModal(false)}>
            <Download size={16} className="me-2" />
            Export CSV
          </Button>
          <Button variant="outline-danger" onClick={() => setShowReportModal(false)}>
            <Download size={16} className="me-2" />
            Export PDF
          </Button>
          <Button variant="primary" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// 3. Financial Ledger
const FinancialLedger = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: "",
    dateTo: "",
    type: "all",
    agent: "all",
    amountRange: "all",
  });

  const ledgerEntries = [
    {
      date: "2025-10-28",
      referenceNo: "SAER-HTL-00145",
      module: "Hotel",
      description: "Madinah Oberoi Hotel - 5 Nights Booking",
      agentName: "Al-Haramain Tours",
      income: 150000,
      expense: 0,
      balance: 150000,
      type: "income",
    },
    {
      date: "2025-10-28",
      referenceNo: "SAER-HTL-00145-EXP",
      module: "Hotel",
      description: "Hotel Payment to Supplier",
      agentName: "Al-Haramain Tours",
      income: 0,
      expense: 95000,
      balance: 55000,
      type: "expense",
    },
    {
      date: "2025-10-27",
      referenceNo: "SAER-TKT-00289",
      module: "Ticket",
      description: "ISB-JED Flight Booking - Saudi Airlines",
      agentName: "Makkah Express",
      income: 95000,
      expense: 0,
      balance: 150000,
      type: "income",
    },
    {
      date: "2025-10-27",
      referenceNo: "SAER-TKT-00289-EXP",
      module: "Ticket",
      description: "Airline Payment",
      agentName: "Makkah Express",
      income: 0,
      expense: 78000,
      balance: 72000,
      type: "expense",
    },
    {
      date: "2025-10-26",
      referenceNo: "SAER-VIS-00112",
      module: "Visa",
      description: "Umrah Visa Processing - 10 PAX",
      agentName: "Safar Tours",
      income: 80000,
      expense: 0,
      balance: 150000,
      type: "income",
    },
    {
      date: "2025-10-26",
      referenceNo: "SAER-VIS-00112-EXP",
      module: "Visa",
      description: "Visa Fee Payment to Embassy",
      agentName: "Safar Tours",
      income: 0,
      expense: 65000,
      balance: 85000,
      type: "expense",
    },
    {
      date: "2025-10-25",
      referenceNo: "SAER-TRN-00067",
      module: "Transport",
      description: "Airport Transfer - Jeddah to Makkah",
      agentName: "Rihla Travel",
      income: 25000,
      expense: 0,
      balance: 110000,
      type: "income",
    },
    {
      date: "2025-10-25",
      referenceNo: "SAER-TRN-00067-EXP",
      module: "Transport",
      description: "Fuel & Driver Payment",
      agentName: "Rihla Travel",
      income: 0,
      expense: 15000,
      balance: 95000,
      type: "expense",
    },
    {
      date: "2025-10-24",
      referenceNo: "SAER-UMR-00023",
      module: "Umrah Package",
      description: "Complete Umrah Package - 15 Days",
      agentName: "Ziyarat Services",
      income: 450000,
      expense: 0,
      balance: 545000,
      type: "income",
    },
    {
      date: "2025-10-24",
      referenceNo: "SAER-UMR-00023-EXP",
      module: "Umrah Package",
      description: "Package Expenses (Hotel+Ticket+Visa+Transport)",
      agentName: "Ziyarat Services",
      income: 0,
      expense: 320000,
      balance: 225000,
      type: "expense",
    },
  ];

  const filteredLedger = ledgerEntries.filter((entry) => {
    const matchesSearch =
      entry.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.agentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === "all" || entry.module.toLowerCase() === moduleFilter.toLowerCase();
    return matchesSearch && matchesModule;
  });

  return (
    <div>
      <h2 className="fw-bold mb-4">Financial Ledger</h2>

      {/* Search and Filter */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6} xs={12}>
              <div className="position-relative">
                <Search className="position-absolute" size={18} style={{ left: 12, top: 12 }} />
                <Form.Control
                  type="text"
                  placeholder="Search by Reference No, Description, or Agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </Col>
            <Col md={3} sm={6} xs={12}>
              <Form.Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                <option value="all">All Modules</option>
                <option value="hotel">Hotels</option>
                <option value="visa">Visas</option>
                <option value="transport">Transport</option>
                <option value="ticket">Tickets</option>
                <option value="umrah package">Umrah Packages</option>
              </Form.Select>
            </Col>
            <Col md={3} sm={6} xs={12}>
              <Button 
                variant="outline-primary" 
                className="w-100"
                onClick={() => setShowMoreFilters(!showMoreFilters)}
              >
                <Filter size={16} className="me-2" />
                {showMoreFilters ? "Hide Filters" : "More Filters"}
              </Button>
            </Col>
          </Row>

          {/* Advanced Filters */}
          {showMoreFilters && (
            <Row className="g-3 mt-2 pt-3 border-top">
              <Col md={3}>
                <Form.Label className="small fw-semibold">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={advancedFilters.dateFrom}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateFrom: e.target.value })}
                />
              </Col>
              <Col md={3}>
                <Form.Label className="small fw-semibold">To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={advancedFilters.dateTo}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateTo: e.target.value })}
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-semibold">Type</Form.Label>
                <Form.Select 
                  value={advancedFilters.type} 
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, type: e.target.value })}
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-semibold">Agent</Form.Label>
                <Form.Select 
                  value={advancedFilters.agent} 
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, agent: e.target.value })}
                >
                  <option value="all">All Agents</option>
                  <option value="al-haramain">Al-Haramain Tours</option>
                  <option value="makkah">Makkah Express</option>
                  <option value="safar">Safar Tours</option>
                  <option value="rihla">Rihla Travel</option>
                  <option value="ziyarat">Ziyarat Services</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-semibold">Amount Range</Form.Label>
                <Form.Select 
                  value={advancedFilters.amountRange} 
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, amountRange: e.target.value })}
                >
                  <option value="all">All Amounts</option>
                  <option value="0-50000">0 - 50,000</option>
                  <option value="50000-100000">50,000 - 100,000</option>
                  <option value="100000-200000">100,000 - 200,000</option>
                  <option value="200000+">200,000+</option>
                </Form.Select>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Ledger Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <h5 className="fw-semibold mb-0">All Transactions ({filteredLedger.length})</h5>
            <div className="d-flex gap-2">
              <Button variant="outline-success" size="sm">
                <Download size={16} className="me-1" />
                Export CSV
              </Button>
              <Button variant="outline-danger" size="sm">
                <Download size={16} className="me-1" />
                Export PDF
              </Button>
            </div>
          </div>
          <Table responsive hover className="finance-table">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Reference No</th>
                <th>Module</th>
                <th>Description</th>
                <th>Agent/Branch</th>
                <th>Income</th>
                <th>Expense</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.date}</td>
                  <td className="fw-semibold text-primary">{entry.referenceNo}</td>
                  <td>
                    <Badge bg="secondary">{entry.module}</Badge>
                  </td>
                  <td>{entry.description}</td>
                  <td>{entry.agentName}</td>
                  <td className="text-success fw-bold">
                    {entry.income > 0 ? `Rs. ${entry.income.toLocaleString()}` : "—"}
                  </td>
                  <td className="text-danger fw-bold">
                    {entry.expense > 0 ? `Rs. ${entry.expense.toLocaleString()}` : "—"}
                  </td>
                  <td className="fw-bold">Rs. {entry.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

// 4. Expense Management
const ExpenseManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseFilter, setExpenseFilter] = useState("all");

  const expenses = [
    {
      id: 1,
      date: "2025-10-28",
      expenseType: "Staff Salary",
      moduleType: "General",
      description: "October Monthly Salaries - Admin Staff",
      amount: 450000,
      paymentMode: "Bank Transfer",
      paidTo: "Employee Accounts",
      status: "Paid",
      approvedBy: "Admin Manager",
    },
    {
      id: 2,
      date: "2025-10-27",
      expenseType: "Hotel Cleaning",
      moduleType: "Hotel",
      description: "Room Cleaning Services - Makkah Hotels",
      amount: 25000,
      paymentMode: "Cash",
      paidTo: "Cleaning Vendor",
      status: "Paid",
      approvedBy: "Hotel Manager",
    },
    {
      id: 3,
      expenseType: "Fuel Cost",
      moduleType: "Transport",
      description: "Fuel for Airport Transfers - October",
      amount: 35000,
      paymentMode: "Cash",
      paidTo: "Petrol Pump",
      status: "Paid",
      approvedBy: "Transport Manager",
      date: "2025-10-26",
    },
    {
      id: 4,
      expenseType: "Visa Fee",
      moduleType: "Visa",
      description: "Embassy Visa Processing Charges",
      amount: 180000,
      paymentMode: "Bank",
      paidTo: "Saudi Embassy",
      status: "Pending",
      approvedBy: "Visa Manager",
      date: "2025-10-25",
    },
    {
      id: 5,
      expenseType: "Office Maintenance",
      moduleType: "General",
      description: "Office Repairs & Maintenance",
      amount: 55000,
      paymentMode: "Cash",
      paidTo: "Maintenance Company",
      status: "Paid",
      approvedBy: "Admin Manager",
      date: "2025-10-24",
    },
    {
      id: 6,
      expenseType: "Electricity Bill",
      moduleType: "General",
      description: "September Electricity Bill",
      amount: 42000,
      paymentMode: "Bank",
      paidTo: "WAPDA",
      status: "Paid",
      approvedBy: "Finance Manager",
      date: "2025-10-23",
    },
  ];

  const filteredExpenses = expenses.filter((exp) => {
    if (expenseFilter === "all") return true;
    return exp.status.toLowerCase() === expenseFilter.toLowerCase();
  });

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paidExpense = expenses.filter((e) => e.status === "Paid").reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpense = expenses.filter((e) => e.status === "Pending").reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <h2 className="fw-bold mb-0">Expense Management</h2>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-success" size="sm">
            <Download size={16} className="me-1" />
            Export CSV
          </Button>
          <Button variant="outline-danger" size="sm">
            <Download size={16} className="me-1" />
            Export PDF
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            + Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col md={4} sm={6} xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-2">Total Expenses</h6>
              <h4 className="fw-bold mb-0">Rs. {totalExpense.toLocaleString()}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} sm={6} xs={12}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: "#d4edda" }}>
            <Card.Body>
              <h6 className="text-muted mb-2">Paid Expenses</h6>
              <h4 className="fw-bold text-success mb-0">Rs. {paidExpense.toLocaleString()}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} sm={6} xs={12}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: "#fff3cd" }}>
            <Card.Body>
              <h6 className="text-muted mb-2">Pending Expenses</h6>
              <h4 className="fw-bold text-warning mb-0">Rs. {pendingExpense.toLocaleString()}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Tabs */}
      <div className="mb-3">
        <Button
          variant={expenseFilter === "all" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setExpenseFilter("all")}
        >
          All ({expenses.length})
        </Button>
        <Button
          variant={expenseFilter === "paid" ? "success" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setExpenseFilter("paid")}
        >
          Paid ({expenses.filter((e) => e.status === "Paid").length})
        </Button>
        <Button
          variant={expenseFilter === "pending" ? "warning" : "outline-secondary"}
          size="sm"
          onClick={() => setExpenseFilter("pending")}
        >
          Pending ({expenses.filter((e) => e.status === "Pending").length})
        </Button>
      </div>

      {/* Expenses Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Table responsive hover className="finance-table">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Expense Type</th>
                <th>Module</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Paid To</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.date}</td>
                  <td className="fw-semibold">{expense.expenseType}</td>
                  <td>
                    <Badge bg="info">{expense.moduleType}</Badge>
                  </td>
                  <td>{expense.description}</td>
                  <td className="fw-bold text-danger">Rs. {expense.amount.toLocaleString()}</td>
                  <td>{expense.paymentMode}</td>
                  <td>{expense.paidTo}</td>
                  <td>
                    <Badge bg={expense.status === "Paid" ? "success" : "warning"}>
                      {expense.status}
                    </Badge>
                  </td>
                  <td className="small">{expense.approvedBy}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add Expense Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="date" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Expense Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select required>
                    <option value="">Select Type</option>
                    <option value="salary">Staff Salary</option>
                    <option value="cleaning">Hotel Cleaning</option>
                    <option value="fuel">Fuel Cost</option>
                    <option value="visa-fee">Visa Fee</option>
                    <option value="maintenance">Office Maintenance</option>
                    <option value="utilities">Utilities (Electricity, Water, Gas)</option>
                    <option value="rent">Office Rent</option>
                    <option value="supplies">Office Supplies</option>
                    <option value="marketing">Marketing & Advertising</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Module Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select required>
                    <option value="">Select Module</option>
                    <option value="general">General</option>
                    <option value="hotel">Hotel</option>
                    <option value="visa">Visa</option>
                    <option value="transport">Transport</option>
                    <option value="ticket">Ticket</option>
                    <option value="umrah">Umrah Package</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Amount (PKR) <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="number" placeholder="Enter amount" required />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control as="textarea" rows={2} placeholder="Enter expense description" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Payment Mode <span className="text-danger">*</span></Form.Label>
                  <Form.Select required>
                    <option value="">Select Payment Mode</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="online">Online Payment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Paid To <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" placeholder="Enter recipient name" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                  <Form.Select required>
                    <option value="">Select Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Approved By</Form.Label>
                  <Form.Control type="text" placeholder="Enter approver name" />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Attach Receipt/Invoice (Optional)</Form.Label>
                  <Form.Control type="file" accept=".pdf,.jpg,.jpeg,.png" />
                  <Form.Text className="text-muted">
                    Accepted formats: PDF, JPG, PNG (Max 5MB)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(false)}>
            Add Expense
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedExpense && (
            <Form>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="date" defaultValue={selectedExpense.date} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Expense Type <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="text" defaultValue={selectedExpense.expenseType} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Module Type <span className="text-danger">*</span></Form.Label>
                    <Form.Select defaultValue={selectedExpense.moduleType.toLowerCase()} required>
                      <option value="general">General</option>
                      <option value="hotel">Hotel</option>
                      <option value="visa">Visa</option>
                      <option value="transport">Transport</option>
                      <option value="ticket">Ticket</option>
                      <option value="umrah">Umrah Package</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Amount (PKR) <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="number" defaultValue={selectedExpense.amount} required />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                    <Form.Control as="textarea" rows={2} defaultValue={selectedExpense.description} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Payment Mode <span className="text-danger">*</span></Form.Label>
                    <Form.Select defaultValue={selectedExpense.paymentMode.toLowerCase().replace(' ', '-')} required>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="online">Online Payment</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Paid To <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="text" defaultValue={selectedExpense.paidTo} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                    <Form.Select defaultValue={selectedExpense.status.toLowerCase()} required>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Approved By</Form.Label>
                    <Form.Control type="text" defaultValue={selectedExpense.approvedBy} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setShowEditModal(false)}>
            Update Expense
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedExpense && (
            <div>
              <p>Are you sure you want to delete this expense?</p>
              <div className="bg-light p-3 rounded">
                <p className="mb-1"><strong>Expense Type:</strong> {selectedExpense.expenseType}</p>
                <p className="mb-1"><strong>Amount:</strong> Rs. {selectedExpense.amount.toLocaleString()}</p>
                <p className="mb-1"><strong>Description:</strong> {selectedExpense.description}</p>
                <p className="mb-0"><strong>Date:</strong> {selectedExpense.date}</p>
              </div>
              <p className="text-danger mt-3 mb-0">
                <small>⚠️ This action cannot be undone.</small>
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(false)}>
            Delete Expense
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// 5. Manual Posting
const ManualPosting = () => {
  const [postingData, setPostingData] = useState({
    date: "",
    branch: "",
    debitAccount: "",
    creditAccount: "",
    amount: "",
    description: "",
  });

  const recentPostings = [
    {
      id: 1,
      date: "2025-10-28",
      branch: "Islamabad Branch",
      debit: "Office Renovation Expense",
      credit: "Cash",
      amount: 120000,
      description: "Renovation of Islamabad branch office",
      postedBy: "Finance Manager",
    },
    {
      id: 2,
      date: "2025-10-25",
      branch: "Karachi Branch",
      debit: "Furniture & Fixtures",
      credit: "Bank Account",
      amount: 85000,
      description: "New office furniture purchase",
      postedBy: "Admin Manager",
    },
    {
      id: 3,
      date: "2025-10-20",
      branch: "Lahore Branch",
      debit: "Computer Equipment",
      credit: "Cash",
      amount: 95000,
      description: "5 new computers for staff",
      postedBy: "IT Manager",
    },
  ];

  const chartOfAccounts = [
    "Cash",
    "Bank Account",
    "Accounts Receivable",
    "Office Equipment",
    "Furniture & Fixtures",
    "Computer Equipment",
    "Accounts Payable",
    "Staff Salary Expense",
    "Office Renovation Expense",
    "Utility Expense",
    "Umrah Income",
    "Hotel Income",
    "Ticket Income",
    "Visa Income",
    "Transport Income",
  ];

  return (
    <div>
      <h2 className="fw-bold mb-4">Manual Posting</h2>

      <Row className="g-4">
        {/* Posting Form */}
        <Col md={5} xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-semibold mb-4">Create New Posting</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={postingData.date}
                    onChange={(e) => setPostingData({ ...postingData, date: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Branch</Form.Label>
                  <Form.Select
                    value={postingData.branch}
                    onChange={(e) => setPostingData({ ...postingData, branch: e.target.value })}
                  >
                    <option value="">Select Branch</option>
                    <option value="islamabad">Islamabad Branch</option>
                    <option value="karachi">Karachi Branch</option>
                    <option value="lahore">Lahore Branch</option>
                    <option value="faisalabad">Faisalabad Branch</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Debit Account</Form.Label>
                  <Form.Select
                    value={postingData.debitAccount}
                    onChange={(e) => setPostingData({ ...postingData, debitAccount: e.target.value })}
                  >
                    <option value="">Select Debit Account</option>
                    {chartOfAccounts.map((account, idx) => (
                      <option key={idx} value={account}>
                        {account}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Credit Account</Form.Label>
                  <Form.Select
                    value={postingData.creditAccount}
                    onChange={(e) => setPostingData({ ...postingData, creditAccount: e.target.value })}
                  >
                    <option value="">Select Credit Account</option>
                    {chartOfAccounts.map((account, idx) => (
                      <option key={idx} value={account}>
                        {account}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Amount (Rs.)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter amount"
                    value={postingData.amount}
                    onChange={(e) => setPostingData({ ...postingData, amount: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter description..."
                    value={postingData.description}
                    onChange={(e) => setPostingData({ ...postingData, description: e.target.value })}
                  />
                </Form.Group>

                <Button variant="primary" className="w-100">
                  Post Entry
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Postings */}
        <Col md={7} xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <h5 className="fw-semibold mb-0">Recent Manual Postings</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-success" size="sm">
                    <Download size={16} className="me-1" />
                    Export CSV
                  </Button>
                  <Button variant="outline-danger" size="sm">
                    <Download size={16} className="me-1" />
                    Export PDF
                  </Button>
                </div>
              </div>
              <Table responsive hover className="finance-table">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Branch</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Amount</th>
                    <th>Posted By</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPostings.map((posting) => (
                    <tr key={posting.id}>
                      <td>{posting.date}</td>
                      <td className="small">{posting.branch}</td>
                      <td className="fw-semibold text-danger small">{posting.debit}</td>
                      <td className="fw-semibold text-success small">{posting.credit}</td>
                      <td className="fw-bold">Rs. {posting.amount.toLocaleString()}</td>
                      <td className="small">{posting.postedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// 6. Tax Reports
const TaxReports = () => {
  const [selectedYear, setSelectedYear] = useState("2025");

  const taxSummary = {
    totalSales: 20900000,
    salesTax: 3135000, // 15% of sales
    incomeTax: 4180000, // 20% of profit
    withholdingTax: 418000, // 10% on certain payments
    totalTaxLiability: 7733000,
  };

  const monthlyTaxData = [
    { month: "January", sales: 1800000, salesTax: 270000, incomeTax: 360000 },
    { month: "February", sales: 1650000, salesTax: 247500, incomeTax: 330000 },
    { month: "March", sales: 1900000, salesTax: 285000, incomeTax: 380000 },
    { month: "April", sales: 1750000, salesTax: 262500, incomeTax: 350000 },
    { month: "May", sales: 1850000, salesTax: 277500, incomeTax: 370000 },
    { month: "June", sales: 2100000, salesTax: 315000, incomeTax: 420000 },
    { month: "July", sales: 1950000, salesTax: 292500, incomeTax: 390000 },
    { month: "August", sales: 2000000, salesTax: 300000, incomeTax: 400000 },
    { month: "September", sales: 1900000, salesTax: 285000, incomeTax: 380000 },
    { month: "October", sales: 2000000, salesTax: 300000, incomeTax: 400000 },
  ];

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <h2 className="fw-bold mb-0">Tax Reports (FBR)</h2>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Form.Select style={{ width: "150px" }} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="2025">Year 2025</option>
            <option value="2024">Year 2024</option>
            <option value="2023">Year 2023</option>
          </Form.Select>
          <Button variant="outline-success" size="sm">
            <Download size={16} className="me-1" />
            Export CSV
          </Button>
          <Button variant="outline-danger" size="sm">
            <Download size={16} className="me-1" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6} xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-2">Total Sales</h6>
              <h4 className="fw-bold mb-0">Rs. {taxSummary.totalSales.toLocaleString()}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} xs={12}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: "#fff3cd" }}>
            <Card.Body>
              <h6 className="text-muted mb-2">Sales Tax (15%)</h6>
              <h4 className="fw-bold text-warning mb-0">Rs. {taxSummary.salesTax.toLocaleString()}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} xs={12}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: "#f8d7da" }}>
            <Card.Body>
              <h6 className="text-muted mb-2">Income Tax (20%)</h6>
              <h4 className="fw-bold text-danger mb-0">Rs. {taxSummary.incomeTax.toLocaleString()}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} xs={12}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: "#d1ecf1" }}>
            <Card.Body>
              <h6 className="text-muted mb-2">Total Tax Liability</h6>
              <h4 className="fw-bold text-primary mb-0">Rs. {taxSummary.totalTaxLiability.toLocaleString()}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Monthly Tax Breakdown */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h5 className="fw-semibold mb-3">Monthly Tax Breakdown - {selectedYear}</h5>
          <Table responsive hover className="finance-table">
            <thead className="table-light">
              <tr>
                <th>Month</th>
                <th>Total Sales</th>
                <th>Sales Tax (15%)</th>
                <th>Income Tax (20%)</th>
                <th>Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTaxData.map((data, index) => (
                <tr key={index}>
                  <td className="fw-semibold">{data.month}</td>
                  <td>Rs. {data.sales.toLocaleString()}</td>
                  <td className="text-warning">Rs. {data.salesTax.toLocaleString()}</td>
                  <td className="text-danger">Rs. {data.incomeTax.toLocaleString()}</td>
                  <td className="fw-bold">Rs. {(data.salesTax + data.incomeTax).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light fw-bold">
              <tr>
                <td>TOTAL (10 Months)</td>
                <td>Rs. {monthlyTaxData.reduce((sum, d) => sum + d.sales, 0).toLocaleString()}</td>
                <td className="text-warning">
                  Rs. {monthlyTaxData.reduce((sum, d) => sum + d.salesTax, 0).toLocaleString()}
                </td>
                <td className="text-danger">
                  Rs. {monthlyTaxData.reduce((sum, d) => sum + d.incomeTax, 0).toLocaleString()}
                </td>
                <td className="text-primary">
                  Rs.{" "}
                  {monthlyTaxData.reduce((sum, d) => sum + d.salesTax + d.incomeTax, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

// 7. Balance Sheet
const BalanceSheet = () => {
  const [asOfDate, setAsOfDate] = useState("2025-10-31");

  const balanceSheetData = {
    assets: {
      currentAssets: [
        { name: "Cash in Hand", amount: 850000 },
        { name: "Bank Accounts", amount: 4500000 },
        { name: "Accounts Receivable", amount: 1200000 },
        { name: "Advance Payments", amount: 350000 },
      ],
      fixedAssets: [
        { name: "Office Equipment", amount: 650000 },
        { name: "Furniture & Fixtures", amount: 420000 },
        { name: "Computer Equipment", amount: 380000 },
        { name: "Vehicles", amount: 2200000 },
      ],
    },
    liabilities: {
      currentLiabilities: [
        { name: "Accounts Payable", amount: 980000 },
        { name: "Customer Advances", amount: 550000 },
        { name: "Tax Payable", amount: 320000 },
        { name: "Salaries Payable", amount: 450000 },
      ],
      longTermLiabilities: [
        { name: "Bank Loan", amount: 1500000 },
        { name: "Vehicle Loan", amount: 800000 },
      ],
    },
    equity: [
      { name: "Owner's Capital", amount: 5000000 },
      { name: "Retained Earnings", amount: 1550000 },
    ],
  };

  const totalCurrentAssets = balanceSheetData.assets.currentAssets.reduce((sum, a) => sum + a.amount, 0);
  const totalFixedAssets = balanceSheetData.assets.fixedAssets.reduce((sum, a) => sum + a.amount, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities = balanceSheetData.liabilities.currentLiabilities.reduce(
    (sum, l) => sum + l.amount,
    0
  );
  const totalLongTermLiabilities = balanceSheetData.liabilities.longTermLiabilities.reduce(
    (sum, l) => sum + l.amount,
    0
  );
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const totalEquity = balanceSheetData.equity.reduce((sum, e) => sum + e.amount, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <h2 className="fw-bold mb-0">Balance Sheet</h2>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className="text-muted">As of:</span>
          <Form.Control
            type="date"
            style={{ width: "180px" }}
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
          />
          <Button variant="outline-success" size="sm">
            <Download size={16} className="me-1" />
            Export CSV
          </Button>
          <Button variant="outline-danger" size="sm">
            <Download size={16} className="me-1" />
            Export PDF
          </Button>
        </div>
      </div>

      <Row className="g-4">
        {/* Assets */}
        <Col md={6} xs={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h4 className="fw-bold text-success mb-4">ASSETS</h4>

              <h6 className="fw-semibold mb-3">Current Assets</h6>
              {balanceSheetData.assets.currentAssets.map((asset, idx) => (
                <div key={idx} className="d-flex justify-content-between mb-2">
                  <span>{asset.name}</span>
                  <span className="fw-semibold">Rs. {asset.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="d-flex justify-content-between mb-4 pt-2 border-top">
                <span className="fw-bold">Total Current Assets</span>
                <span className="fw-bold text-success">Rs. {totalCurrentAssets.toLocaleString()}</span>
              </div>

              <h6 className="fw-semibold mb-3">Fixed Assets</h6>
              {balanceSheetData.assets.fixedAssets.map((asset, idx) => (
                <div key={idx} className="d-flex justify-content-between mb-2">
                  <span>{asset.name}</span>
                  <span className="fw-semibold">Rs. {asset.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="d-flex justify-content-between mb-4 pt-2 border-top">
                <span className="fw-bold">Total Fixed Assets</span>
                <span className="fw-bold text-success">Rs. {totalFixedAssets.toLocaleString()}</span>
              </div>

              <div className="d-flex justify-content-between pt-3 border-top border-2">
                <h5 className="fw-bold mb-0">TOTAL ASSETS</h5>
                <h5 className="fw-bold text-success mb-0">Rs. {totalAssets.toLocaleString()}</h5>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Liabilities & Equity */}
        <Col md={6} xs={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h4 className="fw-bold text-danger mb-4">LIABILITIES & EQUITY</h4>

              <h6 className="fw-semibold mb-3">Current Liabilities</h6>
              {balanceSheetData.liabilities.currentLiabilities.map((liability, idx) => (
                <div key={idx} className="d-flex justify-content-between mb-2">
                  <span>{liability.name}</span>
                  <span className="fw-semibold">Rs. {liability.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="d-flex justify-content-between mb-4 pt-2 border-top">
                <span className="fw-bold">Total Current Liabilities</span>
                <span className="fw-bold text-danger">Rs. {totalCurrentLiabilities.toLocaleString()}</span>
              </div>

              <h6 className="fw-semibold mb-3">Long-term Liabilities</h6>
              {balanceSheetData.liabilities.longTermLiabilities.map((liability, idx) => (
                <div key={idx} className="d-flex justify-content-between mb-2">
                  <span>{liability.name}</span>
                  <span className="fw-semibold">Rs. {liability.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="d-flex justify-content-between mb-4 pt-2 border-top">
                <span className="fw-bold">Total Liabilities</span>
                <span className="fw-bold text-danger">Rs. {totalLiabilities.toLocaleString()}</span>
              </div>

              <h6 className="fw-semibold mb-3">Equity</h6>
              {balanceSheetData.equity.map((eq, idx) => (
                <div key={idx} className="d-flex justify-content-between mb-2">
                  <span>{eq.name}</span>
                  <span className="fw-semibold">Rs. {eq.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="d-flex justify-content-between mb-4 pt-2 border-top">
                <span className="fw-bold">Total Equity</span>
                <span className="fw-bold text-primary">Rs. {totalEquity.toLocaleString()}</span>
              </div>

              <div className="d-flex justify-content-between pt-3 border-top border-2">
                <h5 className="fw-bold mb-0">TOTAL LIABILITIES & EQUITY</h5>
                <h5 className="fw-bold text-danger mb-0">Rs. {totalLiabilitiesAndEquity.toLocaleString()}</h5>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Verification */}
      <Card
        className="border-0 shadow-sm mt-4"
        style={{ backgroundColor: totalAssets === totalLiabilitiesAndEquity ? "#d4edda" : "#f8d7da" }}
      >
        <Card.Body className="text-center">
          <h5 className="fw-bold mb-0">
            {totalAssets === totalLiabilitiesAndEquity ? (
              <span className="text-success">✓ Balance Sheet Balanced!</span>
            ) : (
              <span className="text-danger">⚠ Balance Sheet Not Balanced</span>
            )}
          </h5>
        </Card.Body>
      </Card>
    </div>
  );
};

// 8. Audit Trail
const AuditTrail = () => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const auditLogs = [
    {
      id: 1,
      timestamp: "2025-10-28 14:35:22",
      user: "Admin Manager",
      action: "Updated",
      module: "Expense Management",
      recordId: "EXP-00145",
      oldValue: '{"amount": 45000}',
      newValue: '{"amount": 50000}',
      description: "Updated expense amount from Rs. 45,000 to Rs. 50,000",
    },
    {
      id: 2,
      timestamp: "2025-10-28 12:15:08",
      user: "Finance Manager",
      action: "Created",
      module: "Manual Posting",
      recordId: "POST-00089",
      oldValue: null,
      newValue: '{"debit": "Office Renovation", "credit": "Cash", "amount": 120000}',
      description: "Created new manual posting entry",
    },
    {
      id: 3,
      timestamp: "2025-10-27 16:45:33",
      user: "Admin Manager",
      action: "Deleted",
      module: "Financial Ledger",
      recordId: "LED-00234",
      oldValue: '{"amount": 25000, "type": "expense"}',
      newValue: null,
      description: "Deleted duplicate ledger entry",
    },
    {
      id: 4,
      timestamp: "2025-10-27 11:20:15",
      user: "Hotel Manager",
      action: "Updated",
      module: "Profit & Loss",
      recordId: "HTL-00125",
      oldValue: '{"income": 120000, "expense": 90000}',
      newValue: '{"income": 120000, "expense": 95000}',
      description: "Corrected hotel expense calculation",
    },
    {
      id: 5,
      timestamp: "2025-10-26 09:30:45",
      user: "Finance Manager",
      action: "Created",
      module: "Tax Reports",
      recordId: "TAX-OCT-2025",
      oldValue: null,
      newValue: '{"month": "October", "salesTax": 300000, "incomeTax": 400000}',
      description: "Generated October tax report",
    },
    {
      id: 6,
      timestamp: "2025-10-25 15:10:28",
      user: "Admin Manager",
      action: "Updated",
      module: "Balance Sheet",
      recordId: "BS-2025-10",
      oldValue: '{"cashInHand": 800000}',
      newValue: '{"cashInHand": 850000}',
      description: "Updated cash in hand balance",
    },
  ];

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <h2 className="fw-bold mb-0">Audit Trail</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-success" size="sm">
            <Download size={16} className="me-1" />
            Export CSV
          </Button>
          <Button variant="outline-danger" size="sm">
            <Download size={16} className="me-1" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4} sm={6} xs={12}>
              <Form.Control type="date" placeholder="From Date" />
            </Col>
            <Col md={4} sm={6} xs={12}>
              <Form.Control type="date" placeholder="To Date" />
            </Col>
            <Col md={4} sm={6} xs={12}>
              <Form.Select>
                <option value="">All Modules</option>
                <option value="expense">Expense Management</option>
                <option value="ledger">Financial Ledger</option>
                <option value="profit-loss">Profit & Loss</option>
                <option value="manual">Manual Posting</option>
                <option value="tax">Tax Reports</option>
                <option value="balance">Balance Sheet</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h5 className="fw-semibold mb-3">All Changes ({auditLogs.length})</h5>
          <Table responsive hover className="finance-table">
            <thead className="table-light">
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record ID</th>
                <th>Description</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="small">{log.timestamp}</td>
                  <td className="fw-semibold">{log.user}</td>
                  <td>
                    <Badge
                      bg={
                        log.action === "Created"
                          ? "success"
                          : log.action === "Updated"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="small">{log.module}</td>
                  <td className="text-primary fw-semibold small">{log.recordId}</td>
                  <td className="small">{log.description}</td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailsModal(true);
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Audit Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Audit Log Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <div>
              <Row className="g-3 mb-3">
                <Col md={6}>
                  <div className="p-3 bg-light rounded">
                    <p className="small text-muted mb-1">Timestamp</p>
                    <p className="mb-0 fw-semibold">{selectedLog.timestamp}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-3 bg-light rounded">
                    <p className="small text-muted mb-1">User</p>
                    <p className="mb-0 fw-semibold">{selectedLog.user}</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-light rounded">
                    <p className="small text-muted mb-1">Action</p>
                    <Badge
                      bg={
                        selectedLog.action === "Created"
                          ? "success"
                          : selectedLog.action === "Updated"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {selectedLog.action}
                    </Badge>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-light rounded">
                    <p className="small text-muted mb-1">Module</p>
                    <p className="mb-0 fw-semibold">{selectedLog.module}</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-light rounded">
                    <p className="small text-muted mb-1">Record ID</p>
                    <p className="mb-0 fw-semibold text-primary">{selectedLog.recordId}</p>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="p-3 bg-light rounded">
                    <p className="small text-muted mb-1">Description</p>
                    <p className="mb-0">{selectedLog.description}</p>
                  </div>
                </Col>
              </Row>

              <Row className="g-3">
                {selectedLog.oldValue && (
                  <Col md={selectedLog.newValue ? 6 : 12}>
                    <Card className="border-danger">
                      <Card.Header className="bg-danger text-white">
                        <strong>Old Value</strong>
                      </Card.Header>
                      <Card.Body>
                        <pre className="mb-0" style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(JSON.parse(selectedLog.oldValue), null, 2)}
                        </pre>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
                {selectedLog.newValue && (
                  <Col md={selectedLog.oldValue ? 6 : 12}>
                    <Card className="border-success">
                      <Card.Header className="bg-success text-white">
                        <strong>New Value</strong>
                      </Card.Header>
                      <Card.Body>
                        <pre className="mb-0" style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(JSON.parse(selectedLog.newValue), null, 2)}
                        </pre>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Finance;
