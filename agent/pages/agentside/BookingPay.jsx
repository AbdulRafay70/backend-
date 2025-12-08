import React, { useState, useEffect, useRef } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import logo from "../../assets/flightlogo.png";
import axios from "axios";
import { Bag } from "react-bootstrap-icons";
import { Search, Utensils } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
const BookingPay = () => {
  const [selectedPayment, setSelectedPayment] = useState("bank-transfer");

  const location = useLocation();
  const { bookingId, ticket, cityMap, airlineMap, passengers, totalAmount } = location.state || {};

  const [computedTotal, setComputedTotal] = useState(totalAmount || 0);

  const tripDetails = ticket?.trip_details || [];
  const outboundTrip = tripDetails.find(t => t && t.trip_type === "Departure") || (tripDetails.length ? tripDetails[0] : null);
  const returnTrip = tripDetails.find(t => t && t.trip_type === "Return") || (tripDetails.length > 1 ? tripDetails[1] : null);
  const stopoverDetails = ticket?.stopover_details || [];
  const outboundStopover = stopoverDetails.find(s => s && s.trip_type === 'Departure') || (stopoverDetails.length ? stopoverDetails[0] : undefined);
  const returnStopover = stopoverDetails.find(s => s && s.trip_type === 'Return') || (stopoverDetails.length > 1 ? stopoverDetails[1] : undefined);

  

  const airlineInfo = ticket && airlineMap ? (airlineMap[ticket.airline] || {}) : {};

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return "--:--";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-- ---";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return "-- ---";
    }
  };

  const cityDisplay = (cityId) => {
    // kept for backward-compat but delegate to resolveCityName
    return resolveCityName(cityId);
  };

  const cityCode = (cityId) => {
    const name = resolveCityName(cityId);
    if (!name) return "---";
    // return 3-letter uppercase code if available
    try {
      return String(name).split(' ')[0].substring(0,3).toUpperCase();
    } catch {
      return "---";
    }
  };

  // Robust resolver to accept id, code, string, or object shapes for cities
  const resolveCityName = (city) => {
    if (!city) return "Unknown";
    // number -> try map lookup
    if (typeof city === 'number') {
      return (cityMap && cityMap[city]) || String(city);
    }
    // string -> direct
    if (typeof city === 'string') {
      // empty string fallback
      return city.trim() ? city : 'Unknown';
    }
    // object -> try common keys
    if (typeof city === 'object') {
      try {
        if (city.name) return city.name;
        if (city.full_name) return city.full_name;
        if (city.city) return city.city;
        if (city.code) return city.code;
        if (city.id && cityMap && cityMap[city.id]) return cityMap[city.id];
        if (city.id) return String(city.id);
      } catch {
        // fall through
      }
      return JSON.stringify(city);
    }
    // fallback
    return String(city);
  };

  

  // Resolve airline display name from id/object/string
  const resolveAirlineName = (airline) => {
    if (!airline) return '';
    if (typeof airline === 'string') return airline;
    if (typeof airline === 'number') {
      return (airlineMap && airlineMap[airline] && (airlineMap[airline].name || airlineMap[airline].full_name)) || String(airline);
    }
    if (typeof airline === 'object') {
      return airline.name || airline.full_name || airline.display_name || airline.title || airline.airline_name || airline.code || JSON.stringify(airline);
    }
    return String(airline);
  };

  // Resolve airline code (IATA) from id/object/string
  const resolveAirlineCode = (airline) => {
    if (!airline) return '';
    if (typeof airline === 'string') return airline;
    if (typeof airline === 'number') {
      return (airlineMap && airlineMap[airline] && (airlineMap[airline].code || airlineMap[airline].iata || airlineMap[airline].iata_code)) || String(airline);
    }
    if (typeof airline === 'object') {
      return airline.code || airline.iata || airline.iata_code || airline.code_iata || airline.airline_code || '';
    }
    return '';
  };

  // Resolve stopover city robustly
  const resolveStopoverCity = (stopover) => {
    if (!stopover) return '';
    const candidate = stopover.stopover_city || stopover.arrival_city || stopover.city || stopover.to_city || stopover.destination;
    // ensure we always return a string (resolveCityName handles objects/ids/strings)
    return resolveCityName(candidate);
  };

  // Format stopover time/date if available
  const formatStopoverTime = (stopover) => {
    if (!stopover) return '';
    const t = stopover.stopover_time || stopover.arrival_time || stopover.arrival_date_time || stopover.stopover_date_time || stopover.time || stopover.date_time;
    if (!t) return '';
    try {
      const d = new Date(t);
      return d.toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' });
    } catch {
      return String(t);
    }
  };

  // Render a compact stopover details block (city, time, airline)
  const renderStopoverDetails = (stopover) => {
    if (!stopover) return <small className="text-muted">NON STOP</small>;
    const city = resolveStopoverCity(stopover);
    const time = formatStopoverTime(stopover);
    const airline = stopover.airline || stopover.airline_id || stopover.operating_airline || null;
    const name = resolveAirlineName(airline) || '';
    const code = resolveAirlineCode(airline) || '';

    return (
      <div className="text-muted small">
        {city ? <div>{city}{time ? ` — ${time}` : ''}</div> : null}
        {(name || code) ? <div>{name}{code ? ` (${code})` : ''}</div> : null}
      </div>
    );
  };

  useEffect(() => {
    // Compute total from ticket prices and passengers if not provided
    if (!computedTotal && ticket && Array.isArray(passengers)) {
      let adultCount = passengers.filter(p => p.type === "Adult").length;
      let childCount = passengers.filter(p => p.type === "Child").length;
      let infantCount = passengers.filter(p => p.type === "Infant").length;
      const adultPrice = parseFloat(ticket.adult_price) || 0;
      const childPrice = parseFloat(ticket.child_price) || 0;
      const infantPrice = parseFloat(ticket.infant_price) || 0;
      const total = adultCount * adultPrice + childCount * childPrice + infantCount * infantPrice;
      setComputedTotal(total);
    }
  }, [ticket, passengers, computedTotal]);

  const handlePaymentSelect = (method) => {
    setSelectedPayment(method);
  };

  const [formData, setFormData] = useState({
    beneficiaryAccount: '0ufgkJHG',
    agentAccount: '',
    amount: '',
    date: '2023-12-01',
    note: '',
    // cash-specific
    bankName: '',
    cashDepositorName: '',
    cashDepositorCnic: '',
    // kuikpay/trx
    kuickpay_trn: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSlipSelect = () => {
    // Trigger native file picker for slip upload
    if (fileInputRef && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const f = e?.target?.files && e.target.files[0];
    if (f) {
      setSlipFile(f);
    }
  };

  // Beneficiary accounts will be fetched from backend
  const [beneficiaryAccounts, setBeneficiaryAccounts] = useState([]);
  const [beneficiaryLoading, setBeneficiaryLoading] = useState(false);
  const [beneficiaryError, setBeneficiaryError] = useState(null);
  const [agentAccounts, setAgentAccounts] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [, setConfirmError] = useState(null);
  const navigate = useNavigate();
  const [slipFile, setSlipFile] = useState(null);
  const fileInputRef = useRef(null);

  // Update amount field when computedTotal changes
  useEffect(() => {
    if (computedTotal && computedTotal > 0) {
      // store a plain numeric string in the input (no currency prefix/suffix)
      setFormData(prev => ({ ...prev, amount: String(Math.round(computedTotal)) }));
    }
  }, [computedTotal]);

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    try {
      const orgData = JSON.parse(agentOrg);
      return orgData.ids ? orgData.ids[0] : orgData.id || null;
    } catch {
      return null;
    }
  };

  const getOrgContext = () => {
    const raw = localStorage.getItem('agentOrganization');
    if (!raw) return { organization: null, branch: null, agency: null, user: null };
    try {
      const parsed = JSON.parse(raw);
      const organization = Array.isArray(parsed.ids) && parsed.ids.length ? parsed.ids[0] : (parsed.organization?.id || parsed.organization_id || parsed.id || null);
      const branch = parsed.branch_id || parsed.branch?.id || null;
      const agency = parsed.agency_id || parsed.agency?.id || null;
      const user = parsed.user_id || parsed.user?.id || parsed.id || null;
      return { organization, branch, agency, user };
    } catch {
      return { organization: null, branch: null, agency: null, user: null };
    }
  };

  const parseAmount = (val) => {
    if (val === null || val === undefined) return 0;
    try {
      if (typeof val === 'number') return val;
      // Remove any non-digit characters (commas, currency symbols, trailing text)
      // This avoids cases like "Rs.12,000/-" becoming ".12000" which parses to 0.12
      const digitsOnly = String(val).replace(/[^0-9]/g, '');
      return digitsOnly ? Number(digitsOnly) : 0;
    } catch { return 0; }
  };

  // Fetch beneficiary bank accounts from API for the agent organization
  useEffect(() => {
    const fetchAccounts = async () => {
      const orgId = getOrgId();
      if (!orgId) return;
      setBeneficiaryLoading(true);
      setBeneficiaryError(null);

      // token candidates similar to other pages
      const token = localStorage.getItem('agentAccessToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');

      try {
        const resp = await axios.get(`http://127.0.0.1:8000/api/bank-accounts/?organization=${orgId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const data = resp.data || [];
        setBeneficiaryAccounts(data);
        // split out agent-specific accounts (non-company)
        const agents = data.filter(a => a.is_company_account === false || a.is_company_account === 'false');
        setAgentAccounts(agents);

        // Derive company accounts (to be shown in beneficiary dropdown)
        const companyAccounts = data.filter(a => a.is_company_account === true || a.is_company_account === 'true');

        // default select to first company account (fallback to first account)
        if (!formData.beneficiaryAccount) {
          const pick = companyAccounts.length > 0 ? companyAccounts[0] : data[0];
          if (pick) setFormData(prev => ({ ...prev, beneficiaryAccount: String(pick.id) }));
        }

        if (agents.length > 0 && !formData.agentAccount) {
          setFormData(prev => ({ ...prev, agentAccount: String(agents[0].id) }));
        }
      } catch (err) {
        console.error('Failed to fetch beneficiary accounts', err);
        setBeneficiaryError('Failed to load accounts');
      } finally {
        setBeneficiaryLoading(false);
      }
    };

    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmOrder = async () => {
    setIsConfirming(true);
    setConfirmError(null);
    const selected = beneficiaryAccounts.find(a => String(a.id) === String(formData.beneficiaryAccount));
    const selectedAgent = agentAccounts.find(a => String(a.id) === String(formData.agentAccount));
    const payload = {
      bookingId,
      method: selectedPayment,
      beneficiary_account_id: formData.beneficiaryAccount || null,
      beneficiary_account: selected || null,
      agent_account_id: formData.agentAccount || null,
      agent_account: selectedAgent || null,
      amount: formData.amount,
      date: formData.date,
      note: formData.note
    };
    // Attach cash-specific fields when paying by cash
    if (selectedPayment === 'cash') {
      payload.cash_bank_name = formData.bankName || null;
      payload.cash_depositor_name = formData.cashDepositorName || null;
      payload.cash_depositor_cnic = formData.cashDepositorCnic || null;
    }
    // Attach kuikpay trx when present (field kept but KuikPay is disabled)
    if (formData.kuickpay_trn) payload.kuickpay_trn = formData.kuickpay_trn;
    console.log('Confirm Order payload (payment summary):', payload);

    // POST a payment record (status: pending), then update booking status to Confirmed + payment_pending
    try {
      if (!bookingId) throw new Error('Missing bookingId');
      const token = localStorage.getItem('agentAccessToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const { organization, branch, agency, user } = getOrgContext();

      // Validate required fields depending on payment method
      const amountNum = parseAmount(formData.amount || computedTotal);
      if (!amountNum || amountNum <= 0) {
        throw new Error('Invalid amount. Please enter a valid amount before confirming.');
      }

      if ((selectedPayment === 'bank-transfer' || selectedPayment === 'cheque' || selectedPayment === 'bank') && !formData.beneficiaryAccount) {
        throw new Error('Please select a beneficiary (company) account.');
      }
      if ((selectedPayment === 'bank-transfer' || selectedPayment === 'cheque' || selectedPayment === 'bank') && !formData.agentAccount) {
        throw new Error('Please select an agent account.');
      }
      if (selectedPayment === 'cash') {
        if (!formData.bankName) throw new Error('Enter bank name for cash deposit');
        if (!formData.cashDepositorName) throw new Error('Enter depositor name for cash deposit');
        if (!formData.cashDepositorCnic) throw new Error('Enter depositor CNIC for cash deposit');
      }

      // For bank transfer / cheque, ensure a slip has been uploaded
      if ((selectedPayment === 'bank-transfer' || selectedPayment === 'cheque' || selectedPayment === 'bank') && !slipFile) {
        throw new Error('Please upload the payment slip for bank transfer or cheque before confirming.');
      }

      // Build multipart form data similar to admin AddPayment
      const formPayload = new FormData();
      // Map method to readable label
      const methodLabel = selectedPayment === 'cash' ? 'Cash' : (selectedPayment === 'bank-transfer' ? 'Bank Transfer' : (selectedPayment === 'cheque' ? 'Cheque' : selectedPayment));
      formPayload.append('method', methodLabel);
      formPayload.append('payment_type', 'booking');
      formPayload.append('amount', String(amountNum));
      formPayload.append('remarks', formData.note || '');
      formPayload.append('status', 'pending');

      if (organization) formPayload.append('organization', String(organization));
      if (branch) formPayload.append('branch', String(branch));
      if (agency) formPayload.append('agency', String(agency));
      if (user) formPayload.append('agent', String(user));

      // Attach beneficiary/company bank account and agent account or cash fields
      if (formData.beneficiaryAccount) formPayload.append('organization_bank_account', String(formData.beneficiaryAccount));
      if (selectedPayment === 'cash') {
        if (formData.bankName) formPayload.append('bank', String(formData.bankName));
        if (formData.cashDepositorName) formPayload.append('cash_depositor_name', String(formData.cashDepositorName));
        if (formData.cashDepositorCnic) formPayload.append('cash_depositor_cnic', String(formData.cashDepositorCnic));
      } else {
        if (formData.agentAccount) formPayload.append('agent_bank_account', String(formData.agentAccount));
      }
      if (formData.kuickpay_trn) formPayload.append('kuickpay_trn', String(formData.kuickpay_trn));

      // Append slip file (if provided)
      if (slipFile) {
        formPayload.append('slip', slipFile);
      }

      // send payment to backend
      const resp = await axios.post('http://127.0.0.1:8000/api/payments/', formPayload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      console.log('Payment created:', resp.data);

      // After payment record is created (pending), update booking status
      const paymentPatchHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      const patchBody = {
        status: 'Confirmed',
        payment_status: 'Pending',
        is_paid: false
      };
      await axios.patch(`http://127.0.0.1:8000/api/bookings/${bookingId}/`, patchBody, { headers: paymentPatchHeaders });
      console.log('Booking patched to Confirmed with payment pending');

      // Navigate to booking history (the Add Payment page will show the deposit as pending)
      navigate('/booking-history');
    } catch (err) {
      console.error('Confirm order failed:', err);
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : (err.message || 'Unknown error');
      setConfirmError(msg);
      alert('Failed to confirm booking/payment: ' + msg);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleHoldBooking = async () => {
    // Set booking status to Pending and redirect to booking history
    if (!bookingId) { alert('No bookingId available to hold'); return; }
    setIsConfirming(true);
    try {
      const token = localStorage.getItem('agentAccessToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      // ensure booking.status and payment_status are both Pending
      await axios.patch(`http://127.0.0.1:8000/api/bookings/${bookingId}/`, { status: 'Pending', payment_status: 'Pending', is_paid: false }, { headers });
      navigate('/booking-history');
    } catch (err) {
      console.error('Failed to put booking on hold:', err);
      alert('Failed to hold booking. See console.');
    } finally {
      setIsConfirming(false);
    }
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
            {/* Step Progress */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex align-items-center flex-wrap">
                  {/* Step 1 */}
                  <div className="d-flex align-items-center me-4">
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "30px",
                        height: "30px",
                        fontSize: "14px",
                      }}
                    >
                      1
                    </div>
                    <span className="ms-2 text-primary fw-bold">
                      Booking Detail
                    </span>
                  </div>

                  {/* Line 1 (active) */}
                  <div
                    className="flex-grow-1"
                    style={{ height: "2px", backgroundColor: "#0d6efd" }}
                  ></div>

                  {/* Step 2 (now marked complete) */}
                  <div className="d-flex align-items-center mx-4">
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "30px",
                        height: "30px",
                        fontSize: "14px",
                      }}
                    >
                      2
                    </div>
                    <span className="ms-2 text-primary fw-bold">
                      Booking Review
                    </span>
                  </div>

                  {/* Line 2 (active) */}
                  <div
                    className="flex-grow-1"
                    style={{ height: "2px", backgroundColor: "#0d6efd" }}
                  ></div>

                  {/* Step 3 (still upcoming) */}
                  <div className="d-flex align-items-center">
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "30px",
                        height: "30px",
                        fontSize: "14px",
                      }}
                    >
                      3
                    </div>
                    <span className="ms-2 text-primary fw-bold">Payment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Section */}
            <h5 className="mb-3 fw-bold">Flight Details</h5>
            <div className="card mb-4">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-2 text-center">
                    <img
                      src={airlineInfo.logo || logo}
                      alt={airlineInfo.name || "Airline"}
                      className="mb-2"
                      width={"140px"}
                      style={{ objectFit: 'contain', maxHeight: 80 }}
                    />
                    <div className="d-flex flex-wrap gap-3">
                      <small className="text-primary d-flex align-items-center">
                        {ticket?.is_refundable ? 'Refundable' : 'Non-Refundable'}
                      </small>

                      <div className="d-flex align-items-center text-muted">
                        <Bag className="me-1" size={16} />
                        <small>Total: {ticket?.weight || 0} kg psc: {ticket?.pieces || 0}</small>
                      </div>

                      <div className="d-flex align-items-center text-muted">
                        <Utensils className="me-1" size={16} />
                        <small>{ticket?.is_meal_included ? 'Meal Included' : 'No Meal'}</small>
                      </div>
                    </div>
                    <div className="text-muted small mt-2">
                      {airlineInfo.name || resolveAirlineName(ticket?.airline) || ''}
                      {(airlineInfo.code || resolveAirlineCode(ticket?.airline)) ? ` (${airlineInfo.code || resolveAirlineCode(ticket?.airline)})` : ''}
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-center">
                        <h4 className="fw-bold mb-0">{cityCode(outboundTrip?.departure_city)}</h4>
                        <small className="text-muted">{formatDate(outboundTrip?.departure_date_time || ticket?.departure_date_time)}</small>
                        <div className="text-muted">{formatTime(outboundTrip?.departure_date_time || ticket?.departure_date_time)}</div>
                        <div className="text-muted small">{cityDisplay(outboundTrip?.departure_city || ticket?.departure_city)}</div>
                      </div>

                      <div className="flex-grow-1 text-center">
                        {renderStopoverDetails(outboundStopover)}
                        <div
                          style={{
                            height: "2px",
                            backgroundColor: "#dee2e6",
                            margin: "5px 20px",
                          }}
                        ></div>
                      </div>

                      <div className="text-center">
                        <h4 className="fw-bold mb-0">{cityCode(outboundTrip?.arrival_city)}</h4>
                        <small className="text-muted">{formatDate(outboundTrip?.arrival_date_time || ticket?.arrival_date_time)}</small>
                        <div className="text-muted">{formatTime(outboundTrip?.arrival_date_time || ticket?.arrival_date_time)}</div>
                        <div className="text-muted small">{cityDisplay(outboundTrip?.arrival_city || ticket?.arrival_city)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-2 text-end">
                    <h5 className="fw-bold mb-0">{computedTotal ? `PKR ${computedTotal.toLocaleString()}` : (ticket?.adult_price ? `PKR ${ticket.adult_price}` : 'PKR --')}</h5>
                    <small className="text-danger">{ticket?.left_seats ? `${ticket.left_seats} Seats Left` : ''}</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {/* Total Price Section */}
              <h5 className="mb-3 fw-bold">Total Price</h5>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-primary">
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Passport No</th>
                      <th>Fare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(passengers) && passengers.length > 0 ? (
                      passengers.map((p, idx) => (
                        <tr key={idx} style={{ background: "#F3FAFF" }}>
                          <td>{p.type || "Adult"}</td>
                          <td>{p.title || "Mr"}</td>
                          <td>{p.firstName || p.first_name || ""}</td>
                          <td>{p.lastName || p.last_name || ""}</td>
                          <td>{p.passportNumber || p.passport_number || p.passportNo || ""}</td>
                          <td>{ticket ? (ticket.adult_price ? ticket.adult_price : computedTotal) : computedTotal}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">No passenger data provided.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Payment Section */}
              <div className="card mt-5 mb-4 p-3">
                <h5 className="mb-0 fw-bold">Total Payment</h5>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6">
                      <div className=" fw-bold">Flight Ticket</div>
                      <div>{ticket ? `${ticket.adult_price || 0} x ${Array.isArray(passengers) ? passengers.length : 0} Pax` : ''}</div>
                    </div>
                    <div className="col-6">
                      <div className=" fw-bold">Total Amount</div>
                      <div className="">{computedTotal ? `Rs.${computedTotal.toLocaleString()}/-` : 'Rs.0/-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <h5 className="mb-0 mt-5 fw-bold">Select Payment Method</h5>
              <h5 className="mb-0 mt-5 fw-bold">Select Payment Method</h5>
              <div className="card border-0">
                <div className="card-body">
                  <div className="row g-3">
                    {/* Payment Options in One Row: Bank Transfer, Cash, Cheque, KuikPay */}
                    <div className="col-md-3">
                      <div
                        className={`card h-100 ${selectedPayment === "bank-transfer" ? "border-primary bg-primary text-white" : "border-secondary"}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handlePaymentSelect("bank-transfer")}
                      >
                        <div className="card-body text-center position-relative">
                          <div className="mb-2">
                            <i className="bi bi-bank2 fs-2"></i>
                          </div>
                          <h6 className="card-title">Bank Transfer</h6>
                          <small>Transfer via company bank account</small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div
                        className={`card h-100 ${selectedPayment === "cash" ? "border-primary bg-primary text-white" : "border-secondary"}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handlePaymentSelect("cash")}
                      >
                        <div className="card-body text-center">
                          <div className="mb-2">
                            <i className="bi bi-cash-stack fs-2"></i>
                          </div>
                          <h6 className="card-title">Cash</h6>
                          <small>Pay cash at the office</small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div
                        className={`card h-100 ${selectedPayment === "cheque" ? "border-primary bg-primary text-white" : "border-secondary"}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handlePaymentSelect("cheque")}
                      >
                        <div className="card-body text-center">
                          <div className="mb-2">
                            <i className="bi bi-file-earmark-text fs-2"></i>
                          </div>
                          <h6 className="card-title">Cheque</h6>
                          <small>Issue cheque to company</small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div
                        className={`card h-100 border-secondary`}
                        style={{ cursor: 'not-allowed', backgroundColor: '#fff8e1', borderColor: '#ffecb3' }}
                      >
                        <div className="card-body text-center">
                          <div className="mb-2">
                            <i className="bi bi-wallet2 fs-2"></i>
                          </div>
                          <h6 className="card-title">KuikPay <small className="text-warning ms-2">(Coming soon)</small></h6>
                          <small className="text-muted">Quick mobile / digital payment (disabled)</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                {/* Beneficiary Account */}
                    <div className="col-lg-3 col-md-6">
                      <label className="form-label text-muted small mb-1">
                        Beneficiary Account
                      </label>
                      <select
                        className="form-select"
                        name="beneficiaryAccount"
                        value={formData.beneficiaryAccount}
                        onChange={handleInputChange}
                      >
                        <option value="">Select account</option>
                        {beneficiaryAccounts
                          .filter(acc => acc.is_company_account === true || acc.is_company_account === 'true')
                          .map(acc => (
                            <option key={acc.id} value={String(acc.id)}>
                              {acc.bank_name} - {acc.account_title} ({acc.account_number})
                            </option>
                          ))}
                      </select>
                  {/* Show selected beneficiary account details */}
                  <div className="mt-2 small text-muted">
                    {beneficiaryLoading ? (
                      <div>Loading accounts...</div>
                    ) : beneficiaryError ? (
                      <div className="text-danger">{beneficiaryError}</div>
                    ) : (
                      (() => {
                        const sel = beneficiaryAccounts.find(a => String(a.id) === String(formData.beneficiaryAccount));
                        if (!sel) return <div>No account selected.</div>;
                        return (
                          <div>
                            <div><strong>{sel.account_title || sel.bank_name}</strong></div>
                            <div>Account No: {sel.account_number || '—'}</div>
                            <div>IBAN: {sel.iban || '—'}</div>
                            <div>Bank: {sel.bank_name || '—'}</div>
                            <div>Branch: {sel.branch?.name || (sel.branch || '—')}</div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Agent Account or Cash inputs or KuikPay message */}
                <div className="col-lg-3 col-md-6">
                  {selectedPayment === 'cash' ? (
                    <>
                      <label className="form-label text-muted small mb-1">Bank Name</label>
                      <input type="text" className="form-control" name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="Bank where cash deposited" />
                      <label className="form-label text-muted small mb-1 mt-2">Cash Depositor Name</label>
                      <input type="text" className="form-control" name="cashDepositorName" value={formData.cashDepositorName} onChange={handleInputChange} placeholder="Depositor full name" />
                      <label className="form-label text-muted small mb-1 mt-2">Cash Depositor CNIC</label>
                      <input type="text" className="form-control" name="cashDepositorCnic" value={formData.cashDepositorCnic} onChange={handleInputChange} placeholder="12345-1234567-1" />
                    </>
                  ) : selectedPayment === 'kuikpay' ? (
                    <div className="p-3" style={{ backgroundColor: '#fff8e1', border: '1px solid #ffecb3', borderRadius: 6 }}>
                      <div className="fw-semibold">KuikPay — Coming Soon</div>
                      <div className="small text-muted">KuikPay is not yet available. We'll enable this soon.</div>
                    </div>
                  ) : (
                    <>
                      <label className="form-label text-muted small mb-1">Agent Account</label>
                      <select className="form-select" name="agentAccount" value={formData.agentAccount} onChange={handleInputChange}>
                        <option value="">Select agent account</option>
                        {agentAccounts.length > 0 ? (
                          agentAccounts.map(acc => (
                            <option key={acc.id} value={String(acc.id)}>
                              {acc.bank_name} - {acc.account_title} ({acc.account_number})
                            </option>
                          ))
                        ) : (
                          <option value="">No agent accounts</option>
                        )}
                      </select>
                      <div className="mt-2 small text-muted">
                        {agentAccounts.length === 0 ? (
                          <div>No agent account selected.</div>
                        ) : (() => {
                          const selA = agentAccounts.find(a => String(a.id) === String(formData.agentAccount));
                          if (!selA) return <div>No agent account selected.</div>;
                          return (
                            <div>
                              <div><strong>{selA.account_title || selA.bank_name}</strong></div>
                              <div>Account No: {selA.account_number || '—'}</div>
                              <div>IBAN: {selA.iban || '—'}</div>
                              <div>Bank: {selA.bank_name || '—'}</div>
                              <div>Branch: {selA.branch?.name || (selA.branch || '—')}</div>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>

                {/* Amount */}
                <div className="col-lg-3 col-md-6">
                  <label className="form-label text-muted small mb-1">Amount</label>
                  <div className="input-group">
                    <span className="input-group-text">Rs.</span>
                    <input
                      type="text"
                      className="form-control"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0"
                      inputMode="numeric"
                    />
                    <span className="input-group-text">/-</span>
                  </div>
                </div>

                {/* Date */}
                <div className="col-lg-3 col-md-6">
                  <label className="form-label text-muted small mb-1">
                    Date
                  </label>
                  <div className="input-group">
                    <input
                      type="date"
                      className="form-control"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                    <span className="input-group-text">
                      <i className="bi bi-calendar3"></i>
                    </span>
                  </div>
                </div>
              </div>

              <div className="row mt-3 mb-4">
                {/* Note */}
                <div className="col-lg-4 col-md-4">
                  <label className="form-label text-muted small mb-1">
                    Note
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="Type Note"
                  />
                </div>

                {/* SLIP SELECT Button */}
                <div className="col-lg-2 col-md-2 d-flex align-items-end">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary px-4 py-2 fw-semibold"
                      onClick={handleSlipSelect}
                      style={{ backgroundColor: '#007bff', border: 'none' }}
                    >
                      SLIP SELECT
                    </button>
                    <div className="mt-2 small text-muted">
                      {slipFile ? (
                        <>
                          <span>{slipFile.name}</span>
                          <button type="button" className="btn btn-link btn-sm ms-2 p-0" onClick={() => setSlipFile(null)}>Remove</button>
                        </>
                      ) : (
                        <span>No slip selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 d-flex justify-content-start gap-2">
                <button className="btn btn-outline-secondary" id="btn" onClick={handleHoldBooking} disabled={isConfirming}>
                  {isConfirming ? 'Processing...' : 'Hold Booking'}
                </button>
                <button className="btn btn-primary" id="btn" onClick={handleConfirmOrder} disabled={isConfirming}>
                  {isConfirming ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPay;
