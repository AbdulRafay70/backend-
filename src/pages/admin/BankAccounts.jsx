import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { Link, NavLink } from "react-router-dom";
import Header from "../../components/Header";
import { Search } from "lucide-react";
import { Gear } from "react-bootstrap-icons";
import { Button } from "react-bootstrap";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const BankAccountsScreen = () => {
  const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    { name: "Add Payment", path: "/payment/add-payment", isActive: false },
    { name: "Bank Accounts", path: "/payment/bank-accounts", isActive: false },
    { name: "Pending Payments", path: "/payment/pending-payments", isActive: false },
    { name: "Booking History", path: "/payment/booking-history", isActive: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ bankName: '', accountTitle: '', accountNumber: '', isCompany: '' });

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
    isCompanyAccount: true,
    status: 'active',
    // createdById removed — created_by_id will be derived from the logged-in user's token
  });
  const [activeTab, setActiveTab] = useState('company'); // 'company' or 'agent'
  const [agencies, setAgencies] = useState([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [agencyQuery, setAgencyQuery] = useState('');
  const [showAgencyDropdown, setShowAgencyDropdown] = useState(false);
  const agencyRef = useRef(null);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  // users list removed — created_by will be derived from the logged-in user's token

  const toggleDropdown = (accountId) => {
    setDropdownOpen(dropdownOpen === accountId ? null : accountId);
  };

  // Safely render values that might be objects (some API shapes return nested objects)
  const renderVal = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === 'object') {
      // Try common nested properties that may hold a human-readable string
      if (val.bank_name) return String(val.bank_name);
      if (val.name) return String(val.name);
      if (val.account_title) return String(val.account_title);
      if (val.title) return String(val.title);
      // Fallback to a compact JSON representation for debugging
      try { return JSON.stringify(val); } catch (e) { return String(val); }
    }
    return String(val);
  };

  const handleAction = (action, accountId) => {
    console.log(`${action} action for account ID: ${accountId}`);
    setDropdownOpen(null);
    // Add your action logic here
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // fetch bank accounts from API
  const fetchBankAccounts = async () => {
    setLoadingAccounts(true);
    setFetchError(null);
    try {
  const organization_id = getOrgId();
  console.debug('fetchBankAccounts - organization_id:', organization_id);
  const branch_id = (() => { try { const s = JSON.parse(localStorage.getItem('selectedOrganization')) || {}; return s?.branch_id || s?.branch || localStorage.getItem('selectedBranchId') || 0; } catch (_) { return localStorage.getItem('selectedBranchId') || 0; } })();
      const token = localStorage.getItem('accessToken');
      const resp = await axios.get('https://api.saer.pk/api/bank-accounts/', {
        params: { organization: organization_id, organization_id, branch_id, _ts: Date.now() },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setBankAccounts(data);
    } catch (err) {
      console.error('Failed to fetch bank accounts', err);
      setFetchError('Failed to load bank accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  // helper: robustly extract organization id from localStorage
  const getOrgId = () => {
    try {
      const adminOrgRaw = localStorage.getItem('adminOrganizationData');
      if (adminOrgRaw) {
        const adminOrg = JSON.parse(adminOrgRaw);
        if (adminOrg && (adminOrg.id || adminOrg.pk)) return adminOrg.id || adminOrg.pk;
        // adminOrganizationData may contain organization_details array
        if (adminOrg && Array.isArray(adminOrg.organization_details) && adminOrg.organization_details[0] && adminOrg.organization_details[0].id) return adminOrg.organization_details[0].id;
      }
      const raw = localStorage.getItem('selectedOrganization');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (!parsed) return 0;
      if (typeof parsed === 'number') return parsed;
      if (typeof parsed === 'string' && !isNaN(Number(parsed))) return Number(parsed);
      if (parsed.ids && Array.isArray(parsed.ids) && parsed.ids.length) return parsed.ids[0];
      if (parsed.id) return parsed.id;
      // selectedOrganization may include organization_details array from certain endpoints
      if (parsed && Array.isArray(parsed.organization_details) && parsed.organization_details[0] && parsed.organization_details[0].id) return parsed.organization_details[0].id;
      if (parsed.organization && (parsed.organization.id || parsed.organization_id)) return parsed.organization.id || parsed.organization_id;
      if (parsed.org_id) return parsed.org_id;
      if (parsed.organization_id) return parsed.organization_id;
      // Also check recently persisted user object (login flow may have stored organization there)
      try {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const u = JSON.parse(userRaw);
          if (u) {
            if (u.organization_id) return u.organization_id;
            if (u.organization && (u.organization.id || u.organization_id)) return u.organization.id || u.organization_id;
            if (Array.isArray(u.organization_details) && u.organization_details[0] && u.organization_details[0].id) return u.organization_details[0].id;
          }
        }
      } catch (e) {
        // ignore parse errors
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  // When modal opens or activeTab changes to 'agent', load agencies for the org
  useEffect(() => {
    if (showModal && activeTab === 'agent') {
      const orgId = getOrgId();
      if (orgId && Number(orgId) > 0) fetchAgencies(orgId);
    }
  }, [showModal, activeTab]);

  // close agency dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!agencyRef.current) return;
      if (!agencyRef.current.contains(e.target)) {
        setShowAgencyDropdown(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // fetch agencies for the organization
  const fetchAgencies = async (organization_id) => {
    try {
      setLoadingAgencies(true);
      const token = localStorage.getItem('accessToken');
      const resp = await axios.get('https://api.saer.pk/api/agencies/', {
        params: { organization: organization_id },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setAgencies(data);
      if (data.length > 0) {
        const firstId = data[0].id || data[0].pk || data[0].agency_id;
        const firstLabel = data[0].name || data[0].title || data[0].agency_name || (`Agency ${firstId}`);
        setFormData(prev => ({ ...prev, agencyId: prev.agencyId || firstId, agencyLabel: prev.agencyLabel || firstLabel }));
        // clear any previous query when new agencies loaded
        setAgencyQuery('');
        setShowAgencyDropdown(false);
      }
    } catch (err) {
      console.warn('Failed to fetch agencies', err);
      setAgencies([]);
    } finally {
      setLoadingAgencies(false);
    }
  };

  const resetForm = () => setFormData({ bankName: '', accountTitle: '', accountNumber: '', iban: '', isCompanyAccount: true, status: 'active', agencyId: '' });

  // fetchUsers removed — created_by_id will be taken from the decoded token.


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    try {
      // Derive branch/agency/created_by and organization id from token payload when possible
      const rawToken = localStorage.getItem('accessToken');
      let decoded = {};
      if (rawToken) {
        try {
          decoded = jwtDecode(rawToken) || {};
        } catch (e) {
          console.warn('Failed to decode JWT with jwt-decode, falling back to manual parse', e);
          try {
            const payload = rawToken.split('.')[1];
            const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            decoded = JSON.parse(json);
          } catch (ee) {
            decoded = {};
          }
        }
      }

      // Debug info to help troubleshoot missing org/user id in token/localStorage
      try {
        console.debug('BankAccounts - rawToken present?', !!rawToken, 'rawToken preview:', rawToken ? (rawToken.length > 50 ? rawToken.slice(0,50)+'...' : rawToken) : null);
        console.debug('BankAccounts - decoded token payload:', decoded);
        console.debug('BankAccounts - getOrgId() =>', getOrgId());
        console.debug('BankAccounts - localStorage.selectedOrganization =>', (() => { try { return JSON.parse(localStorage.getItem('selectedOrganization')); } catch { return localStorage.getItem('selectedOrganization'); } })());
        console.debug('BankAccounts - localStorage.adminOrganizationData =>', (() => { try { return JSON.parse(localStorage.getItem('adminOrganizationData')); } catch { return localStorage.getItem('adminOrganizationData'); } })());
      } catch (dbgE) {
        console.debug('BankAccounts - debug read failed', dbgE);
      }

      // Prefer organization id from token (login user's org). Fall back to stored selected/admin organization.
      const orgCandidates = [decoded.organization_id, decoded.org_id, decoded.organization, decoded.organizationId, decoded.org, decoded.organization?.id, (Array.isArray(decoded.organizations) && (decoded.organizations[0]?.id || decoded.organizations[0]))];
      let orgFromToken = null;
      for (const c of orgCandidates) {
        if (c !== undefined && c !== null) {
          const n = Number(c);
          if (!isNaN(n) && n > 0) { orgFromToken = n; break; }
        }
      }

      let organization_id = orgFromToken || getOrgId();
      if (!organization_id || Number(organization_id) === 0) {
        // As a last resort try adminOrganizationData/local selectedOrganization parsing again
        try {
          const adminOrgRaw = localStorage.getItem('adminOrganizationData');
          if (adminOrgRaw) {
            const adminOrg = JSON.parse(adminOrgRaw);
            if (adminOrg && (adminOrg.id || adminOrg.pk)) organization_id = adminOrg.id || adminOrg.pk;
          }
        } catch (ee) {}
      }
      if (!organization_id || Number(organization_id) === 0) {
        // Detailed debug output to help identify why no organization id was found
        try {
          console.error('BankAccounts - FAILED to determine organization_id. Debug info:');
          console.error('decoded token payload:', decoded);
          const adminOrgRaw = localStorage.getItem('adminOrganizationData');
          const selOrgRaw = localStorage.getItem('selectedOrganization');
          const userRaw = localStorage.getItem('user');
          console.error('localStorage.adminOrganizationData (raw):', adminOrgRaw);
          console.error('localStorage.selectedOrganization (raw):', selOrgRaw);
          console.error('localStorage.user (raw):', userRaw);
          const orgCandidatesDebug = orgCandidates;
          console.error('orgCandidates array (token-derived attempts):', orgCandidatesDebug);
        } catch (dbgE) {
          console.error('BankAccounts - debug failure', dbgE);
        }
        alert('Cannot determine organization_id from your login token or stored organization. Please login or select an organization.');
        setLoadingSubmit(false);
        return;
      }

      const selectedOrganization = (() => { try { return JSON.parse(localStorage.getItem('selectedOrganization')) || {}; } catch (_) { return {}; } })();
      const branch_id = decoded.branch_id || decoded.branch || selectedOrganization?.branch_id || selectedOrganization?.branch || localStorage.getItem('selectedBranchId') || 0;
      let agency_id = decoded.agency_id || decoded.agency || localStorage.getItem('selectedAgencyId') || 0;
      // If user is creating an agency account and selected an agency in the form, prefer that
      if (activeTab === 'agent' && formData.agencyId) {
        agency_id = formData.agencyId;
      }
      // If agency_id still not available, try to fetch available agencies for this organization and pick the first one as a fallback
      if (!agency_id || Number(agency_id) === 0) {
        try {
          const tokenHeader = rawToken ? { Authorization: `Bearer ${rawToken}` } : {};
          const agencyResp = await axios.get(`https://api.saer.pk/api/agencies/?organization=${organization_id}`, { headers: tokenHeader });
          const agencies = Array.isArray(agencyResp.data) ? agencyResp.data : (agencyResp.data.results || []);
          if (agencies.length > 0) {
            const first = agencies[0];
            agency_id = first.agency_id || first.id || first.pk || agency_id;
            console.debug('bank account submit - picked fallback agency id', agency_id);
          }
        } catch (e) {
          console.warn('Could not fetch agencies for fallback agency_id', e);
        }
      }

      // created_by_id must be the logged-in user's id from token (no UI select)
      const created_by_id = decoded.user_id || decoded.id || decoded.sub || (JSON.parse(localStorage.getItem('user')) || {}).id || 0;
      if (formData.isCompanyAccount && (!created_by_id || Number(created_by_id) === 0)) {
        console.error('created_by_id missing while is_company_account is true', { decoded, created_by_id });
        alert('Cannot create company account because created_by_id is missing from your token or localStorage.user. Please login or ensure your token contains user id.');
        setLoadingSubmit(false);
        return;
      }
      // Normalize branch_id: it may be numeric PK or a branch_code/name string stored in localStorage.
      let numericBranchId = null;
      try {
        if (branch_id && !isNaN(Number(branch_id)) && Number(branch_id) > 0) {
          numericBranchId = Number(branch_id);
        } else if (branch_id) {
          // attempt to resolve branch_code or name to numeric id via branches API
          try {
            const tokenHeader = rawToken ? { Authorization: `Bearer ${rawToken}` } : {};
            const branchesResp = await axios.get('https://api.saer.pk/api/branches/', {
              params: { organization_id: organization_id },
              headers: tokenHeader
            });
            const branchItems = Array.isArray(branchesResp.data) ? branchesResp.data : (branchesResp.data.results || []);
            const match = branchItems.find(b => b.branch_code === String(branch_id) || b.name === String(branch_id) || String(b.id) === String(branch_id));
            if (match) numericBranchId = match.id;
          } catch (e) {
            console.warn('Could not resolve branch identifier to numeric id', e);
          }
        }
      } catch (e) {
        numericBranchId = null;
      }

      // Determine a branch id to send: prefer resolved numericBranchId, else numeric branch_id, else 0
      const branchToSend = (numericBranchId && Number(numericBranchId) > 0) ? Number(numericBranchId) : (Number(branch_id) || 0);
      const agencyToSend = Number(agency_id) || 0;
      const createdByToSend = Number(created_by_id) || 0;

      const payload = {
        // organization id must be the logged-in user's organization (validated above)
        organization_id: Number(organization_id),
        branch_id: branchToSend,
        agency_id: agencyToSend,
        created_by_id: createdByToSend,
        bank_name: formData.bankName,
        account_title: formData.accountTitle,
        account_number: formData.accountNumber,
        iban: formData.iban,
        status: formData.status || 'active',
        // Include is_company_account flag according to checkbox
        is_company_account: !!formData.isCompanyAccount
      };
      console.debug('bank account submit - token decoded payload and payload to send', { decoded, payload });
      const token = localStorage.getItem('accessToken');
      let resp;
      if (editingAccount && (editingAccount.id || editingAccount.pk)) {
        const id = editingAccount.id || editingAccount.pk;
        resp = await axios.put(`https://api.saer.pk/api/bank-accounts/${id}/`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      } else {
        resp = await axios.post('https://api.saer.pk/api/bank-accounts/', payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }
      console.debug('saved bank account', resp.data);
      // refresh list
      await fetchBankAccounts();
      setShowModal(false);
      resetForm();
      setEditingAccount(null);
      window.alert(editingAccount ? 'Bank account updated' : 'Bank account created');
    } catch (err) {
      console.error('Failed to create bank account', err, err.response && err.response.data);
      // simple UI feedback: keep modal open for user to retry
      const serverMsg = err?.response?.data ? JSON.stringify(err.response.data) : 'Check console for details.';
      alert(`Failed to save bank account: ${serverMsg}`);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setEditingAccount(null);
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bankName: account.bank_name || account.bankName || '',
      accountTitle: account.account_title || account.accountTitle || '',
      accountNumber: account.account_number || account.accountNumber || '',
      iban: account.iban || '',
      isCompanyAccount: account.is_company_account || account.isCompanyAccount || false,
      agencyId: account.agency_id || account.agency || account.agencyId || '',
      agencyLabel: (account.agency_name || account.agency_label || (account.agency && (account.agency.name || account.agency.title || account.agency.agency_name)) || ''),
      status: account.status || 'active',
      // branch/agency are derived from token on submit; created_by_id will be taken from token
    });
    setActiveTab(account.is_company_account || account.isCompanyAccount ? 'company' : 'agent');
    setShowModal(true);
  };

  const handleDelete = async (account) => {
    if (!account) return;
    const ok = window.confirm('Are you sure you want to delete this bank account?');
    if (!ok) return;
    try {
      const token = localStorage.getItem('accessToken');
      const id = account.id || account.pk || account.account_number;
      await axios.delete(`https://api.saer.pk/api/bank-accounts/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      await fetchBankAccounts();
      window.alert('Bank account deleted');
    } catch (err) {
      console.error('Failed to delete bank account', err);
      alert('Failed to delete bank account. See console for details.');
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
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Bank Accounts"
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
              <div className="min-vh-100">
                <div className="row">
                  <div className="col-12 col-xl-12">
                    <div
                      className="card shadow-sm border-0"
                      onClick={() => setDropdownOpen(null)}
                    >
                      <div
                        className="card-body p-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h4 className="card-title mb-4 fw-bold text-dark">
                          Bank Accounts Information
                        </h4>

                        <div className="table-responsive">
                          {loadingAccounts ? (
                            <div className="text-center py-4">Loading bank accounts...</div>
                          ) : fetchError ? (
                            <div className="text-center text-danger py-4">{fetchError}</div>
                          ) : (
                            <>
                              {/* Filters */}
                              <div className="row mb-3 g-2 align-items-center">
                                <div className="col-auto">
                                  <input type="text" className="form-control" placeholder="Filter Bank Name" name="bankName" value={filters.bankName} onChange={handleFilterChange} />
                                </div>
                                <div className="col-auto">
                                  <input type="text" className="form-control" placeholder="Filter Account Title" name="accountTitle" value={filters.accountTitle} onChange={handleFilterChange} />
                                </div>
                                <div className="col-auto">
                                  <input type="text" className="form-control" placeholder="Filter Account Number" name="accountNumber" value={filters.accountNumber} onChange={handleFilterChange} />
                                </div>
                                <div className="col-auto">
                                  <select className="form-select" name="isCompany" value={filters.isCompany} onChange={handleFilterChange}>
                                    <option value="">All</option>
                                    <option value="yes">Company</option>
                                    <option value="no">Agent</option>
                                  </select>
                                </div>
                                <div className="col-auto">
                                  <button className="btn btn-outline-secondary" type="button" onClick={() => setFilters({ bankName: '', accountTitle: '', accountNumber: '', isCompany: '' })}>Clear</button>
                                </div>
                                {/* Add button moved here so it appears alongside filters */}
                                <div className="col-auto ms-auto">
                                  <button
                                    className="btn btn-primary px-4"
                                    onClick={() => { resetForm(); setActiveTab('company'); setShowModal(true); }}
                                  >
                                    Add Bank Account
                                  </button>
                                </div>
                              </div>
                              <table className="table table-borderless">
                            <thead>
                              <tr className="border-bottom">
                                <th className="fw-normal text-muted pb-3">
                                  Bank Name
                                </th>
                                <th className="fw-normal text-muted pb-3">
                                  Account Title
                                </th>
                                <th className="fw-normal text-muted pb-3">
                                  Account Number
                                </th>
                                <th className="fw-normal text-muted pb-3">IBAN</th>
                                <th className="fw-normal text-muted pb-3">Agency</th>
                                <th className="fw-normal text-muted pb-3">Company Account</th>
                                <th className="fw-normal text-muted pb-3">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {bankAccounts
                                .filter(account => {
                                  if (filters.bankName && !(account.bank_name || account.bankName || '').toLowerCase().includes(filters.bankName.toLowerCase())) return false;
                                  if (filters.accountTitle && !(account.account_title || account.accountTitle || '').toLowerCase().includes(filters.accountTitle.toLowerCase())) return false;
                                  if (filters.accountNumber && !(account.account_number || account.accountNumber || '').toLowerCase().includes(filters.accountNumber.toLowerCase())) return false;
                                  if (filters.isCompany === 'yes' && !(account.is_company_account || account.isCompanyAccount)) return false;
                                  if (filters.isCompany === 'no' && (account.is_company_account || account.isCompanyAccount)) return false;
                                  return true;
                                })
                                .map((account) => (
                                <tr key={account.id || account.pk || account.account_number} className="border-bottom">
                                  <td className="py-3">
                                    <span
                                      className="fw-bold text-dark text-decoration-underline"
                                      style={{ cursor: "pointer" }}
                                    >
                                      {renderVal(account.bank_name || account.bankName)}
                                    </span>
                                  </td>
                                  <td className="py-3 text-muted">
                                    {renderVal(account.account_title || account.accountTitle)}
                                  </td>
                                  <td className="py-3 text-dark">
                                    {renderVal(account.account_number || account.accountNumber)}
                                  </td>
                                  <td className="py-3 text-dark">{renderVal(account.iban)}</td>
                                  <td className="py-3 text-dark">{renderVal(
                                    account.agency || account.agency_name || account.agencyId || account.agency_id || (account.agency && (account.agency.name || account.agency.title || account.agency.agency_name))
                                  )}</td>
                                  <td className="py-3 text-center">
                                    {(account.is_company_account || account.isCompanyAccount) ? 'Yes' : 'No'}
                                  </td>
                                  <td className="py-3">
                                    <div className="dropdown">
                                      <button
                                        className="btn btn-link p-0 text-primary"
                                        style={{ textDecoration: "none" }}
                                        onClick={() => toggleDropdown(account.id || account.pk || account.account_number)}
                                      >
                                        <Gear />
                                      </button>
                                      {dropdownOpen === (account.id || account.pk || account.account_number) && (
                                        <div
                                          className="dropdown-menu show position-absolute bg-white border rounded shadow-sm py-1"
                                          style={{
                                            right: 0,
                                            top: "100%",
                                            minWidth: "120px",
                                            zIndex: 1000,
                                          }}
                                        >
                                          <button
                                            className="dropdown-item py-2 px-3 border-0 bg-transparent w-100 text-start"
                                            onClick={() => handleEdit(account)}
                                            style={{ color: "#1B78CE" }}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            className="dropdown-item py-2 px-3 border-0 bg-transparent w-100 text-start text-danger"
                                            onClick={() => handleDelete(account)}
                                          >
                                            Remove
                                          </button>
                                          <button
                                            className="dropdown-item py-2 px-3 border-0 bg-transparent w-100 text-start text-secondary"
                                            onClick={() => setDropdownOpen(null)}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            </table>
                          </>)}
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                          <button
                            className="btn btn-primary px-4 py-2"
                            onClick={() => { resetForm(); setActiveTab('company'); setShowModal(true); }}
                          >
                            Add Bank Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal */}
                {showModal && (
                  <div
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  >
                    <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content">
                        <div className="modal-header border-bottom">
                          <h5 className="modal-title text-center fw-bold">
                            Add Bank Account
                          </h5>
                        </div>

                        {/* Tab switcher for Company / Agent account types */}
                        <div className="d-flex border-bottom bg-light">
                          <button type="button" className={`btn btn-sm ${activeTab === 'company' ? 'btn-primary text-white' : 'btn-link'}`} onClick={() => { setActiveTab('company'); setFormData(prev => ({ ...prev, isCompanyAccount: true })); }} style={{ borderRadius: 0, padding: '10px 16px' }}>
                            Company Account
                          </button>
                          <button type="button" className={`btn btn-sm ${activeTab === 'agent' ? 'btn-primary text-white' : 'btn-link'}`} onClick={() => { setActiveTab('agent'); setFormData(prev => ({ ...prev, isCompanyAccount: false })); fetchAgencies(getOrgId()); }} style={{ borderRadius: 0, padding: '10px 16px' }}>
                            Agent Account
                          </button>
                        </div>

                        <div className="modal-body p-4">
                          <form onSubmit={handleSubmit}>
                            <label htmlFor="" className="form-label">
                              Bank Name
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="bankName"
                              name="bankName"
                              value={formData.bankName}
                              onChange={handleInputChange}
                              required
                              placeholder="Meezan Bank "
                            />

                            <label htmlFor="" className="form-label">
                              Account Title
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="accountTitle"
                              name="accountTitle"
                              value={formData.accountTitle}
                              onChange={handleInputChange}
                              required
                              placeholder="Saer.pk"
                            />

                            <label htmlFor="" className="form-label">
                              Account Number
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="accountNumber"
                              name="accountNumber"
                              value={formData.accountNumber}
                              onChange={handleInputChange}
                              required
                              placeholder="3302237082738"
                            />

                            <label htmlFor="" className="form-label">

                              IBAN
                            </label>
                            <input
                              type="text"
                              className="form-control  shadow-none"
                              id="iban"
                              name="iban"
                              value={formData.iban}
                              onChange={handleInputChange}
                              required
                              placeholder=" Pk3202293203782936"
                            />
                            <div className="form-check mt-3">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="isCompanyAccount"
                                name="isCompanyAccount"
                                checked={activeTab === 'company'}
                                disabled={true}
                                readOnly
                              />
                              <label className="form-check-label" htmlFor="isCompanyAccount">
                                Is Company Account (determined by tab)
                              </label>
                            </div>

                            <div className="mt-3">
                              <label className="form-label">Status</label>
                              <select
                                className="form-select"
                                name="status"
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>

                            {/* Agent-specific extra field: Searchable Agency selector */}
                            {activeTab === 'agent' && (
                              <div className="mt-3" ref={agencyRef}>
                                <label className="form-label">Agency</label>
                                <div className="position-relative">
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder={loadingAgencies ? 'Loading agencies...' : 'Search agencies...'}
                                    value={formData.agencyLabel || agencyQuery}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setAgencyQuery(v);
                                      setFormData(prev => ({ ...prev, agencyLabel: v, agencyId: '' }));
                                      setShowAgencyDropdown(true);
                                    }}
                                    onFocus={() => setShowAgencyDropdown(true)}
                                    required
                                  />
                                  {showAgencyDropdown && (
                                    <div className="position-absolute bg-white border rounded w-100" style={{ zIndex: 2000, maxHeight: 220, overflowY: 'auto' }}>
                                      { (agencies || []).filter(a => {
                                        const label = (a.name || a.title || a.agency_name || String(a.id || a.pk || a.agency_id)).toLowerCase();
                                        const q = (agencyQuery || formData.agencyLabel || '').toLowerCase();
                                        return !q || label.indexOf(q) !== -1;
                                      }).map(a => {
                                        const id = a.id || a.pk || a.agency_id;
                                        const label = a.name || a.title || a.agency_name || (`Agency ${id}`);
                                        return (
                                          <div key={id} className="p-2" style={{ cursor: 'pointer' }} onMouseDown={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, agencyId: id, agencyLabel: label })); setAgencyQuery(''); setShowAgencyDropdown(false); }}>
                                            {label}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Created By select removed: frontend will send created_by_id from logged-in token */}

                            <div className="d-flex justify-content-end mt-3 gap-2">
                              <button
                                type="submit"
                                className="btn btn-primary px-4"
                                disabled={loadingSubmit}
                              >
                                {loadingSubmit ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-light text-muted px-4"
                                onClick={handleCloseModal}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
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

export default BankAccountsScreen;
