import React, { useState, useEffect } from "react";
import { Dropdown, Table, Button, Form, Modal } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Search, UploadCloudIcon } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PartnersTabs from "../../components/PartnersTabs";
import { NavLink } from "react-router-dom";
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

const Organization = () => {
  const API_URL = "https://api.saer.pk/api/organizations/";
  const CACHE_KEY = "organizations_cache";
  const CACHE_TIMESTAMP_KEY = "organizations_cache_timestamp";
  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes cache expiry

  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentOrganization, setCurrentOrganization] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    email: "",
    address: "",
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState(null);

  // Create Axios instance with common configuration
  const accessToken = localStorage.getItem("accessToken");

  const api = axios.create({
    baseURL: "https://api.saer.pk",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "multipart/form-data",
    },
  });

  // Load data from cache if valid
  const loadFromCache = () => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp) {
      const now = new Date().getTime();
      if (now - parseInt(cachedTimestamp) < CACHE_EXPIRY_MS) {
        return JSON.parse(cachedData);
      }
    }
    return null;
  };

  // Save data to cache
  const saveToCache = (data) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime().toString());
  };

  // Clear cache
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  };

  // Fetch organizations from API or cache
  const fetchOrganizations = async (forceRefresh = false) => {
    try {
      setIsLoading(true);

      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = loadFromCache();
        if (cachedData) {
          setOrganizations(cachedData);
          setFilteredOrganizations(cachedData);
          setIsLoading(false);
          return;
        }
      }

      // If no cache or forcing refresh, call API
      const response = await api.get("/api/organizations/");
      const data = response.data;

      // Update state and cache
      setOrganizations(data);
      setFilteredOrganizations(data);
      saveToCache(data);
      setIsLoading(false);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
      console.error("Error fetching organizations:", error);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm) {
      const filtered = organizations.filter((org) =>
        Object.values(org).some(
          (val) =>
            val &&
            val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredOrganizations(filtered);
    } else {
      setFilteredOrganizations(organizations);
    }
  }, [searchTerm, organizations]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle logo upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Reset form and modal
  const resetForm = () => {
    setFormData({
      name: "",
      phone_number: "",
      email: "",
      address: "",
      logo: null,
    });
    setLogoPreview(null);
    setCurrentOrganization(null);
    setEditMode(false);
  };

  // Open modal for creating new organization
  const handleShowCreate = () => {
    resetForm();
    setShowModal(true);
  };

  // Open modal for editing organization
  const handleShowEdit = (org) => {
    setFormData({
      name: org.name,
      phone_number: org.phone_number,
      email: org.email,
      address: org.address,
      logo: null,
    });
    setLogoPreview(org.logo || null);
    setCurrentOrganization(org);
    setEditMode(true);
    setShowModal(true);
  };

  // Close modal
  const handleClose = () => {
    setShowModal(false);
    resetForm();
  };

  // Handle form submission (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("phone_number", formData.phone_number);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("address", formData.address);
    if (formData.logo) {
      formDataToSend.append("logo", formData.logo);
    }

    try {
      if (editMode && currentOrganization) {
        // Update existing organization
        await api.put(
          `/api/organizations/${currentOrganization.id}/`,
          formDataToSend
        );
      } else {
        // Create new organization
        await api.post("/api/organizations/", formDataToSend);
      }

      // Refresh list and clear cache to force fresh data
      clearCache();
      fetchOrganizations(true);
      handleClose();
    } catch (error) {
      let errorMessage = error.message;

      // Extract server error message if available
      if (error.response) {
        errorMessage =
          error.response.data.message ||
          error.response.data.detail ||
          JSON.stringify(error.response.data);
      }

      setError(`Error: ${errorMessage}`);
      console.error("Error submitting organization:", error);
    }
  };

  // Handle organization deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this organization?")) {
      try {
        await api.delete(`/api/organizations/${id}/`);

        // Refresh list and clear cache to force fresh data
        clearCache();
        fetchOrganizations(true);
      } catch (error) {
        setError(error.message);
        console.error("Error deleting organization:", error);
      }
    }
  };

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
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              {/* Navigation Tabs */}
              <PartnersTabs />

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                  <button
                    type="button"
                    className="btn-close float-end"
                    onClick={() => setError(null)}
                    aria-label="Close"
                  ></button>
                </div>
              )}

              {/* Organization Table */}
              <div className="p-3 my-3 bg-white rounded shadow-sm">
                <div className="d-flex flex-wrap justify-content-between">
                  <h5 className="fw-semibold mb-0">Organizations</h5>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleShowCreate}
                    >
                      Add Organization
                    </button>
                    <button className="btn btn-primary">Print</button>
                    <button className="btn btn-primary">Download</button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="p-3">
                    <ShimmerLoader />
                  </div>
                ) : filteredOrganizations.length === 0 ? (
                  <div className="text-center py-5">
                    <p>No organizations found</p>
                  </div>
                ) : (
                  <>
                    <Table
                      hover
                      responsive
                      className="align-middle text-center mt-3"
                    >
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Address</th>
                          <th>Logo</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrganizations.map((org) => (
                          <tr key={org.id}>
                            <td>{org.id}</td>
                            <td>{org.name}</td>
                            <td>{org.phone_number}</td>
                            <td>{org.email}</td>
                            <td>{org.address}</td>
                            <td>
                              {org.logo && (
                                <img
                                  src={org.logo}
                                  alt="Organization logo"
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    objectFit: "cover",
                                  }}
                                />
                              )}
                            </td>
                            <td>
                              <Dropdown>
                                <Dropdown.Toggle
                                  variant="link"
                                  className="text-decoration-none p-0"
                                >
                                  <Gear size={18} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item
                                    className="text-primary"
                                    onClick={() => handleShowEdit(org)}
                                  >
                                    Edit
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => handleDelete(org.id)}
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

        {/* Organization Modal */}
        <Modal
          show={showModal}
          onHide={handleClose}
          centered
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <Modal.Body className="">
            <h4 className="text-center fw-bold p-4 mb-4">
              {editMode ? "Edit Organization" : "New Organization"}
            </h4>
            <hr />
            <Form onSubmit={handleSubmit} className="p-4">
              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-control rounded shadow-none  px-1 py-2"
                  required
                  placeholder="Organization Name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  className="form-control rounded shadow-none  px-1 py-2"
                  required
                  placeholder="+923631569595"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-control rounded shadow-none  px-1 py-2"
                  required
                  placeholder="organization@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="" className="Control-label">
                  Address
                </label>
                <textarea
                  name="address"
                  className="form-control rounded shadow-none  px-1 py-2"
                  required
                  placeholder="Organization Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                />
              </div>

              <div className="mb-4 text-center">
                <input
                  type="file"
                  id="logo-upload"
                  className="d-none"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                <label htmlFor="logo-upload" className="d-block cursor-pointer">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Organization Logo"
                      className="rounded-circle mb-2"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex flex-column align-items-center justify-content-center border rounded-circle mb-2"
                      style={{
                        width: "100px",
                        height: "100px",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      <UploadCloudIcon size={24} />
                      <small className="mt-1">Add Logo</small>
                    </div>
                  )}
                </label>
              </div>

              <div className="d-flex justify-content-between">
                <Button variant="primary" type="submit">
                  {editMode ? "Update" : "Save"}
                </Button>
                <Button
                  variant="light"
                  className="text-muted"
                  onClick={handleClose}
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

export default Organization;
