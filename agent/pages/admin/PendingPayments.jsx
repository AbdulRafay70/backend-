import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Search,
  Funnel,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";

const PendingPayments = () => {
  const location = useLocation();
  const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    { name: "Add Payment", path: "/payment/add-payment", isActive: false },
    { name: "Bank Accounts", path: "/payment/bank-accounts", isActive: false },
    { name: "Pending Payments", path: "/payment/pending-payments", isActive: false },
    { name: "Booking History", path: "/payment/booking-history", isActive: false },
  ];

  const statusOptions = ["Pending", "Reminders", "Cancel"];
  const [statusFilter, setStatusFilter] = useState("");


  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const payments = [
    {
      id: 1,
      agentId: "36636298",
      agencyName: "92 World Tour",
      agentName: "Amin Hafeez",
      contactNo: "923625416526",
      pendingBalance: "RS.500,000/-",
      status: "pending",
    },
    {
      id: 2,
      agentId: "36636298",
      agencyName: "92 World Tour",
      agentName: "Amin Hafeez",
      contactNo: "923625416526",
      pendingBalance: "RS.500,000/-",
      status: "reminder",
    },
    {
      id: 3,
      agentId: "36636298",
      agencyName: "92 World Tour",
      agentName: "Amin Hafeez",
      contactNo: "923625416526",
      pendingBalance: "RS.500,000/-",
      status: "cancelled",
    },
    {
      id: 4,
      agentId: "36636298",
      agencyName: "92 World Tour",
      agentName: "Amin Hafeez",
      contactNo: "923625416526",
      pendingBalance: "RS.500,000/-",
      status: "pending",
    },
    {
      id: 5,
      agentId: "36636298",
      agencyName: "92 World Tour",
      agentName: "Amin Hafeez",
      contactNo: "923625416526",
      pendingBalance: "RS.500,000/-",
      status: "reminder",
    },
    {
      id: 6,
      agentId: "36636298",
      agencyName: "92 World Tour",
      agentName: "Amin Hafeez",
      contactNo: "923625416526",
      pendingBalance: "RS.500,000/-",
      status: "pending",
    },
    {
      id: 7,
      agentId: "36636298",
      agencyName: "92 World Tour",
      agentName: "Amin Hafeez",
      contactNo: "923625416526",
      pendingBalance: "RS.500,000/-",
      status: "cancelled",
    },
  ];

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus =
      selectedFilter === "all" || payment.status === selectedFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      payment.agentId.includes(searchLower) ||
      payment.agencyName.toLowerCase().includes(searchLower) ||
      payment.agentName.toLowerCase().includes(searchLower) ||
      payment.contactNo.includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const handleFilterChange = (filterValue) => setSelectedFilter(filterValue);

  const handleAction = (action, paymentId = null) => {
    console.log(
      `${action} action triggered`,
      paymentId ? `for payment ${paymentId}` : ""
    );
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
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 ${tab.name === "Pending Payments"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                          }`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        {tab.name}
                      </NavLink>
                    ))}
                  </nav>

                  <div className="input-group" style={{ maxWidth: "300px" }}>
                    <span className="input-group-text">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search agent ID, agency, name, etc"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="container-fluid p-4 rounded-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="mb-0">All Pending Payments</h3>

                  <div className="dropdown border border-black rounded">
                    <Dropdown>
                      <Dropdown.Toggle variant="">
                        <Funnel size={16} className="me-1" />
                        Filters
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {statusOptions.map((status, idx) => (
                          <Dropdown.Item
                            key={idx}
                            onClick={() => setStatusFilter(status)}
                            active={statusFilter === status}
                          >
                            {status}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover text-center">
                    <thead className="">
                      <tr>
                        <th>Agent ID</th>
                        <th>Agency Name</th>
                        <th>Agent Name</th>
                        <th>Contact No.</th>
                        <th>Pending Balance</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.agentId}</td>
                          <td>{payment.agencyName}</td>
                          <td>{payment.agentName}</td>
                          <td>{payment.contactNo}</td>
                          <td className="fw-bold text-success">
                            {payment.pendingBalance}
                          </td>
                          <td>
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="link"
                                className="text-decoration-none p-0"
                              >
                                <Gear size={18} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item className="text-primary">
                                  Add payment
                                </Dropdown.Item>
                                <Dropdown.Item className="text-primary">
                                  Add Notes
                                </Dropdown.Item>
                                <Dropdown.Item className="text-primary">
                                  ID Block
                                </Dropdown.Item>
                                <Dropdown.Item className="text-primary">
                                  Copy SMS
                                </Dropdown.Item>
                                <Dropdown.Item className="text-danger">Cancel</Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredPayments.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">
                      No payments found for the selected filter.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingPayments;
