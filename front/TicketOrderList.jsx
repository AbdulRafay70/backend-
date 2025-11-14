import { ArrowBigLeft, FileText, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Gear } from "react-bootstrap-icons";
import api from "../../utils/Api";

const TicketTravelBookingInvoice = () => {
  const navigate = useNavigate();
  const { orderNo } = useParams();

  const [showChild, setShowChild] = useState(false);
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Tickets list from backend
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState(null);
  // Backend summary stats
  const [stats, setStats] = useState({
    ticketsTotal: 0,
    ticketsOrg: 0,
    sampleTickets: [],
    airlinesTotal: 0,
    airlinesOrg: 0,
    sampleAirlines: [],
    citiesTotal: 0,
    citiesOrg: 0,
    sampleCities: [],
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Fetch booking data
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");
        if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await api.get(
          `/bookings/?organization=${organizationId}&booking_number=${orderNo}`
        );

        // axios response check
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Failed to fetch booking data: ${response.status}`);
        }

        const data = response.data;
        console.log("API Response:", data);

        // Ensure booking_number is compared as string
        const booking =
          data.results?.find(
            (b) => String(b.booking_number) === String(orderNo)
          ) || data[0];

        if (!booking) {
          throw new Error("Booking not found");
        }

        setBookingData(booking);



        // Now fetch agency data
        if (booking.agency) {
          const agencyResponse = await api.get(`/agencies/?id=${booking.agency}`);
          setAgencyData(agencyResponse.data.results?.[0] || agencyResponse.data[0] || null);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [orderNo]);

  // Fetch tickets for current organization (optional)
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setTicketsLoading(true);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");
        if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const orgSuffix = organizationId ? `?organization=${organizationId}` : "";
        const res = await api.get(`/tickets/${orgSuffix}`);
        let data = res.data;
        if (Array.isArray(data)) {
          setTickets(data);
        } else if (data.results) {
          setTickets(data.results);
        } else {
          setTickets([]);
        }
      } catch (err) {
        setTicketsError(err.response?.data?.detail || err.message || 'Failed to load tickets');
      } finally {
        setTicketsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Fetch backend summary (tickets counts, sample records, airlines, cities)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");
        if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const orgSuffix = organizationId ? `?organization=${organizationId}` : "";

        const [globalTicketsRes, orgTicketsRes, airlinesRes, citiesRes] = await Promise.all([
          api.get(`/tickets/`),
          api.get(`/tickets/${orgSuffix}`),
          api.get(`/airlines/${orgSuffix}`),
          api.get(`/cities/${orgSuffix}`),
        ]);

        const ticketsTotal = globalTicketsRes.data?.count ?? (Array.isArray(globalTicketsRes.data) ? globalTicketsRes.data.length : 0);
        const ticketsOrg = orgTicketsRes.data?.count ?? (Array.isArray(orgTicketsRes.data) ? orgTicketsRes.data.length : 0);
        const sampleTickets = orgTicketsRes.data?.results ?? orgTicketsRes.data ?? [];

        // For overall airlines and cities counts, call endpoints without org
        const airlinesGlobalRes = await api.get(`/airlines/`);
        const citiesGlobalRes = await api.get(`/cities/`);

        const airlinesTotal = airlinesGlobalRes.data?.count ?? (Array.isArray(airlinesGlobalRes.data) ? airlinesGlobalRes.data.length : 0);
        const airlinesOrg = airlinesRes.data?.count ?? (Array.isArray(airlinesRes.data) ? airlinesRes.data.length : 0);
        const sampleAirlines = airlinesRes.data?.results ?? airlinesRes.data ?? [];

        const citiesTotal = citiesGlobalRes.data?.count ?? (Array.isArray(citiesGlobalRes.data) ? citiesGlobalRes.data.length : 0);
        const citiesOrg = citiesRes.data?.count ?? (Array.isArray(citiesRes.data) ? citiesRes.data.length : 0);
        const sampleCities = citiesRes.data?.results ?? citiesRes.data ?? [];

        setStats({
          ticketsTotal,
          ticketsOrg,
          sampleTickets: sampleTickets.slice(0, 5),
          airlinesTotal,
          airlinesOrg,
          sampleAirlines: sampleAirlines.slice(0, 5),
          citiesTotal,
          citiesOrg,
          sampleCities: sampleCities.slice(0, 10),
        });
      } catch (err) {
        setStatsError(err.response?.data?.detail || err.message || 'Failed to load stats');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Helper functions to extract data
  const getAgencyName = () => {
    return agencyData?.ageny_name || agencyData?.ageny_name || "N/A";
  };

  const getAgencyCode = () => {
    return agencyData?.id ? `AG${agencyData.id.toString().padStart(4, '0')}` : "N/A";
  };

  const getContactInfo = () => {
    if (agencyData?.contacts?.length > 0) {
      return agencyData.contacts[0].phone_number;
    }
    return agencyData?.phone_number || "N/A";
  };

  const getAgentName = () => {
    return agencyData?.name || "N/A";
  };

  const getAgencyEmail = () => {
    if (agencyData?.contacts?.length > 0) {
      return agencyData.contacts[0].email;
    }
    return agencyData?.email || "N/A";
  };

  const getAgencyAddress = () => {
    return agencyData?.address || "N/A";
  };

  const getAgreementStatus = () => {
    return agencyData?.agreement_status ? "Active" : "Inactive";
  };

  const getFlightDetails = () => {
    if (!bookingData?.ticket_details || bookingData.ticket_details.length === 0) {
      return [];
    }

    return bookingData.ticket_details.map(ticket => ({
      airline: ticket.airline || ticket.ticket || "N/A",
      pnr: ticket.pnr || "",
      route: getRouteFromTicket(ticket),
      depDateTime: ticket.trip_details?.[0]?.departure_date_time
        ? new Date(ticket.trip_details[0].departure_date_time).toLocaleString()
        : "28/03/25 14:30",
      arvDateTime: ticket.trip_details?.[0]?.arrival_date_time
        ? new Date(ticket.trip_details[0].arrival_date_time).toLocaleString()
        : "28/03/25 10:30",
      depDateTime2: ticket.trip_details?.[1]?.departure_date_time
        ? new Date(ticket.trip_details[1].departure_date_time).toLocaleString()
        : "14/04/25 1:30",
      arvDateTime2: ticket.trip_details?.[1]?.arrival_date_time
        ? new Date(ticket.trip_details[1].arrival_date_time).toLocaleString()
        : "14/04/25 2:00"
    }));
  };

  const getRouteFromTicket = (ticket) => {
  if (!ticket.trip_details || ticket.trip_details.length === 0) return "";

    const departure = ticket.trip_details[0].departure_city || "LHR";
    const arrival = ticket.trip_details[0].arrival_city || "JED";

    if (ticket.trip_details.length > 1) {
      const returnDeparture = ticket.trip_details[1].departure_city || arrival;
      const returnArrival = ticket.trip_details[1].arrival_city || departure;
      return `${departure}-${arrival}-${returnDeparture}-${returnArrival}`;
    }

    return `${departure}-${arrival}`;
  };

  const getPassengerDetails = () => {
    if (!bookingData?.person_details || bookingData.person_details.length === 0) {
      return [{
        sno: 1,
        passportNo: "N/A",
        expiryDate: "N/A",
        paxName: "N/A",
        person_title: "N/A",
        passpoet_issue_date: "N/A",
        passport_expiry_date: "N/A",
        country: "N/A",
      }];
    }

    return bookingData.person_details.map((person, index) => ({
      sno: index + 1,
      passportNo: person.passport_number || "N/A",
      expiryDate: person.passport_expiry_date
        ? new Date(person.passport_expiry_date).toLocaleDateString()
        : "N/A",
      paxName: `${person.first_name || ""} ${person.last_name || ""}`.trim(),
      title: person.person_title,
      passpoet_issue_date: person.passpoet_issue_date ? new Date(person.passpoet_issue_date).toLocaleDateString() : "N/A",
      country: person.country,
      passport_expiry_date: person.passport_expiry_date,
    }));
  };

  const getPaymentDetails = () => {
    if (!bookingData?.payment_details || bookingData.payment_details.length === 0) {
      return {
        totalAmount: `Rs. ${bookingData?.total_amount || 0}/-`,
        receivedBy: "N/A",
        date: bookingData?.date ? new Date(bookingData.date).toLocaleDateString() : "N/A",
        paidAmount: `Rs. ${(bookingData?.total_amount || 0) - (bookingData?.remaining_amount || 0)}/-`,
        paymentMethod: "N/A",
        remainingAmount: `Rs. ${bookingData?.remaining_amount || 0}/-`
      };
    }

    const payment = bookingData.payment_details[0];
    return {
      totalAmount: `Rs. ${bookingData.total_amount || 0}/-`,
      receivedBy: payment.created_by || "N/A",
      date: payment.date ? new Date(payment.date).toLocaleDateString() : "N/A",
      paidAmount: `Rs. ${payment.amount || 0}/-`,
      paymentMethod: payment.method || "N/A",
      remainingAmount: `Rs. ${bookingData.remaining_amount || 0}/-`
    };
  };

  if (loading) {
    return (
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          <div className="col-12 col-lg-2">
            <Sidebar />
          </div>
          <div className="col-12 col-lg-10">
            <div className="container">
              <Header />
              <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          <div className="col-12 col-lg-2">
            <Sidebar />
          </div>
          <div className="col-12 col-lg-10">
            <div className="container">
              <Header />
              <div className="alert alert-danger m-4" role="alert">
                <h4 className="alert-heading">Error Loading Data</h4>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          <div className="col-12 col-lg-2">
            <Sidebar />
          </div>
          <div className="col-12 col-lg-10">
            <div className="container">
              <Header />
              <div className="alert alert-warning m-4" role="alert">
                <h4 className="alert-heading">Booking Not Found</h4>
                <p>No booking found with number: {orderNo}</p>
                <button className="btn btn-secondary" onClick={() => navigate("/order-delivery")}>
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flightData = getFlightDetails();
  const paxData = getPassengerDetails();
  const paymentDetail = getPaymentDetails();

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
            <div className="bg-white p-4 rounded-4 mt-1">
              {/* Header Section */}
              <div className="row mb-4">
                <div className="col-md-9">
                  <div className="mb-3">
                    <ArrowBigLeft
                      size={"30px"}
                      onClick={() => navigate(`/order-delivery`)}
                      className="cursor-pointer"
                    />
                    <label className="me-2 form-label fw-bold">
                      Order Delivery system/Tickets/ Detail
                    </label>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex">
                    <button className="btn btn-primary ms-2">Print</button>
                    <button className="btn btn-outline-primary ms-2">Download</button>
                  </div>
                </div>
              </div>

              <div>
                {/* Backend Summary */}
                <div className="mb-4 p-3 border rounded">
                  <h5 className="mb-3 fw-bold">Backend Summary</h5>
                  {statsLoading && <div>Loading summary...</div>}
                  {statsError && <div className="text-danger">{statsError}</div>}
                  {!statsLoading && !statsError && (
                    <div className="row">
                      <div className="col-md-4">
                        <div><strong>Tickets total:</strong> {stats.ticketsTotal}</div>
                        <div><strong>Tickets (this org):</strong> {stats.ticketsOrg}</div>
                        <div className="mt-2"><strong>Sample tickets:</strong></div>
                        <ul>
                          {stats.sampleTickets.map((t) => (
                            <li key={t.id}>{`#${t.id} — PNR: ${t.pnr || 'N/A'} — Price: ${t.adult_price ?? 'N/A'}`}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="col-md-4">
                        <div><strong>Airlines total:</strong> {stats.airlinesTotal}</div>
                        <div><strong>Airlines (this org):</strong> {stats.airlinesOrg}</div>
                        <div className="mt-2"><strong>Sample airlines:</strong></div>
                        <ul>
                          {stats.sampleAirlines.map((a) => (
                            <li key={a.id}>{a.name || a.title || `#${a.id}`}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="col-md-4">
                        <div><strong>Cities total:</strong> {stats.citiesTotal}</div>
                        <div><strong>Cities (this org):</strong> {stats.citiesOrg}</div>
                        <div className="mt-2"><strong>Sample cities:</strong></div>
                        <ul>
                          {stats.sampleCities.map((c) => (
                            <li key={c.id}>{`${c.name} (${c.code || ''})`}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                {/* Order Status Header */}
                <div className="table-responsive">
                  <table className="table table-hover text-center">
                    <thead className="table-light ">
                      <tr>
                        <th>Order No</th>
                        <th>Status</th>
                        <th>Agency Code</th>
                        <th>Agreement Status</th>
                        <th>Balance</th>
                        <th>Creation Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <span className="text-decoration-underline">
                            {bookingData.booking_number || orderNo}
                          </span>
                        </td>
                        <td>
                          <span className="">{bookingData.status || "N/A"}</span>
                        </td>
                        <td>{getAgencyCode()}</td>
                        <td>{getAgreementStatus()}</td>
                        <td>Rs. {bookingData.remaining_amount || 0}</td>
                        <td>{bookingData.date ? new Date(bookingData.date).toLocaleString() : "N/A"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Pax Detail Section */}
                <div className="mb-3 mt-3">
                  <div className="d-flex justify-content-bewteen mb-4">
                    <h5 className="mb-0 fw-bold">Pax Detail</h5>
                    <button className="btn btn-primary btn-sm ms-2">Edit Details</button>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover text-center">
                      <thead className="table-light ">
                        <tr>
                          <th>SNO</th>
                          <th>Passport No</th>
                          <th>Expiry Date</th>
                          <th>Pax Name</th>
                          <th>Title</th>
                          <th>Passport Issue</th>
                          <th>Passport Expiry</th>
                          <th>Country</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paxData.map((pax) => (
                          <tr key={pax.sno}>
                            <td>{pax.sno}</td>
                            <td>{pax.passportNo}</td>
                            <td>{pax.expiryDate}</td>
                            <td>{pax.paxName}</td>
                            <td>{pax.title}</td>
                            <td>{pax.passpoet_issue_date}</td>
                            <td>{pax.passport_expiry_date}</td>
                            <td>{pax.country}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Flight Details Section */}
                {flightData.length > 0 && (
                  <div className="mb-3 mt-3">
                    <div className="d-flex justify-content-bewteen mb-4">
                      <h5 className="mb-0 fw-bold">Flight Details</h5>
                      <button className="btn btn-primary btn-sm ms-2">Edit Details</button>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover text-center">
                        <thead className="table-light ">
                          <tr>
                            <th>Airline</th>
                            <th>PNR</th>
                            <th>Route</th>
                            <th>Dep Date & Time</th>
                            <th>Arv Date & Time</th>
                            <th>Dep Date & Time</th>
                            <th>Arv Date & Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flightData.map((flight, index) => (
                            <tr key={index}>
                              <td className="text-decoration-underline">
                                {flight.airline}
                              </td>
                              <td>{flight.pnr}</td>
                              <td>{flight.route}</td>
                              <td>{flight.depDateTime}</td>
                              <td>{flight.arvDateTime}</td>
                              <td>{flight.depDateTime2}</td>
                              <td>{flight.arvDateTime2}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Agent Detail Section */}
                <div className="mb-3 mt-3">
                  <h5 className="mb-0 fw-bold">Agent Detail</h5>
                  <div className="table-responsive">
                    <table className="table table-hover text-center">
                      <thead className="table-light ">
                        <tr>
                          <th>Agency Name</th>
                          <th>Agent Name</th>
                          <th>Contact</th>
                          <th>Address</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{getAgencyName()}</td>
                          <td className="text-decoration-underline">
                            {getAgentName()}
                          </td>
                          <td>{getContactInfo()}</td>
                          <td>{getAgencyAddress()}</td>
                          <td>{getAgencyEmail()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Detail Section */}
                <div className="mb-3 mt-3">
                  <div className="d-flex justify-content-bewteen mb-4">
                    <h5 className="mb-0 fw-bold">Order Detail</h5>
                    <button className="btn btn-primary btn-sm ms-2">Add Discount</button>
                    <button className="btn btn-primary btn-sm  ms-2">Refund Payment</button>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover text-center">
                      <thead className="table-light ">
                        <tr>
                          <th>Order No</th>
                          <th>Date</th>
                          <th>No. of Pax</th>
                          <th>Discount</th>
                          <th>Total Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{bookingData.booking_number || orderNo}</td>
                          <td>{bookingData.date ? new Date(bookingData.date).toLocaleDateString() : "N/A"}</td>
                          <td>{bookingData.total_pax || 0}</td>
                          <td>Rs. 0/-</td>
                          <td>Rs. {bookingData.total_amount || 0}/-</td>
                          <td>
                            <Link
                              to={`/order-delivery/ticketing/${bookingData.booking_number}/invoice`}
                              className="btn btn-primary d-flex align-items-center gap-2"
                            >
                              <FileText size={16} />
                              INVOICE
                            </Link>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Detail Section */}
                <div className="mb-3 mt-3">
                  <div className="d-flex justify-content-bewteen mb-4">
                    <h5 className="mb-0 fw-bold">Payment Detail</h5>
                    <button className="btn btn-primary btn-sm ms-2">Edit Details</button>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover text-center">
                      <thead className="table-light ">
                        <tr>
                          <th>Total Amount</th>
                          <th>Received By</th>
                          <th>Date</th>
                          <th>Paid Amount</th>
                          <th>Payment Method</th>
                          <th>Remaining Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{paymentDetail.totalAmount}</td>
                          <td>{paymentDetail.receivedBy}</td>
                          <td>{paymentDetail.date}</td>
                          <td className="text-primary">{paymentDetail.paidAmount}</td>
                          <td>{paymentDetail.paymentMethod}</td>
                          <td>{paymentDetail.remainingAmount}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Available Tickets Section */}
                <div className="mb-3 mt-3">
                  <div className="d-flex justify-content-bewteen mb-4">
                    <h5 className="mb-0 fw-bold">Available Tickets</h5>
                  </div>

                  {ticketsLoading && (
                    <div className="text-center py-3">Loading tickets...</div>
                  )}

                  {ticketsError && (
                    <div className="alert alert-warning">{ticketsError}</div>
                  )}

                  {!ticketsLoading && !ticketsError && tickets.length === 0 && (
                    <div className="text-center py-3">No tickets available</div>
                  )}

                  {!ticketsLoading && tickets.length > 0 && (
                    <div className="table-responsive">
                      <table className="table table-hover text-center">
                        <thead className="table-light ">
                          <tr>
                            <th>Ticket ID</th>
                            <th>PNR</th>
                            <th>Route</th>
                            <th>Departure</th>
                            <th>Price</th>
                            <th>Seats Left</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((t) => {
                            const outbound = t.trip_details?.[0];
                            const dep = outbound?.departure_date_time ? new Date(outbound.departure_date_time).toLocaleString() : 'N/A';
                            const route = getRouteFromTicket(t);
                            return (
                              <tr key={t.id}>
                                <td>{t.id}</td>
                                <td>{t.pnr || 'N/A'}</td>
                                <td>{route}</td>
                                <td>{dep}</td>
                                <td>{t.adult_price ? `Rs. ${t.adult_price}` : 'N/A'}</td>
                                <td>{t.left_seats ?? 'N/A'}</td>
                                <td>
                                  <Link to={`/ticket-booking/detail/${t.id}`} className="btn btn-sm btn-primary">View</Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <button
                className="btn btn-primary mb-3"
                onClick={() => setShowChild(true)}
              >
                Set Infant And Child Fare
              </button>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowRejectNote(true)}
                >
                  Reject With Note
                </button>
                <button className="btn btn-primary">Partail Paid</button>
                <button className="btn btn-primary">Refund Ticket</button>
                <button className="btn btn-primary">Confirm Order</button>
                <button className="btn btn-primary">cancel Order</button>

                <button
                  className="btn btn-primary"
                  onClick={() => setShowRejectNote(true)}
                >
                  Cancel with note
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/order-delivery")}
                >
                  Close
                </button>
              </div>

              {/* Reject Note Modal */}
              {showRejectNote && (
                <>
                  <div
                    className="modal-backdrop fade show"
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 1040,
                    }}
                  ></div>

                  <div
                    className="modal d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                      zIndex: 1045,
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    <div className="modal-dialog modal-dialog-centered" role="document">
                      <div className="modal-content">
                        <div className="modal-header text-center">
                          <h5 className="modal-title fw-bold w-100">Add Notes</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowRejectNote(false)}
                          ></button>
                        </div>

                        <div className="modal-body">
                          <fieldset className="border rounded p-3 mb-4 bg-light position-relative">
                            <legend className="float-none w-auto px-2 fs-6 fw-bold mb-0">
                              Notes
                            </legend>
                            <div className="text-muted">
                              Call 92 world tour tommorow and he will pay all the money
                            </div>
                            <div className="mt-2">
                              <strong>Date Reminder</strong>
                              <div className="text-muted">18/01/2025</div>
                            </div>
                            <div className="mt-2">
                              <strong>Employyer name</strong>
                              <div className="text-muted">id/name</div>
                            </div>
                            <div className="position-absolute top-0 end-0 mt-2 me-3">
                              <Gear size={16} className="text-muted" />
                            </div>
                          </fieldset>

                          <fieldset className="border border-black p-2 rounded mb-4">
                            <legend className="float-none w-auto px-1 fs-6">
                              Notes
                            </legend>
                            <textarea
                              className="form-control border-0 shadow-none"
                              rows={4}
                              placeholder="Enter Notes"
                            ></textarea>
                          </fieldset>
                        </div>

                        <div className="modal-footer">
                          <button className="btn btn-primary">Reject Order</button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setShowRejectNote(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Child Modal */}
              {showChild && (
                <>
                  <div
                    className="modal-backdrop fade show"
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 1040,
                    }}
                  ></div>

                  <div
                    className="modal d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                      zIndex: 1045,
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    <div className="modal-dialog modal-dialog-centered" role="document">
                      <div className="modal-content">
                        <div className="modal-header text-center">
                          <h5 className="modal-title fw-bold w-100">
                            Child and Infant Fare
                          </h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowChild(false)}
                          ></button>
                        </div>

                        <div className="modal-body">
                          <fieldset className="border border-black p-2 rounded mb-4">
                            <legend className="float-none w-auto px-1 fs-6">
                              Child Fare
                            </legend>
                            <input
                              className="form-control border-0 shadow-none"
                              placeholder="Enter Child Fare"
                            />
                          </fieldset>
                          <fieldset className="border border-black p-2 rounded mb-4">
                            <legend className="float-none w-auto px-1 fs-6">
                              Infant Fare
                            </legend>
                            <input
                              className="form-control border-0 shadow-none"
                              placeholder="Enter Infant Fare"
                            />
                          </fieldset>
                        </div>

                        <div className="modal-footer">
                          <button className="btn btn-primary">Set</button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setShowChild(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketTravelBookingInvoice;