import { Bell, LogOut, Search, Settings, User } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const routeTitles = [
  { path: "/agent/profile", title: "Profile" },
  { path: "/agent/packages", title: "Packages Details" },
  { path: "/agent/packages/detail", title: "Packages Details" },
  { path: "/agent/packages/review", title: "Packages Details" },
  { path: "/agent/packages/pay", title: "Packages Details" },
  { path: "/agent/packages/umrah-calculater", title: "Umrah Calculater" },
  { path: "/agent/packages/custom-umrah", title: "Custom Umrah Package" },
  {
    path: "/agent/packages/custom-umrah/detail",
    title: "Custom Umrah Package",
  },
  {
    path: "/agent/packages/custom-umrah/review",
    title: "Custom Umrah Package",
  },
  { path: "/agent/packages/custom-umrah/pay", title: "Custom Umrah Package" },
  { path: "/agent/hotels", title: "Hotels" },
  { path: "/agent/hotels/add-hotels", title: "Hotel Sheet" },
  { path: "/agent/intimation", title: "Intimation" },
  { path: "/agent/booking", title: "Bookings" },
  { path: "/agent/booking/detail", title: "Booking" },
  { path: "/agent/booking/review", title: "Booking" },
  { path: "/agent/booking/pay", title: "Booking" },
  { path: "/agent/payment", title: "Payment" },
  { path: "/agent/payment/add-deposit", title: "Payment" },
  { path: "/agent/payment/bank-accounts", title: "Payment" },
  { path: "/agent/booking-history", title: "Booking History" },
  { path: "/agent/booking-history/hotel-voucher", title: "Booking History" },
  { path: "/agent/booking-history/invoice", title: "Booking History" },
  { path: "/agent/booking-history/group-tickets", title: "Booking History" },
  { path: "/agent/booking-history/group-tickets/invoice", title: "Booking History" },
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

  return (
    <header className="">
      <div className="container-fluid px-3 py-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
          <h1 className="fw-bold fs-4 px-0 w-100 me-md-3 border-0">
            {currentTitle}
          </h1>

          <div className="d-lg-flex d-none flex-column flex-md-row align-items-center gap-3 w-100 justify-content-md-end">
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
                    <Link to="/agent/profile" className="dropdown-item rounded py-2" href="#">
                      <User size={16} className="me-2" /> Profile
                    </Link>
                    <a className="dropdown-item rounded py-2" href="#">
                      <Settings size={16} className="me-2" /> Settings
                    </a>
                    <hr className="dropdown-divider" />
                    <Link to="/agent/login" className="dropdown-item rounded py-2" href="#">
                      <LogOut size={16} className="me-2" /> Logout
                    </Link>
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
