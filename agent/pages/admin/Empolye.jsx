import React, { useState, useEffect, useCallback } from "react";
import { Dropdown, Table, Button, Form, Modal } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { ArrowBigLeft, Funnel, Search, UploadCloudIcon } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";
import PartnersTabs from "../../components/PartnersTabs";
import document from "../../assets/document.jpg";
import axios from "axios";

const PartnerEmpolye = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalSub, setShowModalSub] = useState(false);

  // const handleShow = () => setShowModal(true);
  // const handleShowSub = () => setShowModalSub(true);

  const handleClose = () => setShowModal(false);
  const handleCloseSub = () => setShowModalSub(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get("https://api.saer.pk/api/branches/");
        setBranches(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Transform API data to match your table structure
  const transformBranchData = (branch) => ({
    code: branch.branch_id,
    NamePhone: `${branch.agent_name} +${branch.phone}`,
    CityName: branch.city,
    AGENCYNAMEAddress: `${branch.agency_name} ${branch.address}`,
    Status: branch.status,
    Action: "",
    // Add other fields you need for detail view
    agent_name: branch.agent_name,
    phone: branch.phone,
    city: branch.city,
    agency_name: branch.agency_name,
    address: branch.address,
    branch_id: branch.branch_id,
  });

  const data = branches.map(transformBranchData);

  const statusOptions = ["Active Account", "Dummy", "Cancel"];

  const filteredData =
    statusFilter === "" || statusFilter === "All"
      ? data
      : data.filter((item) => item.status === statusFilter);

  const tabs = [
    { name: "All Partners", path: "/admin/partners" },
    { name: "Request", path: "/admin/partners/request" },
    // { name: "Empolye and Branches", path: "/admin/partners/empolye" },
    // { name: "Portal Partner", path: "/admin/partners/portal" },
    { name: "Role And Permissions", path: "/admin/role-permissions" },
    { name: "Discounts", path: "/admin/discounts" },
  ];

  const [selectedUser, setSelectedUser] = useState(null);

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    otherContact: "",
    isActive: true,
    dashboard: true,
    packages: true,
    tickets: true,
    partners: true,
    orderDelivery: true,
    intimation: true,
    logs: true,
    fullControl: true,
  });

  // State for Add Sub-Agent form
  const [subAgentForm, setSubAgentForm] = useState({
    phone: "",
    name: "",
    email: "",
    onlyBookings: true,
    canMakeIssueBookings: true,
    onlyTicket: true,
    onlyUmrah: true,
    fullControl: true,
  });

  // Handle changes for Employee form
  const handleEmployeeChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setEmployeeForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // Handle changes for Sub-Agent form
  const handleSubAgentChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setSubAgentForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // Reset forms when modals are shown
  const handleShow = () => {
    setShowModal(true);
    setEmployeeForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      otherContact: "",
      isActive: true,
      dashboard: true,
      packages: true,
      tickets: true,
      partners: true,
      orderDelivery: true,
      intimation: true,
      logs: true,
      fullControl: true,
    });
  };

  const handleShowSub = () => {
    setShowModalSub(true);
    setSubAgentForm({
      phone: "",
      name: "",
      email: "",
      onlyBookings: true,
      canMakeIssueBookings: true,
      onlyTicket: true,
      onlyUmrah: true,
      fullControl: true,
    });
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

          <div className="px-3 px-lg-4 my-3">
            {/* Use shared PartnersTabs so Employee page shows the same partners navigation
                (this avoids hardcoded "/admin/..." links and duplicate /admin in URLs) */}
            <PartnersTabs activeName="Employees" />
          </div>

          {/* Partner Table or Detail View */}
          <div className="p-3 bg-white rounded shadow-sm">
            {selectedUser ? (
              <>
                <div className="d-flex align-items-center mb-4">
                  {/* Back Icon */}
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedUser(null)}
                    className="me-2"
                  >
                    <ArrowBigLeft />
                  </span>
                  <h5 className="fw-semibold mb-0">{selectedUser.code}</h5>
                </div>

                <div className="d-flex flex-wrap mt-5 gap-3">
                  <div className="flex-grow-1">
                    <h6>Agent Name:</h6>
                    <div>Reman Rafique</div>
                  </div>
                  <div className="flex-grow-1">
                    <h6>Contact:</h6>
                    <div>+923631569595</div>
                  </div>
                  <div className="flex-grow-1">
                    <h6>City Names</h6>
                    <div>Gujjranwala Travels</div>
                  </div>
                  <div className="flex-grow-1">
                    <h6>Address</h6>
                    <div>Gujjranwala Travels</div>
                  </div>
                  <div className="flex-grow-1">
                    <h6>Branch ID</h6>
                    <div>Yes</div>
                  </div>
                  <div className="flex-grow-1">
                    <h6>Status</h6>
                    <div className="text-success fw-bold">Active</div>
                  </div>
                  <div className="flex-grow-1">
                    <h6>Agreement</h6>
                    <div>Yes Level-1</div>
                  </div>
                </div>
                {/* SubAgent */}
                <div className="mt-5">
                  <h6 className="fw-bold">Add Sub-Agents</h6>
                  <div className="d-flex align-items-center mt-5 flex-wrap gap-3">
                    <div className="flex-grow-1 flex-column d-flex align-items-center">
                      <h6>Agent Name:</h6>
                      <div>Reman Rafique</div>
                    </div>
                    <div className="flex-grow-1 flex-column d-flex align-items-center">
                      <h6>Contact:</h6>
                      <div>+923631569595</div>
                    </div>
                    <div className="flex-grow-1 flex-column d-flex align-items-center">
                      <h6>Email</h6>
                      <div>Reman.Rafique@gmail.com</div>
                    </div>
                    <div className="flex-grow-1 flex-column d-flex align-items-center">
                      <h6>Role</h6>
                      <div className="d-flex gap-3">
                        <div>Edit</div>
                        <div>See</div>
                        <div className="text-danger">Delete</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agreement */}
                <div className="mt-5">
                  <h6 className="fw-bold">Agreement Documents</h6>
                  <div className="d-flex align-items-center mt-5 flex-wrap gap-3">
                    <div
                      className="rounded"
                      style={{ width: "450px", border: "3px dashed" }}
                    >
                      <img src={document} alt="" className="img-fluid" />
                    </div>
                    <div
                      className="rounded d-flex flex-column justify-content-center align-items-center p-4"
                      style={{
                        width: "450px",
                        height: "300px",
                        border: "3px dashed",
                      }}
                    >
                      <UploadCloudIcon size={"40px"} className="text-primary" />
                      <p style={{ color: "#898989" }}>
                        <span className="text-primary fw-bold">
                          Click to upload
                        </span>{" "}
                        or drag and drop SVG, PNG, or GIF (240×240 pixel @ 72
                        DPI <span className="fw-bold"> Max Size: 1MB</span> )
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="d-flex mt-5 flex-wrap gap-2 justify-content-end">
                  <button className="btn btn-primary" onClick={handleShowSub}>
                    Add Sub-Agent
                  </button>
                  <button className="btn btn-outline-secondary">Close</button>
                </div>
              </>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <h5 className="fw-semibold mb-0">All Empolyes / Branches</h5>
                  <Dropdown>
                    <Dropdown.Toggle variant="">
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

                <Table hover responsive className="align-middle text-center">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name & Phone</th>
                      <th>City Name</th>
                      <th>AGENCY NAME & Address</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="6" className="text-center text-danger">
                          Error: {error}
                        </td>
                      </tr>
                    ) : branches.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">
                          No branches found
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((row, index) => (
                        <tr key={index}>
                          <td
                            style={{
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                            onClick={() => setSelectedUser(row)}
                          >
                            {row.code}
                          </td>
                          <td>{row.NamePhone}</td>
                          <td>{row.CityName}</td>
                          <td>{row.AGENCYNAMEAddress}</td>
                          <td
                            className="fw-bold"
                            style={{
                              color:
                                row.Status === "Active"
                                  ? "#0EE924"
                                  : row.Status === "Dummy"
                                  ? "#FF9800"
                                  : "#F44336",
                            }}
                          >
                            {row.Status}
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
                                <Dropdown.Item className="text-primary">
                                  Edit
                                </Dropdown.Item>
                                <Dropdown.Item className="text-success">
                                  Active
                                </Dropdown.Item>
                                <Dropdown.Item className="text-danger">
                                  Block
                                </Dropdown.Item>
                                <Dropdown.Item>Cancel</Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>

                {/* Buttons */}
                <div className="d-flex flex-wrap gap-2 justify-content-end">
                  <button className="btn btn-primary" onClick={handleShow}>
                    Add Empolye
                  </button>
                  <button className="btn btn-outline-secondary">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Add partner */}
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Body>
          <h4 className="text-center fw-bold p-4 mb-4">Add Agent</h4>
          <hr />
          <Form>
            <div className="row mb-3">
              <div className="col-md-6">
                <fieldset className="border border-black p-2 rounded mb-3">
                  <legend className="float-none w-auto px-1 fs-6">Name</legend>
                  <input
                    type="text"
                    name="name"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="Reman Rafique"
                    value={employeeForm.name}
                    onChange={handleEmployeeChange}
                  />
                </fieldset>
              </div>
              <div className="col-md-6">
                <fieldset className="border border-black p-2 rounded mb-3">
                  <legend className="float-none w-auto px-1 fs-6">
                    Phone No
                  </legend>
                  <input
                    type="number"
                    name="phone"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="+923631569595"
                    value={employeeForm.phone}
                    onChange={handleEmployeeChange}
                  />
                </fieldset>
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-3">
              <fieldset className="border border-black p-2 rounded mb-3">
                <legend className="float-none w-auto px-1 fs-6">Email</legend>
                <input
                  type="email"
                  name="email"
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="Reman.Rafique@gmail.com"
                  value={employeeForm.email}
                  onChange={handleEmployeeChange}
                />
              </fieldset>
            </div>

            {/* Address Field */}
            <div className="mb-3">
              <fieldset className="border border-black p-2 rounded mb-3">
                <legend className="float-none w-auto px-1 fs-6">Address</legend>
                <input
                  type="text"
                  name="address"
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="SAER KARO TRAVELS AND TOURS..."
                  value={employeeForm.address}
                  onChange={handleEmployeeChange}
                />
              </fieldset>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Label>Agreement</Form.Label>
                <div>
                  <Button variant="primary">Upload</Button>
                </div>
              </div>
              <div className="col-md-6">
                <fieldset className="border border-black p-2 rounded mb-3">
                  <legend className="float-none w-auto px-1 fs-6">
                    City Name
                  </legend>
                  <input
                    type="text"
                    name="city"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="Lahore"
                    value={employeeForm.city}
                    onChange={handleEmployeeChange}
                  />
                </fieldset>
              </div>
            </div>

            <div className="mb-3 d-flex align-items-center gap-5">
              <fieldset className="border border-black p-2 rounded mb-3">
                <legend className="float-none w-auto px-1 fs-6">
                  Other Contact Details
                </legend>
                <input
                  type="text"
                  name="otherContact"
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="+923631569595"
                  value={employeeForm.otherContact}
                  onChange={handleEmployeeChange}
                />
              </fieldset>

              <div className="d-flex align-items-center mb-3">
                <Form.Check
                  type="switch"
                  id="active-switch"
                  label="Active"
                  name="isActive"
                  checked={employeeForm.isActive}
                  onChange={handleEmployeeChange}
                />
              </div>
            </div>

            {/* Permission Switches */}
            {[
              "dashboard",
              "packages",
              "tickets",
              "partners",
              "orderDelivery",
              "intimation",
              "logs",
              "fullControl",
            ].map((permission) => (
              <div
                key={permission}
                className="d-flex justify-content-between align-items-center mb-3"
              >
                <h6>
                  {permission.charAt(0).toUpperCase() + permission.slice(1)}
                </h6>
                <Form.Check
                  type="switch"
                  name={permission}
                  checked={employeeForm[permission]}
                  onChange={handleEmployeeChange}
                />
              </div>
            ))}

            <div className="d-flex justify-content-between">
              <Button variant="primary">Save</Button>
              <Button
                variant="light"
                className="text-muted border"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal subpartner */}
      <Modal show={showModalSub} onHide={handleCloseSub} centered>
        <Modal.Body>
          <h4 className="text-center fw-bold p-4 mb-4">Add Sub-Agent</h4>
          <hr />
          <Form>
            <div className="row mb-3">
              <div className="col-md-6">
                <fieldset className="border border-black p-2 rounded mb-3">
                  <legend className="float-none w-auto px-1 fs-6">
                    Phone No
                  </legend>
                  <input
                    type="number"
                    name="phone"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="+923631569595"
                    value={subAgentForm.phone}
                    onChange={handleSubAgentChange}
                  />
                </fieldset>
              </div>
              <div className="col-md-6">
                <fieldset className="border border-black p-2 rounded mb-3">
                  <legend className="float-none w-auto px-1 fs-6">Name</legend>
                  <input
                    type="text"
                    name="name"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="Reman Rafique"
                    value={subAgentForm.name}
                    onChange={handleSubAgentChange}
                  />
                </fieldset>
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-3">
              <fieldset className="border border-black p-2 rounded mb-3">
                <legend className="float-none w-auto px-1 fs-6">Email</legend>
                <input
                  type="email"
                  name="email"
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="Reman.Rafique@gmail.com"
                  value={subAgentForm.email}
                  onChange={handleSubAgentChange}
                />
              </fieldset>
            </div>

            {/* Permission Switches */}
            {[
              "onlyBookings",
              "canMakeIssueBookings",
              "onlyTicket",
              "onlyUmrah",
              "fullControl",
            ].map((permission) => (
              <div
                key={permission}
                className="d-flex justify-content-between align-items-center mb-3"
              >
                <h6>{permission.split(/(?=[A-Z])/).join(" ")}</h6>
                <Form.Check
                  type="switch"
                  name={permission}
                  checked={subAgentForm[permission]}
                  onChange={handleSubAgentChange}
                />
              </div>
            ))}

            <div className="d-flex justify-content-between">
              <Button variant="primary">Save</Button>
              <Button
                variant="light"
                className="text-muted"
                onClick={handleCloseSub}
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

export default PartnerEmpolye;
