import React, { useEffect, useState } from "react";
import { Table, Button, Dropdown, Form, Modal, Spinner } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PartnersTabs from "../../components/PartnersTabs";
import AdminFooter from "../../components/AdminFooter";
import api from "../../utils/Api";
import orgApi from "../../utils/organizationApi";

const OrganizationLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showResellCreate, setShowResellCreate] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [resellRequests, setResellRequests] = useState([]);
  const [currentUserOrgIds, setCurrentUserOrgIds] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ main_org: "", link_org: "" });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const response = await orgApi.listLinks();
      const data = response.data;
      // The API returns an array (serializer) — adapt if API returns {results: []}
      const list = Array.isArray(data) ? data : data.results || [];
      // attach a normalized link id and stable row key so rendering is consistent
      const normalized = list.map((item, idx) => {
        const linkId = getLinkId(item);
        const rowKey = linkId != null ? `${linkId}` : `link-row-${idx}`;
        return { __linkId: linkId, __rowKey: rowKey, __origIndex: idx, ...item };
      });
      // debug: log first item shape and computed id to help diagnose missing ids
      if (normalized.length > 0) {
        console.debug("OrganizationLinks.fetchLinks: first item:", normalized[0]);
      } else {
        console.debug("OrganizationLinks.fetchLinks: no links returned");
      }
      setLinks(normalized);
    } catch (e) {
      console.error("fetchLinks error", e);
      setError(parseApiError(e) || "Failed to fetch links");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgs = async () => {
    try {
      const res = await api.get(`/organizations/`);
      const list = res.data || [];
      setOrganizations(list);
    } catch (e) {
      console.error("fetchOrgs error", e);
    }
  };

  // Helper to normalise API errors to readable strings
  function parseApiError(err) {
    try {
      if (!err) return null;
      if (err.response) {
        const data = err.response.data;
        if (!data) return `HTTP ${err.response.status}`;
        if (typeof data === "string") return data;
        if (data.detail) return data.detail;
        if (data.message) return data.message;
        // try common serializers
        if (data.non_field_errors) return data.non_field_errors.join("; ");
        // if it's an object of field errors, join them
        if (typeof data === "object") {
          return Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("; ");
        }
      }
      return err.message || String(err);
    } catch (e) {
      return String(err);
    }
  }

  useEffect(() => {
    fetchOrgs();
    fetchLinks();
    fetchResellRequests();
    fetchCurrentUserOrgs();
  }, []);

  const fetchResellRequests = async () => {
    try {
      const resp = await orgApi.listResellRequests();
      const list = Array.isArray(resp.data) ? resp.data : resp.data.results || [];
      setResellRequests(list);
    } catch (e) {
      console.error('fetchResellRequests error', e);
    }
  };

  useEffect(() => {
    if (!isAdmin && currentUserOrgIds.length > 0) {
      setForm(prev => ({ ...prev, main_org: currentUserOrgIds[0] }));
    }
  }, [isAdmin, currentUserOrgIds]);

  const fetchCurrentUserOrgs = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("agentAccessToken") || localStorage.getItem("token");
      const isAgent = !!localStorage.getItem("agentAccessToken");
      if (!token) return;
      let userId = null;
      try {
        // Try to parse JWT payload without external deps
        const payload = JSON.parse(atob(token.split('.')[1] || ''));
        userId = payload?.user_id || payload?.id || payload?.user || null;
      } catch (e) {
        console.warn('OrganizationLinks: failed to decode JWT payload', e);
      }
      if (!userId) return;
      const resp = await api.get(`/users/${userId}/`);
      const userData = resp.data || {};
      const orgIds = (userData.organizations && Array.isArray(userData.organizations))
        ? userData.organizations
        : (userData.organization_details && Array.isArray(userData.organization_details))
          ? userData.organization_details.map((o) => o.id)
          : [];
      setCurrentUserOrgIds(orgIds.map((id) => Number(id)));
      setIsAdmin(isAgent || userData.is_superuser || userData.is_staff || false);
    } catch (e) {
      console.warn('fetchCurrentUserOrgs failed', e);
    }
  };

  const handleAccept = async (linkId) => {
    console.log("handleAccept called with linkId:", linkId, typeof linkId);
    if (!linkId) {
      console.error("handleAccept: linkId is falsy", linkId);
      setError("Invalid link ID");
      return;
    }
    const key = `${linkId}`;
    setActionLoading(key);
    try {
      const response = await orgApi.acceptLink(linkId);
      const updated = response.data;
      console.debug("OrganizationLinks.handleAccept: accept response ->", updated);
      // update that row in-place to reflect new status without refetching
      setLinks((prev) =>
        prev.map((item) => {
          if (item.id === linkId) {
            // keep normalization fields
            const linkIdUpdated = getLinkId(updated) || item.__linkId;
            const rowKey = linkIdUpdated != null ? `${linkIdUpdated}` : item.__rowKey || item.__origIndex;
            return { __linkId: linkIdUpdated, __rowKey: rowKey, ...updated };
          }
          return item;
        })
      );
    } catch (e) {
      console.error("accept error", e);
      setError(parseApiError(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (linkId) => {
    const key = `${linkId}`;
    setActionLoading(key);
    try {
      const response = await orgApi.rejectLink(linkId);
      const updated = response.data;
      // update that row in-place to reflect new status without refetching
      setLinks((prev) =>
        prev.map((item) => {
          if (item.id === linkId) {
            const linkIdUpdated = getLinkId(updated) || item.__linkId;
            const rowKey = linkIdUpdated != null ? `${linkIdUpdated}` : item.__rowKey || item.__origIndex;
            return { __linkId: linkIdUpdated, __rowKey: rowKey, ...updated };
          }
          return item;
        })
      );
    } catch (e) {
      console.error("reject error", e);
      setError(parseApiError(e));
    } finally {
      setActionLoading(null);
    }
  };

  // helper: resolve organization name from several possible id fields
  const resolveOrgName = (linkObj, preferMain = true) => {
    // split candidate keys into main vs link to respect preferMain
    const mainCandidates = [
      'Main_organization_id',
      'main_organization_id',
      'main_organization',
      'main_org',
      'organization_id',
      'Organization_id',
    ];
    const linkCandidates = [
      'Link_organization_id',
      'link_organization_id',
      'link_organization',
      'link_org',
    ];

    const tryKeys = (keys) => {
      for (const key of keys) {
        const v = linkObj?.[key];
        if (v || v === 0) {
          // prefer looking up organization name by id if we have org list
          const found = organizations.find((o) => Number(o.id) === Number(v));
          return found ? (found.name || String(v)) : String(v);
        }
      }
      return null;
    };

    // Try preferred side first
    let result = preferMain ? tryKeys(mainCandidates) : tryKeys(linkCandidates);
    if (result) return result;

    // Then try the other side
    result = preferMain ? tryKeys(linkCandidates) : tryKeys(mainCandidates);
    if (result) return result;

    // fallback to any explicit name fields returned by API (respect preferMain)
    if (preferMain) {
      if (linkObj?.main_organization_name) return linkObj.main_organization_name;
      if (linkObj?.link_organization_name) return linkObj.link_organization_name;
    } else {
      if (linkObj?.link_organization_name) return linkObj.link_organization_name;
      if (linkObj?.main_organization_name) return linkObj.main_organization_name;
    }
    if (linkObj?.organization_name) return linkObj.organization_name;

    return "-";
  };

  // helper: robust id extractor for different API shapes
  const getLinkId = (obj) => {
    if (!obj) return null;

    // common direct id keys
    const directKeys = ["id", "pk", "ID", "link_id", "organization_link_id"];
    for (const k of directKeys) {
      if (typeof obj[k] !== "undefined" && obj[k] !== null && obj[k] !== "") {
        const n = Number(obj[k]);
        if (!Number.isNaN(n)) return n;
      }
    }
    // sometimes API returns a resource url like /api/organization-links/123/
    const urlFields = ["url", "href", "resource_uri"];
    for (const f of urlFields) {
      const v = obj[f];
      if (typeof v === "string") {
        // only accept url ids if the url appears to reference organization-links
        if (/organization-?links?/i.test(v)) {
          const m = v.match(/\/(\d+)\/?$/);
          if (m) return Number(m[1]);
        }
      }
    }

    // avoid grabbing ids from nested organization objects (like main_organization)
    // If the API provides a nested 'link' or 'organization_link' object that clearly
    // represents the link resource, extract it; otherwise skip nested objects.
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (v && typeof v === "object") {
        if (/link/i.test(key) || /organization_link/i.test(key) || /organizationlink/i.test(key)) {
          if (typeof v.id !== "undefined" && v.id !== null) return Number(v.id);
          if (typeof v.pk !== "undefined" && v.pk !== null) return Number(v.pk);
        }
      }
    }

    return null;
  };

  // helper: get stored status for main/link side handling different API key casings
  const getOrgStatus = (linkObj, side = "main") => {
    if (!linkObj) return "-";
    const mainCandidates = [
      "main_organization_request",
      "Main_organization_request",
      "mainOrganizationRequest",
    ];
    const linkCandidates = [
      "link_organization_request",
      "Link_organization_request",
      "linkOrganizationRequest",
    ];
    const keys = side === "main" ? mainCandidates : linkCandidates;
    for (const k of keys) {
      const v = linkObj?.[k];
      if (typeof v !== "undefined" && v !== null && v !== "") return v;
    }
    return "-";
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await orgApi.createLink(form.main_org, form.link_org);
      setShowCreate(false);
      setForm({ main_org: "", link_org: "" });
      fetchLinks();
    } catch (err) {
      console.error("create link error", err);
      setError(parseApiError(err));
    }
  };

  const [resellForm, setResellForm] = useState({ main_org: "", link_org: "", item_type: ["hotel"], reseller: false, items: "" });
  const [resellPrefilled, setResellPrefilled] = useState(false);

  const handleCreateResell = async (e) => {
    e.preventDefault();
    try {
      // Determine selected types (support single string or array)
      const selectedTypes = Array.isArray(resellForm.item_type)
        ? resellForm.item_type.map(t => String(t).toLowerCase())
        : [String(resellForm.item_type || '').toLowerCase()];

      if (!selectedTypes || selectedTypes.length === 0) {
        setError('Select at least one item type');
        return;
      }

      if (!resellForm.main_org || !resellForm.link_org) {
        setError('Main Organization and Link Organization are required');
        return;
      }

      const mainOrgVal = Number(resellForm.main_org) || resellForm.main_org;
      const linkOrgVal = Number(resellForm.link_org) || resellForm.link_org;

      // Backend expects one Item_type per request; create one request per selected type
      for (const t of selectedTypes) {
        const payload = {
          Main_organization_id: mainOrgVal,
          Link_organization_id: linkOrgVal,
          Item_type: t,
          reseller: resellForm.reseller,
          Items: [],
        };
        console.debug('OrganizationLinks.handleCreateResell - sending payload:', payload);
        // Use positional args to ensure the API helper builds payload consistently
        await orgApi.createResellRequest(payload.Main_organization_id, payload.Link_organization_id, payload.Item_type, payload.reseller, payload.Items);
      }

      setShowResellCreate(false);
      setResellForm({ main_org: "", link_org: "", item_type: ["hotel"], reseller: false, items: "" });
      setResellPrefilled(false);
      fetchResellRequests();
    } catch (err) {
      // log server response body when available to help diagnose 400s
      console.error('create resell error', err, err?.response?.data || err?.message);
      if (err && err.response && err.response.data) {
        try {
          setError(JSON.stringify(err.response.data));
        } catch (e) {
          setError(err.response.data);
        }
      } else {
        setError(parseApiError(err));
      }
    }
  };

  const openResellFromLink = (link) => {
    // Try to resolve main and link org ids from link object
    const mainOrgId = Number(link.Main_organization_id || link.main_organization_id || link.main_organization || link.main_org || "");
    const linkOrgId = Number(link.Link_organization_id || link.link_organization_id || link.link_organization || link.link_org || "");
    if (!mainOrgId || !linkOrgId) {
      setError('Unable to determine organizations for this link');
      return;
    }
    setResellForm({ main_org: mainOrgId, link_org: linkOrgId, item_type: ['hotel'], reseller: false });
    setResellPrefilled(true);
    setShowResellCreate(true);
  };

  const handleApproveResell = async (id) => {
    try {
      await orgApi.approveResellRequest(id);
      fetchResellRequests();
    } catch (e) {
      console.error('approve resell error', e);
      setError(parseApiError(e));
    }
  };

  const handleRejectResell = async (id) => {
    try {
      await orgApi.rejectResellRequest(id);
      fetchResellRequests();
    } catch (e) {
      console.error('reject resell error', e);
      setError(parseApiError(e));
    }
  };

  // Helper: check if user can act on this link (accept/reject)
  const canActOnLink = (link) => {
    if (!link || !Array.isArray(currentUserOrgIds) || currentUserOrgIds.length === 0) {
      return false;
    }

    // Users can only act on links involving their organizations
    const mainOrgId = Number(link.Main_organization_id);
    const linkOrgId = Number(link.Link_organization_id);

    if (isNaN(mainOrgId) || isNaN(linkOrgId)) {
      console.warn('canActOnLink: Invalid org IDs', { mainOrgId, linkOrgId, link });
      return false;
    }

    return currentUserOrgIds.includes(mainOrgId) || currentUserOrgIds.includes(linkOrgId);
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <PartnersTabs />

              <div className="p-3 my-3 bg-white rounded shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Organization Links</h5>
                  <div>
                    <Button className="me-2" onClick={() => fetchLinks()} size="sm">
                      Refresh
                    </Button>
                    <Button className="me-2" onClick={() => { setResellForm({ main_org: "", link_org: "", item_type: ["hotel"], reseller: false }); setResellPrefilled(false); setShowResellCreate(true); }} size="sm">
                      New Resell Request
                    </Button>
                    <Button onClick={() => setShowCreate(true)} size="sm">
                      New Link
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger">{JSON.stringify(error)}</div>
                )}

                <div>
                  <Table hover responsive className="align-middle text-center mt-3">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Main Organization</th>
                        <th>Link Organization</th>
                        <th>Main Status</th>
                        <th>Link Status</th>
                        <th>Request Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!loading && links.length === 0 && (
                        <tr>
                          <td colSpan={7}>No links found</td>
                        </tr>
                      )}
                      {links.map((l, idx) => {
                        if (!l || typeof l !== 'object') {
                          console.warn('Invalid link object at index', idx, l);
                          return null;
                        }
                        // prefer normalized __linkId and __rowKey attached in fetchLinks
                        const linkId = typeof l.__linkId !== "undefined" ? l.__linkId : getLinkId(l);
                        const rowKey = typeof l.__rowKey !== "undefined" ? l.__rowKey : (linkId != null ? `${linkId}` : `link-row-${idx}`);
                        const mainStatus = getOrgStatus(l, "main");
                        const linkStatus = getOrgStatus(l, "link");
                        const overallStatus = (mainStatus === 'REJECTED' || linkStatus === 'REJECTED' || mainStatus === 'rejected' || linkStatus === 'rejected') ? 'Rejected' :
                          (mainStatus === 'ACCEPTED' && linkStatus === 'ACCEPTED' || mainStatus === 'approved' && linkStatus === 'approved') ? 'Approved' : 'Pending';
                        return (
                          <tr key={rowKey}>
                            <td>{linkId ?? "-"}</td>
                            <td>{resolveOrgName(l, true)}</td>
                            <td>{resolveOrgName(l, false)}</td>
                            <td>{mainStatus}</td>
                            <td>{linkStatus}</td>
                            <td>{overallStatus}</td>
                            <td>
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    console.log('Accept button clicked, linkId:', linkId, 'l.id:', l.id);
                                    handleAccept(linkId);
                                  }}
                                  disabled={actionLoading === `${linkId}` || !canActOnLink(l)}
                                >
                                  {actionLoading != null && actionLoading === `${linkId}` ? <Spinner size="sm" animation="border" /> : "Accept"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleReject(linkId)}
                                  disabled={actionLoading === `${linkId}` || !canActOnLink(l)}
                                >
                                  {actionLoading != null && actionLoading === `${linkId}` ? <Spinner size="sm" animation="border" /> : "Reject"}
                                </Button>
                                {/* Resell action: available when both sides accepted and user is member of main org */}
                                {overallStatus === 'Approved' && (() => {
                                  const mainOrgId = Number(l.Main_organization_id || l.main_organization_id || l.main_organization || l.main_org || NaN);
                                  const linkOrgId = Number(l.Link_organization_id || l.link_organization_id || l.link_organization || l.link_org || NaN);
                                  const canRequestResell = !Number.isNaN(mainOrgId) && currentUserOrgIds.includes(mainOrgId);
                                  return (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => openResellFromLink(l)}
                                      disabled={!canRequestResell}
                                    >
                                      Resell
                                    </Button>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </div>
              <div className="p-3 my-3 bg-white rounded shadow-sm">
                <h6>Resell Requests</h6>
                <Table hover responsive className="align-middle text-center mt-3">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Main Org</th>
                      <th>Link Org</th>
                      <th>Item Type</th>
                      <th>Reseller</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resellRequests.length === 0 && (
                      <tr><td colSpan={7}>No resell requests</td></tr>
                    )}
                    {resellRequests.map((r) => {
                      const id = r.id || getLinkId(r) || "-";
                      const mainOrgId = Number(r.Main_organization_id || r.main_organization_id || r.main_organization || r.main_org || NaN);
                      const linkOrgId = Number(r.Link_organization_id || r.link_organization_id || r.link_organization || r.link_org || NaN);
                      const isLinkMember = Array.isArray(currentUserOrgIds) && currentUserOrgIds.includes(linkOrgId);
                      const isMainMember = Array.isArray(currentUserOrgIds) && currentUserOrgIds.includes(mainOrgId);

                      // Status badge colors
                      const statusRaw = (r.status || r.Status || '').toString().toUpperCase();
                      let statusVariant = 'warning';
                      if (statusRaw === 'APPROVED' || statusRaw === 'ACCEPTED') statusVariant = 'success';
                      else if (statusRaw === 'REJECTED') statusVariant = 'danger';
                      else statusVariant = 'warning';

                      return (
                        <tr key={`resell-${id}`}>
                          <td>{id}</td>
                          <td>{(organizations.find(o => Number(o.id) === Number(mainOrgId)) || {}).name || r.Main_organization_id}</td>
                          <td>{(organizations.find(o => Number(o.id) === Number(linkOrgId)) || {}).name || r.Link_organization_id}</td>
                          <td>{r.Item_type || r.item_type}</td>
                          <td>{r.reseller ? 'Yes' : 'No'}</td>
                          <td><span className={`badge bg-${statusVariant}`}>{r.status}</span></td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center">
                              {/* Approve/Reject buttons enabled only for Link organization members */}
                              {isLinkMember ? (
                                <>
                                  <Button size="sm" onClick={() => handleApproveResell(id)}>Approve</Button>
                                  <Button size="sm" variant="danger" onClick={() => handleRejectResell(id)}>Reject</Button>
                                </>
                              ) : isMainMember ? (
                                // Main org sees a faded/disabled approve button only
                                <>
                                  <Button size="sm" disabled style={{ opacity: 0.6, pointerEvents: 'none' }}>Approve</Button>
                                </>
                              ) : (
                                // Other users see no actions
                                <span>-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>

              <AdminFooter />
            </div>
          </div>
        </div>
      </div>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Organization Link</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <div className="mb-3">
              <label className="form-label">Main Organization</label>
              <Form.Select
                required
                value={form.main_org}
                onChange={(e) => setForm((s) => ({ ...s, main_org: e.target.value }))}
                disabled={!isAdmin}
              >
                <option value="">Select organization</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name || o.organization_name || `${o.id}`}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="mb-3">
              <label className="form-label">Link Organization</label>
              <Form.Select
                required
                value={form.link_org}
                onChange={(e) => setForm((s) => ({ ...s, link_org: e.target.value }))}
              >
                <option value="">Select organization</option>
                {organizations.filter((o) => o.id != form.main_org).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name || o.organization_name || `${o.id}`}
                  </option>
                ))}
              </Form.Select>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal show={showResellCreate} onHide={() => { setShowResellCreate(false); setResellPrefilled(false); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Resell Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateResell}>
          <Modal.Body>
            <div className="mb-3">
              <label className="form-label">Main Organization</label>
              <Form.Select
                required
                value={resellForm.main_org}
                onChange={(e) => setResellForm(s => ({ ...s, main_org: e.target.value }))}
                disabled={resellPrefilled}
              >
                <option value="">Select organization</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name || o.organization_name || `${o.id}`}</option>
                ))}
              </Form.Select>
            </div>

            <div className="mb-3">
              <label className="form-label">Link Organization</label>
              <Form.Select
                required
                value={resellForm.link_org}
                onChange={(e) => setResellForm(s => ({ ...s, link_org: e.target.value }))}
                disabled={resellPrefilled}
              >
                <option value="">Select organization</option>
                {organizations.filter((o) => o.id != resellForm.main_org).map((o) => (
                  <option key={o.id} value={o.id}>{o.name || o.organization_name || `${o.id}`}</option>
                ))}
              </Form.Select>
            </div>

            <div className="mb-3">
              <label className="form-label">Item Type(s)</label>
              <div className="d-flex gap-2 mb-2">
                {['hotel','ticket','package'].map((t) => {
                  const selected = Array.isArray(resellForm.item_type) ? resellForm.item_type.includes(t) : resellForm.item_type === t;
                  const emoji = t === 'hotel' ? '🏨' : t === 'ticket' ? '🎟️' : '📦';
                  return (
                    <Button
                      key={t}
                      variant={selected ? 'primary' : 'outline-secondary'}
                      onClick={() => {
                        setResellForm(s => {
                          const current = Array.isArray(s.item_type) ? [...s.item_type] : [s.item_type];
                          if (current.includes(t)) {
                            return { ...s, item_type: current.filter(x => x !== t) };
                          }
                          return { ...s, item_type: [...current, t] };
                        });
                      }}
                    >
                      <span style={{marginRight:6}}>{emoji}</span>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Button>
                  );
                })}
              </div>
              <div className="form-text">Click to select one or more inventory types to request reselling for.</div>
            </div>

            <div className="mb-3 form-check">
              <Form.Check type="checkbox" id="resellerCheck" label="Reseller (auto-share)" checked={resellForm.reseller} onChange={(e) => setResellForm(s => ({ ...s, reseller: e.target.checked }))} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowResellCreate(false)}>Cancel</Button>
            <Button type="submit">Create Resell Request</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default OrganizationLinks;
