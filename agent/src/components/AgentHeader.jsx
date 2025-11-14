import { Bell, LogOut, Search, Settings, User } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const routeTitles = [
  { path: "/profile", title: "Profile" },
  { path: "/packages", title: "Packages " },
  { path: "/packages/detail", title: "Packages Booking" },
  { path: "/packages/review", title: "Packages Booking" },
  { path: "/packages/pay", title: "Packages Booking" },
  { path: "/packages/umrah-calculater", title: "Umrah Calculater" },
  { path: "/packages/custom-umrah", title: "Custom Umrah Package" },
  {
    path: "/packages/custom-umrah/detail",
    title: "Custom Umrah Package",
  },
  {
    path: "/packages/custom-umrah/review",
    title: "Custom Umrah Package",
  },
  { path: "/packages/custom-umrah/pay", title: "Custom Umrah Package" },
  { path: "/hotels", title: "Hotels" },
  { path: "/hotels/add-hotels", title: "Hotel Sheet" },
  { path: "/intimation", title: "Intimation" },
  { path: "/booking", title: "Bookings" },
  { path: "/booking/detail", title: "Booking" },
  { path: "/booking/review", title: "Booking" },
  { path: "/booking/pay", title: "Booking" },
  { path: "/payment", title: "Payment" },
  { path: "/payment/add-deposit", title: "Payment" },
  { path: "/payment/bank-accounts", title: "Payment" },
  { path: "/booking-history", title: "Booking History" },
  { path: "/booking-history/hotel-voucher", title: "Booking History" },
  { path: "/booking-history/invoice", title: "Booking History" },
  { path: "/booking-history/group-tickets", title: "Booking History" },
  { path: "/booking-history/group-tickets/invoice", title: "Booking History" },
];

function getTitleFromPath(pathname) {
  for (let route of routeTitles) {
    const base = route.path.replace(/:\w+/g, "[^/]+"); // handle dynamic params
    const regex = new RegExp("^" + base + "$");
    if (regex.test(pathname)) return route.title;
  }
  return "Dashboard"; // default
}

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const currentTitle = getTitleFromPath(location.pathname);

  const { logout } = useAuth();
  const handleLogout = () => {
    localStorage.removeItem("organizationData");
    logout();
  };

  return (
    <header className="">
  <div className="px-lg-3 py-lg-2">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center mt-2 ms-3">
            <h1 className="fw-bold fs-4 px-0 border-0 ">
              {currentTitle}
            </h1>
          </div>

          <div className="d-lg-flex d-none flex-column flex-md-row align-items-center gap-3 justify-content-md-end">
            <div className=" flex-md-grow-0" style={{ maxWidth: "350px" }}>
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
              <button className="btn btn-light position-relative p-2" style={{ borderRadius: "50%" }}>
                <Bell size={18} />
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: "10px" }}
                >
                  .
                </span>
              </button>

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
                  <div className="text-start">
                    <div
                      className="fw-semibold text-dark"
                      style={{ fontSize: "14px" }}
                    >
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
                    <Link to="/profile" className="dropdown-item rounded py-2" href="#">
                      <User size={16} className="me-2" /> Profile
                    </Link>
                    <a className="dropdown-item rounded py-2" href="#">
                      <Settings size={16} className="me-2" /> Settings
                    </a>
                    <hr className="dropdown-divider" />
                    <button
                      className="nav-link px-3"
                      onClick={handleLogout}
                    >
                      <LogOut size={20} className="me-2" /> Logout
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
