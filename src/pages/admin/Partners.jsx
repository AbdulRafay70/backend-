import React, { useState, useEffect, useMemo } from "react";
import { Dropdown, Table, Button, Form, Modal, Spinner } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Funnel, Search } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PartnersTabs from "../../components/PartnersTabs";
import { NavLink } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { jwtDecode } from "jwt-decode";
import AdminFooter from "../../components/AdminFooter";

const ShimmerLoader = () => {
  return (
    <div className="py-3">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="shimmer-line mb-2"
          style={{
            height: "20px",
            width: "100%",
            borderRadius: "4px",
            background:
              "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        ></div>
      ))}
    </div>
  );
};

const Partners = ({ embed = false }) => {
  const PARTNERS_CACHE_KEY = "partners_cache";
  const AGENCIES_CACHE_KEY = "agencies_cache";
  const GROUPS_CACHE_KEY = "groups_cache";
  const BRANCHES_CACHE_KEY = "branches_cache";
  const CACHE_EXPIRY_TIME = 30 * 60 * 1000;

  // State declarations
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partners, setPartners] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [agencies, setAgencies] = useState([]);
  const [groups, setGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isAgentType, setIsAgentType] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [partnerForm, setPartnerForm] = useState({
    first_name: "",
    email: "",
    username: "",
    password: "",
    is_active: true,
    groups: [],
    branches: [],
    profile: {
      type: "",
    },
  });

  const accessToken = localStorage.getItem("accessToken");
  const axiosConfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const statusOptions = ["All", "Active", "Inactive"];
  const PAGE_SIZE = 8;

  // Get selected organization from localStorage
  const getSelectedOrganization = () => {
    const org = localStorage.getItem("selectedOrganization");
    return org ? JSON.parse(org) : null;
  };

  // Fetch partners data
  const fetchPartners = async () => {
    setIsLoading(true);

    try {
      const cachedData = localStorage.getItem(PARTNERS_CACHE_KEY);
      const cacheTimestamp = localStorage.getItem(
        `${PARTNERS_CACHE_KEY}_timestamp`
      );

      if (
        cachedData &&
        cacheTimestamp &&
        Date.now() - parseInt(cacheTimestamp) < CACHE_EXPIRY_TIME
      ) {
        setPartners(JSON.parse(cachedData));
        setTotalPages(
          Math.ceil(JSON.parse(cachedData).length / PAGE_SIZE) || 1
        );
      } else {
            const orgId = getCurrentOrgId();
            const usersUrl = orgId ? `http://127.0.0.1:8000/api/users/?organization=${orgId}` : `http://127.0.0.1:8000/api/users/`;
            const response = await axios.get(usersUrl, axiosConfig);
        const data = response.data || [];
        setPartners(data);
        setTotalPages(Math.ceil(data.length / PAGE_SIZE) || 1);

        localStorage.setItem(PARTNERS_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(
          `${PARTNERS_CACHE_KEY}_timestamp`,
          Date.now().toString()
        );
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
      setPartners([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch agencies data
  const fetchAgencies = async () => {
    try {
      const cachedData = localStorage.getItem(AGENCIES_CACHE_KEY);
      const cacheTimestamp = localStorage.getItem(
        `${AGENCIES_CACHE_KEY}_timestamp`
      );

      if (
        cachedData &&
        cacheTimestamp &&
        Date.now() - parseInt(cacheTimestamp) < CACHE_EXPIRY_TIME
      ) {
        setAgencies(JSON.parse(cachedData));
      } else {
        const orgId = getCurrentOrgId();
        const agenciesUrl = orgId
          ? `http://127.0.0.1:8000/api/agencies/?organization=${orgId}`
          : `http://127.0.0.1:8000/api/agencies/`;
        const response = await axios.get(agenciesUrl, axiosConfig);
        const data = response.data || [];
        setAgencies(data);

        localStorage.setItem(AGENCIES_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(
          `${AGENCIES_CACHE_KEY}_timestamp`,
          Date.now().toString()
        );
      }
    } catch (error) {
      console.error("Error fetching agencies:", error);
      setAgencies([]);
    }
  };

  // Fetch groups data
  const fetchGroups = async () => {
    try {
      const cachedData = localStorage.getItem(GROUPS_CACHE_KEY);
      const cacheTimestamp = localStorage.getItem(
        `${GROUPS_CACHE_KEY}_timestamp`
      );

      if (
        cachedData &&
        cacheTimestamp &&
        Date.now() - parseInt(cacheTimestamp) < CACHE_EXPIRY_TIME
      ) {
        setGroups(JSON.parse(cachedData));
      } else {
        // Always fetch all groups (global + org-scoped) and let client-side
        // filtering determine which groups to show for the current org.
        console.debug("fetchGroups: calling /api/groups/");
        const response = await axios.get(
          `http://127.0.0.1:8000/api/groups/`,
          axiosConfig
        );
        // Support both direct array responses and paginated { results: [] } responses
        let data = response.data || [];
        if (data && typeof data === "object" && Array.isArray(data.results)) {
          data = data.results;
        }
        console.debug("fetchGroups: received", data);
        setGroups(data);

        localStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(`${GROUPS_CACHE_KEY}_timestamp`, Date.now().toString());
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    }
  };

  // Fetch branches for selected organization (used in partner modal)
  const fetchBranches = async () => {
    try {
      const cachedData = localStorage.getItem(BRANCHES_CACHE_KEY);
      const cacheTimestamp = localStorage.getItem(`${BRANCHES_CACHE_KEY}_timestamp`);

      if (cachedData && cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < CACHE_EXPIRY_TIME) {
        setBranches(JSON.parse(cachedData));
      } else {
        const orgId = getCurrentOrgId();
        const branchesUrl = orgId
          ? `http://127.0.0.1:8000/api/branches/?organization=${orgId}`
          : `http://127.0.0.1:8000/api/branches/`;
        const response = await axios.get(branchesUrl, axiosConfig);
        const data = response.data || [];
        setBranches(data);

        localStorage.setItem(BRANCHES_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(`${BRANCHES_CACHE_KEY}_timestamp`, Date.now().toString());
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      setBranches([]);
    }
  };

  // Get agency details for a partner
  const getPartnerAgency = (partner) => {
    if (!partner.profile || partner.profile.type !== "agent") return null;

    if (partner.agency_details && partner.agency_details.length > 0) {
      return partner.agency_details[0];
    }

    if (partner.agencies && partner.agencies.length > 0) {
      const agencyId = partner.agencies[0];
      return agencies.find((agency) => agency.id === agencyId) || null;
    }

    return null;
  };

  // Filter partners based on filters and selected organization
  const filteredPartners = useMemo(() => {
    const typeMap = {
      employees: "employee",
      agents: "agent",
      branches: "subagent",
    };

    const orgId = getCurrentOrgId();

    return partners.filter((partner) => {
      // Filter by current organization (logged-in user's org) if available
      const matchesOrganization = orgId
        ? (partner.organization_details?.some((org) => org.id === orgId) || partner.organizations?.includes(orgId))
        : true;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && partner.is_active) ||
        (statusFilter === "Inactive" && !partner.is_active) ||
        (statusFilter === "Without Agreement" &&
          !(partner.profile?.agreement_status ?? true));

      const agency = getPartnerAgency(partner);
      const phoneNumber =
        agency?.phone_number || partner.profile?.phone_number || "";
      const address = agency?.address || partner.profile?.address || "";

      const matchesSearch =
        searchTerm === "" ||
        (partner.first_name?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (partner.email?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        phoneNumber.includes(searchTerm) ||
        address.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesType = true;
      if (filter !== "all") {
        if (filter === "agents") {
          matchesType = partner.profile?.type === "agent" || partner.profile?.type === "area-agent";
        } else if (filter === "employees") {
          matchesType = partner.profile?.type === "employee";
        } else if (filter === "branches") {
          matchesType = partner.profile?.type === "subagent";
        } else {
          matchesType = true;
        }
      }

      // Filter by selected group if provided
      const partnerGroupIds = Array.isArray(partner.groups)
        ? partner.groups.map((g) => (typeof g === "object" ? g.id : g))
        : [];

      const matchesGroup =
        !selectedGroupId || partnerGroupIds.includes(selectedGroupId);

      return (
        matchesOrganization && matchesStatus && matchesSearch && matchesType && matchesGroup
      );
    });
  }, [partners, statusFilter, searchTerm, filter, agencies, selectedGroupId, groups, currentUser]);


  // Paginate partners
  const paginatedPartners = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredPartners.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPartners, currentPage]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Show create partner modal
  const handleShowCreate = () => {
    setEditingId(null);
    setPartnerForm({
      first_name: "",
      last_name: "",
      email: "",
      username: "",
      password: "",
      is_active: true,
      groups: [],
      agencies: [],
      branches: [],
      profile: {
        type: "",
      },
    });
    setShowModal(true);
  };

  // Show edit partner modal
  const handleShowEdit = (partner) => {
    setEditingId(partner.id);

    setPartnerForm({
      first_name: partner.first_name || "",
      last_name: partner.last_name || "",
      email: partner.email || "",
      username: partner.username || "",
      password: "",
      is_active: partner.is_active,
      groups: partner.groups || [],
      branches: partner.branches || [],
      agencies: partner.agencies || [],
      profile: {
        type: partner.profile?.type || "",
      },
    });

    // Set agent type if editing an agent or area-agent
    setIsAgentType(partner.profile?.type === "agent" || partner.profile?.type === "area-agent");
    setShowModal(true);
  };

  // Close modal
  const handleClose = () => {
    setShowModal(false);
    setLogoFile(null);
    setLogoPreview("");
  };

  // Add this function to your Partners component
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "profile.type") {
      const isAgent = value === "agent" || value === "area-agent";
      setIsAgentType(isAgent);
    }

    if (name.startsWith("profile.")) {
      const profileField = name.split(".")[1];
      setPartnerForm((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setPartnerForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const orgId = getCurrentOrgId();
      if (!orgId) {
        alert('Unable to determine current organization.');
        setIsSubmitting(false);
        return;
      }

      const selectedBranch = localStorage.getItem("selectedBranchId");
      const Branch = selectedBranch ? [selectedBranch] : [];

      const userPayload = {
        username: partnerForm.username,
        email: partnerForm.email,
        password: partnerForm.password,
        first_name: partnerForm.first_name,
        last_name: partnerForm.last_name,
        profile: { type: partnerForm.profile.type },
        organizations: [orgId],
        branches: (partnerForm.branches && partnerForm.branches.length > 0) ? partnerForm.branches : Branch,
        agencies: partnerForm.agencies || [],
        groups: partnerForm.groups,
        is_active: partnerForm.is_active,
      };

      if (partnerForm.password && !editingId) {
        userPayload.password = partnerForm.password;
      }

      // Make the API call
      let response;
      if (editingId) {
        response = await axios.put(
          `http://127.0.0.1:8000/api/users/${editingId}/?organization=${orgId}`,
          userPayload,
          axiosConfig
        );
      } else {
        response = await axios.post(
          `http://127.0.0.1:8000/api/users/?organization=${orgId}`,
          userPayload,
          axiosConfig
        );
      }

      // Clear cache and refresh
      localStorage.removeItem(PARTNERS_CACHE_KEY);
      localStorage.removeItem(`${PARTNERS_CACHE_KEY}_timestamp`);
      setRefreshTrigger((prev) => prev + 1);
      handleClose();
    } catch (error) {
      console.error("Error saving partner:", error);
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle partner deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this partner?")) {
      setIsLoading(true);
      try {
        await axios.delete(`http://127.0.0.1:8000/api/users/${id}/?organization=${getCurrentOrgId()}`, axiosConfig);

        // Clear the partners cache since we've made changes
        localStorage.removeItem(PARTNERS_CACHE_KEY);
        localStorage.removeItem(`${PARTNERS_CACHE_KEY}_timestamp`);

        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Error deleting partner:", error);
        alert(`Error: ${error.response?.data?.detail || error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle status change
  const handleStatusChange = async (id, newStatus) => {
    setIsLoading(true);
    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/users/${id}/?organization=${getCurrentOrgId()}`,
        { is_active: newStatus === "Active" },
        axiosConfig
      );

      // Clear the partners cache since we've made changes
      localStorage.removeItem(PARTNERS_CACHE_KEY);
      localStorage.removeItem(`${PARTNERS_CACHE_KEY}_timestamp`);

      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to resolve the current organization id (logged-in user's org preferred)
  function getCurrentOrgId() {
    if (currentUser) {
      if (Array.isArray(currentUser.organizations) && currentUser.organizations.length > 0) {
        return currentUser.organizations[0];
      }
      if (currentUser.organization) return currentUser.organization;
    }
    const sel = getSelectedOrganization();
    return sel && sel.id ? sel.id : null;
  }

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const decoded = jwtDecode(token);
        const userId = decoded.user_id || decoded.id;

        const response = await axios.get(
          `http://127.0.0.1:8000/api/users/${userId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchPartners();
    fetchAgencies();
    fetchGroups();
    fetchBranches();
  }, [refreshTrigger, currentUser]);

  // Get groups for selected organization
  const getGroupsForOrganization = () => {
    const orgId = getCurrentOrgId();
    if (!orgId) return groups;
    return groups.filter((group) => {
      // include global/unscoped groups (extended==null) or groups scoped to current organization
      if (!group.extended) return true;
      return group.extended.organization === orgId;
    });
  };

  // Add this function to your Partners component
  // const handleChange = (e) => {
  //   const { name, value, type, checked } = e.target;

  //   if (name === "profile.type") {
  //     const isAgent = value === "agent";
  //     setIsAgentType(isAgent);
  //   }

  //   if (name.startsWith("profile.")) {
  //     const profileField = name.split(".")[1];
  //     setPartnerForm((prev) => ({
  //       ...prev,
  //       profile: {
  //         ...prev.profile,
  //         [profileField]: type === "checkbox" ? checked : value,
  //       },
  //     }));
  //   } else {
  //     setPartnerForm((prev) => ({
  //       ...prev,
  //       [name]: type === "checkbox" ? checked : value,
  //     }));
  //   }
  // };

  const options = [
    { value: "agent", label: "Agent" },
    { value: "area-agent", label: "Area Agent" },
    { value: "employee", label: "Employee" },
    { value: "subagent", label: "Branch" },
    { value: "admin", label: "Admin" },
    { value: "superadmin", label: "Super Admin" },
  ];

  // Navigation is rendered by shared PartnersTabs

  return (
    <>
      <style>
        {`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            
            .shimmer-line {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: shimmer 1.5s infinite;
              border-radius: 4px;
            }
          `}
      </style>
     <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        {!embed && (
          <div className="col-12 col-lg-2">
            <Sidebar />
          </div>
        )}
        {/* Main Content */}
        <div className={`col-12 ${!embed ? 'col-lg-10' : ''}`}>
          <div className={embed ? '' : 'container'}>
            {!embed && <Header />}
            <div className="px-3 px-lg-4 my-3">
              {/* Navigation Tabs */}
              {!embed && <PartnersTabs />}

              <div className="p-3 my-3 rounded-4 shadow-sm">
                <div className="d-flex flex-wrap gap-2 justify-content-between">
                  <div>
                    <h5 className="fw-semibold mb-0">All User's</h5>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleShowCreate}
                      disabled={isLoading || isSubmitting}
                    >
                      {isLoading ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        "Add User's"
                      )}
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={isLoading || isSubmitting}
                    >
                      {isLoading ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        "Print"
                      )}
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={isLoading || isSubmitting}
                    >
                      {isLoading ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        "Download"
                      )}
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex gap-3 mt-3 flex-wrap">
                    <button
                      className={`btn ${filter === "all" ? "btn-primary" : "btn-outline-secondary"
                        }`}
                      onClick={() => setFilter("all")}
                    >
                      All
                    </button>
                    <button
                      className={`btn ${filter === "employee"
                        ? "btn-primary"
                        : "btn-outline-secondary"
                        }`}
                      onClick={() => setFilter("employees")}
                    >
                      Employees
                    </button>
                    <button
                      className={`btn ${filter === "agents"
                        ? "btn-primary"
                        : "btn-outline-secondary"
                        }`}
                      onClick={() => setFilter("agents")}
                    >
                      Agents
                    </button>
                      {/* Group select filter */}
                      <div style={{ minWidth: 220 }}>
                        <Select
                          isClearable
                          placeholder="Filter by group"
                          options={getGroupsForOrganization().map((group) => ({
                            value: group.id,
                            label: group.name,
                          }))}
                          value={
                            selectedGroupId
                              ? { value: selectedGroupId, label: groups.find(g => g.id === selectedGroupId)?.name }
                              : null
                          }
                          onChange={(opt) => setSelectedGroupId(opt ? opt.value : null)}
                          className="basic-single"
                          classNamePrefix="select"
                        />
                      </div>
                  </div>
                  <Dropdown>
                    <Dropdown.Toggle
                      variant=""
                      disabled={isLoading || isSubmitting}
                    >
                      <Funnel size={16} className="me-1" />
                      Filters
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {statusOptions.map((status, idx) => (
                        <Dropdown.Item
                          key={idx}
                          onClick={() => setStatusFilter(status)}
                          active={statusFilter === status}
                        >
                          {status}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                {isLoading ? (
                  <div className="p-3">
                    <ShimmerLoader />
                  </div>
                ) : (
                  <>
                    {filteredPartners.length === 0 ? (
                      <div className="text-center py-5">
                        <p>No partners found</p>
                        <Button
                          variant="primary"
                          onClick={() => setRefreshTrigger((prev) => prev + 1)}
                        >
                          Refresh
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Table
                          hover
                          responsive
                          className="align-middle text-center"
                        >
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedPartners.map((partner) => {
                              const agency = getPartnerAgency(partner);
                              const phoneNumber =
                                agency?.phone_number ||
                                partner.profile?.phone_number ||
                                "N/A";
                              const address =
                                agency?.address ||
                                partner.profile?.address ||
                                "N/A";

                              return (
                                <tr key={partner.id}>
                                  <td>{partner.id}</td>
                                  <td>{partner.first_name || "N/A"}</td>
                                  <td>{partner.email || "N/A"}</td>
                                  <td
                                    className="fw-bold"
                                    style={{
                                      color: partner.is_active
                                        ? "#0EE924"
                                        : "#FF0000",
                                    }}
                                  >
                                    {partner.is_active ? "Active" : "Inactive"}
                                  </td>
                                  <td>
                                    <Dropdown>
                                      <Dropdown.Toggle
                                        variant="link"
                                        className="text-decoration-none p-0"
                                        disabled={isSubmitting}
                                      >
                                        <Gear size={18} />
                                      </Dropdown.Toggle>
                                      <Dropdown.Menu>
                                        <Dropdown.Item
                                          className="text-primary"
                                          onClick={() => handleShowEdit(partner)}
                                          disabled={isSubmitting}
                                        >
                                          Edit
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          className="text-success"
                                          onClick={() =>
                                            handleStatusChange(
                                              partner.id,
                                              "Active"
                                            )
                                          }
                                          disabled={
                                            partner.is_active || isSubmitting
                                          }
                                        >
                                          Activate
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          className="text-danger"
                                          onClick={() =>
                                            handleStatusChange(
                                              partner.id,
                                              "Inactive"
                                            )
                                          }
                                          disabled={
                                            !partner.is_active || isSubmitting
                                          }
                                        >
                                          Block
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          onClick={() => handleDelete(partner.id)}
                                          className="text-danger"
                                          disabled={isSubmitting}
                                        >
                                          Delete
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>

                        <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 mb-3">
                          <div className="d-flex flex-wrap align-items-center">
                            <span className="me-2">
                              Showing {paginatedPartners.length} of{" "}
                              {filteredPartners.length} partners
                            </span>
                          </div>
                          <nav>
                            <ul className="pagination pagination-sm mb-0">
                              <li
                                className={`page-item ${currentPage === 1 ? "disabled" : ""
                                  }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() =>
                                    handlePageChange(currentPage - 1)
                                  }
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </button>
                              </li>
                              {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                              ).map((page) => (
                                <li
                                  key={page}
                                  className={`page-item ${currentPage === page ? "active" : ""
                                    }`}
                                >
                                  <button
                                    className="page-link"
                                    onClick={() => handlePageChange(page)}
                                  >
                                    {page}
                                  </button>
                                </li>
                              ))}
                              <li
                                className={`page-item ${currentPage === totalPages ? "disabled" : ""
                                  }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() =>
                                    handlePageChange(currentPage + 1)
                                  }
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                </button>
                              </li>
                            </ul>
                          </nav>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              <div>
                <AdminFooter />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Partner Modal */}
        <Modal
          show={showModal}
          onHide={handleClose}
          centered
          size=""
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <Modal.Body>
            <h4 className="text-center fw-bold p-4 mb-4">
              {editingId ? "Edit User" : "New User"}
            </h4>
            <hr />
            <Form className="p-4">
              {/* Type Dropdown */}
              <div className="mb-3">
                <label htmlFor="" className="Control-label">Type</label>
                <Select
                  options={options}
                  value={options.find(
                    (opt) => opt.value === partnerForm.profile.type
                  )}
                  onChange={(selected) =>
                    handleChange({
                      target: { name: "profile.type", value: selected ? selected.value : "" },
                    })
                  }
                />
              </div>

              {/* Basic Info Fields */}
              <div className="mb-3">
                <label htmlFor="" className="Control-label">Name</label>
                <input
                  type="text"
                  name="first_name"
                  className="form-control rounded shadow-none border px-1 py-2"
                  required
                  placeholder="Full Name"
                  value={partnerForm.first_name}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  className="form-control rounded shadow-none border px-1 py-2"
                  placeholder="Last Name"
                  value={partnerForm.last_name}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control rounded shadow-none  px-1 py-2"
                  required
                  placeholder="Email"
                  value={partnerForm.email}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  className="form-control rounded shadow-none  px-1 py-2"
                  required
                  placeholder="Username"
                  value={partnerForm.username}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-control rounded shadow-none  px-1 py-2"
                  required={!editingId}
                  placeholder="Password"
                  value={partnerForm.password}
                  onChange={handleChange}
                />
              </div>

              {/* Groups Dropdown */}
              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Groups
                </label>
                <Select
                  isMulti
                  name="groups"
                  options={getGroupsForOrganization().map((group) => ({
                    value: group.id,
                    label: group.name,
                  }))}
                  value={groups
                    .filter((group) => partnerForm.groups.includes(group.id))
                    .map((group) => ({
                      value: group.id,
                      label: group.name,
                    }))}
                  onChange={(selected) =>
                    setPartnerForm((prev) => ({
                      ...prev,
                      groups: selected.map((option) => option.value),
                    }))
                  }
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>

              {/* Agency Fields (only shown when type is agent) */}
              {isAgentType && (
                <>
                  <div className="mb-3">
                    <label htmlFor="" className="form-label">
                      Select Agency
                    </label>
                    <Select
                      options={agencies.map((agency) => ({
                        value: agency.id,
                        label: agency.name,
                      }))}
                      value={
                        partnerForm.agencies &&
                          partnerForm.agencies.length > 0
                          ? {
                            value: partnerForm.agencies[0],
                            label: agencies.find(
                              (a) => a.id === partnerForm.agencies[0]
                            )?.name,
                          }
                          : null
                      }
                      onChange={(selected) => {
                        setPartnerForm((prev) => ({
                          ...prev,
                          agencies: selected ? [selected.value] : [],
                        }));
                      }}
                    />
                  </div>
                </>
              )}
              {/* Branch select (optional) */}
              <div className="mb-3">
                <label htmlFor="" className="form-label">
                  Select Branch
                </label>
                <Select
                  options={branches.map((b) => ({ value: b.id, label: b.name }))}
                  value={
                    partnerForm.branches && partnerForm.branches.length > 0
                      ? { value: partnerForm.branches[0], label: branches.find(x => x.id === partnerForm.branches[0])?.name }
                      : null
                  }
                  onChange={(selected) => setPartnerForm((prev) => ({
                    ...prev,
                    branches: selected ? [selected.value] : [],
                  }))}
                />
              </div>

              <div className="row">
                <div className="col-md-6 d-flex align-items-center mb-3">
                  <Form.Check
                    type="switch"
                    id="user-active-switch"
                    name="is_active"
                    label="User active"
                    checked={partnerForm.is_active}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Spinner size="sm" animation="border" />
                  ) : editingId ? (
                    "Update"
                  ) : (
                    "Save and close"
                  )}
                </Button>
                <Button
                  variant="light"
                  className="text-muted"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default Partners;
