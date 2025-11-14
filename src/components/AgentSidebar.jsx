import React, { useState } from "react";
import { Offcanvas, Nav } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import {
  Bell,
  Check,
  History,
  Hotel,
  LogOut,
  Menu,
  PackageIcon,
  Search,
  Settings,
  User,
} from "lucide-react";
import { Cash } from "react-bootstrap-icons";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Updated class function with active styling
  const getNavLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 ${isActive ? "active-link" : ""}`;

  return (
    <>

      {/* Mobile toggle button */}
      <div className="d-flex justify-content-between align-items-center w-100 d-lg-none">
        {/* Mobile menu button - visible only on small screens */}
        <button
          className="d-lg-none btn btn-dark my-2 ms-2"
          onClick={handleShow}
          style={{ zIndex: 1000 }}
        >
          <Menu size={20} />
        </button>

        {/* Search and profile section - responsive layout */}
        <div className="d-flex flex-column mt-3 flex-md-row align-items-center gap-3 ms-auto">
          {/* Search bar - hidden on mobile, visible on lg screens */}
          <div className="d-block " style={{ maxWidth: "350px" }}>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 bg-light"
                placeholder="Search anything"
                style={{ boxShadow: "none" }}
              />
            </div>
          </div>

          {/* Notification and profile - always visible but adjusts layout */}
          <div className="d-flex align-items-center gap-2 me-2">
            {/* Notification bell - hidden on mobile, visible on md screens */}
            <button className="btn btn-light position-relative p-2 rounded-circle d-flex">
              <Bell size={18} />
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: "10px" }}
              >
                .
              </span>
            </button>

            {/* Profile dropdown */}
            <div className="dropdown">
              <button
                className="btn d-flex align-items-center gap-2 dropdown-toggle p-0"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div
                  className="rounded-circle bg-info d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{ width: "32px", height: "32px", fontSize: "14px" }}
                >
                  MB
                </div>
                {/* Profile text - hidden on mobile, visible on md screens */}
                <div className="d-block text-start">
                  <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                    Mubeen Bhullar
                  </div>
                  <div className="text-muted" style={{ fontSize: "12px" }}>
                    Agent
                  </div>
                </div>
              </button>

              {showDropdown && (
                <div
                  className="dropdown-menu dropdown-menu-end show mt-2 p-2"
                  style={{ minWidth: "200px" }}
                >
                  <Link to="/agent/profile" className="dropdown-item rounded py-2">
                    <User size={16} className="me-2" /> Profile
                  </Link>
                  <a className="dropdown-item rounded py-2" href="#">
                    <Settings size={16} className="me-2" /> Settings
                  </a>
                  <hr className="dropdown-divider" />
                  <Link to="/agent/login" className="dropdown-item rounded py-2">
                    <LogOut size={16} className="me-2" /> Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Offcanvas */}
      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="end"
        className="w-75"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="">
            <img src={logo} alt="" />
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="d-flex flex-column h-100">
            <Nav className="flex-column flex-grow-1">
              {/* All NavLinks with active styling */}
              <div
                className="rounded-3 p-1 text-white text-center mt-5"
                style={{ background: "#1B78CEBA" }}
              >
                <h5 className="fw-bold">Balance:</h5>
                <h6>Rs.100,000/.</h6>
              </div>
              <Nav.Item className="mb-3 mt-3">
                <NavLink
                  to="/agent/packages"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <PackageIcon size={20} />{" "}
                  <span className="fs-6">Packages</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/agent/booking"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Check size={20} />{" "}
                  <span className="fs-6">Ticket Booking</span>
                </NavLink>
              </Nav.Item>

              <Nav.Item className="mb-3">
                <NavLink
                  to="/agent/hotels"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Hotel size={20} /> <span className="fs-6">Hotels</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/agent/payment"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Cash size={20} /> <span className="fs-6">Payment</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/agent/booking-history"
                  className={getNavLinkClass}
                  style={{ color: "black" }}
                >
                  <History size={20} />{" "}
                  <span className="fs-6">Booking History</span>
                </NavLink>
              </Nav.Item>
            </Nav>
            <Nav.Item className="mt-auto">
              <NavLink
                to="/agent/login"
                style={{ color: "black" }}
                className="nav-link text-danger d-flex align-items-center gap-2"
              >
                <LogOut size={20} /> <span className="fs-6">Logout</span>
              </NavLink>
            </Nav.Item>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Desktop Sidebar */}
      <div className="custom-sidebar-position" >
        <div className="d-none d-lg-flex flex-column bg-white vh-100 px-2">
          <img src={logo} alt="" className="mt-3" />
          <div className="d-flex flex-column">
            <Nav className="flex-column flex-grow-1">
              {/* All NavLinks with active styling */}
              <div
                className="rounded-3 p-1 text-white text-center mt-5"
                style={{ background: "#1B78CEBA" }}
              >
                <h5 className="fw-bold">Balance:</h5>
                <h6>Rs.100,000/.</h6>
              </div>
              <Nav.Item className="mb-3 mt-3">
                <NavLink
                  to="/agent/packages"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <PackageIcon size={20} />{" "}
                  <span className="fs-6">Packages</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/agent/booking"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Check size={20} />{" "}
                  <span className="fs-6">Ticket Booking</span>
                </NavLink>
              </Nav.Item>

              <Nav.Item className="mb-3">
                <NavLink
                  to="/agent/hotels"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Hotel size={20} /> <span className="fs-6">Hotels</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/agent/payment"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Cash size={20} /> <span className="fs-6">Payment</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/agent/booking-history"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <History size={20} />{" "}
                  <span className="fs-6">Booking History</span>
                </NavLink>
              </Nav.Item>
            </Nav>
            <Nav.Item className="ms-3 mt-5">
              <button
                className="nav-link d-flex align-items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut size={20} /> Logout
              </button>
            </Nav.Item>
          </div>
        </div>
      </div>
      <style>
        {`
          .custom-sidebar-position {
            position: fixed;
          }
          /* Unfix on md screens only */
          @media (min-width: 0px) and (max-width: 991.98px) {
            .custom-sidebar-position {
              position: static;
            }
          }

          .active-link {
            background-color: #1B78CE;
            color: white !important;
            border-radius: 8px;
          }
          .active-link svg {
            stroke: white;
          }
        `}
      </style>
    </>
  );
};

export default Sidebar;
