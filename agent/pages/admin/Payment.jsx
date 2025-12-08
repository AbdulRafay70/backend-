import React, { useState } from "react";
import { Dropdown, Table, Button, Form, Modal } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { ArrowBigLeft, Funnel, Search, UploadCloudIcon, Download } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { NavLink } from "react-router-dom";

const Payment = () => {

  const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    { name: "Add Payment", path: "/payment/add-payment", isActive: false },
    { name: "Bank Accounts", path: "/payment/bank-accounts", isActive: false },
    { name: "Kuickpay", path: "/payment/kuickpay", isActive: false },
    { name: "Pending Payments", path: "/payment/pending-payments", isActive: false },
    { name: "Booking History", path: "/payment/booking-history", isActive: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    agencyCode: '',
    orderNo: '',
    fromDate: 'Fri 12/2023',
    toDate: 'Fri 12/2023'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const transactions = [
    {
      date: '12-June-2024',
      orderNo: 'SPKCS0',
      type: 'group ticket',
      narration: 'ihe-dvb-14-aug-ahsan raza',
      debit: 'RS.500,000/',
      credit: '-------',
      balance: '-RS.500,000/'
    },
    {
      date: 'text',
      orderNo: 'text',
      type: 'Umrah Package',
      narration: 'TICKET,VISA,HOTEL AND TRANSPORT',
      debit: 'RS.100,000/',
      credit: '------',
      balance: '-RS.600,000/'
    },
    {
      date: 'text',
      orderNo: '-------',
      type: 'Credit',
      narration: 'AMOUNT DEPOSIT THROUNG',
      debit: '--------',
      credit: 'RS.600,000/',
      balance: 'RS.0/'
    },
    {
      date: 'text',
      orderNo: 'text',
      type: 'Refund',
      narration: 'NIGHT REFUND',
      debit: '--------',
      credit: 'RS.10,000/',
      balance: 'RS.10,000/'
    }
  ];

  const summaryData = {
    totalUmrah: 49,
    totalTickets: 50,
    totalNights: 50,
    shuttleNights: 50,
    closingBalance: 'RS.10,000/'
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              {/* Navigation Tabs */}
              <div className="row ">
            <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
              {/* Navigation Tabs */}
              <nav className="nav flex-wrap gap-2">
                {tabs.map((tab, index) => (
                  <NavLink
                    key={index}
                    to={tab.path}
                    className={`nav-link btn btn-link text-decoration-none px-0 me-3 ${tab.name === "Ledger"
                      ? "text-primary fw-semibold"
                      : "text-muted"
                      }`}
                    style={{ backgroundColor: "transparent" }}
                  >
                    {tab.name}
                  </NavLink>
                ))}
              </nav>

              {/* Search Input */}
              <div className="input-group" style={{ maxWidth: "300px" }}>
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search name, address, job, etc"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className=" min-vh-100">
            {/* Header */}
            <div className="bg-white rounded shadow-sm p-4 mb-4">
              <h2 className="mb-4 fw-bold">Ledger</h2>

              {/* Search Form */}
              <div className="row g-3">
                <div className="col-md-3">
                  <label htmlFor="" className="form-label">Agency Code</label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none px-1 py-2"
                    name="agencyCode"
                    placeholder="Enter Agency Code"
                    value={formData.agencyCode}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-2">
                  <label htmlFor="" className="form-label">Order No.</label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none px-1 py-2"
                    name="orderNo"
                    placeholder="Type Order No."
                    value={formData.orderNo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-2">
                  <label htmlFor="" className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-control rounded shadow-none px-1 py-2"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-2">
                  <label htmlFor="" className="form-label">To Date </label>
                  <input
                    type="date"
                    className="form-control rounded shadow-none px-1 py-2"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleInputChange}
                  />
              </div>
              <div className="col-md-2">
                <label className="form-label text-muted small">&nbsp;</label>
                <button className="btn btn-primary w-100 d-block" style={{ background: "#09559B" }}>
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Content */}
          <div className="bg-white rounded shadow-sm p-4">
            {/* Ledger Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="mb-1">
                  Ledger <span className="text-primary fs-6 ms-3 small">Seer.pk</span>
                </h4>
                <p className="text-muted small mb-0">
                  12-jun-2023 to 15-april-2024
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                  <Download size={14} />
                  Export
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  Add Transaction
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  Edit Transaction
                </button>
              </div>
            </div>

            {/* Transaction Table */}
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="text-muted small fw-normal">
                      Date
                    </th>
                    <th scope="col" className="text-muted small fw-normal">
                      Order No.
                    </th>
                    <th scope="col" className="text-muted small fw-normal">
                      Type
                    </th>
                    <th scope="col" className="text-muted small fw-normal">
                      Narration
                    </th>
                    <th scope="col" className="text-muted small fw-normal">
                      Debit
                    </th>
                    <th scope="col" className="text-muted small fw-normal">
                      Credit
                    </th>
                    <th scope="col" className="text-muted small fw-normal">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="small">{transaction.date}</td>
                      <td className="small">{transaction.orderNo}</td>
                      <td className="small">{transaction.type}</td>
                      <td className="small">{transaction.narration}</td>
                      <td className="small">{transaction.debit}</td>
                      <td className="small">{transaction.credit}</td>
                      <td className="small">{transaction.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="row mt-4 pt-3 border-top">
              <div className="col-md-8">
                <div className="row text-center">
                  <div className="col-3">
                    <div className="text-muted small">Total Umrah</div>
                    <div className="fw-bold">{summaryData.totalUmrah}</div>
                  </div>
                  <div className="col-3">
                    <div className="text-muted small">Total Tickets</div>
                    <div className="fw-bold">{summaryData.totalTickets}</div>
                  </div>
                  <div className="col-3">
                    <div className="text-muted small">Total Nights</div>
                    <div className="fw-bold">{summaryData.totalNights}</div>
                  </div>
                  <div className="col-3">
                    <div className="text-muted small">Shuttle Nights</div>
                    <div className="fw-bold">{summaryData.shuttleNights}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-end">
                <div className="text-muted small">Closing Balance</div>
                <div className="fw-bold fs-5">
                  {summaryData.closingBalance}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
    </div >
  );
};

export default Payment;