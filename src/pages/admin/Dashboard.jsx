import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { NavLink, useLocation } from "react-router-dom";
import {
  ArrowDown,
  Calendar,
  DollarSign,
  MoveDown,
  MoveLeft,
  MoveRight,
  Plane,
  Search,
  User,
} from "lucide-react";
import dayjs from "dayjs";

const tabs = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Logs", path: "/dashboard/logs" },
];

const Dashboard = () => {
  const bookings = [
    {
      name: "Salman",
      package: "Umrah Packages",
      duration: "5D5N",
      date: "Jun 25, 25 - Jun 30, 25",
      price: "Rs.150000",
      status: "Confirmed",
    },
    {
      name: "Raphael Goodman",
      package: "Safari Adventure",
      duration: "8D7N",
      date: "Jun 25 - Jul 2",
      price: "$3200",
      status: "Pending",
    },
    {
      name: "Ludwig Contessa",
      package: "Alpine Escape",
      duration: "7D6N",
      date: "Jun 20 - Jul 2",
      price: "$2100",
      status: "Confirmed",
    },
    {
      name: "Amirna Raul Meyers",
      package: "Caribbean Cruise",
      duration: "10D9N",
      date: "Jun 26 - Jul 5",
      price: "$2800",
      status: "Cancelled",
    },
    {
      name: "James Dunn",
      package: "Parisian Romance",
      duration: "5D4N",
      date: "Jun 28 - Jun 30",
      price: "$1200",
      status: "Confirmed",
    },
  ];

  const getStatusBadge = (status) => {
    const statusStyles = {
      Confirmed: {
        backgroundColor: "#1B78CE",
        color: "#fff",
      },
      Pending: {
        backgroundColor: "#E8F5FF",
        color: "#1B78CE",
      },
      Cancelled: {
        backgroundColor: "#FFE1E3",
        color: "red",
      },
    };
    return (
      statusStyles[status] || {
        backgroundColor: "#6c757d", // default bg-secondary
        color: "#fff",
      }
    );
  };

  const [date, setDate] = useState(dayjs());
  const [showCalendar, setShowCalendar] = useState(false);

  const startOfMonth = date.startOf("month");
  const endOfMonth = date.endOf("month");
  const startDay = startOfMonth.day(); // 0 (Sun) to 6 (Sat)
  const totalDays = endOfMonth.date();

  const generateCalendar = () => {
    const days = [];
    let dayCounter = 1 - startDay;
    for (let week = 0; week < 6; week++) {
      let row = [];
      for (let day = 0; day < 7; day++) {
        const current = date.date(dayCounter);
        const isCurrentMonth = dayCounter > 0 && dayCounter <= totalDays;
        const isToday = current.isSame(dayjs(), "day");
        row.push(
          <td
            key={day}
            className={`text-center p-2 ${isCurrentMonth
                ? isToday
                  ? "bg-primary text-white rounded"
                  : ""
                : "text-muted"
              }`}
            style={{
              cursor: isCurrentMonth ? "pointer" : "default",
              width: "14.28%",
              height: "40px",
              position: "relative",
            }}
          >
            {dayCounter > 0 && dayCounter <= totalDays ? dayCounter : ""}
          </td>
        );
        dayCounter++;
      }
      days.push(<tr key={week}>{row}</tr>);
    }
    return days;
  };

  const handlePrev = () => setDate(date.subtract(1, "month"));
  const handleNext = () => setDate(date.add(1, "month"));

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
                {/* Navigation Tabs - full width on mobile */}
                <nav className="nav d-flex flex-wrap flex-md-nowrap gap-2 gap-md-0 w-100 w-md-auto">
                  {tabs.map((tab, index) => (
                    <NavLink
                      key={index}
                      to={tab.path}
                      className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Dashboard"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                        }`}
                      style={{ backgroundColor: "transparent" }}
                    >
                      {tab.name}
                    </NavLink>
                  ))}
                </nav>
                <div className="row small">
                  <div className="col-12 col-lg-8">
                    <div className="row">
                      <div className="col-12 col-md-6 col-lg-4">
                        <div
                          className="card border-0 rounded-4 px-1 py-1 mb-2"
                          style={{ background: "#E8F5FF" }}
                        >
                          <div className="card-body d-flex align-items-center gap-3 p-2">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center"
                              style={{
                                background: "#FFFFFF",
                                width: "40px",
                                height: "40px",
                              }}
                            >
                              <Calendar color="#1B78CE" />
                            </div>
                            <div>
                              <div className="text-muted small">Working Agents</div>
                              <div className="fw-bold text-dark">1,200</div>
                              <span className="text-success small bg-white px-1 rounded fw-semibold">
                                +2.98%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6 col-lg-4">
                        <div
                          className="card border-0 rounded-4 px-1 py-1 mb-2"
                          style={{ background: "#E8F5FF" }}
                        >
                          <div className="card-body d-flex align-items-center gap-3 p-2">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center"
                              style={{
                                background: "#FFFFFF",
                                width: "40px",
                                height: "40px",
                              }}
                            >
                              <User color="#1B78CE" />
                            </div>
                            <div>
                              <div className="text-muted small">New Agents</div>
                              <div className="fw-bold text-dark">2,845</div>
                              <span
                                className=" small px-1 rounded fw-semibold"
                                style={{ background: "#FFACB1" }}
                              >
                                -1.45%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6 col-lg-4">
                        <div
                          className="card border-0 rounded-4 px-1 py-1 mb-2"
                          style={{ background: "#E8F5FF" }}
                        >
                          <div className="card-body d-flex align-items-center gap-3 p-2">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center"
                              style={{
                                background: "#FFFFFF",
                                width: "40px",
                                height: "40px",
                              }}
                            >
                              <DollarSign color="#1B78CE" />
                            </div>
                            <div>
                              <div className="text-muted small">
                                Total Recovery Pending
                              </div>
                              <div className="fw-bold text-dark">Rs.12,890</div>
                              <span className="small bg-white px-1 rounded fw-semibold">
                                See Payment
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* </div> */}
                        {/* ))} */}
                      </div>
                    </div>
                    {/* prograss bar */}
                    <div className="card border rounded-4 mt-2 mb-3 ">
                      <div className="card-body p-3">
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                          {/* Left Content */}
                          <div className="d-flex align-items-center">
                            <div
                              className="p-3 rounded-3 me-3"
                              style={{ background: "#E8F5FF" }}
                            >
                              <Plane
                                style={{ color: "#1B78CE", width: 24, height: 24 }}
                              />
                            </div>
                            <div>
                              <div className="text-muted small">Total Orders</div>
                              <div className="h3 fw-bold mb-0">1,200</div>
                            </div>
                          </div>

                          {/* Right Content */}
                          <div
                            className="flex-grow-1 w-100"
                            style={{ maxWidth: "600px" }}
                          >
                            {/* Progress Bar */}
                            <div
                              className="d-flex w-100 rounded-1 overflow-hidden"
                              style={{ height: "14px", backgroundColor: "#f1f5f9" }}
                            >
                              <div
                                className="h-100"
                                style={{
                                  width: "52%",
                                  background:
                                    "linear-gradient(90deg, #c2e0ff 0%, #e8f5ff 100%)",
                                }}
                              ></div>
                              <div
                                className="h-100"
                                style={{
                                  width: "39%",
                                  background:
                                    "linear-gradient(90deg, #87c6ff 0%, #b9e0ff 100%)",
                                }}
                              ></div>
                              <div
                                className="h-100"
                                style={{
                                  width: "9%",
                                  background:
                                    "linear-gradient(90deg, #1a76ca 0%, #1B78CE 100%)",
                                }}
                              ></div>
                            </div>

                            {/* Legend */}
                            <div className="d-flex justify-content-between gap-3 mt-3">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-1 me-1"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    backgroundColor: "#e8f5ff",
                                  }}
                                ></div>
                                <span className="small text-muted">Done</span>
                              </div>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-1 me-1"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    backgroundColor: "#b9e0ff",
                                  }}
                                ></div>
                                <span className="small text-muted">Booked</span>
                              </div>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-1 me-1"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    backgroundColor: "#1B78CE",
                                  }}
                                ></div>
                                <span className="small text-muted">Cancelled</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card border rounded-4 mt-2 mb-3 ">
                      <div className="card-body p-3">
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                          {/* Left Content */}
                          <div className="d-flex align-items-center">
                            <div
                              className="p-3 rounded-3 me-3"
                              style={{ background: "#E8F5FF" }}
                            >
                              <Plane
                                style={{ color: "#1B78CE", width: 24, height: 24 }}
                              />
                            </div>
                            <div>
                              <div className="text-muted small">Total Orders</div>
                              <div className="h3 fw-bold mb-0">1,200</div>
                            </div>
                          </div>

                          {/* Right Content */}
                          <div
                            className="flex-grow-1 w-100"
                            style={{ maxWidth: "600px" }}
                          >
                            {/* Progress Bar */}
                            <div
                              className="d-flex w-100 rounded-1 overflow-hidden"
                              style={{ height: "14px", backgroundColor: "#f1f5f9" }}
                            >
                              <div
                                className="h-100"
                                style={{
                                  width: "52%",
                                  background:
                                    "linear-gradient(90deg, #c2e0ff 0%, #e8f5ff 100%)",
                                }}
                              ></div>
                              <div
                                className="h-100"
                                style={{
                                  width: "39%",
                                  background:
                                    "linear-gradient(90deg, #87c6ff 0%, #b9e0ff 100%)",
                                }}
                              ></div>
                              <div
                                className="h-100"
                                style={{
                                  width: "9%",
                                  background:
                                    "linear-gradient(90deg, #1a76ca 0%, #1B78CE 100%)",
                                }}
                              ></div>
                            </div>

                            {/* Legend */}
                            <div className="d-flex justify-content-between gap-3 mt-3">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-1 me-1"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    backgroundColor: "#e8f5ff",
                                  }}
                                ></div>
                                <span className="small text-muted">Done</span>
                              </div>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-1 me-1"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    backgroundColor: "#b9e0ff",
                                  }}
                                ></div>
                                <span className="small text-muted">Booked</span>
                              </div>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-1 me-1"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    backgroundColor: "#1B78CE",
                                  }}
                                ></div>
                                <span className="small text-muted">Cancelled</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card border rounded-4 mt-2 mb-3 ">
                      <div className="card-body p-3">
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                          {/* Left Content */}
                          <div className="d-flex align-items-center">
                            <div
                              className="p-3 rounded-3 me-3"
                              style={{ background: "#E8F5FF" }}
                            >
                              <Plane
                                style={{ color: "#1B78CE", width: 24, height: 24 }}
                              />
                            </div>
                            <div>
                              <div className="text-muted small">Total Orders</div>
                              <div className="h3 fw-bold mb-0">1,200</div>
                            </div>
                          </div>

                          {/* Right Content */}
                          <div
                            className="flex-grow-1 w-100"
                            style={{ maxWidth: "600px" }}
                          >
                            {/* Progress Bar */}
                            <div
                              className="d-flex w-100 rounded-1 overflow-hidden"
                              style={{ height: "14px", backgroundColor: "#f1f5f9" }}
                            >
                              <div
                                className="h-100"
                                style={{
                                  width: "52%",
                                  background:
                                    "linear-gradient(90deg, #c2e0ff 0%, #e8f5ff 100%)",
                                }}
                              ></div>
                              <div
                                className="h-100"
                                style={{
                                  width: "39%",
                                  background:
                                    "linear-gradient(90deg, #87c6ff 0%, #b9e0ff 100%)",
                                }}
                              ></div>
                              <div
                                className="h-100"
                                style={{
                                  width: "9%",
                                  background:
                                    "linear-gradient(90deg, #1a76ca 0%, #1B78CE 100%)",
                                }}
                              ></div>
                            </div>

                            {/* Legend */}
                            <div className="d-flex justify-content-between gap-3 mt-3">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-1 me-1"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    backgroundColor: "#e8f5ff",
                                  }}
                                ></div>
                                <span className="small text-muted">Done</span>
                              </div>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-1 me-1"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    backgroundColor: "#b9e0ff",
                                  }}
                                ></div>
                                <span className="small text-muted">Booked</span>
                              </div>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-1 me-1"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    backgroundColor: "#1B78CE",
                                  }}
                                ></div>
                                <span className="small text-muted">Cancelled</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card border rounded-3 px-4">
                      <div className="card bg-none border-0 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center py-3 gap-2">
                        <h5 className="mb-0">Recent Bookings</h5>
                        <div className="d-flex gap-2">
                          <div className="input-group">
                            <span className="input-group-text bg-light">
                              <Search size={18} />
                            </span>
                            <input
                              type="text"
                              className="form-control border-start-0 bg-light"
                              placeholder="Search anything"
                              style={{
                                boxShadow: "none",
                                border: "1px solid #e9ecef",
                              }}
                            />
                          </div>
                          <button
                            className="btn btn-sm text-white"
                            style={{ background: "#1B78CE" }}
                          >
                            View All
                          </button>
                        </div>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="custom-thead">
                              <tr>
                                <th className="ps-4 fw-normal text-secondary text-nowrap">
                                  Name
                                </th>
                                <th className="fw-normal text-secondary text-nowrap">
                                  Package
                                </th>
                                <th className="fw-normal text-secondary text-nowrap">
                                  Duration
                                </th>
                                <th className="fw-normal text-secondary text-nowrap">
                                  Date
                                </th>
                                <th className="fw-normal text-secondary text-nowrap">
                                  Price
                                </th>
                                <th className="pe-4 fw-normal text-secondary text-nowrap">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {bookings.map((booking, idx) => (
                                <tr key={idx}>
                                  <td className="py-3 ps-4 fw-medium">
                                    {booking.name}
                                  </td>
                                  <td>{booking.package}</td>
                                  <td>{booking.duration}</td>
                                  <td className="text-muted">{booking.date}</td>
                                  <td className="fw-semibold">{booking.price}</td>
                                  <td className="pe-4">
                                    <span
                                      className="badge fw-light px-3 py-2"
                                      style={{
                                        minWidth: "90px",
                                        ...getStatusBadge(booking.status),
                                      }}
                                    >
                                      {booking.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-4">
                    {/* Toggle on Mobile */}
                    <div className="d-md-none mb-3">
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowCalendar(!showCalendar)}
                      >
                        {showCalendar ? "Hide Calendar" : "Show Calendar"}
                      </button>
                    </div>

                    {/* Calendar Card */}
                    <div
                      className={`card border mb-3 ${showCalendar ? "d-block" : "d-none"
                        } d-md-block`}
                    >
                      <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3">
                        <h6 className="mb-0 fw-bold">
                          {date.format("MMMM YYYY")} <ArrowDown />
                        </h6>
                        <div>
                          <button
                            className="btn btn-sm btn-light me-1"
                            onClick={handlePrev}
                          >
                            <MoveLeft />
                          </button>
                          <button
                            className="btn btn-sm btn-light"
                            onClick={handleNext}
                          >
                            <MoveRight />
                          </button>
                        </div>
                      </div>
                      <div className="card-body p-2">
                        <table className="table table-sm table-borderless mb-0">
                          <thead>
                            <tr className="text-muted">
                              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                                (day, idx) => (
                                  <th
                                    key={idx}
                                    className="text-center py-2 fw-normal"
                                  >
                                    {day}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody>{generateCalendar()}</tbody>
                        </table>
                      </div>
                    </div>

                    {/* {[
                {
                  label: "Total Agents",
                  value: "4,250",
                  icon: "users",
                  color: "primary",
                  change: "+3.75%",
                },
                {
                  label: "Agreement Agents",
                  value: "3,850",
                  icon: "file-contract",
                  color: "success",
                  change: "+5.2%",
                },
                {
                  label: "Pending Payments",
                  value: "Rs.89,500",
                  action: "See Details",
                },
                {
                  label: "New Agents",
                  value: "320",
                  icon: "user-plus",
                  color: "success",
                  change: "+12.4%",
                },
              ].map((stat, idx) => ( */}

                    <div
                      className="card border-0 rounded-4 px-1 py-1 mb-4"
                      style={{ background: "#E8F5FF" }}
                    >
                      <div className="card-body d-flex align-items-center gap-3 p-2">
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center"
                          style={{
                            background: "#FFFFFF",
                            width: "40px",
                            height: "40px",
                          }}
                        >
                          <DollarSign color="#1B78CE" />
                        </div>
                        <div>
                          <div className="text-muted small">
                            Total Recovery Pending
                          </div>
                          <div className="fw-bold text-dark">Rs.12,890</div>
                          <span className="small bg-white px-1 rounded fw-semibold">
                            See Payment
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="card border-0 rounded-4 px-1 py-1 mb-4"
                      style={{ background: "#E8F5FF" }}
                    >
                      <div className="card-body d-flex align-items-center gap-3 p-2">
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center"
                          style={{
                            background: "#FFFFFF",
                            width: "40px",
                            height: "40px",
                          }}
                        >
                          <DollarSign color="#1B78CE" />
                        </div>
                        <div>
                          <div className="text-muted small">
                            Total Recovery Pending
                          </div>
                          <div className="fw-bold text-dark">Rs.12,890</div>
                          <span className="small bg-white px-1 rounded fw-semibold">
                            See Payment
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="card border-0 rounded-4 px-1 py-1 mb-4"
                      style={{ background: "#E8F5FF" }}
                    >
                      <div className="card-body d-flex align-items-center gap-3 p-2">
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center"
                          style={{
                            background: "#FFFFFF",
                            width: "40px",
                            height: "40px",
                          }}
                        >
                          <DollarSign color="#1B78CE" />
                        </div>
                        <div>
                          <div className="text-muted small">
                            Total Recovery Pending
                          </div>
                          <div className="fw-bold text-dark">Rs.12,890</div>
                          <span className="small bg-white px-1 rounded fw-semibold">
                            See Payment
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="card border-0 rounded-4 px-1 py-1 mb-4"
                      style={{ background: "#E8F5FF" }}
                    >
                      <div className="card-body d-flex align-items-center gap-3 p-2">
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center"
                          style={{
                            background: "#FFFFFF",
                            width: "40px",
                            height: "40px",
                          }}
                        >
                          <DollarSign color="#1B78CE" />
                        </div>
                        <div>
                          <div className="text-muted small">
                            Total Recovery Pending
                          </div>
                          <div className="fw-bold text-dark">Rs.12,890</div>
                          <span className="small bg-white px-1 rounded fw-semibold">
                            See Payment
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* ))} */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
