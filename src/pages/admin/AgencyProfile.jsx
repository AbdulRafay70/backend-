import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Badge, Modal, Alert, Tabs, Tab, Spinner } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { 
  Building2, Phone, Mail, Calendar, MessageSquare, TrendingUp, 
  AlertTriangle, CheckCircle, XCircle, Clock, Users, Briefcase,
  FileText, Edit, Trash2, Plus, Search, Filter, Eye, Star,
  ThumbsUp, ThumbsDown, BarChart3, PieChart, Activity
} from "lucide-react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getAgencies, getAgencyProfile, createAgency } from "../../services/agencyService";
import api from "../../utils/Api";

// Lightweight JWT decoder used across components
const decodeJwt = (token) => {
  if (!token || typeof token !== "string") return {};
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const jsonPayload = decodeURIComponent(
      Array.prototype.map
        .call(binary, (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e2) {
      return {};
    }
  }
};

const AgencyProfile = () => {
  const { id } = useParams(); // route param from /agency-profile/:id
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState("create"); // "create" or "update"
  const [profileAgency, setProfileAgency] = useState(null); // Agency for which we're creating/updating profile
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [activeTab, setActiveTab] = useState("overview");

  // Form states
  const [historyForm, setHistoryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "discussion",
    note: ""
  });

  const [conflictForm, setConflictForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: "",
    resolved: false,
    resolution_note: ""
  });

  const [communicationForm, setCommunicationForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "email",
    by: "Admin",
    message: ""
  });

  const [companyForm, setCompanyForm] = useState({
    organization_id: "",
    organization_name: "",
    work_type: []
  });

  const [profileForm, setProfileForm] = useState({
    relationship_status: "active",
    relation_history: [],
    working_with_companies: [],
    performance_summary: {
      total_bookings: 0,
      on_time_payments: 0,
      late_payments: 0,
      disputes: 0,
      remarks: ""
    },
    recent_communication: [],
    conflict_history: []
  });

  const [newAgencyForm, setNewAgencyForm] = useState({
    name: "",
    ageny_name: "",
    phone_number: "",
    email: "",
    address: "",
    branch: "", // branch will be taken from logged-in user if available
    agreement_status: true,
    logo: null,
    agency_type: "Area Agency"
  });



  const [branches, setBranches] = useState([]);

  // Relationship types with colors
  const relationshipTypes = {
    discussion: { label: "Discussion", color: "#0dcaf0", icon: MessageSquare },
    meeting: { label: "Meeting", color: "#198754", icon: Users },
    conflict: { label: "Conflict", color: "#dc3545", icon: AlertTriangle },
    payment: { label: "Payment", color: "#ffc107", icon: TrendingUp },
    update: { label: "Update", color: "#6c757d", icon: FileText }
  };

  // Status colors
  const statusColors = {
    active: { bg: "#d1fae5", text: "#065f46", icon: CheckCircle },
    inactive: { bg: "#fee2e2", text: "#991b1b", icon: XCircle },
    risky: { bg: "#fef3c7", text: "#92400e", icon: AlertTriangle },
    dispute: { bg: "#fecaca", text: "#7f1d1d", icon: AlertTriangle }
  };

  // Fetch agencies list and branches on mount
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch agencies
        const agencyData = await getAgencies();
        if (!mounted) return;
        // Debug: log the raw agencies payload so we can inspect shape during development
        // eslint-disable-next-line no-console
        console.debug("getAgencies response:", agencyData);
        setAgencies(Array.isArray(agencyData) ? agencyData : agencyData.results || []);
        
        // Fetch branches for dropdown
        const branchesData = await api.get("/branches/").then(r => r.data);
        if (!mounted) return;
        setBranches(Array.isArray(branchesData) ? branchesData : branchesData.results || []);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load data:", err);
        setError(err.message || "Failed to load data");
        showAlert("danger", "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  // If route has :id param, auto-load that agency
  useEffect(() => {
    if (id && agencies.length > 0) {
      loadAgencyProfile(parseInt(id, 10));
    }
  }, [id, agencies]);

  // Support navigation via location.state (e.g., from BranchesDetails)
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const agencyId = location?.state?.agencyId;
    const action = location?.state?.action;
    if (!agencyId) return;
    if (agencies.length === 0) return; // wait until agencies loaded

    // Load the profile for the agency passed in navigation state
    (async () => {
      try {
        await loadAgencyProfile(Number(agencyId));
        if (action === 'edit') {
          // open edit modal after profile loads
          const agency = agencies.find(a => Number(a.id) === Number(agencyId)) || null;
          if (agency) openProfileModal(agency, 'update');
        }
      } catch (e) {
        // ignore; loadAgencyProfile handles alerts
      } finally {
        // clear navigation state so it doesn't re-trigger on refresh
        try { navigate(location.pathname, { replace: true, state: null }); } catch (e) {}
      }
    })();
  }, [location, agencies]);

  const loadAgencyProfile = async (agencyId) => {
    setLoading(true);
    try {
      console.debug('loadAgencyProfile called with agencyId:', agencyId);
      // Step 1: Get basic agency info from list
      const agency = agencies.find(a => a.id === agencyId);
      if (!agency) {
        showAlert("warning", "Agency not found");
        setLoading(false);
        return;
      }

      // Step 2: Fetch detailed profile from second API
      const profileData = await getAgencyProfile(agencyId);
      console.debug('loadAgencyProfile - profileData received:', profileData);
      
      // Step 3: Fetch agency users based on user IDs in agency data
      let usersData = [];
      if (agency.user && agency.user.length > 0) {
        try {
          // Fetch all users from the API
          const usersResponse = await api.get("/users/");
          const allUsers = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.results || [];
          
          // Filter users whose ID is in the agency's user array
          usersData = allUsers.filter(user => agency.user.includes(user.id));
          
          console.log(`Found ${usersData.length} users for agency ${agencyId}`);
        } catch (error) {
          console.error("Failed to fetch users:", error.message);
        }
      }
      
      // Step 4: Merge all responses
      // Spread the profileData so we display whatever the API returns in the main content.
      // Provide safe defaults for nested fields the UI expects.
      // Normalize ids to numeric values where possible
      const canonicalId = Number((profileData && (profileData.agency || profileData.agency_id || profileData.id)) || agency.id || agency.pk || agency.agency_id) || null;
      const canonicalAgencyId = Number((profileData && (profileData.agency || profileData.agency_id || profileData.id)) || agency.agency_id || agency.id || agency.pk) || null;

      setSelectedAgency({
        ...agency,
        id: canonicalId,
        agency_id: canonicalAgencyId,
        // Spread profile data (API 2) to avoid missing fields
        ...(profileData || {}),
        // Ensure arrays/objects the UI expects are present
        relation_history: (profileData && profileData.relation_history) || (profileData && profileData.relation_history === null ? [] : profileData?.relation_history) || [],
        working_with_companies: (profileData && profileData.working_with_companies) || [],
        performance_summary: (profileData && profileData.performance_summary) || {
          total_bookings: 0,
          on_time_payments: 0,
          late_payments: 0,
          disputes: 0,
          remarks: "No performance data available."
        },
        recent_communication: (profileData && profileData.recent_communication) || [],
        conflict_history: (profileData && profileData.conflict_history) || [],
        // Attach users: prefer users returned in profileData, otherwise fall back to resolved usersData
        users: (profileData && profileData.users) || usersData
      });
      console.debug('selectedAgency after merge:', {
        id: canonicalId,
        agency_id: canonicalAgencyId,
        relation_history: (profileData && profileData.relation_history) || [],
        working_with_companies: (profileData && profileData.working_with_companies) || [],
        performance_summary: (profileData && profileData.performance_summary) || {},
        recent_communication: (profileData && profileData.recent_communication) || [],
        conflict_history: (profileData && profileData.conflict_history) || [],
        users: (profileData && profileData.users) || usersData
      });
      
      showAlert("success", "Agency profile loaded successfully!");
      // If a query param 'action=edit' is present, open the edit modal for this agency
      try {
        const params = new URLSearchParams(location.search);
        const qAction = params.get('action');
        if (qAction === 'edit') {
          const agencyObj = agencies.find(a => Number(a.id) === Number(agencyId)) || null;
          if (agencyObj) {
            openProfileModal(agencyObj, 'update');
          }
        }
      } catch (e) {
        // ignore URL parsing errors
      }
    } catch (error) {
      console.error("Error loading agency profile:", error);
      const status = error?.response?.status;
      // If profile endpoint returns 404, fall back to showing basic agency info and prompt creation
      if (status === 404) {
        // Find basic agency record
        const agency = agencies.find(a => a.id === agencyId) || { id: agencyId };
        setSelectedAgency({
          ...agency,
          // minimal defaults so UI sections render
          relation_history: [],
          working_with_companies: [],
          performance_summary: {
            total_bookings: 0,
            on_time_payments: 0,
            late_payments: 0,
            disputes: 0,
            remarks: "No performance data available."
          },
          recent_communication: [],
          conflict_history: [],
          users: [],
          profileMissing: true
        });
        // If query param asks to edit, open create/update modal even when profile is missing
        try {
          const params = new URLSearchParams(location.search);
          const qAction = params.get('action');
          if (qAction === 'edit') {
            const agencyObj = agencies.find(a => Number(a.id) === Number(agencyId)) || { id: agencyId };
            openProfileModal(agencyObj, 'update');
          }
        } catch (e) {}
        showAlert("warning", "Agency profile not found — showing basic agency info. Please create the profile.");
      } else {
        showAlert("danger", `Failed to load agency profile: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddHistory = async () => {
    if (!historyForm.note) {
      showAlert("warning", "Please enter a note");
      return;
    }

    if (!selectedAgency) {
      showAlert("danger", "No agency selected");
      return;
    }

    try {
      setLoading(true);

      // Add new history entry to the beginning of the array
      const updatedHistory = [historyForm, ...(selectedAgency.relation_history || [])];

      // Update the profile via PUT API
      // Determine canonical agency id to send (defensive: prefer selectedAgency, then profileAgency)
      const targetAgencyId_history = Number(selectedAgency?.agency || selectedAgency?.agency_id || selectedAgency?.id || profileAgency?.agency || profileAgency?.id || 0) || 0;
      const profileData = {
        agency_id: targetAgencyId_history,
        relationship_status: selectedAgency.relationship_status || "active",
        relation_history: updatedHistory,
        working_with_companies: selectedAgency.working_with_companies || [],
        performance_summary: selectedAgency.performance_summary || {
          total_bookings: 0,
          on_time_payments: 0,
          late_payments: 0,
          disputes: 0,
          remarks: ""
        },
        recent_communication: selectedAgency.recent_communication || [],
        conflict_history: selectedAgency.conflict_history || []
      };

      console.debug('Posting updated history profileData (targetAgencyId):', targetAgencyId_history, profileData, { selectedAgency, profileAgency });
      await api.post("/agency/profile", profileData);

      // Update local state
      const updatedProfile = {
        ...selectedAgency,
        relation_history: updatedHistory
      };

      setSelectedAgency(updatedProfile);
      setHistoryForm({ date: new Date().toISOString().split('T')[0], type: "discussion", note: "" });
      setShowHistoryModal(false);
      showAlert("success", "Relationship history added and saved successfully!");
    } catch (error) {
      console.error("Error adding history:", error);
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error
        || (error.response?.data && JSON.stringify(error.response.data))
        || error.message 
        || "Failed to add history";
      showAlert("danger", `Failed to add history: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConflict = async () => {
    if (!conflictForm.reason) {
      showAlert("warning", "Please enter conflict reason");
      return;
    }

    if (!selectedAgency) {
      showAlert("danger", "No agency selected");
      return;
    }

    try {
      setLoading(true);

      // Add new conflict entry to the beginning of the array
      const updatedConflicts = [conflictForm, ...(selectedAgency.conflict_history || [])];

      // Update the profile via PUT API
      const targetAgencyId_conflict = Number(selectedAgency?.agency || selectedAgency?.agency_id || selectedAgency?.id || profileAgency?.agency || profileAgency?.id || 0) || 0;
      const profileData = {
        agency_id: targetAgencyId_conflict,
        relationship_status: selectedAgency.relationship_status || "active",
        relation_history: selectedAgency.relation_history || [],
        working_with_companies: selectedAgency.working_with_companies || [],
        performance_summary: selectedAgency.performance_summary || {
          total_bookings: 0,
          on_time_payments: 0,
          late_payments: 0,
          disputes: 0,
          remarks: ""
        },
        recent_communication: selectedAgency.recent_communication || [],
        conflict_history: updatedConflicts
      };

      console.debug('Posting updated conflicts profileData (targetAgencyId):', targetAgencyId_conflict, profileData, { selectedAgency, profileAgency });
      await api.post("/agency/profile", profileData);

      // Update local state
      const updatedProfile = {
        ...selectedAgency,
        conflict_history: updatedConflicts
      };

      setSelectedAgency(updatedProfile);
      setConflictForm({ date: new Date().toISOString().split('T')[0], reason: "", resolved: false, resolution_note: "" });
      setShowConflictModal(false);
      showAlert("success", "Conflict record added and saved successfully!");
    } catch (error) {
      console.error("Error adding conflict:", error);
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error
        || (error.response?.data && JSON.stringify(error.response.data))
        || error.message 
        || "Failed to add conflict";
      showAlert("danger", `Failed to add conflict: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommunication = async () => {
    if (!communicationForm.message) {
      showAlert("warning", "Please enter a message");
      return;
    }

    if (!selectedAgency) {
      showAlert("danger", "No agency selected");
      return;
    }

    try {
      setLoading(true);

      // Add type field (required by backend)
      const commWithType = {
        ...communicationForm,
        type: communicationForm.type || "email" // Default to email if not set
      };

      // Add new communication entry to the beginning of the array
      const updatedCommunications = [commWithType, ...(selectedAgency.recent_communication || [])];

      // Update the profile via PUT API
      const targetAgencyId_comm = Number(selectedAgency?.agency || selectedAgency?.agency_id || selectedAgency?.id || profileAgency?.agency || profileAgency?.id || 0) || 0;
      const profileData = {
        agency_id: targetAgencyId_comm,
        relationship_status: selectedAgency.relationship_status || "active",
        relation_history: selectedAgency.relation_history || [],
        working_with_companies: selectedAgency.working_with_companies || [],
        performance_summary: selectedAgency.performance_summary || {
          total_bookings: 0,
          on_time_payments: 0,
          late_payments: 0,
          disputes: 0,
          remarks: ""
        },
        recent_communication: updatedCommunications,
        conflict_history: selectedAgency.conflict_history || []
      };

      console.debug('Posting updated communications profileData (targetAgencyId):', targetAgencyId_comm, profileData, { selectedAgency, profileAgency });
      await api.post("/agency/profile", profileData);

      // Update local state
      const updatedProfile = {
        ...selectedAgency,
        recent_communication: updatedCommunications
      };

      setSelectedAgency(updatedProfile);
      setCommunicationForm({ date: new Date().toISOString().split('T')[0], type: "email", by: "Admin", message: "" });
      setShowCommunicationModal(false);
      showAlert("success", "Communication added and saved successfully!");
    } catch (error) {
      console.error("Error adding communication:", error);
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error
        || (error.response?.data && JSON.stringify(error.response.data))
        || error.message 
        || "Failed to add communication";
      showAlert("danger", `Failed to add communication: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async () => {
    if (!companyForm.organization_name) {
      showAlert("warning", "Please enter organization name");
      return;
    }

    if (!selectedAgency) {
      showAlert("danger", "No agency selected");
      return;
    }

    try {
      setLoading(true);

      // Add new company entry
      const newCompany = {
        organization_id: companyForm.organization_id || Date.now(), // Generate ID if not provided
        organization_name: companyForm.organization_name,
        work_type: companyForm.work_type
      };

      const updatedCompanies = [...(selectedAgency.working_with_companies || []), newCompany];

      // Update the profile via POST API — ensure we send the canonical agency id
      const targetAgencyId_company = Number(selectedAgency?.agency || selectedAgency?.agency_id || selectedAgency?.id || profileAgency?.agency || profileAgency?.id || 0) || 0;
      const profileData = {
        agency_id: targetAgencyId_company,
        relationship_status: selectedAgency.relationship_status || "active",
        relation_history: selectedAgency.relation_history || [],
        working_with_companies: updatedCompanies,
        performance_summary: selectedAgency.performance_summary || {
          total_bookings: 0,
          on_time_payments: 0,
          late_payments: 0,
          disputes: 0,
          remarks: ""
        },
        recent_communication: selectedAgency.recent_communication || [],
        conflict_history: selectedAgency.conflict_history || []
      };

      console.debug('Posting updated companies profileData (targetAgencyId):', targetAgencyId_company, profileData, { selectedAgency, profileAgency });
      await api.post("/agency/profile", profileData);

      // Update local state
      const updatedProfile = {
        ...selectedAgency,
        working_with_companies: updatedCompanies
      };

      setSelectedAgency(updatedProfile);
      setCompanyForm({ organization_id: "", organization_name: "", work_type: [] });
      setShowCompanyModal(false);
      showAlert("success", "Company added and saved successfully!");
    } catch (error) {
      console.error("Error adding company:", error);
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error
        || (error.response?.data && JSON.stringify(error.response.data))
        || error.message 
        || "Failed to add company";
      showAlert("danger", `Failed to add company: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgency = async () => {
    if (!newAgencyForm.name || !newAgencyForm.ageny_name || !newAgencyForm.phone_number) {
      showAlert("warning", "Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      
      // Use FormData for file upload support
      const formData = new FormData();
      
      // Required fields
      formData.append("name", newAgencyForm.name);
      // Determine branch from multiple possible places (selectedBranch, selectedOrganization, token)
      const getBranchFromContext = () => {
        try {
          // try selectedBranch object
          try {
            const sb = JSON.parse(localStorage.getItem("selectedBranch") || "null");
            if (sb && (sb.id || sb.branch_id || sb.branch)) return sb.id || sb.branch_id || sb.branch;
          } catch (e) { }

          // try selectedBranchId key
          const sbId = localStorage.getItem("selectedBranchId");
          if (sbId) return sbId;

          // try selectedOrganization
          try {
            const so = JSON.parse(localStorage.getItem("selectedOrganization") || "null");
            if (so && (so.branch_id || so.branch)) return so.branch_id || so.branch;
          } catch (e) { }

          // try to decode token
          const token = localStorage.getItem("accessToken");
          const decoded = decodeJwt(token || "");
          if (decoded) {
            if (decoded.branch_id) return decoded.branch_id;
            if (decoded.branch) return decoded.branch;
            if (decoded.branchId) return decoded.branchId;
            if (decoded.user && (decoded.user.branch || decoded.user.branch_id)) return decoded.user.branch || decoded.user.branch_id;
          }

          // fallback to form value
          return newAgencyForm.branch || null;
        } catch (e) {
          return newAgencyForm.branch || null;
        }
      };

      let selectedBranchId = getBranchFromContext();

      // If branch not found in localStorage/token, try fetching user's details from API
      if (!selectedBranchId) {
        const getUserIdFromContext = () => {
          try {
            try {
              const u = JSON.parse(localStorage.getItem("user") || "null");
              if (u && (u.id || u.pk)) return u.id || u.pk;
            } catch (e) { }
            const token = localStorage.getItem("accessToken");
            const decoded = decodeJwt(token || "");
            if (decoded) {
              if (decoded.user_id) return decoded.user_id;
              if (decoded.id) return decoded.id;
              if (decoded.user && (decoded.user.id || decoded.user.pk)) return decoded.user.id || decoded.user.pk;
            }
            return 0;
          } catch (e) { return 0; }
        };

        const userIdForLookup = getUserIdFromContext();
        if (userIdForLookup && Number(userIdForLookup) > 0) {
          try {
            const token = localStorage.getItem("accessToken");
            const resp = await api.get(`/users/${userIdForLookup}/`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const ud = resp.data || {};
            // try common properties for branch
            if (ud.branch || ud.branch_id) selectedBranchId = ud.branch || ud.branch_id;
            else if (Array.isArray(ud.branches) && ud.branches.length > 0) {
              // branches may be array of objects or ids
              const b = ud.branches[0];
              selectedBranchId = (typeof b === 'object') ? (b.id || b.branch_id || b.pk) : b;
            }
          } catch (e) {
            console.error('Failed to fetch user details for branch lookup', e);
          }
        }
      }

     

      formData.append("branch", selectedBranchId);

      // determine user id to send in payload; prefer stored user or token, fallback to 0
      const getUserIdFromContext = () => {
        try {
          try {
            const u = JSON.parse(localStorage.getItem("user") || "null");
            if (u && (u.id || u.pk)) return u.id || u.pk;
          } catch (e) { }
          const token = localStorage.getItem("accessToken");
          const decoded = decodeJwt(token || "");
          if (decoded) {
            if (decoded.user_id) return decoded.user_id;
            if (decoded.id) return decoded.id;
            if (decoded.user && (decoded.user.id || decoded.user.pk)) return decoded.user.id || decoded.user.pk;
          }
          return 0;
        } catch (e) { return 0; }
      };
      // do not include `user` in payload (backend will associate by branch/user context)
      
      // Optional fields - only append if they have values
      if (newAgencyForm.ageny_name) formData.append("ageny_name", newAgencyForm.ageny_name);
      if (newAgencyForm.phone_number) formData.append("phone_number", newAgencyForm.phone_number);
      if (newAgencyForm.email) formData.append("email", newAgencyForm.email);
      if (newAgencyForm.address) formData.append("address", newAgencyForm.address);
      if (newAgencyForm.agreement_status !== undefined) {
        formData.append("agreement_status", newAgencyForm.agreement_status);
      }

      // agency type
      if (newAgencyForm.agency_type) {
        formData.append("agency_type", newAgencyForm.agency_type);
      }
      
      // File upload - append logo if selected
      if (newAgencyForm.logo) {
        formData.append("logo", newAgencyForm.logo);
      }
      
      console.log("Sending FormData with fields:"); // Debug log
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // Use api directly with FormData - axios will set Content-Type automatically
      const response = await api.post("/agencies/", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      const newAgency = response.data;
      setAgencies([newAgency, ...agencies]);
      
      showAlert("success", "Agency added successfully!");
      
      // Reset form
      setNewAgencyForm({
        name: "",
        ageny_name: "",
        phone_number: "",
        email: "",
        address: "",
        branch: "",
        agreement_status: true,
        logo: null,
        agency_type: "Area Agency"
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding agency:", error);
      console.error("Error response:", error.response?.data); // More detailed error log
      
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error
        || (error.response?.data && JSON.stringify(error.response.data))
        || error.message 
        || "Failed to add agency";
      showAlert("danger", `Failed to add agency: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  const openProfileModal = (agency, mode = "create") => {
    setProfileAgency(agency);
    setProfileModalMode(mode);
    
    // If updating, pre-fill form with existing data
    if (mode === "update" && selectedAgency && selectedAgency.id === agency.id) {
      setProfileForm({
        relationship_status: selectedAgency.relationship_status || "active",
        relation_history: selectedAgency.relation_history || [],
        working_with_companies: selectedAgency.working_with_companies || [],
        performance_summary: selectedAgency.performance_summary || {
          total_bookings: 0,
          on_time_payments: 0,
          late_payments: 0,
          disputes: 0,
          remarks: ""
        },
        recent_communication: selectedAgency.recent_communication || [],
        conflict_history: selectedAgency.conflict_history || []
      });
    } else {
      // Reset form for new profile
      setProfileForm({
        relationship_status: "active",
        relation_history: [],
        working_with_companies: [],
        performance_summary: {
          total_bookings: 0,
          on_time_payments: 0,
          late_payments: 0,
          disputes: 0,
          remarks: "New profile"
        },
        recent_communication: [],
        conflict_history: []
      });
    }
    
    setShowProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (!profileAgency) {
      showAlert("danger", "No agency selected");
      return;
    }

    try {
      setLoading(true);
      
      // Determine canonical agency id for save
      const targetAgencyId_save = Number(selectedAgency?.agency || selectedAgency?.agency_id || selectedAgency?.id || profileAgency?.agency || profileAgency?.id || 0) || 0;
      const profileData = {
        agency_id: targetAgencyId_save,
        relationship_status: profileForm.relationship_status,
        relation_history: profileForm.relation_history,
        working_with_companies: profileForm.working_with_companies,
        performance_summary: profileForm.performance_summary,
        recent_communication: profileForm.recent_communication,
        conflict_history: profileForm.conflict_history
      };

      console.log("Saving agency profile (targetAgencyId):", targetAgencyId_save, profileData, { selectedAgency, profileAgency });
      
      // Check if token exists before making request
      const token = localStorage.getItem("accessToken");
      if (!token) {
        showAlert("danger", "No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      // Use POST for both create and update
      const response = await api.post("/agency/profile", profileData);

      console.log("Profile saved:", response.data);
      
      showAlert("success", `Agency profile ${profileModalMode === "create" ? "created" : "updated"} successfully!`);
      setShowProfileModal(false);
      
      // Reload the agency profile
      if (selectedAgency && selectedAgency.id === profileAgency.id) {
        await loadAgencyProfile(profileAgency.id);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      console.error("Error response:", error.response?.data);
      
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error
        || (error.response?.data && JSON.stringify(error.response.data))
        || error.message 
        || "Failed to save profile";
      showAlert("danger", `Failed to save profile: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = statusColors[status] || statusColors.active;
    const Icon = statusInfo.icon;
    return (
      <Badge 
        style={{ 
          backgroundColor: statusInfo.bg, 
          color: statusInfo.text,
          padding: "8px 16px",
          fontWeight: 500,
          fontSize: "14px"
        }}
      >
        <Icon size={16} style={{ marginRight: "6px" }} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRelationTypeIcon = (type) => {
    const typeInfo = relationshipTypes[type] || relationshipTypes.discussion;
    const Icon = typeInfo.icon;
    return <Icon size={20} style={{ color: typeInfo.color }} />;
  };

  const filteredAgencies = agencies.filter(agency => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (agency.ageny_name && agency.ageny_name.toLowerCase().includes(searchLower)) ||
      (agency.name && agency.name.toLowerCase().includes(searchLower)) ||
      (agency.email && agency.email.toLowerCase().includes(searchLower)) ||
      (agency.phone_number && agency.phone_number.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
    <div className="page-container" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Sidebar />
      <div className="content-wrapper" style={{ flex: 1, overflow: "auto" }}>
          <Header />
          
          <Container fluid className="p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1" style={{ fontWeight: 600, color: "#2c3e50" }}>
                  <Building2 size={32} className="me-2" style={{ color: "#1B78CE" }} />
                  Agency Relationship Management
                </h2>
                <p className="text-muted mb-0">View and manage agency profiles, relationships, and performance</p>
              </div>
            </div>

            {/* Alert */}
            {alert.show && (
              <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, type: "", message: "" })}>
                {alert.message}
              </Alert>
            )}

            {/* Rules widget removed */}

            <Row className="g-4">
              {/* Agencies List - Left Sidebar */}
              <Col lg={4}>
                <Card className="shadow-sm" style={{ border: "none", height: "calc(100vh - 220px)" }}>
                  <Card.Body className="p-0">
                    <div className="p-3 border-bottom" style={{ backgroundColor: "#f8f9fa" }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0" style={{ fontWeight: 600 }}>
                          <Users size={20} className="me-2" />
                          Agencies ({filteredAgencies.length})
                        </h5>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setShowAddModal(true)}
                          style={{ borderRadius: "8px" }}
                        >
                          <Plus size={16} className="me-1" />
                          Add
                        </Button>
                      </div>
                      <Form.Control
                        type="text"
                        placeholder="Search agencies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ borderRadius: "8px" }}
                      />
                    </div>

                    <div style={{ overflowY: "auto", height: "calc(100% - 140px)" }}>
                      {loading && !agencies.length ? (
                        <div className="text-center p-4">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-2 text-muted">Loading agencies...</p>
                        </div>
                      ) : error ? (
                        <div className="text-center p-4 text-danger">
                          <AlertTriangle size={32} className="mb-2" />
                          <p>{error}</p>
                        </div>
                      ) : filteredAgencies.length === 0 ? (
                        <div className="text-center p-4 text-muted">
                          <Building2 size={32} className="mb-2" />
                          <p>No agencies found</p>
                        </div>
                      ) : (
                        filteredAgencies.map((agency) => (
                          <div
                            key={agency.id}
                            onClick={() => loadAgencyProfile(agency.id)}
                            style={{
                              padding: "16px",
                              borderBottom: "1px solid #e9ecef",
                              cursor: "pointer",
                              backgroundColor: selectedAgency?.id === agency.id ? "#e3f2fd" : "white",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedAgency?.id === agency.id ? "#e3f2fd" : "white"}
                          >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-0" style={{ fontWeight: 600, color: "#2c3e50" }}>
                                  {agency.ageny_name || agency.name || "Unknown Agency"}
                                </h6>
                                {agency.branch_name && (
                                  <small className="text-muted">{agency.branch_name}</small>
                                )}
                              </div>
                              <div className="d-flex flex-column align-items-end">
                                {agency.agreement_status ? (
                                  <Badge bg="success" style={{ fontSize: "11px" }}>Active</Badge>
                                ) : (
                                  <Badge bg="secondary" style={{ fontSize: "11px" }}>Inactive</Badge>
                                )}
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 mt-1"
                                  style={{ fontSize: "11px", textDecoration: "none" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openProfileModal(agency, selectedAgency?.id === agency.id ? "update" : "create");
                                  }}
                                >
                                  <Edit size={12} className="me-1" />
                                  {selectedAgency?.id === agency.id && selectedAgency.relation_history?.length > 0 
                                    ? "Update Profile" 
                                    : "Create Profile"}
                                </Button>
                              </div>
                            </div>
                            <p className="mb-1 text-muted" style={{ fontSize: "14px" }}>
                              <Phone size={14} className="me-1" />
                              {agency.name}
                            </p>
                            <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>
                              {agency.phone_number || "No phone"}
                            </p>
                            {agency.email && (
                              <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                                <Mail size={12} className="me-1" />
                                {agency.email}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Agency Profile Details - Main Content */}
              <Col lg={8}>
                {loading && selectedAgency ? (
                  <Card className="shadow-sm" style={{ border: "none", height: "calc(100vh - 220px)" }}>
                    <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3 text-muted">Loading agency profile...</p>
                    </Card.Body>
                  </Card>
                ) : selectedAgency ? (
                  <div>
                    {/* Profile Header Card */}
                    <Card className="shadow-sm mb-4" style={{ border: "none" }}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex gap-3 align-items-start">
                            {selectedAgency.logo && (
                              <div className="d-flex align-items-center">
                                <img
                                  src={selectedAgency.logo}
                                  alt={selectedAgency.ageny_name || selectedAgency.name}
                                  style={{
                                    width: "80px",
                                    height: "80px",
                                    objectFit: "contain",
                                    borderRadius: "8px",
                                    border: "1px solid #e9ecef"
                                  }}
                                />
                                <a href={selectedAgency.logo} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary ms-2">View</a>
                              </div>
                            )}
                            <div>
                              <h3 style={{ fontWeight: 600, color: "#2c3e50" }}>
                                {selectedAgency.ageny_name || selectedAgency.name || "Unknown Agency"}
                              </h3>
                              <p className="text-muted mb-2">{selectedAgency.name}</p>
                              <div className="d-flex gap-3 flex-wrap">
                                {selectedAgency.phone_number && (
                                  <span className="text-muted">
                                    <Phone size={16} className="me-1" />
                                    {selectedAgency.phone_number}
                                  </span>
                                )}
                                {selectedAgency.email && (
                                  <span className="text-muted">
                                    <Mail size={16} className="me-1" />
                                    {selectedAgency.email}
                                  </span>
                                )}
                              </div>
                              {selectedAgency.profileMissing && (
                                <div className="mt-2">
                                  <Badge bg="warning" text="dark" style={{ padding: '6px 12px' }}>
                                    Profile Missing — Please create profile
                                  </Badge>
                                </div>
                              )}
                              {selectedAgency.address && (
                                <p className="text-muted mb-0 mt-2" style={{ fontSize: "14px" }}>
                                  📍 {selectedAgency.address}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-end">
                            {selectedAgency.agreement_status ? (
                              <Badge bg="success" style={{ padding: "8px 16px", fontSize: "14px" }}>
                                <CheckCircle size={16} className="me-1" />
                                Active Agreement
                              </Badge>
                            ) : (
                              <Badge bg="secondary" style={{ padding: "8px 16px", fontSize: "14px" }}>
                                <XCircle size={16} className="me-1" />
                                No Agreement
                              </Badge>
                            )}
                            <div className="mt-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                style={{ borderRadius: "8px" }}
                                onClick={() => openProfileModal(selectedAgency, selectedAgency?.relationship_status ? 'update' : 'create')}
                              >
                                <Edit size={16} className="me-1" />
                                {selectedAgency?.relationship_status ? 'Edit Profile' : 'Create Profile'}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Performance Summary Cards */}
                        <Row className="g-3">
                          <Col md={3}>
                            <div className="text-center p-3" style={{ backgroundColor: "#e3f2fd", borderRadius: "12px" }}>
                              <Briefcase size={24} style={{ color: "#1976d2", marginBottom: "8px" }} />
                              <h4 className="mb-0" style={{ color: "#1976d2", fontWeight: 600 }}>
                                {selectedAgency.performance_summary?.total_bookings || 0}
                              </h4>
                              <small className="text-muted">Total Bookings</small>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div className="text-center p-3" style={{ backgroundColor: "#d1fae5", borderRadius: "12px" }}>
                              <CheckCircle size={24} style={{ color: "#059669", marginBottom: "8px" }} />
                              <h4 className="mb-0" style={{ color: "#059669", fontWeight: 600 }}>
                                {selectedAgency.performance_summary?.on_time_payments || 0}
                              </h4>
                              <small className="text-muted">On-Time Payments</small>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div className="text-center p-3" style={{ backgroundColor: "#fef3c7", borderRadius: "12px" }}>
                              <Clock size={24} style={{ color: "#d97706", marginBottom: "8px" }} />
                              <h4 className="mb-0" style={{ color: "#d97706", fontWeight: 600 }}>
                                {selectedAgency.performance_summary?.late_payments || 0}
                              </h4>
                              <small className="text-muted">Late Payments</small>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div className="text-center p-3" style={{ backgroundColor: "#fee2e2", borderRadius: "12px" }}>
                              <AlertTriangle size={24} style={{ color: "#dc2626", marginBottom: "8px" }} />
                              <h4 className="mb-0" style={{ color: "#dc2626", fontWeight: 600 }}>
                                {selectedAgency.performance_summary?.disputes || 0}
                              </h4>
                              <small className="text-muted">Disputes</small>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Tabs for Different Sections */}
                    <Card className="shadow-sm" style={{ border: "none" }}>
                      <Card.Body className="p-0">
                        <Tabs
                          activeKey={activeTab}
                          onSelect={(k) => setActiveTab(k)}
                          className="px-3 pt-3"
                          style={{ borderBottom: "2px solid #e9ecef" }}
                        >
                          <Tab eventKey="overview" title={<span><Activity size={16} className="me-1" />Overview</span>}>
                            <div className="p-4">
                              {/* Working Companies */}
                              <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h5 style={{ fontWeight: 600 }}>
                                    <Briefcase size={20} className="me-2" />
                                    Working With Companies
                                  </h5>
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    style={{ borderRadius: "8px" }}
                                    onClick={() => setShowCompanyModal(true)}
                                  >
                                    <Plus size={16} className="me-1" />
                                    Add Company
                                  </Button>
                                </div>
                                <Row className="g-3">
                                  {selectedAgency.working_with_companies && selectedAgency.working_with_companies.length > 0 ? (
                                    selectedAgency.working_with_companies.map((company, index) => (
                                      <Col md={6} key={index}>
                                        <Card style={{ border: "1px solid #e9ecef", borderRadius: "12px" }}>
                                          <Card.Body>
                                            <h6 style={{ fontWeight: 600, color: "#2c3e50" }}>
                                              {company.organization_name}
                                            </h6>
                                            <div className="mt-2">
                                              {company.work_type && company.work_type.map((type, idx) => (
                                                <Badge
                                                  key={idx}
                                                  bg="light"
                                                  text="dark"
                                                  className="me-2 mb-1"
                                                  style={{ fontWeight: 400 }}
                                                >
                                                  {type}
                                                </Badge>
                                              ))}
                                            </div>
                                          </Card.Body>
                                        </Card>
                                      </Col>
                                    ))
                                  ) : (
                                    <Col>
                                      <p className="text-muted text-center">No companies associated yet.</p>
                                    </Col>
                                  )}
                                </Row>
                              </div>

                              {/* Performance Remarks */}
                              <div className="mb-4">
                                <h5 style={{ fontWeight: 600 }} className="mb-3">
                                  <BarChart3 size={20} className="me-2" />
                                  Performance Remarks
                                </h5>
                                <Alert variant="info" style={{ borderRadius: "12px", border: "none" }}>
                                  <FileText size={20} className="me-2" />
                                  {selectedAgency.performance_summary?.remarks || "No performance remarks available."}
                                </Alert>
                              </div>
                            </div>
                          </Tab>

                          <Tab eventKey="history" title={<span><Clock size={16} className="me-1" />Relation History</span>}>
                            <div className="p-4">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 style={{ fontWeight: 600 }}>Relationship Timeline</h5>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setShowHistoryModal(true)}
                                  style={{ borderRadius: "8px" }}
                                >
                                  <Plus size={16} className="me-1" />
                                  Add Entry
                                </Button>
                              </div>

                              <div style={{ position: "relative", paddingLeft: "40px" }}>
                                {selectedAgency.relation_history && selectedAgency.relation_history.length > 0 ? (
                                  selectedAgency.relation_history.map((entry, index) => (
                                  <div key={index} className="mb-4" style={{ position: "relative" }}>
                                    {/* Timeline dot */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: "-32px",
                                        top: "8px",
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        backgroundColor: relationshipTypes[entry.type]?.color || "#6c757d",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                    >
                                      {getRelationTypeIcon(entry.type)}
                                    </div>

                                    {/* Timeline line */}
                                    {index !== selectedAgency.relation_history.length - 1 && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          left: "-16px",
                                          top: "40px",
                                          width: "2px",
                                          height: "calc(100% + 16px)",
                                          backgroundColor: "#e9ecef"
                                        }}
                                      />
                                    )}

                                    <Card style={{ border: "1px solid #e9ecef", borderRadius: "12px" }}>
                                      <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                          <Badge
                                            style={{
                                              backgroundColor: relationshipTypes[entry.type]?.color || "#6c757d",
                                              fontWeight: 500
                                            }}
                                          >
                                            {relationshipTypes[entry.type]?.label || entry.type}
                                          </Badge>
                                          <small className="text-muted">
                                            <Calendar size={14} className="me-1" />
                                            {new Date(entry.date).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </small>
                                        </div>
                                        <p className="mb-0" style={{ color: "#495057" }}>{entry.note}</p>
                                      </Card.Body>
                                    </Card>
                                  </div>
                                  ))
                                ) : (
                                  <p className="text-muted text-center">No relationship history available.</p>
                                )}
                              </div>
                            </div>
                          </Tab>

                          <Tab eventKey="communication" title={<span><MessageSquare size={16} className="me-1" />Communication</span>}>
                            <div className="p-4">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 style={{ fontWeight: 600 }}>Recent Communication</h5>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  style={{ borderRadius: "8px" }}
                                  onClick={() => setShowCommunicationModal(true)}
                                >
                                  <Plus size={16} className="me-1" />
                                  Add Message
                                </Button>
                              </div>

                              {selectedAgency.recent_communication && selectedAgency.recent_communication.length > 0 ? (
                                selectedAgency.recent_communication.map((comm, index) => (
                                  <Card key={index} className="mb-3" style={{ border: "1px solid #e9ecef", borderRadius: "12px" }}>
                                    <Card.Body>
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                          <Badge bg="secondary" className="me-2">{comm.by}</Badge>
                                          <small className="text-muted">
                                            <Calendar size={14} className="me-1" />
                                            {new Date(comm.date).toLocaleDateString()}
                                          </small>
                                        </div>
                                      </div>
                                      <p className="mb-0">{comm.message}</p>
                                    </Card.Body>
                                  </Card>
                                ))
                              ) : (
                                <p className="text-muted text-center">No recent communication.</p>
                              )}
                            </div>
                          </Tab>

                          <Tab eventKey="conflicts" title={<span><AlertTriangle size={16} className="me-1" />Conflicts</span>}>
                            <div className="p-4">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 style={{ fontWeight: 600 }}>Conflict History</h5>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setShowConflictModal(true)}
                                  style={{ borderRadius: "8px" }}
                                >
                                  <Plus size={16} className="me-1" />
                                  Report Conflict
                                </Button>
                              </div>

                              {selectedAgency.conflict_history && selectedAgency.conflict_history.length > 0 ? (
                                selectedAgency.conflict_history.map((conflict, index) => (
                                  <Card key={index} className="mb-3" style={{ border: "1px solid #e9ecef", borderRadius: "12px" }}>
                                    <Card.Body>
                                      <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center gap-2">
                                          <AlertTriangle size={20} style={{ color: conflict.resolved ? "#059669" : "#dc2626" }} />
                                          <div>
                                            <small className="text-muted">
                                              <Calendar size={14} className="me-1" />
                                              {new Date(conflict.date).toLocaleDateString()}
                                            </small>
                                          </div>
                                        </div>
                                        {conflict.resolved ? (
                                          <Badge bg="success">
                                            <CheckCircle size={14} className="me-1" />
                                            Resolved
                                          </Badge>
                                        ) : (
                                          <Badge bg="danger">
                                            <XCircle size={14} className="me-1" />
                                            Pending
                                          </Badge>
                                        )}
                                      </div>
                                      <h6 style={{ fontWeight: 600, color: "#2c3e50" }}>Reason:</h6>
                                      <p className="mb-2">{conflict.reason}</p>
                                      {conflict.resolved && conflict.resolution_note && (
                                        <>
                                          <h6 style={{ fontWeight: 600, color: "#2c3e50" }}>Resolution:</h6>
                                          <Alert variant="success" className="mb-0" style={{ borderRadius: "8px" }}>
                                            {conflict.resolution_note}
                                          </Alert>
                                        </>
                                      )}
                                    </Card.Body>
                                  </Card>
                                ))
                              ) : (
                                <p className="text-muted text-center">No conflicts recorded.</p>
                              )}
                            </div>
                          </Tab>

                          <Tab eventKey="users" title={<span><Users size={16} className="me-1" />Users</span>}>
                            <div className="p-4">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 style={{ fontWeight: 600 }}>Agency Users</h5>
                                <Badge bg="primary" style={{ fontSize: "14px" }}>
                                  {selectedAgency.users ? selectedAgency.users.length : 0} Users
                                </Badge>
                              </div>

                              {selectedAgency.users && selectedAgency.users.length > 0 ? (
                                <Row className="g-3">
                                  {selectedAgency.users.map((user, index) => (
                                    <Col md={6} key={index}>
                                      <Card style={{ border: "1px solid #e9ecef", borderRadius: "12px" }}>
                                        <Card.Body>
                                          <div className="d-flex align-items-start justify-content-between mb-2">
                                            <div className="d-flex align-items-center gap-3">
                                              <div 
                                                style={{ 
                                                  width: "48px", 
                                                  height: "48px", 
                                                  borderRadius: "50%", 
                                                  backgroundColor: "#e3f2fd",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center"
                                                }}
                                              >
                                                <Users size={24} style={{ color: "#1976d2" }} />
                                              </div>
                                              <div>
                                                <h6 className="mb-0" style={{ fontWeight: 600, color: "#2c3e50" }}>
                                                  {user.first_name || user.username || "Unknown User"}
                                                </h6>
                                                <small className="text-muted d-block">@{user.username}</small>
                                                {user.email && (
                                                  <small className="text-muted d-block">
                                                    <Mail size={12} className="me-1" />
                                                    {user.email}
                                                  </small>
                                                )}
                                              </div>
                                            </div>
                                            {user.is_active ? (
                                              <Badge bg="success" style={{ fontSize: "11px" }}>Active</Badge>
                                            ) : (
                                              <Badge bg="secondary" style={{ fontSize: "11px" }}>Inactive</Badge>
                                            )}
                                          </div>
                                          
                                          {user.profile?.type && (
                                            <div className="mt-2">
                                              <Badge 
                                                bg={user.profile.type === "agent" ? "primary" : user.profile.type === "subagent" ? "info" : "warning"} 
                                                className="me-2"
                                              >
                                                <Briefcase size={12} className="me-1" />
                                                {user.profile.type.charAt(0).toUpperCase() + user.profile.type.slice(1)}
                                              </Badge>
                                            </div>
                                          )}
                                          
                                          {user.branch_details && user.branch_details.length > 0 && (
                                            <div className="mt-2">
                                              <small className="text-muted">
                                                <Building2 size={12} className="me-1" />
                                                Branch: {user.branch_details.map(b => b.name).join(", ")}
                                              </small>
                                            </div>
                                          )}

                                          {user.group_details && user.group_details.length > 0 && (
                                            <div className="mt-2">
                                              <small className="text-muted">
                                                <Users size={12} className="me-1" />
                                                Groups: {user.group_details.map(g => g.name).join(", ")}
                                              </small>
                                            </div>
                                          )}
                                        </Card.Body>
                                      </Card>
                                    </Col>
                                  ))}
                                </Row>
                              ) : (
                                <div className="text-center py-5">
                                  <Users size={48} style={{ color: "#cbd5e1", marginBottom: "16px" }} />
                                  <p className="text-muted mb-0">No users found for this agency.</p>
                                  <small className="text-muted">Users will appear here once they are assigned to this agency.</small>
                                </div>
                              )}
                            </div>
                          </Tab>
                        </Tabs>
                      </Card.Body>
                    </Card>
                  </div>
                ) : (
                  <Card className="shadow-sm" style={{ border: "none", height: "calc(100vh - 220px)" }}>
                    <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                      <Building2 size={64} style={{ color: "#cbd5e1", marginBottom: "16px" }} />
                      <h4 className="text-muted">Select an agency to view profile</h4>
                      <p className="text-muted">Choose an agency from the list to see detailed relationship information</p>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          </Container>
      </div>

      {/* Add Agency Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Building2 size={24} className="me-2" />
            Add New Agency
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Agency Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter agency name"
                    value={newAgencyForm.ageny_name}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, ageny_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Person *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter contact person name"
                    value={newAgencyForm.name}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number *</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="+92-3001234567"
                    value={newAgencyForm.phone_number}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, phone_number: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="agency@example.com"
                    value={newAgencyForm.email}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter agency address"
                value={newAgencyForm.address}
                onChange={(e) => setNewAgencyForm({ ...newAgencyForm, address: e.target.value })}
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Branch *</Form.Label>
                  <Form.Select
                    value={newAgencyForm.branch}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, branch: e.target.value })}
                    required
                  >
                    <option value="">Select Branch</option>
                    {(function(){
                      try {
                        const so = JSON.parse(localStorage.getItem('selectedOrganization') || 'null') || {};
                        const orgId = so?.id || so?.organization_id || so?.org || null;
                        if (!orgId) return branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name || b.branch_name || `Branch ${b.id}`}</option>
                        ));
                        // filter branches belonging to this organization
                        const filtered = (branches || []).filter(b => {
                          if (!b) return false;
                          if (b.organization && (b.organization === orgId || b.organization.id === orgId || b.organization.pk === orgId)) return true;
                          if (b.organization_id && String(b.organization_id) === String(orgId)) return true;
                          if (b.org && String(b.org) === String(orgId)) return true;
                          if (b.branch && (b.branch.organization_id === orgId || b.branch.organization === orgId)) return true;
                          return false;
                        });
                        return filtered.map(b => (
                          <option key={b.id} value={b.id}>{b.name || b.branch_name || `Branch ${b.id}`}</option>
                        ));
                      } catch (e) { return branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name || b.branch_name || `Branch ${b.id}`}</option>
                      )); }
                    })()}
                  </Form.Select>
                  <Form.Text className="text-muted">Branches shown for your organization only</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Agency Type</Form.Label>
                  <Form.Select
                    value={newAgencyForm.agency_type}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, agency_type: e.target.value })}
                  >
                    <option value="Full Agency">Full Agency</option>
                    <option value="Area Agency">Area Agency</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Agreement Status</Form.Label>
                  <Form.Select
                    value={newAgencyForm.agreement_status}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, agreement_status: e.target.value === "true" })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Logo</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setNewAgencyForm({ ...newAgencyForm, logo: e.target.files[0] })}
              />
              <Form.Text className="text-muted">
                Upload agency logo (optional)
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddAgency} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Adding...
              </>
            ) : (
              <>
                <Plus size={18} className="me-1" />
                Add Agency
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <Clock size={24} className="me-2" />
            Add Relationship History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={historyForm.date}
                onChange={(e) => setHistoryForm({ ...historyForm, date: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={historyForm.type}
                onChange={(e) => setHistoryForm({ ...historyForm, type: e.target.value })}
              >
                {Object.entries(relationshipTypes).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Note *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={historyForm.note}
                onChange={(e) => setHistoryForm({ ...historyForm, note: e.target.value })}
                placeholder="Enter detailed note about this interaction..."
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddHistory}>
            <Plus size={18} className="me-1" />
            Add Entry
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Conflict Modal */}
      <Modal show={showConflictModal} onHide={() => setShowConflictModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <AlertTriangle size={24} className="me-2" />
            Report Conflict
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={conflictForm.date}
                onChange={(e) => setConflictForm({ ...conflictForm, date: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reason *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={conflictForm.reason}
                onChange={(e) => setConflictForm({ ...conflictForm, reason: e.target.value })}
                placeholder="Describe the conflict..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Conflict Resolved"
                checked={conflictForm.resolved}
                onChange={(e) => setConflictForm({ ...conflictForm, resolved: e.target.checked })}
              />
            </Form.Group>

            {conflictForm.resolved && (
              <Form.Group className="mb-3">
                <Form.Label>Resolution Note</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={conflictForm.resolution_note}
                  onChange={(e) => setConflictForm({ ...conflictForm, resolution_note: e.target.value })}
                  placeholder="How was this conflict resolved..."
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConflictModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleAddConflict}>
            <Plus size={18} className="me-1" />
            Add Conflict
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Communication Modal */}
      <Modal show={showCommunicationModal} onHide={() => setShowCommunicationModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <MessageSquare size={24} className="me-2" />
            Add Communication
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={communicationForm.date}
                onChange={(e) => setCommunicationForm({ ...communicationForm, date: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type *</Form.Label>
              <Form.Select
                value={communicationForm.type}
                onChange={(e) => setCommunicationForm({ ...communicationForm, type: e.target.value })}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="meeting">Meeting</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>By</Form.Label>
              <Form.Control
                type="text"
                value={communicationForm.by}
                onChange={(e) => setCommunicationForm({ ...communicationForm, by: e.target.value })}
                placeholder="Admin, Sales Team, etc."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={communicationForm.message}
                onChange={(e) => setCommunicationForm({ ...communicationForm, message: e.target.value })}
                placeholder="Enter communication message..."
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCommunicationModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddCommunication} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Adding...
              </>
            ) : (
              <>
                <Plus size={18} className="me-1" />
                Add Message
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Company Modal */}
      <Modal show={showCompanyModal} onHide={() => setShowCompanyModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <Briefcase size={24} className="me-2" />
            Add Company Relationship
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Organization Name *</Form.Label>
              <Form.Control
                type="text"
                value={companyForm.organization_name}
                onChange={(e) => setCompanyForm({ ...companyForm, organization_name: e.target.value })}
                placeholder="Enter organization name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Organization ID</Form.Label>
              <Form.Control
                type="number"
                value={companyForm.organization_id}
                onChange={(e) => setCompanyForm({ ...companyForm, organization_id: e.target.value })}
                placeholder="Optional - auto-generated if empty"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Work Types</Form.Label>
              <Form.Control
                type="text"
                value={companyForm.work_type.join(", ")}
                onChange={(e) => {
                  const types = e.target.value.split(",").map(t => t.trim()).filter(t => t);
                  setCompanyForm({ ...companyForm, work_type: types });
                }}
                placeholder="e.g., Tickets, Hotels, Visa (comma-separated)"
              />
              <Form.Text className="text-muted">
                Enter work types separated by commas
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompanyModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddCompany} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Adding...
              </>
            ) : (
              <>
                <Plus size={18} className="me-1" />
                Add Company
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create/Update Agency Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FileText size={24} className="me-2" />
            {profileModalMode === "create" ? "Create" : "Update"} Agency Profile - {profileAgency?.ageny_name || profileAgency?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Relationship Status *</Form.Label>
              <Form.Select
                value={profileForm.relationship_status}
                onChange={(e) => setProfileForm({ ...profileForm, relationship_status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="risky">Risky</option>
                <option value="dispute">Dispute</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Performance Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter performance remarks..."
                value={profileForm.performance_summary.remarks}
                onChange={(e) => setProfileForm({ 
                  ...profileForm, 
                  performance_summary: { 
                    ...profileForm.performance_summary, 
                    remarks: e.target.value 
                  } 
                })}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Bookings</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={profileForm.performance_summary.total_bookings}
                    onChange={(e) => setProfileForm({ 
                      ...profileForm, 
                      performance_summary: { 
                        ...profileForm.performance_summary, 
                        total_bookings: parseInt(e.target.value) || 0 
                      } 
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>On-Time Payments</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={profileForm.performance_summary.on_time_payments}
                    onChange={(e) => setProfileForm({ 
                      ...profileForm, 
                      performance_summary: { 
                        ...profileForm.performance_summary, 
                        on_time_payments: parseInt(e.target.value) || 0 
                      } 
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Late Payments</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={profileForm.performance_summary.late_payments}
                    onChange={(e) => setProfileForm({ 
                      ...profileForm, 
                      performance_summary: { 
                        ...profileForm.performance_summary, 
                        late_payments: parseInt(e.target.value) || 0 
                      } 
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Disputes</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={profileForm.performance_summary.disputes}
                    onChange={(e) => setProfileForm({ 
                      ...profileForm, 
                      performance_summary: { 
                        ...profileForm.performance_summary, 
                        disputes: parseInt(e.target.value) || 0 
                      } 
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveProfile} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle size={18} className="me-1" />
                {profileModalMode === "create" ? "Create Profile" : "Update Profile"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
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

export default AgencyProfile;