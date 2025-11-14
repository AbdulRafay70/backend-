import React, { useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Link, NavLink } from "react-router-dom";
import { Search } from "lucide-react";
import axios from 'axios';
import { toast } from 'react-toastify';

const AddDepositForm = () => {
  const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    {
      name: "Add Deposit",
      path: "/payment/add-deposit",
      isActive: false,
    },
    {
      name: "Bank Accounts",
      path: "/payment/bank-accounts",
      isActive: false,
    },
  ];

  const [formData, setFormData] = useState({
    modeOfPayment: "Bank Transfer",
    beneficiaryAccount: "",
    agentAccount: "",
    amount: "",
    date: "",
    notes: "",
    agencyCode: "",
  });

  const getOrgContext = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return { organizationId: null, branchId: null, agencyId: null, userId: null };
    try {
      const orgData = JSON.parse(agentOrg);
      const organizationId = Array.isArray(orgData.ids) && orgData.ids.length ? orgData.ids[0] : (orgData.organization?.id || orgData.organization_id || null);
      const branchId = orgData.branch_id || orgData.branch?.id || null;
      const agencyId = orgData.agency_id || orgData.agency?.id || null;
      const userId = orgData.user_id || orgData.user?.id || null;
      return { organizationId, branchId, agencyId, userId, raw: orgData };
    } catch (e) {
      return { organizationId: null, branchId: null, agencyId: null, userId: null };
    }
  };

  const { organizationId: orgId, branchId, agencyId, userId } = getOrgContext();

  const [searchTerm, setSearchTerm] = useState("");

  const [transactions] = useState([
  ]);

  // dynamic state: transactions and bank lists
  const [payments, setPayments] = useState([]);
  const [agentBanks, setAgentBanks] = useState([]);
  const [orgBanks, setOrgBanks] = useState([]);
  const [bankMap, setBankMap] = useState({});
  const [slipFile, setSlipFile] = useState(null);
  const [slipName, setSlipName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // derive filtered payments from searchTerm (matches method, beneficiary, agent account, transaction, amount, status)
  const normalizedQuery = (searchTerm || '').toString().toLowerCase().trim();
  const filteredPayments = normalizedQuery
    ? payments.filter((p) => {
      const orgName = (p.organization_bank && bankMap[p.organization_bank]) ? bankMap[p.organization_bank] : (p.organization_bank || '');
      const agentName = (p.agent_bank && bankMap[p.agent_bank]) ? bankMap[p.agent_bank] : (p.agent_bank || '');
      const hay = `${p.method || ''} ${orgName} ${agentName} ${p.transaction_number || ''} ${p.amount || ''} ${p.status || ''}`.toLowerCase();
      return hay.includes(normalizedQuery);
    })
    : payments;

  // additional filters: date range, method, status
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // derive available methods and statuses from payments for filter dropdowns
  const methodOptions = Array.from(new Set(payments.map(p => p.method).filter(Boolean)));
  const statusOptions = Array.from(new Set(payments.map(p => (p.status || '').toString()).filter(Boolean)));

  const applyAllFilters = (items) => {
    return items.filter((p) => {
      // date filter
      try {
        if (filterFrom) {
          const from = new Date(filterFrom);
          const pd = p.date ? new Date(p.date) : null;
          if (!pd || pd < from) return false;
        }
        if (filterTo) {
          const to = new Date(filterTo);
          // include entire day for 'to' by setting to end of day
          to.setHours(23, 59, 59, 999);
          const pd = p.date ? new Date(p.date) : null;
          if (!pd || pd > to) return false;
        }
      } catch (e) {
        // ignore parse errors
      }

      if (filterMethod) {
        if (!p.method || String(p.method) !== String(filterMethod)) return false;
      }
      if (filterStatus) {
        if (!p.status || String(p.status).toLowerCase() !== String(filterStatus).toLowerCase()) return false;
      }

      // searchTerm already applied outside when normalizedQuery present — if not, still allow search
      if (!normalizedQuery) return true;
      const orgName = (p.organization_bank && bankMap[p.organization_bank]) ? bankMap[p.organization_bank] : (p.organization_bank || '');
      const agentName = (p.agent_bank && bankMap[p.agent_bank]) ? bankMap[p.agent_bank] : (p.agent_bank || '');
      const hay = `${p.method || ''} ${orgName} ${agentName} ${p.transaction_number || ''} ${p.amount || ''} ${p.status || ''}`.toLowerCase();
      return hay.includes(normalizedQuery);
    });
  };

  const fullyFilteredPayments = applyAllFilters(payments);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Build payload for /api/payments/
    console.debug('handleSubmit called', { formData, slipFile });
    const token = localStorage.getItem('agentAccessToken');

    const parseAmount = (val) => {
      if (val == null) return 0;
      // remove non-numeric except dot and minus
      const cleaned = String(val).replace(/[^0-9.-]+/g, '');
      const num = parseFloat(cleaned);
      return Number.isFinite(num) ? num : 0;
    };

    // basic validation: behavior differs for Cash vs others
    const mode = formData.modeOfPayment;
    let agentBankValue = formData.agentAccount ? String(formData.agentAccount).trim() : '';
    const orgBankId = formData.beneficiaryAccount ? Number(formData.beneficiaryAccount) : null;

    // require beneficiary account
    if (!orgBankId) {
      toast.error('Please select a beneficiary (organization) account');
      return;
    }

    // require slip file
    if (!slipFile) {
      toast.error('Please upload the slip file (required)');
      return;
    }

    // ensure the selected beneficiary bank id exists in the fetched list
    const orgExists = orgBanks.some(b => Number(b.id) === Number(orgBankId));
    if (!orgExists) {
      console.error('Selected organization bank id not found in orgBanks', { orgBankId, orgBanks });
      toast.error('Selected beneficiary account is not valid for your organization. Please select a different account.');
      return;
    }

    // Agent bank handling:
    // - If Cash: require the user to enter a numeric bank id which will be sent in `bank`
    // - If Cheque or Bank Transfer: require selection of an existing agent bank id (sent as agent_bank_account)
    let agentBankId = null;
    let bankField = null; // will hold bank value (string or numeric string)
    if (mode === 'Cash') {
      // accept either a bank name or numeric id for Cash
      if (!agentBankValue) {
        toast.error('Please enter the bank (name or id) for Cash');
        return;
      }
      bankField = agentBankValue; // send as-is (string). backend may accept id or name
      agentBankId = null;
    } else {
      // expect an agent bank id selected from agentBanks
      agentBankId = agentBankValue ? Number(agentBankValue) : null;
      if (!agentBankId) {
        toast.error('Please select an agent account');
        return;
      }
      const agentExists = agentBanks.some(b => Number(b.id) === Number(agentBankId));
      if (!agentExists) {
        console.error('Selected agent bank id not found in agentBanks', { agentBankId, agentBanks });
        toast.error('Selected agent account is not valid for your user. Please select a different account.');
        return;
      }
      // normalize agentBankValue to the numeric id string for submission
      agentBankValue = String(agentBankId);
      bankField = '';
    }

    // Debug: show payload summary before sending
    const debugPayload = {
      method: formData.modeOfPayment || '',
      payment_type: 'booking',
      amount: parseAmount(formData.amount),
      remarks: formData.notes || '',
      status: 'pending',
      organization: orgId,
      branch: branchId,
      agency: agencyId,
      agent: userId,
      created_by: userId,
      // agent_bank_account: send null when not applicable (e.g. Cash) to avoid DRF treating 0 as PK=0
      agent_bank_account: (agentBankId && Number(agentBankId) > 0) ? Number(agentBankId) : null,
      organization_bank_account: orgBankId || null,
      // bank: for Cash payments we send the name or id; for non-cash this will be null/omitted
      bank: bankField || null,
    };
    const agentBankDisplay = (mode === 'Cash') ? (bankField || agentBankValue) : (bankMap[agentBankId] || agentBankValue);
    console.debug('Submitting payment (summary):', debugPayload, {
      agentBankName: agentBankDisplay,
      orgBankName: bankMap[orgBankId],
    });

    // Build multipart/form-data payload so we can include the slip file
    const form = new FormData();
    form.append('method', formData.modeOfPayment || '');
    form.append('payment_type', 'booking');
    form.append('amount', String(parseAmount(formData.amount)));
    form.append('remarks', formData.notes || '');
    form.append('status', 'pending');
    // slip is required and already validated above
    form.append('image', slipFile);
    form.append('transaction_number', formData.transaction_number || '');
    form.append('organization', String(orgId || ''));
    form.append('branch', String(branchId || ''));
    form.append('agency', String(agencyId || ''));
    form.append('agent', String(userId || ''));
    form.append('created_by', String(userId || ''));
    // agent_bank_account should be numeric id or 0
    // Append organization bank (validated earlier to exist)
    form.append('organization_bank_account', String(orgBankId));

    // Only include agent_bank_account when it's a valid, non-zero id (required for non-cash)
    if (agentBankId && Number(agentBankId) > 0) {
      form.append('agent_bank_account', String(agentBankId));
    }

    // For Cash payments include the bank value (name or id). For non-cash this is not required and we omit it.
    if (bankField && String(bankField).trim() !== '') {
      form.append('bank', String(bankField));
    }
    form.append('kuickpay_trn', formData.kuickpay_trn || '');

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // validations passed — start submitting
    toast.info('Submitting payment...');
    setIsSubmitting(true);
    console.debug('About to POST /api/payments/ with headers and FormData');
    axios.post('http://127.0.0.1:8000/api/payments/', form, { headers, timeout: 30000 })
      .then((res) => {
        toast.success('Payment created');
        // reset form and slip
        setFormData({
          modeOfPayment: 'Bank Transfer',
          beneficiaryAccount: '',
          agentAccount: '',
          amount: '',
          date: '',
          notes: '',
          agencyCode: '',
        });
        setSlipFile(null);
        setSlipName('');
        // add created payment to list
        const created = res.data;
        setPayments((prev) => [created, ...prev]);
        console.log('Payment response', created);
      })
      .catch((err) => {
        console.error('Create payment failed', err);
        if (err.response && err.response.data) {
          toast.error('Failed to create payment: ' + (err.response.data.detail || JSON.stringify(err.response.data)));
        } else {
          toast.error('Failed to create payment');
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toString();
    const lower = s.toLowerCase();
    if (lower === 'approved' || lower === 'active') {
      return (
        <span className="rounded-5 p-1" style={{ background: '#ECFDF3', color: '#037847' }}>
          ● {s}
        </span>
      );
    }

    if (lower === 'inactive') {
      return (
        <span className="rounded-5 p-1" style={{ background: '#F2F4F7', color: '#364254' }}>
          ● {s}
        </span>
      );
    }

    if (lower === 'pending') {
      return (
        <span className="rounded-5 p-1" style={{ background: '#FFF4E5', color: '#92400E' }}>
          ● Pending
        </span>
      );
    }

    if (lower === 'completed' || lower === 'complete' || lower === 'paid') {
      return (
        <span className="rounded-5 p-1" style={{ background: '#ECFDF3', color: '#037847' }}>
          ● Completed
        </span>
      );
    }

    return <span className="badge bg-light text-dark">{s}</span>;
  };


  // fetch bank accounts for organization and split into agent/org banks
  React.useEffect(() => {
    const token = localStorage.getItem('agentAccessToken');
    if (!token || !orgId) return;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    axios.get('http://127.0.0.1:8000/api/bank-accounts/', { params: { organization: orgId }, headers })
      .then((res) => {
        let items = [];
        if (Array.isArray(res.data)) items = res.data;
        else if (res.data && Array.isArray(res.data.results)) items = res.data.results;
        else if (res.data) items = [res.data];

        console.debug('Bank accounts API raw response:', res.data);

        const normalized = items.map((it) => ({
          id: it.id,
          bankName: it.bank_name || it.bankName || it.bank || '',
          accountTitle: it.account_title || it.accountTitle || it.account_name || '',
          accountNumber: it.account_number || it.accountNumber || it.account_no || '',
          iban: it.iban || it.IBAN || '',
          isCompany: !!it.is_company_account,
          raw: it,
        }));

        // company accounts (beneficiary) are those marked as company accounts and belong to org
        const companyOnly = normalized.filter((a) => {
          if (!a.isCompany || !a.raw) return false;
          const raw = a.raw;
          const orgField = raw.organization && (raw.organization.id || raw.organization) ? (raw.organization.id || raw.organization) : raw.organization_id || raw.organization;
          try {
            return Number(orgField) === Number(orgId);
          } catch (e) {
            return false;
          }
        });

        // agent accounts: non-company accounts created by the logged-in user
        const agentOnlyAll = normalized.filter((a) => {
          if (a.isCompany) return false;
          if (!a.raw) return false;
          const rawOrg = a.raw.organization && (a.raw.organization.id || a.raw.organization) ? (a.raw.organization.id || a.raw.organization) : a.raw.organization_id || a.raw.organization;
          try {
            return Number(rawOrg) === Number(orgId);
          } catch (e) {
            return false;
          }
        });

        const agentOnly = agentOnlyAll.filter((a) => {
          const raw = a.raw || {};
          // created_by may be an object or an id
          const createdById = raw.created_by && (raw.created_by.id || raw.created_by) ? (raw.created_by.id || raw.created_by) : null;
          if (!userId) return false;
          return Number(createdById) === Number(userId);
        });

        // if agency filtering removed all agent accounts, fall back to showing all agent accounts (better UX)
        if (agentOnly.length === 0 && agentOnlyAll.length > 0) {
          console.debug('No agent accounts matched agencyId, falling back to all agent accounts', { agencyId, agentOnlyAll });
          agentOnly.push(...agentOnlyAll);
        }

        console.debug('Normalized bank accounts:', normalized);
        console.debug('companyOnly:', companyOnly, 'agentOnly:', agentOnly);

        setAgentBanks(agentOnly);
        setOrgBanks(companyOnly);

        const map = {};
        normalized.forEach(b => { map[b.id] = b.bankName || b.accountTitle || String(b.id); });
        setBankMap(map);

        // set sensible defaults if none selected
        setFormData((prev) => ({
          ...prev,
          beneficiaryAccount: prev.beneficiaryAccount || (companyOnly[0] ? String(companyOnly[0].id) : ''),
          agentAccount: prev.agentAccount || (agentOnly[0] ? String(agentOnly[0].id) : ''),
        }));
      })
      .catch((err) => {
        console.error('Failed to fetch bank accounts for add-deposit', err);
      });
  }, [orgId, agencyId]);

  // fetch payments (transactions)
  React.useEffect(() => {
    const token = localStorage.getItem('agentAccessToken');
    // require orgId and token; if no agencyId and no userId, show nothing
    if (!token || !orgId) return;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const params = { organization: orgId };
    // strictly prefer agency filtering when available
    if (agencyId) {
      params.agency = agencyId;
    } else if (userId) {
      // fallback: if agencyId missing, fetch payments created by this agent
      params.agent = userId;
    } else {
      // no agency or user context -> show no payments
      setPayments([]);
      return;
    }

    console.debug('Fetching payments with params:', params);
    axios.get('http://127.0.0.1:8000/api/payments/', { params, headers })
      .then((res) => {
        let items = [];
        if (Array.isArray(res.data)) items = res.data;
        else if (res.data && Array.isArray(res.data.results)) items = res.data.results;
        else if (res.data) items = [res.data];

        // defensive client-side filter: ensure all returned items match agency (if agencyId present)
        const filtered = items.filter((p) => {
          try {
            if (agencyId) return p.agency != null && Number(p.agency) === Number(agencyId);
            if (userId) return (p.agent != null && Number(p.agent) === Number(userId)) || (p.created_by != null && Number(p.created_by) === Number(userId));
            return false;
          } catch (e) {
            return false;
          }
        });

        console.debug('Payments fetched:', items.length, 'filtered to:', filtered.length);
        setPayments(filtered);
      })
      .catch((err) => {
        console.error('Failed to fetch payments', err);
      });
  }, [orgId, agencyId, userId]);

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
              {/* Navigation Tabs */}
              <div className="row ">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  {/* Navigation Tabs */}
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Add Deposit"
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


                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header border-0 bg-white rounded-4">
                    <h5 className="mb-0">Add Deposit</h5>
                  </div>

                  <div className="card-body">
                    <form>
                      <div className="row mb-3">
                        <div className="col-md-2">
                          <label htmlFor="" className="Control-label">Mode Of Payment</label>
                          <select
                            className="form-select  shadow-none"
                            name="modeOfPayment"
                            value={formData.modeOfPayment}
                            onChange={handleInputChange}
                          >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                          </select>
                        </div>

                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">Beneficiary Account
                          </label>

                          <select
                            className="form-select  shadow-none"
                            name="beneficiaryAccount"
                            value={formData.beneficiaryAccount}
                            onChange={handleInputChange}
                          >
                            <option value="">Select beneficiary account</option>
                            {orgBanks.map((b) => (
                              <option key={b.id} value={String(b.id)}>
                                {b.bankName || b.accountTitle} {b.accountNumber ? `- ${b.accountNumber}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-md-3">
                          {formData.modeOfPayment === 'Cash' ? (
                            <>
                              <label htmlFor="" className="Control-label">Bank</label>
                              <input
                                type="text"
                                className="form-control shadow-none"
                                name="agentAccount"
                                placeholder="Enter bank name or id"
                                value={formData.agentAccount}
                                onChange={handleInputChange}
                              />
                            </>
                          ) : (
                            <>
                              <label htmlFor="" className="Control-label">Agent Account</label>
                              <select
                                className="form-select  shadow-none"
                                name="agentAccount"
                                value={formData.agentAccount}
                                onChange={handleInputChange}
                              >
                                <option value="">Select agent account</option>
                                {agentBanks.map((b) => (
                                  <option key={b.id} value={String(b.id)}>
                                    {b.bankName || b.accountTitle} {b.accountNumber ? `- ${b.accountNumber}` : ''}
                                  </option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>

                        <div className="col-md-2">
                          <label htmlFor="" className="Control-label">Amount</label>

                          <input
                            type="text"
                            className="form-control  shadow-none"
                            name="amount"
                            placeholder="Type Rs.100,000/"
                            value={formData.amount}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="col-md-2 d-flex align-items-end">
                          <div className="d-flex gap-2 w-100">
                            <button type="button" className="btn btn-secondary w-50" onClick={() => document.getElementById('slipFileInput')?.click()}>
                              Upload Slip
                            </button>
                            <div className="d-flex align-items-center ps-2">
                              {slipName ? <small className="text-muted">{slipName}</small> : <small className="text-muted">No file</small>}
                            </div>
                            <input id="slipFileInput" type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => {
                              const f = e.target.files && e.target.files[0];
                              if (f) {
                                setSlipFile(f);
                                setSlipName(f.name);
                              }
                            }} />
                          </div>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">Date</label>

                          <input
                            type="date"
                            className="form-control  shadow-none"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="col-md-7">
                          <label htmlFor="" className="Control-label">Notes</label>

                          <textarea
                            className="form-control shadow-none"
                            name="notes"
                            rows="1"
                            placeholder="Type Note"
                            value={formData.notes}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="col-md-2 d-flex align-items-end">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm w-100"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !slipFile}
                          >
                            {isSubmitting ? 'Submitting...' : (!slipFile ? 'Upload slip required' : 'Add Deposit')}
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Filters and Rules Section */}
                    <div className="row mb-3">
                      <div className="col-md-3">
                        <label className="Control-label">From</label>
                        <input type="date" className="form-control shadow-none" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <label className="Control-label">To</label>
                        <input type="date" className="form-control shadow-none" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <label className="Control-label">Trans Type</label>
                        <select className="form-select shadow-none" value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
                          <option value="">All</option>
                          {methodOptions.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="Control-label">Status</label>
                        <select className="form-select shadow-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                          <option value="">All</option>
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-1 d-flex align-items-end">
                        <button type="button" className="btn btn-light" onClick={() => { setFilterFrom(''); setFilterTo(''); setFilterMethod(''); setFilterStatus(''); }}>Reset</button>
                      </div>
                    </div>

                    <div className="mt-2">
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
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th className="fw-normal text-muted">Date</th>
                            <th className="fw-normal text-muted">Trans Type</th>
                            <th className="fw-normal text-muted">Beneficiary ac</th>
                            <th className="fw-normal text-muted">Agent Account</th>
                            <th className="fw-normal text-muted">Transaction num</th>
                            <th className="fw-normal text-muted">Amount</th>
                            <th className="fw-normal text-muted">Status</th>
                            <th className="fw-normal text-muted">slip</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fullyFilteredPayments.map((p) => (
                            <tr key={p.id}>
                              <td>{p.date ? new Date(p.date).toLocaleString() : '-'}</td>
                              <td>{p.method || '-'}</td>
                              <td>{(p.organization_bank_account && bankMap[p.organization_bank_account]) || p.organization_bank_account || '-'}</td>
                              <td>{(p.agent_bank_account && bankMap[p.agent_bank_account]) || p.agent_bank_account || '-'}</td><td>{p.transaction_number || '-'}</td>
                              <td>{p.amount}</td>
                              <td>{getStatusBadge(p.status)}</td>
                              <td>
                                {p.image ? (
                                  // show link to uploaded slip
                                  <a href={p.image} target="_blank" rel="noreferrer">View</a>
                                ) : '-'}
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
    </div>
  );
};

export default AddDepositForm;
