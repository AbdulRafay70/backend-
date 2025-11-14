import React, { useEffect, useState } from "react";
import { Offcanvas, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import axios from "axios";
import {
  Check,
  FileAxis3DIcon,
  FileText,
  HelpCircle,
  Hotel,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageIcon,
  User,
  UserPlus,
  Users,
  Plane,
  Building2,
  Clipboard,
  BookOpen,
  Layers,
  Settings,
  Clock,
  DollarSign,
} from "lucide-react";
import { Bag, Cash } from "react-bootstrap-icons";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { logout } = useAuth();
  const [show, setShow] = useState(false);
  const [organization, setOrganization] = useState({}); // ✅ should be object

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Active link style
  const getNavLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 ${isActive ? "active-link" : ""}`;

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const token = localStorage.getItem("token");

        // ✅ Step 1: Check localStorage first
        const storedOrg = localStorage.getItem("adminOrganizationData");
        if (storedOrg) {
          setOrganization(JSON.parse(storedOrg));
          return; // skip API call
        }

        // ✅ Step 2: Get selectedOrganization ID
        const selectedOrg = localStorage.getItem("selectedOrganization");
        if (!selectedOrg) return;

        const orgData = JSON.parse(selectedOrg);
        const orgId = orgData.ids ? orgData.ids[0] : orgData.id;

        // ✅ Step 3: Fetch from API
        const orgRes = await axios.get(
          `http://127.0.0.1:8000/api/organizations/${orgId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setOrganization(orgRes.data);

        // ✅ Step 4: Store in localStorage
        localStorage.setItem("adminOrganizationData", JSON.stringify(orgRes.data));
      } catch (err) {
        console.error("Error fetching organization:", err);
      }
    };

    fetchOrganization();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminOrganizationData"); // ✅ clear cache on logout
    logout();
  };

  return (
    <>
      <div className="custom-sidebar-position">
        {/* Mobile toggle button */}
        <button
          className="d-lg-none btn btn-dark top-0 end-0 my-2 mx-4"
          onClick={handleShow}
        >
          <Menu size={20} />
        </button>

        {/* Mobile Offcanvas */}
        <Offcanvas
          show={show}
          onHide={handleClose}
          placement="end"
          className="w-75"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              {organization?.logo ? (
                <img
                  src={organization.logo}
                  alt={organization.name}
                  style={{
                    width: "150px",
                    height: "40px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <span>Loading...</span>
              )}
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="d-flex flex-column h-100">
              <Nav className="flex-column flex-grow-1">
                {/* Nav Links */}
                <Nav.Item className="mb-3">
                  <NavLink to="/dashboard" className={getNavLinkClass}>
                    <LayoutDashboard size={20} />{" "}
                    <span className="fs-6">Dashboard</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/packages" className={getNavLinkClass}>
                    <PackageIcon size={20} />{" "}
                    <span className="fs-6">Packages</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/hotels" className={getNavLinkClass}>
                    <Hotel size={20} /> <span className="fs-6">Hotels</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/hotel-availability" className={getNavLinkClass}>
                    <Hotel size={20} /> <span className="fs-6">Hotel Availability</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/lead-management" className={getNavLinkClass}>
                    <Users size={20} /> <span className="fs-6">Lead Management</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/commission-management" className={getNavLinkClass}>
                    <CreditCard size={20} /> <span className="fs-6">Commission Management</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/blog-management" className={getNavLinkClass}>
                    <BookOpen size={20} /> <span className="fs-6">Blog Management</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/universal-register" className={getNavLinkClass}>
                    <UserPlus size={20} /> <span className="fs-6">Register Entity</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/universal-list" className={getNavLinkClass}>
                    <Users size={20} /> <span className="fs-6">Universal Registry</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/rules" className={getNavLinkClass}>
                    <Layers size={20} /> <span className="fs-6">Rules Management</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/form-list" className={getNavLinkClass}>
                    <FileText size={20} /> <span className="fs-6">Forms Management</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/payment" className={getNavLinkClass}>
                    <Cash size={20} /> <span className="fs-6">Payment</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/kuickpay" className={getNavLinkClass}>
                    <CreditCard size={20} /> <span className="fs-6">Kuickpay</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/ticket-booking" className={getNavLinkClass}>
                    <Check size={20} />{" "}
                    <span className="fs-6">Ticket Booking</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/order-delivery" className={getNavLinkClass}>
                    <FileAxis3DIcon size={20} />{" "}
                    <span className="fs-6">Order Delivery</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/daily-operations" className={getNavLinkClass}>
                    <Hotel size={20} /> <span className="fs-6">Daily Operations</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/pax-movement" className={getNavLinkClass}>
                    <User size={20} /> <span className="fs-6">Pax Movement</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/intimation" className={getNavLinkClass}>
                    <HelpCircle size={20} />{" "}
                    <span className="fs-6">Intimation</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/partners" className={getNavLinkClass}>
                    <Bag size={20} /> <span className="fs-6">Partners</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/pax-movement" className={getNavLinkClass}>
                    <User size={20} /> <span className="fs-6">Pax Movement</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/agency-profile" className={getNavLinkClass}>
                    <Building2 size={20} /> <span className="fs-6">Agency Relations</span>
                  </NavLink>
                </Nav.Item>
              </Nav>
              <Nav.Item className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="nav-link text-danger d-flex align-items-center gap-2 border-0 bg-transparent"
                >
                  <LogOut size={20} /> <span className="fs-6">Logout</span>
                </button>
              </Nav.Item>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Desktop Sidebar */}
        <div className="d-none d-lg-flex flex-column vh-100 px-2 shadow" style={{ overflowY: "auto" }}>
          <div className="mt-5 d-flex justify-content-center">
            {organization?.logo && (
              <img
                src={organization.logo}
                alt={organization.name}
                style={{
                  width: "150px",
                  height: "40px",
                  objectFit: "contain",
                }}
              />
            )}
          </div>
          <div className="d-flex flex-column" style={{ flex: 1, overflowY: "auto", paddingBottom: "20px" }}>
            <Nav className="flex-column flex-grow-1">
              {/* Same Nav Items as above */}
              <Nav.Item className="mb-3 mt-5">
                <NavLink
                  to="/dashboard"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <LayoutDashboard size={20} />{" "}
                  <span className="fs-6">Dashboard</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
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
                  to="/ticket-booking"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Check size={20} />{" "}
                  <span className="fs-6">Ticket Booking</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/partners"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Bag size={20} /> <span className="fs-6">Partner's</span>
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
                  to="/hotel-availability"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Hotel size={20} /> <span className="fs-6">Hotel Availability</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/lead-management"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Users size={20} /> <span className="fs-6">Lead Management</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/commission-management"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <CreditCard size={20} /> <span className="fs-6">Commission Management</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/blog-management"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <BookOpen size={20} /> <span className="fs-6">Blog Management</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/universal-register"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <UserPlus size={20} /> <span className="fs-6">Register Entity</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/universal-list"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Users size={20} /> <span className="fs-6">Universal Registry</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/rules"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Layers size={20} /> <span className="fs-6">Rules Management</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/form-list"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <FileText size={20} /> <span className="fs-6">Forms Management</span>
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
                  to="/ticket-booking"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Check size={20} />{" "}
                  <span className="fs-6">Ticket Booking</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/order-delivery"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <FileAxis3DIcon size={20} />{" "}
                  <span className="fs-6">Order Delivery</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/daily-operations"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Hotel size={20} /> <span className="fs-6">Daily Operations</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/pax-movement"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <User size={20} /> <span className="fs-6">Pax Movement</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/intimation"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <HelpCircle size={20} />{" "}
                  <span className="fs-6">Intimation</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/pax-movement"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <User size={20} /> <span className="fs-6">Pax Movement</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/agency-profile"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Building2 size={20} /> <span className="fs-6">Agency Relations</span>
                </NavLink>
              </Nav.Item>
            </Nav>
            <Nav.Item className="mt-auto mb-3">
              <button
                onClick={handleLogout}
                className="nav-link text-danger d-flex align-items-center gap-2 border-0 bg-transparent w-100"
              >
                <LogOut size={20} /> <span className="fs-6">Logout</span>
              </button>
            </Nav.Item>
          </div>
        </div>
      </div>
      <style>
        {`
          .custom-sidebar-position {
            width: 250px;
            min-width: 250px;
            height: 100vh;
            overflow-y: auto;
            position: sticky;
            top: 0;
          }

          @media (max-width: 991.98px) {
            .custom-sidebar-position {
              position: static;
              width: 100%;
              min-width: 100%;
              height: auto;
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
