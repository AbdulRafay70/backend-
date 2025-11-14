import React, { useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import logo from "../../assets/flightlogo.png";
import { Bag } from "react-bootstrap-icons";
import { Search, Utensils } from "lucide-react";
const BookingPay = () => {
  const [selectedPayment, setSelectedPayment] = useState("bank-transfer");

  const handlePaymentSelect = (method) => {
    setSelectedPayment(method);
  };

  const [formData, setFormData] = useState({
    beneficiaryAccount: '0ufgkJHG',
    agentAccount: '1Bill',
    amount: 'Rs.120,222/',
    date: '2023-12-01',
    note: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSlipSelect = () => {
    // console.log('SLIP SELECT clicked');
    // Add your slip select logic here
  };

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
            {/* Step Progress */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex align-items-center flex-wrap">
                  {/* Step 1 */}
                  <div className="d-flex align-items-center me-4">
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "30px",
                        height: "30px",
                        fontSize: "14px",
                      }}
                    >
                      1
                    </div>
                    <span className="ms-2 text-primary fw-bold">
                      Booking Detail
                    </span>
                  </div>

                  {/* Line 1 (active) */}
                  <div
                    className="flex-grow-1"
                    style={{ height: "2px", backgroundColor: "#0d6efd" }}
                  ></div>

                  {/* Step 2 (now marked complete) */}
                  <div className="d-flex align-items-center mx-4">
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "30px",
                        height: "30px",
                        fontSize: "14px",
                      }}
                    >
                      2
                    </div>
                    <span className="ms-2 text-primary fw-bold">
                      Booking Review
                    </span>
                  </div>

                  {/* Line 2 (active) */}
                  <div
                    className="flex-grow-1"
                    style={{ height: "2px", backgroundColor: "#0d6efd" }}
                  ></div>

                  {/* Step 3 (still upcoming) */}
                  <div className="d-flex align-items-center">
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "30px",
                        height: "30px",
                        fontSize: "14px",
                      }}
                    >
                      3
                    </div>
                    <span className="ms-2 text-primary fw-bold">Payment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Section */}
            <h5 className="mb-3 fw-bold">Flight Details</h5>
            <div className="card mb-4">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-2 text-center">
                    <img
                      src={logo}
                      alt="Saudia"
                      className="mb-2"
                      width={"140px"}
                    />
                    <div className="d-flex flex-wrap gap-3">
                      <small className="text-primary d-flex align-items-center">
                        Refundable
                      </small>

                      <div className="d-flex align-items-center text-muted">
                        <Bag className="me-1" size={16} />
                        <small>Total: 30 kg psc: 2</small>
                      </div>

                      <div className="d-flex align-items-center text-muted">
                        <Utensils className="me-1" size={16} />
                        <small>Meal</small>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-center">
                        <h4 className="fw-bold mb-0">LHR</h4>
                        <small className="text-muted">12 Sep 2025</small>
                        <div className="text-muted">9:15 AM</div>
                      </div>

                      <div className="flex-grow-1 text-center">
                        <small className="text-muted">NON STOP</small>
                        <div
                          style={{
                            height: "2px",
                            backgroundColor: "#dee2e6",
                            margin: "5px 20px",
                          }}
                        ></div>
                      </div>

                      <div className="text-center">
                        <h4 className="fw-bold mb-0">JED</h4>
                        <small className="text-muted">12 Sep 2025</small>
                        <div className="text-muted">8:15 PM</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-2 text-end">
                    <h5 className="fw-bold mb-0">Pk. 120,00</h5>
                    <small className="text-danger">3 Seats Left</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {/* Total Price Section */}
              <h5 className="mb-3 fw-bold">Total Price</h5>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-primary">
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Passport No</th>
                      <th>Fare</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: "#F3FAFF" }}>
                      <td>Adult</td>
                      <td>Mr</td>
                      <td>Zain</td>
                      <td>Abdullah</td>
                      <td>FY123JV</td>
                      <td>120,000</td>
                    </tr>
                    <tr style={{ background: "#F3FAFF" }}>
                      <td>Adult</td>
                      <td>Mr</td>
                      <td>Samaad</td>
                      <td>Abdullah</td>
                      <td>FY123JV</td>
                      <td>120,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Payment Section */}
              <div className="card mt-5 mb-4 p-3">
                <h5 className="mb-0 fw-bold">Total Payment</h5>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6">
                      <div className=" fw-bold">Flight Ticket</div>
                      <div>120,000/- x 2 Pax</div>
                    </div>
                    <div className="col-6">
                      <div className=" fw-bold">Total Amount</div>
                      <div className="">Rs.240,000/-</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <h5 className="mb-0 mt-5 fw-bold">Select Payment Method</h5>
              <h5 className="mb-0 mt-5 fw-bold">Select Payment Method</h5>
              <div className="card border-0">
                <div className="card-body">
                  <div className="row g-3">
                    {/* Payment Options in One Row */}
                    <div className="col-md-4">
                      <div
                        className={`card h-100 ${selectedPayment === "bank-transfer"
                            ? "border-primary bg-primary text-white"
                            : "border-secondary"
                          }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handlePaymentSelect("bank-transfer")}
                      >
                        <div className="card-body text-center position-relative">
                          <div className="mb-2">
                            <i className="bi bi-bank2 fs-2"></i>
                            {selectedPayment === "bank-transfer" && (
                              <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-2">
                                <i className="bi bi-exclamation-triangle"></i>
                              </span>
                            )}
                          </div>
                          <h6 className="card-title">Bank Transfer</h6>
                          <small>1 Bill - Bank Transfer</small>
                          <br />
                          <small>Save PKR 3,214 on Fees</small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div
                        className={`card h-100 ${selectedPayment === "bill-payment"
                            ? "border-primary bg-primary text-white"
                            : "border-secondary"
                          }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handlePaymentSelect("bill-payment")}
                      >
                        <div className="card-body text-center">
                          <div className="mb-2">
                            <i className="bi bi-receipt fs-2"></i>
                          </div>
                          <h6 className="card-title">Bill Payment</h6>
                          <small>1 Bill - Bank Transfer</small>
                          <br />
                          <small>Save PKR 3,214 on Fees</small>
                          <br />
                          <small className="text-muted">
                            Agreement Process
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div
                        className={`card h-100 ${selectedPayment === "card"
                            ? "border-primary bg-primary text-white"
                            : "border-secondary"
                          }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handlePaymentSelect("card")}
                      >
                        <div className="card-body text-center">
                          <div className="mb-2">
                            <i className="bi bi-credit-card fs-2"></i>
                          </div>
                          <h6 className="card-title">Credit or Debit Card</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                {/* Beneficiary Account */}
                <div className="col-lg-3 col-md-6">
                  <label className="form-label text-muted small mb-1">
                    Beneficiary Account
                  </label>
                  <select
                    className="form-select"
                    name="beneficiaryAccount"
                    value={formData.beneficiaryAccount}
                    onChange={handleInputChange}
                  >
                    <option value="0ufgkJHG">0ufgkJHG</option>
                    <option value="account2">Account 2</option>
                    <option value="account3">Account 3</option>
                  </select>
                </div>

                {/* Agent Account */}
                <div className="col-lg-3 col-md-6">
                  <label className="form-label text-muted small mb-1">
                    Agent Account
                  </label>
                  <select
                    className="form-select"
                    name="agentAccount"
                    value={formData.agentAccount}
                    onChange={handleInputChange}
                  >
                    <option value="1Bill">1Bill</option>
                    <option value="2Bill">2Bill</option>
                    <option value="3Bill">3Bill</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="col-lg-3 col-md-6">
                  <label className="form-label text-muted small mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Type Rs.120,222/."
                  />
                </div>

                {/* Date */}
                <div className="col-lg-3 col-md-6">
                  <label className="form-label text-muted small mb-1">
                    Date
                  </label>
                  <div className="input-group">
                    <input
                      type="date"
                      className="form-control"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                    <span className="input-group-text">
                      <i className="bi bi-calendar3"></i>
                    </span>
                  </div>
                </div>
              </div>

              <div className="row mt-3 mb-4">
                {/* Note */}
                <div className="col-lg-4 col-md-4">
                  <label className="form-label text-muted small mb-1">
                    Note
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="Type Note"
                  />
                </div>

                {/* SLIP SELECT Button */}
                <div className="col-lg-2 col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2 fw-semibold"
                    onClick={handleSlipSelect}
                    style={{ backgroundColor: '#007bff', border: 'none' }}
                  >
                    SLIP SELECT
                  </button>
                </div>
              </div>

              <div className="mt-2 d-flex justify-content-start gap-2">
                <button className="btn" id="btn">
                  Hold Booking
                </button>
                <button className="btn" id="btn">
                  Confirm Order
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPay;
