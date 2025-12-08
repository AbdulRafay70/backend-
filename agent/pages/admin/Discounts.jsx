import React, { useState } from "react";
import { Dropdown, Table, Button, Form, Modal } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { ArrowBigLeft, Funnel, Search, UploadCloudIcon } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PartnersTabs from "../../components/PartnersTabs";
import { Link, NavLink } from "react-router-dom";
import AdminFooter from "../../components/AdminFooter";

const Discounts = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalSub, setShowModalSub] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // State for Partner Form
  const [partnerForm, setPartnerForm] = useState({
    phoneNo: "",
    name: "",
    email: "",
    password: "",
    address: "",
    cityName: "",
    branch: "",
    role: "",
    permission: "",
    discounts: "",
    agreementActive: true,
    userActive: true,
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
      password: "",
      address: "",
      cityName: "",
      branch: "",
      role: "",
      permission: "",
      discounts: "",
      agreementActive: true,
      userActive: true,
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

  const data = [
    {
      Name: "Reman Rafique+923631569595Ahsan@saer.pk",
      type: "SAER KARO TRAVELS AND TOURS Hillite town, Street 78, Gujranwala",
      Action: "",
    },
    {
      Name: "Reman Rafique+923631569595Ahsan@saer.pk",
      type: "SAER KARO TRAVELS AND TOURS Hillite town, Street 78, Gujranwala",
      Action: "",
    },
    {
      Name: "Reman Rafique+923631569595Ahsan@saer.pk",
      type: "SAER KARO TRAVELS AND TOURS Hillite town, Street 78, Gujranwala",
      Action: "",
    },
  ];

  const statusOptions = ["Active", "Inactive", "Without Agreement", "Cancel"];

  const filteredData =
    statusFilter === "" || statusFilter === "All"
      ? data
      : data.filter((item) => item.status === statusFilter);

  // Navigation is rendered by shared PartnersTabs
  

  const [filter, setFilter] = useState("empolyes");

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
          <div className="p-3 bg-white rounded shadow-sm">
            {/* Buttons */}
            <div className="d-flex flex-wrap gap-2 justify-content-between">
              <div>
                <h5 className="fw-semibold mb-0">Discounts</h5>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-primary" onClick={handleShow}>
                  Add Group
                </button>
                <Link to="/partners/discounts/update-discountss" className="btn btn-primary">
                  Asign Permissions
                </Link>
                <button className="btn btn-primary">Print</button>
                <button className="btn btn-primary">Download</button>
              </div>
            </div>
            <Table hover responsive className="align-middle text-center mt-3">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.Name}</td>
                    <td>{row.type}</td>
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
                          <Dropdown.Item className="text-success">
                            Edit
                          </Dropdown.Item>
                          <Dropdown.Item className="text-danger">
                            Remove
                          </Dropdown.Item>
                          <Dropdown.Item>Cancel</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 mb-3">
              <div className="d-flex flex-wrap align-items-center">
                <span className="me-2">Showing</span>
                <select
                  className="form-select form-select-sm me-2"
                  style={{ width: "auto" }}
                >
                  <option>8</option>
                </select>
                <span className="me-2">out of 286</span>
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className="page-item">
                    <a className="page-link" href="#">
                      Previous
                    </a>
                  </li>
                  <li className="page-item active">
                    <a className="page-link" href="#">
                      1
                    </a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">
                      2
                    </a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">
                      3
                    </a>
                  </li>
                  <li className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">
                      18
                    </a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">
                      Next
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
            <AdminFooter />
        </div>
        </div>
        </div>
      </div>

      {/* Modal Add user */}
      <Modal
        show={showModal}
        onHide={handleClose}
        centered
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        <Modal.Body className="">
          <h4 className="text-center fw-bold p-4 mb-4">Add Discout group</h4>
          <hr />
          <Form className="p-4">
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
                  name="phoneNo"
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="Agent Permi"
                  value={partnerForm.phoneNo}
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
                  Group Type
                </legend>
                <input
                  type="text"
                  name="name"
                  className="form-control rounded shadow-none border-0 px-1 py-2"
                  required
                  placeholder="Write Type"
                  value={partnerForm.name}
                  onChange={handlePartnerChange}
                />
              </fieldset>
            </div>

            <div className="d-flex justify-content-between">
              <Button variant="primary" onClick={handlePartnerSubmit}>
                Save and close
              </Button>
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
    </div>
  );
};

export default Discounts;
