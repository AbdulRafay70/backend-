import React, { useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import travel from "../../assets/travel.png";

const AgentGroupTicketsInvoice = () => {
  return (
   <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4">
              <div className="mb-5 d-flex justify-content-between">
                <Link to="/booking-history">
                  <ArrowLeft />
                </Link>
                <div>
                  <button id="btn" className="btn me-1">Print</button>
                  <button id="btn" className="btn">Download</button>
                </div>
              </div>

              <div className="row mb-2">
                <div className="col-md-4">
                  <img src={travel} alt="" />
                </div>
                <div className="col-md-8 mt-3">
                  <div className="row d-flex align-items-center justify-content-end">
                    <div className="col-md-3">
                      <h6 className="fw-bold">Name:</h6>
                      <h6>92 World travel</h6>
                    </div>
                    <div className="col-md-3">
                      <h6 className="fw-bold">Agent Name:</h6>
                      <h6>Reman Rafique +923631569595</h6>
                    </div>
                    <div className="col-md-3">
                      <h6 className="fw-bold">Address:</h6>
                      <h6>Hillite town, Street 78, Gujranwala</h6>
                    </div>
                    <div className="col-md-3">
                      <h6 className="fw-bold">Code:</h6>
                      <h6>9236 626262</h6>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <h5 className="fw-bold">Tickets Detail</h5>
              <div className="card border-0 mb-4">
                <div className="card-body">
                  {/* Departure Header */}
                  <div
                    className="container p-4 rounded-4"
                    style={{ background: "#E5F2FF" }}
                  >
                    <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mb-4">
                      {/* Flight Route Section */}
                      <div className="d-flex align-items-center gap-4 flex-wrap">
                        {/* Departure 1 */}
                        <div className="text-center">
                          <h5 className="fw-bold">Depart</h5>
                          <h2 className="fw-bold">20:15</h2>
                          <p className="mb-1">October 4, 225</p>
                          <p className="fw-bold">Sialkot (SKR)</p>
                        </div>

                        {/* Stopover */}
                        <div className="text-center">
                          <h6 className="mb-0">1st stop at</h6>
                          <p className="fw-bold">Dubai</p>
                        </div>

                        {/* Departure 2 */}
                        <div className="text-center">
                          <h5 className="fw-bold">Depart</h5>
                          <h2 className="fw-bold">20:15</h2>
                          <p className="mb-1">October 4, 225</p>
                          <p className="fw-bold">Jeddah (JED)</p>
                        </div>
                      </div>
                      <div
                        className="d-none d-sm-block"
                        style={{
                          borderLeft: "2px dashed rgba(0, 0, 0, 0.3)",
                          height: "140px",
                        }}
                      ></div>

                      {/* Status and Class Info */}
                      <div className="d-flex flex-column flex-md-row gap-5 text-center">
                        <div>
                          <div>
                            <h6 className="fw-bold mb-1">Confirm</h6>
                            <div className="small">Status</div>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-1">Economy</h6>
                            <div className="small">Class</div>
                          </div>
                        </div>
                        <div>
                          <div>
                            <h6 className="fw-bold mb-1">95LAHD</h6>
                            <div className="small">PNR</div>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-1">30.0 KG</h6>
                            <div className="small">Baggage</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Details Tables */}
                  <div className="mb-4 mt-5">
                    <h5 className="fw-bold mb-3">Passenger Details</h5>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="table-responsive">
                        <table className="table table-sm mb-3">
                          <thead>
                            <tr>
                              <th className="fw-normal">Pex NO</th>
                              <th className="fw-normal">Traveler Name</th>
                              <th className="fw-normal">Agency PNR</th>
                              <th className="fw-normal">Fore</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="fw-bold">
                                <strong>{i.toString().padStart(2, "0")}</strong>
                              </td>
                              <td className="fw-bold">
                                BILAL AHMAD MUHAMMAD NASIR
                              </td>
                              <td className="fw-bold">95LAHD</td>
                              <td className="fw-bold">Rs 120,000/</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>

                  {/* Total Balance Section */}
                  <div className="row mb-4">
                    <div
                      className="col-md-6 p-4 rounded-4"
                      style={{ background: "#E5F2FF" }}
                    >
                      <h6 className="fw-bold mb-3">Total Balance</h6>

                      <div className="d-flex justify-content-end mb-2">
                        <h6 className="mb-0 fw-bold">Sub Total =</h6>
                        <h6 className="mb-0">Rs 360,000/-</h6>
                      </div>

                      <div className="d-flex justify-content-end mb-2">
                        <h6 className="mb-0 fw-bold">Paid =</h6>
                        <h6 className="mb-0 text-primary">Rs 360,000/-</h6>
                      </div>

                      <div className="d-flex justify-content-end">
                        <h6 className="mb-0 fw-bold">Pending =</h6>
                        <h6 className="mb-0">Rs 0/-</h6>
                      </div>
                    </div>
                  </div>
                  <div className="text-end mt-5">
                    <h6>Booking Date: 15/6/2200</h6>
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

export default AgentGroupTicketsInvoice;
