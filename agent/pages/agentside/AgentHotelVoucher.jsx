import React from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import logo from "../../assets/logo.png";
import travel from "../../assets/travel.png";
import code from "../../assets/code.png";
import { ArrowLeft } from "react-bootstrap-icons";
import { Link } from "react-router-dom";

const AgentHotelVoucher = () => {
  const mutamerData = [
    {
      sno: 1,
      passportNo: "EG196836",
      mutamerName: "Shan Ahmad",
      g: "M",
      pax: "Adult",
      bed: "Yes",
      mohafiz: "",
      ghzpVisa: "9200 TO 9308800",
      pmb: "",
    },
    {
      sno: 2,
      passportNo: "EG196836",
      mutamerName: "Shan Ahmad",
      g: "M",
      pax: "Adult",
      bed: "Yes",
      mohafiz: "",
      ghzpVisa: "9200 TO 9308800",
      pmb: "",
    },
    {
      sno: 3,
      passportNo: "EG196836",
      mutamerName: "Ahmad Ijaz",
      g: "M",
      pax: "Adult",
      bed: "Yes",
      mohafiz: "",
      ghzpVisa: "APT30330",
      pmb: "",
    },
  ];

  const accommodationData = [
    {
      city: "Madinah",
      hotelName: "Adwa Hotel Jawharat al Madinah",
      voucherNo: "90063523",
      value: "Shared",
      meal: "BNS",
      confirm: "OK",
      roomType: "Sharing(Quads)",
      checkIn: "03/07/25",
      checkOut: "09/07/25",
      nights: "8",
    },
    {
      city: "Madinah",
      hotelName: "Adwa Hotel Jawharat al Madinah",
      voucherNo: "90063523",
      value: "Shared",
      meal: "BNS",
      confirm: "OK",
      roomType: "Sharing(Quads)",
      checkIn: "03/07/25",
      checkOut: "09/07/25",
      nights: "7",
    },
    {
      city: "Makkah",
      hotelName: "MAKKAH INN MUWAFAQ Makkah Mukarramah Hotel",
      voucherNo: "90063523",
      value: "Shared",
      meal: "BNS",
      confirm: "OK",
      roomType: "Sharing(Quads)",
      checkIn: "09/07/25",
      checkOut: "09/07/25",
      nights: "5",
    },
  ];

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

                {/* Mutamers Section */}
                <div className="mb-4">
                  <h5 className="p-2 fw-bold  mt-5 mb-1">Mutamers</h5>

                  <div className="table-responsive">
                    <div className="text-end mb-2">
                      <small>
                        Family Head: <strong>HAMZA JATT</strong>
                      </small>
                    </div>
                    <table className="table text-center table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>SNO</th>
                          <th>Passport No.</th>
                          <th>Mutamer Name</th>
                          <th>G</th>
                          <th>PAX</th>
                          <th>Bed</th>
                          <th>MOHAFIZ</th>
                          <th>GHZP VISA#</th>
                          <th>PMB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mutamerData.map((row, index) => (
                          <tr key={index}>
                            <td>{row.sno}</td>
                            <td>{row.passportNo}</td>
                            <td>{row.mutamerName}</td>
                            <td>{row.g}</td>
                            <td>{row.pax}</td>
                            <td>{row.bed}</td>
                            <td>{row.mohafiz}</td>
                            <td>{row.ghzpVisa}</td>
                            <td>{row.pmb}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Accommodation Section */}
                <div className="mb-4">
                  <h5 className="p-2 fw-bold  mb-3">Accommodation</h5>
                  <div className="table-responsive">
                    <table className="table text-center table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>City</th>
                          <th>Hotel Name</th>
                          <th>Voucher No.</th>
                          <th>Value</th>
                          <th>Meal</th>
                          <th>Confirm</th>
                          <th>Room Type</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Nights</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accommodationData.map((row, index) => (
                          <tr key={index}>
                            <td>{row.city}</td>
                            <td>{row.hotelName}</td>
                            <td>{row.voucherNo}</td>
                            <td>{row.value}</td>
                            <td>{row.meal}</td>
                            <td>{row.confirm}</td>
                            <td>{row.roomType}</td>
                            <td>{row.checkIn}</td>
                            <td>{row.checkOut}</td>
                            <td>{row.nights}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-end">
                    <small>
                      <strong>Total Nights: 30</strong>
                    </small>
                  </div>
                </div>

                {/* Transport/Services Section */}
                <div className="mb-4">
                  <h5 className="p-2 fw-bold mb-3">Transport / Services</h5>
                  <div className="row">
                    <div className="col-md-10">
                      <table className="table text-center table-sm">
                        <thead className="table-light">
                          <tr>
                            <th>Voucher</th>
                            <th>Type</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>900639</td>
                            <td>Company Transport</td>
                            <td>Economy by Bus</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-2 text-center">
                      <div className="p-3">
                        <div>
                          <img
                            src={code}
                            alt=""
                            style={{
                              width: "100px",
                              height: "100px",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flight Information */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h5 className="fw-bold p-2 mb-2">
                      Departure--Pakistan To KSA
                    </h5>
                    <table className="table table-bordered table-sm">
                      <thead className="">
                        <tr>
                          <th>Flight</th>
                          <th>Sector</th>
                          <th>Departure</th>
                          <th>Arrival</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>TK-334</td>
                          <td>ISB-JED</td>
                          <td>TH-08/07/25</td>
                          <td>SU-09/07/25</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h5 className="p-2 fw-bold mb-2">
                      Arrival--KSA To Pakistan
                    </h5>
                    <table className="table table-bordered table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>Flight</th>
                          <th>Sector</th>
                          <th>Departure</th>
                          <th>Arrival</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>TK-333</td>
                          <td>JED-ISB</td>
                          <td>TU-05/08/25</td>
                          <td>TU-05/08/25</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mb-4">
                  <div className="d-flex gap-2">
                    <h5>
                      <strong>Notes:</strong>{" "}
                    </h5>
                    <small>PLEASE ACCOMMODATE WITH PRIORITY</small>
                  </div>
                  <div className="small border rounded-2 p-3 border-black text-muted">
                    <p>
                      <strong>Makkah Hotel:</strong> ELLA ESTIMATED City-Days-1:
                      09/06/09-09/08/25 P A HAMZA SHEIKH Flight Daily
                      09/06/09-08/08/2-
                    </p>
                    <p>
                      <strong>Madina Hotel:</strong> UB WAQAS AHMED:
                      09/06/09-08/08/25
                    </p>
                    <p>
                      <strong>Transport:</strong> Airiz Abdool: 09/06/09-08/09
                    </p>
                  </div>
                </div>

                {/* Rules Section */}
                <div className="mb-4">
                  <h5 className="fw-bold  p-2 mb-2">Rules</h5>
                  <div className="small">
                    <p>
                      <strong>1. Booking Confirmation:</strong> This voucher
                      serves as proof of hotel booking and must be presented at
                      check-in.
                    </p>
                    <p>
                      <strong>2. Check-in and Check-out Time:</strong> Standard
                      check-in time is 14:00 hrs and check out time is 12:00
                      hrs. Entry check-in or late check-out may be available on
                      request and subject to availability.
                    </p>
                    <p>
                      <strong>3. Identification Requirement:</strong> Guests
                      must present a valid passport, visa, and this voucher upon
                      arrival.
                    </p>
                    <p>
                      <strong>4. Hotel Policy:</strong> Each hotel has specific
                      check-in/check-out timings. Alcohol/swimming is prohibited
                      on demand in the booking.
                    </p>
                    <p>
                      <strong>5. No Show & Late Arrival:</strong> Failure to
                      check-in on the specified date without prior notice may
                      result in cancellation without a refund.
                    </p>
                    <p>
                      <strong>6. Amendments & Cancellation:</strong> Any changes
                      or cancellations must be made through the travel agency
                      and are subject to the agency and hotel's terms and
                      conditions.
                    </p>
                  </div>
                </div>

                {/* Footer QR Code */}
                <div className="text-center">
                  <div>
                    <img
                      src={code}
                      alt=""
                      style={{
                        width: "150px",
                        height: "150px",
                      }}
                    />
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
