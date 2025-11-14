import { Bell, LogOut, Search, Settings, User } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const routeTitles = [
  // (same as before, no changes here)
  { path: "/profile", title: "Profile" },
  { path: "/dashboard", title: "Dashboard" },
  { path: "/packages", title: "Packages" },
  { path: "/packages/add-packages", title: "Packages" },
  { path: "/packages/visa-and-other", title: "Visa and Other" },
  { path: "/packages/edit/:id", title: "Packages" },
  { path: "/hotels", title: "Hotels" },
  { path: "/hotels/EditDetails/:id", title: "Hotels" },
  { path: "/hotels/EditPrices/:id", title: "Hotels" },
  { path: "/hotels/EditAv/:id", title: "Hotels" },
  { path: "/hotels/add-hotels", title: "Hotels" },
  { path: "/intimation", title: "Intimation" },
  { path: "/daily-operations", title: "Daily Operations" },
  { path: "/partners", title: "Partner's" },
  { path: "/partners/message/:id", title: "Partner's" },
  { path: "/partners/organization", title: "Partner's" },
  { path: "/partners/request", title: "Partner's" },
  { path: "/partners/role-permissions", title: "Partner's" },
  {
    path: "/partners/role-permissions/update-permissions",
    title: "Partner's",
  },
  { path: "/partners/discounts", title: "Partner's" },
  { path: "/partners/discounts/update-discountss", title: "Partner's" },
  { path: "/partners/branche", title: "Partner's" },
  { path: "/partners/agencies", title: "Partner's" },
  { path: "/partners/empolye", title: "Partner's" },
  { path: "/partners/portal", title: "Partner's" },
  { path: "/ticket-booking", title: "Booking" },
  { path: "/ticket-booking/detail", title: "Booking" },
  { path: "/ticket-booking/add-ticket", title: "Booking" },
  { path: "/payment", title: "Payment" },
  { path: "/payment/add-payment", title: "Payment" },
  { path: "/payment/booking-history", title: "Payment" },
  { path: "/payment/pending-payments", title: "Payment" },
  { path: "/payment/bank-accounts", title: "Payment" },
  { path: "/order-delivery", title: "Order Delivery System" },
  { path: "/order-delivery/:orderNo", title: "Order Delivery System" },
  { path: "/order-delivery/ticketing", title: "Order Delivery System" },
  {
    path: "/order-delivery/ticketing/:orderNo",
    title: "Order Delivery System",
  },
];

function getTitleFromPath(pathname) {
  for (let route of routeTitles) {
    const base = route.path.replace(/:\w+/g, "[^/]+");
    const regex = new RegExp("^" + base + "$");
    if (regex.test(pathname)) return route.title;
  }
  return "Dashboard";
}

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const currentTitle = getTitleFromPath(location.pathname);
  const dropdownRef = useRef(null);

  const { logout } = useAuth();

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <header className="">
      <div className="container-fluid px-3 py-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
         <div className="d-flex justify-content-between align-items-center w-100">
           <h1 className="fw-bold fs-4 px-0 me-md-3 border-0">
            {currentTitle}
          </h1>
         </div>

          <div className="d-flex flex-column flex-md-row align-items-center gap-3 w-100 justify-content-md-end">
            <div className="w-100 flex-md-grow-0" style={{ maxWidth: "350px" }}>
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

            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-light position-relative p-2 rounded-circle">
                <Bell size={18} />
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: "10px" }}
                >
                  .
                </span>
              </button>

              <div className="dropdown" ref={dropdownRef}>
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
                  <div className="text-start">
                    <div
                      className="fw-semibold text-dark"
                      style={{ fontSize: "14px" }}
                    >
                      Mubeen Bhullar
                    </div>
                    <div className="text-muted" style={{ fontSize: "12px" }}>
                      Admin
                    </div>
                  </div>
                </button>

                {showDropdown && (
                  <div
                    className="dropdown-menu dropdown-menu-end show mt-2 p-2"
                    style={{ minWidth: "200px" }}
                  >
                    <Link
                      to="/profile"
                      className="dropdown-item rounded py-2"
                    >
                      <User size={16} className="me-2" /> Profile
                    </Link>
                    <a className="dropdown-item rounded py-2" href="#">
                      <Settings size={16} className="me-2" /> Settings
                    </a>
                    <hr className="dropdown-divider" />
                    <button
                      onClick={logout}
                      className="nav-link d-flex align-items-center gap-2 border-0 bg-transparent"
                    >
                      <LogOut size={20} /> <span className="fs-6">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
