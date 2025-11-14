import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Calendar, Filter, Download } from "lucide-react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Dropdown } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Link, useNavigate, useLocation } from "react-router-dom";

const AgentBookingGroupTicket = () => {
  const [orderNo, setOrderNo] = useState("");
  const [fromDate, setFromDate] = useState("Fri 12/2023");
  const [toDate, setToDate] = useState("Fri 12/2023");

  const tabs = [
    "Groups Tickets",
    "UMRAH BOOKINGS",
    "Insurance",
    "Trips",
    "VISA",
  ];

  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/booking-history"))
      return "Groups Tickets";
    if (path === "/booking-history/" || path === "/booking-history")
      return "UMRAH BOOKINGS";
    return tabs[0];
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Sync tab state with URL changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Handle tab clicks
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "Groups Tickets") {
      navigate("/booking-history");
    } else if (tab === "UMRAH BOOKINGS") {
      navigate("/booking-history");
    }
  };

  const bookingData = [
    {
      bookingDate: "12-June-2024",
      orderNo: "SPKCS0",
      paxName: "Mr. Ahsan Raza",
      bookingIncluded: "see",
      bookingExpiry: "02-JUNE-2024",
      status: "Active",
      amount: "RS.798,999/-",
    },
    {
      bookingDate: "12-June-2024",
      orderNo: "SPKCS0",
      paxName: "Mr. Ahsan Raza",
      bookingIncluded: "see",
      bookingExpiry: "02-JUNE-2024",
      status: "Inactive",
      amount: "RS.798,999/-",
    },
    {
      bookingDate: "12-June-2024",
      orderNo: "SPKCS0",
      paxName: "Mr. Ahsan Raza",
      bookingIncluded: "see",
      bookingExpiry: "02-JUNE-2024",
      status: "Active",
      amount: "RS.798,999/-",
    },
    {
      bookingDate: "12-June-2024",
      orderNo: "SPKCS0",
      paxName: "Mr. Ahsan Raza",
      bookingIncluded: "see",
      bookingExpiry: "02-JUNE-2024",
      status: "Active",
      amount: "RS.798,999/-",
    },
  ];

  // Status badge styling
  const getStatusStyle = (status) => {
    const isActive = status === "Active";
    return {
      backgroundColor: isActive ? "#ECFDF3" : "#F2F4F7",
      color: isActive ? "#065F46" : "#344054",
      padding: "4px 12px",
      borderRadius: "16px",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
    };
  };

  return (
   <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4">
            <div className="card border-0 rounded-3 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-4">Booking History</h5>

                {/* Search Form */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">   Order No.</label>

                    <input
                      type="text"
                      className="form-control shadow-none"
                      placeholder="Type Order No."
                      value={orderNo}
                      onChange={(e) => setOrderNo(e.target.value)}
                    />
                  </div>

                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">From</label>

                    <div className="input-group">
                      <input
                        type="date"
                        className="form-control shadow-none"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-3">
                    <label htmlFor="" className="Control-label">To</label>

                    <div className="input-group">
                      <input
                        type="date"
                        className="form-control shadow-none"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-3 d-flex align-items-end">
                    <button className="btn w-100" id="btn">Search</button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mb-4">
                  <ul className="nav nav-pills">
                    {tabs.map((tab) => (
                      <li className="nav-item me-2" key={tab}>
                        <button
                          className={`nav-link ${activeTab === tab
                              ? "active"
                              : "btn-outline-secondary"
                            }`}
                          onClick={() => handleTabClick(tab)}
                          style={{
                            backgroundColor:
                              activeTab === tab ? "#4169E1" : "#E1E1E1",
                            color: activeTab === tab ? "#FFFFFF" : "#667085",
                            border: "none",
                            borderRadius: "10px",
                            fontSize: "0.875rem",
                          }}
                        >
                          {tab}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Booking Info Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-1">
                      Booking{" "}
                      <span className="text-primary small">Saair.pk</span>
                    </h6>
                    <small className="text-muted">
                      12-jun-2023 to 15-april-2024
                    </small>
                  </div>
                  <div>
                    <button className="btn btn-outline-secondary btn-sm me-2">
                      <Filter size={16} className="me-1" />
                      Filters
                    </button>
                    <button className="btn btn-outline-secondary btn-sm">
                      <Download size={16} className="me-1" />
                      Export
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th className="text-muted small">Booking Date</th>
                        <th className="text-muted small">Order No.</th>
                        <th className="text-muted small">Pax Name</th>
                        <th className="text-muted small">Booking Included</th>
                        <th className="text-muted small">Booking Expiry</th>
                        <th className="text-muted small">Booking Status</th>
                        <th className="text-muted small">Amount</th>
                        <th className="text-muted small">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.map((booking, index) => (
                        <tr key={index}>
                          <td>{booking.bookingDate}</td>
                          <td>{booking.orderNo}</td>
                          <td>{booking.paxName}</td>
                          <td>
                            <span
                              className="text-primary text-decoration-underline"
                              style={{ cursor: "pointer" }}
                            >
                              {booking.bookingIncluded}
                            </span>
                          </td>
                          <td>{booking.bookingExpiry}</td>
                          <td>
                            <span style={getStatusStyle(booking.status)}>
                              <span
                                style={{
                                  color:
                                    booking.status === "Active"
                                      ? "#12B76A"
                                      : "#667085",
                                }}
                              >
                                ●
                              </span>{" "}
                              {booking.status}
                            </span>
                          </td>
                          <td>{booking.amount}</td>
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
                                  See Booking
                                </Dropdown.Item>
                                <Dropdown.Item className="text-primary">
                                  <Link to="/booking-history/group-tickets/invoice">
                                    Invoice</Link>
                                </Dropdown.Item>
                                <Dropdown.Item className="text-primary">
                                  Download Voucher
                                </Dropdown.Item>
                                <Dropdown.Item className="text-danger">
                                  Cancel Booking
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AgentBookingGroupTicket;
