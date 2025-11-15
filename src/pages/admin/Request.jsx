import React, { useState } from "react";
import { Dropdown, Table, Button, Form, Modal } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { ArrowBigLeft, Funnel, Search, UploadCloudIcon } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PartnersTabs from "../../components/PartnersTabs";
import { Link, NavLink } from "react-router-dom";
import document from "../../assets/document.jpg";
import AdminFooter from "../../components/AdminFooter"


const Request = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalSub, setShowModalSub] = useState(false);

  // State for Partner Form
  const [partnerForm, setPartnerForm] = useState({
    phoneNo: "",
    name: "",
    email: "",
    address: "",
    cityName: "",
    otherContact: "",
    activeStatus: true,
  });

  // State for Sub-Agent Form
  const [subAgentForm, setSubAgentForm] = useState({
    phoneNo: "",
    name: "",
    email: "",
    onlyBookings: false,
    makeIssueBookings: false,
    onlyTicket: false,
    onlyUmrah: false,
    fullControl: false,
  });

  // State for Agreement File
  const [agreementFile, setAgreementFile] = useState(null);

  const handleShow = () => setShowModal(true);
  const handleShowSub = () => setShowModalSub(true);

  const handleClose = () => {
    setShowModal(false);
    // Reset partner form
    setPartnerForm({
      phoneNo: "",
      name: "",
      email: "",
      address: "",
      cityName: "",
      otherContact: "",
      activeStatus: true,
    });
    setAgreementFile(null);
  };

  const handleCloseSub = () => {
    setShowModalSub(false);
    // Reset sub-agent form
    setSubAgentForm({
      phoneNo: "",
      name: "",
      email: "",
      onlyBookings: false,
      makeIssueBookings: false,
      onlyTicket: false,
      onlyUmrah: false,
      fullControl: false,
    });
  };

  // Handle partner form changes
  const handlePartnerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPartnerForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle sub-agent form changes
  const handleSubAgentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubAgentForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle file upload
  const handleFileChange = (e) => {
    setAgreementFile(e.target.files[0]);
  };

  // Submit handlers
  const handlePartnerSubmit = () => {
    console.log("Partner Data:", {
      ...partnerForm,
      agreementFile: agreementFile ? agreementFile.name : null,
    });
    handleClose();
  };

  const handleSubAgentSubmit = () => {
    console.log("Sub-Agent Data:", subAgentForm);
    handleCloseSub();
  };

  const [searchTerm, setSearchTerm] = useState("");

  const data = [
    {
      code: "369asd",
      NamePhone: "Reman Rafique+923631569595",
      CityName: "Gujjranwala Travels ",
      AGENCYNAMEAddress:
        "SAER KARO TRAVELS AND TOURSHillite town, Street 78, Gujranwala",
      Status: "Active",
      Action: "",
    },
    {
      code: "369asd",
      NamePhone: "Reman Rafique+923631569595",
      CityName: "Gujjranwala Travels ",
      AGENCYNAMEAddress:
        "SAER KARO TRAVELS AND TOURSHillite town, Street 78, Gujranwala",
      Status: "Active",
      Action: "",
    },
    {
      code: "369asd",
      NamePhone: "Reman Rafique+923631569595",
      CityName: "Gujjranwala Travels ",
      AGENCYNAMEAddress:
        "SAER KARO TRAVELS AND TOURSHillite town, Street 78, Gujranwala",
      Status: "Active",
      Action: "",
    },
    {
      code: "369asd",
      NamePhone: "Reman Rafique+923631569595",
      CityName: "Gujjranwala Travels ",
      AGENCYNAMEAddress:
        "SAER KARO TRAVELS AND TOURSHillite town, Street 78, Gujranwala",
      Status: "Active",
      Action: "",
    },
  ];

  const statusOptions = ["Active Account", "Dummy", "Cancel"];

  const filteredData =
    statusFilter === "" || statusFilter === "All"
      ? data
      : data.filter((item) => item.status === statusFilter);

  // Navigation is rendered by shared PartnersTabs

  const [selectedUser, setSelectedUser] = useState(null);

  return (
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

          {/* Partner Table or Detail View */}
          <div className="p-3 my-3 bg-white rounded shadow-sm">
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
                  <h5 className="fw-semibold mb-0">All Requested Partner’s</h5>
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
                    {filteredData.map((row, index) => (
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
                        <td className="fw-bold" style={{ color: "#0EE924" }}>
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
                    ))}
                  </tbody>
                </Table>
                {/* Buttons */}
                <div className="d-flex flex-wrap gap-2 justify-content-end">
                  <button className="btn btn-primary" onClick={handleShow}>
                    Add Partner
                  </button>
                  <button className="btn btn-outline-secondary">Close</button>
                </div>
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

      {/* Modal Add partner */}
      <Modal
        show={showModal}
        onHide={handleClose}
        centered
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        <Modal.Body className="">
          <h4 className="text-center fw-bold p-4 mb-4">Add Agent</h4>
          <hr />
          <Form className="p-4">
            <div className="row mb-3">
              <div className="col-md-6">
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
                    Phone No
                  </legend>
                  <input
                    type="number"
                    name="phoneNo"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="+923631569595"
                    value={partnerForm.phoneNo}
                    onChange={handlePartnerChange}
                  />
                </fieldset>
              </div>
              <div className="col-md-6">
                <fieldset
                  className="border border-black  p-2 rounded mb-3"
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
                    Name
                  </legend>
                  <input
                    type="text"
                    name="name"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="Reman Rafique"
                    value={partnerForm.name}
                    onChange={handlePartnerChange}
                  />
                </fieldset>
              </div>
            </div>

            <div className="mb-3">
              <fieldset
                className="border border-black  p-2 rounded mb-3"
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
                  Email
                </legend>
                <input
                  type="email"
                  name="email"
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="Reman.Rafique@gmail.com"
                  value={partnerForm.email}
                  onChange={handlePartnerChange}
                />
              </fieldset>
            </div>

            <div className="mb-3">
              <fieldset
                className="border border-black  p-2 rounded mb-3"
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
                  Address
                </legend>
                <input
                  type="text"
                  name="address"
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="SAER KARO TRAVELS AND TOURS"
                  value={partnerForm.address}
                  onChange={handlePartnerChange}
                />
              </fieldset>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Label>Agreement</Form.Label>
                <div>
                  <Button
                    variant="primary"
                    onClick={() => document.getElementById("fileInput").click()}
                  >
                    Upload
                  </Button>
                  <input
                    id="fileInput"
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  {agreementFile && (
                    <span className="ms-2">{agreementFile.name}</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <fieldset
                  className="border border-black  p-2 rounded mb-3"
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
                    City Name
                  </legend>
                  <input
                    type="text"
                    name="cityName"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="Lahore"
                    value={partnerForm.cityName}
                    onChange={handlePartnerChange}
                  />
                </fieldset>
              </div>
            </div>

            <div className="mb-3">
              <fieldset
                className="border border-black  p-2 rounded mb-3"
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
                  Other Contact Details
                </legend>
                <input
                  type="text"
                  name="otherContact"
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="+923631569595"
                  value={partnerForm.otherContact}
                  onChange={handlePartnerChange}
                />
              </fieldset>
            </div>

            <div className="d-flex align-items-center mb-3">
              <Form.Check
                type="switch"
                id="active-switch"
                name="activeStatus"
                label="Active"
                checked={partnerForm.activeStatus}
                onChange={handlePartnerChange}
              />
            </div>

            <div className="d-flex justify-content-between">
              <Button variant="primary" onClick={handlePartnerSubmit}>
                Save
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

      {/* Modal subpartner */}
      <Modal
        show={showModalSub}
        onHide={handleCloseSub}
        centered
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        <Modal.Body className="">
          <h4 className="text-center fw-bold p-4 mb-4">Add Sub-Agent</h4>
          <hr />
          <Form className="p-4">
            <div className="row mb-3">
              <div className="col-md-6">
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
                    Phone No
                  </legend>
                  <input
                    type="number"
                    name="phoneNo"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="+923631569595"
                    value={subAgentForm.phoneNo}
                    onChange={handleSubAgentChange}
                  />
                </fieldset>
              </div>
              <div className="col-md-6">
                <fieldset
                  className="border border-black  p-2 rounded mb-3"
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
                    Name
                  </legend>
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

            <div className="mb-3">
              <fieldset
                className="border border-black  p-2 rounded mb-3"
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
                  Email
                </legend>
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

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Only Bookings</h6>
              <Form.Check
                type="switch"
                id="onlyBookings-switch"
                name="onlyBookings"
                checked={subAgentForm.onlyBookings}
                onChange={handleSubAgentChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Can make and issue Bookings</h6>
              <Form.Check
                type="switch"
                id="makeIssueBookings-switch"
                name="makeIssueBookings"
                checked={subAgentForm.makeIssueBookings}
                onChange={handleSubAgentChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>only Ticket</h6>
              <Form.Check
                type="switch"
                id="onlyTicket-switch"
                name="onlyTicket"
                checked={subAgentForm.onlyTicket}
                onChange={handleSubAgentChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>only umrah</h6>
              <Form.Check
                type="switch"
                id="onlyUmrah-switch"
                name="onlyUmrah"
                checked={subAgentForm.onlyUmrah}
                onChange={handleSubAgentChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Full Control</h6>
              <Form.Check
                type="switch"
                id="fullControl-switch"
                name="fullControl"
                checked={subAgentForm.fullControl}
                onChange={handleSubAgentChange}
              />
            </div>

            <div className="d-flex justify-content-between">
              <Button variant="primary" onClick={handleSubAgentSubmit}>
                Save
              </Button>
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

export default Request;
