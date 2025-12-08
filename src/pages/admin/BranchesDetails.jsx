import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Link,
  NavLink,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowBigLeft,
  UploadCloudIcon,
  Edit,
  Trash2,
  Plus,
  Search,
} from "lucide-react";
import {
  Dropdown,
  Table,
  Button,
  Form,
  Card,
  Modal,
  Spinner,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import axios from "axios";
import api from "../../utils/Api";
import './branches-details.css'

const BranchesDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [branch, setBranch] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

 const tabs = [
    { name: 'Overview', path: '/partners' },
    { name: 'Organization', path: '/partners/organization' },
    { name: 'Role Permissions', path: '/partners/role-permissions' },
    { name: 'Request', path: '/partners/request' },
    { name: 'Discounts', path: '/partners/discounts' },
    { name: 'Organization Links', path: '/partners/organization-links' },
    { name: 'Branches', path: '/partners/branche' },
    { name: 'Portal', path: '/partners/portal' },
    { name: 'Employees', path: '/partners/empolye' },
  ];

  // Fetch Branch + Agencies
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the shared `api` instance so Authorization header is attached automatically
        const [agenciesRes, branchesRes] = await Promise.all([
          api.get('/agencies/'),
          api.get('/branches/'),
        ]);

        const branchesData = Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data.results || []);
        const agenciesData = Array.isArray(agenciesRes.data) ? agenciesRes.data : (agenciesRes.data.results || []);

        const branchData = branchesData.find((b) => b.id === Number(id));
        const filteredAgencies = agenciesData.filter((agency) => Number(agency.branch) === Number(id));

        setBranch(branchData);
        setAgencies(filteredAgencies);
      } catch (err) {
        // If unauthorized, clear tokens and optionally redirect to login
        const status = err?.response?.status;
        if (status === 401) {
          try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); } catch (e) {}
          setError('Unauthorized. Please login to continue.');
          // navigate to login if you want: navigate('/login');
        } else {
          setError('Failed to load branch or agencies data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
                      className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Branches"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                        }`}
                      style={{ backgroundColor: "transparent" }}
                    >
                      {tab.name}
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="p-3 rounded-4 border">
                {/* Back Button */}
                <div className="d-flex align-items-center mb-4">
                  <Link to="/partners/branche" className="me-2">
                    <ArrowBigLeft />
                  </Link>
                </div>

                {/* Branch Details */}
                <h5 className="fw-semibold mb-3">Branch Information</h5>
                {/* {loading && <Spinner animation="border" />} */}
                {error && <Alert variant="danger">{error}</Alert>}
                {branch && (
                  <Card className="branch-info-card mb-4">
                    <div className="d-flex align-items-center">
                      <div className="me-3 avatar-placeholder">{(branch.name && branch.name[0]) ? branch.name[0].toUpperCase() : 'B'}</div>
                      <div>
                        <h5 className="mb-1">{branch.name}</h5>
                        <div className="text-muted small">{branch.organization_name || '—'}</div>
                      </div>
                    </div>

                    <div className="row mt-3">
                      <div className="col-sm-6 col-md-3">
                        <div className="branch-field"><strong>ID:</strong> {branch.id}</div>
                      </div>
                      <div className="col-sm-6 col-md-3">
                        <div className="branch-field"><strong>Email:</strong> {branch.email ? <a href={`mailto:${branch.email}`}>{branch.email}</a> : 'N/A'}</div>
                      </div>
                      <div className="col-sm-6 col-md-3">
                        <div className="branch-field"><strong>Phone:</strong> {branch.contact_number ? <a href={`tel:${branch.contact_number}`}>{branch.contact_number}</a> : 'N/A'}</div>
                      </div>
                      <div className="col-sm-6 col-md-3">
                        <div className="branch-field"><strong>Organization:</strong> {branch.organization_name || 'N/A'}</div>
                      </div>
                      <div className="col-12 mt-2">
                        <div className="branch-field"><strong>Address:</strong> {branch.address || 'N/A'}</div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Agencies overview cards and filters */}
                <div className="mb-4">
                  <div className="row g-3 mb-3">
                    {/* Overview cards */}
                    {(() => {
                      const total = agencies.length;
                      const area = agencies.filter(a => String(a.agency_type || '').toLowerCase().includes('area')).length;
                      const full = agencies.filter(a => String(a.agency_type || '').toLowerCase().includes('full')).length;
                      const active = agencies.filter(a => !!a.agreement_status === true).length;
                      const inactive = agencies.filter(a => !!a.agreement_status === false).length;
                      const blocked = agencies.filter(a => (a.is_blocked || a.blocked || a.status === 'blocked' || a.status === 'blocked_by_admin')).length;
                      const creditCount = agencies.filter(a => Number(a.credit_limit || 0) > 0).length;
                      return (
                        <>
                          <div className="col-6 col-md-3">
                            <div className="p-3 overview-card text-center">
                              <div className="small">Total Agencies</div>
                              <div className="h5 mb-0">{total}</div>
                            </div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="p-3 overview-card text-center">
                              <div className="small">Area Agencies</div>
                              <div className="h5 mb-0">{area}</div>
                            </div>
                          </div>
                          <div className="col-6 col-md-2">
                            <div className="p-3 overview-card text-center">
                              <div className="small">Full Agencies</div>
                              <div className="h5 mb-0">{full}</div>
                            </div>
                          </div>
                          <div className="col-6 col-md-2">
                            <div className="p-3 overview-card text-center">
                              <div className="small">Active</div>
                              <div className="h5 mb-0">{active}</div>
                            </div>
                          </div>
                          <div className="col-6 col-md-2">
                            <div className="p-3 overview-card text-center">
                              <div className="small">Inactive</div>
                              <div className="h5 mb-0">{inactive}</div>
                            </div>
                          </div>
                          <div className="col-6 col-md-2">
                            <div className="p-3 overview-card text-center">
                              <div className="small">Blocked</div>
                              <div className="h5 mb-0">{blocked}</div>
                            </div>
                          </div>
                          <div className="col-6 col-md-2">
                            <div className="p-3 overview-card text-center">
                              <div className="small">With Credit</div>
                              <div className="h5 mb-0">{creditCount}</div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="row g-2 align-items-center">
                    <div className="col-md-4">
                      <div className="search-input">
                        <span className="search-icon"><Search size={16} /></span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search agencies by name, code, email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                        <option value="">All types</option>
                        <option value="Area Agency">Area Agency</option>
                        <option value="Full Agency">Full Agency</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                    <div className="col-md-2 text-end">
                      <button className="btn btn-outline-secondary" type="button" onClick={() => { setTypeFilter(''); setStatusFilter(''); setSearchQuery(''); }}>
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Connected Agencies */}
                <h5 className="fw-semibold mt-4">Connected Agencies</h5>
                {!loading && agencies.length === 0 && (
                  <p className="text-muted">No agencies found for this branch.</p>
                )}

                {/* Compute filtered agencies client-side */}
                {(() => {
                  const normalize = (s) => (s == null ? '' : String(s).toLowerCase());
                  const getStatus = (a) => {
                    if (a.is_blocked || a.blocked || String(a.status || '').toLowerCase().includes('block')) return 'blocked';
                    if (a.agreement_status === true) return 'active';
                    if (a.agreement_status === false) return 'inactive';
                    return 'unknown';
                  };

                  const filteredAgencies = (agencies || []).filter((a) => {
                    // branch match already ensured by fetch
                    if (typeFilter) {
                      if (normalize(a.agency_type) !== normalize(typeFilter)) return false;
                    }
                    if (statusFilter) {
                      if (statusFilter === 'blocked') {
                        if (getStatus(a) !== 'blocked') return false;
                      } else if (statusFilter === 'active' || statusFilter === 'inactive') {
                        if (getStatus(a) !== statusFilter) return false;
                      }
                    }
                    const q = normalize(searchQuery);
                    if (q) {
                      const hay = [a.ageny_name, a.name, a.email, a.phone_number, a.agency_code, a.address].map(normalize).join(' ');
                      if (!hay.includes(q)) return false;
                    }
                    return true;
                  });

                  return (
                    <>
                      {(!loading && filteredAgencies.length === 0) ? (
                        <p className="text-muted">No agencies match the current filters.</p>
                      ) : (
                        <Table responsive bordered className="agency-table align-middle">
                          <thead>
                            <tr>
                              <th style={{ width: 60 }}>#</th>
                              <th>Agency</th>
                              <th style={{ width: 140 }}>Type</th>
                              <th style={{ width: 140 }}>Status</th>
                              <th style={{ width: 120 }}>Credit</th>
                              <th style={{ width: 150 }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAgencies.map((agency, idx) => (
                              <tr key={agency.id}>
                                <td>{idx + 1}</td>
                                <td>
                                  <div className="fw-bold">{agency.ageny_name || agency.name}</div>
                                  <div className="small text-muted">{agency.email || agency.phone_number || ''}</div>
                                </td>
                                <td>{agency.agency_type || '-'}</td>
                                <td>
                                  {getStatus(agency) === 'active' && <span className="badge status-badge-active">Active</span>}
                                  {getStatus(agency) === 'inactive' && <span className="badge status-badge-inactive">Inactive</span>}
                                  {getStatus(agency) === 'blocked' && <span className="badge status-badge-blocked">Blocked</span>}
                                  {!['active','inactive','blocked'].includes(getStatus(agency)) && <span className="small text-muted">{getStatus(agency)}</span>}
                                </td>
                                <td>{agency.credit_limit ? Number(agency.credit_limit).toFixed(2) : (agency.credit ? Number(agency.credit).toFixed(2) : '0.00')}</td>
                                <td className="agency-actions">
                                  <a href={`/agency-profile/${agency.id}?action=view`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary me-1">View</a>
                                  <a href={`/agency-profile/${agency.id}?action=edit`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">Edit</a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </>
                  );
                })()}

                {/* Close Button */}
                <div className="d-flex mt-5 flex-wrap gap-2 justify-content-end">
                  <Button
                    variant="outline-secondary"
                    as={Link}
                    to="/partners/branche"
                  >
                    Close
                  </Button>
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

export default BranchesDetails;
