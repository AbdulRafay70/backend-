import { useState, useCallback } from 'react';
import api from '../utils/Api';

// Lightweight helper: try endpoint with organization, on 404 retry without org,
// then try same endpoint under /api/ prefix.
const performGetWithOrgFallback = async (ep, params = {}, config = {}) => {
  const paramsCopy = params ? { ...params } : {};
  try {
    return await api.get(ep, { params: paramsCopy, ...config });
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404 && paramsCopy && paramsCopy.organization) {
      const { organization, ...withoutOrg } = paramsCopy;
      try {
        return await api.get(ep, { params: withoutOrg, ...config });
      } catch (err2) {
        // fall-through to try /api prefix
      }
    }
    // try /api prefix as a last resort
    try {
      const apiEp = ep.startsWith('/api') ? ep : `/api${ep}`;
      return await api.get(apiEp, { params: paramsCopy, ...config });
    } catch (err3) {
      // if original error was different, rethrow it for visibility
      throw err;
    }
  }
};

export default function useHotelsFixed({ organizationId = null } = {}) {
  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const normalizeArrayPayload = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.results && Array.isArray(payload.results)) return payload.results;
    if (payload.data && Array.isArray(payload.data)) return payload.data;
    if (payload.items && Array.isArray(payload.items)) return payload.items;
    return [];
  };

  const fetchCities = useCallback(async () => {
    try {
      const params = organizationId ? { organization: organizationId } : {};
      const resp = await performGetWithOrgFallback('/cities/', params);
      const list = normalizeArrayPayload(resp.data);
      setCities(list.map(c => ({ id: c.id, name: c.name || c.title || c.city || '' })));
      return list;
    } catch (error) {
      setCities([]);
      throw error;
    }
  }, [organizationId]);

  const fetchCategories = useCallback(async () => {
    try {
      const params = organizationId ? { organization: organizationId } : {};
      const resp = await performGetWithOrgFallback('/hotel-categories/', params);
      const list = normalizeArrayPayload(resp.data);
      setCategories(list);
      return list;
    } catch (error) {
      setCategories([]);
      throw error;
    }
  }, [organizationId]);

  const normalizeHotelsPayload = (payload) => {
    const list = normalizeArrayPayload(payload);
    return list.map(h => {
      const copy = { ...h };
      if (copy.city && typeof copy.city === 'object') {
        copy.city_name = copy.city.name || copy.city.title || null;
        copy.city = copy.city.id ?? copy.city;
      }
      if (Array.isArray(copy.prices)) {
        copy.prices = copy.prices.map(p => ({ ...p, price: (p.price ?? p.selling_price ?? '') }));
      }
      return copy;
    });
  };

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const params = organizationId ? { organization: organizationId } : {};
      const resp = await performGetWithOrgFallback('/hotels/', params);
      const list = normalizeHotelsPayload(resp.data);
      setHotels(list);
      return list;
    } catch (error) {
      setHotels([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  return {
    hotels,
    cities,
    categories,
    loading,
    fetchHotels,
    fetchCities,
    fetchCategories,
  };
}
