import React, { useState, useEffect } from "react";
import axios from "axios";
import { Download, EllipsisVertical, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { NavLink } from "react-router-dom";

const BookingHistoryShimmer = () => {
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
              {/* Navigation Tabs Shimmer */}
              <div className="row mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  <div className="d-flex gap-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="shimmer" style={{ width: "100px", height: "38px", borderRadius: "6px" }}></div>
                    ))}
                  </div>
                  <div className="shimmer" style={{ width: "300px", height: "38px", borderRadius: "6px" }}></div>
                </div>
              </div>

              {/* Search Form Shimmer */}
              <div className="container-fluid rounded-4 shadow-sm p-4">
                <div className="shimmer mb-3" style={{ width: "200px", height: "28px", borderRadius: "4px" }}></div>

                <div className="row g-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="col-md-3">
                      <div className="shimmer mb-1" style={{ width: "100px", height: "16px", borderRadius: "4px" }}></div>
                      <div className="shimmer" style={{ width: "100%", height: "40px", borderRadius: "6px" }}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Area Shimmer */}
              <div className="container-fluid rounded-4 shadow-sm p-4 mt-5">
                {/* Tabs Shimmer */}
                <div className="mb-4">
                  <div className="d-flex gap-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="shimmer" style={{ width: "150px", height: "38px", borderRadius: "6px" }}></div>
                    ))}
                  </div>
                </div>

                {/* Card Header Shimmer */}
                <div className="card border-0">
                  <div className="card-header border-0 bg-white d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <div className="shimmer mb-2" style={{ width: "200px", height: "24px", borderRadius: "4px" }}></div>
                      <div className="shimmer" style={{ width: "250px", height: "16px", borderRadius: "4px" }}></div>
                    </div>
                    <div className="shimmer" style={{ width: "120px", height: "38px", borderRadius: "6px" }}></div>
                  </div>

                  {/* Table Shimmer */}
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table text-center table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            {[...Array(8)].map((_, i) => (
                              <th key={i}>
                                <div className="shimmer mx-auto" style={{ width: "80px", height: "20px", borderRadius: "4px" }}></div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...Array(5)].map((_, rowIndex) => (
                            <tr key={rowIndex}>
                              {[...Array(8)].map((_, cellIndex) => (
                                <td key={cellIndex}>
                                  <div className="shimmer mx-auto" style={{ width: "90%", height: "20px", borderRadius: "4px" }}></div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Shimmer */}
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div className="shimmer" style={{ width: "200px", height: "20px", borderRadius: "4px" }}></div>
                      <div className="d-flex gap-1">
                        <div className="shimmer" style={{ width: "38px", height: "38px", borderRadius: "6px" }}></div>
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="shimmer" style={{ width: "38px", height: "38px", borderRadius: "6px" }}></div>
                        ))}
                        <div className="shimmer" style={{ width: "38px", height: "38px", borderRadius: "6px" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shimmer Animation Styles */}
      <style>
        {`
          @keyframes shimmerAnimation {
            0% {
              background-position: -468px 0;
            }
            100% {
              background-position: 468px 0;
            }
          }
          
          .shimmer {
            animation-duration: 1.5s;
            animation-fill-mode: forwards;
            animation-iteration-count: infinite;
            animation-name: shimmerAnimation;
            animation-timing-function: linear;
            background: #f6f7f8;
            background: linear-gradient(to right, #f0f0f0 8%, #e0e0e0 18%, #f0f0f0 33%);
            background-size: 800px 104px;
            position: relative;
          }
        `}
      </style>
    </div>
  );
};

const BookingHistory = () => {
  const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    { name: "Add Payment", path: "/payment/add-payment", isActive: false },
    { name: "Bank Accounts", path: "/payment/bank-accounts", isActive: false },
    { name: "Pending Payments", path: "/payment/pending-payments", isActive: false },
    { name: "Booking History", path: "/payment/booking-history", isActive: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchData, setSearchData] = useState({
    agencyCode: "",
    orderNo: "",
    fromDate: "",
    toDate: "",
  });

  const [activeTab, setActiveTab] = useState("UMRAH BOOKINGS");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    // Filter bookings based on active tab
    const filtered = bookings.filter(booking => {
      if (activeTab === "UMRAH BOOKINGS") {
        return booking.category === "Package";
      } else if (activeTab === "Groups Tickets") {
        return booking.category === "Ticket_Booking";
      }
      return true;
    });
    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [activeTab, bookings]);

  // Get current bookings for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const fetchBookings = async () => {
    try {
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;
      const token = localStorage.getItem("accessToken");

      setLoading(true);
      const response = await axios.get(`https://api.saer.pk/api/bookings/`, {
        params: { organization: organizationId },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      // const response = await axios.get(`https://api.saer.pk/api/bookings/?organization=${k}`);
      setBookings(response.data);
      setFilteredBookings(response.data);
    } catch (err) {
      setError("Failed to fetch bookings. Please try again later.");
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    console.log("Search data:", searchData);
    // Implement search functionality based on searchData
    const filtered = bookings.filter(booking => {
      let matches = true;

      if (searchData.agencyCode && !booking.agency?.includes(searchData.agencyCode)) {
        matches = false;
      }

      if (searchData.orderNo && !booking.booking_number?.includes(searchData.orderNo)) {
        matches = false;
      }

      if (searchData.fromDate && new Date(booking.date) < new Date(searchData.fromDate)) {
        matches = false;
      }

      if (searchData.toDate && new Date(booking.date) > new Date(searchData.toDate)) {
        matches = false;
      }

      // Apply category filter
      if (activeTab === "UMRAH BOOKINGS" && booking.category !== "Package") {
        matches = false;
      } else if (activeTab === "Groups Tickets" && booking.category !== "Ticket_Booking") {
        matches = false;
      }

      return matches;
    });

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page after search
  };

  const getStatusBadge = (status) => {
    if (status === "Active" || status === "Confirmed") {
      return <span className="rounded-5 p-1" style={{ background: "#ECFDF3", color: "#037847" }}>● Active</span>;
    } else if (status === "Inactive" || status === "Cancelled") {
      return <span className="rounded-5 p-1" style={{ background: "#F2F4F7", color: "#364254" }}>● Inactive</span>;
    } else if (status === "Pending") {
      return <span className="rounded-5 p-1" style={{ background: "#FFFAEB", color: "#364254" }}>● Pending</span>;
    }
    return <span className="rounded-5 p-1" style={{ background: "#ECFDF3", color: "#037847" }}>● Active</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return `RS. ${amount.toLocaleString()}/-`;
  };

  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return <BookingHistoryShimmer />;
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

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
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Booking History"
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
              <div className="container-fluid  rounded-4 shadow-sm p-4">
                {/* Header */}
                <h4 className="mb-4 fw-bold">Booking History</h4>

                {/* Search Form */}
                <div className="row g-3">
                  <div className="col-md-3">
                    <label htmlFor="" className="form-label">
                      Agency Code
                    </label>
                    <input
                      type="text"
                      className="form-control rounded shadow-none px-1 py-2"
                      name="agencyCode"
                      placeholder="Enter Agency Code"
                      value={searchData.agencyCode}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-2">
                    <label htmlFor="" className="form-label">
                      Order No.
                    </label>
                    <input
                      type="text"
                      className="form-control rounded shadow-none px-1 py-2"
                      name="orderNo"
                      placeholder="Type Order No."
                      value={searchData.orderNo}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-2">
                    <label htmlFor="" className="form-label">
                      From Date
                    </label>
                    <input
                      type="date"
                      className="form-control rounded shadow-none px-1 py-2"
                      name="fromDate"
                      value={searchData.fromDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-2">
                    <label htmlFor="" className="form-label">
                      To Date
                    </label>
                    <input
                      type="date"
                      className="form-control rounded shadow-none px-1 py-2"
                      name="toDate"
                      value={searchData.toDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label text-muted small">&nbsp;</label>
                    <button
                      className="btn btn-primary w-100 d-block"
                      style={{ background: "#09559B" }}
                      onClick={handleSearch}
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>

              <div className="container-fluid  rounded-4 shadow-sm p-4 mt-5">
                {/* Navigation Tabs */}
                <div className="mb-3">
                  <ul className="nav nav-pills">
                    {[
                      "Groups Tickets",
                      "UMRAH BOOKINGS",
                    ].map((tab) => (
                      <li className="nav-item me-2" key={tab}>
                        <button
                          className={`nav-link rounded-2 ${activeTab === tab ? "active" : ""
                            }`}
                          onClick={() => setActiveTab(tab)}
                          style={{
                            backgroundColor:
                              activeTab === tab ? "#4169E1" : "#E1E1E1",
                            color: activeTab === tab ? "white" : "#667085",
                            border: "none",
                          }}
                        >
                          {tab}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Booking Details */}
                <div className="card border-0">
                  <div className="card-header border-0 bg-white d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-2 fw-bold">
                        Booking <span className="text-primary fw-normal">Saeprk</span>
                      </h6>
                      <small className="text-muted">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length} entries
                      </small>
                    </div>
                    <div>
                      <button className="btn btn-outline-secondary btn-sm">
                        <Download size={'15px'} /> Export
                      </button>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table text-center table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Booking Date</th>
                            <th>Order No.</th>
                            <th>Pax Name</th>
                            <th>Booking Included</th>
                            <th>Booking Expiry</th>
                            <th>Booking Status</th>
                            <th>Amount</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentBookings.length > 0 ? (
                            currentBookings.map((booking) => (
                              <tr key={booking.id}>
                                <td>{formatDate(booking.date)}</td>
                                <td>{booking.booking_number || "N/A"}</td>
                                <td>
                                  {booking.person_details && booking.person_details.length > 0
                                    ? `${booking.person_details[0].first_name || ''} ${booking.person_details[0].last_name || ''}`.trim() || "N/A"
                                    : "N/A"
                                  }
                                </td>
                                <td>
                                  {booking.category === "Package" ? "Umrah Package" :
                                    booking.category === "Ticket_Booking" ? "Flight Tickets" :
                                      booking.category || "N/A"}
                                </td>
                                <td>{formatDate(booking.expiry_time)}</td>
                                <td>{getStatusBadge(booking.status)}</td>
                                <td>{formatCurrency(booking.total_amount)}</td>
                                <td>
                                  <div className="dropdown">
                                    <button
                                      className="btn btn-link p-0"
                                      type="button"
                                      data-bs-toggle="dropdown"
                                    >
                                      <EllipsisVertical />
                                    </button>
                                    <ul className="dropdown-menu">
                                      <li>
                                        <a className="dropdown-item" href="#">
                                          View
                                        </a>
                                      </li>
                                      <li>
                                        <a className="dropdown-item" href="#">
                                          Edit
                                        </a>
                                      </li>
                                      <li>
                                        <a className="dropdown-item" href="#">
                                          Delete
                                        </a>
                                      </li>
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="8" className="text-center py-4">
                                No bookings found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {filteredBookings.length > 0 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length} entries
                        </div>
                        <nav>
                          <ul className="pagination mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={prevPage}>
                                <ChevronLeft size={16} />
                              </button>
                            </li>

                            {pageNumbers.map(number => (
                              <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => paginate(number)}
                                >
                                  {number}
                                </button>
                              </li>
                            ))}

                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={nextPage}>
                                <ChevronRight size={16} />
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
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

export default BookingHistory;