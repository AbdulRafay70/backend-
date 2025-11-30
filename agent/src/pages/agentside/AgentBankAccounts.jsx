import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import { Link, NavLink } from "react-router-dom";
import AgentHeader from "../../components/AgentHeader";
import { Search } from "lucide-react";
import { Gear } from "react-bootstrap-icons";
import { toast } from 'react-toastify';
import { Button } from "react-bootstrap";
import axios from 'axios';

const AgentBankAccounts = () => {
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

  const [searchTerm, setSearchTerm] = useState("");

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [formData, setFormData] = useState({
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [agentAccounts, setAgentAccounts] = useState([]);
  const [saerAccounts, setSaerAccounts] = useState([]);
  const token = localStorage.getItem('agentAccessToken');

  const getOrgContext = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return { organizationId: null, branchId: null, agencyId: null };
    try {
      const orgData = JSON.parse(agentOrg);
      const organizationId = orgData.ids ? orgData.ids[0] : (orgData.organization?.id || orgData.organization_id || null);
      const branchId = orgData.branch?.id || (orgData.branches && orgData.branches.length ? orgData.branches[0].id : null) || orgData.branch_id || null;
      const agencyId = orgData.agency?.id || orgData.agency_id || null;
      return { organizationId, branchId, agencyId, raw: orgData };
    } catch (e) {
      return { organizationId: null, branchId: null, agencyId: null };
    }
  };

  const { organizationId: orgId, branchId, agencyId } = getOrgContext();

  // derive filtered lists from searchTerm
  const normalizedQuery = (searchTerm || '').toString().toLowerCase().trim();
  const filteredAgentAccounts = normalizedQuery
    ? agentAccounts.filter((a) => {
        const hay = `${a.bankName || ''} ${a.accountTitle || ''} ${a.accountNumber || ''} ${a.iban || ''}`.toLowerCase();
        return hay.includes(normalizedQuery);
      })
    : agentAccounts;

  const filteredSaerAccounts = normalizedQuery
    ? saerAccounts.filter((a) => {
        const hay = `${a.bankName || ''} ${a.accountTitle || ''} ${a.accountNumber || ''} ${a.iban || ''}`.toLowerCase();
        return hay.includes(normalizedQuery);
      })
    : saerAccounts;

  // fetch agent-specific accounts (can CRUD)
  useEffect(() => {
    // Fetch all bank accounts for the agent's organization and split into agent-editable and company accounts
    const fetchOrgAccounts = async () => {
      if (!token) {
        console.warn('No auth token found for fetching bank accounts');
        return;
      }
      try {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        const params = orgId ? { organization: orgId } : {};
        const res = await axios.get('http://127.0.0.1:8000/api/bank-accounts/', { params, headers });
        let items = [];
        if (Array.isArray(res.data)) items = res.data;
        else if (res.data && Array.isArray(res.data.results)) items = res.data.results;
        else if (res.data) items = [res.data];

        const normalized = items.map((it) => ({
          id: it.id,
          bankName: it.bank_name || it.bankName || it.bank || '',
          accountTitle: it.account_title || it.accountTitle || it.account_name || '',
          accountNumber: it.account_number || it.accountNumber || it.account_no || '',
          iban: it.iban || it.IBAN || '',
          status: it.status,
          organizationId: it.organization?.id || it.organization || null,
          raw: it,
        }));

        // Helper to safely resolve agency id from the raw payload
        const resolveAgencyId = (raw) => raw?.agency?.id || raw?.agency_id || raw?.agency || null;

        // agentOnly: only non-company accounts that belong to THIS agency (the logged-in agent's agency)
        const agentOnly = normalized.filter((a) => {
          const sameOrg = orgId ? Number(a.organizationId) === Number(orgId) : true;
          const isNotCompany = !a.raw?.is_company_account;
          const acctAgencyId = resolveAgencyId(a.raw);
          const sameAgency = agencyId ? (acctAgencyId ? Number(acctAgencyId) === Number(agencyId) : false) : true;
          return sameOrg && isNotCompany && sameAgency;
        });

        // saer/company accounts: organization accounts where is_company_account === true (read-only)
        // Keep these limited to the agent's organization only
        const companyOnly = normalized.filter((a) => (orgId ? Number(a.organizationId) === Number(orgId) : true) && !!a.raw?.is_company_account);

        setAgentAccounts(agentOnly);
        setSaerAccounts(companyOnly);
      } catch (err) {
        console.error('Failed to fetch bank accounts for organization', err);
      }
    };

    fetchOrgAccounts();
  }, [token, orgId]);

  // previously we fetched finance accounts from a separate endpoint; now company accounts are available via /api/bank-accounts/

  const toggleDropdown = (accountId) => {
    setDropdownOpen(dropdownOpen === accountId ? null : accountId);
  };

  const handleAction = (action, accountId) => {
    setDropdownOpen(null);
    if (action === 'edit') {
      const acc = agentAccounts.find((a) => Number(a.id) === Number(accountId));
      if (acc) {
        setFormData({
          bankName: acc.bankName || '',
          accountTitle: acc.accountTitle || '',
          accountNumber: acc.accountNumber || '',
          iban: acc.iban || '',
        });
        setEditingAccountId(acc.id);
        setShowModal(true);
      }
    } else if (action === 'remove') {
      handleDelete(accountId);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      bank_name: formData.bankName,
      account_title: formData.accountTitle,
      account_number: formData.accountNumber,
      iban: formData.iban,
    };
    setIsSubmitting(true);
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    if (editingAccountId) {
      axios.patch(`http://127.0.0.1:8000/api/bank-accounts/${editingAccountId}/`, payload, { headers })
        .then((res) => {
          const updated = res.data;
          setAgentAccounts((prev) => prev.map((p) => (Number(p.id) === Number(editingAccountId) ? {
            ...p,
            bankName: updated.bank_name || updated.bankName || p.bankName,
            accountTitle: updated.account_title || updated.accountTitle || p.accountTitle,
            accountNumber: updated.account_number || updated.accountNumber || p.accountNumber,
            iban: updated.iban || p.iban,
            raw: updated,
          } : p)));
          toast.success('Account updated');
          setShowModal(false);
          setEditingAccountId(null);
          setFormData({ bankName: '', accountTitle: '', accountNumber: '', iban: '' });
        })
        .catch((err) => {
          console.error('Update failed', err);
          toast.error('Failed to update account');
        })
        .finally(() => setIsSubmitting(false));
    } else {
      // include organization/agency and mark as non-company account
      if (orgId) payload.organization_id = orgId;
      if (agencyId) payload.agency_id = agencyId;
      // ensure agency-created accounts are flagged as not company accounts
      payload.is_company_account = false;
      axios.post('http://127.0.0.1:8000/api/bank-accounts/', payload, { headers })
        .then((res) => {
          const created = res.data;
          // server may or may not echo back is_company_account; ensure UI treats this as agency account
          if (created && typeof created === 'object' && created.is_company_account === undefined) {
            created.is_company_account = false;
          }
          const item = {
            id: created.id,
            bankName: created.bank_name || created.bankName || formData.bankName,
            accountTitle: created.account_title || created.accountTitle || formData.accountTitle,
            accountNumber: created.account_number || created.accountNumber || formData.accountNumber,
            iban: created.iban || formData.iban,
            status: created.status || 'active',
            organizationId: created.organization?.id || created.organization || orgId,
            raw: created,
          };
          setAgentAccounts((prev) => [item, ...prev]);
          toast.success('Account added');
          setShowModal(false);
          setFormData({ bankName: '', accountTitle: '', accountNumber: '', iban: '' });
        })
        .catch((err) => {
          console.error('Create failed', err);
          toast.error('Failed to add account');
        })
        .finally(() => setIsSubmitting(false));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ bankName: "", accountTitle: "", accountNumber: "", iban: "" });
    setEditingAccountId(null);
  };

  // open confirmation modal instead of using native confirm()
  const handleDelete = (accountId) => {
    setAccountToDelete(accountId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const accountId = accountToDelete;
    setShowDeleteModal(false);
    setAccountToDelete(null);
    if (!token) {
      toast.error('Not authenticated');
      return;
    }
    try {
      await axios.delete(`http://127.0.0.1:8000/api/bank-accounts/${accountId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgentAccounts((prev) => prev.filter((p) => Number(p.id) !== Number(accountId)));
      toast.success('Account deleted');
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete account');
    }
  };

  // no edit/create/delete handlers - read-only view

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
                      <h5 className="card-title mb-4 fw-semibold text-dark">
                        Bank Accounts Information of Agent
                      </h5>

                      <div className="table-responsive">
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
                              <th className="fw-normal text-muted pb-3">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAgentAccounts.map((account) => (
                              <tr key={account.id} className="border-bottom">
                                <td className="py-3">
                                  <span
                                    className="fw-bold text-dark text-decoration-underline"
                                    style={{ cursor: "pointer" }}
                                  >
                                    {account.bankName}
                                  </span>
                                </td>
                                <td className="py-3 text-muted">
                                  {account.accountTitle}
                                </td>
                                <td className="py-3 text-dark">
                                  {account.accountNumber}
                                </td>
                                <td className="py-3 text-dark">{account.iban}</td>
                                <td className="py-3">
                                  <div className="dropdown">
                                    <button
                                      className="btn btn-link p-0 text-primary"
                                      style={{ textDecoration: "none" }}
                                      onClick={() => toggleDropdown(account.id)}
                                    >
                                      <Gear />
                                    </button>
                                    {dropdownOpen === account.id && (
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
                                          onClick={() => handleAction("edit", account.id)}
                                          style={{ color: "#1B78CE" }}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="dropdown-item py-2 px-3 border-0 bg-transparent w-100 text-start text-danger"
                                          onClick={() => handleAction("remove", account.id)}
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
                      </div>
                      <div className="d-flex justify-content-end mt-4">
                        <button
                          className="btn px-4 py-2"
                          id="btn"
                          onClick={() => { setShowModal(true); setEditingAccountId(null); }}
                        >
                          Add Bank Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row mt-5">
                <div className="col-12 col-xl-12">
                  <div
                    className="card shadow-sm border-0"
                    onClick={() => setDropdownOpen(null)}
                  >
                    <div
                      className="card-body p-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h5 className="card-title mb-4 fw-semibold text-dark">
                        Bank Accounts Information of Saerpk
                      </h5>

                      <div className="table-responsive">
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
                              {/* read-only - finance accounts */}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSaerAccounts.map((account) => (
                              <tr key={account.id} className="border-bottom">
                                <td className="py-3">
                                  <span
                                    className="fw-bold text-dark text-decoration-underline"
                                    style={{ cursor: "pointer" }}
                                  >
                                    {account.bankName}
                                  </span>
                                </td>
                                <td className="py-3 text-muted">
                                  {account.accountTitle}
                                </td>
                                <td className="py-3 text-dark">
                                  {account.accountNumber}
                                </td>
                                <td className="py-3 text-dark">{account.iban}</td>
                                <td className="py-3 text-muted">Read-only</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Modal for adding/editing agent bank accounts */}
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
                          {editingAccountId ? 'Edit Bank Account' : 'Add Bank Account'}
                        </h5>
                      </div>

                      <div className="modal-body p-4">
                        <form onSubmit={handleSubmit}>
                          <fieldset className="border border-black p-2 rounded mb-3">
                            <legend className="float-none w-auto px-1 fs-6">
                              Bank Name
                            </legend>
                            <input
                              type="text"
                              className="form-control border-0 shadow-none"
                              id="bankName"
                              name="bankName"
                              value={formData.bankName}
                              onChange={handleInputChange}
                              required
                              placeholder="Meezan Bank "
                            />
                          </fieldset>

                          <fieldset className="border border-black p-2 rounded mb-3">
                            <legend className="float-none w-auto px-1 fs-6">
                              Account Title
                            </legend>
                            <input
                              type="text"
                              className="form-control border-0 shadow-none"
                              id="accountTitle"
                              name="accountTitle"
                              value={formData.accountTitle}
                              onChange={handleInputChange}
                              required
                              placeholder="Saer.pk"
                            />
                          </fieldset>

                          <fieldset className="border border-black p-2 rounded mb-3">
                            <legend className="float-none w-auto px-1 fs-6">
                              Account Number
                            </legend>
                            <input
                              type="text"
                              className="form-control border-0 shadow-none"
                              id="accountNumber"
                              name="accountNumber"
                              value={formData.accountNumber}
                              onChange={handleInputChange}
                              required
                              placeholder="3302237082738"
                            />
                          </fieldset>

                          <fieldset className="border border-black p-2 rounded mb-4">
                            <legend className="float-none w-auto px-1 fs-6">
                              IBAN
                            </legend>
                            <input
                              type="text"
                              className="form-control border-0 shadow-none"
                              id="iban"
                              name="iban"
                              value={formData.iban}
                              onChange={handleInputChange}
                              required
                              placeholder=" Pk3202293203782936"
                            />
                          </fieldset>

                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="submit"
                              className="btn btn-primary px-4"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Saving...' : 'Save'}
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

              {/* Delete confirmation modal (replace native confirm()) */}
              {showDeleteModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Delete</h5>
                      </div>
                      <div className="modal-body">
                        <p>Are you sure you want to delete this bank account? This action cannot be undone.</p>
                      </div>
                      <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setAccountToDelete(null); }}>Cancel</button>
                        <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
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
    </div>
  );
};

export default AgentBankAccounts;
