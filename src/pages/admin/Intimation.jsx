import React, { useState } from "react";
import { Dropdown, Table, Button, Form } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Funnel } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

const IntimationTable = () => {
  const [statusFilter, setStatusFilter] = useState("");

  const data = [
    {
      orderId: "369asd",
      agency: "92 World Tour",
      code: "363636",
      name: "Ali Meer",
      contact: "+923 61616 936",
      pax: 10,
      status: "In KSA",
    },
    {
      orderId: "369asd",
      agency: "92 World Tour",
      code: "363636",
      name: "Ali Meer",
      contact: "+923 61616 936",
      pax: 10,
      status: "In KSA",
    },
    {
      orderId: "369asd",
      agency: "92 World Tour",
      code: "363636",
      name: "Ali Meer",
      contact: "+923 61616 936",
      pax: 10,
      status: "In KSA",
    },
    {
      orderId: "369asd",
      agency: "92 World Tour",
      code: "363636",
      name: "Ali Meer",
      contact: "+923 61616 936",
      pax: 10,
      status: "In KSA",
    },
    {
      orderId: "369asd",
      agency: "92 World Tour",
      code: "363636",
      name: "Ali Meer",
      contact: "+923 61616 936",
      pax: 10,
      status: "In KSA",
    },
    {
      orderId: "369asd",
      agency: "92 World Tour",
      code: "363636",
      name: "Ali Meer",
      contact: "+923 61616 936",
      pax: 10,
      status: "In KSA",
    },
    // Add more mock rows if needed
  ];

  const statusOptions = [
    "All",
    "In KSA",
    "In Pakistan",
    "Exit KSA",
    "Cancelled",
  ];

  const filteredData =
    statusFilter === "" || statusFilter === "All"
      ? data
      : data.filter((item) => item.status === statusFilter);

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
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h5 className="fw-semibold mb-0">All Intimation</h5>
                <div className="d-flex align-items-center gap-4">
                  <div className="form-check d-flex align-items-center">
                    <input
                      className="form-check-input border border-black me-2"
                      type="checkbox"
                      id="userSide"
                    />
                    <label className="form-check-label" htmlFor="userSide">
                      User Side
                    </label>
                  </div>

                  <div className="form-check d-flex align-items-center">
                    <input
                      className="form-check-input border border-black me-2"
                      type="checkbox"
                      id="agentSide"
                    />
                    <label className="form-check-label" htmlFor="agentSide">
                      Agent Side
                    </label>
                  </div>
                </div>
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary">
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
                  <Button variant="primary">Export PDF</Button>
                </div>
              </div>

              <Table hover responsive className="align-middle text-center">
                <thead className="">
                  <tr>
                    <th>Order ID</th>
                    <th>Agency Name</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Total Pax</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.orderId}</td>
                      <td>{row.agency}</td>
                      <td>{row.code}</td>
                      <td>{row.name}</td>
                      <td>{row.contact}</td>
                      <td>{row.pax}</td>
                      <td>{row.status}</td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle
                            variant="link"
                            className="text-decoration-none p-0"
                          >
                            <Gear size={18} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item>Update Status</Dropdown.Item>
                            <Dropdown.Item>Add Notes</Dropdown.Item>
                            <Dropdown.Item>Remove</Dropdown.Item>
                            <Dropdown.Item className="text-danger">
                              Cancel
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntimationTable;
