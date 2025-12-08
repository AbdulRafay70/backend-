import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { NavLink, useLocation } from "react-router-dom";
import { Table, Dropdown } from "react-bootstrap";
import { Filter } from "react-bootstrap-icons";

const tabs = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Logs", path: "/dashboard/logs" },
];

const activityData = [
  {
    timestamp: "2025-05-09 14:30",
    actionType: "Clicked Confirm Booking",
    actorType: "Agent",
    actorNameId: "Ahsan razol/ 1267136173",
    description: "Description",
  },
  {
    timestamp: "2025-05-09 14:30",
    actionType: "Clicked Confirm Booking",
    actorType: "Agent",
    actorNameId: "Ahsan razol/ 1267136173",
    description: "Description",
  },
  {
    timestamp: "2025-05-09 14:30",
    actionType: "Clicked Confirm Booking",
    actorType: "Agent",
    actorNameId: "Ahsan razol/ 1267136173",
    description: "Description",
  },
];

const Logs = () => {
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
              <div className="px-3 mt-3 px-lg-4">
                {/* Navigation Tabs */}
                <div className="row ">
              {/* Navigation Tabs - full width on mobile */}
              <nav className="nav d-flex flex-wrap flex-md-nowrap gap-2 gap-md-0 w-100 w-md-auto">
                {tabs.map((tab, index) => (
                  <NavLink
                    key={index}
                    to={tab.path}
                    className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Logs"
                        ? "text-primary fw-semibold"
                        : "text-muted"
                      }`}
                    style={{ backgroundColor: "transparent" }}
                  >
                    {tab.name}
                  </NavLink>
                ))}
              </nav>
              <div className="p-4">
                <div className="d-flex mb-3 flex-column flex-lg-row align-items-start align-items-lg-center justify-content-lg-between">
                  <h2 className="mb-3 mb-lg-0">Activity Logs</h2>
                  <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-2">
                    <button
                      type="button"
                      className="btn d-flex align-items-center"
                    >
                      <Filter aria-hidden="true" className="me-2" />
                      Filters
                    </button>
                    <button type="button" className="btn" id="btn">
                      Export
                    </button>
                  </div>
                </div>

                {/* ID Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    className="form-control shadow-none"
                    style={{ height: "60px" }}
                    placeholder="Enter ID (Booking, Customer, Agent, Employee, Portal Partner)"
                  />
                </div>

                {/* Filter Row */}
                <div className="d-flex flex-wrap align-items-center mb-4 gap-3">
                  {/* Action Type Filter */}
                  <div
                    className="d-flex align-items-center rounded-3 px-3 py-1"
                    style={{
                      color: "#1C1B1F73",
                      background: "#E4EDF4EB",
                      border: "1px solid #D0D0D0",
                    }}
                  >
                    <span className="me-2">Action Type</span>
                    <Dropdown>
                      <Dropdown.Toggle
                        id="action-type-dropdown"
                        variant="link"
                        className="p-0 border-0 bg-transparent shadow-none text-dark"
                      >
                        <i className="bi bi-chevron-down"></i>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item>Option 1</Dropdown.Item>
                        <Dropdown.Item>Option 2</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  {/* Actor Type Filter */}
                  <div
                    className="d-flex align-items-center rounded-3 px-3 py-1"
                    style={{
                      color: "#1C1B1F73",
                      background: "#E4EDF4EB",
                      border: "1px solid #D0D0D0",
                    }}
                  >
                    <span className="me-2">Actor Type</span>
                    <Dropdown>
                      <Dropdown.Toggle
                        id="actor-type-dropdown"
                        variant="link"
                        className="p-0 border-0 bg-transparent shadow-none text-dark"
                      >
                        <i className="bi bi-chevron-down"></i>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item>Agent</Dropdown.Item>
                        <Dropdown.Item>Customer</Dropdown.Item>
                        <Dropdown.Item>Employee</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  {/* Date Range Filter */}
                  <div
                    className="d-flex align-items-center rounded-3 px-3 py-1"
                    style={{
                      color: "#1C1B1F73",
                      background: "#E4EDF4EB",
                      border: "1px solid #D0D0D0",
                    }}
                  >
                    <span className="me-2">Date Range</span>
                    <Dropdown>
                      <Dropdown.Toggle
                        id="date-range-dropdown"
                        variant="link"
                        className="p-0 border-0 bg-transparent shadow-none text-dark"
                      >
                        <i className="bi bi-chevron-down"></i>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item>Today</Dropdown.Item>
                        <Dropdown.Item>Last 7 Days</Dropdown.Item>
                        <Dropdown.Item>This Month</Dropdown.Item>
                        <Dropdown.Item>Custom Range</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                {/* Activity Table */}
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action Type</th>
                      <th>Actor Type</th>
                      <th>Actor Name/ID</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityData.map((activity, index) => (
                      <tr key={index}>
                        <td>{activity.timestamp}</td>
                        <td>{activity.actionType}</td>
                        <td>{activity.actorType}</td>
                        <td>{activity.actorNameId}</td>
                        <td>{activity.description}</td>
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
    </div>
  );
};

export default Logs;
