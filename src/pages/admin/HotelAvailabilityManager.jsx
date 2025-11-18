import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Spinner, Modal, Table, Tabs, Tab } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import HotelsTabs from "../../components/HotelsTabs";
import RoomMapManager from "../../components/RoomMapManager";
import { 
  Hotel, Building, MapPin, Calendar, Users, DollarSign, 
  Plus, Edit2, Trash2, Eye, Search, Filter, CheckCircle, 
  XCircle, AlertCircle, Phone, Mail, Clock, BedDouble,
  Save, X
} from "lucide-react";
import api from "../../utils/Api";
import { jwtDecode } from 'jwt-decode';

const HotelAvailabilityManager = () => {
  // State management
  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteBlockedModal, setShowDeleteBlockedModal] = useState(false);
  const [showResellerPopup, setShowResellerPopup] = useState(false);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState("");
  const [deleteBlockedDependents, setDeleteBlockedDependents] = useState([]);
  const [deleteBlockedLoading, setDeleteBlockedLoading] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  
  // Selected items
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hotelAvailability, setHotelAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  // Form states
  const [hotelForm, setHotelForm] = useState({
    city: "",
    name: "",
    address: "",
    google_location: "",
    contact_number: "",
    category: "ECO",
    distance: "",
    walking_time: "",
    is_active: true,
    available_start_date: "",
    available_end_date: ""
  });
  
  const [roomForm, setRoomForm] = useState({
    room_type: "double",
    capacity: 2,
    price_per_night: "",
    available_rooms: 1,
    start_date: "",
    end_date: ""
  });

  // Additional hotel creation fields (to match backend serializer)
  const [contactDetails, setContactDetails] = useState([
    { contact_person: "", contact_number: "" }
  ]);
  const [priceSections, setPriceSections] = useState([
    { start_date: "", end_date: "", room_type: "double", price: "", purchase_price: "", bed_prices: [] }
  ]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [resellingAllowed, setResellingAllowed] = useState(false);
  const [hotelStatus, setHotelStatus] = useState("active");

  // Be tolerant when reading organization info from localStorage. Support a few possible keys
  const _orgRaw = localStorage.getItem("selectedOrganization") || localStorage.getItem("organization") || localStorage.getItem("selected_org");
  let parsedOrg = null;
  try {
    parsedOrg = _orgRaw ? JSON.parse(_orgRaw) : null;
  } catch (e) {
    parsedOrg = null;
  }
  const defaultOrgFromEnv = import.meta.env.VITE_DEFAULT_ORG_ID ? Number(import.meta.env.VITE_DEFAULT_ORG_ID) : null;
  const organizationId = parsedOrg?.id ?? defaultOrgFromEnv ?? null;

  // Map human-friendly floor labels to backend choice values
  const mapFloorLabelToValue = (floorLabel) => {
    if (!floorLabel && floorLabel !== 0) return '';
    const s = String(floorLabel).trim();
    if (!s) return '';
    // common labels used in UI: "Ground Floor", "1st Floor", "2nd Floor", etc.
    if (/ground/i.test(s) || /g\b/i.test(s)) return 'ground';
    // Try to extract a plain number from labels like '1st Floor', '2', '1', '1st'
    const numMatch = s.match(/(\d+)/);
    if (numMatch) return String(Number(numMatch[1]));
    // fallback: if label looks like 'Basement' or 'B1'
    if (/basement/i.test(s) || /b\d+/i.test(s)) return 'basement';
    // otherwise return as-is (server may accept certain human labels)
    return s;
  };

  // Parse user-entered distance into kilometers (accepts values like "500m", "0.5", "2 km")
  const parseDistanceToKm = (input) => {
    if (input === undefined || input === null) return "";
    const s = String(input).trim().toLowerCase();
    if (!s) return "";
    // meters like '500m' or '500 m'
    const mMatch = s.match(/^(\d+(?:\.\d+)?)\s*m(?:eters?)?$/);
    if (mMatch) {
      const meters = parseFloat(mMatch[1]);
      if (Number.isFinite(meters)) return String((meters / 1000).toFixed(3)).replace(/\.0+$/, "");
      return "";
    }
    // km like '2km' or '2 km'
    const kmMatch = s.match(/^(\d+(?:\.\d+)?)\s*k(?:m)?/);
    if (kmMatch) {
      const km = parseFloat(kmMatch[1]);
      if (Number.isFinite(km)) return String(km);
      return "";
    }
    // plain number assume km
    const num = parseFloat(s.replace(/[^0-9.\-]/g, ''));
    if (Number.isFinite(num)) return String(num);
    return "";
  };

  // Room types configuration
  const roomTypes = [
    { value: "double", label: "Double Bed", capacity: 2, icon: "🛏️" },
    { value: "triple", label: "Triple Bed", capacity: 3, icon: "🛏️🛏️" },
    { value: "quad", label: "Quad Bed", capacity: 4, icon: "🛏️🛏️" },
    { value: "quint", label: "Quint Bed", capacity: 5, icon: "🛏️🛏️🛏️" }
  ];

  const roomStatuses = ["available", "occupied", "maintenance", "reserved"];

  // Add Hotel modal tab state and rooms builder state
  const [addHotelTab, setAddHotelTab] = useState("hotel");
  const [rooms, setRooms] = useState([]);
  const [initialRoomIds, setInitialRoomIds] = useState([]);

  const addRoom = () => {
    // Choose a default room_type that is not already used in other rooms when possible
    const used = new Set(rooms.map(r => r.room_type));
    const defaultRoomType = (roomTypes.find(rt => !used.has(rt.value)) || roomTypes[0]).value;
    setRooms([...rooms, { floor: "", room_no: "", room_type: defaultRoomType, capacity: (roomTypes.find(rt => rt.value === defaultRoomType)?.capacity || 2), status: "available", details: [] }]);
  };

  const removeRoom = (index) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const addBedToRoom = (roomIndex) => {
    const copy = [...rooms];
    copy[roomIndex].details = [...(copy[roomIndex].details || []), { bed_no: "", is_assigned: false }];
    setRooms(copy);
  };

  const removeBedFromRoom = (roomIndex, bedIndex) => {
    const copy = [...rooms];
    copy[roomIndex].details = copy[roomIndex].details.filter((_, i) => i !== bedIndex);
    setRooms(copy);
  };

  // Hotel categories
  const categories = [
    { value: "ECO", label: "Economy", color: "#6c757d" },
    { value: "STD", label: "Standard", color: "#0dcaf0" },
    { value: "DLX", label: "Deluxe", color: "#0d6efd" },
    { value: "PRM", label: "Premium", color: "#198754" },
    { value: "LUX", label: "Luxury", color: "#ffc107" }
  ];
  // Map frontend category tokens/labels to backend-accepted choice keys
  const categoryMapping = {
    ECO: "economy",
    STD: "standard",
    DLX: "deluxe",
    PRM: "luxury",
    LUX: "luxury",
    // human readable mappings (in case server returns these or older UI uses them)
    Economy: "economy",
    Standard: "standard",
    Deluxe: "deluxe",
    Luxury: "luxury",
    "1 Star": "2_star",
    "2 Star": "2_star",
    "3 Star": "3_star",
    "4 Star": "4_star",
    "5 Star": "5_star",
  };

  // Fetch cities (use shared api helper and tolerate multiple response shapes)
  const fetchCities = async () => {
    try {
      let resp;
      if (organizationId) resp = await api.get(`/cities/`, { params: { organization: organizationId } });
      else resp = await api.get(`/cities/`);
      const payload = resp.data || {};
      let citiesArr = [];
      if (Array.isArray(payload)) citiesArr = payload;
      else if (payload.results && Array.isArray(payload.results)) citiesArr = payload.results;
      else if (payload.data && Array.isArray(payload.data)) citiesArr = payload.data;

      setCities(citiesArr.map(c => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  // Demo hotels data
  const demoHotels = [
    {
      id: 1,
      name: "Grand Makkah Hotel",
      city: { id: 1, name: "Makkah" },
      address: "Ajyad Street, Makkah",
      google_location: "https://goo.gl/maps/grand-makkah",
      contact_number: "+966-12-123-4567",
      category: "LUX",
      distance: "0.5",
      walking_time: 6,
      is_active: true,
      available_start_date: "2025-01-01",
      available_end_date: "2025-12-31",
      rooms: 45,
      available_rooms: 28
    },
    {
      id: 2,
      name: "Medina Sunrise Resort",
      city: { id: 2, name: "Medina" },
      address: "Prince Road, Medina",
      google_location: "https://goo.gl/maps/medina-sunrise",
      contact_number: "+966-14-987-6543",
      category: "PRM",
      distance: "2.0",
      walking_time: 25,
      is_active: true,
      available_start_date: "2025-01-01",
      available_end_date: "2025-12-31",
      rooms: 60,
      available_rooms: 42
    },
    {
      id: 3,
      name: "Jeddah Beach Hotel",
      city: { id: 3, name: "Jeddah" },
      address: "Corniche Road, Jeddah",
      google_location: "https://goo.gl/maps/jeddah-beach",
      contact_number: "+966-12-456-7890",
      category: "DLX",
      distance: "5.0",
      walking_time: 60,
      is_active: true,
      available_start_date: "2025-01-01",
      available_end_date: "2025-12-31",
      rooms: 80,
      available_rooms: 55
    },
    {
      id: 4,
      name: "Holy City Inn",
      city: { id: 1, name: "Makkah" },
      address: "Safa Street, Makkah",
      google_location: "https://goo.gl/maps/holy-city",
      contact_number: "+966-12-555-8888",
      category: "STD",
      distance: "1.0",
      walking_time: 12,
      is_active: true,
      available_start_date: "2025-01-01",
      available_end_date: "2025-12-31",
      rooms: 50,
      available_rooms: 35
    },
    {
      id: 5,
      name: "Prophet's Peace Hotel",
      city: { id: 2, name: "Medina" },
      address: "Al-Noor Street, Medina",
      google_location: "https://goo.gl/maps/prophets-peace",
      contact_number: "+966-14-222-3333",
      category: "ECO",
      distance: "3.5",
      walking_time: 40,
      is_active: true,
      available_start_date: "2025-01-01",
      available_end_date: "2025-12-31",
      rooms: 35,
      available_rooms: 20
    }
  ];

  // Normalize hotels payload to an array of hotel objects and ensure city is an ID when possible
  const normalizeHotelsPayload = (payload) => {
    if (!payload) return [];
    let list = [];
    if (Array.isArray(payload)) list = payload;
    else if (payload.results && Array.isArray(payload.results)) list = payload.results;
    else if (payload.data && Array.isArray(payload.data)) list = payload.data;
    else if (payload.items && Array.isArray(payload.items)) list = payload.items;

    // convert city objects to IDs for consistency with other pages
    // and preserve the original city name (if provided) so the UI can
    // display city names even when the global `cities` list is
    // scoped to a different organization.
    return list.map(h => {
      const copy = { ...h };
      if (copy.city && typeof copy.city === 'object') {
        // keep numeric id for `city` but also store `city_name` for display
        try {
          copy.city_name = copy.city.name || copy.city.title || null;
        } catch (e) {
          copy.city_name = null;
        }
        copy.city = copy.city.id ?? copy.city;
      }
      // Normalize various truthy/falsey shapes to strict boolean for reselling_allowed.
      // Also accept legacy `is_sharing_allowed` field if present.
      const rawResell = (copy.reselling_allowed !== undefined && copy.reselling_allowed !== null)
        ? copy.reselling_allowed
        : (copy.is_sharing_allowed !== undefined ? copy.is_sharing_allowed : copy.is_sharing_allowed);
      copy.reselling_allowed = (rawResell === true || rawResell === 'true' || rawResell === 1 || rawResell === '1');

      // Ensure numeric organization ids remain numeric (server sometimes returns strings)
      if (copy.organization && typeof copy.organization === 'string' && copy.organization.match(/^\d+$/)) {
        copy.organization = Number(copy.organization);
      }
      if (copy.organization_id && typeof copy.organization_id === 'string' && copy.organization_id.match(/^\d+$/)) {
        copy.organization_id = Number(copy.organization_id);
      }
      if (copy.owner_organization_id && typeof copy.owner_organization_id === 'string' && copy.owner_organization_id.match(/^\d+$/)) {
        copy.owner_organization_id = Number(copy.owner_organization_id);
      }
      return copy;
    });
  };

  // Fetch hotels
  const fetchHotels = async () => {
    try {
      setLoading(true);
      let resp;
      if (organizationId) resp = await api.get(`/hotels/`, { params: { organization: organizationId } });
      else resp = await api.get(`/hotels/`);

      const hotelsList = normalizeHotelsPayload(resp.data);

      if (hotelsList.length > 0) {
        setHotels(hotelsList);
      } else {
        // If an organizationId is present we should respect the server's empty
        // response (no hotels for this org). Only use demoHotels when there is
        // no organization context (public/demo view).
        if (organizationId) {
          setHotels([]);
        } else {
          setHotels(demoHotels);
        }
      }

      // Ensure cities list contains entries referenced by hotels. Linked/org-scoped
      // `cities` may not include cities owned by other organizations. Strategy:
      // 1) Collect hotel city IDs referenced by hotels.
      // 2) If any are missing from current `cities` state, try to fetch the
      //    global `/cities/` (no organization param) to resolve names and merge.
      try {
        const existingCityIds = new Set((Array.isArray(cities) ? cities : []).map(c => Number(c.id)));
        const hotelCityIds = new Set();
        hotelsList.forEach(h => {
          const cid = h.city ? Number(h.city) : null;
          if (cid) hotelCityIds.add(cid);
        });

        const missingIds = Array.from(hotelCityIds).filter(id => !existingCityIds.has(id));
        if (missingIds.length > 0) {
          // Try to fetch global cities list (unscoped) and map missing ids to names
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
                found.forEach(m => {
                  if (!merged.find(x => Number(x.id) === Number(m.id))) merged.push(m);
                });
                return merged;
              });
            }
          } catch (e) {
            // Fallback: if hotel payload contained a `city_name` property, use it
            const fallback = [];
            hotelsList.forEach(h => {
              const cid = h.city ? Number(h.city) : null;
              const cname = h.city_name || (h.city && h.city.name) || null;
              if (cid && cname && !existingCityIds.has(cid) && !fallback.find(x => x.id === cid)) {
                fallback.push({ id: cid, name: cname });
              }
            });
            if (fallback.length > 0) {
              setCities(prev => {
                const prevArr = Array.isArray(prev) ? prev : [];
                const merged = [...prevArr];
                fallback.forEach(m => {
                  if (!merged.find(x => Number(x.id) === Number(m.id))) merged.push(m);
                });
                return merged;
              });
            }
          }
        }
      } catch (e) {}

      // If no organizationId was set but hotels returned and include an organization, adopt it
      if (!organizationId && Array.isArray(hotelsList) && hotelsList.length > 0 && hotelsList[0].organization) {
        const inferredOrg = hotelsList[0].organization;
        try {
          localStorage.setItem('selectedOrganization', JSON.stringify({ id: inferredOrg, name: `Org ${inferredOrg}` }));
        } catch (e) {}
      }
    } catch (error) {
      // Surface detailed error info to help backend debugging
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.error("Error fetching hotels:", { status, data, error });

      if (status === 403) {
        showAlert("error", "Permission denied when fetching hotels. Please ensure 'organization' is provided or your user belongs to an organization.");
        setHotels([]);
      } else if (status === 401) {
        showAlert("error", "Unauthorized. Please login again.");
        setHotels([]);
      } else if (status === 500) {
        // 500 indicates a server-side exception — include server message when available
        const msg = (data && (data.detail || JSON.stringify(data))) || "Server error while fetching hotels";
        showAlert("error", `Server error: ${msg}`);
        setHotels([]);
      } else {
        // default fallback: show a friendly warning with optional server message
        const msg = (data && (data.detail || JSON.stringify(data))) || "Using demo hotels for preview";
        showAlert("warning", msg);
        setHotels(demoHotels);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Re-fetch cities and hotels when organization context changes
    fetchCities();
    fetchHotels();
  }, [organizationId]);

  // Show alert helper
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  // Handle add hotel
  const handleAddHotel = async () => {
    try {
      // Normalize payload: ensure city is an integer
      const normalizedCity = hotelForm.city ? Number(hotelForm.city) : null;

      // Determine organization to include. Prefer parsed organization from localStorage or env.
      // If not available, try to infer from cached adminOrganizationData or from the organizations list.
      let orgToUse = organizationId;
      if (!orgToUse) {
        try {
          const adminDataRaw = localStorage.getItem('adminOrganizationData') || localStorage.getItem('selectedOrganization') || localStorage.getItem('organization');
          if (adminDataRaw) {
            const parsedAdmin = JSON.parse(adminDataRaw);
            orgToUse = parsedAdmin?.id ?? parsedAdmin?.ids?.[0] ?? null;
          }
        } catch (e) {
          // ignore parse errors
          orgToUse = orgToUse;
        }
      }

      // If still not found, try fetching organizations endpoint and pick the first valid org id.
      if (!orgToUse) {
        try {
          const orgsResp = await api.get(`/organizations/`);
          const orgs = orgsResp?.data || [];
          if (Array.isArray(orgs) && orgs.length > 0) {
            const first = orgs[0];
            orgToUse = first?.id || first?.pk || null;
          }
        } catch (e) {
          // Ignore failure to fetch orgs; we'll proceed without organization and let server validate.
        }
      }

      // ensure category is translated to backend choice key
      const mappedCategory = categoryMapping[hotelForm.category] || hotelForm.category || "standard";

      // Normalize distance and walking time: convert user input to kilometers and minutes
      const distanceKm = parseDistanceToKm(hotelForm.distance);
      const walkingMinutes = hotelForm.walking_time !== undefined && hotelForm.walking_time !== null && hotelForm.walking_time !== "" ? Number(hotelForm.walking_time) : null;

      // Ensure at least one price section exists (backend requires Prices)
      if (!priceSections || priceSections.length === 0) {
        showAlert("error", "Please add at least one price section before creating a hotel.");
        return;
      }

      // Ensure at least one price value exists across sections (either base price or bed-specific prices)
      const hasAnyPrice = priceSections.some(p => {
        const basePricePresent = (p.price !== undefined && p.price !== "") || (p.purchase_price !== undefined && p.purchase_price !== "");
        const bedPricesPresent = Array.isArray(p.bed_prices) && p.bed_prices.some(bp => bp.price !== undefined && bp.price !== "");
        return basePricePresent || bedPricesPresent;
      });
      if (!hasAnyPrice) {
        showAlert("error", "Please provide at least one price (base or bed-specific) in the price sections.");
        return;
      }

      const plainPayload = {
        ...hotelForm,
        distance: distanceKm,
        walking_time: walkingMinutes,
        city: normalizedCity,
        category: mappedCategory,
        // include contact details and prices as expected by serializer
        prices: priceSections.reduce((acc, p) => {
          const sectionStart = p.start_date || null;
          const sectionEnd = p.end_date || null;
          // base room price for this section (if provided)
          const basePriceNum = parseFloat(p.price) || 0;
          const basePurchaseNum = parseFloat(p.purchase_price) || 0;
          if ((p.price !== undefined && p.price !== "") || (p.purchase_price !== undefined && p.purchase_price !== "")) {
            acc.push({
              start_date: sectionStart,
              end_date: sectionEnd,
              room_type: p.room_type,
              price: basePriceNum,
              purchase_price: basePurchaseNum,
              profit: Number((basePriceNum - basePurchaseNum).toFixed(2)),
            });
          }

          // include any bed-specific prices defined in this section
          if (Array.isArray(p.bed_prices)) {
            p.bed_prices.forEach(bp => {
              const bpPrice = parseFloat(bp.price) || 0;
              const bpPurchase = parseFloat(bp.purchase_price) || 0;
              acc.push({
                start_date: sectionStart,
                end_date: sectionEnd,
                room_type: bp.type || p.room_type,
                price: bpPrice,
                purchase_price: bpPurchase,
                profit: Number((bpPrice - bpPurchase).toFixed(2)),
              });
            });
          }

          return acc;
        }, []),
        contact_details: contactDetails.map(c => ({ contact_person: c.contact_person, contact_number: c.contact_number })),
        photos: photoFiles && photoFiles.length > 0 ? photoFiles.map(f => f.name) : [],
        reselling_allowed: !!resellingAllowed,
        status: hotelStatus,
        // only include organization when we have a valid value
        ...(orgToUse ? { organization: orgToUse } : {})
      };

      // Debug: ensure prices prepared correctly before sending
      // eslint-disable-next-line no-console
      console.debug('Prepared prices for hotel payload:', { priceSections, prices: plainPayload.prices });
      if (!plainPayload.prices || plainPayload.prices.length === 0) {
        showAlert("error", "Please add at least one price entry before saving the hotel.");
        // eslint-disable-next-line no-console
        console.warn('Blocked add-hotel: no prices present', { priceSections });
        return;
      }

      // If any files are attached, send as multipart/form-data so video is uploaded; include photo filenames as captions
      let res;
      if ((photoFiles && photoFiles.length > 0) || videoFile) {
        const form = new FormData();
        // Append simple fields
        Object.entries(plainPayload).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          // prices, contact_details and photos should be sent as JSON strings
          if (k === 'prices' || k === 'contact_details' || k === 'photos') {
            form.append(k, JSON.stringify(v));
          } else {
            form.append(k, typeof v === 'boolean' ? String(v) : v);
          }
        });

        // Append photo files (if any) under 'photo_files' so backend can be extended later to handle them
        if (photoFiles && photoFiles.length > 0) {
          photoFiles.forEach((f) => form.append('photo_files', f));
        }

        // Append video file under 'video' (backend model has a 'video' FileField)
        if (videoFile) {
          form.append('video', videoFile);
        }

        // Helpful debug
        // eslint-disable-next-line no-console
        console.debug('Posting hotel as FormData (files present)', { meta: plainPayload, photoFiles, videoFile });

        res = await api.post(`/hotels/`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        // No files: send JSON
        // Helpful debug
        // eslint-disable-next-line no-console
        console.debug("Adding hotel with payload:", plainPayload);
        res = await api.post(`/hotels/`, plainPayload);
      }
      const created = res?.data || null;

      // If rooms were added in the modal, create them after hotel creation
      let roomCreateErrors = [];
      if (created && created.id && rooms && rooms.length > 0) {
        for (let i = 0; i < rooms.length; i++) {
          const r = rooms[i];
          const roomPayload = {
            hotel: created.id,
            floor: mapFloorLabelToValue(r.floor || ""),
            room_type: r.room_type || "",
            room_number: r.room_no || r.room_number || "",
            total_beds: (r.details && r.details.length) || 0,
            details: (r.details || []).map(d => ({ bed_number: d.bed_no || d.bed_number || "", is_assigned: !!d.is_assigned }))
          };
          try {
            // eslint-disable-next-line no-console
            console.debug('Creating room', roomPayload);
            await api.post(`/hotel-rooms/`, roomPayload);
          } catch (e) {
            // Collect error info and continue creating other rooms
            const err = e?.response?.data || e?.message || e;
            roomCreateErrors.push({ index: i, room: roomPayload, error: err });
            // eslint-disable-next-line no-console
            console.error('Failed to create room', roomPayload, err);
          }
        }
      }

      showAlert("success", "Hotel added successfully!");
      if (roomCreateErrors.length > 0) {
        showAlert("warning", `${roomCreateErrors.length} room(s) failed to create. Check console for details.`);
      }

      setShowAddModal(false);
      resetHotelForm();

      // Refresh hotels list and insert created hotel into state for immediate availability view
      try {
        await fetchHotels();
        if (created && created.id) {
          // try to open the availability modal for the newly created hotel
          const createdHotel = {
            ...created,
            // ensure city is an ID (server may return city object)
            city: created.city && typeof created.city === 'object' ? (created.city.id || created.city) : created.city
          };
          setSelectedHotel(createdHotel);
          setShowAvailabilityModal(true);
          fetchHotelAvailability(createdHotel.id);
        }
      } catch (e) {
        // silent - we already created the hotel, list will refresh next time
      }
    } catch (error) {
      // try to surface a helpful message from server response
  // eslint-disable-next-line no-console
  console.error("Add hotel error:", JSON.stringify(error?.response?.data || error?.response || error));
  const serverMessage = error?.response?.data?.detail || error?.response?.data || null;
      if (serverMessage) {
        showAlert("error", `Failed to add hotel: ${JSON.stringify(serverMessage)}`);
      } else {
        showAlert("error", "Failed to add hotel. Check console/network for details.");
      }
    }
  };

  // Handle edit hotel
  const handleEditHotel = async () => {
    // Prevent unauthorized organizations from modifying hotel rates
    try {
      const hotelOrgRaw = selectedHotel?.organization;
      const hotelOrg = hotelOrgRaw && typeof hotelOrgRaw === 'object' ? (hotelOrgRaw.id ?? hotelOrgRaw) : hotelOrgRaw;

      // Also validate that the current JWT belongs to the hotel's organization (server enforces permissions based on token)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      let tokenOrgs = [];
      try {
        if (token) {
          const decoded = jwtDecode(token);
          // collect common claim names that may contain organization ids
          const possibleKeys = ['organization', 'org', 'org_id', 'organization_id', 'organizations', 'orgs', 'organization_ids', 'org_ids', 'orgs_ids', 'user_organizations'];
          possibleKeys.forEach((k) => {
            const v = decoded[k];
            if (v === undefined || v === null) return;
            if (Array.isArray(v)) tokenOrgs = tokenOrgs.concat(v.map(x => Number(x)));
            else if (typeof v === 'number') tokenOrgs.push(Number(v));
            else if (typeof v === 'string' && v.match(/^\d+$/)) tokenOrgs.push(Number(v));
          });
          // also scan top-level values for numeric ids
          Object.values(decoded).forEach((val) => {
            if (typeof val === 'number') tokenOrgs.push(Number(val));
            if (typeof val === 'string' && val.match(/^\d+$/)) tokenOrgs.push(Number(val));
          });
          // dedupe
          tokenOrgs = Array.from(new Set(tokenOrgs.filter(n => !Number.isNaN(n))));
        }
      } catch (e) {
        // ignore decode errors
        tokenOrgs = [];
      }

      const tokenHasHotelOrg = tokenOrgs.length > 0 && hotelOrg && tokenOrgs.includes(Number(hotelOrg));
      // Consider the user the owner if either:
      // - the selectedOrganization (localStorage) matches the hotel's org, OR
      // - the JWT token contains the hotel's org id
      const isOwner = organizationId && hotelOrg && (String(hotelOrg) === String(organizationId) || tokenHasHotelOrg);

      // Only owners may edit hotel details; linked orgs (resellers) cannot.
      const canEdit = isOwner;

      // Prepare prices payload; include base prices and any bed-specific prices so edits persist all entries
      const pricesPayload = (priceSections || []).flatMap(p => {
        const sectionStart = p.start_date || null;
        const sectionEnd = p.end_date || null;
        const entries = [];

        // Base section price (if provided)
        entries.push({
          id: p.id || undefined,
          start_date: sectionStart,
          end_date: sectionEnd,
          room_type: p.room_type,
          price: parseFloat(p.price) || 0,
          purchase_price: parseFloat(p.purchase_price) || 0,
          profit: Number(((parseFloat(p.price) || 0) - (parseFloat(p.purchase_price) || 0)).toFixed(2)),
        });

        // Any bed-specific prices defined for this section
        if (Array.isArray(p.bed_prices)) {
          p.bed_prices.forEach(bp => {
            entries.push({
              id: bp.id || undefined,
              start_date: sectionStart,
              end_date: sectionEnd,
              room_type: bp.type || p.room_type,
              price: parseFloat(bp.price) || 0,
              purchase_price: parseFloat(bp.purchase_price) || 0,
              profit: Number(((parseFloat(bp.price) || 0) - (parseFloat(bp.purchase_price) || 0)).toFixed(2)),
            });
          });
        }

        return entries;
      });

      if (!canEdit) {
        // Block updates when not owner
        showAlert("error", "You are not the owning organization and cannot update this hotel.");
        // eslint-disable-next-line no-console
        console.warn('Blocked hotel update attempt by non-owner', { organizationId, hotelOrg, hotelId: selectedHotel?.id });
        return;
      }

      // Update hotel fields (owner only)
        // Normalize distance and walking time for update payload
        const distanceKm = parseDistanceToKm(hotelForm.distance);
        const walkingMinutes = hotelForm.walking_time !== undefined && hotelForm.walking_time !== null && hotelForm.walking_time !== "" ? Number(hotelForm.walking_time) : null;

      const updatePayload = {
        ...hotelForm,
        distance: distanceKm,
        walking_time: walkingMinutes,
        reselling_allowed: !!resellingAllowed,
        ...(isOwner ? { prices: pricesPayload } : {}),
      };

        // Debug: log payload about to be sent (helps diagnose server 403/400)
        // eslint-disable-next-line no-console
        console.debug('Updating hotel with payload:', { hotelId: selectedHotel?.id, updatePayload, isOwner, tokenOrgs });

        // Include organization param for server routing/permission checks
        await api.put(`/hotels/${selectedHotel.id}/`, updatePayload, { params: { organization: organizationId } });

      // Sync rooms: update existing, create new, delete removed
      const currentRoomIds = (rooms || []).filter(r => r.id).map(r => r.id);
      const toDelete = (initialRoomIds || []).filter(id => !currentRoomIds.includes(id));
      const roomErrors = [];

      // Delete removed rooms
      for (const id of toDelete) {
        try {
          await api.delete(`/hotel-rooms/${id}/`);
        } catch (e) {
          roomErrors.push({ action: 'delete', id, error: e?.response?.data || e?.message || e });
        }
      }

      // Update or create current rooms
      for (let i = 0; i < (rooms || []).length; i++) {
        const r = rooms[i];
        const payload = {
          hotel: selectedHotel.id,
          floor: mapFloorLabelToValue(r.floor || ""),
          room_type: r.room_type || "",
          room_number: r.room_no || r.room_number || "",
          total_beds: (r.details && r.details.length) || 0,
          details: (r.details || []).map(d => ({ bed_number: d.bed_no || d.bed_number || "", is_assigned: !!d.is_assigned }))
        };
        try {
          if (r.id) {
            await api.put(`/hotel-rooms/${r.id}/`, payload);
          } else {
            await api.post(`/hotel-rooms/`, payload);
          }
        } catch (e) {
          roomErrors.push({ index: i, room: r, error: e?.response?.data || e?.message || e });
        }
      }

      showAlert("success", "Hotel updated successfully!");
      if (roomErrors.length > 0) {
        showAlert("warning", `${roomErrors.length} room operation(s) failed. Check console for details.`);
        // eslint-disable-next-line no-console
        console.error('Room sync errors:', roomErrors);
      }

      setShowEditModal(false);
      fetchHotels();
    } catch (error) {
      // Surface server-provided message when available
      const serverData = error?.response?.data;
      const serverMsg = serverData?.detail || serverData || error?.message || "Failed to update hotel";
      showAlert("error", `Failed to update hotel: ${JSON.stringify(serverMsg)}`);
      // eslint-disable-next-line no-console
      console.error('Edit hotel error:', serverData || error);
    }
  };

  // Handle delete hotel
  const handleDeleteHotel = async () => {
    try {
      await api.delete(`/hotels/${selectedHotel.id}/`);
      
      showAlert("success", "Hotel deleted successfully!");
      setShowDeleteModal(false);
      fetchHotels();
    } catch (error) {
      // If backend returns 409 Conflict for protected dependencies, show a helpful modal
      const status = error?.response?.status;
      const data = error?.response?.data;
      const serverMsg = data?.detail || data || error?.message || "Failed to delete hotel";

      // Detect ProtectedError / FK constraint situations: prefer 409, but also tolerate 500 with ProtectedError text
      const looksLikeProtected = status === 409 || (status === 500 && JSON.stringify(serverMsg).toLowerCase().includes('protected')) || (JSON.stringify(serverMsg).toLowerCase().includes('hotelrooms') || JSON.stringify(serverMsg).toLowerCase().includes('cannot delete'));
      if (looksLikeProtected) {
        setDeleteBlockedMessage("");
        setDeleteBlockedDependents([]);
        setShowDeleteModal(false);
        setShowDeleteBlockedModal(true);
        // Try to fetch dependent records (rooms, bookings) to show actionable info
        setDeleteBlockedLoading(true);
        try {
          // Fetch hotel rooms referencing this hotel
          const roomsResp = await api.get(`/hotel-rooms/`, { params: { hotel: selectedHotel.id } });
          let roomsList = roomsResp?.data || [];
          if (!Array.isArray(roomsList)) roomsList = roomsList.results || roomsList.data || [];
          setDeleteBlockedDependents(roomsList.map(r => ({ type: 'room', id: r.id, room_number: r.room_number || r.room_no || r.id, extra: r.floor || r.room_type || '' })));

          // Optionally, try to fetch bookings that reference this hotel (if endpoint exists)
          try {
            const bookingsResp = await api.get(`/bookings/`, { params: { hotel: selectedHotel.id } });
            let bookingsList = bookingsResp?.data || [];
            if (!Array.isArray(bookingsList)) bookingsList = bookingsList.results || bookingsList.data || [];
            if (Array.isArray(bookingsList) && bookingsList.length > 0) {
              const mapped = bookingsList.map(b => ({ type: 'booking', id: b.id, room_number: b.room_number || b.room_no || '', extra: b.guest_name || b.reference || '' }));
              setDeleteBlockedDependents(prev => [...prev, ...mapped]);
            }
          } catch (e) {
            // ignore if bookings endpoint not available or fails
          }
          // Also check package-related hotel detail endpoints which commonly protect Hotel deletes
          const packageEndpoints = [
            "/packages/umrahpackagehoteldetails/",
            "/packages/customumrahpackagehoteldetails/",
            "/umrah-package-hotel-details/",
            "/umrahpackagehoteldetails/",
          ];
          for (const ep of packageEndpoints) {
            try {
              const resp = await api.get(ep, { params: { hotel: selectedHotel.id } });
              let items = resp?.data || [];
              if (!Array.isArray(items)) items = items.results || items.data || [];
              if (Array.isArray(items) && items.length > 0) {
                const mapped = items.map(it => ({
                  type: ep.includes('custom') ? 'custom_package_hotel_detail' : 'package_hotel_detail',
                  id: it.id,
                  extra: it.package || it.package_id || it.room_type || it.double_bed_price || JSON.stringify(it)
                }));
                setDeleteBlockedDependents(prev => [...prev, ...mapped]);
              }
            } catch (e) {
              // ignore endpoint not found or other errors; proceed to next
            }
          }
          // If package-specific endpoints were not available or returned empty/forbidden,
          // try fetching Umrah packages and generic packages list (requires organization).
          // We'll client-side filter packages whose hotel_details include this hotel id.
          try {
            const orgParam = organizationId ? { organization: organizationId } : {};
            // Try umrah-packages first
            try {
              const upResp = await api.get(`/umrah-packages/`, { params: orgParam });
              let upItems = upResp?.data || [];
              if (!Array.isArray(upItems)) upItems = upItems.results || upItems.data || [];
              if (Array.isArray(upItems) && upItems.length > 0) {
                const matched = upItems.filter(p => Array.isArray(p.hotel_details) && p.hotel_details.some(hd => (hd.hotel === selectedHotel.id) || (hd.hotel && hd.hotel.id === selectedHotel.id)));
                if (matched.length > 0) {
                  const mapped = matched.map(p => ({ type: 'umrah_package', id: p.id, extra: p.title || p.package_code || JSON.stringify(p) }));
                  setDeleteBlockedDependents(prev => [...prev, ...mapped]);
                }
              }
            } catch (e) {
              // ignore umrah-packages errors (permission/path)
            }

            // Also try the generic packages endpoint (PackageViewSet)
            try {
              const pkResp = await api.get(`/packages/`, { params: orgParam });
              let pkItems = pkResp?.data || [];
              if (!Array.isArray(pkItems)) pkItems = pkItems.results || pkItems.data || [];
              if (Array.isArray(pkItems) && pkItems.length > 0) {
                const matched2 = pkItems.filter(p => Array.isArray(p.hotel_details) && p.hotel_details.some(hd => (hd.hotel === selectedHotel.id) || (hd.hotel && hd.hotel.id === selectedHotel.id)));
                if (matched2.length > 0) {
                  const mapped2 = matched2.map(p => ({ type: 'package', id: p.id, extra: p.title || p.package_code || JSON.stringify(p) }));
                  setDeleteBlockedDependents(prev => [...prev, ...mapped2]);
                }
              }
            } catch (e) {
              // ignore
            }
          } catch (outerE) {
            // ignore any unexpected errors here
          }
          // Try other modules that often reference hotels: operations, pax_movements, booking, organization
          try {
            // Operations (registered under api/operations/ -> relative to base '/api')
            try {
              const opResp = await api.get(`/operations/daily/hotels/`, { params: { hotel: selectedHotel.id } });
              let opItems = opResp?.data || [];
              if (!Array.isArray(opItems)) opItems = opItems.results || opItems.data || [];
              if (Array.isArray(opItems) && opItems.length > 0) {
                const mapped = opItems.map(it => ({ type: 'operation_hotel', id: it.id, extra: it.name || JSON.stringify(it) }));
                setDeleteBlockedDependents(prev => [...prev, ...mapped]);
              }
            } catch (e) {
              // ignore
            }

            // Pax movements
            try {
              const paxResp = await api.get(`/pax-movements/`, { params: { hotel: selectedHotel.id } });
              let paxItems = paxResp?.data || [];
              if (!Array.isArray(paxItems)) paxItems = paxItems.results || paxItems.data || [];
              if (Array.isArray(paxItems) && paxItems.length > 0) {
                const mapped = paxItems.map(it => ({ type: 'pax_movement', id: it.id, extra: it.name || it.reference || JSON.stringify(it) }));
                setDeleteBlockedDependents(prev => [...prev, ...mapped]);
              }
            } catch (e) {
              // ignore
            }

            // Hotel outsourcing / booking-related
            try {
              const hoResp = await api.get(`/hotel-outsourcing/`, { params: { hotel: selectedHotel.id } });
              let hoItems = hoResp?.data || [];
              if (!Array.isArray(hoItems)) hoItems = hoItems.results || hoItems.data || [];
              if (Array.isArray(hoItems) && hoItems.length > 0) {
                const mapped = hoItems.map(it => ({ type: 'hotel_outsourcing', id: it.id, extra: it.title || JSON.stringify(it) }));
                setDeleteBlockedDependents(prev => [...prev, ...mapped]);
              }
            } catch (e) {}

            // Booking items (bookings may have hotel FK)
            try {
              const bResp = await api.get(`/bookings/`, { params: { hotel: selectedHotel.id } });
              let bItems = bResp?.data || [];
              if (!Array.isArray(bItems)) bItems = bItems.results || bItems.data || [];
              if (Array.isArray(bItems) && bItems.length > 0) {
                const mapped = bItems.map(it => ({ type: 'booking', id: it.id, extra: it.reference || it.guest_name || JSON.stringify(it) }));
                setDeleteBlockedDependents(prev => [...prev, ...mapped]);
              }
            } catch (e) {}

            // Hotel prices, contact details, photos (tickets app)
            try {
              const hpResp = await api.get(`/hotel-prices/`, { params: { hotel: selectedHotel.id } });
              let hpItems = hpResp?.data || [];
              if (!Array.isArray(hpItems)) hpItems = hpItems.results || hpItems.data || [];
              if (Array.isArray(hpItems) && hpItems.length > 0) {
                const mapped = hpItems.map(it => ({ type: 'hotel_price', id: it.id, extra: it.room_type || it.price || '' }));
                setDeleteBlockedDependents(prev => [...prev, ...mapped]);
              }
            } catch (e) {}

            try {
              const hcResp = await api.get(`/hotel-contact-details/`, { params: { hotel: selectedHotel.id } });
              let hcItems = hcResp?.data || [];
              if (!Array.isArray(hcItems)) hcItems = hcItems.results || hcItems.data || [];
              if (Array.isArray(hcItems) && hcItems.length > 0) {
                const mapped = hcItems.map(it => ({ type: 'hotel_contact', id: it.id, extra: it.contact_person || it.contact_number || '' }));
                setDeleteBlockedDependents(prev => [...prev, ...mapped]);
              }
            } catch (e) {}

            try {
              const phResp = await api.get(`/hotel-photos/`, { params: { hotel: selectedHotel.id } });
              let phItems = phResp?.data || [];
              if (!Array.isArray(phItems)) phItems = phItems.results || phItems.data || [];
              if (Array.isArray(phItems) && phItems.length > 0) {
                const mapped = phItems.map(it => ({ type: 'hotel_photo', id: it.id, extra: it.caption || '' }));
                setDeleteBlockedDependents(prev => [...prev, ...mapped]);
              }
            } catch (e) {}
          } catch (e) {
            // swallow
          }
        } catch (e) {
          // If fetching dependents fails, show raw server message as a fallback
          const serverMsgStr = typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg);
          // Try to parse common ProtectedError formatting to extract dependent items
          const parsed = [];
          try {
            // Example lines to parse:
            // "Umrah package hotel details: UmrahPackageHotelDetails object (96)"
            // "Hotel Detail: hotel 1 - karachi - Deluxe (Single (1 Person))"
            const lines = serverMsgStr.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            const pkgRe = /umrah package hotel details:\s*(.+?)\s*\((\d+)\)/i;
            const hotelDetailRe = /hotel detail:\s*(.+?)\s*\((.+)\)/i;
            const genericObjRe = /([A-Za-z0-9_]+) object \((\d+)\)/i;
            for (const line of lines) {
              let m = line.match(pkgRe);
              if (m) {
                parsed.push({ type: 'package_hotel_detail', id: Number(m[2]), extra: m[1] });
                continue;
              }
              m = line.match(hotelDetailRe);
              if (m) {
                parsed.push({ type: 'hotel_detail', id: null, extra: m[1] });
                continue;
              }
              m = line.match(genericObjRe);
              if (m) {
                parsed.push({ type: m[1].toLowerCase(), id: Number(m[2]), extra: '' });
              }
            }
          } catch (pe) {
            // ignore parsing errors
          }

          if (parsed.length > 0) {
            setDeleteBlockedDependents(parsed);
            setDeleteBlockedMessage('The server reports protected related objects; see the list below.');
          } else {
            setDeleteBlockedMessage(serverMsgStr);
          }
        } finally {
          setDeleteBlockedLoading(false);
        }
        return;
      }

      showAlert("error", "Failed to delete hotel");
    }
  };

  // Fetch hotel availability with room/floor details
  const availabilityEndpointRef = useRef(null);

  const fetchHotelAvailability = async (hotelId) => {
    setAvailabilityLoading(true);
    // Determine an effective organization id to send to the API.
    // Prefer the explicit `organizationId` (selectedOrganization from localStorage/env),
    // otherwise try to infer from the currently loaded `hotels` list.
    const inferredOrgFromList = (Array.isArray(hotels) && hotels.length > 0) ? (hotels.find(h => Number(h.id) === Number(hotelId))?.organization || hotels.find(h => Number(h.id) === Number(hotelId))?.organization_id) : null;
    const effectiveOrg = organizationId || inferredOrgFromList || null;

    // If we've previously discovered a working endpoint, use it directly
    if (availabilityEndpointRef.current) {
      const { ep, useParams } = availabilityEndpointRef.current;
      try {
        const params = useParams
          ? { hotel_id: hotelId, date_from: dateRange.date_from, date_to: dateRange.date_to, ...(effectiveOrg ? { organization: effectiveOrg } : {}) }
          : { date_from: dateRange.date_from, date_to: dateRange.date_to, ...(effectiveOrg ? { organization: effectiveOrg } : {}) };
        const response = await api.get(ep, { params });
        setHotelAvailability(response.data);
        setAvailabilityLoading(false);
        return;
      } catch (err) {
        // If cached endpoint suddenly fails with non-404, surface error. If 404/405, fall back to rediscovery below.
        const status = err?.response?.status;
        // If backend replies 400, it may be due to missing 'organization' parameter; clear cache and fall back to discovery
        if (status === 400) {
          // If the server indicates missing params, surface that to the user and attempt discovery with organization included
          const detail = err?.response?.data?.detail || err?.response?.data || null;
          // eslint-disable-next-line no-console
          console.warn('Availability cached endpoint returned 400:', detail);
          availabilityEndpointRef.current = null;
          // continue to discovery below
        } else if (status !== 404 && status !== 405) {
          showAlert("error", "Failed to fetch hotel availability");
          // eslint-disable-next-line no-console
          console.error("Availability error (cached):", err);
          setAvailabilityLoading(false);
          return;
        } else {
          // Clear cache and attempt discovery again
          availabilityEndpointRef.current = null;
        }
      }
    }

    // Candidate endpoints to try (ordered by most-likely)
    const candidates = [
      { ep: `/hotels/availability`, useParams: true },
      { ep: `/hotel-availability`, useParams: true },
      { ep: `/hotels/${hotelId}/availability/`, useParams: false },
      { ep: `/hotel-availability/${hotelId}/`, useParams: false },
    ];

    let tried = [];
    for (const c of candidates) {
      try {
        const params = c.useParams
          ? { hotel_id: hotelId, date_from: dateRange.date_from, date_to: dateRange.date_to, ...(effectiveOrg ? { organization: effectiveOrg } : {}) }
          : { date_from: dateRange.date_from, date_to: dateRange.date_to, ...(effectiveOrg ? { organization: effectiveOrg } : {}) };
        const response = await api.get(c.ep, { params });
        // cache working endpoint to avoid future 404s
        availabilityEndpointRef.current = { ep: c.ep, useParams: c.useParams };
        setHotelAvailability(response.data);
        setAvailabilityLoading(false);
        return;
      } catch (err) {
        const status = err?.response?.status;
        tried.push({ ep: c.ep, status: status || 'error' });
        if (status === 400) {
          // Backend explicitly complains about missing/invalid parameters (likely 'organization')
          const detail = err?.response?.data?.detail || err?.response?.data || 'Missing required params';
          showAlert('error', `Availability request invalid: ${JSON.stringify(detail)}. Select an organization and try again.`);
          // Do not continue discovery — the endpoint exists but request params are invalid; stop further tries
          setHotelAvailability(null);
          setAvailabilityLoading(false);
          return;
        }
        if (status === 404 || status === 405) {
          // try next candidate
          continue;
        }
        // Non-404/400 error: surface and stop
        showAlert("error", "Failed to fetch hotel availability");
        // eslint-disable-next-line no-console
        console.error("Availability error:", err);
        setHotelAvailability(null);
        setAvailabilityLoading(false);
        return;
      }
    }

    // None of the candidates exist on the server — show a single friendly warning and stop.
    // Avoid noisy console stack traces for expected missing endpoints.
    // eslint-disable-next-line no-console
    console.debug('Availability discovery tried endpoints:', tried);
    showAlert("warning", "Hotel availability endpoint not available on server. Availability feature disabled.");
    setHotelAvailability(null);
    setAvailabilityLoading(false);
  };

  // Open availability modal
  const openAvailabilityModal = (hotel) => {
    setSelectedHotel(hotel);
    setShowAvailabilityModal(true);
    fetchHotelAvailability(hotel.id);
  };

  // Get room status badge
  const getRoomStatusBadge = (status) => {
    switch (status) {
      case "occupied":
        return <Badge bg="danger">Occupied</Badge>;
      case "partially_occupied":
        return <Badge bg="warning">Partially Occupied</Badge>;
      case "available":
        return <Badge bg="success">Available</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Reset forms
  const resetHotelForm = () => {
    setHotelForm({
      city: "",
      name: "",
      address: "",
      google_location: "",
      contact_number: "",
      category: "ECO",
      distance: "",
      walking_time: "",
      is_active: true,
      available_start_date: "",
      available_end_date: ""
    });
  // reset additional fields
  setContactDetails([{ contact_person: "", contact_number: "" }]);
  setPriceSections([{ start_date: "", end_date: "", room_type: "double", price: "", purchase_price: "", bed_prices: [] }]);
    setPhotoFiles([]);
    setVideoFile(null);
    setResellingAllowed(false);
    setHotelStatus("active");
    setRooms([]);
    setAddHotelTab("hotel");
  };

  // Open edit modal
  const openAddModal = () => {
    // Reset form states
    setHotelForm({
      city: "",
      name: "",
      address: "",
      google_location: "",
      contact_number: "",
      category: "ECO",
      distance: "",
      walking_time: "",
      is_active: true,
      available_start_date: "",
      available_end_date: ""
    });
    setContactDetails([{ contact_person: "", contact_number: "" }]);
    setPriceSections([{ start_date: "", end_date: "", room_type: "double", price: "", purchase_price: "", bed_prices: [] }]);
    setPhotoFiles([]);
    setVideoFile(null);
    setResellingAllowed(false);
    setHotelStatus("active");
    setRooms([]);
    setAddHotelTab("hotel");
    setShowAddModal(true);
  };

  const openEditModal = (hotel) => {
    setSelectedHotel(hotel);
    setHotelForm({
      city: hotel.city,
      name: hotel.name,
      address: hotel.address,
      google_location: hotel.google_location || "",
      contact_number: hotel.contact_number || "",
      category: hotel.category,
      distance: hotel.distance || "",
      walking_time: hotel.walking_time || hotel.walking_minutes || "",
      is_active: hotel.is_active,
      available_start_date: hotel.available_start_date || "",
      available_end_date: hotel.available_end_date || ""
    });
    setResellingAllowed(
      hotel.reselling_allowed === true ||
      hotel.reselling_allowed === "true" ||
      hotel.reselling_allowed === 1 ||
      hotel.reselling_allowed === "1"
    );
    
    // Load existing prices
    const existingPrices = (hotel.prices || []).map(p => ({
      id: p.id,
      start_date: p.start_date || "",
      end_date: p.end_date || "",
      room_type: p.room_type || "double",
      price: p.price || "",
      purchase_price: p.purchase_price || "",
      bed_prices: []
    }));
    setPriceSections(existingPrices.length > 0 ? existingPrices : [{ start_date: "", end_date: "", room_type: "double", price: "", purchase_price: "", bed_prices: [] }]);
    // Populate contact details if present (backend may return contact_details or contactDetails)
    const existingContacts = hotel.contact_details || hotel.contactDetails || [];
    setContactDetails((existingContacts && existingContacts.length > 0) ? existingContacts.map(c => ({ contact_person: c.contact_person || c.name || '', contact_number: c.contact_number || c.phone || '' })) : [{ contact_person: '', contact_number: '' }]);
    // Clear uploaded files preview on edit (we don't fetch actual File objects from server)
    setPhotoFiles([]);
    setVideoFile(null);
    // hotel status
    setHotelStatus(hotel.status || 'active');
    
    // Fetch existing rooms for this hotel so they are editable
    (async () => {
      try {
        const resp = await api.get(`/hotel-rooms/`, { params: { hotel: hotel.id } });
        const list = resp?.data || [];
        const roomsArr = Array.isArray(list) ? list : (list.results || list.data || []);
        const mapped = roomsArr.map(r => ({
          id: r.id,
          floor: r.floor,
          room_no: r.room_number || r.room_no || "",
          room_type: r.room_type,
          status: r.status || "available",
          details: (r.details || []).map(d => ({ id: d.id, bed_no: d.bed_number, is_assigned: d.is_assigned }))
        }));
        setRooms(mapped);
        setInitialRoomIds(mapped.filter(x => x.id).map(x => x.id));
        setAddHotelTab("hotel");
      } catch (e) {
        // ignore - allow editing without rooms
        setRooms([]);
        setInitialRoomIds([]);
      }
      setShowEditModal(true);
    })();
  };

  // Filter hotels
  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !selectedCity || hotel.city === parseInt(selectedCity);
    // If this hotel belongs to another organization (i.e., a linked org view),
    // For organization-scoped views, only show hotels created by the selected organization.
    // Consider multiple possible fields for owner org id, including legacy `owner_organization_id`.
    const hotelOrg = hotel.organization || hotel.organization_id || hotel.owner_organization_id || hotel.org || null;
    // If no organizationId is set (public/demo view), apply an extra guard to avoid
    // showing external hotels unless they explicitly allow reselling. When
    // `organizationId` is present we should trust the server response (the API
    // already applies AllowedReseller / linked-org / reselling_allowed rules),
    // so do not enforce a client-side same-organization check which would hide
    // valid reseller hotels returned by the backend.
    if (!organizationId) {
      const isExternal = hotelOrg && String(hotelOrg) !== String(organizationId);
      if (isExternal && !hotel.reselling_allowed) return false;
    }
    return matchesSearch && matchesCity;
  });

  // Debug: log hotels and filtered results to help diagnose missing items in UI
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('HotelAvailabilityManager debug:', { organizationId, rawHotels: hotels, filteredCount: filteredHotels.length });
  }, [hotels, filteredHotels, organizationId]);

  // Get city name
  const getCityName = (cityId) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : "Unknown";
  };

  // Get category badge
  const getCategoryBadge = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? (
      <Badge style={{ backgroundColor: cat.color }}>{cat.label}</Badge>
    ) : <Badge bg="secondary">{category}</Badge>;
  };

  return (
    <>
    <div className="page-container" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Sidebar />
      <div className="content-wrapper" style={{ flex: 1, overflow: "auto" }}>
  <Header />
  <HotelsTabs />
        
  <Container fluid className="p-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1" style={{ fontWeight: 600, color: "#2c3e50" }}>
                <Hotel size={32} className="me-2" style={{ color: "#1B78CE" }} />
                Hotel Availability Manager
              </h2>
              <p className="text-muted mb-0">Manage hotels, rooms, pricing, and availability</p>
            </div>
            <Button 
              style={{ backgroundColor: "#1B78CE", border: "none" }}
              onClick={openAddModal}
            >
              <Plus size={20} className="me-2" />
              Add New Hotel
            </Button>
          </div>

          {/* Alert */}
          {alert.show && (
            <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, type: "", message: "" })}>
              {alert.type === "success" ? <CheckCircle size={20} className="me-2" /> : <AlertCircle size={20} className="me-2" />}
              {alert.message}
            </Alert>
          )}

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="p-3 rounded" style={{ backgroundColor: "#e3f2fd" }}>
                      <Hotel size={24} style={{ color: "#1976d2" }} />
                    </div>
                    <div className="ms-3">
                      <h6 className="text-muted mb-1">Total Hotels</h6>
                      <h3 className="mb-0">{filteredHotels.length}</h3>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="p-3 rounded" style={{ backgroundColor: "#e8f5e9" }}>
                      <CheckCircle size={24} style={{ color: "#388e3c" }} />
                    </div>
                    <div className="ms-3">
                      <h6 className="text-muted mb-1">Active Hotels</h6>
                      <h3 className="mb-0">{filteredHotels.filter(h => h.is_active).length}</h3>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="p-3 rounded" style={{ backgroundColor: "#fff3e0" }}>
                      <MapPin size={24} style={{ color: "#f57c00" }} />
                    </div>
                    <div className="ms-3">
                      <h6 className="text-muted mb-1">Cities</h6>
                      <h3 className="mb-0">{cities.length}</h3>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="p-3 rounded" style={{ backgroundColor: "#fce4ec" }}>
                      <XCircle size={24} style={{ color: "#c2185b" }} />
                    </div>
                    <div className="ms-3">
                      <h6 className="text-muted mb-1">Inactive</h6>
                      <h3 className="mb-0">{filteredHotels.filter(h => !h.is_active).length}</h3>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={6}>
                  <div className="position-relative">
                    <Search size={20} className="position-absolute" style={{ left: "12px", top: "12px", color: "#6c757d" }} />
                    <Form.Control
                      type="text"
                      placeholder="Search hotels by name or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: "40px" }}
                    />
                  </div>
                </Col>
                <Col md={4}>
                  <Form.Select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                    <option value="">All Cities</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={() => { setSearchTerm(""); setSelectedCity(""); }}
                  >
                    <Filter size={18} className="me-2" />
                    Clear
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Hotels List */}
          {/* Diagnostic alert: when server returned hotels but none survive client-side filters,
              render a compact debug panel to show owner org and reselling flags. */}
          {hotels.length > 0 && filteredHotels.length === 0 && (
            <Alert variant="warning" className="mb-3">
              <strong>No hotels available for the current organization/filters.</strong>
              <div className="mt-2 small">Returned hotels (id → ownerOrg, reselling_allowed):</div>
              <pre style={{ maxHeight: 160, overflow: 'auto', fontSize: 12 }}>
{JSON.stringify(hotels.map(h => ({ id: h.id, org: h.organization || h.organization_id || h.owner_organization_id || null, reselling_allowed: h.reselling_allowed })), null, 2)}
              </pre>
            </Alert>
          )}

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0">Hotels List ({filteredHotels.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div style={{ overflowX: "auto" }}>
                <Table hover responsive>
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
                      <th style={{ minWidth: "200px" }}>Hotel Name</th>
                      <th style={{ minWidth: "120px" }}>City</th>
                      <th style={{ minWidth: "200px" }}>Address</th>
                      <th style={{ minWidth: "100px" }}>Category</th>
                      <th style={{ minWidth: "100px" }}>Distance (KM)</th>
                      <th style={{ minWidth: "110px" }}>Walk Time (min)</th>
                      <th style={{ minWidth: "120px" }}>Contact</th>
                      <th style={{ minWidth: "100px" }}>Status</th>
                      <th style={{ minWidth: "150px" }}>Availability</th>
                      <th style={{ minWidth: "150px", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          <Spinner animation="border" variant="primary" />
                        </td>
                      </tr>
                    ) : filteredHotels.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          <AlertCircle size={48} className="text-muted mb-3" />
                          <p className="text-muted">No hotels found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredHotels.map(hotel => (
                        <tr key={hotel.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <Hotel size={20} className="me-2 text-primary" />
                              <div>
                                <strong>{hotel.name}</strong>
                                {hotel.reselling_allowed ? (
                                  (organizationId && String(hotel.organization || hotel.organization_id || hotel.owner_organization_id) === String(organizationId)) ? (
                                    <Badge bg="success" className="ms-2">Reselling Allowed</Badge>
                                  ) : (
                                    <Badge bg="warning" className="ms-2" style={{ color: '#212529' }}>Reseller</Badge>
                                  )
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td>
                            <MapPin size={16} className="me-1" />
                            {hotel.city_name ? hotel.city_name : getCityName(hotel.city)}
                          </td>
                          <td>{hotel.address}</td>
                          <td>{getCategoryBadge(hotel.category)}</td>
                          <td>
                            {hotel.distance ? (
                              <span>{String(hotel.distance)} km</span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>
                            {hotel.walking_time || hotel.walking_time === 0 ? (
                              <span>{String(hotel.walking_time)} min</span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>
                            {hotel.contact_number ? (
                              <span>
                                <Phone size={14} className="me-1" />
                                {hotel.contact_number}
                              </span>
                            ) : "N/A"}
                          </td>
                          <td>
                            {hotel.is_active ? (
                              <Badge bg="success">
                                <CheckCircle size={14} className="me-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge bg="danger">
                                <XCircle size={14} className="me-1" />
                                Inactive
                              </Badge>
                            )}
                          </td>
                          <td>
                            {hotel.available_start_date && hotel.available_end_date ? (
                              <small>
                                <Calendar size={14} className="me-1" />
                                {new Date(hotel.available_start_date).toLocaleDateString()} - {new Date(hotel.available_end_date).toLocaleDateString()}
                              </small>
                            ) : (
                              <Badge bg="secondary">Not Set</Badge>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                              <Button 
                                size="sm" 
                                variant="outline-success"
                                onClick={() => openAvailabilityModal(hotel)}
                                title="View Availability"
                              >
                                <BedDouble size={16} />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-primary"
                                onClick={() => {
                                  setSelectedHotel(hotel);
                                  setShowViewModal(true);
                                }}
                                title="View Details"
                              >
                                <Eye size={16} />
                              </Button>
                              {(() => {
                                const hotelOrg = hotel.organization || hotel.organization_id || hotel.owner_organization_id || hotel.org || null;
                                const isOwner = organizationId && hotelOrg && String(hotelOrg) === String(organizationId);
                                return (
                                  <Button
                                    size="sm"
                                    variant="outline-info"
                                    onClick={() => {
                                      if (isOwner) openEditModal(hotel);
                                      else { setSelectedHotel(hotel); setShowResellerPopup(true); }
                                    }}
                                    title={isOwner ? "Edit Hotel" : "Click to see why editing is disabled"}
                                  >
                                    <Edit2 size={16} />
                                  </Button>
                                );
                              })()}
                              {(() => {
                                const hotelOrg = hotel.organization || hotel.organization_id || hotel.owner_organization_id || hotel.org || null;
                                const isOwner = organizationId && hotelOrg && String(hotelOrg) === String(organizationId);
                                return (
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => {
                                      if (isOwner) { setSelectedHotel(hotel); setShowDeleteModal(true); }
                                      else { setSelectedHotel(hotel); setShowResellerPopup(true); }
                                    }}
                                    title={isOwner ? "Delete Hotel" : "Deleting disabled for resellers"}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Container>

        {/* Reseller popup shown when a non-owner clicks Edit */}
        <Modal show={showResellerPopup} onHide={() => setShowResellerPopup(false)} size="sm" centered>
          <Modal.Header closeButton>
            <Modal.Title>Read-only</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>This shared inventory cannot be edited by your organization.</div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => setShowResellerPopup(false)}>OK</Button>
          </Modal.Footer>
        </Modal>

        {/* Add Hotel Modal */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="d-flex align-items-center">
              <Plus size={22} className="me-2" style={{ color: '#1B78CE' }} />
              <span style={{ color: '#1B78CE' }}>Add New Hotel</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tabs activeKey={addHotelTab} onSelect={(k) => setAddHotelTab(k)} className="mb-3">
              <Tab eventKey="hotel" title="Hotel">
                <Form>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">City <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          value={hotelForm.city}
                          onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                        >
                          <option value="">Select City</option>
                          {cities.map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Hotel Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          value={hotelForm.name}
                          onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                          placeholder="Enter hotel name"
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Address <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={hotelForm.address}
                          onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                          placeholder="Enter full address"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Category</Form.Label>
                        <Form.Select
                          value={hotelForm.category}
                          onChange={(e) => setHotelForm({ ...hotelForm, category: e.target.value })}
                        >
                          {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Distance (KM)</Form.Label>
                        <Form.Control
                          type="text"
                          value={hotelForm.distance}
                          onChange={(e) => setHotelForm({ ...hotelForm, distance: e.target.value })}
                          placeholder="e.g., 0.5"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Walking Time (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          value={hotelForm.walking_time}
                          onChange={(e) => setHotelForm({ ...hotelForm, walking_time: e.target.value })}
                          placeholder="e.g., 6"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2} className="d-flex align-items-center">
                      <Form.Check
                        type="checkbox"
                        label={<span className="fw-medium">Active</span>}
                        checked={hotelForm.is_active}
                        onChange={(e) => setHotelForm({ ...hotelForm, is_active: e.target.checked })}
                      />
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Contact Number</Form.Label>
                        <Form.Control
                          type="tel"
                          value={hotelForm.contact_number}
                          onChange={(e) => setHotelForm({ ...hotelForm, contact_number: e.target.value })}
                          placeholder="+92 XXX XXXXXXX"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Google Location Link</Form.Label>
                        <Form.Control
                          type="url"
                          value={hotelForm.google_location}
                          onChange={(e) => setHotelForm({ ...hotelForm, google_location: e.target.value })}
                          placeholder="https://maps.google.com/..."
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Available From</Form.Label>
                        <Form.Control
                          type="date"
                          value={hotelForm.available_start_date}
                          onChange={(e) => setHotelForm({ ...hotelForm, available_start_date: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Available Until</Form.Label>
                        <Form.Control
                          type="date"
                          value={hotelForm.available_end_date}
                          onChange={(e) => setHotelForm({ ...hotelForm, available_end_date: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    {/* Contact Details */}
                    <Col xs={12}>
                      <Form.Label className="fw-medium">Contact Details</Form.Label>
                      {contactDetails.map((c, idx) => (
                        <Row className="g-2 mb-2" key={idx}>
                          <Col md={5}>
                            <Form.Control
                              placeholder="Contact Person"
                              value={c.contact_person}
                              onChange={(e) => {
                                const copy = [...contactDetails];
                                copy[idx].contact_person = e.target.value;
                                setContactDetails(copy);
                              }}
                            />
                          </Col>
                          <Col md={5}>
                            <Form.Control
                              placeholder="Contact Number"
                              value={c.contact_number}
                              onChange={(e) => {
                                const copy = [...contactDetails];
                                copy[idx].contact_number = e.target.value;
                                setContactDetails(copy);
                              }}
                            />
                          </Col>
                          <Col md={2} className="d-flex align-items-center">
                            <Button variant="danger" size="sm" onClick={() => {
                              if (contactDetails.length === 1) return;
                              const copy = contactDetails.filter((_, i) => i !== idx);
                              setContactDetails(copy);
                            }}>Remove</Button>
                          </Col>
                        </Row>
                      ))}
                      <Button size="sm" onClick={() => setContactDetails([...contactDetails, { contact_person: "", contact_number: "" }])}>Add Contact</Button>
                    </Col>

                    {/* Price Sections (renamed per-request to numbered Hotel Price entries) */}
                    <Col xs={12}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label className="fw-medium mb-0">Hotel Prices</Form.Label>
                            <Button size="sm" onClick={() => setPriceSections([...priceSections, { start_date: "", end_date: "", room_type: "double", price: "", purchase_price: "", bed_prices: [] }])} style={{ backgroundColor: '#1B78CE', border: 'none', color: '#fff' }} title="Add another hotel price">+ Add Hotel Price</Button>
                          </div>

                      {priceSections.map((p, idx) => (
                        <div key={idx} className="mb-3 p-2 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #eee' }}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Hotel Price {idx + 1}</strong>
                            <Button size="sm" variant="outline-danger" onClick={() => { if (priceSections.length === 1) return; setPriceSections(priceSections.filter((_, i) => i !== idx)); }}>Remove</Button>
                          </div>

                          <Row className="g-2 align-items-center">
                            <Col md={4}><Form.Control type="date" value={p.start_date} onChange={(e) => { const copy = [...priceSections]; copy[idx].start_date = e.target.value; setPriceSections(copy); }} /></Col>
                            <Col md={4}><Form.Control type="date" value={p.end_date} onChange={(e) => { const copy = [...priceSections]; copy[idx].end_date = e.target.value; setPriceSections(copy); }} /></Col>
                            <Col md={4}><Form.Select value={p.room_type} onChange={(e) => { const copy = [...priceSections]; copy[idx].room_type = e.target.value; setPriceSections(copy); }}>{roomTypes.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}</Form.Select></Col>
                          </Row>
                          <Row className="g-2 mt-2">
                            <Col xs={12} className="mb-2"><strong>Only-Room Price</strong></Col>
                            <Col md={6}><Form.Control type="number" placeholder="Selling Price (SAR)" value={p.price} onChange={(e) => { const copy = [...priceSections]; copy[idx].price = e.target.value; setPriceSections(copy); }} /></Col>
                            <Col md={6}><Form.Control type="number" placeholder="Purchase Price (SAR)" value={p.purchase_price} onChange={(e) => { const copy = [...priceSections]; copy[idx].purchase_price = e.target.value; setPriceSections(copy); }} /></Col>
                          </Row>

                          {/* Bed-specific prices within this price section */}
                          {(p.bed_prices || []).map((bp, bidx) => (
                            <Row key={bidx} className="g-2 align-items-center mt-2">
                              <Col md={4}>
                                <Form.Select value={bp.type} onChange={(e) => { const copy = [...priceSections]; copy[idx].bed_prices[bidx].type = e.target.value; setPriceSections(copy); }}>
                                  <option value="sharing">Sharing</option>
                                  <option value="single">Single Bed</option>
                                  <option value="double">Double Bed</option>
                                  <option value="triple">Triple Bed</option>
                                  <option value="quad">Quad Bed</option>
                                  <option value="quint">Quint Bed</option>
                                </Form.Select>
                              </Col>
                              <Col md={4}><Form.Control type="number" placeholder="Selling Price (SAR)" value={bp.price} onChange={(e) => { const copy = [...priceSections]; copy[idx].bed_prices[bidx].price = e.target.value; setPriceSections(copy); }} /></Col>
                              <Col md={3}><Form.Control type="number" placeholder="Purchase Price (SAR)" value={bp.purchase_price} onChange={(e) => { const copy = [...priceSections]; copy[idx].bed_prices[bidx].purchase_price = e.target.value; setPriceSections(copy); }} /></Col>
                              <Col md={1} className="d-flex">
                                <Button size="sm" variant="danger" onClick={() => { const copy = [...priceSections]; copy[idx].bed_prices = copy[idx].bed_prices.filter((_, i) => i !== bidx); setPriceSections(copy); }}>Remove</Button>
                              </Col>
                            </Row>
                          ))}

                          <div className="d-flex gap-3 mt-2">
                            <Button size="sm" className="" onClick={() => {
                              const copy = [...priceSections];
                              copy[idx].bed_prices = copy[idx].bed_prices ? [...copy[idx].bed_prices, { type: 'sharing', price: '', purchase_price: '' }] : [{ type: 'sharing', price: '', purchase_price: '' }];
                              setPriceSections(copy);
                            }} style={{ backgroundColor: '#1B78CE', border: 'none', color: '#fff' }}>+ Add Bed Type</Button>
                          </div>
                        </div>
                      ))}
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Photos</Form.Label>
                        <Form.Control type="file" accept="image/*" multiple onChange={(e) => setPhotoFiles(Array.from(e.target.files))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Video</Form.Label>
                        <Form.Control type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="d-flex align-items-center">
                      <Form.Check type="checkbox" label={<span className="fw-medium">Allow Reselling</span>} checked={resellingAllowed} onChange={(e) => setResellingAllowed(e.target.checked)} />
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Status</Form.Label>
                        <Form.Select value={hotelStatus} onChange={(e) => setHotelStatus(e.target.value)}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                          <option value="maintenance">Maintenance</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Tab>
              <Tab eventKey="rooms" title={`Rooms (${rooms.length})`}>
                <div>
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <h6>Rooms Builder</h6>
                    <div>
                      <Button size="sm" onClick={addRoom} className="me-2" style={{ backgroundColor: '#1B78CE', border: 'none' }}>Add Room</Button>
                      <Button size="sm" variant="outline-secondary" onClick={() => setRooms([])}>Clear All</Button>
                    </div>
                  </div>

                  {rooms.length === 0 && (
                    <div className="text-muted">No rooms added yet. Click "Add Room" to create room entries.</div>
                  )}

                  {rooms.map((r, ri) => (
                    <Card key={`room-${ri}`} className="mb-2">
                      <Card.Body>
                        <Row className="g-2">
                          <Col md={3}>
                            <Form.Select value={r.floor || "Ground Floor"} onChange={(e) => { const copy = [...rooms]; copy[ri].floor = e.target.value; setRooms(copy); }}>
                              <option value="Ground Floor">Ground Floor</option>
                              <option value="1st Floor">1st Floor</option>
                              <option value="2nd Floor">2nd Floor</option>
                              <option value="3rd Floor">3rd Floor</option>
                              <option value="4th Floor">4th Floor</option>
                              <option value="5th Floor">5th Floor</option>
                              <option value="6th Floor">6th Floor</option>
                              <option value="7th Floor">7th Floor</option>
                              <option value="8th Floor">8th Floor</option>
                              <option value="9th Floor">9th Floor</option>
                              <option value="10th Floor">10th Floor</option>
                            </Form.Select>
                          </Col>
                          <Col md={3}>
                            <Form.Control placeholder="Room No" value={r.room_no} onChange={(e) => { const copy = [...rooms]; copy[ri].room_no = e.target.value; setRooms(copy); }} />
                          </Col>
                          <Col md={3}>
                            <Form.Select value={r.room_type} onChange={(e) => { const copy = [...rooms]; const newType = e.target.value; copy[ri].room_type = newType; const found = roomTypes.find(rt => rt.value === newType); if (found) copy[ri].capacity = found.capacity; setRooms(copy); }}>
                              {roomTypes
                                .filter(rt => {
                                  // allow the current room's selected type to remain selectable
                                  if (rt.value === r.room_type) return true;
                                  // hide types already selected by other rooms
                                  return !rooms.some((other, idx) => idx !== ri && other.room_type === rt.value);
                                })
                                .map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                            </Form.Select>
                          </Col>
                          <Col md={2}>
                            <Form.Select value={r.status || 'available'} onChange={(e) => { const copy = [...rooms]; copy[ri].status = e.target.value; setRooms(copy); }}>
                              {roomStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                          </Col>
                          <Col md={1} className="d-flex align-items-center">
                            <Button variant="danger" size="sm" onClick={() => removeRoom(ri)}>Remove</Button>
                          </Col>
                        </Row>

                        <hr />
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Beds ({(r.details || []).length})</strong>
                            <div>
                              <Button size="sm" onClick={() => addBedToRoom(ri)} className="me-2" style={{ backgroundColor: '#1B78CE', border: 'none' }}>Add Bed</Button>
                              <Button size="sm" variant="outline-secondary" onClick={() => { const copy = [...rooms]; copy[ri].details = []; setRooms(copy); }}>Clear Beds</Button>
                            </div>
                          </div>

                          {(r.details || []).map((b, bi) => (
                            <Row className="g-2 mb-2" key={`bed-${ri}-${bi}`}>
                              <Col md={6}>
                                <Form.Control placeholder="Bed No" value={b.bed_no} onChange={(e) => { const copy = [...rooms]; copy[ri].details[bi].bed_no = e.target.value; setRooms(copy); }} />
                              </Col>
                              <Col md={4} className="d-flex align-items-center">
                                <Form.Check type="checkbox" label="Assigned" checked={!!b.is_assigned} onChange={(e) => { const copy = [...rooms]; copy[ri].details[bi].is_assigned = e.target.checked; setRooms(copy); }} />
                              </Col>
                              <Col md={2} className="d-flex align-items-center">
                                <Button variant="danger" size="sm" onClick={() => removeBedFromRoom(ri, bi)}>Remove</Button>
                              </Col>
                            </Row>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <div className="d-flex w-100 justify-content-between align-items-center">
              <div className="text-muted small">Fields marked <span className="text-danger">*</span> are required</div>
              <div>
                <Button variant="outline-secondary" onClick={() => setShowAddModal(false)} className="me-2">Cancel</Button>
                <Button onClick={handleAddHotel} style={{ backgroundColor: '#1B78CE', border: 'none' }} disabled={!hotelForm.city || !hotelForm.name || !hotelForm.address}>
                  <Save size={16} className="me-1" /> Save Hotel
                </Button>
              </div>
            </div>
          </Modal.Footer>
        </Modal>

        {/* Delete Blocked Modal - shows when backend refuses deletion due to linked data */}
        <Modal show={showDeleteBlockedModal} onHide={() => setShowDeleteBlockedModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <AlertCircle size={24} className="me-2 text-warning" />
              Cannot Delete Hotel
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              The hotel <strong>{selectedHotel?.name}</strong> cannot be deleted because there are other records linked to it (for example rooms or bookings).
            </p>
            <Alert variant="warning">
              Deleting this hotel is blocked by existing dependent records. Remove or reassign those records first, then try again.
            </Alert>
            {deleteBlockedLoading ? (
              <div className="text-center py-3">
                <Spinner animation="border" />
                <div className="mt-2">Loading linked records...</div>
              </div>
            ) : (
              <>
                {deleteBlockedDependents && deleteBlockedDependents.length > 0 ? (
                  <div className="mt-3">
                    <strong>Linked records preventing deletion:</strong>
                    <Table size="sm" className="mt-2">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>ID / Identifier</th>
                          <th>Info</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deleteBlockedDependents.map((d, idx) => (
                          <tr key={idx}>
                            <td>{d.type}</td>
                            <td>{d.id}</td>
                            <td>{d.room_number || d.extra}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    <div className="mt-2 small text-muted">You can edit or remove these records to allow deletion.</div>
                  </div>
                ) : (
                  deleteBlockedMessage ? (
                    <div className="mt-3">
                      <strong>Server message:</strong>
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{deleteBlockedMessage}</pre>
                    </div>
                  ) : (
                    <div className="mt-2 small text-muted">No linked records were found via the API. Check Django admin or server logs for details.</div>
                  )
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteBlockedModal(false)}>Close</Button>
            <Button variant="outline-primary" onClick={() => { setShowDeleteBlockedModal(false); openEditModal(selectedHotel); }}>View Rooms</Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Hotel Modal - Similar structure to Add Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <Edit2 size={24} className="me-2" />
              Edit Hotel
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tabs activeKey={addHotelTab} onSelect={(k) => setAddHotelTab(k)} className="mb-3">
              <Tab eventKey="hotel" title="Hotel">
                <Form>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">City <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          value={hotelForm.city}
                          onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                        >
                          <option value="">Select City</option>
                          {cities.map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Hotel Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          value={hotelForm.name}
                          onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                          placeholder="Enter hotel name"
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Address <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={hotelForm.address}
                          onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                          placeholder="Enter full address"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Category</Form.Label>
                        <Form.Select
                          value={hotelForm.category}
                          onChange={(e) => setHotelForm({ ...hotelForm, category: e.target.value })}
                        >
                          {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Distance (KM)</Form.Label>
                        <Form.Control
                          type="text"
                          value={hotelForm.distance}
                          onChange={(e) => setHotelForm({ ...hotelForm, distance: e.target.value })}
                          placeholder="e.g., 0.5"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Walking Time (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          value={hotelForm.walking_time}
                          onChange={(e) => setHotelForm({ ...hotelForm, walking_time: e.target.value })}
                          placeholder="e.g., 6"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2} className="d-flex align-items-center">
                      <Form.Check
                        type="checkbox"
                        label={<span className="fw-medium">Active</span>}
                        checked={hotelForm.is_active}
                        onChange={(e) => setHotelForm({ ...hotelForm, is_active: e.target.checked })}
                      />
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Contact Number</Form.Label>
                        <Form.Control
                          type="tel"
                          value={hotelForm.contact_number}
                          onChange={(e) => setHotelForm({ ...hotelForm, contact_number: e.target.value })}
                          placeholder="+92 XXX XXXXXXX"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Google Location Link</Form.Label>
                        <Form.Control
                          type="url"
                          value={hotelForm.google_location}
                          onChange={(e) => setHotelForm({ ...hotelForm, google_location: e.target.value })}
                          placeholder="https://maps.google.com/..."
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Available From</Form.Label>
                        <Form.Control
                          type="date"
                          value={hotelForm.available_start_date}
                          onChange={(e) => setHotelForm({ ...hotelForm, available_start_date: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Available Until</Form.Label>
                        <Form.Control
                          type="date"
                          value={hotelForm.available_end_date}
                          onChange={(e) => setHotelForm({ ...hotelForm, available_end_date: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    {/* Contact Details */}
                    <Col xs={12}>
                      <Form.Label className="fw-medium">Contact Details</Form.Label>
                      {contactDetails.map((c, idx) => (
                        <Row className="g-2 mb-2" key={idx}>
                          <Col md={5}>
                            <Form.Control
                              placeholder="Contact Person"
                              value={c.contact_person}
                              onChange={(e) => {
                                const copy = [...contactDetails];
                                copy[idx].contact_person = e.target.value;
                                setContactDetails(copy);
                              }}
                            />
                          </Col>
                          <Col md={5}>
                            <Form.Control
                              placeholder="Contact Number"
                              value={c.contact_number}
                              onChange={(e) => {
                                const copy = [...contactDetails];
                                copy[idx].contact_number = e.target.value;
                                setContactDetails(copy);
                              }}
                            />
                          </Col>
                          <Col md={2} className="d-flex align-items-center">
                            <Button variant="danger" size="sm" onClick={() => {
                              if (contactDetails.length === 1) return;
                              const copy = contactDetails.filter((_, i) => i !== idx);
                              setContactDetails(copy);
                            }}>Remove</Button>
                          </Col>
                        </Row>
                      ))}
                      <Button size="sm" onClick={() => setContactDetails([...contactDetails, { contact_person: "", contact_number: "" }])}>Add Contact</Button>
                    </Col>

                    {/* Price Sections (renamed per-request to numbered Hotel Price entries) */}
                    <Col xs={12}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label className="fw-medium mb-0">Hotel Prices</Form.Label>
                            <Button size="sm" onClick={() => setPriceSections([...priceSections, { start_date: "", end_date: "", room_type: "double", price: "", purchase_price: "", bed_prices: [] }])} style={{ backgroundColor: '#1B78CE', border: 'none', color: '#fff' }} title="Add another hotel price">+ Add Hotel Price</Button>
                          </div>

                      {priceSections.map((p, idx) => (
                        <div key={idx} className="mb-3 p-2 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #eee' }}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Hotel Price {idx + 1}</strong>
                            <Button size="sm" variant="outline-danger" onClick={() => { if (priceSections.length === 1) return; setPriceSections(priceSections.filter((_, i) => i !== idx)); }}>Remove</Button>
                          </div>

                          <Row className="g-2 align-items-center">
                            <Col md={4}><Form.Control type="date" value={p.start_date} onChange={(e) => { const copy = [...priceSections]; copy[idx].start_date = e.target.value; setPriceSections(copy); }} /></Col>
                            <Col md={4}><Form.Control type="date" value={p.end_date} onChange={(e) => { const copy = [...priceSections]; copy[idx].end_date = e.target.value; setPriceSections(copy); }} /></Col>
                            <Col md={4}><Form.Select value={p.room_type} onChange={(e) => { const copy = [...priceSections]; copy[idx].room_type = e.target.value; setPriceSections(copy); }}>{roomTypes.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}</Form.Select></Col>
                          </Row>
                          <Row className="g-2 mt-2">
                            <Col xs={12} className="mb-2"><strong>Only-Room Price</strong></Col>
                            <Col md={6}><Form.Control type="number" placeholder="Selling Price (SAR)" value={p.price} onChange={(e) => { const copy = [...priceSections]; copy[idx].price = e.target.value; setPriceSections(copy); }} /></Col>
                            <Col md={6}><Form.Control type="number" placeholder="Purchase Price (SAR)" value={p.purchase_price} onChange={(e) => { const copy = [...priceSections]; copy[idx].purchase_price = e.target.value; setPriceSections(copy); }} /></Col>
                          </Row>

                          {/* Bed-specific prices within this price section */}
                          {(p.bed_prices || []).map((bp, bidx) => (
                            <Row key={bidx} className="g-2 align-items-center mt-2">
                              <Col md={4}>
                                <Form.Select value={bp.type} onChange={(e) => { const copy = [...priceSections]; copy[idx].bed_prices[bidx].type = e.target.value; setPriceSections(copy); }}>
                                  <option value="sharing">Sharing</option>
                                  <option value="single">Single Bed</option>
                                  <option value="double">Double Bed</option>
                                  <option value="triple">Triple Bed</option>
                                  <option value="quad">Quad Bed</option>
                                  <option value="quint">Quint Bed</option>
                                </Form.Select>
                              </Col>
                              <Col md={4}><Form.Control type="number" placeholder="Selling Price (SAR)" value={bp.price} onChange={(e) => { const copy = [...priceSections]; copy[idx].bed_prices[bidx].price = e.target.value; setPriceSections(copy); }} /></Col>
                              <Col md={3}><Form.Control type="number" placeholder="Purchase Price (SAR)" value={bp.purchase_price} onChange={(e) => { const copy = [...priceSections]; copy[idx].bed_prices[bidx].purchase_price = e.target.value; setPriceSections(copy); }} /></Col>
                              <Col md={1} className="d-flex">
                                <Button size="sm" variant="danger" onClick={() => { const copy = [...priceSections]; copy[idx].bed_prices = copy[idx].bed_prices.filter((_, i) => i !== bidx); setPriceSections(copy); }}>Remove</Button>
                              </Col>
                            </Row>
                          ))}

                          <div className="d-flex gap-3 mt-2">
                            <Button size="sm" className="" onClick={() => {
                              const copy = [...priceSections];
                              copy[idx].bed_prices = copy[idx].bed_prices ? [...copy[idx].bed_prices, { type: 'sharing', price: '', purchase_price: '' }] : [{ type: 'sharing', price: '', purchase_price: '' }];
                              setPriceSections(copy);
                            }} style={{ backgroundColor: '#1B78CE', border: 'none', color: '#fff' }}>+ Add Bed Type</Button>
                          </div>
                        </div>
                      ))}
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Photos</Form.Label>
                        <Form.Control type="file" accept="image/*" multiple onChange={(e) => setPhotoFiles(Array.from(e.target.files))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Video</Form.Label>
                        <Form.Control type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="d-flex align-items-center">
                      <Form.Check type="checkbox" label={<span className="fw-medium">Allow Reselling</span>} checked={resellingAllowed} onChange={(e) => setResellingAllowed(e.target.checked)} />
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Status</Form.Label>
                        <Form.Select value={hotelStatus} onChange={(e) => setHotelStatus(e.target.value)}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                          <option value="maintenance">Maintenance</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Tab>
              <Tab eventKey="rooms" title={`Rooms (${rooms.length})`}>
                <div>
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <h6>Rooms Builder</h6>
                    <div>
                      <Button size="sm" onClick={addRoom} className="me-2" style={{ backgroundColor: '#1B78CE', border: 'none' }}>Add Room</Button>
                      <Button size="sm" variant="outline-secondary" onClick={() => setRooms([])}>Clear All</Button>
                    </div>
                  </div>

                  {rooms.length === 0 && (
                    <div className="text-muted">No rooms added yet. Click "Add Room" to create room entries.</div>
                  )}

                  {rooms.map((r, ri) => (
                    <Card key={`room-${ri}`} className="mb-2">
                      <Card.Body>
                        <Row className="g-2">
                          <Col md={3}>
                            <Form.Select value={r.floor || "Ground Floor"} onChange={(e) => { const copy = [...rooms]; copy[ri].floor = e.target.value; setRooms(copy); }}>
                              <option value="Ground Floor">Ground Floor</option>
                              <option value="1st Floor">1st Floor</option>
                              <option value="2nd Floor">2nd Floor</option>
                              <option value="3rd Floor">3rd Floor</option>
                              <option value="4th Floor">4th Floor</option>
                              <option value="5th Floor">5th Floor</option>
                              <option value="6th Floor">6th Floor</option>
                              <option value="7th Floor">7th Floor</option>
                              <option value="8th Floor">8th Floor</option>
                              <option value="9th Floor">9th Floor</option>
                              <option value="10th Floor">10th Floor</option>
                            </Form.Select>
                          </Col>
                          <Col md={3}>
                            <Form.Control placeholder="Room No" value={r.room_no} onChange={(e) => { const copy = [...rooms]; copy[ri].room_no = e.target.value; setRooms(copy); }} />
                          </Col>
                          <Col md={3}>
                            <Form.Select value={r.room_type} onChange={(e) => { const copy = [...rooms]; const newType = e.target.value; copy[ri].room_type = newType; const found = roomTypes.find(rt => rt.value === newType); if (found) copy[ri].capacity = found.capacity; setRooms(copy); }}>
                              {roomTypes
                                .filter(rt => {
                                  if (rt.value === r.room_type) return true;
                                  return !rooms.some((other, idx) => idx !== ri && other.room_type === rt.value);
                                })
                                .map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                            </Form.Select>
                          </Col>
                          <Col md={2}>
                            <Form.Select value={r.status || 'available'} onChange={(e) => { const copy = [...rooms]; copy[ri].status = e.target.value; setRooms(copy); }}>
                              {roomStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                          </Col>
                          <Col md={1} className="d-flex align-items-center">
                            <Button variant="danger" size="sm" onClick={() => removeRoom(ri)}>Remove</Button>
                          </Col>
                        </Row>

                        <hr />
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Beds ({(r.details || []).length})</strong>
                            <div>
                              <Button size="sm" onClick={() => addBedToRoom(ri)} className="me-2" style={{ backgroundColor: '#1B78CE', border: 'none' }}>Add Bed</Button>
                              <Button size="sm" variant="outline-secondary" onClick={() => { const copy = [...rooms]; copy[ri].details = []; setRooms(copy); }}>Clear Beds</Button>
                            </div>
                          </div>

                          {(r.details || []).map((b, bi) => (
                            <Row className="g-2 mb-2" key={`bed-${ri}-${bi}`}>
                              <Col md={6}>
                                <Form.Control placeholder="Bed No" value={b.bed_no} onChange={(e) => { const copy = [...rooms]; copy[ri].details[bi].bed_no = e.target.value; setRooms(copy); }} />
                              </Col>
                              <Col md={4} className="d-flex align-items-center">
                                <Form.Check type="checkbox" label="Assigned" checked={!!b.is_assigned} onChange={(e) => { const copy = [...rooms]; copy[ri].details[bi].is_assigned = e.target.checked; setRooms(copy); }} />
                              </Col>
                              <Col md={2} className="d-flex align-items-center">
                                <Button variant="danger" size="sm" onClick={() => removeBedFromRoom(ri, bi)}>Remove</Button>
                              </Col>
                            </Row>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              <X size={18} className="me-1" />
              Cancel
            </Button>
            <Button 
              style={{ backgroundColor: "#1B78CE", border: "none" }}
              onClick={handleEditHotel}
            >
              <Save size={18} className="me-1" />
              Update Hotel
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <AlertCircle size={24} className="me-2 text-danger" />
              Confirm Delete
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete <strong>{selectedHotel?.name}</strong>?</p>
            <Alert variant="warning" className="mb-0">
              <AlertCircle size={18} className="me-2" />
              This action cannot be undone. All associated rooms and bookings will also be affected.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteHotel}>
              <Trash2 size={18} className="me-1" />
              Delete Hotel
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Hotel Availability Modal with Floor Maps */}
        <Modal show={showAvailabilityModal} onHide={() => setShowAvailabilityModal(false)} size="xl" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <BedDouble size={24} className="me-2" />
              Hotel Availability - {selectedHotel?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {/* Date Range Selector */}
            <Row className="mb-4">
              <Col md={5}>
                <Form.Group>
                  <Form.Label>From Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.date_from}
                    onChange={(e) => setDateRange({ ...dateRange, date_from: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label>To Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.date_to}
                    onChange={(e) => setDateRange({ ...dateRange, date_to: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button 
                  variant="primary" 
                  className="w-100"
                  onClick={() => fetchHotelAvailability(selectedHotel.id)}
                >
                  <Search size={18} className="me-1" />
                  Search
                </Button>
              </Col>
            </Row>

            {availabilityLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading availability data...</p>
              </div>
            ) : hotelAvailability ? (
              <>
                {/* Summary Statistics */}
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <h6 className="text-muted">Total Rooms</h6>
                        <h3 className="mb-0 text-primary">{hotelAvailability.total_rooms}</h3>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <h6 className="text-muted">Available Rooms</h6>
                        <h3 className="mb-0 text-success">{hotelAvailability.available_rooms}</h3>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <h6 className="text-muted">Available Beds</h6>
                        <h3 className="mb-0 text-info">{hotelAvailability.available_beds}</h3>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 shadow-sm text-center">
                      <Card.Body>
                        <h6 className="text-muted">Occupied Rooms</h6>
                        <h3 className="mb-0 text-danger">{hotelAvailability.occupied_rooms}</h3>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Room Type Summary */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Room Type Breakdown</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {hotelAvailability['total_double-rooms'] && (
                        <Col md={3} className="mb-3">
                          <div className="p-3 rounded" style={{ backgroundColor: "#e3f2fd" }}>
                            <strong>Double Rooms</strong>
                            <div className="mt-2">
                              <Badge bg="secondary" className="me-2">Total: {hotelAvailability['total_double-rooms']}</Badge>
                              <Badge bg="success">Available: {hotelAvailability['available_double-rooms']}</Badge>
                            </div>
                          </div>
                        </Col>
                      )}
                      {hotelAvailability['total_Triple-rooms'] && (
                        <Col md={3} className="mb-3">
                          <div className="p-3 rounded" style={{ backgroundColor: "#e8f5e9" }}>
                            <strong>Triple Rooms</strong>
                            <div className="mt-2">
                              <Badge bg="secondary" className="me-2">Total: {hotelAvailability['total_Triple-rooms']}</Badge>
                              <Badge bg="success">Available: {hotelAvailability['available_Triple-rooms']}</Badge>
                            </div>
                          </div>
                        </Col>
                      )}
                      {hotelAvailability['total_quad-rooms'] && (
                        <Col md={3} className="mb-3">
                          <div className="p-3 rounded" style={{ backgroundColor: "#fff3e0" }}>
                            <strong>Quad Rooms</strong>
                            <div className="mt-2">
                              <Badge bg="secondary" className="me-2">Total: {hotelAvailability['total_quad-rooms']}</Badge>
                              <Badge bg="success">Available: {hotelAvailability['available_quad-rooms']}</Badge>
                            </div>
                          </div>
                        </Col>
                      )}
                      {hotelAvailability['total_quint-rooms'] && (
                        <Col md={3} className="mb-3">
                          <div className="p-3 rounded" style={{ backgroundColor: "#fce4ec" }}>
                            <strong>Quint Rooms</strong>
                            <div className="mt-2">
                              <Badge bg="secondary" className="me-2">Total: {hotelAvailability['total_quint-rooms']}</Badge>
                              <Badge bg="success">Available: {hotelAvailability['available_quint-rooms']}</Badge>
                            </div>
                          </div>
                        </Col>
                      )}
                      {hotelAvailability['available_sharing-beds'] && (
                        <Col md={3} className="mb-3">
                          <div className="p-3 rounded" style={{ backgroundColor: "#f3e5f5" }}>
                            <strong>Sharing Beds</strong>
                            <div className="mt-2">
                              <Badge bg="success">Available: {hotelAvailability['available_sharing-beds']}</Badge>
                            </div>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>

                {/* Floor-wise Room Details */}
                {hotelAvailability.floors && hotelAvailability.floors.length > 0 ? (
                  <Tabs defaultActiveKey="floor-0" className="mb-3">
                    {hotelAvailability.floors.map((floor, index) => (
                      <Tab 
                        eventKey={`floor-${index}`} 
                        title={`Floor ${floor.floor_no}`}
                        key={index}
                      >
                        <Card className="border-0 shadow-sm">
                          {floor.floor_map_url && (
                            <Card.Header className="bg-light">
                              <div className="d-flex justify-content-between align-items-center">
                                <h6 className="mb-0">Floor {floor.floor_no} Layout</h6>
                                <a 
                                  href={floor.floor_map_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  View Full Map
                                </a>
                              </div>
                              {floor.floor_map_url && (
                                <div className="mt-3">
                                  <img 
                                    src={floor.floor_map_url} 
                                    alt={`Floor ${floor.floor_no} Map`}
                                    style={{ width: "100%", maxHeight: "300px", objectFit: "contain" }}
                                    className="rounded"
                                  />
                                </div>
                              )}
                            </Card.Header>
                          )}
                          <Card.Body>
                            <h6 className="mb-3">Rooms on Floor {floor.floor_no}</h6>
                            <div style={{ overflowX: "auto" }}>
                              <Table hover bordered responsive>
                                <thead style={{ backgroundColor: "#f8f9fa" }}>
                                  <tr>
                                    <th>Room No</th>
                                    <th>Type</th>
                                    <th>Capacity</th>
                                    <th>Available Beds</th>
                                    <th>Status</th>
                                    <th>Guest Names</th>
                                    <th>Check-in</th>
                                    <th>Check-out</th>
                                    <th>Booking ID</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {floor.rooms.map((room) => (
                                    <tr key={room.room_id}>
                                      <td><strong>{room.room_no}</strong></td>
                                      <td>
                                        <Badge bg="info">{room.room_type}</Badge>
                                      </td>
                                      <td>
                                        <Users size={16} className="me-1" />
                                        {room.capacity}
                                      </td>
                                      <td>
                                        <BedDouble size={16} className="me-1" />
                                        {room.available_beds}
                                      </td>
                                      <td>{getRoomStatusBadge(room.status)}</td>
                                      <td>
                                        {room.guest_names && room.guest_names.length > 0 ? (
                                          <ul className="mb-0 ps-3">
                                            {room.guest_names.map((name, idx) => (
                                              <li key={idx}>{name}</li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <span className="text-muted">-</span>
                                        )}
                                      </td>
                                      <td>
                                        {room.checkin_date ? (
                                          <small>
                                            <Calendar size={14} className="me-1" />
                                            {new Date(room.checkin_date).toLocaleDateString()}
                                          </small>
                                        ) : (
                                          <span className="text-muted">-</span>
                                        )}
                                      </td>
                                      <td>
                                        {room.checkout_date ? (
                                          <small>
                                            <Calendar size={14} className="me-1" />
                                            {new Date(room.checkout_date).toLocaleDateString()}
                                          </small>
                                        ) : (
                                          <span className="text-muted">-</span>
                                        )}
                                      </td>
                                      <td>
                                        {room.current_booking_id ? (
                                          <Badge bg="secondary">#{room.current_booking_id}</Badge>
                                        ) : (
                                          <span className="text-muted">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          </Card.Body>
                        </Card>
                      </Tab>
                    ))}
                  </Tabs>
                ) : (
                  <Alert variant="info">
                    <AlertCircle size={20} className="me-2" />
                    No floor or room data available for the selected date range.
                  </Alert>
                )}
              </>
            ) : (
              <Alert variant="info">
                <AlertCircle size={20} className="me-2" />
                Select a date range and click Search to view availability.
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAvailabilityModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View Hotel Details Modal */}
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="xl" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <Eye size={24} className="me-2" />
              Hotel Details - {selectedHotel?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedHotel && (
              <Tabs defaultActiveKey="details" className="mb-3">
                <Tab eventKey="details" title="Hotel Details">
                  <div className="mt-3">
                    <Row className="mb-3">
                      <Col md={6}>
                        <strong>Hotel Name:</strong>
                        <p>{selectedHotel.name}</p>
                      </Col>
                      <Col md={6}>
                        <strong>City:</strong>
                        <p>{selectedHotel?.city_name ? selectedHotel.city_name : getCityName(selectedHotel?.city)}</p>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={12}>
                        <strong>Address:</strong>
                        <p>{selectedHotel.address}</p>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={6}>
                        <strong>Category:</strong>
                        <p>{getCategoryBadge(selectedHotel.category)}</p>
                      </Col>
                      <Col md={6}>
                        <strong>Distance:</strong>
                        <p>{selectedHotel.distance || "N/A"}</p>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={6}>
                        <strong>Contact:</strong>
                        <p>{selectedHotel.contact_number || "N/A"}</p>
                      </Col>
                      <Col md={6}>
                        <strong>Status:</strong>
                        <p>
                          {selectedHotel.is_active ? (
                            <Badge bg="success">Active</Badge>
                          ) : (
                            <Badge bg="danger">Inactive</Badge>
                          )}
                        </p>
                      </Col>
                    </Row>
                    {selectedHotel.available_start_date && (
                      <Row className="mb-3">
                        <Col md={12}>
                          <strong>Availability:</strong>
                          <p>
                            {new Date(selectedHotel.available_start_date).toLocaleDateString()} - {new Date(selectedHotel.available_end_date).toLocaleDateString()}
                          </p>
                        </Col>
                      </Row>
                    )}
                    {selectedHotel.google_location && (
                      <Row className="mb-3">
                        <Col md={12}>
                          <strong>Location:</strong>
                          <p>
                            <a href={selectedHotel.google_location} target="_blank" rel="noopener noreferrer">
                              View on Google Maps
                            </a>
                          </p>
                        </Col>
                      </Row>
                    )}
                  </div>
                </Tab>
                <Tab eventKey="roommap" title="Room & Bed Map">
                  <div className="mt-3">
                    {/* Read-only view of room & bed map inside the details modal. Editing is done via Edit Hotel -> Rooms tab. */}
                    <RoomMapManager hotelId={selectedHotel.id} onSaved={() => setShowViewModal(false)} readOnly={true} />
                  </div>
                </Tab>
              </Tabs>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
    
    <style>{`
      @media (max-width: 991.98px) {
        .page-container {
          flex-direction: column !important;
        }
        .content-wrapper {
          width: 100% !important;
        }
      }
    `}</style>
    </>
  );
};

export default HotelAvailabilityManager;
