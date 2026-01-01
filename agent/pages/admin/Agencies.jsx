import React, { useState, useEffect, useMemo } from "react";
import { Dropdown, Table, Button, Form, Modal, Spinner } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Funnel, Search } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { NavLink, Link } from "react-router-dom";
import axios from "axios";
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

const Agencies = () => {
  const AGENCIES_CACHE_KEY = "agencies_cache";
  const CACHE_EXPIRY_TIME = 30 * 60 * 1000;

  // State declarations
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agencies, setAgencies] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [currentAgencyId, setCurrentAgencyId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [contentForm, setContentForm] = useState({
    contacts: [
      {
        name: "",
        phone_number: "",
        email: "",
        remarks: "",
      },
    ],
  });

  const accessToken = localStorage.getItem("accessToken");
  const axiosConfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const statusOptions = ["All", "Without Agreement"];
  const PAGE_SIZE = 8;

  // Get branch ID from localStorage
  const [branchId, setBranchId] = useState(
    localStorage.getItem("selectedBranchId") || ""
  );

  useEffect(() => {
    const handleBranchChange = () => {
      const newBranchId = localStorage.getItem("selectedBranchId") || "";
      setBranchId(newBranchId);
      setAgencyForm((prev) => ({ ...prev, branch: newBranchId }));
    };

    window.addEventListener("branchChanged", handleBranchChange);
    return () =>
      window.removeEventListener("branchChanged", handleBranchChange);
  }, []);

  const [agencyForm, setAgencyForm] = useState({
    name: "",
    ageny_name: "",
    phone_number: "",
    address: "",
    email: "",
    agreement_status: true,
    branch: branchId || "",
    logo: null,
  });

  // Handle agency form submission
  const [mainAgentData, setMainAgentData] = useState({
    organizations: [],
    branches: [],
  });

  const handleFileChange = (e) => {
    setAgencyForm({
      ...agencyForm,
      logo: e.target.files[0],
    });
  };

  // Modify the fetchMainAgentData function to fetch from the correct endpoint
  const fetchMainAgentData = async (agencyId) => {
    try {
      // First get the agency details to find the associated user
      const agencyResponse = await axios.get(
        `https://api.saer.pk/api/agencies/${agencyId}/`,
        axiosConfig
      );

      // Then get the user details if available
      if (agencyResponse.data.user) {
        const userResponse = await axios.get(
          `https://api.saer.pk/api/users/${agencyResponse.data.user}/`,
          axiosConfig
        );

        setMainAgentData({
          organizations: userResponse.data.organizations || [],
          branches: userResponse.data.branches || [],
        });
      } else {
        // If no user is associated, set empty arrays
        setMainAgentData({
          organizations: [],
          branches: [],
        });
      }
    } catch (error) {
      console.error("Error fetching main agent data:", error);
      // Set defaults if fetch fails
      setMainAgentData({
        organizations: [],
        branches: [],
      });
    }
  };

  // Update handleShowEdit to pass the agency ID
  const handleShowEdit = async (agency) => {
    setEditingId(agency.id);
    setAgencyForm({
      name: agency.name,
      ageny_name: agency.ageny_name || "",
      phone_number: agency.phone_number || "",
      address: agency.address || "",
      email: agency.email || "",
      agreement_status: agency.agreement_status || true,
      branch: branchId,
      logo: agency.logo || null, // Add this line
    });

    await fetchMainAgentData(agency.id); // Pass agency ID to fetch data
    setShowModal(true);
  };

  // Update handleSubmit to properly handle organizations and branches
  const handleSubmit = async () => {
    if (!branchId) {
      alert("Please select a branch first from your profile");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Append all fields to formData
      formData.append("name", agencyForm.name);
      formData.append("ageny_name", agencyForm.ageny_name);
      formData.append("phone_number", agencyForm.phone_number);
      formData.append("address", agencyForm.address);
      formData.append("email", agencyForm.email);
      formData.append("agreement_status", agencyForm.agreement_status);
      formData.append("branch", branchId);

      if (agencyForm.logo && typeof agencyForm.logo !== "string") {
        formData.append("logo", agencyForm.logo);
      }

      // Only include organizations and branches if we're editing and they exist
      if (editingId) {
        if (mainAgentData.organizations.length > 0) {
          formData.append(
            "organizations",
            JSON.stringify(mainAgentData.organizations)
          );
        }
        if (mainAgentData.branches.length > 0) {
          formData.append("branches", JSON.stringify(mainAgentData.branches));
        }
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
      };

      if (editingId) {
        await axios.put(
          `https://api.saer.pk/api/agencies/${editingId}/`,
          formData,
          config
        );
      } else {
        await axios.post("https://api.saer.pk/api/agencies/", formData, config);
      }

      localStorage.removeItem(AGENCIES_CACHE_KEY);
      setRefreshTrigger((prev) => prev + 1);
      setShowModal(false);
    } catch (error) {
      console.error("Error saving agency:", error);
      alert(`Error: ${error.response?.data?.branch || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Fetch agencies data
  const fetchAgencies = async () => {
    setIsLoading(true);
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
        const response = await axios.get(
          "https://api.saer.pk/api/agencies/",
          axiosConfig
        );
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
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch agency details for content editing
  const fetchAgencyDetails = async (id) => {
    try {
      const response = await axios.get(
        `https://api.saer.pk/api/agencies/${id}/`,
        axiosConfig
      );
      if (response.data.contacts) {
        setContentForm({
          contacts: response.data.contacts,
        });
      }
    } catch (error) {
      console.error("Error fetching agency details:", error);
    }
  };

  // Add this useEffect to watch for branch changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newBranchId = localStorage.getItem("selectedBranchId") || "";
      if (newBranchId !== branchId) {
        setAgencyForm((prev) => ({
          ...prev,
          branch: newBranchId,
        }));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [branchId]);

  useEffect(() => {
    const handleBranchChange = () => {
      const newBranchId = localStorage.getItem("selectedBranchId") || "";
      setBranchId(newBranchId);
      setAgencyForm((prev) => ({ ...prev, branch: newBranchId }));
      setRefreshTrigger((prev) => prev + 1); // Trigger a refresh when branch changes
    };

    window.addEventListener("branchChanged", handleBranchChange);
    return () => window.removeEventListener("branchChanged", handleBranchChange);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Filter agencies based on search term and status
  // In your Agencies component, update the filteredAgencies memo:

  const filteredAgencies = useMemo(() => {
    let result = agencies;

    // Filter by branch - convert both IDs to numbers for comparison
    if (branchId) {
      const currentBranchId = Number(branchId); // Convert localStorage string to number
      result = result.filter(agency => {
        // Ensure agency.branch exists and convert to number
        const agencyBranchId = agency.branch ? Number(agency.branch) : null;
        return agencyBranchId === currentBranchId;
      });
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (agency) =>
          agency.name.toLowerCase().includes(term) ||
          (agency.ageny_name && agency.ageny_name.toLowerCase().includes(term)) ||
          (agency.phone_number && agency.phone_number.toLowerCase().includes(term)) ||
          (agency.address && agency.address.toLowerCase().includes(term)) ||
          (agency.email && agency.email.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (statusFilter === "Without Agreement") {
      result = result.filter((agency) => !agency.agreement_status);
    }

    setTotalPages(Math.ceil(result.length / PAGE_SIZE));
    return result;
  }, [agencies, searchTerm, statusFilter, branchId]);

  // Paginate agencies
  const paginatedAgencies = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredAgencies.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAgencies, currentPage]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Show create agency modal
  const handleShowCreate = () => {
    setEditingId(null);
    setAgencyForm({
      name: "",
      ageny_name: "",
      phone_number: "",
      address: "",
      email: "",
      agreement_status: true,
      branch: branchId,
    });
    setShowModal(true);
  };

  // Show content modal
  const handleShowContent = (id) => {
    setCurrentAgencyId(id);
    fetchAgencyDetails(id);
    setShowContentModal(true);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAgencyForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle content form changes
  const handleContentChange = (e, index) => {
    const { name, value } = e.target;
    const updatedContacts = [...contentForm.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: value,
    };
    setContentForm({
      contacts: updatedContacts,
    });
  };

  // Add new contact
  const addNewContact = () => {
    setContentForm((prev) => ({
      contacts: [
        ...prev.contacts,
        { name: "", phone_number: "", email: "", remarks: "" },
      ],
    }));
  };

  // Remove contact
  const removeContact = (index) => {
    const updatedContacts = [...contentForm.contacts];
    updatedContacts.splice(index, 1);
    setContentForm({
      contacts: updatedContacts,
    });
  };

  // Handle content form submission
  const handleContentSubmit = async () => {
    setIsSubmitting(true);
    try {
      await axios.patch(
        `https://api.saer.pk/api/agencies/${currentAgencyId}/`,
        { contacts: contentForm.contacts },
        axiosConfig
      );

      localStorage.removeItem(AGENCIES_CACHE_KEY);
      localStorage.removeItem(`${AGENCIES_CACHE_KEY}_timestamp`);
      setRefreshTrigger((prev) => prev + 1);
      setShowContentModal(false);
    } catch (error) {
      console.error("Error saving content:", error);
      alert(
        `Error: ${error.response?.data?.detail ||
        JSON.stringify(error.response?.data) ||
        error.message
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle agency deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this agency?")) {
      setIsLoading(true);
      try {
        await axios.delete(
          `https://api.saer.pk/api/agencies/${id}/`,
          axiosConfig
        );

        localStorage.removeItem(AGENCIES_CACHE_KEY);
        localStorage.removeItem(`${AGENCIES_CACHE_KEY}_timestamp`);

        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Error deleting agency:", error);
        alert(`Error: ${error.response?.data?.detail || error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, [refreshTrigger]);

  // Navigation tabs
  const tabs = [
    { name: "All Partners", path: "/partners" },
    { name: "Request", path: "/partners/request" },
    { name: "Group And Permissions", path: "/partners/role-permissions" },
    { name: "Discounts", path: "/partners/discounts" },
    { name: "Organizations", path: "/partners/organization" },
    { name: "Branches", path: "/partners/branche" },
    { name: "Agencies", path: "/partners/agencies" },
  ];

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
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Agencies"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                          }`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        {tab.name}
                      </NavLink>
                    ))}
                  </nav>
                  {/* <div className="d-flex align-items-center gap-3">
                    {branchId && (
                      <div className="badge bg-primary">
                        Branch:{" "}
                        {JSON.parse(localStorage.getItem("selectedBranch"))
                          ?.name || branchId}
                      </div>
                    )}
                  </div> */}
                  <div className="input-group" style={{ maxWidth: "300px" }}>
                    <span className="input-group-text">
                      <Search />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search name, address, phone, etc"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white my-3 rounded-3 shadow-sm">
                <div className="d-flex flex-wrap gap-2 justify-content-between">
                  <div>
                    <h5 className="fw-semibold mb-0">All Agencies</h5>
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
                        "Add Agency"
                      )}
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-2 align-items-center mb-3 flex-wrap gap-2">
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
                    {filteredAgencies.length === 0 ? (
                      <div className="text-center py-5">
                        <p>No agencies found</p>
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
                              <th>Agency Name</th>
                              <th>Phone</th>
                              <th>Email</th>
                              <th>Address</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedAgencies.map((agency) => (
                              <tr key={agency.id}>
                                <td>
                                  <Link
                                    to={{
                                      pathname: `/partners/message/${agency.id}`,
                                      state: { agencyData: agency },
                                    }}
                                    style={{
                                      cursor: "pointer",
                                      textDecoration: "underline",
                                    }}
                                  >
                                    {agency.id}
                                  </Link>
                                </td>
                                <td>{agency.name || "N/A"}</td>
                                <td>{agency.ageny_name || "N/A"}</td>
                                <td>{agency.phone_number || "N/A"}</td>
                                <td>{agency.email || "N/A"}</td>
                                <td>{agency.address || "N/A"}</td>
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
                                      {/* <Dropdown.Item
                                      className="text-primary"
                                      onClick={() =>
                                        handleShowContent(agency.id)
                                      }
                                      disabled={isSubmitting}
                                    >
                                      Add Contacts
                                    </Dropdown.Item> */}
                                      <Dropdown.Item
                                        className="text-success"
                                        onClick={() => handleShowEdit(agency)}
                                      >
                                        Edit
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        onClick={() => handleDelete(agency.id)}
                                        className="text-danger"
                                        disabled={isSubmitting}
                                      >
                                        Delete
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>

                        <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 mb-3">
                          <div className="d-flex flex-wrap align-items-center">
                            <span className="me-2">
                              Showing {paginatedAgencies.length} of{" "}
                              {filteredAgencies.length} agencies
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

        {/* Add/Edit Agency Modal */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
          size="md"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <Modal.Body>
            <h4 className="text-center fw-bold p-4 mb-4">
              {editingId ? "Edit Agency" : "New Agency"}
            </h4>
            <hr />
            <Form className="p-4">
              <div className="mb-3">
                <label htmlFor="" className="Control-label">Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  placeholder="Agency Name"
                  value={agencyForm.name}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Agency Name
                </label>
                <input
                  type="text"
                  name="ageny_name"
                  className="form-control rounded shadow-none px-1 py-2"
                  placeholder="Agency Name"
                  value={agencyForm.ageny_name}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  placeholder="agency@example.com"
                  value={agencyForm.email}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Phone No
                </label>
                <input
                  type="text"
                  name="phone_number"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  placeholder="+923631569595"
                  value={agencyForm.phone_number}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  placeholder="Agency Address"
                  value={agencyForm.address}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">Logo</label>
                <input
                  type="file"
                  name="logo"
                  className="form-control rounded shadow-none px-1 py-2"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {agencyForm.logo && typeof agencyForm.logo === "string" && (
                  <div className="mt-2">
                    <img
                      src={agencyForm.logo}
                      alt="Current logo"
                      style={{ maxWidth: "100px", maxHeight: "100px" }}
                    />
                  </div>
                )}
              </div>

              <input type="hidden" name="branch" value={branchId || ""} />

              <div className="row">
                <div className="col-md-6 d-flex align-items-center mb-3">
                  <Form.Check
                    type="switch"
                    id="agreement-active-switch"
                    name="agreement_status"
                    label="Agreement active"
                    checked={agencyForm.agreement_status}
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
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Content Modal */}
        {/* <Modal
          show={showContentModal}
          onHide={() => setShowContentModal(false)}
          centered
          size="md"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <Modal.Body>
            <h4 className="text-center fw-bold p-4 mb-4">Agency Contacts</h4>
            <hr />
            <Form className="p-4">
              {contentForm.contacts.map((contact, index) => (
                <div key={index} className="mb-4 border p-3 rounded">
                  <div className="d-flex justify-content-between mb-2">
                    <h6>Contact #{index + 1}</h6>
                    {index > 0 && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeContact(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="mb-3">
                    <fieldset className="border border-black p-2 rounded mb-3">
                      <legend className="float-none w-auto px-1 fs-6">
                        Name
                      </legend>
                      <input
                        type="text"
                        name="name"
                        className="form-control rounded shadow-none px-1 py-2"
                        placeholder="Contact Name"
                        value={contact.name}
                        onChange={(e) => handleContentChange(e, index)}
                      />
                    </fieldset>
                  </div>

                  <div className="mb-3">
                    <fieldset className="border border-black p-2 rounded mb-3">
                      <legend className="float-none w-auto px-1 fs-6">
                        Phone
                      </legend>
                      <input
                        type="text"
                        name="phone_number"
                        className="form-control rounded shadow-none border-0 px-1 py-2"
                        placeholder="Phone Number"
                        value={contact.phone_number}
                        onChange={(e) => handleContentChange(e, index)}
                      />
                    </fieldset>
                  </div>

                  <div className="mb-3">
                    <fieldset className="border border-black p-2 rounded mb-3">
                      <legend className="float-none w-auto px-1 fs-6">
                        Email
                      </legend>
                      <input
                        type="email"
                        name="email"
                        className="form-control rounded shadow-none border-0 px-1 py-2"
                        placeholder="Email"
                        value={contact.email}
                        onChange={(e) => handleContentChange(e, index)}
                      />
                    </fieldset>
                  </div>

                  <div className="mb-3">
                    <fieldset className="border border-black p-2 rounded mb-3">
                      <legend className="float-none w-auto px-1 fs-6">
                        Remarks
                      </legend>
                      <input
                        type="text"
                        name="remarks"
                        className="form-control rounded shadow-none border-0 px-1 py-2"
                        placeholder="Remarks"
                        value={contact.remarks}
                        onChange={(e) => handleContentChange(e, index)}
                      />
                    </fieldset>
                  </div>
                </div>
              ))}

              <div className="mb-3">
                <Button variant="secondary" onClick={addNewContact}>
                  Add Another Contact
                </Button>
              </div>

              <div className="d-flex justify-content-between">
                <Button
                  variant="primary"
                  onClick={handleContentSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "Save Contacts"
                  )}
                </Button>
                <Button
                  variant="light"
                  className="text-muted"
                  onClick={() => setShowContentModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal> */}
      </div>
    </>
  );
};

export default Agencies;
