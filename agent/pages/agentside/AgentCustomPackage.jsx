import { useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Link, NavLink } from "react-router-dom";
import { Search } from "lucide-react";

const AgentCustomPackage = () => {
  const tabs = [
    { name: "Umrah Package", path: "/agent/packages" },
    { name: "Umrah Calculater", path: "/agent/packages/umrah-calculater" },
    { name: "Custom Umrah", path: "/agent/packages/custom-umrah" },
  ];

  const [formData, setFormData] = useState({
    totalAdults: 2,
    totalChilds: 0,
    totalInfants: 0,
    addVisaPrice: false,
    longTermVisa: false,
    withOneSideTransport: false,
    withFullTransport: false,
    onlyVisa: false,

    // Hotel Details
    hotelName: "Rushd al Majd",
    roomType: "shared or quad",
    sharingType: "Gender or Family",
    checkIn: "2023-10-16",
    checkOut: "2023-10-18",
    noOfNights: 2,
    specialRequest: "Haraam View",

    // Transport Details
    transportType: "Company Shared Bus",
    transportSector: "Jed(Ar-Jax(H)-Jax(H)-Jed(Ar-Jed(A)",
    self: false,

    // Flight Details - Departure
    departureAirline: "Saudi(sv)",
    departureFlightNumber: "Saudi(sv)",
    departureFrom: "Lhe",
    departureTo: "Jed",
    departureTravelDate: "2024-08-12",
    departureTravelTime: "12:30",
    departureReturnDate: "2024-07-02",
    departureReturnTime: "14:30",

    // Flight Details - Return
    returnAirline: "Saudi(sv)",
    returnFlightNumber: "Saudi(sv)",
    returnFrom: "Jed",
    returnTo: "Lhe",
    returnTravelDate: "2024-07-12",
    returnTravelTime: "12:30",
    returnReturnDate: "2024-07-02",
    returnReturnTime: "14:30",
    flightCost: "30,000",

    // Other Cost
    margin: "30,000",
  });

  const [costs, setCosts] = useState({
    queryNumber: "12223",
    visaCost: "18,000",
    hotelCost: "18,000",
    transportCost: "18,000",
    flightCost: "18,000",
    totalCost: "72,000",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxChange = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  const calculateCosts = () => {
    // In a real app, this would perform calculations
    alert("Cost calculation would happen here");
    setCosts({
      ...costs,
      totalCost: "275000", // Simulated updated cost
    });
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
              {/* Navigation Tabs */}
              <div className="row ">
            <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
              {/* Navigation Tabs */}
              <nav className="nav flex-wrap gap-2">
                {tabs.map((tab, index) => (
                  <NavLink
                    key={index}
                    to={tab.path}
                    className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${
                      tab.name === "Custom Umrah"
                        ? "text-primary fw-semibold"
                        : "text-muted"
                    }`}
                    style={{ backgroundColor: "transparent" }}
                  >
                    {tab.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
          <div className="min-vh-100 bg-white rounded-5 p-3">
            <div className="card border-0 p-2">
              <h4 className="mb-0 text-dark">Umrah Package Calculator</h4>
              <div className="card-body">
                {/* Top Section - Counts */}
                <div className="row mb-4">
                  <div className="col-md-3 mb-3">
                    <fieldset className="border border-black p-2 rounded mb-3">
                      <legend className="float-none w-auto px-1 fs-6">
                        Total Adults
                      </legend>
                      <input
                        type="number"
                        className="form-control border-0 shadow-none"
                        value={formData.totalAdults}
                        onChange={(e) =>
                          handleInputChange("totalAdults", e.target.value)
                        }
                      />
                    </fieldset>
                  </div>
                  <div className="col-md-3 mb-3">
                    <fieldset className="border border-black p-2 rounded mb-3">
                      <legend className="float-none w-auto px-1 fs-6">
                        Total Childs
                      </legend>
                      <input
                        type="number"
                        className="form-control border-0 shadow-none"
                        value={formData.totalChilds}
                        onChange={(e) =>
                          handleInputChange("totalChilds", e.target.value)
                        }
                      />
                    </fieldset>
                  </div>
                  <div className="col-md-3 mb-3">
                    <fieldset className="border border-black p-2 rounded mb-3">
                      <legend className="float-none w-auto px-1 fs-6">
                        Total Infants
                      </legend>
                      <input
                        type="number"
                        className="form-control border-0 shadow-none"
                        value={formData.totalInfants}
                        onChange={(e) =>
                          handleInputChange("totalInfants", e.target.value)
                        }
                      />
                    </fieldset>
                  </div>
                </div>

                {/* Options Section */}

                <div className="row">
                  <div className="col-md-2">
                    <div className="form-check d-flex align-items-center gap-2">
                      <input
                        className="form-check-input border border-black"
                        type="checkbox"
                        id="addVisaPrice"
                        checked={formData.addVisaPrice}
                        onChange={() => handleCheckboxChange("addVisaPrice")}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="addVisaPrice"
                      >
                        Add visa price
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-check d-flex align-items-center gap-2">
                      <input
                        className="form-check-input border border-black"
                        type="checkbox"
                        id="longTermVisa"
                        checked={formData.longTermVisa}
                        onChange={() => handleCheckboxChange("longTermVisa")}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="longTermVisa"
                      >
                        Long term visa
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-check d-flex align-items-center gap-2">
                      <input
                        className="form-check-input border border-black"
                        type="checkbox"
                        id="withOneSideTransport"
                        checked={formData.withOneSideTransport}
                        onChange={() =>
                          handleCheckboxChange("withOneSideTransport")
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor="withOneSideTransport"
                      >
                        With one side transport
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2 mb-2">
                    <div className="form-check d-flex  align-items-center gap-2">
                      <input
                        className="form-check-input border border-black"
                        type="checkbox"
                        checked={formData.withFullTransport}
                        onChange={() =>
                          handleCheckboxChange("withFullTransport")
                        }
                      />
                      <label htmlFor="With full transport">
                        With full transport
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2 mb-2">
                    <div className="form-check d-flex  align-items-center gap-2">
                      <input
                        className="form-check-input border border-black"
                        type="checkbox"
                        checked={formData.onlyVisa}
                        onChange={() => handleCheckboxChange("onlyVisa")}
                      />
                      <label htmlFor="Only Visa">Only Visa</label>
                    </div>
                  </div>
                </div>

                {/* Hotel Details */}
                <div className="mb-4">
                  <h5 className="mb-3">Hotel Details 1</h5>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Hotel Name
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>Rushd al Majd</option>
                          <option>Al Haram Hotel</option>
                          <option>Makarem Ajyad</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Room Type
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>shared or quad</option>
                          <option>Single</option>
                          <option>Double</option>
                          <option>Triple</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Sharing Type
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>Gender or Family</option>
                          <option>Male Only</option>
                          <option>Female Only</option>
                          <option>Family Only</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Check In
                        </legend>
                        <input
                          type="date"
                          className="form-control border-0 shadow-none"
                          value={formData.checkIn}
                          onChange={(e) =>
                            handleInputChange("checkIn", e.target.value)
                          }
                        />
                      </fieldset>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Check Out
                        </legend>
                        <input
                          type="date"
                          className="form-control border-0 shadow-none"
                          value={formData.checkOut}
                          onChange={(e) =>
                            handleInputChange("checkOut", e.target.value)
                          }
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          No. of nights
                        </legend>
                        <input
                          type="number"
                          className="form-control border-0 shadow-none"
                          value={formData.noOfNights}
                          onChange={(e) =>
                            handleInputChange("noOfNights", e.target.value)
                          }
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Special request
                        </legend>
                        <input
                          type="text"
                          className="form-control border-0 shadow-none"
                          value={formData.specialRequest}
                          onChange={(e) =>
                            handleInputChange("specialRequest", e.target.value)
                          }
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3 d-flex align-items-end">
                      <button className="btn btn-primary btn-sm w-100">
                        Add Hotel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transport Details */}
                <div className="mb-4">
                  <h5 className="mb-3">Transport Details</h5>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Transport Type
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>Company Shared Bus</option>
                          <option>Private Car</option>
                          <option>Minivan</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-4 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Transport Sector
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>Jed(Ar)-Jax(H)-Jax(H)-Jed(Ar)-Jed(A)</option>
                          <option>Makkah - Madinah</option>
                          <option>Airport - Hotel</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-2 d-flex align-items-center mb-3">
                      <button className="btn btn-primary px-3 py-2">
                        Add Route
                      </button>
                    </div>
                    <div className="form-check col-md-2 d-flex align-items-center">
                      <input
                        className="form-check-input border border-black me-2"
                        type="checkbox"
                        id="self"
                        checked={formData.self}
                        onChange={() => handleCheckboxChange("self")}
                        style={{ width: "1.3rem", height: "1.3rem" }}
                      />
                      <label className="form-check-label" htmlFor="self">
                        Self
                      </label>
                    </div>
                  </div>
                </div>

                {/* Flight Details - Departure */}
                <div className="mb-4">
                  <h5 className="mb-3">Flight Details (Departure Flight)</h5>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Airline Name or Code
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>Saudi(sv)</option>
                          <option>Emirates(EK)</option>
                          <option>Qatar Airways(QR)</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Flight Number
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>SV-726</option>
                          <option>EK-203</option>
                          <option>QR-145</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          From Sector
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>Lhe</option>
                          <option>ISB</option>
                          <option>KHI</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          To Sector
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>Jed</option>
                          <option>MED</option>
                          <option>RUH</option>
                        </select>
                      </fieldset>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Travel Date And Time
                        </legend>
                        <input
                          type="datetime-local"
                          className="form-control border-0 shadow-none"
                          value="2024-08-12T12:30"
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Return Date And Time
                        </legend>
                        <input
                          type="datetime-local"
                          className="form-control border-0 shadow-none"
                          value="2024-07-02T14:30"
                        />
                      </fieldset>
                    </div>
                  </div>
                </div>

                {/* Flight Details - Return */}
                <div className="mb-4">
                  <h5 className="mb-3">Flight Details (Return Flight)</h5>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Airline Name or Code
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>Saudi(sv)</option>
                          <option>Emirates(EK)</option>
                          <option>Qatar Airways(QR)</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Flight Number
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>SV-725</option>
                          <option>EK-204</option>
                          <option>QR-146</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          From Sector
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>Jed</option>
                          <option>MED</option>
                          <option>RUH</option>
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          To Sector
                        </legend>
                        <select className="form-select border-0 shadow-none">
                          <option>Lhe</option>
                          <option>ISB</option>
                          <option>KHI</option>
                        </select>
                      </fieldset>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Travel Date And Time
                        </legend>
                        <input
                          type="datetime-local"
                          className="form-control border-0 shadow-none"
                          value="2024-07-12T12:30"
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Return Date And Time
                        </legend>
                        <input
                          type="datetime-local"
                          className="form-control border-0 shadow-none"
                          value="2024-07-02T14:30"
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3">
                      <fieldset className="border border-black p-2 rounded mb-3">
                        <legend className="float-none w-auto px-1 fs-6">
                          Flight Cost
                        </legend>
                        <div className="input-group">
                          <span className="input-group-text border-0">Rs.</span>
                          <input
                            type="text"
                            className="form-control border-0 shadow-none"
                            value={formData.flightCost}
                            onChange={(e) =>
                              handleInputChange("flightCost", e.target.value)
                            }
                          />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-md-3 mb-3 d-flex align-items-end">
                      <div className="d-flex mt-3 flex-wrap align-items-center gap-3 mb-3">
                        {/* Option 1: OR text */}
                        <p className="mb-0">or</p>

                        {/* Option 2: Button */}
                        <button className="btn btn-primary px-3 py-2">
                          Select Flight
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculate Button */}
                <div className="text-end mb-4">
                  <Link
                    to="/agent/packages/custom-umrah/detail"
                    className="btn btn-primary"
                  >
                    Continue
                  </Link>
                </div>

                {/* Results Table */}
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead className="table-light">
                      <tr>
                        <th className="small">Query Number</th>
                        <th className="small">Visa Cost</th>
                        <th className="small">Hotel Cost</th>
                        <th className="small">Transport Cost</th>
                        <th className="small">Flight Cost</th>
                        <th className="small text-primary">Total Cost</th>
                        <th></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="small">{costs.queryNumber}</td>
                        <td className="small">Rs.{costs.visaCost}/</td>
                        <td className="small">Rs.{costs.hotelCost}/</td>
                        <td className="small">Rs.{costs.transportCost}/</td>
                        <td className="small">Rs.{costs.flightCost}/</td>
                        <td className="small text-primary fw-bold">
                          Rs.{costs.totalCost}/
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm">
                            Export
                          </button>
                        </td>
                        <td>
                          <button className="btn btn-success btn-sm">
                            Buy Now
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
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

export default AgentCustomPackage;
