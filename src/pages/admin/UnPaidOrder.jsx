import React, { useState } from "react";
import { Dropdown, Table } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Funnel, Search, } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";

const UnPaidOrder = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");


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


  const data = [
    {
      Order_ID: "369asd",
      Agency_Name: "92 World Tour",
      Address: "92 World Travel And Tours",
      Order_Status:
        "N / A",
      CONTACT: "0",
      Action: "",
    },
    {
      Order_ID: "369asd",
      Agency_Name: "92 World Tour",
      Address: "92 World Travel And Tours",
      Order_Status:
        "Completed",
      CONTACT: "0",
      Action: "",
    },
    {
      Order_ID: "369asd",
      Agency_Name: "92 World Tour",
      Address: "92 World Travel And Tours",
      Order_Status:
        "Pending( SEE ORDER)",
      CONTACT: "0",
      Action: "",
    },
    {
      Order_ID: "369asd",
      Agency_Name: "92 World Tour",
      Address: "92 World Travel And Tours",
      Order_Status:
        "Pending",
      CONTACT: "0",
      Action: "",
    },
    
  ];

  const statusOptions = ["Pending calls", "Completed calls", "(0)’s Order", "Cancel"];

  const filteredData =
    statusFilter === "" || statusFilter === "All"
      ? data
      : data.filter((item) => item.status === statusFilter);

  const tabs = [
    { name: "paid orders", path: "/order-delivery" },
    { name: "un-paid Orders", path: "/order-delivery/un-paid-orders" },
  ];

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
              <div className="row ">
            <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
              {/* Navigation Tabs */}
              <nav className="nav flex-wrap gap-2">
                {tabs.map((tab, index) => (
                  <NavLink
                    key={index}
                    to={tab.path}
                    className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${
                      tab.name === "un-paid Orders"
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
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h5 className="fw-semibold mb-0">All Partner’s</h5>
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
                  <th>Agency Name</th>
                  <th>Address</th>
                  <th>Order Status</th>
                  <th>CONTACT</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={index}>
                    <td>
                      {row.Order_ID}
                    </td>
                    <td>{row.Agency_Name}</td>
                    <td>{row.Address}</td>
                    <td>{row.Order_Status}</td>
                    <td>
                      {row.CONTACT}
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
                            Add Notes
                          </Dropdown.Item>
                          <Dropdown.Item className="text-danger">
                            Call done
                          </Dropdown.Item>
                          <Dropdown.Item>Cancel</Dropdown.Item>
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
    </div>
  );
};

export default UnPaidOrder;
