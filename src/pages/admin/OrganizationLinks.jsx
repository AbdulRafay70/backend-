  import React, { useEffect, useState } from "react";
  import { Table, Button, Dropdown, Form, Modal, Spinner } from "react-bootstrap";
  import Sidebar from "../../components/Sidebar";
  import Header from "../../components/Header";
  import PartnersTabs from "../../components/PartnersTabs";
  import AdminFooter from "../../components/AdminFooter";
  import api from "../../utils/Api";
  import orgApi from "../../utils/organizationApi";

  const OrganizationLinks = () => {
    // Debug: log the organization API wrapper to help diagnose missing methods
    useEffect(() => {
      try {
        console.debug('organizationApi available methods:', Object.keys(orgApi || {}), orgApi);
      } catch (e) {
        console.warn('Failed to inspect orgApi', e);
      }
    }, []);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showResellCreate, setShowResellCreate] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [resellRequests, setResellRequests] = useState([]);
    const [currentUserOrgIds, setCurrentUserOrgIds] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [orgsLoaded, setOrgsLoaded] = useState(false);
    const [form, setForm] = useState({ main_org: "", link_org: "" });
    const [actionLoading, setActionLoading] = useState(null);
    const [resellActionLoading, setResellActionLoading] = useState(null);

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

    // Fetch organization list for lookups
    async function fetchOrgs() {
      try {
        let resp;
        if (typeof orgApi.listOrganizations === 'function') {
          resp = await orgApi.listOrganizations();
        } else {
          resp = await api.get('/organizations/');
        }
        const list = Array.isArray(resp.data) ? resp.data : resp.data?.results || [];
        setOrganizations(list || []);
      } catch (e) {
        console.warn('fetchOrgs error', e);
      }
    }

    // Fetch links and apply the same org-based filtering as resell requests
    async function fetchLinks() {
      setLoading(true);
      try {
        const resp = await orgApi.listLinks();
        const list = Array.isArray(resp.data) ? resp.data : resp.data?.results || [];
        let normalized = list.map((item, idx) => {
          const id = getLinkId(item) || item.id || idx;
          return { __linkId: Number(id), __rowKey: `${id}`, __origIndex: idx, ...item };
        });

        // Enforce visibility: non-admin users should only see links that involve
        // their organizations. If the current user has no organizations, show none.
        let visibleNormalized = normalized;
        if (!isAdmin && !isSuperAdmin) {
          if (Array.isArray(currentUserOrgIds) && currentUserOrgIds.length > 0) {
            visibleNormalized = normalized.filter((it) => {
              const mainOrgId = Number(it.Main_organization_id || it.main_organization_id || it.main_organization || it.main_org || NaN);
              const linkOrgId = Number(it.Link_organization_id || it.link_organization_id || it.link_organization || it.link_org || NaN);
              return (Number.isFinite(mainOrgId) && currentUserOrgIds.includes(mainOrgId)) || (Number.isFinite(linkOrgId) && currentUserOrgIds.includes(linkOrgId));
            });
          } else {
            // no organizations for this user; hide all
            visibleNormalized = [];
          }
        }

        // Identify links where BOTH sides have rejected and remove them automatically.
        const toAutoDelete = [];
        const remaining = [];
        for (const it of visibleNormalized) {
          const mainRejected = isSideRejected(it, 'main');
          const linkRejected = isSideRejected(it, 'link');
          if (mainRejected && linkRejected) toAutoDelete.push(it);
          else remaining.push(it);
        }

        if (toAutoDelete.length > 0) {
          console.debug('Auto-deleting fully-rejected organization links:', toAutoDelete.map(d => d.__linkId));

          // Try to read resell requests once to discover related records to remove
          let allResells = [];
          try {
            const rresp = await orgApi.listResellRequests();
            allResells = Array.isArray(rresp.data) ? rresp.data : rresp.data?.results || [];
          } catch (e) {
            console.warn('Failed to list resell requests during auto-delete', e);
          }

          // For each fully rejected link, attempt server delete (with fallback),
          // and cleanup any associated resell requests both server-side and client-side.
          for (const del of toAutoDelete) {
            const linkId = del.__linkId || getLinkId(del) || del.id;

            if (linkId) {
              // prefer a resource URL if the API provided one
              const resourceUrl = getLinkUrl(del);
              const tryDelete = async (target) => {
                try {
                  await api.delete(target);
                  console.debug('DELETE succeeded for', target);
                  return true;
                } catch (e) {
                  // treat 404 as 'not found' (already removed) and return true
                  if (e && e.response && e.response.status === 404) {
                    console.warn('DELETE returned 404 (not found) for', target);
                    return true;
                  }
                  console.warn('DELETE failed for', target, e);
                  return false;
                }
              };

              let deleted = false;
              if (resourceUrl) {
                // resourceUrl may be absolute or relative; api.delete can accept absolute URLs
                deleted = await tryDelete(resourceUrl);
              }

              if (!deleted) {
                if (typeof orgApi.deleteLink === 'function') {
                  try {
                    await orgApi.deleteLink(linkId);
                    deleted = true;
                  } catch (err) {
                    console.warn('orgApi.deleteLink failed for', linkId, err);
                  }
                }
              }

              if (!deleted) {
                const path = `/organization-links/${linkId}/`;
                deleted = await tryDelete(path);
              }

              if (!deleted) {
                console.error('All attempts to delete organization link failed for', linkId);
              }
            }

            const mainOrgId = Number(del.Main_organization_id || del.main_organization_id || del.main_organization || del.main_org || NaN);
            const linkOrgId = Number(del.Link_organization_id || del.link_organization_id || del.link_organization || del.link_org || NaN);

            // delete matching resell requests found in server list
            for (const r of allResells) {
              const rMain = Number(r.Main_organization_id || r.main_organization_id || r.main_organization || r.main_org || NaN);
              const rLink = Number(r.Link_organization_id || r.link_organization_id || r.link_organization || r.link_org || NaN);
              const match = (!Number.isNaN(mainOrgId) && !Number.isNaN(linkOrgId) && rMain === mainOrgId && rLink === linkOrgId);
              if (match) {
                const rid = r.id || getLinkId(r);
                const rUrl = getLinkUrl(r);
                const tryDeleteResell = async (target) => {
                  try {
                    await api.delete(target);
                    console.debug('Deleted resell request', target);
                  } catch (err) {
                    if (err && err.response && err.response.status === 404) {
                      console.warn('Resell DELETE returned 404 (not found) for', target);
                      return;
                    }
                    console.warn('Failed deleting resell request', target, err);
                  }
                };

                if (rUrl) {
                  tryDeleteResell(rUrl);
                } else if (rid) {
                  if (typeof orgApi.deleteResellRequest === 'function') {
                    orgApi.deleteResellRequest(rid).catch((err) => console.warn('deleteResellRequest failed', rid, err));
                  } else {
                    tryDeleteResell(`/resell-requests/${rid}/`);
                  }
                }
              }
            }
          }
        }

        // Apply org-based filtering for non-admins on the remaining links
        let filtered = remaining;
        if (!isAdmin && Array.isArray(currentUserOrgIds) && currentUserOrgIds.length > 0) {
          filtered = remaining.filter((it) => {
            const mainOrgId = Number(it.Main_organization_id || it.main_organization_id || it.main_organization || it.main_org || NaN);
            const linkOrgId = Number(it.Link_organization_id || it.link_organization_id || it.link_organization || it.link_org || NaN);
            return (Number.isFinite(mainOrgId) && currentUserOrgIds.includes(mainOrgId)) || (Number.isFinite(linkOrgId) && currentUserOrgIds.includes(linkOrgId));
          });
        }

        setLinks(filtered);

        // Remove any resell requests in UI that correspond to auto-deleted links
        if (toAutoDelete.length > 0) {
          setResellRequests((prev) => prev.filter((r) => {
            for (const del of toAutoDelete) {
              const mainOrgId = Number(del.Main_organization_id || del.main_organization_id || del.main_organization || del.main_org || NaN);
              const linkOrgId = Number(del.Link_organization_id || del.link_organization_id || del.link_organization || del.link_org || NaN);
              const rMain = Number(r.Main_organization_id || r.main_organization_id || r.main_organization || r.main_org || NaN);
              const rLink = Number(r.Link_organization_id || r.link_organization_id || r.link_organization || r.link_org || NaN);
              if (!Number.isNaN(mainOrgId) && !Number.isNaN(linkOrgId) && rMain === mainOrgId && rLink === linkOrgId) return false;
            }
            return true;
          }));
        }
      } catch (e) {
        console.error('fetchLinks error', e);
      } finally {
        setLoading(false);
      }
    }

    useEffect(() => {
      // Fetch organizations and current user orgs first. Links/resell requests
      // are fetched once we know the current user's organizations so we can
      // filter out requests that do not involve the user's organizations.
      fetchOrgs();
      fetchCurrentUserOrgs();
    }, []);

    // When we've loaded the current user's orgs (or admin flag), fetch lists
    useEffect(() => {
      if (!orgsLoaded) return;
      fetchLinks();
      fetchResellRequests();
    }, [orgsLoaded, isAdmin, isSuperAdmin, currentUserOrgIds]);

    const fetchResellRequests = async () => {
      try {
        const resp = await orgApi.listResellRequests();
        const list = Array.isArray(resp.data) ? resp.data : resp.data.results || [];
        // If user is not admin, only show resell requests that involve the
        // current user's organizations.
        let filtered = list;
        if (!isAdmin && Array.isArray(currentUserOrgIds) && currentUserOrgIds.length > 0) {
          filtered = list.filter((r) => {
            const mainOrgId = Number(r.Main_organization_id || r.main_organization_id || r.main_organization || r.main_org || NaN);
            const linkOrgId = Number(r.Link_organization_id || r.link_organization_id || r.link_organization || r.link_org || NaN);
            return (Number.isFinite(mainOrgId) && currentUserOrgIds.includes(mainOrgId)) || (Number.isFinite(linkOrgId) && currentUserOrgIds.includes(linkOrgId));
          });
        }
        setResellRequests(filtered);
      } catch (e) {
        console.error('fetchResellRequests error', e);
      }
    };

    useEffect(() => {
      // If the user is neither an agent-admin nor a super-admin, default the
      // create form's main_org to the user's first organization and disable
      // the selector so users can only create links for their own org.
      if (!isAdmin && !isSuperAdmin && currentUserOrgIds.length > 0) {
        setForm(prev => ({ ...prev, main_org: currentUserOrgIds[0] }));
      }
    }, [isAdmin, isSuperAdmin, currentUserOrgIds]);

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
        // Treat only agent tokens as admin for the UI. Do NOT grant superuser
        // or staff users the global admin view — they should only see requests
        // for organizations they belong to.
        setIsAdmin(Boolean(isAgent));
        // But record if the user is a superuser/staff so they may create links
        // on behalf of any organization (without granting global view).
        setIsSuperAdmin(Boolean(userData.is_superuser || userData.isSuperuser || userData.is_staff || userData.isStaff));
      } catch (e) {
        console.warn('fetchCurrentUserOrgs failed', e);
      } finally {
        // Indicate we've completed the attempt to load user's orgs (even if empty)
        setOrgsLoaded(true);
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
        console.debug('OrganizationLinks.handleReject - reject response:', updated);
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
        // call reject endpoint
        await orgApi.rejectLink(linkId);

        // refetch the link list to get the authoritative current state
        let listResp;
        try {
          listResp = await orgApi.listLinks();
        } catch (listErr) {
          console.warn('Failed to refetch links after reject', listErr);
          // optimistic fallback: mark matching local row as rejected
          setLinks((prev) =>
            prev.map((item) => {
              if (item.id === linkId || item.__linkId === linkId) {
                const copy = { ...item };
                copy.main_organization_request = copy.main_organization_request || 'REJECTED';
                copy.link_organization_request = copy.link_organization_request || 'REJECTED';
                return copy;
              }
              return item;
            })
          );
          return;
        }

        const dataList = Array.isArray(listResp.data) ? listResp.data : listResp.data?.results || [];
        const found = dataList.find(d => getLinkId(d) === Number(linkId));

        if (!found) {
          // server removed the link
          setLinks(prev => prev.filter(item => !(item.__linkId === linkId || item.id === linkId)));
          // best-effort remove any resell that references this link id
          setResellRequests(prev => prev.filter(r => {
            const id = r.id || getLinkId(r);
            return id !== linkId;
          }));
          return;
        }

        const mainRejected = isSideRejected(found, 'main');
        const linkRejected = isSideRejected(found, 'link');
        const bothRejected = mainRejected && linkRejected;

        if (bothRejected) {
          if (typeof orgApi.deleteLink === 'function') {
            try {
              await orgApi.deleteLink(linkId);
            } catch (delErr) {
              console.error('Failed to delete link after both sides rejected', delErr);
              // fallback to direct delete via generic api
              try {
                await api.delete(`/organization-links/${linkId}/`);
                console.debug('Fallback: deleted organization link via api.delete', linkId);
              } catch (fallbackErr) {
                console.error('Fallback deleteLink via api.delete failed', fallbackErr);
              }
            }
          } else {
            console.warn('orgApi.deleteLink not available; attempting fallback api.delete');
            try {
              await api.delete(`/organization-links/${linkId}/`);
              console.debug('Fallback: deleted organization link via api.delete', linkId);
            } catch (fallbackErr) {
              console.error('Fallback deleteLink via api.delete failed', fallbackErr);
            }
          }

          setLinks(prev => prev.filter(item => !(item.__linkId === linkId || item.id === linkId)));

          const mainOrgId = Number(found.Main_organization_id || found.main_organization_id || found.main_organization || found.main_org || NaN);
          const linkOrgId = Number(found.Link_organization_id || found.link_organization_id || found.link_organization || found.link_org || NaN);

          setResellRequests(prev => prev.filter(r => {
            const rMain = Number(r.Main_organization_id || r.main_organization_id || r.main_organization || r.main_org || NaN);
            const rLink = Number(r.Link_organization_id || r.link_organization_id || r.link_organization || r.link_org || NaN);
            const match = (!Number.isNaN(mainOrgId) && !Number.isNaN(linkOrgId) && rMain === mainOrgId && rLink === linkOrgId);
            if (match) {
              const id = r.id || getLinkId(r);
              if (id) {
                if (typeof orgApi.deleteResellRequest === 'function') {
                  orgApi.deleteResellRequest(id).catch((err) => console.warn('deleteResellRequest failed', id, err));
                } else {
                  // fallback to generic delete
                  api.delete(`/resell-requests/${id}/`).catch((err) => console.warn('Fallback deleteResellRequest failed', id, err));
                }
              }
            }
            return !match;
          }));
        } else {
          // update local row with fresh data
          setLinks(prev => prev.map(item => {
            if (item.id === linkId || item.__linkId === linkId) {
              const linkIdUpdated = getLinkId(found) || item.__linkId;
              const rowKey = linkIdUpdated != null ? `${linkIdUpdated}` : item.__rowKey || item.__origIndex;
              return { __linkId: linkIdUpdated, __rowKey: rowKey, ...found };
            }
            return item;
          }));
        }
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

    // helper: try to extract a resource URL from API objects (url/href/resource_uri)
    const getLinkUrl = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      const urlFields = ['url', 'href', 'resource_uri', 'link_url', 'linkHref'];
      for (const f of urlFields) {
        const v = obj[f];
        if (typeof v === 'string' && v.trim()) return v;
      }
      // sometimes nested link object contains the resource url
      for (const key of Object.keys(obj)) {
        const v = obj[key];
        if (v && typeof v === 'object') {
          for (const f of urlFields) {
            if (typeof v[f] === 'string' && v[f].trim()) return v[f];
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

    // helper: robust check for whether a side's status is rejected
    const isSideRejected = (linkObj, side = "main") => {
      if (!linkObj) return false;
      const candidates = [];
      if (side === 'main') {
        candidates.push(
          linkObj.Main_organization_request,
          linkObj.main_organization_request,
          linkObj.mainOrganizationRequest,
          // some responses might nest org objects
          (linkObj.main_organization && linkObj.main_organization.request),
          (linkObj.main_organization && linkObj.main_organization.status),
          (linkObj.main_org && linkObj.main_org.request),
        );
      } else {
        candidates.push(
          linkObj.Link_organization_request,
          linkObj.link_organization_request,
          linkObj.linkOrganizationRequest,
          (linkObj.link_organization && linkObj.link_organization.request),
          (linkObj.link_organization && linkObj.link_organization.status),
          (linkObj.link_org && linkObj.link_org.request),
        );
      }

      // also include generic keys
      candidates.push(linkObj.status, linkObj.Status, linkObj.request);

      for (const c of candidates) {
        if (typeof c === 'string' && /REJECT/i.test(c)) return true;
      }
      return false;
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
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelTargetId, setCancelTargetId] = useState(null);

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
          await orgApi.createResellRequest(payload);
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
        const resp = await orgApi.approveResellRequest(id);
        const updated = resp?.data;

        // Optimistically update the UI: mark reseller = true and status = APPROVED
        setResellRequests(prev => prev.map(r => {
          const rid = r.id || getLinkId(r);
          if (rid === id || (updated && (getLinkId(updated) === rid || updated.id === rid))) {
            return { ...r, ...(updated || {}), reseller: true, status: (updated && (updated.status || updated.Status)) || 'APPROVED' };
          }
          return r;
        }));

        // Persist `reseller: true` on the server if possible, then refresh
        try {
          if (typeof orgApi.updateResellRequest === 'function') {
            await orgApi.updateResellRequest(id, { reseller: true });
          } else {
            await api.patch(`/resell-requests/${id}/`, { reseller: true });
          }
        } catch (persistErr) {
          // Try a stronger fallback: some APIs reject PATCH but accept PUT with full payload
          console.warn('PATCH persist reseller=true failed, attempting PUT fallback', id, persistErr);
          try {
            // prefer using the updated object returned from approve endpoint
            const payload = updated && typeof updated === 'object' ? { ...updated, reseller: true } : { reseller: true };
            await api.put(`/resell-requests/${id}/`, payload);
            console.debug('PUT fallback succeeded for resell request', id);
          } catch (putErr) {
            console.warn('PUT fallback also failed for resell request', id, putErr);
          }
        }

        // Refresh from server to get authoritative state
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

    const handleCancelResell = async (id) => {
      if (!id) return;
      const key = `${id}`;
      setResellActionLoading(key);
      try {
        // prefer orgApi.deleteResellRequest if available
        if (typeof orgApi.deleteResellRequest === 'function') {
          await orgApi.deleteResellRequest(id);
        } else {
          await api.delete(`/resell-requests/${id}/`);
        }

        // remove from UI optimistically
        setResellRequests((prev) => prev.filter((r) => {
          const rid = r.id || getLinkId(r);
          return !(rid === id || String(rid) === String(id));
        }));

        // refresh authoritative list
        fetchResellRequests();
      } catch (e) {
        console.error('cancel resell error', e);
        setError(parseApiError(e));
      } finally {
        setResellActionLoading(null);
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
                  {/* Cancel Resell Confirmation Modal */}
                  <Modal show={showCancelModal} onHide={() => { if (resellActionLoading) return; setShowCancelModal(false); setCancelTargetId(null); }} centered>
                    <Modal.Header closeButton>
                      <Modal.Title>Cancel Resell Request</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <p className="mb-2">Are you sure you want to cancel this resell request? This action cannot be undone and other organizations will no longer see the request.</p>
                      <p className="small text-muted mb-0">If you need to re-open reselling later, you'll need to create a new request.</p>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={() => { if (resellActionLoading) return; setShowCancelModal(false); setCancelTargetId(null); }}>Close</Button>
                      <Button variant="danger" onClick={async () => {
                        if (!cancelTargetId) return;
                        try {
                          setResellActionLoading(`${cancelTargetId}`);
                          await handleCancelResell(cancelTargetId);
                        } finally {
                          setResellActionLoading(null);
                          setShowCancelModal(false);
                          setCancelTargetId(null);
                        }
                      }} disabled={resellActionLoading === `${cancelTargetId}`}>
                        {resellActionLoading === `${cancelTargetId}` ? <Spinner size="sm" animation="border" /> : 'Confirm Cancel'}
                      </Button>
                    </Modal.Footer>
                  </Modal>

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
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Resell Requests</h6>
                    <div>
                      <Button size="sm" onClick={() => fetchResellRequests()} className="me-2">Refresh</Button>
                    </div>
                  </div>
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

                                {/* Cancel button: both main and link organizations may cancel their resell requests */}
                                {(isLinkMember || isMainMember) && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline-secondary"
                                      onClick={() => { setCancelTargetId(id); setShowCancelModal(true); }}
                                      disabled={resellActionLoading === `${id}`}
                                    >
                                      {resellActionLoading === `${id}` ? <Spinner size="sm" animation="border" /> : 'Cancel'}
                                    </Button>
                                  </>
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
                  disabled={!(isAdmin || isSuperAdmin)}
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
                  disabled={resellPrefilled || !(isAdmin || isSuperAdmin)}
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
