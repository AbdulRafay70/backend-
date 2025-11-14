import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import cloud from "../../assets/cloud.png";
import cloud1 from "../../assets/cloud1.png";
import cloud2 from "../../assets/cloud2.png";
import logo from "../../assets/logo.png";
import Footer from "../../components/Footer";

const AgentRegister = () => {
  const [branchFormData, setBranchFormData] = useState({
    type: "branch",
    parent_id: "",
    name: "",
    email: "",
    phone: "",
    cnic_front: null,
    cnic_back: null,
    address: "",
    city: "",
    visiting_card: null,
    dts_license: null
  });

  const [agentFormData, setAgentFormData] = useState({
    type: "agent",
    parent_id: "",
    name: "",
    email: "",
    phone: "",
    cnic_front: null,
    cnic_back: null,
    address: "",
    city: "",
    visiting_card: null,
    dts_license: null
  });

  const [branches, setBranches] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [showBranchForm, setShowBranchForm] = useState(true);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showOptionalDocsBranch, setShowOptionalDocsBranch] = useState(false);
  const [showOptionalDocsAgent, setShowOptionalDocsAgent] = useState(false);
  const [branchPreviews, setBranchPreviews] = useState({});
  const [agentPreviews, setAgentPreviews] = useState({});
  const [employeeFormData, setEmployeeFormData] = useState({
    type: 'employee',
    parent_id: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    address: '',
    city: '',
    cnic_front: null,
    cnic_back: null,
    visiting_card: null
  });
  const [employeePreviews, setEmployeePreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [debugServerError, setDebugServerError] = useState(null);

  useEffect(() => {
    // load available parents from backend (organizations and branches)
    const fetchParents = async () => {
      setOrgsLoading(true);
      try {
        const token = localStorage.getItem('agentAccessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
  // Fetch organizations (for Branch parent selection). The backend returns organizations when you request ?type=branch
  const orgResp = await fetch('http://127.0.0.1:8000/api/universal/available-parents/?type=branch', { headers });
        if (orgResp.ok) {
          const orgJson = await orgResp.json();
          // expected shape: { available_parents: [{ id, name }, ...] }
          setOrganizations(orgJson.available_parents || []);
        }

  // Fetch branches (for Agent/Employee parent selection). The backend returns branches when you request ?type=agent
  const branchResp = await fetch('http://127.0.0.1:8000/api/universal/available-parents/?type=agent', { headers });
        if (branchResp.ok) {
          const branchJson = await branchResp.json();
          if (branchJson.available_parents && branchJson.available_parents.length > 0) {
            setBranches(branchJson.available_parents);
          }
        }
        setOrgsLoading(false);
      } catch (err) {
        // Keep sample placeholder if backend call fails
        console.warn('Failed to load available parents, falling back to sample list', err);
        setBranches([
          { id: 'branch1', name: 'Lahore Branch' },
          { id: 'branch2', name: 'Karachi Branch' },
          { id: 'branch3', name: 'Islamabad Branch' }
        ]);
        setOrganizations([
          { id: 'org1', name: 'Saer Tours & Travels' },
          { id: 'org2', name: 'Example Org' }
        ]);
        setOrgsLoading(false);
      }
    };

    fetchParents();

    return () => {
      Object.values(branchPreviews).forEach(u => { if (typeof u === 'string' && u.startsWith && u.startsWith('blob:')) URL.revokeObjectURL(u); });
      Object.values(agentPreviews).forEach(u => { if (typeof u === 'string' && u.startsWith && u.startsWith('blob:')) URL.revokeObjectURL(u); });
      Object.values(employeePreviews).forEach(u => { if (typeof u === 'string' && u.startsWith && u.startsWith('blob:')) URL.revokeObjectURL(u); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBranchInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'phone') {
      // allow digits only
      newValue = value.replace(/\D/g, '').slice(0, 15);
    }
    setBranchFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleAgentInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'phone') {
      newValue = value.replace(/\D/g, '').slice(0, 15);
    }
    setAgentFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const validateAndStoreFile = (file, onSuccess) => {
    if (!file) return false;
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return false;
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and PDF files are allowed");
      return false;
    }
    setError("");
    onSuccess();
    return true;
  };

  const handleBranchFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = validateAndStoreFile(file, () => {
      setBranchFormData(prev => ({ ...prev, [fieldName]: file }));
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setBranchPreviews(prev => ({ ...prev, [fieldName]: url }));
      } else {
        setBranchPreviews(prev => ({ ...prev, [fieldName]: file.name }));
      }
    });
    if (!ok) e.target.value = "";
  };

  const handleAgentFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = validateAndStoreFile(file, () => {
      setAgentFormData(prev => ({ ...prev, [fieldName]: file }));
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setAgentPreviews(prev => ({ ...prev, [fieldName]: url }));
      } else {
        setAgentPreviews(prev => ({ ...prev, [fieldName]: file.name }));
      }
    });
    if (!ok) e.target.value = "";
  };

  const handleEmployeeFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = validateAndStoreFile(file, () => {
      setEmployeeFormData(prev => ({ ...prev, [fieldName]: file }));
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setEmployeePreviews(prev => ({ ...prev, [fieldName]: url }));
      } else {
        setEmployeePreviews(prev => ({ ...prev, [fieldName]: file.name }));
      }
    });
    if (!ok) e.target.value = "";
  };

  const handleEmployeeInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'phone') {
      newValue = value.replace(/\D/g, '').slice(0, 15);
    }
    setEmployeeFormData(prev => ({ ...prev, [name]: newValue }));
  };

  // require gmail.com addresses only
  const emailRegex = /^[^\s@]+@gmail\.com$/i;
  // phone must be digits only, 10-15 digits
  const phoneRegex = /^\d{10,15}$/;

  const submitFormData = async (data) => {
    setLoading(true);
    setDebugServerError(null);
    try {
      // Map local form keys to backend expected keys and build FormData
      const form = new FormData();

      // Attach scalar fields
      // backend expects `type` and `parent_id` for parent relationship
      if (data.type) form.append('type', data.type);
      if (data.parent_id) form.append('parent_id', data.parent_id);
      // older branch form used `parent_org` name - allow it as fallback
      if (!data.parent_id && data.parent_org) form.append('parent_id', data.parent_org);

      const scalarFields = ['name', 'email', 'phone', 'address', 'city', 'position'];
      scalarFields.forEach(k => {
        if (data[k] !== undefined && data[k] !== null && data[k] !== '') form.append(k, data[k]);
      });

      // Attach file fields if present
      const fileFields = ['cnic_front', 'cnic_back', 'visiting_card', 'dts_license'];
      fileFields.forEach(k => {
        if (data[k]) form.append(k, data[k]);
      });

      // Make request to Universal register endpoint
      const token = localStorage.getItem('agentAccessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // DEBUG: log FormData contents to help diagnose 400 validation errors
      if (process.env.NODE_ENV !== 'production') {
        for (let pair of form.entries()) {
          console.debug('FormData:', pair[0], pair[1]);
        }
      }

      const resp = await fetch('http://127.0.0.1:8000/api/universal/register/', {
        method: 'POST',
        headers,
        body: form,
      });

      // Read the body exactly once as text then attempt to parse JSON from it.
      // This avoids "body stream already read" errors when attempting both
      // resp.json() and resp.text() on the same Response object (common when
      // backend returns HTML error pages for 500s).
      const bodyText = await resp.text();
      let bodyJson = null;
      try {
        bodyJson = bodyText ? JSON.parse(bodyText) : null;
      } catch (e) {
        bodyJson = null;
      }

      if (!resp.ok) {
        if (bodyJson && typeof bodyJson === 'object') {
          // store field-level errors for inline display and log full response (stringified for clarity)
          console.error('Registration validation errors:', resp.status, JSON.stringify(bodyJson, null, 2));
          setFieldErrors(bodyJson);
          setDebugServerError(JSON.stringify(bodyJson, null, 2));
          // prefer non_field_errors or detail if present, otherwise generic message
          const nonField = bodyJson.non_field_errors || bodyJson.detail || bodyJson.message;
          setError(nonField ? (Array.isArray(nonField) ? nonField.join(' ') : nonField) : 'Please fix the highlighted errors and try again.');
          return;
        }
        // not JSON or unexpected body; capture raw text for debugging
        console.error('Registration failed:', resp.status, bodyText);
        setDebugServerError(bodyText);
        throw new Error(resp.status === 401 ? 'Unauthorized. Please login.' : `Registration failed: ${resp.status}`);
      }

      const respJson = bodyJson;
      console.log('Registration response:', respJson);
      setFieldErrors({});
  setDebugServerError(null);
      setSuccess('Registration request sent successfully! We will contact you soon.');
      // clear file inputs
      document.querySelectorAll('input[type="file"]').forEach(input => { input.value = ''; });
    } catch (err) {
      console.error(err);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});
    setDebugServerError(null);
    // ensure selected parent exists in the loaded organizations
    const validParent = organizations && organizations.find(o => String(o.id) === String(branchFormData.parent_id));
    if (!validParent) {
      setFieldErrors({ parent_id: ["Selected parent organization is invalid"] });
      setError("Please select a valid Parent Organization from the list.");
      return;
    }
    if (!branchFormData.name || !branchFormData.phone || !branchFormData.email || !branchFormData.parent_id || !branchFormData.address) {
      setError("All fields are required (Name, Email, Phone, Parent Organization, Address)");
      return;
    }
    if (!emailRegex.test(branchFormData.email)) {
      setError("Email must be a @gmail.com address");
      return;
    }
    if (!phoneRegex.test(branchFormData.phone)) {
      setError("Phone must contain only digits (10-15 digits)");
      return;
    }
    await submitFormData(branchFormData);
    setBranchFormData({ type: "branch", parent_id: "", name: "", email: "", phone: "", cnic_front: null, cnic_back: null, address: "", city: "", visiting_card: null, dts_license: null });
    setBranchPreviews({});
    setShowOptionalDocsBranch(false);
  };

  const handleAgentSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});
    if (!agentFormData.name || !agentFormData.phone || !agentFormData.email || !agentFormData.parent_id || !agentFormData.address) {
      setError("All fields are required (Name, Email, Phone, Parent Organization/Branch, Address)");
      return;
    }
    if (!emailRegex.test(agentFormData.email)) {
      setError("Email must be a @gmail.com address");
      return;
    }
    if (!phoneRegex.test(agentFormData.phone)) {
      setError("Phone must contain only digits (10-15 digits)");
      return;
    }
    await submitFormData(agentFormData);
    setAgentFormData({ type: "agent", parent_id: "", name: "", email: "", phone: "", cnic_front: null, cnic_back: null, address: "", city: "", visiting_card: null, dts_license: null });
    setAgentPreviews({});
    setShowOptionalDocsAgent(false);
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});
    if (!employeeFormData.name || !employeeFormData.phone || !employeeFormData.email || !employeeFormData.parent_id || !employeeFormData.position) {
      setError("All fields are required (Name, Email, Phone, Parent Branch, Position)");
      return;
    }
    if (!emailRegex.test(employeeFormData.email)) {
      setError("Email must be a @gmail.com address");
      return;
    }
    if (!phoneRegex.test(employeeFormData.phone)) {
      setError("Phone must contain only digits (10-15 digits)");
      return;
    }
    await submitFormData(employeeFormData);
    setEmployeeFormData({ type: 'employee', parent_id: '', name: '', email: '', phone: '', position: '', address: '', city: '', cnic_front: null, cnic_back: null, visiting_card: null });
    setEmployeePreviews({});
  };

  return (
    <div
      className="p-3 bg-light"
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundImage: `url(${cloud2}), url(${cloud1}), url(${cloud})`,
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat, no-repeat, no-repeat",
      }}
    >
      <div className="container">
        <div className="text-start mt-1">
          <img src={logo} alt="" style={{ height: 40, width: 150 }} />
        </div>

        <div className="d-flex justify-content-center align-items-center mt-4">
          <div className="card border-0" style={{ maxWidth: "900px", width: "100%" }}>
            <div className="card-body p-0">
              <div className="card shadow-sm p-3 position-relative overflow-hidden">
                {/* background clouds inside card for subtle effect */}
                <img src={cloud} alt="cloud" style={{ position: 'absolute', left: -40, top: -20, width: 160, opacity: 0.08 }} />
                <img src={cloud1} alt="cloud1" style={{ position: 'absolute', right: -30, top: -10, width: 120, opacity: 0.08 }} />
                <img src={cloud2} alt="cloud2" style={{ position: 'absolute', right: 40, bottom: -20, width: 140, opacity: 0.03 }} />

                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div className="d-flex align-items-center mb-3">
                    <img src={logo} alt="logo" style={{ height: 40, width: 150, objectFit: 'contain' }} />
                  </div>

                  <h4 className="mb-3">Register as Partner</h4>

                  <div className="mb-3 d-flex gap-2">
                    <button className={`btn ${showBranchForm ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => { setShowBranchForm(true); setShowAgentForm(false); setShowEmployeeForm(false); }}>{'Branch'}</button>
                    <button className={`btn ${showAgentForm ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => { setShowAgentForm(true); setShowBranchForm(false); setShowEmployeeForm(false); }}>{'Agent'}</button>
                    <button className={`btn ${showEmployeeForm ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => { setShowEmployeeForm(true); setShowAgentForm(false); setShowBranchForm(false); }}>{'Employee'}</button>
                  </div>

                  {error && <div className="alert alert-danger">{error}</div>}
                  {success && <div className="alert alert-success">{success}</div>}
                  {debugServerError && (
                    <div className="alert alert-secondary" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 240, overflow: 'auto' }}>
                      <strong>Server validation response:</strong>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{debugServerError}</pre>
                    </div>
                  )}

                  {/* Branch Form */}
                  {showBranchForm && (
                    <form onSubmit={handleBranchSubmit} className="mb-4">
                      <div className="row">
                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Parent Organization*</label>
                          <select name="parent_id" value={branchFormData.parent_id} onChange={handleBranchInputChange} className="form-control" disabled={orgsLoading || organizations.length === 0}>
                            <option value="">{orgsLoading ? 'Loading organizations...' : 'Select Organization'}</option>
                            {!orgsLoading && organizations.length === 0 && (
                              <option value="" disabled>No organizations found</option>
                            )}
                            {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                          </select>
                          {fieldErrors && fieldErrors.parent_id && (
                            <div className="form-text text-danger">{Array.isArray(fieldErrors.parent_id) ? fieldErrors.parent_id.join(' ') : fieldErrors.parent_id}</div>
                          )}
                          {!orgsLoading && organizations.length === 0 && (
                            <div className="form-text text-muted">No organizations are available. You cannot submit a Branch registration until an organization exists.</div>
                          )}
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Name*</label>
                          <input name="name" value={branchFormData.name} onChange={handleBranchInputChange} className="form-control" />
                        </div>

                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Email*</label>
                          <input name="email" value={branchFormData.email} onChange={handleBranchInputChange} className="form-control" />
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Phone*</label>
                          <input name="phone" value={branchFormData.phone} onChange={handleBranchInputChange} className="form-control" />
                        </div>

                        {/* Passwords are set by admin upon approval; not collected here */}

                        <div className="col-12 mb-2">
                          <label className="form-label fw-semibold">Address*</label>
                          <input name="address" value={branchFormData.address} onChange={handleBranchInputChange} className="form-control" />
                        </div>

                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">City</label>
                          <input name="city" value={branchFormData.city} onChange={handleBranchInputChange} className="form-control" />
                        </div>

                        <div className="col-12 mt-2">
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setShowOptionalDocsBranch(s => !s)}>{showOptionalDocsBranch ? 'Hide Documents' : 'Upload Documents (Optional)'}</button>
                        </div>

                        <div className="w-100">
                          <div style={{ maxHeight: showOptionalDocsBranch ? 800 : 0, overflow: 'hidden', transition: 'max-height 280ms ease' }}>
                            <div className="row">
                              <div className="col-12 col-md-6 mb-2">
                              <label className="form-label fw-semibold">CNIC Front (Optional)</label>
                              <input type="file" onChange={(e) => handleBranchFileChange(e, 'cnic_front')} className="form-control" />
                              {branchPreviews.cnic_front && typeof branchPreviews.cnic_front === 'string' && branchPreviews.cnic_front.startsWith('blob:') && (
                                <img src={branchPreviews.cnic_front} alt="cnic_front" style={{ height: 80, marginTop: 8 }} />
                              )}
                            </div>
                              <div className="col-12 col-md-6 mb-2">
                              <label className="form-label fw-semibold">CNIC Back (Optional)</label>
                              <input type="file" onChange={(e) => handleBranchFileChange(e, 'cnic_back')} className="form-control" />
                              {branchPreviews.cnic_back && typeof branchPreviews.cnic_back === 'string' && branchPreviews.cnic_back.startsWith('blob:') && (
                                <img src={branchPreviews.cnic_back} alt="cnic_back" style={{ height: 80, marginTop: 8 }} />
                              )}
                            </div>
                              <div className="col-12 col-md-6 mb-2">
                              <label className="form-label fw-semibold">Visiting Card (Optional)</label>
                              <input type="file" onChange={(e) => handleBranchFileChange(e, 'visiting_card')} className="form-control" />
                              {branchPreviews.visiting_card && typeof branchPreviews.visiting_card === 'string' && branchPreviews.visiting_card.startsWith('blob:') && (
                                <img src={branchPreviews.visiting_card} alt="visiting_card" style={{ height: 80, marginTop: 8 }} />
                              )}
                            </div>
                              <div className="col-12 col-md-6 mb-2">
                              <label className="form-label fw-semibold">DTS License (Optional)</label>
                              <input type="file" onChange={(e) => handleBranchFileChange(e, 'dts_license')} className="form-control" />
                            </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      <button type="submit" disabled={loading || orgsLoading || organizations.length === 0} className="btn w-100 rounded py-2 mt-3" style={{ background: '#1B78CE', color: '#fff' }}>{loading ? 'Submitting...' : 'Submit Branch'}</button>
                    </form>
                  )}

                  {/* Agent Form */}
                  {showAgentForm && (
                    <form onSubmit={handleAgentSubmit} className="mb-4">
                      <div className="row">
                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Parent Branch*</label>
                          <select name="parent_id" value={agentFormData.parent_id} onChange={handleAgentInputChange} className="form-control">
                            <option value="">Select Branch</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                          {fieldErrors && fieldErrors.parent_id && (
                            <div className="form-text text-danger">{Array.isArray(fieldErrors.parent_id) ? fieldErrors.parent_id.join(' ') : fieldErrors.parent_id}</div>
                          )}
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Name*</label>
                          <input name="name" value={agentFormData.name} onChange={handleAgentInputChange} className="form-control" />
                        </div>

                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Email*</label>
                          <input name="email" value={agentFormData.email} onChange={handleAgentInputChange} className="form-control" />
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Phone*</label>
                          <input name="phone" value={agentFormData.phone} onChange={handleAgentInputChange} className="form-control" />
                        </div>

                        {/* Passwords are set by admin upon approval; not collected here */}

                        <div className="col-12 mb-2">
                          <label className="form-label fw-semibold">Address*</label>
                          <input name="address" value={agentFormData.address} onChange={handleAgentInputChange} className="form-control" />
                        </div>

                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">City</label>
                          <input name="city" value={agentFormData.city} onChange={handleAgentInputChange} className="form-control" />
                        </div>

                        <div className="col-12 mt-2">
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setShowOptionalDocsAgent(s => !s)}>{showOptionalDocsAgent ? 'Hide Documents' : 'Upload Documents (Optional)'}</button>
                        </div>

                        <div className="w-100">
                          <div style={{ maxHeight: showOptionalDocsAgent ? 800 : 0, overflow: 'hidden', transition: 'max-height 280ms ease' }}>
                            <div className="row">
                              <div className="col-12 col-md-6 mb-2">
                                <label className="form-label fw-semibold">CNIC Front (Optional)</label>
                                <input type="file" onChange={(e) => handleAgentFileChange(e, 'cnic_front')} className="form-control" />
                                {agentPreviews.cnic_front && typeof agentPreviews.cnic_front === 'string' && agentPreviews.cnic_front.startsWith('blob:') && (
                                  <img src={agentPreviews.cnic_front} alt="cnic_front" style={{ height: 80, marginTop: 8 }} />
                                )}
                              </div>
                              <div className="col-12 col-md-6 mb-2">
                                <label className="form-label fw-semibold">CNIC Back (Optional)</label>
                                <input type="file" onChange={(e) => handleAgentFileChange(e, 'cnic_back')} className="form-control" />
                                {agentPreviews.cnic_back && typeof agentPreviews.cnic_back === 'string' && agentPreviews.cnic_back.startsWith('blob:') && (
                                  <img src={agentPreviews.cnic_back} alt="cnic_back" style={{ height: 80, marginTop: 8 }} />
                                )}
                              </div>
                              <div className="col-12 col-md-6 mb-2">
                                <label className="form-label fw-semibold">Visiting Card (Optional)</label>
                                <input type="file" onChange={(e) => handleAgentFileChange(e, 'visiting_card')} className="form-control" />
                                {agentPreviews.visiting_card && typeof agentPreviews.visiting_card === 'string' && agentPreviews.visiting_card.startsWith('blob:') && (
                                  <img src={agentPreviews.visiting_card} alt="visiting_card" style={{ height: 80, marginTop: 8 }} />
                                )}
                              </div>
                              <div className="col-12 col-md-6 mb-2">
                                <label className="form-label fw-semibold">DTS License (Optional)</label>
                                <input type="file" onChange={(e) => handleAgentFileChange(e, 'dts_license')} className="form-control" />
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      <button type="submit" disabled={loading} className="btn w-100 rounded py-2 mt-3" style={{ background: '#1B78CE', color: '#fff' }}>{loading ? 'Submitting...' : 'Submit Agent'}</button>
                    </form>
                  )}

                  {/* Employee Form */}
                  {showEmployeeForm && (
                    <form onSubmit={handleEmployeeSubmit} className="mb-4">
                      <div className="row">
                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Parent Branch*</label>
                          <select name="parent_id" value={employeeFormData.parent_id} onChange={handleEmployeeInputChange} className="form-control">
                            <option value="">Select Branch</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                          {fieldErrors && fieldErrors.parent_id && (
                            <div className="form-text text-danger">{Array.isArray(fieldErrors.parent_id) ? fieldErrors.parent_id.join(' ') : fieldErrors.parent_id}</div>
                          )}
                        </div>

                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Position*</label>
                          <input name="position" value={employeeFormData.position} onChange={handleEmployeeInputChange} className="form-control" />
                        </div>

                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Name*</label>
                          <input name="name" value={employeeFormData.name} onChange={handleEmployeeInputChange} className="form-control" />
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Email*</label>
                          <input name="email" value={employeeFormData.email} onChange={handleEmployeeInputChange} className="form-control" />
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">Phone*</label>
                          <input name="phone" value={employeeFormData.phone} onChange={handleEmployeeInputChange} className="form-control" />
                        </div>

                        {/* Passwords are set by admin upon approval; not collected here */}

                        <div className="col-12 mb-2">
                          <label className="form-label fw-semibold">Address</label>
                          <input name="address" value={employeeFormData.address} onChange={handleEmployeeInputChange} className="form-control" />
                        </div>

                        <div className="col-12 col-md-6 mb-2">
                          <label className="form-label fw-semibold">City</label>
                          <input name="city" value={employeeFormData.city} onChange={handleEmployeeInputChange} className="form-control" />
                        </div>

                        <div className="col-12 mt-2">
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setShowOptionalDocsAgent(s => !s)}>{showOptionalDocsAgent ? 'Hide Documents' : 'Upload Documents (Optional)'}</button>
                        </div>

                        <div className="w-100">
                          <div style={{ maxHeight: showOptionalDocsAgent ? 800 : 0, overflow: 'hidden', transition: 'max-height 280ms ease' }}>
                            <div className="row">
                              <div className="col-12 col-md-6 mb-2">
                                <label className="form-label fw-semibold">CNIC Front (Optional)</label>
                                <input type="file" onChange={(e) => handleEmployeeFileChange(e, 'cnic_front')} className="form-control" />
                                {employeePreviews.cnic_front && typeof employeePreviews.cnic_front === 'string' && employeePreviews.cnic_front.startsWith('blob:') && (
                                  <img src={employeePreviews.cnic_front} alt="cnic_front" style={{ height: 80, marginTop: 8 }} />
                                )}
                              </div>
                              <div className="col-12 col-md-6 mb-2">
                                <label className="form-label fw-semibold">CNIC Back (Optional)</label>
                                <input type="file" onChange={(e) => handleEmployeeFileChange(e, 'cnic_back')} className="form-control" />
                                {employeePreviews.cnic_back && typeof employeePreviews.cnic_back === 'string' && employeePreviews.cnic_back.startsWith('blob:') && (
                                  <img src={employeePreviews.cnic_back} alt="cnic_back" style={{ height: 80, marginTop: 8 }} />
                                )}
                              </div>
                              <div className="col-12 col-md-6 mb-2">
                                <label className="form-label fw-semibold">Visiting Card (Optional)</label>
                                <input type="file" onChange={(e) => handleEmployeeFileChange(e, 'visiting_card')} className="form-control" />
                                {employeePreviews.visiting_card && typeof employeePreviews.visiting_card === 'string' && employeePreviews.visiting_card.startsWith('blob:') && (
                                  <img src={employeePreviews.visiting_card} alt="visiting_card" style={{ height: 80, marginTop: 8 }} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      <button type="submit" disabled={loading} className="btn w-100 rounded py-2 mt-3" style={{ background: '#1B78CE', color: '#fff' }}>{loading ? 'Submitting...' : 'Submit Employee'}</button>
                    </form>
                  )}

                  <div className="text-center mt-3">
                    <p className="mb-0">Already have an account? <Link to="/login">Login</Link></p>
                  </div>

                </div> {/* relative zIndex div */}
              </div> {/* card */}
            </div> {/* card-body */}
          </div> {/* outer card */}
        </div> {/* center wrapper */}

        <div className="mt-4">
          <Footer />
        </div>
      </div> {/* container */}
    </div>
  );
};

export default AgentRegister;
