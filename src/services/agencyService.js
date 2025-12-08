import api from "../utils/Api";

// Service helper for agency-related API calls
export const getAgencies = (params = {}) => {
  return api.get("/agencies/", { params }).then((res) => res.data);
};

export const getAgencyProfile = (agencyId) => {
  if (!agencyId) return Promise.reject(new Error("agencyId is required"));
  // Use the profile endpoint which returns aggregated profile details
  // Expected: GET /api/agency/profile?agency_id=<id>
  return api
    .get(`/agency/profile`, { params: { agency_id: agencyId } })
    .then((res) => res.data);
};

export const createAgency = (data) => {
  return api.post("/agencies/", data).then((res) => res.data);
};

export default {
  getAgencies,
  getAgencyProfile,
  createAgency,
};
