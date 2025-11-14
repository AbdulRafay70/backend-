import React, { useState, useEffect } from "react";
import { Dropdown, Table, Button, Form, Modal } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Search } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { NavLink } from "react-router-dom";
import axios from "axios";

const Groups = () => {
  const API_URL = "http://127.0.0.1:8000/api/groups/";
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [permissions, setPermissions] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    permissions: [],
    extended: {
      type: "",
      organization: ""
    }
  });

  // Create Axios instance with common configuration
  const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Fetch groups, organizations, and permissions from API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch groups
      const groupsResponse = await api.get("/api/groups/");
      
      // Fetch organizations
      const orgsResponse = await api.get("/api/organizations/");
      setOrganizations(orgsResponse.data);
      
      // Fetch permissions
      const permsResponse = await api.get("/api/permissions/");
      setPermissions(permsResponse.data);
      
      setGroups(groupsResponse.data);
      setFilteredGroups(groupsResponse.data);
      setIsLoading(false);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm) {
      const filtered = groups.filter(group => 
        Object.values(group).some(val => 
          val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [searchTerm, groups]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith("extended.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        extended: {
          ...prev.extended,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle permission selection
  const handlePermissionChange = (e) => {
    const options = e.target.options;
    const selectedPermissions = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedPermissions.push(parseInt(options[i].value));
      }
    }
    
    setFormData(prev => ({
      ...prev,
      permissions: selectedPermissions
    }));
  };

  // Reset form and modal
  const resetForm = () => {
    setFormData({
      name: "",
      permissions: [],
      extended: {
        type: "",
        organization: ""
      }
    });
    setCurrentGroup(null);
    setEditMode(false);
  };

  // Open modal for creating new group
  const handleShowCreate = () => {
    resetForm();
    setShowModal(true);
  };

  // Open modal for editing group
  const handleShowEdit = (group) => {
    setFormData({
      name: group.name,
      permissions: group.permissions,
      extended: {
        type: group.extended?.type || "",
        organization: group.extended?.organization || ""
      }
    });
    setCurrentGroup(group);
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
    
    try {
      const payload = {
        ...formData,
        extended: {
          ...formData.extended,
          organization: formData.extended.organization || null
        }
      };

      if (editMode && currentGroup) {
        // Update existing group
        await api.put(`${API_URL}${currentGroup.id}/`, payload);
      } else {
        // Create new group
        await api.post(API_URL, payload);
      }

      // Refresh list
      fetchData();
      handleClose();
    } catch (error) {
      let errorMessage = error.message;
      
      // Extract server error message if available
      if (error.response) {
        errorMessage = error.response.data.message || 
                       error.response.data.detail || 
                       JSON.stringify(error.response.data);
      }
      
      setError(`Error: ${errorMessage}`);
      console.error("Error submitting group:", error);
    }
  };

  // Handle group deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      try {
        await api.delete(`${API_URL}${id}/`);
        
        // Refresh list
        fetchData();
      } catch (error) {
        setError(error.message);
        console.error("Error deleting group:", error);
      }
    }
  };

  const tabs = [
    { name: "All Partners", path: "/admin/partners" },
    { name: "Request", path: "/admin/partners/request" },
    { name: "Role And Permissions", path: "/admin/partners/role-permissions" },
    { name: "Discounts", path: "/admin/partners/discounts" },
    { name: "Organizations", path: "/admin/partners/organization" },
    { name: "Branches", path: "/admin/partners/branche" },
    { name: "Groups", path: "/admin/partners/group" },
  ];

  // Get permission names by IDs
  const getPermissionNames = (permissionIds) => {
    return permissionIds.map(id => {
      const perm = permissions.find(p => p.id === id);
      return perm ? perm.name : `Permission #${id}`;
    }).join(", ");
  };

  // Get organization name by ID
  const getOrganizationName = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : "N/A";
  };

  return (
    <div
      className="container-fluid"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <div className="row">
        <div className="col-lg-2 mb-3">
          <Sidebar />
        </div>
        <div className="col-lg-10" style={{ background: "#F2F3F4" }}>
          <Header />

          <div className="row my-3 w-100">
            <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
              {/* Navigation Tabs */}
              <nav className="nav flex-wrap gap-2">
                {tabs.map((tab, index) => (
                  <NavLink
                    key={index}
                    to={tab.path}
                    className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${
                      tab.name === "Groups"
                        ? "text-primary fw-semibold"
                        : "text-muted"
                    }`}
                    style={{ backgroundColor: "transparent" }}
                  >
                    {tab.name}
                  </NavLink>
                ))}
              </nav>

              {/* Action Buttons */}
              <div className="input-group" style={{ maxWidth: "300px" }}>
                <span className="input-group-text">
                  <Search />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search name, permissions, etc"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

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

          {/* Groups Table */}
          <div className="p-3 bg-white rounded shadow-sm">
            <div className="d-flex flex-wrap justify-content-between">
              <h5 className="fw-semibold mb-0">Groups</h5>
              <div className="d-flex gap-2">
                <button className="btn btn-primary" onClick={handleShowCreate}>
                  Add Group
                </button>
                <button className="btn btn-primary">Print</button>
                <button className="btn btn-primary">Download</button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading groups...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-5">
                <p>No groups found</p>
              </div>
            ) : (
              <>
                <Table hover responsive className="align-middle text-center mt-3">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Permissions</th>
                      <th>Type</th>
                      <th>Organization</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group) => (
                      <tr key={group.id}>
                        <td>{group.id}</td>
                        <td>{group.name}</td>
                        <td className="text-start">
                          {getPermissionNames(group.permissions)}
                        </td>
                        <td>{group.extended?.type || "N/A"}</td>
                        <td>
                          {group.extended?.organization 
                            ? getOrganizationName(group.extended.organization) 
                            : "N/A"}
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
                                onClick={() => handleShowEdit(group)}
                              >
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Item 
                                className="text-danger"
                                onClick={() => handleDelete(group.id)}
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
        </div>
      </div>

      {/* Group Modal */}
      <Modal
        show={showModal}
        onHide={handleClose}
        centered
        size="lg"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        <Modal.Body className="">
          <h4 className="text-center fw-bold p-4 mb-4">
            {editMode ? "Edit Group" : "New Group"}
          </h4>
          <hr />
          <Form onSubmit={handleSubmit} className="p-4">
            <div className="mb-3">
              <fieldset
                className="border border-black p-2 rounded mb-3"
                style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
              >
                <legend
                  className="float-none w-auto px-1 fs-6"
                  style={{
                    marginBottom: "0.25rem",
                    fontSize: "0.9rem",
                    lineHeight: "-1",
                  }}
                >
                  Group Name
                </legend>
                <input
                  type="text"
                  name="name"
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="Group Name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </fieldset>
            </div>

            <div className="mb-3">
              <fieldset
                className="border border-black p-2 rounded mb-3"
                style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
              >
                <legend
                  className="float-none w-auto px-1 fs-6"
                  style={{
                    marginBottom: "0.25rem",
                    fontSize: "0.9rem",
                    lineHeight: "-1",
                  }}
                >
                  Permissions (Hold Ctrl/Cmd to select multiple)
                </legend>
                <select
                  multiple
                  name="permissions"
                  className="form-control rounded shadow-none px-1 py-2"
                  style={{ height: "150px" }}
                  value={formData.permissions}
                  onChange={handlePermissionChange}
                  required
                >
                  {permissions.map(perm => (
                    <option key={perm.id} value={perm.id}>
                      {perm.name}
                    </option>
                  ))}
                </select>
              </fieldset>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <fieldset
                  className="border border-black p-2 rounded mb-3"
                  style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
                >
                  <legend
                    className="float-none w-auto px-1 fs-6"
                    style={{
                      marginBottom: "0.25rem",
                      fontSize: "0.9rem",
                      lineHeight: "-1",
                    }}
                  >
                    Type
                  </legend>
                  <input
                    type="text"
                    name="extended.type"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    placeholder="Type"
                    value={formData.extended.type}
                    onChange={handleInputChange}
                  />
                </fieldset>
              </div>
              
              <div className="col-md-6 mb-3">
                <fieldset
                  className="border border-black p-2 rounded mb-3"
                  style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
                >
                  <legend
                    className="float-none w-auto px-1 fs-6"
                    style={{
                      marginBottom: "0.25rem",
                      fontSize: "0.9rem",
                      lineHeight: "-1",
                    }}
                  >
                    Organization
                  </legend>
                  <select
                    name="extended.organization"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    value={formData.extended.organization}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </fieldset>
              </div>
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
  );
};

export default Groups;