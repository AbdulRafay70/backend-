import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";
import { Search } from "lucide-react";
import axios from "axios";

const AddDepositForm = () => {
  const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    { name: "Add Payment", path: "/payment/add-payment", isActive: false },
    { name: "Bank Accounts", path: "/payment/bank-accounts", isActive: false },
    { name: "Pending Payments", path: "/payment/pending-payments", isActive: false },
    { name: "Booking History", path: "/payment/booking-history", isActive: false },
  ];

  const [formData, setFormData] = useState({
    modeOfPayment: "Bank Transfer",
    beneficiaryAccount: "",
    agentAccount: "",
    bank: "",
    bankName: "",
    amount: "",
    date: "Fri 12/2023",
    notes: "",
    agencyCode: "",
  });

  const [bankAccounts, setBankAccounts] = useState([]);
  const [orgBanks, setOrgBanks] = useState([]);
  const [agentBanks, setAgentBanks] = useState([]);
  const [bankMap, setBankMap] = useState({});
  const [payments, setPayments] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [slipFile, setSlipFile] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Helper to render an account label (handles object or id shapes). Uses bankMap to resolve ids to records.
  const renderAccountLabel = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    // If it's an object with account_title or bank_name
    if (typeof val === 'object') {
      const acctTitle = val.account_title || val.accountTitle || '';
      const bankName = val.bank_name || val.bankName || '';
      const acctNum = val.account_number || val.accountNumber || '';
      if (acctTitle) return acctTitle;
      if (bankName) return bankName + (acctNum ? ` (${acctNum})` : '');
      try { return JSON.stringify(val); } catch (e) { return String(val); }
    }
    // If it's a numeric id (string or number), try lookup in bankMap
    const id = Number(val);
    if (!Number.isNaN(id) && bankMap && bankMap[id]) {
      const b = bankMap[id];
      const acctTitle = b.account_title || b.accountTitle || '';
      const bankName = b.bank_name || b.bankName || '';
      const acctNum = b.account_number || b.accountNumber || '';
      if (acctTitle) return acctTitle;
      if (bankName) return bankName + (acctNum ? ` (${acctNum})` : '');
      return `Bank ${id}`;
    }
    return String(val);
  };

  // Render label and show id in parentheses when available
  const renderAccountLabelWithId = (val) => {
    const label = renderAccountLabel(val);
    let id = null;
    try {
      if (val && typeof val === 'object') {
        id = val.id || val.pk || val.account_id || val.accountId || null;
      } else {
        const maybe = Number(val);
        if (!Number.isNaN(maybe)) id = maybe;
      }
      // If we still don't have id but bankMap contains a matching record by numeric key, try to find it
      if (!id && val && typeof val !== 'object') {
        const asNum = Number(val);
        if (!Number.isNaN(asNum) && bankMap && bankMap[asNum]) id = asNum;
      }
    } catch (e) {
      id = null;
    }
    if (id) return (<>{label} <small className="text-muted">(ID: {id})</small></>);
    return (<>{label}</>);
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilters, setPaymentFilters] = useState({ agency: '', bank: '', status: '' });

  const [transactions] = useState([
    {
      date: "12-June-2024",
      transType: "SPKCS0",
      beneficiaryAc: "Mr. Ahsan Raza",
      agentAccount: "see",
      amount: "02-JUNE-2024",
      status: "Approved",
      slip: "see",
    },
    {
      date: "12-June-2024",
      transType: "SPKCS0",
      beneficiaryAc: "Mr. Ahsan Raza",
      agentAccount: "see",
      amount: "02-JUNE-2024",
      status: "Active",
      slip: "see",
    }, {
      date: "12-June-2024",
      transType: "SPKCS0",
      beneficiaryAc: "Mr. Ahsan Raza",
      agentAccount: "see",
      amount: "02-JUNE-2024",
      status: "Approved",
      slip: "see",
    }, {
      date: "12-June-2024",
      transType: "SPKCS0",
      beneficiaryAc: "Mr. Ahsan Raza",
      agentAccount: "see",
      amount: "02-JUNE-2024",
      status: "Inactive",
      slip: "see",
    },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const decodeJwt = (token) => {
    try {
      if (!token) return {};
      const parts = token.split('.');
      if (parts.length < 2) return {};
      const payload = parts[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch (e) {
      try { return JSON.parse(atob(token.split('.')[1])); } catch (_) { return {}; }
    }
  };

  // Robustly extract organization id from localStorage selectedOrganization or cached adminOrganizationData
  const getOrgId = () => {
    try {
      // adminOrganizationData is cached full org object in Sidebar
      const adminOrgRaw = localStorage.getItem('adminOrganizationData');
      if (adminOrgRaw) {
        const adminOrg = JSON.parse(adminOrgRaw);
        if (adminOrg && (adminOrg.id || adminOrg.pk)) return adminOrg.id || adminOrg.pk;
      }

      const raw = localStorage.getItem('selectedOrganization');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (!parsed) return 0;
      // direct number or numeric string
      if (typeof parsed === 'number') return parsed;
      if (typeof parsed === 'string' && !isNaN(Number(parsed))) return Number(parsed);
      // common shapes
      if (parsed.ids && Array.isArray(parsed.ids) && parsed.ids.length) return parsed.ids[0];
      if (parsed.id) return parsed.id;
      if (parsed.organization && (parsed.organization.id || parsed.organization_id)) return parsed.organization.id || parsed.organization_id;
      if (parsed.org_id) return parsed.org_id;
      if (parsed.organization_id) return parsed.organization_id;
      return 0;
    } catch (e) {
      return 0;
    }
  };

  const fetchBankAccounts = async () => {
    setLoadingBanks(true);
    try {
      const orgId = getOrgId();
      const token = localStorage.getItem('accessToken');
      const resp = await axios.get(`http://127.0.0.1:8000/api/bank-accounts/?organization=${orgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const items = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setBankAccounts(items);
      const map = {};
      const orgs = [];
      const agents = [];
      items.forEach((b) => {
        map[b.id] = b;
        const normalized = {
          id: b.id,
          bankName: b.bank_name || b.bankName || "",
          accountTitle: b.account_title || b.accountTitle || "",
          accountNumber: b.account_number || b.accountNumber || "",
          isCompany: !!b.is_company_account,
          raw: b,
        };
        if (normalized.isCompany) orgs.push(normalized);
        else agents.push(normalized);
      });
      setBankMap(map);
      setOrgBanks(orgs);
      setAgentBanks(agents);
    } catch (e) {
      console.error('Failed to fetch bank accounts', e);
      setBankAccounts([]);
      setOrgBanks([]);
      setAgentBanks([]);
    } finally {
      setLoadingBanks(false);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const orgId = getOrgId();
      console.debug('fetchPayments - orgId:', orgId, 'agency:', formData?.agencyCode);
      const token = localStorage.getItem('accessToken');
      const decoded = decodeJwt(token);
      // prefer agency selected in the form (formData.agencyCode), otherwise fall back to token/localStorage
      const rawSelected = (() => { try { return JSON.parse(localStorage.getItem('selectedOrganization')) || {}; } catch (_) { return {}; } })();
      const agencyId = formData?.agencyCode || decoded?.agency_id || decoded?.agency || rawSelected?.agency_id || rawSelected?.agency || localStorage.getItem('selectedAgencyId') || 0;
      const params = new URLSearchParams();
      if (orgId) params.append('organization', orgId);
      if (agencyId) params.append('agency', agencyId);
      const url = `http://127.0.0.1:8000/api/payments/?${params.toString()}`;
      const resp = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const items = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setPayments(items);
    } catch (e) {
      console.error('Failed to fetch payments', e);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const orgId = getOrgId();
      console.debug('fetchAgencies - orgId:', orgId);
      const token = localStorage.getItem('accessToken');
      if (!orgId) { setAgencies([]); return; }
      const resp = await axios.get(`http://127.0.0.1:8000/api/agencies/?organization=${orgId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const items = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setAgencies(items);
    } catch (err) {
      console.error('Failed to fetch agencies', err);
      setAgencies([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    (async () => {
      try {
        setSubmitting(true);
        const token = localStorage.getItem('accessToken');
        const decoded = decodeJwt(token || '');
        const orgId = getOrgId();
        const branchStored = JSON.parse(localStorage.getItem('selectedBranch')) || {};
        const branchId = branchStored?.id || localStorage.getItem('selectedBranchId') || decoded?.branch_id || decoded?.branch || 0;
        // prefer agency selected in the form (agencyCode select) when creating a payment
        let agencyId = formData?.agencyCode || decoded?.agency_id || decoded?.agency || localStorage.getItem('selectedAgencyId') || 0;
        const rawSelected = (() => { try { return JSON.parse(localStorage.getItem('selectedOrganization')) || {}; } catch (_) { return {}; } })();
        const agentId = decoded?.user_id || decoded?.user || decoded?.id || rawSelected?.user_id || 0;

        // validate required fields
        if ((formData.modeOfPayment || '').toLowerCase() === 'cash') {
          if (!formData.bank) { alert('Please select a Bank for Cash payments'); setSubmitting(false); return; }
          if (formData.bank === 'other' && !formData.bankName) { alert('Please enter bank name'); setSubmitting(false); return; }
        } else {
          if (!formData.agentAccount) { alert('Please select an Agent Account'); setSubmitting(false); return; }
        }
        if (!formData.beneficiaryAccount) { alert('Please select a Beneficiary (organization) Account'); setSubmitting(false); return; }
        if (!slipFile) { alert('Slip upload is required'); setSubmitting(false); return; }
        const amountStr = (formData.amount || '').toString().replace(/[^0-9.\.\-]/g, '');
        const amount = Number(amountStr) || 0;

        // Build multipart/form-data payload because the backend expects `image` as a file
        const formPayload = new FormData();
        formPayload.append('method', formData.modeOfPayment || 'Bank Transfer');
        formPayload.append('payment_type', formData.payment_type || 'booking');
        formPayload.append('amount', String(amount));
        formPayload.append('remarks', formData.notes || '');
        formPayload.append('status', 'pending');
        formPayload.append('transaction_number', formData.transaction_number || formData.agencyCode || `TRX-${Date.now()}`);
  if (Number(orgId) && Number(orgId) > 0) formPayload.append('organization', String(Number(orgId)));
  if (Number(branchId) && Number(branchId) > 0) formPayload.append('branch', String(Number(branchId)));
        if (agencyId) formPayload.append('agency', String(Number(agencyId)));
  if (agentId) formPayload.append('agent', String(Number(agentId)));
        if (formData.beneficiaryAccount) formPayload.append('organization_bank_account', String(Number(formData.beneficiaryAccount)));
        // Cash: send bank (id or name). Omit agent_bank_account
        if ((formData.modeOfPayment || '').toLowerCase() === 'cash') {
          if (formData.bank === 'other') {
            if (formData.bankName) formPayload.append('bank', String(formData.bankName));
          } else if (formData.bank) {
            // selected bank id
            formPayload.append('bank', String(formData.bank));
          }
          // ensure agent_bank_account is omitted for cash
        } else {
          // Non-cash: include agent_bank_account and omit bank
          if (formData.agentAccount) formPayload.append('agent_bank_account', String(Number(formData.agentAccount)));
        }
        if (formData.kuickpay_trn) formPayload.append('kuickpay_trn', String(formData.kuickpay_trn));

        // Attach slip file as 'image' (file) so backend receives a file upload
        if (slipFile) {
          formPayload.append('image', slipFile);
        }

        const resp = await axios.post('http://127.0.0.1:8000/api/payments/', formPayload, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            // Let the browser set Content-Type with boundary for multipart
          },
        });
        alert('Payment created');
        fetchPayments();
        setFormData((p) => ({ ...p, amount: '', notes: '', agencyCode: '', bank: '', agentAccount: '' }));
        setSlipFile(null);
      } catch (err) {
        console.error('Failed to create payment', err);
        const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
        alert('Failed to create payment: ' + msg);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  useEffect(() => {
    fetchBankAccounts();
    fetchAgencies();
    fetchPayments();
    const onBranch = () => { fetchPayments(); };
    window.addEventListener('branchChanged', onBranch);
    return () => window.removeEventListener('branchChanged', onBranch);
  }, []);

  const handlePaymentFilterChange = (e) => {
    const { name, value } = e.target;
    setPaymentFilters(prev => ({ ...prev, [name]: value }));
  };

  // when the agency selection changes, refresh payments
  useEffect(() => {
    // fetchPayments reads formData.agencyCode so call it when that value changes
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.agencyCode]);

  const getStatusBadge = (status) => {
    const s = (status || '').toString();
    switch (s.toLowerCase()) {
      case 'approved':
        return <span className="rounded-5 p-1" style={{ background: "#ECFDF3", color: "#037847" }}>● Approved</span>;
      case 'rejected':
        return <span className="rounded-5 p-1" style={{ background: "#FEE2E2", color: "#B42318" }}>● Rejected</span>;
      case 'pending':
        return <span className="rounded-5 p-1" style={{ background: "#FFFBEB", color: "#92400E" }}>● Pending</span>;
      case 'inactive':
        return <span className="rounded-5 p-1" style={{ background: "#F2F4F7", color: "#364254" }}>● Inactive</span>;
      case 'active':
        return <span className="rounded-5 p-1" style={{ background: "#ECFDF3", color: "#037847" }}>● Active</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const setRowLoading = (id, value) => setActionLoading(prev => ({ ...prev, [id]: value }));

  const handleApprove = async (paymentId) => {
    if (!paymentId) return;
    const ok = window.confirm('Approve this payment?');
    if (!ok) return;
    try {
      setRowLoading(paymentId, true);
      const token = localStorage.getItem('accessToken');
      const url = `http://127.0.0.1:8000/api/admin/payments/${paymentId}/approve/`;
      await axios.post(url, {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      await fetchPayments();
      window.alert('Payment approved');
    } catch (err) {
      console.error('Failed to approve payment', err, err?.response?.data);
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('Failed to approve payment: ' + msg);
    } finally {
      setRowLoading(paymentId, false);
    }
  };

  const handleReject = async (paymentId) => {
    if (!paymentId) return;
    const ok = window.confirm('Reject this payment? This will set status to Rejected.');
    if (!ok) return;
    try {
      setRowLoading(paymentId, true);
      const token = localStorage.getItem('accessToken');
      const url = `http://127.0.0.1:8000/api/payments/${paymentId}/`;
      await axios.patch(url, { status: 'Rejected' }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      await fetchPayments();
      window.alert('Payment rejected');
    } catch (err) {
      console.error('Failed to reject payment', err, err?.response?.data);
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('Failed to reject payment: ' + msg);
    } finally {
      setRowLoading(paymentId, false);
    }
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
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Add Payment"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                          }`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        {tab.name}
                      </NavLink>
                    ))}
                  </nav>

                  {/* Action Buttons */}
                  <div className="input-group" style={{ maxWidth: "300px" }}>
                    <span className="input-group-text">
                      <Search />
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

              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-header border-0 bg-white">
                  <h4 className="mb-0">Add Deposit</h4>
                </div>

                <div className="card-body">
                  <form>
                    <div className="row mb-3">
                      <div className="col-md-2">
                        <label htmlFor="" className="form-label">
                          Mode Of Payment
                        </label>
                        <select
                          className="form-select shadow-none"
                          name="modeOfPayment"
                          value={formData.modeOfPayment}
                          onChange={handleInputChange}
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Cash">Cash</option>
                        </select>
                      </div>

                      <div className="col-md-3">
                        <label htmlFor="" className="form-label">
                          Beneficiary Account
                        </label>
                        <select
                          className="form-select shadow-none"
                          name="beneficiaryAccount"
                          value={formData.beneficiaryAccount}
                          onChange={handleInputChange}
                        >
                          <option value="">Select beneficiary account</option>
                          {loadingBanks ? <option>Loading...</option> : null}
                          {orgBanks.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.bankName} — {b.accountTitle} ({b.accountNumber})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-3">
                        {formData.modeOfPayment === 'Cash' ? (
                          <>
                            <label htmlFor="" className="form-label">Bank</label>
                            <select
                              className="form-select shadow-none"
                              name="bank"
                              value={formData.bank}
                              onChange={handleInputChange}
                            >
                              <option value="">Select bank</option>
                              {loadingBanks ? <option>Loading...</option> : null}
                              {bankAccounts.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.bank_name || b.bankName || b.account_title || `Bank ${b.id}`}
                                </option>
                              ))}
                              <option value="other">Other (enter bank name)</option>
                            </select>
                            {formData.bank === 'other' ? (
                              <input
                                type="text"
                                className="form-control mt-2 shadow-none"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleInputChange}
                                placeholder="Type bank name (will be created)"
                              />
                            ) : null}
                          </>
                        ) : (
                          <>
                            <label htmlFor="" className="form-label">Agent Account</label>
                            <select
                              className="form-select shadow-none"
                              name="agentAccount"
                              value={formData.agentAccount}
                              onChange={handleInputChange}
                            >
                              <option value="">Select your agent account</option>
                              {loadingBanks ? <option>Loading...</option> : null}
                              {agentBanks.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.bankName} — {b.accountTitle} ({b.accountNumber})
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>

                      <div className="col-md-2">
                        <label htmlFor="" className="form-label">
                          Amount
                        </label>
                        <input
                          type="text"
                          className="form-control shadow-none"
                          name="amount"
                          placeholder="Type Rs.100,000/"
                          value={formData.amount}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-md-2 d-flex align-items-end">
                        <label className="btn btn-outline-secondary w-100 mb-0">
                          {slipFile ? slipFile.name : 'Upload Slip *'}
                          <input type="file" className="d-none" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-3">
                        <label htmlFor="" className="form-label">
                          Date
                        </label>
                        <input
                          type="date"
                          className="form-control shadow-none"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-md-5">
                        <label htmlFor="" className="form-label">
                          Notes
                        </label>
                        <textarea
                          className="form-control shadow-none"
                          name="notes"
                          rows="1"
                          placeholder="Type Note"
                          value={formData.notes}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-md-2">
                        <label htmlFor="" className="form-label">Agency Code</label>
                        <select
                          className="form-select shadow-none"
                          name="agencyCode"
                          value={formData.agencyCode}
                          onChange={handleInputChange}
                        >
                          <option value="">Select agency</option>
                          {agencies.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code || a.agency_code || a.name || `Agency ${a.id}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-2 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-primary w-100"
                          id="btn"
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? 'Submitting…' : 'Add Deposit'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Rules Section */}
                  <div className="mt-4">
                    <ol className="list-unstyled">
                      <li>1. rules</li>
                      <li>2. rule 2</li>
                      <li>3. rules 3</li>
                      <li>4. adiqjk2cc</li>
                    </ol>
                  </div>
                </div>

                {/* Transaction Table */}

                <div className="card-body">
                  <div className="mb-3">
                    <div className="row g-2 align-items-center">
                      <div className="col-auto">
                        <select className="form-select" name="agency" value={paymentFilters.agency} onChange={handlePaymentFilterChange}>
                          <option value="">All agencies</option>
                          {agencies.map(a => <option key={a.id} value={a.id}>{a.code || a.name || `Agency ${a.id}`}</option>)}
                        </select>
                      </div>
                      <div className="col-auto">
                        <select className="form-select" name="bank" value={paymentFilters.bank} onChange={handlePaymentFilterChange}>
                          <option value="">All banks</option>
                          {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bank_name || b.bankName || b.account_title || `Bank ${b.id}`}</option>)}
                        </select>
                      </div>
                      <div className="col-auto">
                        <select className="form-select" name="status" value={paymentFilters.status} onChange={handlePaymentFilterChange}>
                          <option value="">All statuses</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="col-auto">
                        <button className="btn btn-outline-secondary" type="button" onClick={() => setPaymentFilters({ agency: '', bank: '', status: '' })}>Clear</button>
                      </div>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th className="fw-normal text-muted">Date</th>
                          <th className="fw-normal text-muted">transaction</th>
                          <th className="fw-normal text-muted">Trans Type</th>
                          <th className="fw-normal text-muted">Beneficiary ac</th>
                          <th className="fw-normal text-muted">Agent Account</th>
                          <th className="fw-normal text-muted">Amount</th>
                          <th className="fw-normal text-muted">Status</th>
                          <th className="fw-normal text-muted">slip</th>
                          <th className="fw-normal text-muted">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingPayments ? (
                          <tr><td colSpan={9}>Loading payments…</td></tr>
                        ) : (payments || []).filter(p => {
                          if (paymentFilters.agency && String(p.agency || p.agency_id || '') !== String(paymentFilters.agency)) return false;
                          if (paymentFilters.bank && String(p.bank || '') !== String(paymentFilters.bank)) return false;
                          if (paymentFilters.status && String((p.status || p.state || '').toLowerCase()) !== String(paymentFilters.status).toLowerCase()) return false;
                          return true;
                        }).length === 0 ? (
                          <tr><td colSpan={9}>No payments found.</td></tr>
                        ) : (
                          (payments || []).filter(p => {
                            if (paymentFilters.agency && String(p.agency || p.agency_id || '') !== String(paymentFilters.agency)) return false;
                            if (paymentFilters.bank && String(p.bank || '') !== String(paymentFilters.bank)) return false;
                            if (paymentFilters.status && String((p.status || p.state || '').toLowerCase()) !== String(paymentFilters.status).toLowerCase()) return false;
                            return true;
                          }).map((p) => (
                            <tr key={p.id || p.transaction_number || Math.random()}>
                              <td>{p.created_at || p.date || p.transaction_date || ''}</td>
                              <td>{p.transaction_number || ''}</td>
                              {/* Trans Type column */}
                              <td>{p.method || p.transaction_type || p.transType || '-'}</td>
                              {/* Organization / Beneficiary account (resolve id via bankMap when nested object missing) */}
                              <td>
                                {renderAccountLabel(
                                  p.organization_bank_account ?? p.organization_bank_account_id ?? p.organization_bank_account_pk ?? (p.organization_bank_account && p.organization_bank_account.id) ?? p.organization_bank_account
                                )}
                              </td>
                              {/* Agent account (resolve id via bankMap when nested object missing) */}
                              <td>
                                {renderAccountLabel(
                                  p.agent_bank_account ?? p.agent_bank_account_id ?? p.agent_bank_account_pk ?? (p.agent_bank_account && p.agent_bank_account.id) ?? p.agent_bank_account
                                )}
                              </td>
                              <td>{p.amount || p.total || ''}</td>
                              <td>{getStatusBadge(p.status || (p.state || ''))}</td>
                              <td>{p.image ? (<a href={p.image} target="_blank" rel="noreferrer">View</a>) : (p.slip || '')}</td>
                              <td>
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-success"
                                    disabled={!!actionLoading[p.id]}
                                    onClick={() => handleApprove(p.id)}
                                  >
                                    {actionLoading[p.id] ? '...' : 'Approve'}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    disabled={!!actionLoading[p.id]}
                                    onClick={() => handleReject(p.id)}
                                  >
                                    {actionLoading[p.id] ? '...' : 'Reject'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div >
        </div >
      </div>
    </div>
  );
};

export default AddDepositForm;
