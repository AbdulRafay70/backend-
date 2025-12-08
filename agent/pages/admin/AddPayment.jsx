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

  const defaultDate = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
  const [formData, setFormData] = useState({
    modeOfPayment: "Bank Transfer",
    beneficiaryAccount: "",
    agentAccount: "",
    bank: "",
    bankName: "",
    cashDepositorName: "",
    cashDepositorCnic: "",
    amount: "",
    date: defaultDate,
    notes: "",
  });

  const [bankAccounts, setBankAccounts] = useState([]);
  const [orgBanks, setOrgBanks] = useState([]);
  const [agentBanks, setAgentBanks] = useState([]);
  const [bankMap, setBankMap] = useState({});
  const [payments, setPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [agencies, setAgencies] = useState([]);
  const [agencySearchResults, setAgencySearchResults] = useState([]);
  const [agencySearchQuery, setAgencySearchQuery] = useState('');
  const [showAgencySearchDropdown, setShowAgencySearchDropdown] = useState(false);
  const [selectedSearchAgency, setSelectedSearchAgency] = useState(null);
  const [agencyAccounts, setAgencyAccounts] = useState([]);
  const [slipFile, setSlipFile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Payment rules: load from API or localStorage. `selectedRules` are the ones shown on the Add Payment page.
  const [paymentRules, setPaymentRules] = useState([]);
  const [selectedRules, setSelectedRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);

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

  // Helper to extract account number (if available) from various shapes (object or id via bankMap)
  const renderAccountNumber = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'object') {
      return val.account_number || val.accountNumber || val.account_no || val.ac || '-';
    }
    const id = Number(val);
    if (!Number.isNaN(id) && bankMap && bankMap[id]) {
      const b = bankMap[id];
      return b.account_number || b.accountNumber || b.account_no || '-';
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

  // --- Pagination & filtered payments helpers ---
  const applyPaymentFilters = (list) => {
    try {
      return (list || []).filter(p => {
        if (paymentFilters.agency && String(p.agency || p.agency_id || '') !== String(paymentFilters.agency)) return false;
        if (paymentFilters.bank && String(p.bank || '') !== String(paymentFilters.bank)) return false;
        if (paymentFilters.status && String((p.status || p.state || '').toLowerCase()) !== String(paymentFilters.status).toLowerCase()) return false;
        return true;
      });
    } catch (e) {
      return list || [];
    }
  };

  const filteredPayments = applyPaymentFilters(payments);
  const totalPayments = filteredPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalPayments / pageSize));

  // Ensure current page is valid when filters/pageSize change
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPayments, pageSize, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalPayments);
  const displayedPayments = filteredPayments.slice(startIndex, endIndex);

  const goToPage = (n) => {
    if (!n) return;
    let page = Number(n);
    if (Number.isNaN(page)) return;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e) => {
    const v = Number(e.target.value) || 10;
    setPageSize(v);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    // windowed pagination: show first, last and neighbourhood
    const left = Math.max(1, currentPage - 3);
    const right = Math.min(totalPages, currentPage + 3);
    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push('left-ellipsis');
    }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) {
      if (right < totalPages - 1) pages.push('right-ellipsis');
      pages.push(totalPages);
    }
    return pages;
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

  const showNotification = (type, message, duration = 4500) => {
    try {
      const id = Date.now() + Math.random();
      const item = { id, type: type || 'info', message };
      setNotifications((s) => [...s, item]);
      if (duration && duration > 0) {
        setTimeout(() => {
          setNotifications((s) => s.filter(n => n.id !== id));
        }, duration);
      }
    } catch (e) {
      // fallback to alert if something goes very wrong
      try { window.alert(message); } catch (_) { /* ignore */ }
    }
  };

  const removeNotification = (id) => setNotifications((s) => s.filter(n => n.id !== id));

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
      const resp = await axios.get(`https://api.saer.pk/api/bank-accounts/?organization=${orgId}`, {
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
      // This function now supports fetching all payments (no agency) or by agency via fetchPaymentsByAgency
      const orgId = getOrgId();
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (orgId) params.append('organization', orgId);
      const baseUrl = `https://api.saer.pk/api/payments/?${params.toString()}`;
      const items = await fetchAllPages(baseUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setPayments(items);
      setCurrentPage(1);
    } catch (e) {
      console.error('Failed to fetch payments', e);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Fetch payments for a specific agency using the endpoint requested by the user
  const fetchPaymentsByAgency = async (agencyId) => {
    setLoadingPayments(true);
    try {
      if (!agencyId) { setPayments([]); setLoadingPayments(false); return; }
      const token = localStorage.getItem('accessToken');
      const url = `https://api.saer.pk/api/payments/by-agency/${agencyId}/payments/`;
      const items = await fetchAllPages(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setPayments(items);
      setCurrentPage(1);
    } catch (e) {
      console.error('Failed to fetch payments by agency', e);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  // helper to fetch all paginated results (DRF style) by following `next` links
  const fetchAllPages = async (startUrl, config = {}) => {
    const all = [];
    try {
      let next = startUrl;
      while (next) {
        const resp = await axios.get(next, config);
        const data = resp.data;
        if (Array.isArray(data)) {
          // non-paginated
          all.push(...data);
          break;
        }
        const items = data.results || [];
        all.push(...items);
        next = data.next || null;
      }
    } catch (e) {
      console.error('fetchAllPages error', e);
    }
    return all;
  };

  const fetchAgencies = async () => {
    try {
      const orgId = getOrgId();
      console.debug('fetchAgencies - orgId:', orgId);
      const token = localStorage.getItem('accessToken');
      if (!orgId) { setAgencies([]); return; }
      const resp = await axios.get(`https://api.saer.pk/api/agencies/?organization=${orgId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const items = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setAgencies(items);
    } catch (err) {
      console.error('Failed to fetch agencies', err);
      setAgencies([]);
    }
  };

  // Fetch agencies that have bank accounts using the special endpoint
  const searchAgenciesWithAccounts = async (query = '') => {
    try {
      const orgId = getOrgId();
      if (!orgId) { setAgencySearchResults([]); return; }
      const token = localStorage.getItem('accessToken');
      const url = `https://api.saer.pk/api/bank-accounts/by-organization/${orgId}/agency-accounts/`;
      const resp = await axios.get(url, { params: { search: query }, headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const items = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setAgencySearchResults(items);
      setShowAgencySearchDropdown(true);
    } catch (e) {
      console.error('Failed to search agencies with accounts', e);
      setAgencySearchResults([]);
    }
  };

  // Fetch bank accounts for a specific agency
  const fetchBankAccountsByAgency = async (agencyId) => {
    try {
      if (!agencyId) { setAgencyAccounts([]); return; }
      const token = localStorage.getItem('accessToken');
      const url = `https://api.saer.pk/api/bank-accounts/by-agency/${agencyId}/`;
      const resp = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const items = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setAgencyAccounts(items);
      // populate agentBanks so the Agent Account select shows these accounts
      const mapped = items.map(b => ({ id: b.id, bankName: b.bank_name || b.bankName || '', accountTitle: b.account_title || b.accountTitle || '', accountNumber: b.account_number || b.accountNumber || '' }));
      setAgentBanks(mapped);
    } catch (e) {
      console.error('Failed to fetch bank accounts by agency', e);
      setAgencyAccounts([]);
      setAgentBanks([]);
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
        // prefer agency selected in the agency-search panel when creating a payment
        let agencyId = (selectedSearchAgency && (selectedSearchAgency.id || selectedSearchAgency.pk)) || decoded?.agency_id || decoded?.agency || localStorage.getItem('selectedAgencyId') || 0;
        // if an agency is selected in the form, prefer its branch for the payment
        try {
          const selAgency = (agencies || []).find(a => String(a.id) === String(agencyId) || (selectedSearchAgency && String(a.id) === String(selectedSearchAgency.id)));
          if (selAgency) {
            // agency may include branch or branch_id
            const branchFromAgency = selAgency.branch || selAgency.branch_id || selAgency.branchId || (selAgency.branch && (selAgency.branch.id || selAgency.branch.pk));
            if (branchFromAgency) {
              // override branchId to agency's branch
              // ensure numeric
              const asNum = Number(branchFromAgency);
              if (!Number.isNaN(asNum) && asNum > 0) {
                // use branchFromAgency as branchId
                // Note: branchId variable defined below will pick this up when building payload
                // but we'll also set branchId variable directly here for clarity
                // (branchId is const earlier; so we recompute below when appending)
              }
            }
          }
        } catch (e) { /* ignore */ }
        const rawSelected = (() => { try { return JSON.parse(localStorage.getItem('selectedOrganization')) || {}; } catch (_) { return {}; } })();
        const agentId = decoded?.user_id || decoded?.user || decoded?.id || rawSelected?.user_id || 0;

        // validate required fields
        if ((formData.modeOfPayment || '').toLowerCase() === 'cash') {
          if (!formData.bankName) { showNotification('warning', 'Please enter Bank name for Cash payments'); setSubmitting(false); return; }
          if (!formData.cashDepositorName) { showNotification('warning', 'Please enter Depositor Name for Cash payments'); setSubmitting(false); return; }
          if (!formData.cashDepositorCnic) { showNotification('warning', 'Please enter Depositor CNIC for Cash payments'); setSubmitting(false); return; }
        } else {
          if (!formData.agentAccount) { showNotification('warning', 'Please select an Agent Account'); setSubmitting(false); return; }
        }
        // If an agency is selected in the Select Agency panel, ensure the chosen agent account belongs to it
        if (selectedSearchAgency) {
          const allowed = (agencyAccounts || []).map(a => String(a.id));
          if (formData.agentAccount && !allowed.includes(String(formData.agentAccount))) {
            showNotification('danger', 'The selected Agent Account does not belong to the selected Agency. Please choose an account for the selected Agency.');
            setSubmitting(false);
            return;
          }
        }
        if (!formData.beneficiaryAccount) { showNotification('warning', 'Please select a Beneficiary (organization) Account'); setSubmitting(false); return; }
        if (!slipFile) { showNotification('warning', 'Slip upload is required'); setSubmitting(false); return; }
        const amountStr = (formData.amount || '').toString().replace(/[^0-9.\.\-]/g, '');
        const amount = Number(amountStr) || 0;

        // Build multipart/form-data payload because the backend expects `image` as a file
        const formPayload = new FormData();
        formPayload.append('method', formData.modeOfPayment || 'Bank Transfer');
        formPayload.append('payment_type', formData.payment_type || 'booking');
        formPayload.append('amount', String(amount));
        formPayload.append('remarks', formData.notes || '');
        formPayload.append('status', 'pending');
  // Do not generate a transaction number on the frontend; let the backend assign it.
  // Append only if user explicitly provided one in the formData.
  if (formData.transaction_number) formPayload.append('transaction_number', String(formData.transaction_number));
        if (Number(orgId) && Number(orgId) > 0) formPayload.append('organization', String(Number(orgId)));
        // determine branch: prefer branch of selected agency, otherwise branchStored/decoded
        let branchToSend = branchId;
        try {
          const selAgency = (agencies || []).find(a => String(a.id) === String(agencyId) || (selectedSearchAgency && String(a.id) === String(selectedSearchAgency.id)));
          if (selAgency) {
            const branchFromAgency = selAgency.branch || selAgency.branch_id || selAgency.branchId || (selAgency.branch && (selAgency.branch.id || selAgency.branch.pk));
            if (branchFromAgency) branchToSend = Number(branchFromAgency) || branchToSend;
          }
        } catch (e) { /* ignore */ }
        if (Number(branchToSend) && Number(branchToSend) > 0) formPayload.append('branch', String(Number(branchToSend)));
        // Prefer the explicit agency selected in the Select Agency panel when present
        if (selectedSearchAgency && (selectedSearchAgency.id || selectedSearchAgency.pk)) {
          formPayload.append('agency', String(Number(selectedSearchAgency.id || selectedSearchAgency.pk)));
        } else if (agencyId) {
          formPayload.append('agency', String(Number(agencyId)));
        }
        if (agentId) formPayload.append('agent', String(Number(agentId)));
        // include created_by (logged-in user id) when available
        const createdBy = decoded?.user_id || decoded?.user || decoded?.id || 0;
        if (createdBy && Number(createdBy) > 0) formPayload.append('created_by', String(Number(createdBy)));
        if (formData.beneficiaryAccount) formPayload.append('organization_bank_account', String(Number(formData.beneficiaryAccount)));
        // Cash: send bank (id or name). Omit agent_bank_account
        if ((formData.modeOfPayment || '').toLowerCase() === 'cash') {
          // always send bank name for cash payments
          if (formData.bankName) formPayload.append('bank', String(formData.bankName));
          // include depositor details
          if (formData.cashDepositorName) formPayload.append('cash_depositor_name', String(formData.cashDepositorName));
          if (formData.cashDepositorCnic) formPayload.append('cash_depositor_cnic', String(formData.cashDepositorCnic));
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

        const resp = await axios.post('https://api.saer.pk/api/payments/', formPayload, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            // Let the browser set Content-Type with boundary for multipart
          },
        });
        showNotification('success', 'Payment created');
        // After creating a payment, show payments for the selected agency (if any). Do not show all by default.
        if (selectedSearchAgency && (selectedSearchAgency.id || selectedSearchAgency.pk)) {
          fetchPaymentsByAgency(selectedSearchAgency.id || selectedSearchAgency.pk);
        } else {
          // No agency selected: leave payments untouched or fetch all if desired
          fetchPayments();
        }
        // Keep selectedSearchAgency and agency state so the user can continue using that agency
        setFormData((p) => ({ ...p, amount: '', notes: '', bank: '', agentAccount: '' }));
        setSlipFile(null);
      } catch (err) {
        console.error('Failed to create payment', err);
        const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
        showNotification('danger', 'Failed to create payment: ' + msg);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  useEffect(() => {
    fetchBankAccounts();
    fetchAgencies();
    // Do not auto-fetch payments until user searches or clicks 'Show all'
    const onBranch = () => { /* no-op: payments are fetched only after search or Show all */ };
    window.addEventListener('branchChanged', onBranch);
    return () => window.removeEventListener('branchChanged', onBranch);
  }, []);

  // Load payment rules to display on this page. Try API first, fallback to localStorage.
  useEffect(() => {
    let mounted = true;
    const loadRules = async () => {
      setRulesLoading(true);
      try {
        // Feature flag: only call the backend rules API when explicitly enabled.
        // This avoids console 404s when the endpoint doesn't exist in some environments.
        const enableApi = localStorage.getItem('enablePaymentRulesApi') === 'true';
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let res = null;
        if (enableApi) {
          res = await axios.get('https://api.saer.pk/api/admin/payment-rules/', { headers });
        }
        const rules = res ? (Array.isArray(res.data) ? res.data : (res.data.results || [])) : [];
        if (!mounted) return;
        setPaymentRules(rules);
        // If server provides selected/active flag, use that. Otherwise try localStorage selected ids.
        const selFromServer = rules.filter(r => r.selected || r.display_on_payment || r.is_active);
        if (selFromServer.length) {
          setSelectedRules(selFromServer);
        } else {
          const stored = JSON.parse(localStorage.getItem('selectedPaymentRules') || 'null');
          if (Array.isArray(stored) && stored.length) {
            const sel = rules.filter(r => stored.includes(r.id) || stored.includes(String(r.id)));
            setSelectedRules(sel.length ? sel : rules);
          } else {
            setSelectedRules(rules);
          }
        }
      } catch (err) {
        // fallback to localStorage data if API fails
        const all = JSON.parse(localStorage.getItem('paymentRules') || '[]');
        const stored = JSON.parse(localStorage.getItem('selectedPaymentRules') || 'null');
        setPaymentRules(Array.isArray(all) ? all : []);
        if (Array.isArray(stored) && stored.length) {
          const sel = (Array.isArray(all) ? all : []).filter(r => stored.includes(r.id) || stored.includes(String(r.id)));
          setSelectedRules(sel);
        } else {
          setSelectedRules(Array.isArray(all) ? all : []);
        }
      } finally {
        if (mounted) setRulesLoading(false);
      }
    };
    loadRules();
    return () => { mounted = false; };
  }, []);

  const handlePaymentFilterChange = (e) => {
    const { name, value } = e.target;
    setPaymentFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // payments are fetched only after the user clicks Search or Show all — no automatic fetch on agency changes

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
      const url = `https://api.saer.pk/api/admin/payments/${paymentId}/approve/`;
      await axios.post(url, {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      await fetchPayments();
  showNotification('success', 'Payment approved');
    } catch (err) {
      console.error('Failed to approve payment', err, err?.response?.data);
  const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
  showNotification('danger', 'Failed to approve payment: ' + msg);
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
      const url = `https://api.saer.pk/api/payments/${paymentId}/`;
      await axios.patch(url, { status: 'Rejected' }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      await fetchPayments();
  showNotification('success', 'Payment rejected');
    } catch (err) {
      console.error('Failed to reject payment', err, err?.response?.data);
  const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
  showNotification('danger', 'Failed to reject payment: ' + msg);
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
                  {notifications && notifications.length > 0 && (
                    <div className="mb-3">
                      {notifications.map(n => (
                        <div key={n.id} className={`alert alert-${n.type} alert-dismissible`} role="alert">
                          <div>{n.message}</div>
                          <button type="button" className="btn-close" aria-label="Close" onClick={() => removeNotification(n.id)} />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Agency search & selection panel (moved to top of the form) */}
                  <div className="mb-4 p-3 border rounded bg-light">
                    <h5 className="mb-3">Select Agency (agencies with bank accounts)</h5>
                    <div className="row g-2 align-items-center">
                      <div className="col-md-6">
                        <div className="position-relative">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search agencies..."
                            value={selectedSearchAgency ? (selectedSearchAgency.name || selectedSearchAgency.code || selectedSearchAgency.id) : agencySearchQuery}
                            onChange={(e) => { const v = e.target.value; setAgencySearchQuery(v); searchAgenciesWithAccounts(v); }}
                            onFocus={() => searchAgenciesWithAccounts(agencySearchQuery)}
                          />
                          {showAgencySearchDropdown && (agencySearchResults || []).length > 0 && (
                            <div className="position-absolute bg-white border rounded w-100" style={{ zIndex: 2000, maxHeight: 220, overflowY: 'auto' }}>
                              {(agencySearchResults || []).map(a => (
                                <div key={a.id} className="p-2" style={{ cursor: 'pointer' }} onMouseDown={(e) => { e.preventDefault(); setSelectedSearchAgency(a); setAgencySearchQuery(''); setShowAgencySearchDropdown(false); fetchBankAccountsByAgency(a.id); }}>
                                  {a.name || a.code || (`Agency ${a.id}`)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-auto">
                        <button type="button" className="btn btn-primary" onClick={() => { if (!selectedSearchAgency) { showNotification('warning', 'Please select an agency to search'); return; } fetchPaymentsByAgency(selectedSearchAgency.id); }}>Search</button>
                      </div>
                      <div className="col-auto">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => { setSelectedSearchAgency(null); setAgencySearchQuery(''); setAgencySearchResults([]); setPayments([]); setAgentBanks([]); }}>Clear</button>
                      </div>

                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="row g-2">

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

                      <div className="col-md-2">
                        <label htmlFor="" className="form-label">Mode of Payment</label>
                        <select
                          className="form-select shadow-none"
                          name="modeOfPayment"
                          value={formData.modeOfPayment}
                          onChange={handleInputChange}
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Online">Online</option>
                        </select>
                      </div>

                      <div className="col-md-3">
                        {formData.modeOfPayment === 'Cash' ? (
                          <>
                            <label htmlFor="" className="form-label">Bank Name</label>
                            <input
                              type="text"
                              className="form-control shadow-none mb-2"
                              name="bankName"
                              value={formData.bankName}
                              onChange={handleInputChange}
                              placeholder="Enter bank name"
                            />
                            <label htmlFor="" className="form-label">Depositor Name</label>
                            <input
                              type="text"
                              className="form-control shadow-none mb-2"
                              name="cashDepositorName"
                              value={formData.cashDepositorName}
                              onChange={handleInputChange}
                              placeholder="Enter depositor full name"
                            />
                            <label htmlFor="" className="form-label">Depositor CNIC</label>
                            <input
                              type="text"
                              className="form-control shadow-none"
                              name="cashDepositorCnic"
                              value={formData.cashDepositorCnic}
                              onChange={handleInputChange}
                              placeholder="e.g. 12345-1234567-1"
                            />
                          </>
                        ) : (
                          <>
                            <label htmlFor="" className="form-label">Agent Account</label>
                            <select
                              className="form-select shadow-none"
                              name="agentAccount"
                              value={formData.agentAccount}
                              onChange={handleInputChange}
                              disabled={!selectedSearchAgency}
                            >
                              {!selectedSearchAgency ? (
                                <option value="">Select an agency first</option>
                              ) : (
                                <>
                                  <option value="">Select your agent account</option>
                                  {loadingBanks ? <option>Loading...</option> : null}
                                  {(agencyAccounts || []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                      {(b.bankName || b.bank_name || b.accountTitle || b.account_title || '')} — {(b.accountTitle || b.account_title || '')} ({(b.accountNumber || b.account_number || '')})
                                    </option>
                                  ))}
                                </>
                              )}
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

                      {/* Agency Code select removed; selection moved to the 'Select Agency' panel above the table */}

                      <div className="col-md-2 d-flex align-items-end">
                        <button
                          type="submit"
                          className="btn btn-primary w-100"
                          id="btn"
                          disabled={submitting}
                        >
                          {submitting ? 'Submitting…' : 'Add Deposit'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Rules Section */}
                  <div className="mt-4">
                    <h5 className="mb-2">Payment Rules</h5>
                    {rulesLoading ? (
                      <div>Loading rules…</div>
                    ) : (selectedRules && selectedRules.length > 0) ? (
                      <ol className="list-unstyled">
                        {selectedRules.map((r, idx) => (
                          <li key={r.id ?? idx}>{r.text || r.title || r.name || r.rule || String(r)}</li>
                        ))}
                      </ol>
                    ) : (
                      <div className="text-muted">No payment rules configured.</div>
                    )}
                  </div>
                  {/* (Duplicate agency panel removed; agency selection is at the top of the form) */}
                </div>

                {/* Transaction Table */}

                <div className="card-body">
                  <div className="mb-3">
                    <div className="row g-2 align-items-center">
                      {/* <div className="col-auto">
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
                      </div> */}
                      <div className="col-auto">
                        <select className="form-select" name="status" value={paymentFilters.status} onChange={handlePaymentFilterChange}>
                          <option value="">All statuses</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="col-auto">
                        <button className="btn btn-outline-primary me-2" type="button" onClick={() => fetchPayments()}>Show all</button>
                        <button className="btn btn-outline-secondary" type="button" onClick={() => { setPaymentFilters({ agency: '', bank: '', status: '' }); setSelectedSearchAgency(null); setAgencySearchQuery(''); setAgencySearchResults([]); setPayments([]); setAgentBanks([]); }}>Clear</button>
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
                          <th className="fw-normal text-muted">Account #</th>
                          <th className="fw-normal text-muted">Agent Account</th>
                          <th className="fw-normal text-muted">Agent Ac #</th>
                          <th className="fw-normal text-muted">Amount</th>
                          <th className="fw-normal text-muted">Status</th>
                          <th className="fw-normal text-muted">slip</th>
                          <th className="fw-normal text-muted">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingPayments ? (
                          <tr><td colSpan={11}>Loading payments…</td></tr>
                        ) : filteredPayments.length === 0 ? (
                          <tr><td colSpan={11}>No payments found.</td></tr>
                        ) : (
                          (displayedPayments || []).map((p) => (
                            <tr key={p.id || p.transaction_number || Math.random()}>
                              <td>{
                                // show only date portion
                                (p.created_at || p.date || p.transaction_date || '').toString().split('T')[0].split(' ')[0]
                              }</td>
                              <td>{p.transaction_number || ''}</td>
                              {/* Trans Type column */}
                              <td>{p.method || p.transaction_type || p.transType || '-'}</td>
                              {/* Organization / Beneficiary account (resolve id via bankMap when nested object missing) */}
                              <td>
                                {renderAccountLabel(
                                  p.organization_bank_account ?? p.organization_bank_account_id ?? p.organization_bank_account_pk ?? (p.organization_bank_account && p.organization_bank_account.id) ?? p.organization_bank_account
                                )}
                              </td>
                              <td>
                                {renderAccountNumber(
                                  p.organization_bank_account ?? p.organization_bank_account_id ?? p.organization_bank_account_pk ?? (p.organization_bank_account && p.organization_bank_account.id) ?? p.organization_bank_account
                                )}
                              </td>
                              {/* Agent account (resolve id via bankMap when nested object missing) */}
                              <td>
                                {renderAccountLabel(
                                  p.agent_bank_account ?? p.agent_bank_account_id ?? p.agent_bank_account_pk ?? (p.agent_bank_account && p.agent_bank_account.id) ?? p.agent_bank_account
                                )}
                              </td>
                              <td>
                                {renderAccountNumber(
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

                    {/* Pagination controls */}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div className="text-muted small">
                        Showing {totalPayments === 0 ? 0 : startIndex + 1} - {endIndex} of {totalPayments}
                      </div>

                      <div>
                        <nav>
                          <ul className="pagination mb-0">
                            <li className={"page-item " + (currentPage === 1 ? 'disabled' : '')}>
                              <button className="page-link" type="button" onClick={() => goToPage(currentPage - 1)}>Prev</button>
                            </li>
                            {getPageNumbers().map((item, idx) => (
                              (item === 'left-ellipsis' || item === 'right-ellipsis') ? (
                                <li key={String(item) + idx} className="page-item disabled"><span className="page-link">…</span></li>
                              ) : (
                                <li key={item} className={"page-item " + (currentPage === item ? 'active' : '')}>
                                  <button className="page-link" type="button" onClick={() => goToPage(item)}>{item}</button>
                                </li>
                              )
                            ))}
                            <li className={"page-item " + (currentPage === totalPages ? 'disabled' : '')}>
                              <button className="page-link" type="button" onClick={() => goToPage(currentPage + 1)}>Next</button>
                            </li>
                          </ul>
                        </nav>
                      </div>

                      <div>
                        <select className="form-select form-select-sm" value={pageSize} onChange={handlePageSizeChange} style={{ width: 'auto' }}>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
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
