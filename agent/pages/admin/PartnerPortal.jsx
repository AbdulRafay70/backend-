import React, { useState } from "react";
import { Dropdown, Table, Button, Form, Modal } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { ArrowBigLeft, Funnel, Search, UploadCloudIcon } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PartnersTabs from "../../components/PartnersTabs";
import Partners from "./Partners";
import document from "../../assets/document.jpg";

const PartnerPortal = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalSub, setShowModalSub] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);
  const handleShowSub = () => setShowModalSub(true);
  const handleCloseSub = () => setShowModalSub(false);

  const data = [
    { code: "369asd", namephone: "Reman Rafique", domain: "saer.pk", subaagents: "10", wetothem: "10", themtous: "10", Status: "Active" },
    { code: "123xyz", namephone: "Ali Khan", domain: "example.com", subaagents: "2", wetothem: "5", themtous: "3", Status: "Active" },
  ];

  const filteredData = data.filter((d) =>
    !searchTerm || d.code.includes(searchTerm) || d.namephone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row">
        <div className="col-lg-2 mb-3">
          <Sidebar />
        </div>
        <div className="col-lg-10" style={{ background: "#F2F3F4" }}>
          <Header />

          <div className="px-3 px-lg-4 my-3">
            <PartnersTabs />
          </div>

          <div className="row my-3 w-100">
            <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
              {/* Action Buttons / Search */}
              <div className="input-group" style={{ maxWidth: "300px" }}>
                <span className="input-group-text"><Search /></span>
                <input type="text" className="form-control" placeholder="Search name, address, job, etc" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded shadow-sm">
            {selectedUser ? (
              <div>
                <div className="d-flex align-items-center mb-4">
                  <span style={{ cursor: "pointer" }} onClick={() => setSelectedUser(null)} className="me-2"><ArrowBigLeft /></span>
                  <h5 className="fw-semibold mb-0">{selectedUser.code}</h5>
                </div>
                {/* details omitted for brevity */}
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <h5 className="fw-semibold mb-0">All Requested Partner’s</h5>
                  <Dropdown>
                    <Dropdown.Toggle variant=""> <Funnel size={16} className="me-1" /> Filters </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setStatusFilter("")}>All</Dropdown.Item>
                      <Dropdown.Item onClick={() => setStatusFilter("Active")}>Active</Dropdown.Item>
                      <Dropdown.Item onClick={() => setStatusFilter("Cancel")}>Cancel</Dropdown.Item>
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
                        <td style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setSelectedUser(row)}>{row.code}</td>
                        <td>{row.namephone}</td>
                        <td>{row.domain}</td>
                        <td>{row.subaagents}</td>
                        <td>{row.wetothem}</td>
                        <td>{row.themtous}</td>
                        <td className="fw-bold" style={{ color: "#0EE924" }}>{row.Status}</td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle variant="link" className="text-decoration-none p-0"><Gear size={18} /></Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item className="text-primary">Active</Dropdown.Item>
                              <Dropdown.Item className="text-primary">see Ledger</Dropdown.Item>
                              <Dropdown.Item className="text-danger">See Booking</Dropdown.Item>
                              <Dropdown.Item className="text-danger">Login</Dropdown.Item>
                              <Dropdown.Item className="text-danger">stop</Dropdown.Item>
                              <Dropdown.Item className="text-danger">change details</Dropdown.Item>
                              <Dropdown.Item className="text-danger">reset Password</Dropdown.Item>
                              <Dropdown.Item className="">Cancel</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="d-flex flex-wrap gap-2 justify-content-end">
                  <button className="btn btn-primary" onClick={handleShow}>Add Portal Partner</button>
                  <button className="btn btn-outline-secondary">Close</button>
                </div>
              </>
            )}
          </div>

          {/* Embed partners list here
          <div className="mt-4 p-0">
            <Partners embed={true} />
          </div> */}

          {/* Add/Edit Partner Modal */}
          <Modal show={showModal} onHide={handleClose} centered style={{ fontFamily: "Poppins, sans-serif" }}>
            <Modal.Body className="p-4">
              <h4 className="text-center fw-bold p-4 mb-4">Add/Edit Partner</h4>
              <Form>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <fieldset className="border border-black p-2 rounded mb-3" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>
                      <legend className="float-none w-auto px-1 fs-6" style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}>Partner Name</legend>
                      <input type="text" className="form-control rounded shadow-none border-0 px-1 py-2" placeholder="Saudia Arabian" />
                    </fieldset>
                  </div>
                </div>
                <div className="d-flex justify-content-between">
                  <Button variant="primary">Add</Button>
                  <Button variant="light" className="text-muted" onClick={handleClose}>Cancel</Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {/* Sub-Agent Modal */}
          <Modal show={showModalSub} onHide={handleCloseSub} centered style={{ fontFamily: "Poppins, sans-serif" }}>
            <Modal.Body>
              <h4 className="text-center fw-bold p-4 mb-4">Add Sub-Agent</h4>
              <Form className="p-4">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <fieldset className="border border-black p-2 rounded mb-3">
                      <legend className="float-none w-auto px-1 fs-6">Phone No</legend>
                      <input type="number" className="form-control rounded shadow-none border-0 px-1 py-2" placeholder="+923631569595" />
                    </fieldset>
                  </div>
                </div>
                <div className="d-flex justify-content-between">
                  <Button variant="primary">Save</Button>
                  <Button variant="light" className="text-muted" onClick={handleCloseSub}>Cancel</Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

        </div>
      </div>
    </div>
  );
};

export default PartnerPortal;