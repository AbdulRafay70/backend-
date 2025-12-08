import React from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import logo from "../../assets/logo.png";
import travel from "../../assets/travel.png";
import code from "../../assets/code.png";
import { ArrowLeft } from "react-bootstrap-icons";
import { Link } from "react-router-dom";

const AgentHotelVoucher = () => {
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
                <div className="p-2 ">
                  <div className="row">
                    <div className="col-md-12  d-flex justify-content-between">
                      <div>
                        <Link to="/booking-history">
                          <ArrowLeft size={"30px"} />
                        </Link>
                        <strong>Order Number: [Order#]</strong>
                      </div>
                      <div>
                        <button id="btn" className="btn me-1">Print</button>
                        <button id="btn" className="btn me-1">Edit</button>
                        <button id="btn" className="btn">Download</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  {/* Company Header */}
                  <div className="p-3" style={{ background: "#EBEBEB" }}>
                    <div className="row mb-3">
                      <div className="col-12 d-flex justify-content-center">
                        <img src={logo} alt="" style={{height:"40px", width:"150px"}} />
                      </div>
                      <div className="col-12 mt-2 d-flex justify-content-center">
                        <div className="text-center">
                          <h6>POWERED NY</h6>
                          <h5 className="text-muted">
                            SAER KARO TRAVEL AND TOURS
                          </h5>
                        </div>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-8 d-flex align-items-center gap-2">
                        <img src={travel} alt="" height={"150px"} />
                        <div>
                          <small>
                            <strong>92 World Travel And Tours</strong>
                          </small>
                          <br />
                          <small>
                            <strong>Voucher Date:</strong> 15-Jun-2025
                          </small>
                          <br />
                          <small>
                            <strong>Package:</strong> 30 Hajj-Package-2025
                          </small>
                        </div>
                      </div>
                      <div className="col-md-4 d-flex align-items-center gap-2">
                        <div>
                          <small>
                            <strong>Shirka: </strong> Abdul Razzaq Al Kutbi
                          </small>
                          <br />
                          <small>
                            <strong>City:</strong> AL RIAZ CHECKING
                          </small>
                          <br />
                          <small>
                            <strong>Help/line Number:</strong> +92 316 6615 6363
                          </small>
                          <br />
                          <small>
                            <strong>Voucher Status: </strong> Approved
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pax Information */}
                  <h6 className="fw-bold mb-3 mt-5">Pax Information</h6>
                  <div className="table-responsive mb-4">
                    <table className="table table-sm text-center">
                      <thead className="table-light">
                        <tr>
                          <th className="fw-normal">Passenger Name</th>
                          <th className="fw-normal">Passport No</th>
                          <th className="fw-normal">PAX</th>
                          <th className="fw-normal">DOB</th>
                          <th className="fw-normal">PHB</th>
                          <th className="fw-normal">Bed</th>
                          <th className="fw-normal">Total Pax</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>BILAL AHMAD MUHAMMAD NASIR</td>
                          <td>TH192019</td>
                          <td>Adult</td>
                          <td>29/07/78</td>
                          <td>MM055</td>
                          <td>True</td>
                          <td>2 Adult & 1 Child</td>
                        </tr>
                        <tr>
                          <td>ARSLAM BILAL BILAL AHMAD</td>
                          <td>PL372940</td>
                          <td>Adult</td>
                          <td>06/01/83</td>
                          <td>MM055</td>
                          <td>True</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>MIRAJUL BILAL</td>
                          <td>PW1795298</td>
                          <td>Child</td>
                          <td>26/10/08</td>
                          <td>MM055</td>
                          <td>True</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Accommodation */}
                  <h6 className="fw-bold mb-3 mt-5">Accommodation</h6>
                  <div className="table-responsive mb-4">
                    <table className="table table-sm text-center">
                      <thead className="table-light">
                        <tr>
                          <th className="fw-normal">Hotel Name</th>
                          <th className="fw-normal">Check-in</th>
                          <th className="fw-normal">Check-Out</th>
                          <th className="fw-normal">Nights</th>
                          <th className="fw-normal">Type</th>
                          <th className="fw-normal">QTY</th>
                          <th className="fw-normal">Rate</th>
                          <th className="fw-normal">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>HOTEL SAMA BRIT / SIMILAR</td>
                          <td>21/01/2024</td>
                          <td>23/01/2024</td>
                          <td>2</td>
                          <td>Tri Bed</td>
                          <td>1</td>
                          <td>SAR 52</td>
                          <td>SAR 208</td>
                        </tr>
                        <tr>
                          <td>HOTEL SAMA BRIT / SIMILAR</td>
                          <td>23/01/2024</td>
                          <td>25/01/2024</td>
                          <td>2</td>
                          <td>Tri Bed</td>
                          <td>1</td>
                          <td>SAR 52</td>
                          <td>SAR 208</td>
                        </tr>
                        <tr>
                          <td>HOTEL SAMA BRIT / SIMILAR</td>
                          <td>21/01/2024</td>
                          <td>23/01/2024</td>
                          <td>5</td>
                          <td>Tri Bed</td>
                          <td></td>
                          <td>SAR 52</td>
                          <td>SAR 520</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-around align-items-center">
                      <div>Total Accommodation:</div>
                      <div className="d-flex gap-5">
                        <div>20</div>
                        <div>SAR 948</div>
                      </div>
                    </div>
                  </div>

                  {/* Transportation */}
                  <div className="row">
                    <div className="col-md-10">
                      <h6 className="fw-bold mb-3 mt-5">Transportation</h6>
                      <div className="table-responsive mb-4">
                        <table className="table table-sm">
                          <thead className="table-light">
                            <tr>
                              <th>Vehicle type</th>
                              <th>Route</th>
                              <th>Rate</th>
                              <th>QTY</th>
                              <th>Net</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Economy By Bus</td>
                              <td>R7 - Jeddah-Makkah-Jeddah-Makkah-Jeddah-A</td>
                              <td>0</td>
                              <td>1</td>
                              <td>0</td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="d-flex justify-content-around">
                          <div>Total Transportation: </div>
                          <div>0</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Umrah Visa & Tickets Rates Details */}
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3 mt-5">
                        Pilgrims & Tickets Detail
                      </h6>
                      <div className="table-responsive mb-4">
                        <table className="table table-sm">
                          <thead className="table-light">
                            <tr>
                              <th>Pax</th>
                              <th>Total Pax</th>
                              <th>Visa Rate</th>
                              <th>Ticket Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Adult</td>
                              <td>2</td>
                              <td>SAR 318</td>
                              <td>PKR 100,000</td>
                            </tr>
                            <tr>
                              <td>Child</td>
                              <td>1</td>
                              <td>SAR 238</td>
                              <td>PKR 100,000</td>
                            </tr>
                            <tr>
                              <td>Infant</td>
                              <td>1</td>
                              <td>SAR 76</td>
                              <td>PKR 100,000</td>
                            </tr>
                            <tr>
                              <td>Total</td>
                              <td>4</td>
                              <td>SAR 1473</td>
                              <td>PKR 400,000</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <h6 className="fw-bold mb-3 mt-5">Invoice Details</h6>
                  <div className="row">
                    {/* Left Column */}
                    <div className="col-lg-8 col-md-7 col-12 mb-3">
                      <div className="mb-2">
                        <span>Booking Date: </span>
                        <span className="fw-bold">16/01/24</span>
                        <span className="ms-4 d-block d-sm-inline">
                          Family Head:{" "}
                          <span className="fw-bold">
                            ARSLAM BILAL BILAL AHMAD
                          </span>
                        </span>
                      </div>
                      <div className="mb-2">
                        <span>Booking#: </span>
                        <span className="fw-bold">UB-161799</span>
                        <span className="ms-4 d-block d-sm-inline">
                          Travel Date:{" "}
                          <span className="fw-bold">
                            SV-234-LHE-JED 19-DEC-2024-23:20-01:20
                          </span>
                        </span>
                      </div>
                      <div className="mb-2">
                        <span>Invoice Date: </span>
                        <span className="fw-bold">16/01/24</span>
                        <span className="ms-4 d-block d-sm-inline">
                          Return Date:{" "}
                          <span className="fw-bold">
                            SV-234-LHE-JED 19-DEC-2024-23:20-01:20
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-lg-4 col-md-5 col-12">
                      <div className="card border-0 h-100">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between mb-2">
                            <span>Total Pax:</span>
                            <strong>3</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Visa Rate @ 78.75:</span>
                            <strong>PKR 117,716</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Tickets:</span>
                            <strong>PKR 480,000</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Hotel @ 78.75:</span>
                            <strong>PKR 35,451</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-3">
                            <span>Transport @ 78.75:</span>
                            <strong>PKR 0</strong>
                          </div>
                          <hr />
                          <div
                            className="d-flex justify-content-between align-items-center py-2 px-3 text-white rounded-5"
                            style={{ background: "#1B78CE" }}
                          >
                            <span>
                              <strong>Net PKR:</strong>
                            </span>
                            <strong>PKR 153,167</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card border-0 h-100">
                      <div className="card-body p-3">
                        <h6 className="mb-2">
                          <strong>Booking Notes:</strong> Biryani meal only.
                        </h6>
                        <h6 className="mb-0">
                          <strong>Voucher Notes:</strong> need window seat only on
                          airplane and need clean and neat room.
                        </h6>
                      </div>
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

export default AgentHotelVoucher;
