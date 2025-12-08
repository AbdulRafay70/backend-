import React, { useState } from "react";
import { Offcanvas, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import {
  Check,
  FileAxis3DIcon,
  HelpCircle,
  Hotel,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageIcon,
} from "lucide-react";
import { Bag, Cash } from "react-bootstrap-icons";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { logout } = useAuth();

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Updated class function with active styling
  const getNavLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 ${isActive ? "active-link" : ""}`;

  return (
    <>
      <div className="custom-sidebar-position" style={{ width: "191px" }}>
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
            <Offcanvas.Title className="">
              <img src={logo} alt="" />
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="d-flex flex-column h-100">
              <Nav className="flex-column flex-grow-1">
                {/* All NavLinks with active styling */}
                <Nav.Item className="mb-3 mt-5">
                  <NavLink to="/admin/dashboard" className={getNavLinkClass}>
                    <LayoutDashboard size={20} />{" "}
                    <span className="fs-6">Dashboard</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/admin/packages" className={getNavLinkClass}>
                    <PackageIcon size={20} />{" "}
                    <span className="fs-6">Packages</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink
                    to="/admin/ticket-Booking"
                    className={getNavLinkClass}
                  >
                    <Check size={20} />{" "}
                    <span className="fs-6">Ticket Booking</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/admin/partners" className={getNavLinkClass}>
                    <Bag size={20} /> <span className="fs-6">Partner's</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/admin/hotels" className={getNavLinkClass}>
                    <Hotel size={20} /> <span className="fs-6">Hotels</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/admin/payment" className={getNavLinkClass}>
                    <Cash size={20} /> <span className="fs-6">Payment</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink
                    to="/admin/order-delivery"
                    className={getNavLinkClass}
                  >
                    <FileAxis3DIcon size={20} />{" "}
                    <span className="fs-6">Order Delivery</span>
                  </NavLink>
                </Nav.Item>
                <Nav.Item className="mb-3">
                  <NavLink to="/admin/intimation" className={getNavLinkClass}>
                    <HelpCircle size={20} />{" "}
                    <span className="fs-6">Intimation</span>
                  </NavLink>
                </Nav.Item>
              </Nav>
              <Nav.Item className="mt-auto">
                <button
                  onClick={logout}
                  className="nav-link text-danger d-flex align-items-center gap-2 border-0 bg-transparent"
                >
                  <LogOut size={20} /> <span className="fs-6">Logout</span>
                </button>
              </Nav.Item>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Desktop Sidebar */}
        <div className="d-none d-lg-flex flex-column bg-white vh-100 px-1">
          <div className="mt-2">
            <img src={logo} alt="" className="img-fluid" />
          </div>
          <div className="d-flex flex-column">
            <Nav className="flex-column flex-grow-1">
              {/* All NavLinks with active styling */}
              <Nav.Item className="mb-3 mt-5">
                <NavLink
                  to="/admin/dashboard"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <LayoutDashboard size={20} />{" "}
                  <span className="fs-6">Dashboard</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/admin/packages"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <PackageIcon size={20} />{" "}
                  <span className="fs-6">Packages</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/admin/ticket-booking"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Check size={20} />{" "}
                  <span className="fs-6">Ticket Booking</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/admin/partners"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Bag size={20} /> <span className="fs-6">Partner's</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/admin/hotels"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Hotel size={20} /> <span className="fs-6">Hotels</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/admin/payment"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <Cash size={20} /> <span className="fs-6">Payment</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/admin/order-delivery"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <FileAxis3DIcon size={20} />{" "}
                  <span className="fs-6">Order Delivery</span>
                </NavLink>
              </Nav.Item>
              <Nav.Item className="mb-3">
                <NavLink
                  to="/admin/intimation"
                  style={{ color: "black" }}
                  className={getNavLinkClass}
                >
                  <HelpCircle size={20} />{" "}
                  <span className="fs-6">Intimation</span>
                </NavLink>
              </Nav.Item>
            </Nav>
            <Nav.Item className="ms-3 mt-5">
              <button
                onClick={logout}
                className="nav-link d-flex align-items-center gap-2 border-0 bg-transparent"
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
            position: fixed;
          }

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
