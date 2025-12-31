import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dropdown,
  Table,
  Button,
  Form,
  Modal,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Search } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PartnersTabs from "../../components/PartnersTabs";
import { Link, NavLink } from "react-router-dom";
import AdminFooter from "../../components/AdminFooter";

// Shimmer loader component
const ShimmerLoader = ({ rows = 5, cols = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <tr key={rowIdx}>
        {Array.from({ length: cols }).map((_, colIdx) => (
          <td key={colIdx}>
            <div
              className="shimmer-line mb-0"
              style={{
                height: "20px",
                width: "100%",
                borderRadius: "4px",
                background:
                  "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// Cache key constants
const CACHE_KEYS = {
  BRANCHES: "branches_cache",
  ORGANIZATIONS: "organizations_cache",
  LAST_FETCHED: "last_fetched_time",
  CACHE_EXPIRY: 30 * 60 * 1000, // 30 minutes in milliseconds
};

const Branches = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [searchTerm, setSearchTerm] = useState("");
  const [branches, setBranches] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [orgMap, setOrgMap] = useState({});
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentBranch, setCurrentBranch] = useState({
    id: "",
    name: "",
    contact_number: "",
    email: "",
    address: "",
    organization: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("danger");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  const getAccessToken = () => localStorage.getItem("accessToken");

  const getAxiosInstance = () => {
    const token = getAccessToken();
    return axios.create({
      baseURL: "http://127.0.0.1:8000/api/",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const showNotification = (message, variant = "danger") => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  const handleApiError = (error, defaultMessage) => {
    console.error("API Error:", error.response?.data || error.message);
    if (error.response) {
      if (error.response.data?.detail) return error.response.data.detail;
      if (error.response.data?.name) return error.response.data.name[0];
      const errorKeys = Object.keys(error.response.data);
      if (errorKeys.length > 0) {
        const firstError = error.response.data[errorKeys[0]];
        return Array.isArray(firstError) ? firstError[0] : firstError;
      }
      return JSON.stringify(error.response.data);
    }
    return defaultMessage;
  };

  // Load data from cache if available and not expired
  const loadFromCache = () => {
    const lastFetched = localStorage.getItem(CACHE_KEYS.LAST_FETCHED);
    const now = new Date().getTime();

    if (lastFetched && now - parseInt(lastFetched) < CACHE_KEYS.CACHE_EXPIRY) {
      const cachedBranches = localStorage.getItem(CACHE_KEYS.BRANCHES);
      const cachedOrgs = localStorage.getItem(CACHE_KEYS.ORGANIZATIONS);

      if (cachedBranches && cachedOrgs) {
        try {
          const branchesData = JSON.parse(cachedBranches);
          const orgsData = JSON.parse(cachedOrgs);

          setBranches(branchesData);
          setOrganizations(orgsData);

          const map = {};
          orgsData.forEach((org) => (map[org.id] = org.name));
          setOrgMap(map);

          setLoading(false);
          return true; // Cache was successfully loaded
        } catch (e) {
          console.error("Error parsing cached data:", e);
          // Clear invalid cache
          localStorage.removeItem(CACHE_KEYS.BRANCHES);
          localStorage.removeItem(CACHE_KEYS.ORGANIZATIONS);
          localStorage.removeItem(CACHE_KEYS.LAST_FETCHED);
        }
      }
    }
    return false; // Cache not loaded
  };

  // Save data to cache
  const saveToCache = (branchesData, orgsData) => {
    try {
      localStorage.setItem(CACHE_KEYS.BRANCHES, JSON.stringify(branchesData));
      localStorage.setItem(CACHE_KEYS.ORGANIZATIONS, JSON.stringify(orgsData));
      localStorage.setItem(
        CACHE_KEYS.LAST_FETCHED,
        new Date().getTime().toString()
      );
    } catch (e) {
      console.error("Error saving to cache:", e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to load from cache
      if (loadFromCache()) {
        setLoading(false);
        return;
      }

      // If cache not available or expired, fetch from API
      const axiosInstance = getAxiosInstance();
      const [branchesRes, orgsRes] = await Promise.all([
        axiosInstance.get("branches/"),
        axiosInstance.get("organizations/"),
      ]);

      setBranches(branchesRes.data);
      setOrganizations(orgsRes.data);

      const map = {};
      orgsRes.data.forEach((org) => (map[org.id] = org.name));
      setOrgMap(map);

      // Save to cache
      saveToCache(branchesRes.data, orgsRes.data);

      setLoading(false);
    } catch (err) {
      const msg = handleApiError(err, "Failed to fetch data");
      setError(msg);
      setLoading(false);
      showNotification(msg);
    }
  };

  // Clear cache and force refresh
  const refreshData = async () => {
    localStorage.removeItem(CACHE_KEYS.BRANCHES);
    localStorage.removeItem(CACHE_KEYS.ORGANIZATIONS);
    localStorage.removeItem(CACHE_KEYS.LAST_FETCHED);
    await fetchData();
  };

  useEffect(() => {
    const storedOrg = localStorage.getItem("selectedOrganization");
    if (storedOrg) {
      setSelectedOrg(JSON.parse(storedOrg));
    }
    fetchData();
  }, []);

  // ... (keep all your existing functions the same until the createBranch, updateBranch, deleteBranch functions)

  const createBranch = async () => {
    if (!currentBranch.name.trim()) {
      showNotification("Branch name is required");
      return;
    }
    if (!selectedOrg || !selectedOrg.id) {
      showNotification("No organization selected");
      return;
    }

    try {
      setApiLoading(true);
      const data = {
        name: currentBranch.name,
        contact_number: currentBranch.contact_number,
        email: currentBranch.email,
        address: currentBranch.address,
        organization: selectedOrg.id,
      };

      const axiosInstance = getAxiosInstance();
      const res = await axiosInstance.post("branches/", data);

      setBranches((prev) => [...prev, res.data]);

      // Update cache with new data
      saveToCache([...branches, res.data], organizations);

      handleClose();
      showNotification("Branch created successfully!", "success");
    } catch (err) {
      showNotification(handleApiError(err, "Failed to create branch"));
    } finally {
      setApiLoading(false);
    }
  };

  const updateBranch = async () => {
    if (!currentBranch.name.trim()) {
      showNotification("Branch name is required");
      return;
    }
    if (!selectedOrg || !selectedOrg.id) {
      showNotification("No organization selected");
      return;
    }

    try {
      setApiLoading(true);
      const data = {
        name: currentBranch.name,
        contact_number: currentBranch.contact_number,
        email: currentBranch.email,
        address: currentBranch.address,
        organization: selectedOrg.id,
      };

      const axiosInstance = getAxiosInstance();
      const res = await axiosInstance.patch(
        `branches/${currentBranch.id}/`,
        data
      );

      const updatedBranches = branches.map((branch) =>
        branch.id === currentBranch.id ? res.data : branch
      );
      setBranches(updatedBranches);

      // Update cache with new data
      saveToCache(updatedBranches, organizations);

      handleClose();
      showNotification("Branch updated successfully!", "success");
    } catch (err) {
      showNotification(handleApiError(err, "Failed to update branch"));
    } finally {
      setApiLoading(false);
    }
  };

  const deleteBranch = async () => {
    if (!deleteId) return;

    try {
      setApiLoading(true);
      const axiosInstance = getAxiosInstance();
      await axiosInstance.delete(`branches/${deleteId}/`);

      const updatedBranches = branches.filter((b) => b.id !== deleteId);
      setBranches(updatedBranches);

      // Update cache with new data
      saveToCache(updatedBranches, organizations);

      showNotification("Branch deleted successfully!", "success");
    } catch (err) {
      showNotification(handleApiError(err, "Failed to delete branch"));
    } finally {
      setApiLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCreateModal = () => {
    setModalMode("create");
    setCurrentBranch({
      name: "",
      contact_number: "",
      email: "",
      address: "",
      organization: selectedOrg && selectedOrg.id ? selectedOrg.id : "",
    });
    setShowModal(true);
  };

  const handleEditModal = (branch) => {
    setModalMode("edit");
    setCurrentBranch({
      id: branch.id,
      name: branch.name,
      contact_number: branch.contact_number,
      email: branch.email,
      address: branch.address,
      organization: selectedOrg.id,
    });
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBranch((prev) => ({ ...prev, [name]: value }));
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = () => {
    modalMode === "create" ? createBranch() : updateBranch();
  };

  // Navigation is rendered by shared PartnersTabs

  // Filter branches by selected organization
  const filteredBranches = branches.filter((branch) => {
    // Only show branches for the selected organization
    if (
      selectedOrg &&
      selectedOrg.id &&
      branch.organization !== selectedOrg.id
    ) {
      return false;
    }

    const searchString =
      `${branch.name} ${branch.contact_number} ${branch.email} ${branch.address}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const indexOfLastItem = currentPage * perPage;
  const indexOfFirstItem = indexOfLastItem - perPage;
  const currentBranches = filteredBranches.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredBranches.length / perPage);

  const paginate = (page) => setCurrentPage(page);
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-line {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>

      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>

        <ToastContainer
          position="top-end"
          className="p-3"
          style={{ zIndex: 9999 }}
        >
          <Toast
            show={showToast}
            onClose={() => setShowToast(false)}
            delay={5000}
            autohide
            bg={toastVariant}
          >
            <Toast.Header>
              <strong className="me-auto">
                {toastVariant === "success" ? "Success" : "Error"}
              </strong>
            </Toast.Header>
            <Toast.Body className="text-white">{toastMessage}</Toast.Body>
          </Toast>
        </ToastContainer>
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

                {/* Organization Selection Notice */}
                {!selectedOrg && !loading && (
                  <div className="alert alert-warning" role="alert">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      <div>
                        <strong>No Organization Selected</strong>
                        <p className="mb-0">
                          Please select an organization to view its branches
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Branches Table */}
                <div className="p-3 my-3 bg-white rounded-4 shadow-sm">
                  <div className="d-flex flex-wrap justify-content-between mb-3">
                    <div>
                      <h5 className="fw-semibold mb-0">Branches</h5>
                      {selectedOrg && (
                        <p className="text-muted mb-0">
                          Showing branches for: <strong>{selectedOrg.name}</strong>
                        </p>
                      )}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-primary"
                        onClick={handleCreateModal}
                        disabled={apiLoading || !selectedOrg}
                      >
                        {apiLoading ? "Processing..." : "Add Branch"}
                      </button>
                      <button className="btn btn-primary">Print</button>
                      <button className="btn btn-primary">Download</button>
                    </div>
                  </div>

                  <Table hover responsive className="align-middle text-center">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Contact Number</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Organization</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <ShimmerLoader rows={perPage} cols={7} />
                      ) : !selectedOrg ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div className="d-flex flex-column align-items-center justify-content-center">
                              <i className="bi bi-building-exclamation fs-1 text-muted mb-2"></i>
                              <p className="mb-0">No organization selected</p>
                              <p className="mb-0">
                                Please select an organization to view branches
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredBranches.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            {searchTerm
                              ? "No branches match your search"
                              : "No branches found for this organization"}
                          </td>
                        </tr>
                      ) : (
                        currentBranches.map((branch) => (
                          <tr key={branch.id}>
                            <td>
                              <Link
                                to={{
                                  pathname: `/partners/branche/detail/${branch.id}`,
                                  state: { branchData: branch },
                                }}
                                style={{
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                              >
                                {branch.branch_code || branch.code || branch.id}
                              </Link>
                            </td>
                            <td>{branch.name}</td>
                            <td>{branch.contact_number || "N/A"}</td>
                            <td>{branch.email || "N/A"}</td>
                            <td>{branch.address || "N/A"}</td>
                            <td>{orgMap[branch.organization] || "N/A"}</td>
                            <td>
                              <Dropdown>
                                <Dropdown.Toggle
                                  variant="link"
                                  className="text-decoration-none p-0"
                                  disabled={apiLoading}
                                >
                                  <Gear size={18} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item
                                    className="text-success"
                                    onClick={() => handleEditModal(branch)}
                                    disabled={apiLoading}
                                  >
                                    Edit
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => confirmDelete(branch.id)}
                                    disabled={apiLoading}
                                  >
                                    Remove
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {!loading && selectedOrg && totalPages > 1 && (
                    <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 mb-3">
                      <div className="d-flex flex-wrap align-items-center">
                        <span className="me-2">
                          Showing{" "}
                          {filteredBranches.length > 0 ? indexOfFirstItem + 1 : 0}{" "}
                          to {Math.min(indexOfLastItem, filteredBranches.length)} of{" "}
                          {filteredBranches.length} entries
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
                              onClick={() => paginate(currentPage - 1)}
                              disabled={apiLoading}
                            >
                              Previous
                            </button>
                          </li>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                            (page) => (
                              <li
                                key={page}
                                className={`page-item ${currentPage === page ? "active" : ""
                                  }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => paginate(page)}
                                  disabled={apiLoading}
                                >
                                  {page}
                                </button>
                              </li>
                            )
                          )}

                          <li
                            className={`page-item ${currentPage === totalPages || totalPages === 0
                              ? "disabled"
                              : ""
                              }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => paginate(currentPage + 1)}
                              disabled={apiLoading}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </div>
                <div>
                  <AdminFooter />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Branch Modal */}
          <Modal
            show={showModal}
            onHide={handleClose}
            centered
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <Modal.Body className="">
              <h4 className="text-center fw-bold p-4 mb-4">
                {modalMode === "create" ? "New Branch" : "Edit Branch"}
              </h4>
              <hr />
              <Form className="p-4">
                <div className="mb-3">
                  <label htmlFor="" className="Control-label">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control rounded shadow-none  px-1 py-2"
                    required
                    placeholder="Branch Name"
                    value={currentBranch.name}
                    onChange={handleInputChange}
                    disabled={apiLoading}
                  />

                </div>

                <div className="mb-3">
                  <label htmlFor="" className="Control-label">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact_number"
                    className="form-control rounded shadow-none  px-1 py-2"
                    required
                    placeholder="+923631569595"
                    value={currentBranch.contact_number}
                    onChange={handleInputChange}
                    disabled={apiLoading}
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
                    placeholder="branch@example.com"
                    value={currentBranch.email}
                    onChange={handleInputChange}
                    disabled={apiLoading}
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
                    placeholder="Branch Address"
                    value={currentBranch.address}
                    onChange={handleInputChange}
                    rows="2"
                    disabled={apiLoading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="" className="Control-label">
                    Organization
                  </label>
                  <input
                    type="text"
                    name="organization"
                    className="form-control rounded shadow-none  px-1 py-2"
                    value={
                      selectedOrg
                        ? selectedOrg.name
                        : orgMap[currentBranch.organization] || "N/A"
                    }
                    readOnly
                    disabled
                  />
                </div>

                <div className="d-flex justify-content-between">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={apiLoading}
                  >
                    {apiLoading
                      ? "Processing..."
                      : modalMode === "create"
                        ? "Create"
                        : "Update"}
                  </Button>
                  <Button
                    variant="light"
                    className="text-muted"
                    onClick={handleClose}
                    disabled={apiLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            show={showDeleteConfirm}
            onHide={() => setShowDeleteConfirm(false)}
            centered
          >
            <Modal.Body className="p-4">
              <h5 className="text-center mb-4">Confirm Delete</h5>
              <p className="text-center">
                Are you sure you want to delete this branch? This action cannot be
                undone.
              </p>
              <div className="d-flex justify-content-center gap-3 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={apiLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={deleteBranch}
                  disabled={apiLoading}
                >
                  {apiLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </Modal.Body>
          </Modal>
        </div>
      </>
      );
};

      export default Branches;
