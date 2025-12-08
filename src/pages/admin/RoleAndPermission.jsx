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
import { jwtDecode } from "jwt-decode";
import AdminFooter from "../../components/AdminFooter";

// Improved shimmer loader
const ShimmerTableRows = ({ rows = 5, cols = 5 }) => {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={rowIndex}>
      {Array.from({ length: cols }).map((_, colIndex) => (
        <td key={colIndex}>
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
          ></div>
        </td>
      ))}
    </tr>
  ));
};

const RoleAndPermissions = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [orgMap, setOrgMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentGroup, setCurrentGroup] = useState({
    id: "",
    name: "",
    extended: {
      type: "",
      organization: "",
    },
  });
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("danger");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  const getAccessToken = () => {
    return localStorage.getItem("accessToken");
  };

  const GROUPS_STORAGE_KEY = "cached_groups";
  const ORGS_STORAGE_KEY = "cached_organizations";
  const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

  const axiosInstance = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

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
      if (error.response.data?.extended?.organization)
        return error.response.data.extended.organization[0];
      const errorKeys = Object.keys(error.response.data);
      if (errorKeys.length > 0) {
        const firstError = error.response.data[errorKeys[0]];
        if (Array.isArray(firstError)) return firstError[0];
        return firstError;
      }
      return JSON.stringify(error.response.data);
    }
    return defaultMessage;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAccessToken();
      if (!token) throw new Error("No access token found");

      // Check if we have recent cached data
      const cachedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
      const cachedOrgs = localStorage.getItem(ORGS_STORAGE_KEY);

      let groupsData, orgsData;
      let useCache = false;

      if (cachedGroups && cachedOrgs) {
        const { data: groups, timestamp } = JSON.parse(cachedGroups);
        const { data: orgs, timestamp: orgsTimestamp } = JSON.parse(cachedOrgs);

        // Check if cache is still valid (less than 5 minutes old)
        const currentTime = new Date().getTime();
        if (
          currentTime - timestamp < CACHE_EXPIRY_TIME &&
          currentTime - orgsTimestamp < CACHE_EXPIRY_TIME
        ) {
          groupsData = groups;
          orgsData = orgs;
          useCache = true;
        }
      }

      if (!useCache) {
        // Fetch fresh data from API
        const [groupsResponse, orgsResponse] = await Promise.all([
          axiosInstance.get("groups/"),
          axiosInstance.get("organizations/"),
        ]);

        groupsData = groupsResponse.data;
        orgsData = orgsResponse.data;

        // Store in localStorage with timestamp
        const timestamp = new Date().getTime();
        localStorage.setItem(
          GROUPS_STORAGE_KEY,
          JSON.stringify({
            data: groupsData,
            timestamp,
          })
        );
        localStorage.setItem(
          ORGS_STORAGE_KEY,
          JSON.stringify({
            data: orgsData,
            timestamp,
          })
        );
      }

      const groupsWithFallback = groupsData.map((group) => ({
        ...group,
        extended: group.extended || { organization: "" },
      }));

      // FILTER GROUPS BY SELECTED ORGANIZATION
      const storedOrg = localStorage.getItem("selectedOrganization");
      const selectedOrgId = storedOrg ? JSON.parse(storedOrg).id : null;

      const filteredGroups = selectedOrgId
        ? groupsWithFallback.filter(
          (group) => group.extended?.organization === selectedOrgId
        )
        : groupsWithFallback;

      setGroups(filteredGroups);
      setOrganizations(orgsData);

      const map = {};
      orgsData.forEach((org) => {
        map[org.id] = org.name;
      });
      setOrgMap(map);

      setLoading(false);
    } catch (err) {
      // If API fails, try to use cached data as fallback
      const cachedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
      const cachedOrgs = localStorage.getItem(ORGS_STORAGE_KEY);

      if (cachedGroups && cachedOrgs) {
        const { data: groups } = JSON.parse(cachedGroups);
        const { data: orgs } = JSON.parse(cachedOrgs);

        const groupsWithFallback = groups.map((group) => ({
          ...group,
          extended: group.extended || { organization: "" },
        }));

        const storedOrg = localStorage.getItem("selectedOrganization");
        const selectedOrgId = storedOrg ? JSON.parse(storedOrg).id : null;

        const filteredGroups = selectedOrgId
          ? groupsWithFallback.filter(
            (group) => group.extended?.organization === selectedOrgId
          )
          : groupsWithFallback;

        setGroups(filteredGroups);
        setOrganizations(orgs);

        const map = {};
        orgs.forEach((org) => {
          map[org.id] = org.name;
        });
        setOrgMap(map);
      }

      const errorMsg = handleApiError(err, "Failed to fetch data");
      setError(errorMsg);
      setLoading(false);
      showNotification(errorMsg);
    }
  };

  useEffect(() => {
    fetchData();

    const storedOrg = localStorage.getItem("selectedOrganization");
    if (storedOrg) {
      const org = JSON.parse(storedOrg);
      setSelectedOrg(org);

      setCurrentGroup((prev) => ({
        ...prev,
        extended: {
          ...prev.extended,
          organization: org.id,
        },
      }));
    }
  }, []);

  const handleCreateModal = () => {
    setModalMode("create");
    setCurrentGroup({
      name: "",
      extended: {
        type: "",
        organization: selectedOrg ? selectedOrg.id : "",
      },
    });
    setShowModal(true);
  };

  const handleEditModal = (group) => {
    setModalMode("edit");
    let orgId = "";
    if (group.extended) {
      if (typeof group.extended.organization === "object") {
        orgId = group.extended.organization.id || "";
      } else {
        orgId = group.extended.organization || "";
      }
    }
    setCurrentGroup({
      id: group.id,
      name: group.name,
      extended: {
        ...group.extended,
        organization: selectedOrg ? selectedOrg.id : orgId,
      },
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("extended.")) {
      const field = name.split(".")[1];
      setCurrentGroup((prev) => ({
        ...prev,
        extended: {
          ...prev.extended,
          [field]: value,
        },
      }));
    } else {
      setCurrentGroup((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const createGroup = async () => {
    if (!currentGroup.name.trim()) {
      showNotification("Group name is required");
      return;
    }
    if (!selectedOrg) {
      showNotification("Organization is required");
      return;
    }
    try {
      setApiLoading(true);

      const data = {
        name: currentGroup.name,
        permissions: [],
        extended: {
          ...currentGroup.extended,
          organization: Number(selectedOrg.id),
        },
      };

      const response = await axiosInstance.post("groups/", data);

      // Update local state
      const newGroup = {
        ...response.data,
        extended: response.data.extended || { organization: "" },
      };
      setGroups((prev) => [...prev, newGroup]);

      // Update localStorage
      const cachedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (cachedGroups) {
        const { data: groups, timestamp } = JSON.parse(cachedGroups);
        localStorage.setItem(
          GROUPS_STORAGE_KEY,
          JSON.stringify({
            data: [...groups, newGroup],
            timestamp: new Date().getTime(),
          })
        );
      }

      handleClose();
      showNotification("Group created successfully!", "success");
    } catch (err) {
      const errorMsg = handleApiError(err, "Failed to create group");
      showNotification(errorMsg);
    } finally {
      setApiLoading(false);
    }
  };

  const updateGroup = async () => {
    if (!currentGroup.name.trim()) {
      showNotification("Group name is required");
      return;
    }
    if (!selectedOrg) {
      showNotification("Organization is required");
      return;
    }
    try {
      setApiLoading(true);

      const data = {
        name: currentGroup.name,
        permissions: [],
        extended: {
          ...currentGroup.extended,
          organization: Number(selectedOrg.id),
        },
      };

      await axiosInstance.patch(`groups/${currentGroup.id}/`, data);

      // Update local state
      const updatedGroups = groups.map((group) =>
        group.id === currentGroup.id ? { ...group, ...data } : group
      );
      setGroups(updatedGroups);

      // Update localStorage
      const cachedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (cachedGroups) {
        const { data: groups, timestamp } = JSON.parse(cachedGroups);
        const updatedCacheGroups = groups.map((group) =>
          group.id === currentGroup.id ? { ...group, ...data } : group
        );
        localStorage.setItem(
          GROUPS_STORAGE_KEY,
          JSON.stringify({
            data: updatedCacheGroups,
            timestamp: new Date().getTime(),
          })
        );
      }

      handleClose();
      showNotification("Group updated successfully!", "success");
    } catch (err) {
      const errorMsg = handleApiError(err, "Failed to update group");
      showNotification(errorMsg);
    } finally {
      setApiLoading(false);
    }
  };

  const deleteGroup = async () => {
    if (!deleteId) return;
    try {
      setApiLoading(true);
      await axiosInstance.delete(`groups/${deleteId}/`);

      // Update local state
      const updatedGroups = groups.filter((group) => group.id !== deleteId);
      setGroups(updatedGroups);

      // Update localStorage
      const cachedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (cachedGroups) {
        const { data: groups, timestamp } = JSON.parse(cachedGroups);
        const updatedCacheGroups = groups.filter(
          (group) => group.id !== deleteId
        );
        localStorage.setItem(
          GROUPS_STORAGE_KEY,
          JSON.stringify({
            data: updatedCacheGroups,
            timestamp: new Date().getTime(),
          })
        );
      }

      showNotification("Group deleted successfully!", "success");
    } catch (err) {
      const errorMsg = handleApiError(err, "Failed to delete group");
      showNotification(errorMsg);
    } finally {
      setApiLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = () => {
    modalMode === "create" ? createGroup() : updateGroup();
  };

  useEffect(() => {
    fetchData();

    const storedOrg = localStorage.getItem("selectedOrganization");
    if (storedOrg) {
      const org = JSON.parse(storedOrg);
      setSelectedOrg(org);

      // Set current group's organization to the stored org
      setCurrentGroup((prev) => ({
        ...prev,
        extended: {
          ...prev.extended,
          organization: org.id,
        },
      }));
    }
  }, []);

  // Navigation is rendered by shared PartnersTabs

  const filteredGroups = groups.filter((group) => {
    const name = group.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const indexOfLastItem = currentPage * perPage;
  const indexOfFirstItem = indexOfLastItem - perPage;
  const currentGroups = filteredGroups.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGroups.length / perPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>

        {/* Toast Notification */}
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

                {/* Table */}
                <div className="p-3 my-3 bg-white rounded-4 shadow-sm">
                  {/* Add organization check message */}
                  {!selectedOrg && (
                    <div className="alert alert-warning">
                      <strong>No organization selected!</strong> Please select an
                      organization to view its groups.
                    </div>
                  )}
                  <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
                    <div>
                      <h5 className="fw-semibold mb-0">Group And Permissions</h5>
                      {selectedOrg && (
                        <p className="text-muted mb-0">
                          Showing Groups for: <strong>{selectedOrg.name}</strong>
                        </p>
                      )}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-primary"
                        onClick={handleCreateModal}
                        disabled={apiLoading}
                      >
                        {apiLoading ? "Processing..." : "Add Group"}
                      </button>
                      <Link
                        to="/partners/role-permissions/update-permissions"
                        className="btn btn-primary"
                      >
                        Assign Permissions
                      </Link>
                      <button className="btn btn-primary">Print</button>
                      <button className="btn btn-primary">Download</button>
                    </div>
                  </div>

                  <Table hover responsive className="align-middle text-center">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <ShimmerTableRows rows={perPage} cols={5} />
                      ) : error ? (
                        <tr>
                          <td colSpan="5" className="text-center text-danger py-4">
                            {error}
                          </td>
                        </tr>
                      ) : currentGroups.length > 0 ? (
                        currentGroups.map((group) => (
                          <tr key={group.id}>
                            <td>{group.id || "N/A"}</td>
                            <td>{group.name || "N/A"}</td>
                            <td>{group.extended?.type || "N/A"}</td>
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
                                    onClick={() => handleEditModal(group)}
                                    disabled={apiLoading}
                                  >
                                    Edit
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => confirmDelete(group.id)}
                                    disabled={apiLoading}
                                  >
                                    Remove
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            No groups found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {!loading && !error && totalPages > 1 && (
                    <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 mb-3">
                      <div className="d-flex align-items-center">
                        <span className="me-2">
                          Showing{" "}
                          {filteredGroups.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                          {Math.min(indexOfLastItem, filteredGroups.length)} of{" "}
                          {filteredGroups.length} entries
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
                                >
                                  {page}
                                </button>
                              </li>
                            )
                          )}
                          <li
                            className={`page-item ${currentPage === totalPages ? "disabled" : ""
                              }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => paginate(currentPage + 1)}
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

          {/* Create/Edit Modal */}
          <Modal show={showModal} onHide={handleClose} centered size="md">
            <Modal.Body>
              <h4 className="text-center fw-bold p-4 mb-4">
                {modalMode === "create" ? "Add Group" : "Edit Group"}
              </h4>
              <hr />
              <Form className="p-4">
                {/* Group Name */}
                <div>
                  <label htmlFor="" className="Control-label">
                    Group Name
                  </label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={currentGroup.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Admin Group"
                    disabled={apiLoading}
                    className=" shadow-none px-1 py-2"
                  />
                </div>

                {/* Type */}
                <div>
                  <label htmlFor="" className="Control-label">
                    Type
                  </label>
                  <Form.Select
                    name="extended.type"
                    value={currentGroup.extended.type}
                    onChange={handleInputChange}
                    disabled={apiLoading}
                    className=" shadow-none px-1 py-2"
                  >
                    <option value="">Select Type</option>
                    <option value="agents">Agent</option>
                    <option value="employee">Employee</option>
                  </Form.Select>
                </div>

                {/* Organization */}
                <div className="mb-3">
                  <label htmlFor="" className="Control-label">
                    Organization
                  </label>
                  <Form.Control
                    type="text"
                    value={
                      selectedOrg ? selectedOrg.name : "No organization selected"
                    }
                    disabled
                    className=" shadow-none px-1 py-2"
                  />
                </div>

                {/* Buttons */}
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

          {/* Delete Confirmation */}
          <Modal
            show={showDeleteConfirm}
            onHide={() => setShowDeleteConfirm(false)}
            centered
          >
            <Modal.Body className="p-4">
              <h5 className="text-center mb-4">Confirm Delete</h5>
              <p className="text-center">
                Are you sure you want to delete this group? This action cannot be
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
                  onClick={deleteGroup}
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

      export default RoleAndPermissions;
