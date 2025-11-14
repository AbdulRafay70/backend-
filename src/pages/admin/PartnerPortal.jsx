import React, { useState } from "react";
import { Dropdown, Table, Button, Form, Modal } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { ArrowBigLeft, Funnel, Search, UploadCloudIcon } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";
import document from "../../assets/document.jpg";

const PartnerPortal = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalSub, setShowModalSub] = useState(false);

  const handleShow = () => setShowModal(true);
  const handleShowSub = () => setShowModalSub(true);

  const [searchTerm, setSearchTerm] = useState("");

  // State for Add Portal Partner modal
  const [partnerForm, setPartnerForm] = useState({
    partnerName: '',
    domainName: '',
    phone: '',
    commissionTicketPkr: '',
    email: '',
    commissionTicketForThem: '',
    canSellTickets: true,
    allowSubAgents: true,
    allowTicketSync: true,
    canSellUmrah: true,
    accountActive: true
  });

  // State for Add Sub-Agent modal
  const [subAgentForm, setSubAgentForm] = useState({
    phone: '',
    name: '',
    email: '',
    onlyBookings: true,
    canMakeBookings: true,
    onlyTicket: true,
    onlyUmrah: true,
    fullControl: true
  });

  // Handle changes for Partner form
  const handlePartnerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPartnerForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle changes for Sub-Agent form
  const handleSubAgentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubAgentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Reset forms when modals close
  const handleClose = () => {
    setShowModal(false);
    setPartnerForm({
      partnerName: '',
      domainName: '',
      phone: '',
      commissionTicketPkr: '',
      email: '',
      commissionTicketForThem: '',
      canSellTickets: true,
      allowSubAgents: true,
      allowTicketSync: true,
      canSellUmrah: true,
      accountActive: true
    });
  };

  const handleCloseSub = () => {
    setShowModalSub(false);
    setSubAgentForm({
      phone: '',
      name: '',
      email: '',
      onlyBookings: true,
      canMakeBookings: true,
      onlyTicket: true,
      onlyUmrah: true,
      fullControl: true
    });
  };

  const data = [
    {
      code: "369asd",
      namephone: "Reman Rafique<br>923631569595",
      domain: "saer.pk",
      subaagents: "10",
      wetothem: "10",
      themtous: "10",
      Status: "Active",
      Action: "",
    },
    {
      code: "369asd",
      namephone: "Reman Rafique<br>923631569595",
      domain: "saer.pk",
      subaagents: "10",
      wetothem: "10",
      themtous: "10",
      Status: "Active",
      Action: "",
    },
    {
      code: "369asd",
      namephone: "Reman Rafique<br>923631569595",
      domain: "saer.pk",
      subaagents: "10",
      wetothem: "10",
      themtous: "10",
      Status: "Active",
      Action: "",
    },
    {
      code: "369asd",
      namephone: "Reman Rafique<br>923631569595",
      domain: "saer.pk",
      subaagents: "10",
      wetothem: "10",
      themtous: "10",
      Status: "Active",
      Action: "",
    },
    {
      code: "369asd",
      namephone: "Reman Rafique<br>923631569595",
      domain: "saer.pk",
      subaagents: "10",
      wetothem: "10",
      themtous: "10",
      Status: "Active",
      Action: "",
    },
    {
      code: "369asd",
      namephone: "Reman Rafique<br>923631569595",
      domain: "saer.pk",
      subaagents: "10",
      wetothem: "10",
      themtous: "10",
      Status: "Active",
      Action: "",
    },
    {
      code: "369asd",
      namephone: "Reman Rafique<br>923631569595",
      domain: "saer.pk",
      subaagents: "10",
      wetothem: "10",
      themtous: "10",
      Status: "Active",
      Action: "",
    },
    {
      code: "369asd",
      namephone: "Reman Rafique<br>923631569595",
      domain: "saer.pk",
      subaagents: "10",
      wetothem: "10",
      themtous: "10",
      Status: "Active",
      Action: "",
    },
  ];

  const statusOptions = ["Active Account", "Dummy", "Cancel"];

  const filteredData =
    statusFilter === "" || statusFilter === "All"
      ? data
      : data.filter((item) => item.status === statusFilter);

  const tabs = [
    { name: "All Partners", path: "/admin/partners" },
    { name: "Request", path: "/admin/partners/request" },
    { name: "Empolye and branches", path: "/admin/partners/empolye" },
    { name: "Portal Partner", path: "/admin/partners/portal" },
  ];

  const [selectedUser, setSelectedUser] = useState(null);

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
                      tab.name === "Portal Partner"
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
                  placeholder="Search name, address, job, etc"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
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
                      <th>Domain</th>
                      <th>Sub-agents</th>
                      <th>we to them</th>
                      <th>them to us</th>
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
                        <td>{row.namephone}</td>
                        <td>{row.domain}</td>
                        <td>{row.subaagents}</td>
                        <td>{row.wetothem}</td>
                        <td>{row.themtous}</td>
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
                                Active
                              </Dropdown.Item>
                              <Dropdown.Item className="text-primary">
                                see Ledger
                              </Dropdown.Item>
                              <Dropdown.Item className="text-danger">
                                See Booking
                              </Dropdown.Item>
                              <Dropdown.Item className="text-danger">
                                Login
                              </Dropdown.Item>
                              <Dropdown.Item className="text-danger">
                                stop
                              </Dropdown.Item>
                              <Dropdown.Item className="text-danger">
                                change details
                              </Dropdown.Item>
                              <Dropdown.Item className="text-danger">
                                reset Password
                              </Dropdown.Item>
                              <Dropdown.Item className="">Cancel</Dropdown.Item>
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
                    Add Portal Partner
                  </button>
                  <button className="btn btn-outline-secondary">Close</button>
                </div>
              </>
            )}
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
        <Modal.Body className="p-4">
          <h4 className="text-center fw-bold p-4 mb-4">Add/Edit Partner</h4>
          <Form className="">
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
                    Partner Name
                  </legend>
                  <input
                    type="text"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="Saudia Arabian"
                    name="partnerName"
                    value={partnerForm.partnerName}
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
                    Domain name
                  </legend>
                  <input
                    type="text"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="Saudia Arabian"
                    name="domainName"
                    value={partnerForm.domainName}
                    onChange={handlePartnerChange}
                  />
                </fieldset>
              </div>
            </div>

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
                    Phone
                  </legend>
                  <input
                    type="number"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="+923631569595"
                    name="phone"
                    value={partnerForm.phone}
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
                    commission Ticket/Pkr
                  </legend>
                  <input
                    type="text"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="Saudia Arabian"
                    name="commissionTicketPkr"
                    value={partnerForm.commissionTicketPkr}
                    onChange={handlePartnerChange}
                  />
                </fieldset>
              </div>
            </div>

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
                    Email
                  </legend>
                  <input
                    type="email"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="+923631569595"
                    name="email"
                    value={partnerForm.email}
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
                    commission Ticket for them
                  </legend>
                  <input
                    type="text"
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="Reman Rafique"
                    name="commissionTicketForThem"
                    value={partnerForm.commissionTicketForThem}
                    onChange={handlePartnerChange}
                  />
                </fieldset>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Can Sell our tickets</h6>
              <Form.Check
                type="switch"
                id="canSellTickets"
                label="Active"
                name="canSellTickets"
                checked={partnerForm.canSellTickets}
                onChange={handlePartnerChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Allow Sub Agents</h6>
              <Form.Check
                type="switch"
                id="allowSubAgents"
                label="Active"
                name="allowSubAgents"
                checked={partnerForm.allowSubAgents}
                onChange={handlePartnerChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Allow Their Ticket Sync to our Portal</h6>
              <Form.Check
                type="switch"
                id="allowTicketSync"
                label="Active"
                name="allowTicketSync"
                checked={partnerForm.allowTicketSync}
                onChange={handlePartnerChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Can sell Our Umrah Services to thier agents</h6>
              <Form.Check
                type="switch"
                id="canSellUmrah"
                label="Active"
                name="canSellUmrah"
                checked={partnerForm.canSellUmrah}
                onChange={handlePartnerChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Account is Active</h6>
              <Form.Check
                type="switch"
                id="accountActive"
                label="Active"
                name="accountActive"
                checked={partnerForm.accountActive}
                onChange={handlePartnerChange}
              />
            </div>
            <div className="d-flex justify-content-between">
              <Button variant="primary">Add</Button>
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
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="+923631569595"
                    name="phone"
                    value={subAgentForm.phone}
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
                    className="form-control rounded shadow-none border-0 px-1 py-2"
                    required
                    placeholder="Reman Rafique"
                    name="name"
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
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="Reman.Rafique@gmail.com"
                  name="email"
                  value={subAgentForm.email}
                  onChange={handleSubAgentChange}
                />
              </fieldset>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Only Bookings</h6>
              <Form.Check
                type="switch"
                id="onlyBookings"
                label="Active"
                name="onlyBookings"
                checked={subAgentForm.onlyBookings}
                onChange={handleSubAgentChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Can make and issue Bookings</h6>
              <Form.Check
                type="switch"
                id="canMakeBookings"
                label="Active"
                name="canMakeBookings"
                checked={subAgentForm.canMakeBookings}
                onChange={handleSubAgentChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>only Ticket</h6>
              <Form.Check
                type="switch"
                id="onlyTicket"
                label="Active"
                name="onlyTicket"
                checked={subAgentForm.onlyTicket}
                onChange={handleSubAgentChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>only umrah</h6>
              <Form.Check
                type="switch"
                id="onlyUmrah"
                label="Active"
                name="onlyUmrah"
                checked={subAgentForm.onlyUmrah}
                onChange={handleSubAgentChange}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Full Control</h6>
              <Form.Check
                type="switch"
                id="fullControl"
                label="Active"
                name="fullControl"
                checked={subAgentForm.fullControl}
                onChange={handleSubAgentChange}
              />
            </div>

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

export default PartnerPortal;