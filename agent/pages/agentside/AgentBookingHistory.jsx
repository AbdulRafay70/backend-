import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Dropdown } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import axios from "axios";

/**
 * Shimmer placeholder row for loading state
 */
const ShimmerRow = () => (
  <tr>
    {/* Create 8 shimmer cells */}
    {Array(8)
      .fill(0)
      .map((_, i) => (
        <td key={i}>
          <div className="shimmer-placeholder" />
        </td>
      ))}
  </tr>
);

const BookingHistory = () => {
  // ---
  // State
  // ---

  // 1. API Data State
  const [bookings, setBookings] = useState([]); // Master list from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // no client-side filters: we fetch and show all bookings for the logged-in organization

  // 4. Navigation & Tab State (Derived from URL)
  // Determine logged-in organization id from login data in localStorage.
  // The login flow stores `agentOrganization` as JSON with an `ids` array.
  const getLoggedInOrgId = () => {
    try {
      const raw = localStorage.getItem("agentOrganization");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.ids && parsed.ids.length > 0) return parsed.ids[0];
      if (parsed?.id) return parsed.id;
      return null;
    } catch (e) {
      return null;
    }
  };

  // ---
  // Data Fetching
  // ---
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("agentAccessToken");
        const orgId = getLoggedInOrgId();

        console.log("[BookingHistory] fetching bookings for organization:", orgId);

        if (!orgId || !token) {
          throw new Error("Missing organization ID or authentication token.");
        }

        const response = await axios.get(
          `http://127.0.0.1:8000/api/bookings/?organization=${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        setBookings(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError(
          err.response?.data?.detail || err.message || "Failed to fetch bookings"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Filters removed: plain bookings list will be displayed for the logged-in organization.

  // ---
  // Helper Functions (Copied from your code, they are good)
  // ---
  const getStatusStyle = (status) => {
    const s = (status || '').toString().toLowerCase();
    // Paid and Active use green; Confirmed uses blue; Pending uses yellow; others default gray
    if (s === 'paid') {
      return { backgroundColor: '#ECFDF3', color: '#065F46', padding: '4px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' };
    }
    if (s === 'active' || s === 'approved') {
      return { backgroundColor: '#ECFDF3', color: '#065F46', padding: '4px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' };
    }
    if (s === 'confirmed') {
      return { backgroundColor: '#E6F0FF', color: '#0d6efd', padding: '4px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' };
    }
    if (s === 'pending') {
      return { backgroundColor: '#FFFBEB', color: '#92400e', padding: '4px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' };
    }
    if (s === 'completed' || s === 'complete' || s === 'paid') {
      return { backgroundColor: '#ECFDF3', color: '#065F46', padding: '4px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' };
    }

    return { backgroundColor: '#F2F4F7', color: '#344054', padding: '4px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' };
  };

  const getDisplayStatus = (booking) => {
    if (!booking) return 'N/A';
    // If payment flags indicate paid, show Paid regardless of booking.status
    if (booking.is_paid === true || (booking.payment_status && booking.payment_status.toString().toLowerCase() === 'paid')) return 'Paid';
    // otherwise prefer booking.status
    return booking.status || 'N/A';
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateString; // Fallback
    }
  };

  const getPassengerNames = (personDetails) => {
    if (!personDetails) return "N/A";

    // Normalize different shapes the API might return:
    // - An array of person objects
    // - A single person object
    // - An object that wraps the array under different keys
    let people = personDetails;
    if (!Array.isArray(people)) {
      if (people?.booking_person_details && Array.isArray(people.booking_person_details)) {
        people = people.booking_person_details;
      } else if (people?.person_details && Array.isArray(people.person_details)) {
        people = people.person_details;
      } else if (typeof people === 'object') {
        people = [people];
      } else {
        people = [];
      }
    }

    if (!people || people.length === 0) return "N/A";

    const firstPerson = people[0] || {};

    // Support multiple possible naming schemes returned by APIs
    const title = firstPerson.person_title || firstPerson.title || '';
    const first = firstPerson.first_name || firstPerson.firstName || firstPerson.first || '';
    const last = firstPerson.last_name || firstPerson.lastName || firstPerson.last || '';
    const full = firstPerson.full_name || firstPerson.fullName || firstPerson.name || '';

    const composed = full || `${title} ${first} ${last}`.trim();
    return composed.trim() || "N/A";
  };

  // ---
  // Render
  // ---

  // Invoice link will be chosen per-booking (group vs package)

  const rawAgency = localStorage.getItem("agencyName");
  let agencyName = "";
  try {
    if (rawAgency) {
      // localStorage may store a JSON object, a plain string, or the literal string "null"
      const parsed = JSON.parse(rawAgency);
      if (parsed === null) {
        // value was the literal null
        agencyName = "";
      } else if (typeof parsed === "string") {
        // stored as a JSON string
        agencyName = parsed || "";
      } else if (typeof parsed === "object") {
        // stored as an object — try common fields
        agencyName = parsed?.name || parsed?.agency_name || parsed?.displayName || parsed?.title || "";
      } else {
        // fallback to string conversion
        agencyName = String(parsed) || "";
      }
    }
  } catch (e) {
    // not JSON — use raw string (handles plain strings stored without JSON encoding)
    agencyName = rawAgency || "";
  }
  const resolvedOrgId = getLoggedInOrgId();

  // Summary totals
  const totalBookings = bookings.length;
  const totalAmount = bookings.reduce((sum, b) => {
    const val = Number(b?.total_amount) || 0;
    return sum + val;
  }, 0);

  return (
    <>
      {/* **FIX 5: Moved shimmer CSS to its own minimal tag.** */}
      <style>
        {`
          .shimmer-placeholder {
            background: #f6f7f8;
            background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
            background-repeat: no-repeat;
            background-size: 800px 104px;
            display: inline-block;
            height: 16px;
            border-radius: 4px;
            animation: placeholderShimmer 1s linear infinite forwards;
            width: 100%;
          }
          @keyframes placeholderShimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }
      `}
      </style>

      {/* **FIX 6: Simplified layout structure.** Using `d-flex` on the root provides a more stable layout 
          for sidebars than `row/offset`. `minHeight` ensures it fills the screen.
      */}
      <div
        className="d-flex"
        style={{
          fontFamily: "Poppins, sans-serif",
          background: "#f6f8fb",
          minHeight: "100vh",
        }}
      >
        <AgentSidebar />

        {/* Main Content Column */}
        {/* `flex-grow-1` makes it take remaining space. `overflow-auto` handles scrolling. */}
        <div className="flex-grow-1" style={{ overflow: "auto" }}>
          {/* Container-fluid is better for full-width dashboards. `p-0` to let header be full width. */}
          <div className="container-fluid p-0">
            <AgentHeader />

            {/* **FIX 7: Use standard Bootstrap padding/margins.** `p-3 p-lg-4` adds padding *inside* the content area, 
                and `mt-0` on the card is fine because AgentHeader provides space.
            */}
            <div className="p-3 p-lg-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-3 p-md-4">
                  <h5 className="card-title mb-4">Booking History</h5>

                  {/* Filters removed as requested — showing all bookings for the logged-in organization */}

                  {/* Booking Info Header */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-1">
                        Bookings {agencyName ? <span className="text-primary small">({agencyName})</span> : null}
                      </h6>
                      <small className="text-muted">Showing all bookings for the logged-in organization</small>
                      {/* Totals summary */}
                      <div className="mt-2 d-flex align-items-center" style={{ gap: '12px' }}>
                        <div className="small text-muted">Total Bookings: <strong className="text-dark">{totalBookings}</strong></div>
                        <div className="small text-muted">Total Amount: <strong className="text-dark">RS. {totalAmount.toLocaleString()}/-</strong></div>
                      </div>
                    </div>
                    <div>
                      <div className="d-flex align-items-center">
                        <button className="btn btn-outline-secondary btn-sm me-3">
                          <Download size={16} className="me-1" />
                          Export
                        </button>
                        <div className="small text-muted">Org ID: {getLoggedInOrgId() || 'none'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="table-responsive">
                    <table className="table table-hover align-middle text-center">
                      <thead className="table-light">
                        <tr>
                          <th className="text-muted small">Booking Date</th>
                          <th className="text-muted small">Order No.</th>
                          <th className="text-muted small">Pax Name</th>
                          <th className="text-muted small">Booking Included</th>
                          <th className="text-muted small">Booking Expiry</th>
                          <th className="text-muted small">Booking Status</th>
                          <th className="text-muted small">Payment Status</th>
                          <th className="text-muted small">Amount</th>
                          <th className="text-muted small">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array(5)
                            .fill(0)
                            .map((_, index) => <ShimmerRow key={index} />)
                        ) : error ? (
                          <tr>
                            <td
                              colSpan="8"
                              className="text-center text-danger py-4"
                            >
                              Error: {error}
                            </td>
                          </tr>
                        ) : bookings.length > 0 ? (
                          bookings.map((booking) => (
                            <tr key={booking.id}>
                              <td>{formatDate(booking.date)}</td>
                              <td>{booking.booking_number || "N/A"}</td>
                              <td>{getPassengerNames(booking.person_details)}</td>
                              <td>
                                <Link
                                  to={`/booking/${booking.id}`}
                                  className="text-primary"
                                  style={{
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                  }}
                                >
                                  View Details
                                </Link>
                              </td>
                              <td>{formatDate(booking.expiry_time)}</td>
                              <td>
                                {(() => {
                                  const display = booking.status || 'N/A';
                                  return <span style={getStatusStyle(display)}>{display}</span>;
                                })()}
                              </td>
                              <td>
                                {(() => {
                                  const pDisplay = (booking.is_paid === true || (booking.payment_status && booking.payment_status.toString().toLowerCase() === 'paid')) ? 'Paid' : (booking.payment_status || 'Pending');
                                  const pStyle = (pDisplay.toString().toLowerCase() === 'paid') ? { backgroundColor: '#ECFDF3', color: '#065F46', padding: '4px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' } : { backgroundColor: '#FFFBEB', color: '#92400e', padding: '4px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' };
                                  return <span style={pStyle}>{pDisplay}</span>;
                                })()}
                              </td>
                              <td>
                                RS. {booking.total_amount?.toLocaleString() || "0"}/-
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
                                    {/* **FIX 8: Use `as={Link}` for correct HTML.** */}
                                    <Dropdown.Item
                                      as={Link}
                                      to="/booking-history/hotel-voucher"
                                      className="text-primary"
                                    >
                                      See Booking
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                      as={Link}
                                      to={booking.category === 'Ticket_Booking' ? '/booking-history/group-invoice' : '/booking-history/invoice'}
                                      className="text-primary"
                                    >
                                      Invoice
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              No bookings found for the selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingHistory;