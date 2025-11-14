import api from "./Api";

const organizationApi = {
  listLinks: () => api.get("/organization-links/"),

  createLink: (mainOrgId, linkOrgId) =>
    api.post("/organization-links/", {
      Main_organization_id: mainOrgId,
      Link_organization_id: linkOrgId,
    }),

  acceptLink: (linkId) => {
    console.log('acceptLink called with linkId:', linkId, typeof linkId);
    if (!linkId) {
      throw new Error('linkId is required for acceptLink');
    }
    const url = `/organization-links/${linkId}/accept_link/`;
    console.log('acceptLink constructed URL:', url);
    return api.post(url);
  },

  rejectLink: (linkId) => {
    console.log('rejectLink called with linkId:', linkId, typeof linkId);
    if (!linkId) {
      throw new Error('linkId is required for rejectLink');
    }
    const url = `/organization-links/${linkId}/reject/`;
    console.log('rejectLink constructed URL:', url);
    return api.post(url);
  },
  // Resell requests
  listResellRequests: () => api.get("/resell-requests/"),

  // `items` should be an array of objects like { type: 'package'|'ticket'|'hotel', id: 123 }
  // This function accepts either:
  // - a single `payload` object: createResellRequest(payload)
  // - or positional args: createResellRequest(mainOrgId, linkOrgId, itemType, reseller=false, items=[])
  createResellRequest: (...args) => {
    if (args.length === 1 && typeof args[0] === 'object') {
      console.debug('organizationApi.createResellRequest - posting payload object:', args[0]);
      return api.post('/resell-requests/', args[0]);
    }
    const [mainOrgId, linkOrgId, itemType, reseller = false, items = []] = args;
    const payload = {
      Main_organization_id: mainOrgId,
      Link_organization_id: linkOrgId,
      Item_type: itemType,
      reseller: reseller,
      Items: items,
    };
    console.debug('organizationApi.createResellRequest - posting positional payload:', payload);
    return api.post('/resell-requests/', payload);
  },

  approveResellRequest: (requestId) => api.post(`/resell-requests/${requestId}/approve/`),

  rejectResellRequest: (requestId) => api.post(`/resell-requests/${requestId}/reject/`),
};

export default organizationApi;