import React, { useEffect, useState } from "react";
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
  Plane,
  CreditCard,
} from "lucide-react";
import { Cash } from "react-bootstrap-icons";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Sidebar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("organizationData");
    logout();
  };

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [organization, setOrganization] = useState([]);

  // Updated class function with active styling
  const getNavLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 ${isActive ? "active-link" : ""}`;

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");

        // ✅ Step 1: check localStorage first
        const storedOrg = localStorage.getItem("organizationData");
        if (storedOrg) {
          setOrganization(JSON.parse(storedOrg));
          return; // skip API call
        }

        // ✅ Step 2: get organization id from agentOrganization
        const agentOrg = localStorage.getItem("agentOrganization");
        if (!agentOrg) {
          console.warn("No organization data found. Please log in again.");
          return;
        }

        const orgData = JSON.parse(agentOrg);
        const orgId = orgData.ids?.[0];
        
        if (!orgId) {
          console.warn("No organization ID found. Please log in again.");
          return;
        }

        // ✅ Step 3: fetch from API
        const orgRes = await axios.get(
          `http://127.0.0.1:8000/api/organizations/${orgId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setOrganization(orgRes.data);

        // ✅ Step 4: store in localStorage
        localStorage.setItem("organizationData", JSON.stringify(orgRes.data));

      } catch (err) {
        console.error("Error fetching organization:", err);
        if (err.response?.status === 401) {
          console.error("Unauthorized. Please log in again.");
        }
      }
    };

    fetchOrganization();
  }, []);


  return (
    <>

      {/* Mobile toggle button */}
      <div className="w-100 d-lg-none mt-1">
        <div className="d-flex justify-content-between align-items-center px-2 py-2">
          {/* Mobile menu button (visible only on small screens) */}
          <button
            className="btn btn-dark d-lg-none"
            onClick={handleShow}
            style={{ zIndex: 1000 }}
          >
            <Menu size={20} />
          </button>

          {/* Search, notification & profile */}
          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Search bar (hidden on xs/sm, visible on md and up) */}
            <div className="d-md-flex">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control bg-light border"
                  placeholder="Search anything"
                  style={{ boxShadow: "none", width: "180px" }}
                />
              </div>
            </div>

            {/* Notification Bell (hidden on xs, visible on md+) */}
            <button className="btn btn-light position-relative p-2 rounded-circle d-md-flex">
              <Bell size={18} />
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: "10px" }}
              >
                .
              </span>
            </button>

            {/* Profile dropdown (always visible, but shrinks on mobile) */}
            <div className="dropdown">
              <button
                className="btn d-flex btn-sm align-items-center gap-2 dropdown-toggle p-0"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div
                  className="rounded-circle bg-info d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{ width: "32px", height: "32px", fontSize: "14px" }}
                >
                  MB
                </div>

                {/* Profile text - visible only on md+ */}
                <div className="d-none d-md-block text-start">
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
                  <Link to="/profile" className="dropdown-item rounded py-2">
                    <User size={16} className="me-2" /> Profile
                  </Link>
                  <a className="dropdown-item rounded py-2" href="#">
                    <Settings size={16} className="me-2" /> Settings
                  </a>
                  <hr className="dropdown-divider" />
                  <Link to="/login" className="dropdown-item rounded py-2">
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
            <img
              src={organization.logo}
              alt={organization.name}
              style={{ width: "150px", height: "40px", objectFit: "contain" }}
            />
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="d-flex flex-column h-100">
            <Nav className="flex-column flex-grow-1">
              {/* All NavLinks with active styling */}
              <div className="d-flex justify-content-center w-100">
                <div
                  className="rounded-3 text-center mt-3 w-100"
                >
                  <h5 className="fw-bold">Balance</h5>
                  <hr />
                  <h6>Rs.100,000/.</h6>
                </div>
              </div>
              <Nav.Item className="mb-3 mt-3">
                <NavLink
                  to="/packages"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <PackageIcon size={20} />{" "}
                  <span className="fs-6">Packages</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/packages/booking"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Check size={20} />{" "}
                  <span className="fs-6">Create Booking</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/booking"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Check size={20} />{" "}
                  <span className="fs-6">Ticket Booking</span>
                </NavLink>
              </Nav.Item>

              <Nav.Item className="mb-3">
                <NavLink
                  to="/hotels"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Hotel size={20} /> <span className="fs-6">Hotels</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/payment"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Cash size={20} /> <span className="fs-6">Payment</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/kuickpay"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <CreditCard size={20} /> <span className="fs-6">Kuickpay</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/booking-history"
                  className={getNavLinkClass}
                  style={{ color: "black" }}
                >
                  <History size={20} />{" "}
                  <span className="fs-6">Booking History</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/pax-movement"
                  className={getNavLinkClass}
                  style={{ color: "black" }}
                >
                  <User size={20} />{" "}
                  <span className="fs-6">Pax Movement</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/agent-pax-movement"
                  className={getNavLinkClass}
                  style={{ color: "black" }}
                >
                  <Plane size={20} />{" "}
                  <span className="fs-6">Flight Updates</span>
                </NavLink>
              </Nav.Item>
            </Nav>
            <Nav.Item className="mt-auto">
              <button
                className="nav-link d-flex align-items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut size={20} /> Logout
              </button>
            </Nav.Item>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Desktop Sidebar */}
      <div className="custom-sidebar-position shadow">
          <div className="d-none d-lg-flex flex-column vh-100 px-2">
          <div className="d-flex justify-content-center mt-3">
            <img
              src={organization.logo}
              alt={organization.name}
              style={{ width: "150px", height: "40px", objectFit: "contain" }}
            />
          </div>
          <div className="d-flex flex-column">
            <Nav className="flex-column flex-grow-1">
              {/* All NavLinks with active styling */}
              <div className="d-flex justify-content-center w-100">
                <div
                  className="rounded-3 text-center mt-3 w-100"
                >
                  <h5 className="fw-bold">Balance</h5>
                  <hr />
                  <h6>Rs.100,000/.</h6>
                </div>
              </div>
              <Nav.Item className="mb-3 mt-3">
                <NavLink
                  to="/packages"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <PackageIcon size={20} />{" "}
                  <span className="fs-6">Packages</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/packages/booking"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Check size={20} />{" "}
                  <span className="fs-6">Create Booking</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/booking"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Check size={20} />{" "}
                  <span className="fs-6">Ticket Booking</span>
                </NavLink>
              </Nav.Item>

              <Nav.Item className="mb-3">
                <NavLink
                  to="/hotels"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Hotel size={20} /> <span className="fs-6">Hotels</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/payment"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Cash size={20} /> <span className="fs-6">Payment</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/kuickpay"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <CreditCard size={20} /> <span className="fs-6">Kuickpay</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/booking-history"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <History size={20} />{" "}
                  <span className="fs-6">Booking History</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/pax-movement"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <User size={20} />{" "}
                  <span className="fs-6">Pax Movement</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/agent-pax-movement"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Plane size={20} />{" "}
                  <span className="fs-6">Flight Updates</span>
                </NavLink>
              </Nav.Item>
            </Nav>
            <Nav.Item className="ms-3 mt-3">
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
            position: sticky;
            top: 0;
            width: 250px;
            min-width: 250px;
            height: 100vh;
            overflow-y: auto;
            background-color: #fff;
            padding-top: 8px;
            z-index: 100;
          }
          /* Mobile responsiveness */
          @media (max-width: 991.98px) {
            .custom-sidebar-position {
              position: static;
              width: 100%;
              min-width: 100%;
              height: auto;
            }
          }

          .active-link {
            background-color: #09559B;
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
