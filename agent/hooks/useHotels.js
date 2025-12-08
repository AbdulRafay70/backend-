import { useState, useEffect, useCallback } from "react";
import api from "../utils/Api";

// Hook to centralize hotels + cities fetching and normalization
export default function useHotels(opts = {}) {
  const { organizationId: orgOverride = null } = opts;

  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Resolve organization id from override or localStorage/env
  const resolveOrganizationId = () => {
    if (orgOverride) return orgOverride;
    const _orgRaw = localStorage.getItem("selectedOrganization") || localStorage.getItem("organization") || localStorage.getItem("selected_org");
    try {
      const parsed = _orgRaw ? JSON.parse(_orgRaw) : null;
      if (parsed && parsed.id) return parsed.id;
    } catch (e) {
      // ignore
    }
    const defaultOrgFromEnv = import.meta.env.VITE_DEFAULT_ORG_ID ? Number(import.meta.env.VITE_DEFAULT_ORG_ID) : null;
    return defaultOrgFromEnv || null;
  };

  const normalizeHotelsPayload = (payload) => {
    if (!payload) return [];
    let list = [];
    if (Array.isArray(payload)) list = payload;
    else if (payload.results && Array.isArray(payload.results)) list = payload.results;
    else if (payload.data && Array.isArray(payload.data)) list = payload.data;
    else if (payload.items && Array.isArray(payload.items)) list = payload.items;

    return list.map((h) => {
      const copy = { ...h };
      if (copy.city && typeof copy.city === "object") {
        try {
          copy.city_name = copy.city.name || copy.city.title || null;
        } catch (e) {
          copy.city_name = null;
        }
        copy.city = copy.city.id ?? copy.city;
      }
      const rawResell = (copy.reselling_allowed !== undefined && copy.reselling_allowed !== null)
        ? copy.reselling_allowed
        : (copy.is_sharing_allowed !== undefined ? copy.is_sharing_allowed : copy.is_sharing_allowed);
      copy.reselling_allowed = (rawResell === true || rawResell === 'true' || rawResell === 1 || rawResell === '1');

      if (copy.organization && typeof copy.organization === 'string' && copy.organization.match(/^\d+$/)) {
        copy.organization = Number(copy.organization);
      }
      if (copy.organization_id && typeof copy.organization_id === 'string' && copy.organization_id.match(/^\d+$/)) {
        copy.organization_id = Number(copy.organization_id);
      }
      if (copy.owner_organization_id && typeof copy.owner_organization_id === 'string' && copy.owner_organization_id.match(/^\d+$/)) {
        copy.owner_organization_id = Number(copy.owner_organization_id);
      }
      try {
        if (Array.isArray(copy.prices)) {
          copy.prices = copy.prices.map(p => ({ ...p, price: (p.price ?? p.selling_price ?? "") }));
        }
      } catch (e) {}
      return copy;
    });
  };

  // Helper to GET and retry without organization when endpoint returns 404.
  const performGetWithOrgFallback = async (ep, params = {}, config = {}) => {
    const paramsCopy = params ? { ...params } : {};
    const tryGet = async (endpoint, p) => api.get(endpoint, { params: p, ...config });

    try {
      return await tryGet(ep, paramsCopy);
    } catch (err) {
      const status = err?.response?.status;

      // If 404 and an organization param was used, retry without organization first
      if (status === 404 && paramsCopy && paramsCopy.organization) {
        const { organization, ...withoutOrg } = paramsCopy;
        try {
          // eslint-disable-next-line no-console
          console.info(`useHotels GET ${ep} returned 404 with organization=${organization}, retrying without organization`);
          return await tryGet(ep, withoutOrg);
        } catch (err2) {
          // fall through to try /api prefixed endpoints
        }
      }

      // If endpoint didn't start with /api, try with /api prefix as a last-resort
      if (!ep.startsWith('/api')) {
        const apiEp = `/api${ep.startsWith('/') ? ep : `/${ep}`}`;
        try {
          return await tryGet(apiEp, paramsCopy);
        } catch (err3) {
          const status3 = err3?.response?.status;
          // If 404 and organization param present, retry apiEp without org
          if (status3 === 404 && paramsCopy && paramsCopy.organization) {
            const { organization, ...withoutOrg } = paramsCopy;
            try {
              // eslint-disable-next-line no-console
              console.info(`useHotels GET ${apiEp} returned 404 with organization=${organization}, retrying without organization`);
              return await tryGet(apiEp, withoutOrg);
            } catch (err4) {
              throw err4;
            }
          }
          throw err3;
        }
      }

      throw err;
    }
  };

  const fetchCities = useCallback(async () => {
    try {
      // inline resolveOrganizationId to keep callback stable
      let organizationId = null;
      if (orgOverride) organizationId = orgOverride;
      else {
        const _orgRaw = localStorage.getItem("selectedOrganization") || localStorage.getItem("organization") || localStorage.getItem("selected_org");
        try {
          const parsed = _orgRaw ? JSON.parse(_orgRaw) : null;
          if (parsed && parsed.id) organizationId = parsed.id;
        } catch (e) {}
        const defaultOrgFromEnv = import.meta.env.VITE_DEFAULT_ORG_ID ? Number(import.meta.env.VITE_DEFAULT_ORG_ID) : null;
        if (!organizationId) organizationId = defaultOrgFromEnv || null;
      }

      const params = organizationId ? { organization: organizationId } : {};
      const resp = await performGetWithOrgFallback(`/cities/`, params);
      const payload = resp.data || {};
      let citiesArr = [];
      if (Array.isArray(payload)) citiesArr = payload;
      else if (payload.results && Array.isArray(payload.results)) citiesArr = payload.results;
      else if (payload.data && Array.isArray(payload.data)) citiesArr = payload.data;
      setCities(citiesArr.map(c => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error('useHotels: error fetching cities', error);
      setError(error);
    }
  }, [orgOverride]);

  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // inline resolveOrganizationId to keep callback stable
      let organizationId = null;
      if (orgOverride) organizationId = orgOverride;
      else {
        const _orgRaw = localStorage.getItem("selectedOrganization") || localStorage.getItem("organization") || localStorage.getItem("selected_org");
        try {
          const parsed = _orgRaw ? JSON.parse(_orgRaw) : null;
          if (parsed && parsed.id) organizationId = parsed.id;
        } catch (e) {}
        const defaultOrgFromEnv = import.meta.env.VITE_DEFAULT_ORG_ID ? Number(import.meta.env.VITE_DEFAULT_ORG_ID) : null;
        if (!organizationId) organizationId = defaultOrgFromEnv || null;
      }
      const params = organizationId ? { organization: organizationId } : {};
      const resp = await performGetWithOrgFallback(`/hotels/`, params);

      const hotelsList = normalizeHotelsPayload(resp.data);
      setHotels(Array.isArray(hotelsList) ? hotelsList : []);

      // Ensure cities referenced by hotels are present
      try {
        const existingCityIds = new Set((Array.isArray(cities) ? cities : []).map(c => Number(c.id)));
        const hotelCityIds = new Set();
        hotelsList.forEach(h => {
          const cid = h.city ? Number(h.city) : null;
          if (cid) hotelCityIds.add(cid);
        });
        const missingIds = Array.from(hotelCityIds).filter(id => !existingCityIds.has(id));
        if (missingIds.length > 0) {
          try {
            const allCitiesResp = await api.get(`/cities/`);
            const allPayload = allCitiesResp.data || {};
            let allCities = [];
            if (Array.isArray(allPayload)) allCities = allPayload;
            else if (allPayload.results && Array.isArray(allPayload.results)) allCities = allPayload.results;
            else if (allPayload.data && Array.isArray(allPayload.data)) allCities = allPayload.data;
            const found = allCities.filter(c => missingIds.includes(Number(c.id))).map(c => ({ id: c.id, name: c.name }));
            if (found.length > 0) {
              setCities(prev => {
                const prevArr = Array.isArray(prev) ? prev : [];
                const merged = [...prevArr];
                found.forEach(m => { if (!merged.find(x => Number(x.id) === Number(m.id))) merged.push(m); });
                return merged;
              });
            }
          } catch (e) {
            // fallback: use city_name from payload
            const fallback = [];
            hotelsList.forEach(h => {
              const cid = h.city ? Number(h.city) : null;
              const cname = h.city_name || (h.city && h.city.name) || null;
              if (cid && cname && !fallback.find(x => x.id === cid)) fallback.push({ id: cid, name: cname });
            });
            if (fallback.length > 0) {
              setCities(prev => {
                const prevArr = Array.isArray(prev) ? prev : [];
                const merged = [...prevArr];
                fallback.forEach(m => { if (!merged.find(x => Number(x.id) === Number(m.id))) merged.push(m); });
                return merged;
              });
            }
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('useHotels: error fetching hotels', error);
      setError(error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    fetchCities();
    fetchHotels();
  }, [orgOverride]);

  return {
    hotels,
    cities,
    loading,
    error,
    fetchHotels,
    fetchCities,
    setHotels,
    setCities
  };
}
