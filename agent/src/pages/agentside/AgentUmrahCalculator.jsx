import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Link, NavLink } from "react-router-dom";
import { Download, Import, Search } from "lucide-react";
import axios from "axios";
import { Button, Dropdown, Modal } from "react-bootstrap";
import { Gear, Printer } from "react-bootstrap-icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const FlightModal = ({
  show,
  onClose,
  flights,
  onSelect,
  airlinesMap,
  citiesMap,
}) => {
  // Filter flights to show only round trips with Umrah seats
  const filteredFlights = flights.filter(flight => {
    const hasReturnTrip = flight.trip_details?.some(
      t => t.trip_type.toLowerCase() === "return"
    );
    return flight.is_umrah_seat && hasReturnTrip;
  });

  return (
    <div
      className={`modal ${show ? "d-block" : "d-none"}`}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Select Umrah Flight (Round Trip)</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Airline</th>
                  <th>PNR</th>
                  <th>Trip Type</th>
                  <th>Departure</th>
                  <th>Return</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Adult Price</th>
                  <th>Child Price</th>
                  <th>Infant Price</th>
                  <th>Seats</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlights.map((flight) => {
                  const departureTrip = flight.trip_details?.find(
                    (t) => t.trip_type.toLowerCase() === "departure"
                  );
                  const returnTrip = flight.trip_details?.find(
                    (t) => t.trip_type.toLowerCase() === "return"
                  );

                  return (
                    <tr key={flight.id}>
                      <td>{airlinesMap[flight.airline]?.name || "N/A"}</td>
                      <td>{flight.pnr || "N/A"}</td>
                      <td>
                        Round Trip (Umrah)
                      </td>
                      <td>
                        {departureTrip?.departure_date_time
                          ? new Date(
                            departureTrip.departure_date_time
                          ).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "N/A"}
                      </td>
                      <td>
                        {returnTrip?.arrival_date_time
                          ? new Date(
                            returnTrip.arrival_date_time
                          ).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "N/A"}
                      </td>
                      <td>
                        {departureTrip?.departure_city
                          ? citiesMap[departureTrip.departure_city]?.code ||
                          "N/A"
                          : "N/A"}
                      </td>
                      <td>
                        {departureTrip?.arrival_city
                          ? citiesMap[departureTrip.arrival_city]?.code || "N/A"
                          : "N/A"}
                      </td>
                      <td className="text-success fw-bold">
                        Rs. {flight.adult_price?.toLocaleString() || "0"}
                      </td>
                      <td className="text-success fw-bold">
                        Rs. {flight.child_price?.toLocaleString() || "0"}
                      </td>
                      <td className="text-success fw-bold">
                        Rs. {flight.infant_price?.toLocaleString() || "0"}
                      </td>
                      <td>{flight.seats || "N/A"}</td>
                      <td>
                        <button
                          className="btn btn-sm"
                          id="btn"
                          onClick={() => onSelect(flight)}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomTicketModal = ({ show, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    airline: "",
    meal: "Yes",
    ticketType: "Refundable",
    pnr: "",
    price: "",
    totalSeats: "",
    weight: "",
    piece: "",
    umrahSeat: "Yes",
    tripType: "One-way",
    flightType: "Non-Stop",
    returnFlightType: "Non-Stop",
    departureDateTime: "",
    arrivalDateTime: "",
    departure: "",
    arrival: "",
    returnDepartureDateTime: "",
    returnArrivalDateTime: "",
    returnDeparture: "",
    returnArrival: "",
    stopLocation1: "",
    stopTime1: "",
    stopLocation2: "",
    stopTime2: "",
    returnStopLocation1: "",
    returnStopTime1: "",
    returnStopLocation2: "",
    returnStopTime2: "",
    childPrice: "",
    infantPrice: "",
    adultPrice: "",
    status: "umrah package custom ticket",
  });

  const [airlines, setAirlines] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState({ airlines: true, cities: true });
  const [error, setError] = useState({ airlines: null, cities: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("agentAccessToken");

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;

    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0]; // Get the first organization ID
  };

  const orgId = getOrgId();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Airlines
        const airlinesResponse = await axios.get(
          "http://127.0.0.1:8000/api/airlines/",
          {
            params: { organization: orgId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAirlines(airlinesResponse.data);

        // Fetch Cities
        const citiesResponse = await axios.get(
          "http://127.0.0.1:8000/api/cities/",
          {
            params: { organization: orgId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCities(citiesResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError({
          airlines: err.message.includes("airlines") ? err.message : null,
          cities: err.message.includes("cities") ? err.message : null,
        });
      } finally {
        setLoading({ airlines: false, cities: false });
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare payload
      const payload = {
        is_meal_included: formData.meal === "Yes",
        is_refundable: formData.ticketType === "Refundable",
        pnr: formData.pnr || "N/A",
        adult_price:
          parseFloat(formData.adultPrice.replace(/[^0-9.]/g, "")) || 0,
        child_price:
          parseFloat(formData.childPrice.replace(/[^0-9.]/g, "")) || 0,
        infant_price:
          parseFloat(formData.infantPrice.replace(/[^0-9.]/g, "")) || 0,
        seats: parseInt(formData.totalSeats) || 0,
        weight: parseFloat(formData.weight) || 0,
        pieces: parseInt(formData.piece) || 0,
        is_umrah_seat: formData.umrahSeat === "Yes",
        trip_type: formData.tripType,
        departure_stay_type: formData.flightType,
        return_stay_type:
          formData.tripType === "Round-trip"
            ? formData.returnFlightType
            : "Non-Stop",
        organization: organizationId,
        airline: parseInt(formData.airline),
        trip_details: [],
        stopover_details: [],
      };

      // Add departure trip details
      payload.trip_details.push({
        departure_date_time: new Date(formData.departureDateTime).toISOString(),
        arrival_date_time: new Date(formData.arrivalDateTime).toISOString(),
        trip_type: "Departure",
        departure_city: parseInt(formData.departure),
        arrival_city: parseInt(formData.arrival),
      });

      // Add return trip details if round-trip
      if (formData.tripType === "Round-trip") {
        payload.trip_details.push({
          departure_date_time: new Date(
            formData.returnDepartureDateTime
          ).toISOString(),
          arrival_date_time: new Date(
            formData.returnArrivalDateTime
          ).toISOString(),
          trip_type: "Return",
          departure_city: parseInt(formData.returnDeparture),
          arrival_city: parseInt(formData.returnArrival),
        });
      }

      // Add stopover details if needed
      if (formData.flightType === "1-Stop" && formData.stopLocation1) {
        payload.stopover_details.push({
          stopover_duration: formData.stopTime1,
          trip_type: "Departure",
          stopover_city: parseInt(formData.stopLocation1),
        });
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/api/tickets/",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Call onSubmit with the created ticket data
      onSubmit(response.data);
      onClose();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Prepare payload
      const payload = {
        is_meal_included: formData.meal === "Yes",
        is_refundable: formData.ticketType === "Refundable",
        pnr: formData.pnr || "N/A",
        adult_price:
          parseFloat(formData.adultPrice.replace(/[^0-9.]/g, "")) || 0,
        child_price:
          parseFloat(formData.childPrice.replace(/[^0-9.]/g, "")) || 0,
        infant_price:
          parseFloat(formData.infantPrice.replace(/[^0-9.]/g, "")) || 0,
        seats: parseInt(formData.totalSeats) || 0,
        weight: parseFloat(formData.weight) || 0,
        pieces: parseInt(formData.piece) || 0,
        is_umrah_seat: formData.umrahSeat === "Yes",
        trip_type: formData.tripType,
        departure_stay_type: formData.flightType,
        return_stay_type:
          formData.tripType === "Round-trip"
            ? formData.returnFlightType
            : "Non-Stop",
        organization: orgId,
        airline: parseInt(formData.airline),
        trip_details: [],
        stopover_details: [],
      };

      // Add departure trip details
      payload.trip_details.push({
        departure_date_time: new Date(formData.departureDateTime).toISOString(),
        arrival_date_time: new Date(formData.arrivalDateTime).toISOString(),
        trip_type: "Departure",
        departure_city: parseInt(formData.departure),
        arrival_city: parseInt(formData.arrival),
      });

      // Add return trip details if round-trip
      if (formData.tripType === "Round-trip") {
        payload.trip_details.push({
          departure_date_time: new Date(
            formData.returnDepartureDateTime
          ).toISOString(),
          arrival_date_time: new Date(
            formData.returnArrivalDateTime
          ).toISOString(),
          trip_type: "Return",
          departure_city: parseInt(formData.returnDeparture),
          arrival_city: parseInt(formData.returnArrival),
        });
      }

      // Add stopover details if needed
      if (formData.flightType === "1-Stop" && formData.stopLocation1) {
        payload.stopover_details.push({
          stopover_duration: formData.stopTime1,
          trip_type: "Departure",
          stopover_city: parseInt(formData.stopLocation1),
        });
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/api/tickets/",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      onSubmit(response.data);
      onClose();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/ticket-booking");
  };

  // Shimmer loading component
  const ShimmerLoader = () => (
    <div
      className="shimmer-loader"
      style={{
        height: "38px",
        background:
          "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        borderRadius: "4px",
        animation: "shimmer 1.5s infinite",
      }}
    ></div>
  );

  // Helper to render city dropdown options
  const renderCityOptions = (field, currentValue) => {
    if (loading.cities) return <ShimmerLoader />;
    if (error.cities)
      return <div className="text-danger small">{error.cities}</div>;

    return (
      <select
        className="form-select  shadow-none"
        value={currentValue}
        onChange={(e) => handleInputChange(field, e.target.value)}
      >
        <option value="">Select a city</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.code} ({city.name})
          </option>
        ))}
      </select>
    );
  };

  return (
    <div
      className={`modal ${show ? "d-block" : "d-none"}`}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title text-center fw-bold">Create Custom Ticket</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {/* Ticket Details Section */}
            <div className="mb-4">
              <h5 className="card-title mb-3 fw-bold">Ticket (Details)</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <label htmlFor="">
                    Select Airline
                  </label>
                  {loading.airlines ? (
                    <ShimmerLoader />
                  ) : error.airlines ? (
                    <div className="text-danger small">{error.airlines}</div>
                  ) : (
                    <select
                      className="form-select shadow-none"
                      value={formData.airline}
                      onChange={(e) =>
                        handleInputChange("airline", e.target.value)
                      }
                    >
                      <option value="">Select an airline</option>
                      {airlines.map((airline) => (
                        <option key={airline.id} value={airline.id}>
                          {airline.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="col-md-2">
                  <label htmlFor="">
                    Meal
                  </label>
                  <select
                    className="form-select shadow-none"
                    value={formData.meal}
                    onChange={(e) =>
                      handleInputChange("meal", e.target.value)
                    }
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label htmlFor="">
                    Type
                  </label>
                  <select
                    className="form-select shadow-none"
                    value={formData.ticketType}
                    onChange={(e) =>
                      handleInputChange("ticketType", e.target.value)
                    }
                  >
                    <option value="Refundable">Refundable</option>
                    <option value="Non-Refundable">Non-Refundable</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label htmlFor="">
                    PNR
                  </label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none px-1 py-2"
                    required
                    placeholder="PND32323"
                    value={formData.pnr}
                    onChange={(e) => handleInputChange("pnr", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="row g-3 mt-2">
              <div className="col-md-2">
                <label htmlFor="">
                  Total Seats
                </label>
                <input
                  type="text"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  placeholder="30"
                  value={formData.totalSeats}
                  onChange={(e) =>
                    handleInputChange("totalSeats", e.target.value)
                  }
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="">
                  Weight
                </label>
                <input
                  type="text"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  placeholder="30 KG"
                  value={formData.weight}
                  onChange={(e) =>
                    handleInputChange("weight", e.target.value)
                  }
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="">
                  Piece
                </label>
                <input
                  type="text"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  placeholder="2"
                  value={formData.piece}
                  onChange={(e) => handleInputChange("piece", e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="">
                  Umrah Seat
                </label>
                <select
                  className="form-select shadow-none"
                  value={formData.umrahSeat}
                  onChange={(e) =>
                    handleInputChange("umrahSeat", e.target.value)
                  }
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="">
                  Adult Price
                </label>
                <input
                  type="text"
                  className="form-control rounded shadow-none px-1 py-2"
                  placeholder="Rs- 120,000/."
                  value={formData.adultPrice}
                  onChange={(e) =>
                    handleInputChange("adultPrice", e.target.value)
                  }
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="">
                  Child Price
                </label>
                <input
                  type="text"
                  className="form-control rounded shadow-none px-1 py-2"
                  placeholder="Rs- 100,000/."
                  value={formData.childPrice}
                  onChange={(e) =>
                    handleInputChange("childPrice", e.target.value)
                  }
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="">
                  Infant Price
                </label>
                <input
                  type="text"
                  className="form-control rounded shadow-none px-1 py-2"
                  placeholder="Rs- 80,000/."
                  value={formData.infantPrice}
                  onChange={(e) =>
                    handleInputChange("infantPrice", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Trip Details Section */}
          <div className="mb-4 p-3">
            <h5 className="card-title mb-3 fw-bold">Trip (Details)</h5>
            <div className="row g-3">
              <div className="col-md-3">
                <label htmlFor="">
                  Trip Type
                </label>
                <select
                  className="form-select shadow-none"
                  value={formData.tripType}
                  onChange={(e) =>
                    handleInputChange("tripType", e.target.value)
                  }
                >
                  <option value="One-way">One-way</option>
                  <option value="Round-trip">Round-trip</option>
                </select>
              </div>
            </div>

            {/* Departure and Arrival Fields */}
            <div className="row g-3 mt-2">
              <div className="col-md-3">
                <label htmlFor="">
                  Departure Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  value={formData.departureDateTime}
                  onChange={(e) =>
                    handleInputChange("departureDateTime", e.target.value)
                  }
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="">
                  Arrival Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="form-control rounded shadow-none px-1 py-2"
                  required
                  value={formData.arrivalDateTime}
                  onChange={(e) =>
                    handleInputChange("arrivalDateTime", e.target.value)
                  }
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="">
                  Departure City
                </label>
                {renderCityOptions("departure", formData.departure)}
              </div>
              <div className="col-md-3">
                <label htmlFor="">
                  Arrival City
                </label>
                {renderCityOptions("arrival", formData.arrival)}
              </div>
            </div>

            {/* Round Trip Additional Fields */}
            {formData.tripType === "Round-trip" && (
              <div className="row g-3 mt-2">
                <div className="col-md-3">
                  <label htmlFor="">
                    Return Departure Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control rounded shadow-none px-1 py-2"
                    required
                    value={formData.returnDepartureDateTime}
                    onChange={(e) =>
                      handleInputChange(
                        "returnDepartureDateTime",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="">
                    Return Arrival Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control rounded shadow-none px-1 py-2"
                    required
                    value={formData.returnArrivalDateTime}
                    onChange={(e) =>
                      handleInputChange(
                        "returnArrivalDateTime",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="">
                    Return Departure City
                  </label>
                  {renderCityOptions(
                    "returnDeparture",
                    formData.returnDeparture
                  )}
                </div>
                <div className="col-md-3">
                  <label htmlFor="">
                    Return Arrival City
                  </label>
                  {renderCityOptions("returnArrival", formData.returnArrival)}
                </div>
              </div>
            )}
          </div>

          {/* Stay Details Section */}
          <div className="mb-4 p-3">
            <h5 className="card-title mb-3 fw-bold">Stay (Details)</h5>
            <div className="row g-3">
              <div className="col-md-3">
                <label htmlFor="">
                  Flight Type (Departure)
                </label>
                <select
                  className="form-select shadow-none"
                  value={formData.flightType}
                  onChange={(e) =>
                    handleInputChange("flightType", e.target.value)
                  }
                >
                  <option value="Non-Stop">Non-Stop</option>
                  <option value="1-Stop">1-Stop</option>
                </select>
              </div>

              {formData.tripType === "Round-trip" && (
                <div className="col-md-3">
                  <label htmlFor="">
                    Flight Type (Return)
                  </label>
                  <select
                    className="form-select shadow-none"
                    value={formData.returnFlightType}
                    onChange={(e) =>
                      handleInputChange("returnFlightType", e.target.value)
                    }
                  >
                    <option value="Non-Stop">Non-Stop</option>
                    <option value="1-Stop">1-Stop</option>
                  </select>
                </div>
              )}
            </div>

            {/* 1-Stop Fields for Departure */}
            {formData.flightType === "1-Stop" && (
              <div className="row g-3 mt-2">
                <div className="col-12">
                  <h6 className="text-muted">Departure Stop</h6>
                </div>
                <div className="col-md-3">
                  <label htmlFor="">
                    1st Stop At
                  </label>
                  {renderCityOptions("stopLocation1", formData.stopLocation1)}
                </div>
                <div className="col-md-3">
                  <label htmlFor="">
                    Wait Time
                  </label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none px-1 py-2"
                    value={formData.stopTime1}
                    onChange={(e) =>
                      handleInputChange("stopTime1", e.target.value)
                    }
                    placeholder="30 Minutes"
                  />
                </div>
              </div>
            )}

            {/* 1-Stop Fields for Return Trip */}
            {formData.tripType === "Round-trip" &&
              formData.returnFlightType === "1-Stop" && (
                <div className="row g-3 mt-2">
                  <div className="col-12">
                    <h6 className="text-muted">Return Stop</h6>
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="">
                      1st Stop At
                    </label>
                    {renderCityOptions(
                      "returnStopLocation1",
                      formData.returnStopLocation1
                    )}
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="">
                      Wait Time
                    </label>
                    <input
                      type="text"
                      className="form-control rounded shadow-none px-1 py-2"
                      value={formData.returnStopTime1}
                      onChange={(e) =>
                        handleInputChange("returnStopTime1", e.target.value)
                      }
                      placeholder="30 Minutes"
                    />
                  </div>
                </div>
              )}
          </div>

          {/* Action Buttons */}
          <div className="row">
            <div className="col-12 d-flex flex-wrap justify-content-end gap-2 mt-4 pe-3">
              {/* ... other modal content ... */}
              <div className="modal-footer">
                <button
                  type="button"
                  id="btn" className="btn px-4"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentUmrahCalculator = () => {
  const tabs = [
    { name: "Umrah Package", path: "/packages" },
    { name: "Umrah Calculator", path: "/packages/umrah-calculater" },
    // { name: "Custom Umrah", path: "/packages/custom-umrah" },
  ];

  const buttonTabs = [
    "Calculations ",
    "Orders",

  ];

  // Sync tab state with URL changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  const getActiveTab = () => {
    const path = location.pathname;
    // if (path.includes("/booking-history/group-tickets"))
    //   return "Groups Tickets";
    // if (path === "/booking-history/" || path === "/booking-history")
    //   return "UMRAH BOOKINGS";
    return tabs[0];
  };
  const [activeTab, setActiveTab] = useState(getActiveTab());

  const token = localStorage.getItem("agentAccessToken");

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    return JSON.parse(agentOrg).ids[0];
  };

  const orgId = getOrgId();

  // State declarations
  const [flightOptions, setFlightOptions] = useState("select");
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [airlinesMap, setAirlinesMap] = useState({});
  const [citiesMap, setCitiesMap] = useState({});
  const [showCustomTicketModal, setShowCustomTicketModal] = useState(false);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [ticketsList, setTicketsList] = useState([]);
  const [withoutFlight, setWithoutFlight] = useState(false);
  const [pnr, setPnr] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [fromSector, setFromSector] = useState("");
  const [toSector, setToSector] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [ticketId, setTicketId] = useState(0);
  const [returnAirline, setReturnAirline] = useState("");
  const [returnFromSector, setReturnFromSector] = useState("");
  const [returnFlightNumber, setReturnFlightNumber] = useState("");
  const [returnToSector, setReturnToSector] = useState("");
  const [returnDepartureDate, setReturnDepartureDate] = useState("");
  const [returnReturnDate, setReturnReturnDate] = useState("");
  const [airlineName, setAirlineName] = useState("");

  const [hotels, setHotels] = useState([]);
  const [transportSectors, setTransportSectors] = useState([]);
  const [visaPricesOne, setVisaPricesOne] = useState([]);
  const [visaPricesTwo, setVisaPricesTwo] = useState([]);
  const [visaTypes, setVisaTypes] = useState([]);
  const [onlyVisaPrices, setOnlyVisaPrices] = useState([]);

  // Add these to your state declarations
  const [foodPrices, setFoodPrices] = useState([]);
  const [ziaratPrices, setZiaratPrices] = useState([]);
  const [selectedFood, setSelectedFood] = useState("");
  const [selectedZiarat, setSelectedZiarat] = useState("");

  const [foodSelf, setFoodSelf] = useState(false);
  const [ziaratSelf, setZiaratSelf] = useState(false);
  const [foodForms, setFoodForms] = useState([{ id: Date.now(), foodId: "" }]);
  const [ziaratForms, setZiaratForms] = useState([{ id: Date.now(), ziaratId: "" }]);

  const [currentPackageId, setCurrentPackageId] = useState(null);

  const [customPackages, setCustomPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [visaAdultCost, setVisaAdultCost] = useState(0);
  const [visaChildCost, setVisaChildCost] = useState(0);
  const [visaInfantCost, setVisaInfantCost] = useState(0);


  const modalRef = useRef();
  const downloadModalAsPDF = async () => {
    const element = modalRef.current;
    const canvas = await html2canvas(element, { scale: 2 }); // higher scale = better quality
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add extra pages if content is longer
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("Package_Details.pdf");
  };

  // Add to your loading state
  const [loading, setLoading] = useState({
    hotels: false,
    transport: false,
    visaTypes: false,
    flights: false,
    food: false,
    ziarat: false,
  });


  const [formData, setFormData] = useState({
    totalAdults: 0,
    totalChilds: 0,
    totalInfants: 0,
    addVisaPrice: false,
    longTermVisa: false,
    // withOneSideTransport: false,
    // withFullTransport: false,
    visaTypeId: "",
    onlyVisa: false,
    hotelId: "",
    hotelName: "",
    hotelData: null,
    roomType: "",
    sharingType: "Gender or Family",
    checkIn: "",
    checkOut: "",
    noOfNights: 0,
    specialRequest: "Haraam View",
    transportType: "Company Shared Bus",
    transportSector: "",
    transportSectorId: "",
    self: false,
    departureAirline: "Saudi(sv)",
    departureFlightNumber: "Saudi(sv)",
    departureFrom: "Lhe",
    departureTo: "Jed",
    departureTravelDate: "2024-08-12",
    departureTravelTime: "12:30",
    departureReturnDate: "2024-07-02",
    departureReturnTime: "14:30",
    returnAirline: "Saudi(sv)",
    returnFlightNumber: "Saudi(sv)",
    returnFrom: "Jed",
    returnTo: "Lhe",
    returnTravelDate: "2024-07-12",
    returnTravelTime: "12:30",
    returnReturnDate: "2024-07-02",
    returnReturnTime: "14:30",
    flightCost: "30,000",
    margin: "",
  });

  const [costs, setCosts] = useState({
    queryNumber: "",
    visaCost: "0",
    hotelCost: "0",
    transportCost: "0",
    flightCost: "0",
    foodCost: "0",
    ziaratCost: "0",
    totalCost: "0",
  });

  const [transportSectorPrices, setTransportSectorPrices] = useState({
    adultPrice: 0,
    childPrice: 0,
    infantPrice: 0,
  });

  const [calculatedVisaPrices, setCalculatedVisaPrices] = useState({
    adultPrice: 0,
    childPrice: 0,
    infantPrice: 0,
    includesTransport: false,
    visaType: "No Visa Selected"
  });

  // Calculate visa prices whenever relevant state changes
  useEffect(() => {
    const prices = calculateVisaPrices();
    setCalculatedVisaPrices(prices);
  }, [
    formData.addVisaPrice,
    formData.onlyVisa,
    formData.longTermVisa,
    formData.visaTypeId,
    formData.totalAdults,
    formData.totalChilds,
    formData.totalInfants,
    visaTypes,
    visaPricesOne,
    visaPricesTwo,
    onlyVisaPrices
  ]);

  const fetchAllPrices = async () => {
    setLoading({
      hotels: true,
      transport: true,
      visaTypes: true,
      flights: true,
      food: true,
      ziarat: true,
      riyalRate: true
    });

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/all-prices/?organization_id=${orgId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data;

      // Set all the data from the single API response
      setRiyalRate(data.riyal_rates?.[0] || null);
      setHotels(data.hotels || []);
      setTransportSectors(data.transport_sector_prices || []);
      setVisaTypes(data.set_visa_type || []);
      setVisaPricesOne(data.umrah_visa_prices || []);
      setVisaPricesTwo(data.umrah_visa_type_two || []);
      setOnlyVisaPrices(data.only_visa_prices || []);
      setFoodPrices(data.food_prices || []);
      setZiaratPrices(data.ziarat_prices || []);
      setTicketsList(data.tickets || []);

      // Create airlines and cities maps
      const airlinesMap = {};
      data.airlines?.forEach((airline) => {
        airlinesMap[airline.id] = { name: airline.name, code: airline.code };
      });
      setAirlinesMap(airlinesMap);

      const citiesMap = {};
      data.cities?.forEach((city) => {
        citiesMap[city.id] = { code: city.code, name: city.name };
      });
      setCitiesMap(citiesMap);

    } catch (error) {
      console.error("Error fetching all prices:", error);
      toast.error("Failed to fetch pricing data");
    } finally {
      setLoading({
        hotels: false,
        transport: false,
        visaTypes: false,
        flights: false,
        food: false,
        ziarat: false,
        riyalRate: false
      });
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await fetchAllPrices();
      } catch (error) {
        console.error("Error in initial data fetching:", error);
      }
    };

    fetchInitialData();
  }, [orgId, token]);

  // Data fetching functions
  const fetchData = async (url, setData, loadingKey) => {
    if (loadingKey) setLoading((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      const response = await axios.get(url, {
        params: { organization: orgId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data);
    } catch (error) {
      console.error(`Error fetching ${loadingKey}:`, error);
      toast.error(`Failed to fetch ${loadingKey}`);
    } finally {
      if (loadingKey) setLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // const fetchRiyalRate = () =>
  //   fetchData("http://127.0.0.1:8000/api/riyal-rates/", setRiyalRate, "riyalRate");

  const fetchTickets = () =>
    fetchData("http://127.0.0.1:8000/api/tickets/", setTicketsList, "flights");

  const fetchTransportSectors = () =>
    fetchData(
      "http://127.0.0.1:8000/api/transport-sector-prices/",
      setTransportSectors,
      "transport"
    );

  const fetchHotels = () =>
    fetchData("http://127.0.0.1:8000/api/hotels/", setHotels, "hotels");

  const fetchVisaTypes = () =>
    fetchData(
      "http://127.0.0.1:8000/api/set-visa-type/",
      setVisaTypes,
      "visaTypes"
    );

  const fetchVisaPricesOne = () =>
    fetchData(
      "http://127.0.0.1:8000/api/umrah-visa-prices/",
      setVisaPricesOne,
      "visaTypes"
    );

  const fetchVisaPricesTwo = () =>
    fetchData(
      "http://127.0.0.1:8000/api/umrah-visa-type-two/",
      setVisaPricesTwo,
      "visaTypes"
    );

  const fetchFoodPrices = () =>
    fetchData("http://127.0.0.1:8000/api/food-prices/", setFoodPrices, "food");

  const fetchZiaratPrices = () =>
    fetchData("http://127.0.0.1:8000/api/ziarat-prices/", setZiaratPrices, "ziarat");

  const fetchAirlines = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/airlines/", {
        params: { organization: orgId },
        headers: { Authorization: `Bearer ${token}` },
      });
      const map = {};
      response.data.forEach((airline) => {
        map[airline.id] = { name: airline.name };
      });
      setAirlinesMap(map);
    } catch (error) {
      console.error("Error fetching airlines:", error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/cities/", {
        params: { organization: orgId },
        headers: { Authorization: `Bearer ${token}` },
      });
      const map = {};
      response.data.forEach((city) => {
        map[city.id] = { code: city.code, name: city.name };
      });
      setCitiesMap(map);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchOnlyVisaPrices = () =>
    fetchData("http://127.0.0.1:8000/api/only-visa-prices/", setOnlyVisaPrices);

  // Helper functions
  const formatDateTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toISOString().slice(0, 16);
  };

  const resetFlightFields = () => {
    setPnr("");
    setAirlineName("");
    setFlightNumber("");
    setFromSector("");
    setToSector("");
    setDepartureDate("");
    setReturnDate("");
    setReturnAirline("");
    setReturnFlightNumber("");
    setReturnFromSector("");
    setReturnToSector("");
    setReturnDepartureDate("");
    setReturnReturnDate("");
    setTicketId(0);
  };

  const handleFlightSelect = (flight) => {
    setSelectedFlight(flight);
    setTicketId(flight.id);
    setPnr(flight.pnr);

    // Calculate flight costs based on passenger counts
    const adultCost = flight.adult_price || 0;
    const childCost = flight.child_price || 0;
    const infantCost = flight.infant_price || 0;

    const totalFlightCost =
      parseInt(formData.totalAdults || 0) * adultCost +
      parseInt(formData.totalChilds || 0) * childCost +
      parseInt(formData.totalInfants || 0) * infantCost;

    setCosts((prev) => ({
      ...prev,
      flightCost: totalFlightCost.toLocaleString(),
      totalCost: (
        parseInt(prev.visaCost.replace(/,/g, "") || 0) +
        parseInt(prev.hotelCost.replace(/,/g, "") || 0) +
        parseInt(prev.transportCost.replace(/,/g, "") || 0) +
        totalFlightCost
      ).toLocaleString(),
    }));

    // Rest of your existing flight selection logic...
    const departureTrip = flight.trip_details?.find(
      (t) => t.trip_type === "departure"
    );
    if (departureTrip) {
      setAirlineName(airlinesMap[flight.airline]?.name || "");
      setFlightNumber(departureTrip.flight_number || "");
      setFromSector(citiesMap[departureTrip.departure_city]?.code || "");
      setToSector(citiesMap[departureTrip.arrival_city]?.code || "");

      if (departureTrip.departure_date_time) {
        setDepartureDate(
          formatDateTimeForInput(departureTrip.departure_date_time)
        );
      }
      if (departureTrip.arrival_date_time) {
        setReturnDate(formatDateTimeForInput(departureTrip.arrival_date_time));
      }
    }

    // Process return trip
    const returnTrip = flight.trip_details?.find(
      (t) => t.trip_type === "return"
    );
    if (returnTrip) {
      setReturnAirline(airlinesMap[flight.airline]?.name || "");
      setReturnFlightNumber(returnTrip.flight_number || "");
      setReturnFromSector(citiesMap[returnTrip.departure_city]?.code || "");
      setReturnToSector(citiesMap[returnTrip.arrival_city]?.code || "");

      if (returnTrip.departure_date_time) {
        setReturnDepartureDate(
          formatDateTimeForInput(returnTrip.departure_date_time)
        );
      }
      if (returnTrip.arrival_date_time) {
        setReturnReturnDate(
          formatDateTimeForInput(returnTrip.arrival_date_time)
        );
      }
    }

    setShowFlightModal(false);
  };

  const getActivePriceForDates = (hotel, checkInDate) => {
    if (!hotel?.prices || !checkInDate) return null;
    const checkIn = new Date(checkInDate);
    return hotel.prices.find((price) => {
      const startDate = new Date(price.start_date);
      const endDate = new Date(price.end_date);
      return checkIn >= startDate && checkIn <= endDate;
    });
  };

  const getCurrentRoomType = (hotel) => {
    if (!hotel?.prices || hotel.prices.length === 0) return null;
    const today = new Date();
    const activePrice = hotel.prices.find((price) => {
      const startDate = new Date(price.start_date);
      const endDate = new Date(price.end_date);
      return today >= startDate && today <= endDate;
    });
    return activePrice?.room_type || hotel.prices[0]?.room_type;
  };

  const filteredTransportSectors = useMemo(() => {
    if (!visaTypes.length || !transportSectors.length) return [];

    return transportSectors.filter((sector) => {
      if (!sector.reference) return false;

      return visaTypes.some(
        (visa) =>
          visa.name?.trim().toLowerCase() ===
          sector.reference.trim().toLowerCase()
      );
    });
  }, [visaTypes, transportSectors]);

  const calculateVisaPrices = useCallback(() => {
    // Get selected visa type
    const selectedVisaType = visaTypes.find(vt => vt.id === formData.visaTypeId);
    if (!selectedVisaType) {
      return {
        adultPrice: 0,
        childPrice: 0,
        infantPrice: 0,
        includesTransport: false,
        visaType: "No Visa Selected"
      };
    }

    // Only calculate visa prices if either addVisaPrice or onlyVisa is checked
    if (!formData.addVisaPrice && !formData.onlyVisa) {
      return {
        adultPrice: 0,
        childPrice: 0,
        infantPrice: 0,
        includesTransport: false,
        visaType: "Visa not selected"
      };
    }

    // Determine if it's Type1 or Type2 based on the name
    const isType2 = selectedVisaType?.name?.toLowerCase().includes("type2");
    const isType1 = selectedVisaType && !isType2;

    // 1. Only Visa case - highest priority when checked
    if (formData.onlyVisa) {
      // For Type2 visas, use only-visa-prices if available
      if (isType2 && onlyVisaPrices.length > 0) {
        // Get flight details for Type2 visa calculation
        const departureTrip = selectedFlight?.trip_details?.find(
          t => t.trip_type.toLowerCase() === "departure"
        );
        const returnTrip = selectedFlight?.trip_details?.find(
          t => t.trip_type.toLowerCase() === "return"
        );

        if (!departureTrip || !returnTrip) {
          return {
            adultPrice: 0,
            childPrice: 0,
            infantPrice: 0,
            includesTransport: false,
            visaType: "Flight details missing"
          };
        }

        // Calculate duration in days
        const depDate = new Date(departureTrip.departure_date_time);
        const retDate = new Date(returnTrip.arrival_date_time);
        const durationDays = Math.ceil((retDate - depDate) / (1000 * 60 * 60 * 24));

        // Get arrival city details
        const arrivalCity = citiesMap[departureTrip.arrival_city];
        const arrivalCityName = arrivalCity?.name || "";
        const arrivalCityCode = arrivalCity?.code || "";

        // Find matching visa prices
        const matchingPrices = onlyVisaPrices.filter(price => {
          // Check if airport name matches arrival city name or code
          const airportMatch =
            price.airpot_name?.toLowerCase() === arrivalCityName.toLowerCase() ||
            price.airpot_name?.toLowerCase() === arrivalCityCode.toLowerCase();

          // Check if duration falls within the visa's day range
          const minDays = parseInt(price.min_days) || 0;
          const maxDays = parseInt(price.max_days) || Infinity;
          const durationMatch = durationDays >= minDays && durationDays <= maxDays;

          return airportMatch && durationMatch;
        });

        // If we have matches, find the most specific one (smallest day range)
        if (matchingPrices.length > 0) {
          const mostSpecificPrice = matchingPrices.reduce((prev, current) => {
            const prevRange = (parseInt(prev.max_days) || 0) - (parseInt(prev.min_days) || 0);
            const currentRange = (parseInt(current.max_days) || 0) - (parseInt(current.min_days) || 0);
            return currentRange < prevRange ? current : prev;
          });

          return {
            adultPrice: mostSpecificPrice.adault_price || 0,
            childPrice: mostSpecificPrice.child_price || 0,
            infantPrice: mostSpecificPrice.infant_price || 0,
            includesTransport: false,
            visaType: `Only Visa (${mostSpecificPrice.type})`
          };
        }

        // If no matches found, try to find any prices for this visa type regardless of airport
        const visaTypePrices = onlyVisaPrices.filter(price =>
          price.type?.toLowerCase() === selectedVisaType.name.toLowerCase()
        );

        if (visaTypePrices.length > 0) {
          // Find the price that matches our duration
          const matchingDurationPrice = visaTypePrices.find(price => {
            const minDays = parseInt(price.min_days) || 0;
            const maxDays = parseInt(price.max_days) || Infinity;
            return durationDays >= minDays && durationDays <= maxDays;
          });

          if (matchingDurationPrice) {
            return {
              adultPrice: matchingDurationPrice.adault_price || 0,
              childPrice: matchingDurationPrice.child_price || 0,
              infantPrice: matchingDurationPrice.infant_price || 0,
              includesTransport: false,
              visaType: `Only Visa (${matchingDurationPrice.type} - No City Match)`
            };
          }

          // If no duration match, use the first available price for this visa type
          return {
            adultPrice: visaTypePrices[0].adault_price || 0,
            childPrice: visaTypePrices[0].child_price || 0,
            infantPrice: visaTypePrices[0].infant_price || 0,
            includesTransport: false,
            visaType: `Only Visa (${visaTypePrices[0].type} - Default)`
          };
        }

        // If no matches at all, return 0 prices
        return {
          adultPrice: 0,
          childPrice: 0,
          infantPrice: 0,
          includesTransport: false,
          visaType: "No matching visa prices found"
        };
      }

      // For Type1 visas or if no only-visa-prices available for Type2
      const category = formData.longTermVisa ? "long stay" : "short stay";

      // Find matching visa prices from visaPricesOne
      const matchingVisaPrices = visaPricesOne.filter(
        price => price.visa_type?.toLowerCase() === selectedVisaType?.name?.toLowerCase() &&
          price.category === category
      );

      if (matchingVisaPrices.length > 0) {
        return {
          adultPrice: matchingVisaPrices[0].adault_price || 0,
          childPrice: matchingVisaPrices[0].child_price || 0,
          infantPrice: matchingVisaPrices[0].infant_price || 0,
          includesTransport: false,
          visaType: `Only Visa (${category})`
        };
      }

      // Fallback to any price for this visa type if no exact category match
      const fallbackPrice = visaPricesOne.find(
        price => price.visa_type?.toLowerCase() === selectedVisaType?.name?.toLowerCase()
      );

      if (fallbackPrice) {
        return {
          adultPrice: fallbackPrice.adault_price || 0,
          childPrice: fallbackPrice.child_price || 0,
          infantPrice: fallbackPrice.infant_price || 0,
          includesTransport: false,
          visaType: `Only Visa (${fallbackPrice.category})`
        };
      }

      return {
        adultPrice: 0,
        childPrice: 0,
        infantPrice: 0,
        includesTransport: false,
        visaType: "Only Visa (No Prices)"
      };
    }

    // 2. Add Visa Price case (Type1 visa with hotel)
    if (formData.addVisaPrice && isType1 && visaPricesOne.length > 0) {
      // ... rest of the Type1 visa with hotel logic remains the same ...
      // Determine category based on hotel nights and longTermVisa checkbox
      let category = "short stay with hotel";

      // If hotel nights > 28 or long term visa checked, use long stay
      if (formData.noOfNights > 28 || formData.longTermVisa) {
        category = "long stay with hotel";
      }

      const matchingVisaPrices = visaPricesOne.filter(
        price => price.visa_type?.toLowerCase() === selectedVisaType?.name?.toLowerCase() &&
          price.category === category &&
          (price.maximum_nights >= formData.noOfNights || price.maximum_nights === 2147483647)
      );

      if (matchingVisaPrices.length > 0) {
        return {
          adultPrice: matchingVisaPrices[0].adault_price || 0,
          childPrice: matchingVisaPrices[0].child_price || 0,
          infantPrice: matchingVisaPrices[0].infant_price || 0,
          includesTransport: false,
          visaType: `Visa with Hotel (${category})`
        };
      }

      // Fallback to any price for this visa type if no exact category match
      const fallbackPrice = visaPricesOne.find(
        price => price.visa_type?.toLowerCase() === selectedVisaType?.name?.toLowerCase()
      );

      if (fallbackPrice) {
        return {
          adultPrice: fallbackPrice.adault_price || 0,
          childPrice: fallbackPrice.child_price || 0,
          infantPrice: fallbackPrice.infant_price || 0,
          includesTransport: false,
          visaType: `Visa with Hotel (${fallbackPrice.category})`
        };
      }
    }

    // 3. Type 2 Visa case (regular package, not only visa)
    if (isType2 && visaPricesTwo.length > 0) {
      const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);

      const sortedVisaPricesTwo = [...visaPricesTwo].sort(
        (a, b) => a.person_from - b.person_from
      );

      const matchingVisaPricesTwo = sortedVisaPricesTwo.find(
        vp => totalPersons >= vp.person_from && totalPersons <= vp.person_to
      );

      if (matchingVisaPricesTwo) {
        return {
          adultPrice: matchingVisaPricesTwo.adault_price || 0,
          childPrice: matchingVisaPricesTwo.child_price || 0,
          infantPrice: matchingVisaPricesTwo.infant_price || 0,
          includesTransport: matchingVisaPricesTwo.is_transport || false,
          visaType: "Type 2 Visa"
        };
      }
    }

    // Default case if no matching prices found
    return {
      adultPrice: 0,
      childPrice: 0,
      infantPrice: 0,
      includesTransport: false,
      visaType: selectedVisaType ? `No Prices for ${selectedVisaType.name}` : "No Visa Selected"
    };
  }, [
    formData.addVisaPrice,
    formData.onlyVisa,
    formData.longTermVisa,
    formData.visaTypeId,
    formData.totalAdults,
    formData.totalChilds,
    formData.totalInfants,
    visaTypes,
    visaPricesOne,
    visaPricesTwo,
    onlyVisaPrices,
    selectedFlight,
    citiesMap
  ]);

  // const handleCheckboxChange = (field) => {
  //   setFormData((prev) => {
  //     const newFormData = {
  //       ...prev,
  //       [field]: !prev[field],
  //     };

  //     // Handle checkbox dependencies
  //     if (field === "onlyVisa") {
  //       if (newFormData.onlyVisa) {
  //         // When enabling "Only Visa", disable other visa-related options
  //         newFormData.addVisaPrice = false;
  //         newFormData.longTermVisa = false;

  //         // Auto-select first visa type if none selected
  //         if (!newFormData.visaTypeId && visaTypes.length > 0) {
  //           newFormData.visaTypeId = visaTypes[0].id;
  //         }
  //       }
  //     } else if (field === "addVisaPrice") {
  //       if (newFormData.addVisaPrice) {
  //         // When enabling "Add Visa Price", disable "Only Visa"
  //         newFormData.onlyVisa = false;

  //         // Auto-select first visa type if none selected
  //         if (!newFormData.visaTypeId && visaTypes.length > 0) {
  //           newFormData.visaTypeId = visaTypes[0].id;
  //         }
  //       }
  //     }
  //     else if (field === "self") {
  //       // When enabling "Self", disable transport options
  //       if (!prev.self) {
  //         newFormData.withOneSideTransport = false;
  //         newFormData.withFullTransport = false;
  //       }
  //     }
  //     else if (field === "withOneSideTransport") {
  //       if (!prev.withOneSideTransport) {
  //         newFormData.withFullTransport = false;
  //         newFormData.self = false;
  //       }
  //     }
  //     else if (field === "withFullTransport") {
  //       if (!prev.withFullTransport) {
  //         newFormData.withOneSideTransport = false;
  //         newFormData.self = false;
  //       }
  //     }

  //     // Recalculate costs when relevant fields change
  //     if (
  //       field === "addVisaPrice" ||
  //       field === "onlyVisa" ||
  //       field === "longTermVisa" ||
  //       field === "visaTypeId" ||
  //       field === "withOneSideTransport" ||
  //       field === "withFullTransport" ||
  //       field === "self" ||
  //       field === "totalAdults" ||
  //       field === "totalChilds" ||
  //       field === "totalInfants"
  //     ) {
  //       setTimeout(() => calculateCosts(), 0);
  //     }

  //     return newFormData;
  //   });
  //   setTimeout(calculateCosts, 0);
  // };

  const handleCheckboxChange = (field) => {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [field]: !prev[field],
      };

      // Handle checkbox dependencies
      if (field === "onlyVisa" && !prev[field]) {
        // When enabling "Only Visa", disable other visa-related options
        newFormData.addVisaPrice = false;
        newFormData.longTermVisa = false;

        // Auto-select first visa type if none selected
        if (!newFormData.visaTypeId && visaTypes.length > 0) {
          newFormData.visaTypeId = visaTypes[0].id;
        }
      } else if (field === "addVisaPrice" && !prev[field]) {
        // When enabling "Add Visa Price", disable "Only Visa"
        newFormData.onlyVisa = false;

        // Auto-select first visa type if none selected
        if (!newFormData.visaTypeId && visaTypes.length > 0) {
          newFormData.visaTypeId = visaTypes[0].id;
        }
      } else if (field === "longTermVisa") {
        // No special handling needed for longTermVisa
      }

      return newFormData;
    });

    // Force immediate recalculation
    setTimeout(() => {
      const prices = calculateVisaPrices();
      setCalculatedVisaPrices(prices);
      calculateCosts(); // Also recalculate total costs
    }, 0);
  };

  const updateVisaCosts = (includeVisa) => {
    const visaPrices = calculateVisaPrices();
    const totalVisaCost = includeVisa
      ? parseInt(formData.totalAdults || 0) * (visaPrices.adultPrice || 0) +
      parseInt(formData.totalChilds || 0) * (visaPrices.childPrice || 0) +
      parseInt(formData.totalInfants || 0) * (visaPrices.infantPrice || 0)
      : 0;

    const transportCost = visaPrices.includesTransport
      ? 0
      : parseInt(costs.transportCost.replace(/,/g, "")) || 0;

    setCosts((prev) => ({
      ...prev,
      visaCost: totalVisaCost.toLocaleString(),
      transportCost: transportCost.toLocaleString(),
      totalCost: (
        totalVisaCost +
        parseInt(prev.hotelCost.replace(/,/g, "")) +
        transportCost +
        parseInt(prev.flightCost.replace(/,/g, ""))
      ).toLocaleString(),
    }));
  };

  // const calculateCosts = () => {
  //   const visaPrices = calculateVisaPrices();
  //   let totalVisaCost = 0;
  //   let transportCost = 0;
  //   let hotelCost = 0;
  //   let flightCost = 0;

  //   // Calculate flight costs if flight is selected
  //   if (selectedFlight) {
  //     flightCost =
  //       (parseInt(formData.totalAdults || 0) * (selectedFlight.adult_price || 0)) +
  //       (parseInt(formData.totalChilds || 0) * (selectedFlight.child_price || 0)) +
  //       (parseInt(formData.totalInfants || 0) * (selectedFlight.infant_price || 0));
  //   }

  //   // Calculate visa costs only if addVisaPrice is checked
  //   if (formData.addVisaPrice || formData.onlyVisa) {
  //     totalVisaCost =
  //       parseInt(formData.totalAdults || 0) * (visaPrices.adultPrice || 0) +
  //       parseInt(formData.totalChilds || 0) * (visaPrices.childPrice || 0) +
  //       parseInt(formData.totalInfants || 0) * (visaPrices.infantPrice || 0);
  //   }

  //   // Calculate transport costs
  //   if (!formData.self && !visaPrices.includesTransport) {
  //     transportCost =
  //       (parseInt(formData.totalAdults || 0) * transportSectorPrices.adultPrice) +
  //       (parseInt(formData.totalChilds || 0) * transportSectorPrices.childPrice) +
  //       (parseInt(formData.totalInfants || 0) * transportSectorPrices.infantPrice);

  //     // if (formData.withFullTransport) {
  //     //   transportCost = baseTransportCost;
  //     // } else if (formData.withOneSideTransport) {
  //     //   transportCost = baseTransportCost * 0.5; // 50% of transport charges
  //     // }
  //     // If neither is selected, transportCost remains 0
  //   }

  //   // Calculate hotel costs
  //   if (
  //     formData.hotelId &&
  //     formData.roomType &&
  //     formData.checkIn &&
  //     formData.noOfNights
  //   ) {
  //     const selectedHotel = hotels.find(
  //       (hotel) => hotel.id.toString() === formData.hotelId
  //     );

  //     if (selectedHotel?.prices?.length > 0) {
  //       const checkInDate = new Date(formData.checkIn);
  //       const activePrice = selectedHotel.prices.find((price) => {
  //         const startDate = new Date(price.start_date);
  //         const endDate = new Date(price.end_date);
  //         return checkInDate >= startDate && checkInDate <= endDate;
  //       });

  //       if (activePrice) {
  //         const totalPersons =
  //           parseInt(formData.totalAdults || 0) +
  //           parseInt(formData.totalChilds || 0);

  //         switch (formData.roomType) {
  //           case "Sharing":
  //             hotelCost =
  //               activePrice.price *
  //               totalPersons *
  //               parseInt(formData.noOfNights || 0);
  //             break;
  //           case "Only-Room":
  //             hotelCost =
  //               activePrice.price * totalPersons * parseInt(formData.noOfNights || 0);
  //             break;
  //           case "Double Bed":
  //             hotelCost =
  //               activePrice.price * totalPersons * parseInt(formData.noOfNights || 0);
  //             break;
  //           case "Triple Bed":
  //             hotelCost =
  //               activePrice.price * totalPersons * parseInt(formData.noOfNights || 0);
  //             break;
  //           case "Quad Bed":
  //             hotelCost =
  //               activePrice.price * totalPersons * parseInt(formData.noOfNights || 0);
  //             break;
  //           case "Quint Bed":
  //             hotelCost =
  //               activePrice.price * totalPersons * parseInt(formData.noOfNights || 0);
  //             break;
  //           default:
  //             hotelCost =
  //               activePrice.price * totalPersons * parseInt(formData.noOfNights || 0);
  //         }
  //       }
  //     }
  //   }

  //   setCosts(prev => ({
  //     ...prev,
  //     visaCost: totalVisaCost.toLocaleString(),
  //     hotelCost: hotelCost.toLocaleString(),
  //     transportCost: transportCost.toLocaleString(),
  //     flightCost: flightCost.toLocaleString(),
  //     totalCost: (
  //       totalVisaCost +
  //       hotelCost +
  //       transportCost +
  //       flightCost
  //     ).toLocaleString(),
  //   }));
  // };

  const handleInputChange = (field, value) => {
    // if (field === "checkIn") {
    //   const checkInDate = new Date(value);
    //   const checkOutDate = formData.checkOut
    //     ? new Date(formData.checkOut)
    //     : new Date(checkInDate);
    //   checkOutDate.setDate(checkOutDate.getDate() + (formData.noOfNights || 0));

    //   let roomType = "";
    //   if (formData.hotelId) {
    //     const selectedHotel = hotels.find(
    //       (h) => h.id.toString() === formData.hotelId
    //     );
    //     const activePrice = getActivePriceForDates(selectedHotel, value);
    //     roomType = activePrice?.room_type === "Only-Room" ? "Only-Room" : "";
    //   }

    //   setFormData((prev) => ({
    //     ...prev,
    //     checkIn: value,
    //     checkOut: checkOutDate.toISOString().split("T")[0],
    //     roomType: roomType,
    //   }));
    //   return;
    // }

    // if (field === "checkOut") {
    //   const checkInDate = new Date(formData.checkIn);
    //   const checkOutDate = new Date(value);
    //   const nights = Math.ceil(
    //     (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    //   );

    //   const selectedHotel = hotels.find(
    //     (h) => h.id.toString() === formData.hotelId
    //   );
    //   let roomTypeForDates = null;
    //   if (selectedHotel?.prices) {
    //     const priceForDates = selectedHotel.prices.find((price) => {
    //       const priceStart = new Date(price.start_date);
    //       const priceEnd = new Date(price.end_date);
    //       return checkInDate >= priceStart && checkInDate <= priceEnd;
    //     });
    //     roomTypeForDates = priceForDates?.room_type;
    //   }

    //   setFormData((prev) => ({
    //     ...prev,
    //     checkOut: value,
    //     noOfNights: nights > 0 ? nights : 0,
    //     roomType: roomTypeForDates || prev.roomType,
    //   }));
    //   return;
    // }

    if (field === "checkIn") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0);

      // Prevent selecting past dates
      if (selectedDate < today) {
        toast.error("Check-in date cannot be in the past");
        return;
      }

      const checkInDate = new Date(value);
      const checkOutDate = formData.checkOut
        ? new Date(formData.checkOut)
        : new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + (formData.noOfNights || 0));

      let roomType = "";
      if (formData.hotelId) {
        const selectedHotel = hotels.find(
          (h) => h.id.toString() === formData.hotelId
        );
        const activePrice = getActivePriceForDates(selectedHotel, value);
        roomType = activePrice?.room_type === "Only-Room" ? "Only-Room" : "";
      }

      setFormData((prev) => ({
        ...prev,
        checkIn: value,
        checkOut: checkOutDate.toISOString().split("T")[0],
        roomType: roomType,
      }));
      return;
    }

    if (field === "checkOut") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0);

      // Prevent selecting past dates
      if (selectedDate < today) {
        toast.error("Check-out date cannot be in the past");
        return;
      }

      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(value);

      // Ensure check-out is after check-in
      if (checkOutDate <= checkInDate) {
        toast.error("Check-out date must be after check-in date");
        return;
      }

      const nights = Math.ceil(
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
      );

      const selectedHotel = hotels.find(
        (h) => h.id.toString() === formData.hotelId
      );
      let roomTypeForDates = null;
      if (selectedHotel?.prices) {
        const priceForDates = selectedHotel.prices.find((price) => {
          const priceStart = new Date(price.start_date);
          const priceEnd = new Date(price.end_date);
          return checkInDate >= priceStart && checkInDate <= priceEnd;
        });
        roomTypeForDates = priceForDates?.room_type;
      }

      setFormData((prev) => ({
        ...prev,
        checkOut: value,
        noOfNights: nights > 0 ? nights : 0,
        roomType: roomTypeForDates || prev.roomType,
      }));
      return;
    }

    if (field === "noOfNights" && formData.checkIn) {
      const nights = parseInt(value) || 0;
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + nights);

      setFormData((prev) => ({
        ...prev,
        noOfNights: nights,
        checkOut: checkOutDate.toISOString().split("T")[0],
      }));
      return;
    }

    if (field === "hotelId") {
      const selectedHotel = hotels.find(
        (hotel) => hotel.id.toString() === value
      );
      const activePrice = getActivePriceForDates(
        selectedHotel,
        formData.checkIn
      );

      setFormData((prev) => ({
        ...prev,
        hotelId: value,
        hotelName: selectedHotel ? selectedHotel.name : "",
        hotelData: selectedHotel || null,
        roomType: activePrice?.room_type === "Only-Room" ? "Only-Room" : "",
      }));
      return;
    }

    if (field === "transportSectorId") {
      const selectedSector = transportSectors.find(
        (sector) => sector.id.toString() === value
      );

      if (selectedSector) {
        setTransportSectorPrices({
          adultPrice: selectedSector.adault_price || 0,
          childPrice: selectedSector.child_price || 0,
          infantPrice: selectedSector.infant_price || 0,
        });

        const transportCost =
          parseInt(formData.totalAdults || 0) * selectedSector.adault_price +
          parseInt(formData.totalChilds || 0) * selectedSector.child_price +
          parseInt(formData.totalInfants || 0) * selectedSector.infant_price;

        setCosts((prev) => ({
          ...prev,
          transportCost: transportCost.toLocaleString(),
          totalCost: (
            parseInt(prev.visaCost.replace(/,/g, "") || 0) +
            parseInt(prev.hotelCost.replace(/,/g, "") || 0) +
            transportCost +
            parseInt(prev.flightCost.replace(/,/g, "") || 0)
          ).toLocaleString(),
        }));
      }

      setFormData((prev) => ({
        ...prev,
        transportSectorId: value,
        transportSector: selectedSector ? selectedSector.name : "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // // Add this near your checkbox handlers
    // console.log('Checkbox changed:', field, 'New value:', !formData[field]);
    // console.log('Current visa prices:', calculatedVisaPrices);
  };


  const handleSubmit = async () => {
    const visaPrices = calculateVisaPrices();

    const agentData = localStorage.getItem("agentData");
    const agentInfo = JSON.parse(agentData);

    // Get selected food and ziarat details
    const selectedFoodItem = foodPrices.find(food => food.id.toString() === selectedFood);
    const selectedZiaratItem = ziaratPrices.find(ziarat => ziarat.id.toString() === selectedZiarat);

    const payload = {
      hotel_details: hotelForms
        .filter(form => form.hotelId)
        .map(form => ({
          room_type: form.roomType,
          quantity: parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0),
          sharing_type: form.sharingType,
          check_in_time: form.checkIn,
          check_out_time: form.checkOut,
          number_of_nights: parseInt(form.noOfNights || 0),
          special_request: form.specialRequest,
          price: 0, // This should be calculated based on your hotel pricing logic
          hotel: parseInt(form.hotelId)
        })),

      transport_details: transportForms
        .filter(form => form.transportSectorId && !form.self)
        .map(form => ({
          vehicle_type: form.transportType,
          transport_sector: parseInt(form.transportSectorId)
        })),

      ticket_details: selectedFlight ? [{
        ticket: selectedFlight.id
      }] : [],

      food_details: selectedFoodItem ? [{
        food: selectedFoodItem.id,
        price: selectedFoodItem.per_pex,
        min_persons: selectedFoodItem.min_pex,
        total_persons: parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0)
      }] : [],

      ziarat_details: selectedZiaratItem ? [{
        ziarat: selectedZiaratItem.id,
        price: selectedZiaratItem.price,
        contact_person: selectedZiaratItem.contact_person,
        contact_number: selectedZiaratItem.contact_number
      }] : [],

      total_adaults: parseInt(formData.totalAdults || 0),
      total_children: parseInt(formData.totalChilds || 0),
      total_infants: parseInt(formData.totalInfants || 0),

      // Visa prices
      child_visa_price: visaPrices.childPrice,
      infant_visa_price: visaPrices.infantPrice,
      adualt_visa_price: visaPrices.adultPrice,

      long_term_stay: formData.longTermVisa,
      is_full_transport: formData.withFullTransport,
      is_one_side_transport: formData.withOneSideTransport,
      only_visa: formData.onlyVisa,

      status: "",

      organization: orgId,
      agent: "",
      agency: "",
    };

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/umrah-packages/?organization${orgId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Package created successfully!");
    } catch (error) {
      console.error("Error creating package:", error);
      toast.error("Failed to create package");
    }
  };

  // Effects
  // useEffect(() => {
  //   const fetchInitialData = async () => {
  //     try {
  //       await Promise.all([
  //         fetchRiyalRate(),
  //         fetchHotels(),
  //         fetchTransportSectors(),
  //         fetchVisaTypes(),
  //         fetchVisaPricesTwo(),
  //         fetchVisaPricesOne(),
  //         fetchTickets(),
  //         fetchAirlines(),
  //         fetchCities(),
  //         fetchFoodPrices(),
  //         fetchZiaratPrices(),
  //       ]);
  //     } catch (error) {
  //       console.error("Error in initial data fetching:", error);
  //     }
  //   };
  //   fetchInitialData();
  // }, []);

  useEffect(() => {
    if (formData.hotelData?.room_type === "sharing") {
      fetchUmrahPackageData();
    }
  }, [formData.hotelData?.room_type]);

  useEffect(() => {
    if (formData.onlyVisa && onlyVisaPrices.length === 0) {
      fetchOnlyVisaPrices();
    }
  }, [formData.onlyVisa]);

  useEffect(() => {
    if (formData.onlyVisa && onlyVisaPrices.length > 0) {
      const visaPrices = calculateVisaPrices();
      const totalVisaCost =
        parseInt(formData.totalAdults || 0) * visaPrices.adultPrice +
        parseInt(formData.totalChilds || 0) * visaPrices.childPrice +
        parseInt(formData.totalInfants || 0) * visaPrices.infantPrice;

      setCosts((prev) => ({
        ...prev,
        visaCost: totalVisaCost.toLocaleString(),
        transportCost: "0",
        totalCost: (
          totalVisaCost +
          parseInt(prev.hotelCost.replace(/,/g, "") || 0) +
          parseInt(prev.flightCost.replace(/,/g, "") || 0)
        ).toLocaleString(),
      }));
    }
  }, [formData.onlyVisa, onlyVisaPrices]);

  useEffect(() => {
    if (formData.addVisaPrice || formData.onlyVisa) {
      const visaPrices = calculateVisaPrices();
      const totalVisaCost =
        parseInt(formData.totalAdults || 0) * (visaPrices.adultPrice || 0) +
        parseInt(formData.totalChilds || 0) * (visaPrices.childPrice || 0) +
        parseInt(formData.totalInfants || 0) * (visaPrices.infantPrice || 0);

      const transportCost = visaPrices.includesTransport
        ? 0
        : parseInt(costs.transportCost.replace(/,/g, "") || 0);

      setCosts((prev) => ({
        ...prev,
        visaCost: totalVisaCost.toLocaleString(),
        transportCost: transportCost.toLocaleString(),
        totalCost: (
          totalVisaCost +
          parseInt(prev.hotelCost.replace(/,/g, "") || 0) +
          transportCost +
          parseInt(prev.flightCost.replace(/,/g, "") || 0)
        ).toLocaleString(),
      }));
    } else {
      // If visa price is not being added, set visa cost to 0
      setCosts((prev) => ({
        ...prev,
        visaCost: "0",
        totalCost: (
          parseInt(prev.hotelCost.replace(/,/g, "") || 0) +
          parseInt(prev.transportCost.replace(/,/g, "") || 0) +
          parseInt(prev.flightCost.replace(/,/g, "") || 0)
        ).toLocaleString(),
      }));
    }
  }, [
    formData.totalAdults,
    formData.totalChilds,
    formData.totalInfants,
    formData.addVisaPrice,
    formData.onlyVisa,
    formData.visaTypeId,
    formData.longTermVisa,
  ]);

  const [hotelsList, setHotelsList] = useState([]);
  const [transportRoutes, setTransportRoutes] = useState([]);

  const addHotel = () => {
    if (!formData.hotelId || !formData.checkIn || !formData.checkOut || !formData.noOfNights) {
      toast.error("Please fill all required hotel fields");
      return;
    }

    const selectedHotel = hotels.find(hotel => hotel.id.toString() === formData.hotelId);
    if (!selectedHotel) return;

    const checkInDate = new Date(formData.checkIn);
    const activePrice = getActivePriceForDates(selectedHotel, formData.checkIn);

    if (!activePrice) {
      toast.error("No price available for selected dates");
      return;
    }

    const newHotel = {
      id: Date.now(), // temporary unique ID
      hotelId: formData.hotelId,
      hotelName: selectedHotel.name,
      roomType: formData.roomType,
      sharingType: formData.sharingType,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      noOfNights: formData.noOfNights,
      specialRequest: formData.specialRequest,
      price: activePrice.price,
      priceId: activePrice.id
    };

    setHotelsList([...hotelsList, newHotel]);

    // Calculate hotel costs
    calculateHotelCosts([...hotelsList, newHotel]);

    // Reset hotel form fields
    setFormData(prev => ({
      ...prev,
      hotelId: "",
      roomType: "",
      sharingType: "Gender or Family",
      checkIn: "",
      checkOut: "",
      noOfNights: 0,
      specialRequest: "Haraam View",
      hotelData: null
    }));
  };

  // Remove hotel from the list
  const removeHotel = (id) => {
    const updatedHotels = hotelsList.filter(hotel => hotel.id !== id);
    setHotelsList(updatedHotels);
    calculateHotelCosts(updatedHotels);
  };

  // Calculate total hotel costs
  const calculateHotelCosts = (hotels) => {
    let totalHotelCost = 0;

    hotels.forEach(hotel => {
      const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
      totalHotelCost += hotel.price * totalPersons * parseInt(hotel.noOfNights || 0);
    });

    setCosts(prev => ({
      ...prev,
      hotelCost: totalHotelCost.toLocaleString(),
      totalCost: (
        parseInt(prev.visaCost.replace(/,/g, "") || 0) +
        totalHotelCost +
        parseInt(prev.transportCost.replace(/,/g, "") || 0) +
        parseInt(prev.flightCost.replace(/,/g, "") || 0)
      ).toLocaleString()
    }));
  };

  // Add new transport route
  const addTransportRoute = () => {
    if (!formData.transportType || !formData.transportSectorId) {
      toast.error("Please select transport type and sector");
      return;
    }

    const selectedSector = transportSectors.find(
      sector => sector.id.toString() === formData.transportSectorId
    );

    if (!selectedSector) return;

    const newRoute = {
      id: Date.now(), // temporary unique ID
      transportType: formData.transportType,
      transportSectorId: formData.transportSectorId,
      sectorName: selectedSector.name,
      adultPrice: selectedSector.adault_price,
      childPrice: selectedSector.child_price,
      infantPrice: selectedSector.infant_price,
      isFullTransport: formData.withFullTransport,
      isOneSideTransport: formData.withOneSideTransport
    };

    setTransportRoutes([...transportRoutes, newRoute]);

    // Calculate transport costs
    calculateTransportCosts([...transportRoutes, newRoute]);

    // Reset transport form fields
    setFormData(prev => ({
      ...prev,
      transportType: "Company Shared Bus",
      transportSectorId: "",
      withFullTransport: false,
      withOneSideTransport: false
    }));
  };

  // Remove transport route from the list
  const removeTransportRoute = (id) => {
    const updatedRoutes = transportRoutes.filter(route => route.id !== id);
    setTransportRoutes(updatedRoutes);
    calculateTransportCosts(updatedRoutes);
  };

  // Calculate total transport costs
  const calculateTransportCosts = (routes) => {
    let totalTransportCost = 0;

    routes.forEach(route => {
      const baseCost =
        (parseInt(formData.totalAdults || 0) * route.adultPrice) +
        (parseInt(formData.totalChilds || 0) * route.childPrice) +
        (parseInt(formData.totalInfants || 0) * route.infantPrice);

      if (route.isFullTransport) {
        totalTransportCost += baseCost;
      } else if (route.isOneSideTransport) {
        totalTransportCost += baseCost * 0.5;
      }
      // If neither is selected, don't add to cost
    });

    setCosts(prev => ({
      ...prev,
      transportCost: totalTransportCost.toLocaleString(),
      totalCost: (
        parseInt(prev.visaCost.replace(/,/g, "")) +
        parseInt(prev.hotelCost.replace(/,/g, "") || 0) +
        totalTransportCost +
        parseInt(prev.flightCost.replace(/,/g, "") || 0)
      ).toLocaleString()
    }));
  };

  // Update the calculateCosts function to use the lists
  const calculateCosts = () => {
    const visaPrices = calculateVisaPrices();

    let totalVisaCost = 0;
    let flightCost = 0;
    let totalHotelCost = 0;
    let totalTransportCost = 0;
    let totalFoodCost = 0;
    let totalZiaratCost = 0;

    const adults = parseInt(formData.totalAdults || 0);
    const childs = parseInt(formData.totalChilds || 0);
    const infants = parseInt(formData.totalInfants || 0);
    const totalPersons = adults + childs;

    // Flight
    if (selectedFlight) {
      flightCost =
        adults * (parseFloat(selectedFlight.adult_price) || 0) +
        childs * (parseFloat(selectedFlight.child_price) || 0) +
        infants * (parseFloat(selectedFlight.infant_price) || 0);
    }

    // Visa
    totalVisaCost = (formData.addVisaPrice || formData.onlyVisa) ?
      parseInt(formData.totalAdults || 0) * (visaPrices.adultPrice || 0) +
      parseInt(formData.totalChilds || 0) * (visaPrices.childPrice || 0) +
      parseInt(formData.totalInfants || 0) * (visaPrices.infantPrice || 0) : 0;

    // Single food selection
    if (selectedFood) {
      const selectedFoodItem = foodPrices.find(f => f.id.toString() === selectedFood);
      if (selectedFoodItem && totalPersons <= selectedFoodItem.min_pex) {
        totalFoodCost += selectedFoodItem.per_pex * totalPersons;
      }
    }

    // Single ziarat selection
    if (selectedZiarat) {
      const selectedZiaratItem = ziaratPrices.find(z => z.id.toString() === selectedZiarat);
      if (selectedZiaratItem) {
        totalZiaratCost += selectedZiaratItem.price * totalPersons;
      }
    }

    // Hotels
    hotelForms.forEach(form => {
      if (!form.hotelId) return;

      const selectedHotel = hotels.find(h => h.id.toString() === form.hotelId);
      if (!selectedHotel) return;

      const activePrice = getActivePriceForDates(selectedHotel, form.checkIn);
      if (!activePrice) return;

      totalHotelCost += (parseFloat(activePrice.price) || 0) * totalPersons * (parseInt(form.noOfNights || 0));
    });

    // Transport
    transportForms.forEach(form => {
      if (!form.transportSectorId || form.self) return;
      if (visaPrices.includesTransport) return;

      const selectedSector = transportSectors.find(s => s.id.toString() === form.transportSectorId);
      if (!selectedSector) return;

      totalTransportCost +=
        adults * (parseFloat(selectedSector.adault_price) || 0) +
        childs * (parseFloat(selectedSector.child_price) || 0) +
        infants * (parseFloat(selectedSector.infant_price) || 0);
    });

    // Multiple food forms
    foodForms.forEach(form => {
      if (!form.foodId || foodSelf) return;
      if (!form.foodId || form.self) return;

      const selectedFoodItem = foodPrices.find(f => f.id.toString() === form.foodId);
      if (totalPersons <= selectedFoodItem.min_pex) {
        totalFoodCost += selectedFoodItem.per_pex * totalPersons;
      }
    });

    // Multiple ziarat forms
    ziaratForms.forEach(form => {
      if (!form.ziaratId || ziaratSelf) return;
      if (!form.ziaratId || form.self) return;

      const selectedZiaratItem = ziaratPrices.find(z => z.id.toString() === form.ziaratId);
      if (selectedZiaratItem) {
        totalZiaratCost += selectedZiaratItem.price * totalPersons;
      }
    });

    // Final setCosts
    setCosts({
      queryNumber: costs.queryNumber,
      visaCost: totalVisaCost.toLocaleString(),
      hotelCost: totalHotelCost.toLocaleString(),
      transportCost: totalTransportCost.toLocaleString(),
      flightCost: flightCost.toLocaleString(),
      foodCost: totalFoodCost.toLocaleString(),
      ziaratCost: totalZiaratCost.toLocaleString(),
      totalCost: (
        totalVisaCost +
        totalHotelCost +
        totalTransportCost +
        flightCost +
        totalFoodCost +
        totalZiaratCost
      ).toLocaleString(),
    });
  };


  const [hotelForms, setHotelForms] = useState([{
    id: Date.now(),
    hotelId: "",
    roomType: "",
    sharingType: "Gender or Family",
    checkIn: "",
    checkOut: "",
    noOfNights: 0,
    specialRequest: ""
  }]);

  const [transportForms, setTransportForms] = useState([{
    id: Date.now(),
    transportType: "Company Shared Bus",
    transportSectorId: "",
    self: false
  }]);


  // Transport form handlers
  const updateTransportForm = (index, field, value) => {
    setTransportForms(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addTransportForm = () => {
    setTransportForms(prev => [...prev, {
      id: Date.now(),
      transportType: "Company Shared Bus",
      transportSectorId: "",
      withFullTransport: false,
      withOneSideTransport: false,
      self: false
    }]);
  };

  const removeTransportForm = (index) => {
    setTransportForms(prev => prev.filter((_, i) => i !== index));
  };

  // Render functions
  const renderHotelRoomTypeSelect = () => {
    if (!formData.hotelId) {
      return (
        <input
          type="text"
          className="form-control shadow-none"
          value="Select hotel first"
          readOnly
        />
      );
    }

    // Find the selected hotel
    const selectedHotel = hotels.find(
      (hotel) => hotel.id.toString() === formData.hotelId
    );

    if (
      !selectedHotel ||
      !selectedHotel.prices ||
      selectedHotel.prices.length === 0
    ) {
      return (
        <input
          type="text"
          className="form-control  shadow-none"
          value="No room types available"
          readOnly
        />
      );
    }

    // Get unique room types from all prices, excluding "Only-Room"
    let roomTypes = [
      ...new Set(
        selectedHotel.prices
          .map((price) => price.room_type)
          .filter((type) => type !== "Only-Room") // Filter out "Only-Room"
      ),
    ];

    // If no room types left after filtering, show a message
    if (roomTypes.length === 0) {
      return (
        <input
          type="text"
          className="form-control shadow-none"
          value="No available room types"
          readOnly
        />
      );
    }

    return (
      <select
        className="form-select shadow-none"
        value={formData.roomType}
        onChange={(e) => handleInputChange("roomType", e.target.value)}
      >
        <option value="">Select Room Type</option>
        {roomTypes.map((roomType, index) => (
          <option key={index} value={roomType}>
            {roomType}
          </option>
        ))}
      </select>
    );
  };

  const renderTransportSectorSelect = (transportType) => {
    // Filter sectors based on selected transport type
    const filteredSectors = filteredTransportSectors.filter(
      sector => sector.vehicle_type === transportType
    );

    return (
      <select
        className="form-select shadow-none"
        value={formData.transportSectorId}
        disabled={formData.self || loading.transport}
        onChange={(e) => handleInputChange("transportSectorId", e.target.value)}
      >
        <option value="">Select Transport Sector</option>
        {loading.transport ? (
          <option>Loading transport sectors...</option>
        ) : filteredSectors.length === 0 ? (
          <option>No transport sectors available</option>
        ) : (
          filteredSectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name} ({sector.vehicle_type})
            </option>
          ))
        )}
      </select>
    );
  };

  const renderTransportTypeSelect = () => (
    <select
      className="form-select shadow-none"
      value={formData.transportType}
      disabled={formData.self}
      onChange={(e) => {
        handleInputChange("transportType", e.target.value);
        // Reset transport sector when type changes
        handleInputChange("transportSectorId", "");
      }}
    >
      <option value="">Select Transport Type</option>
      {[...new Set(filteredTransportSectors.map((s) => s.vehicle_type))].map(
        (type) => (
          <option key={type} value={type}>
            {type}
          </option>
        )
      )}
    </select>
  );

  const renderTransportPriceInfo = () => {
    if (!formData.transportSectorId || formData.self) return null;

    const baseCost =
      (parseInt(formData.totalAdults || 0) * transportSectorPrices.adultPrice) +
      (parseInt(formData.totalChilds || 0) * transportSectorPrices.childPrice) +
      (parseInt(formData.totalInfants || 0) * transportSectorPrices.infantPrice);

    const appliedCost = formData.withFullTransport
      ? baseCost
      : formData.withOneSideTransport
        ? baseCost * 0.5
        : 0;

    return (
      <div className="row mt-3">
        <div className="col-md-3">
          <div className="alert alert-info p-2">
            <small>
              Adult Transport: Rs.{" "}
              {transportSectorPrices.adultPrice.toLocaleString()}
            </small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="alert alert-info p-2">
            <small>
              Child Transport: Rs.{" "}
              {transportSectorPrices.childPrice.toLocaleString()}
            </small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="alert alert-info p-2">
            <small>
              Infant Transport: Rs.{" "}
              {transportSectorPrices.infantPrice.toLocaleString()}
            </small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="alert alert-warning p-2">
            <small>
              Applied Transport: Rs.{" "}
              {appliedCost.toLocaleString()}
              <br />
              {formData.withFullTransport
                ? "(Full transport)"
                : formData.withOneSideTransport
                  ? "(One-side transport - 50%)"
                  : "(No transport selected)"}
            </small>
          </div>
        </div>
      </div>
    );
  };

  const renderVisaPriceInfo = () => {
    const visaPrices = calculateVisaPrices();

    // Only show if visa prices are being added
    if (!formData.addVisaPrice && !formData.onlyVisa) return null;

    return (
      <div className="row mt-3">
        <div className="col-md-4">
          <div className="alert alert-info p-2">
            <small>
              Adult Visa: Rs. {visaPrices.adultPrice.toLocaleString()}
              <br />
              <small>Type: {visaPrices.visaType}</small>
            </small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="alert alert-info p-2">
            <small>
              Child Visa: Rs. {visaPrices.childPrice.toLocaleString()}
            </small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="alert alert-info p-2">
            <small>
              Infant Visa: Rs. {visaPrices.infantPrice.toLocaleString()}
              <br />
              <small>
                Includes Transport: {visaPrices.includesTransport ? "Yes" : "No"}
              </small>
            </small>
          </div>
        </div>
      </div>
    );
  };

  const [showViewModal, setShowViewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to show all details in modal
  // const handleViewClick = () => {
  //   if (!validateForm()) {
  //     return;
  //   }
  //   setShowViewModal(true);
  // };

  const handleViewClick = async () => {
    if (!validateForm()) {
      return;
    }

    // Force state updates to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    // Recalculate everything before showing modal
    const prices = calculateVisaPrices();
    setCalculatedVisaPrices(prices);
    calculateCosts();

    setShowViewModal(true);
  };

  // Function to close view modal
  const handleCloseViewModal = () => {
    setShowViewModal(false);
  };

  // const storedAgency = localStorage.getItem("agencyInfo");
  // const storedAgencyId = parseInt(localStorage.getItem("agencyId"), 10);
  // const storedAgencyId = localStorage.getItem("agencyId");


  // Function to submit data to API
  const handleAddToCalculations = async () => {
    setIsSubmitting(true);
    try {
      const visaPrices = calculateVisaPrices();
      // const agentInfo = JSON.parse(agentData);

      // let agencyId = null;
      const agencyId = localStorage.getItem("agencyId");
      const agentId = localStorage.getItem("agencyId");
      // if (storedAgencyId) {
      //   const parsedData = JSON.parse(storedAgencyId);
      //   agencyId = Number(parsedData.id); // convert to number
      //   // console.log(agencyId);
      // }

      // Prepare hotel details
      const hotelDetails = hotelForms
        .filter(form => form.hotelId)
        .map(form => {
          const selectedHotel = hotels.find(h => h.id.toString() === form.hotelId);
          const activePrice = getActivePriceForDates(selectedHotel, form.checkIn);

          return {
            room_type: form.roomType,
            quantity: parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0),
            sharing_type: form.sharingType,
            check_in_time: form.checkIn,
            check_out_time: form.checkOut,
            number_of_nights: parseInt(form.noOfNights || 0),
            special_request: form.specialRequest,
            price: activePrice?.price || 0,
            hotel: parseInt(form.hotelId)
          };
        });

      // Prepare transport details
      const transportDetails = transportForms
        .filter(form => form.transportSectorId && !form.self)
        .map(form => {
          const selectedSector = transportSectors.find(
            s => s.id.toString() === form.transportSectorId
          );

          return {
            vehicle_type: form.transportType,
            transport_sector: parseInt(form.transportSectorId),
            price: selectedSector ?
              (parseInt(formData.totalAdults || 0) * selectedSector.adault_price +
                parseInt(formData.totalChilds || 0) * selectedSector.child_price +
                parseInt(formData.totalInfants || 0) * selectedSector.infant_price) : 0
          };
        });

      // Prepare food details from all food forms
      const foodDetails = foodForms
        .filter(form => form.foodId && !foodSelf)
        .map(form => {
          const selectedFoodItem = foodPrices.find(food => food.id.toString() === form.foodId);
          return {
            food: selectedFoodItem?.id || 0,
            price: selectedFoodItem?.per_pex || 0,
            min_persons: selectedFoodItem?.min_pex || 0,
            total_persons: parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0)
          };
        });

      // Prepare ziarat details from all ziarat forms
      const ziaratDetails = ziaratForms
        .filter(form => form.ziaratId && !ziaratSelf)
        .map(form => {
          const selectedZiaratItem = ziaratPrices.find(ziarat => ziarat.id.toString() === form.ziaratId);
          return {
            ziarat: selectedZiaratItem?.id || 0,
            price: selectedZiaratItem?.price || 0,
            contact_person: selectedZiaratItem?.contact_person || "",
            contact_number: selectedZiaratItem?.contact_number || ""
          };
        });

      const payload = {
        hotel_details: hotelDetails,
        transport_details: transportDetails,
        ticket_details: selectedFlight ? [{ ticket: selectedFlight.id }] : [],
        food_details: foodDetails,
        ziarat_details: ziaratDetails,
        total_adaults: parseInt(formData.totalAdults || 0),
        total_children: parseInt(formData.totalChilds || 0),
        total_infants: parseInt(formData.totalInfants || 0),
        child_visa_price: visaPrices.childPrice,
        infant_visa_price: visaPrices.infantPrice,
        adault_visa_price: visaPrices.adultPrice,
        long_term_stay: formData.longTermVisa,
        only_visa: formData.onlyVisa,
        margin: formData.margin,
        total_cost: parseInt(costs.totalCost.replace(/,/g, "") || 0),
        organization: orgId,
        status: "Custom Umrah Package",
        agent: null,  // Set agent ID from logged-in user
        agency: agencyId || 0  // Set agency ID from logged-in user
      };

      let response;
      if (costs.queryNumber) {
        // Update existing package
        response = await axios.put(
          `http://127.0.0.1:8000/api/custom-umrah-packages/${costs.queryNumber}/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Package updated successfully!");
      } else {
        // Create new package
        response = await axios.post(
          `http://127.0.0.1:8000/api/custom-umrah-packages/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Package added to calculations successfully!");
      }

      const packageId = response.data.id;
      setCurrentPackageId(packageId);
      setCosts(prev => ({
        ...prev,
        queryNumber: packageId.toString(),
      }));

      // Refresh the packages list
      await fetchCustomPackages();
      setShowViewModal(false);
    } catch (error) {
      console.error("Error submitting package:", error);
      toast.error(`Failed to ${costs.queryNumber ? 'update' : 'add'} package`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modify the handleEditCalculation to work with selected package
  const handleEditCalculation = async (packageId) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/custom-umrah-packages/${packageId}/?organization=${orgId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const packageData = response.data;
      setSelectedPackage(packageData);

      // Set basic form data
      setFormData(prev => ({
        ...prev,
        totalAdults: packageData.total_adaults || 0,
        totalChilds: packageData.total_children || 0,
        totalInfants: packageData.total_infants || 0,
        addVisaPrice: packageData.adault_visa_price > 0 ||
          packageData.child_visa_price > 0 ||
          packageData.infant_visa_price > 0,
        longTermVisa: packageData.long_term_stay || false,
        onlyVisa: packageData.only_visa || false,
        margin: packageData.margin || "",
        withOneSideTransport: packageData.is_one_side_transport || false,
        withFullTransport: packageData.is_full_transport || false,
      }));

      // Set hotel forms
      if (packageData.hotel_details?.length > 0) {
        setHotelForms(packageData.hotel_details.map(hotel => ({
          id: hotel.id || Date.now(),
          hotelId: hotel.hotel?.toString() || "",
          hotelName: hotels.find(h => h.id === hotel.hotel)?.name || "",
          roomType: hotel.room_type || "",
          sharingType: hotel.sharing_type || "Gender or Family",
          checkIn: hotel.check_in_time?.split('T')[0] || "",
          checkOut: hotel.check_out_time?.split('T')[0] || "",
          noOfNights: hotel.number_of_nights || 0,
          specialRequest: hotel.special_request || "Haraam View",
          price: hotel.price || 0
        })));
      }

      // Set transport forms
      if (packageData.transport_details?.length > 0) {
        setTransportForms(packageData.transport_details.map(transport => ({
          id: transport.id || Date.now(),
          transportType: transport.vehicle_type || "Company Shared Bus",
          transportSectorId: transport.transport_sector?.toString() || "",
          self: false,
          price: transport.price || 0
        })));
      }

      // Set flight data if exists
      if (packageData.ticket_details?.length > 0) {
        try {
          const flightResponse = await axios.get(
            `http://127.0.0.1:8000/api/tickets/${packageData.ticket_details[0].ticket}/?organization=${orgId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setSelectedFlight(flightResponse.data);
          setFlightOptions("select");
        } catch (error) {
          console.error("Error fetching flight details:", error);
          setSelectedFlight(null);
          setFlightOptions("select");
        }
      }

      // Set food forms
      if (packageData.food_details?.length > 0) {
        setFoodForms(packageData.food_details.map(food => ({
          id: food.id || Date.now(),
          foodId: food.food?.toString() || "",
          price: food.price || 0,
          minPersons: food.min_persons || 0
        })));
        setFoodSelf(false);
      }

      // Set ziarat forms
      if (packageData.ziarat_details?.length > 0) {
        setZiaratForms(packageData.ziarat_details.map(ziarat => ({
          id: ziarat.id || Date.now(),
          ziaratId: ziarat.ziarat?.toString() || "",
          price: ziarat.price || 0,
          contactPerson: ziarat.contact_person || "",
          contactNumber: ziarat.contact_number || ""
        })));
        setZiaratSelf(false);
      }

      // Set visa type if applicable
      if (packageData.adault_visa_price > 0 || packageData.child_visa_price > 0 || packageData.infant_visa_price > 0) {
        const visaType = visaTypes.find(type =>
          type.adult_price === packageData.adault_visa_price &&
          type.child_price === packageData.child_visa_price &&
          type.infant_price === packageData.infant_visa_price
        );
        if (visaType) {
          setFormData(prev => ({
            ...prev,
            visaTypeId: visaType.id.toString()
          }));
        }
      }

      // Update costs to match the package
      setCosts({
        queryNumber: packageData.id.toString(),
        visaCost: (
          (packageData.adault_visa_price || 0) * (packageData.total_adaults || 0) +
          (packageData.child_visa_price || 0) * (packageData.total_children || 0) +
          (packageData.infant_visa_price || 0) * (packageData.total_infants || 0)
        ).toLocaleString(),
        hotelCost: packageData.hotel_details?.reduce((sum, hotel) => sum + (hotel.price || 0), 0).toLocaleString() || "0",
        transportCost: packageData.transport_details?.reduce((sum, transport) => sum + (transport.price || 0), 0).toLocaleString() || "0",
        flightCost: (selectedFlight ?
          ((selectedFlight.adult_price || 0) * (packageData.total_adaults || 0) +
            (selectedFlight.child_price || 0) * (packageData.total_children || 0) +
            (selectedFlight.infant_price || 0) * (packageData.total_infants || 0)
          ).toLocaleString() : "0"),
        foodCost: packageData.food_details?.reduce((sum, food) => sum + (food.price || 0), 0).toLocaleString() || "0",
        ziaratCost: packageData.ziarat_details?.reduce((sum, ziarat) => sum + (ziarat.price || 0), 0).toLocaleString() || "0",
        totalCost: packageData.total_cost?.toLocaleString() || "0"
      });

      toast.success("Package data loaded for editing");
    } catch (error) {
      console.error("Error fetching package:", error);
      toast.error("Failed to load package for editing");
    }
  };

  // Function to handle the PUT (update) request
  const handleUpdatePackage = async () => {
    try {
      const visaPrices = calculateVisaPrices();
      const agencyId = localStorage.getItem("agencyId") ? JSON.parse(localStorage.getItem("agencyId")).id : null;

      // Prepare the payload according to your API structure
      const payload = {
        hotel_details: hotelForms
          .filter(form => form.hotelId)
          .map(form => ({
            id: form.id, // Include ID for existing records
            room_type: form.roomType,
            quantity: parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0),
            sharing_type: form.sharingType,
            check_in_time: form.checkIn,
            check_out_time: form.checkOut,
            number_of_nights: parseInt(form.noOfNights || 0),
            special_request: form.specialRequest,
            price: form.price || 0,
            hotel: parseInt(form.hotelId)
          })),

        transport_details: transportForms
          .filter(form => form.transportSectorId && !form.self)
          .map(form => ({
            id: form.id, // Include ID for existing records
            vehicle_type: form.transportType,
            transport_sector: parseInt(form.transportSectorId),
            price: form.price || 0
          })),

        ticket_details: selectedFlight ? [{
          ticket: selectedFlight.id
        }] : [],

        food_details: foodForms
          .filter(form => form.foodId && !foodSelf)
          .map(form => {
            const foodItem = foodPrices.find(f => f.id.toString() === form.foodId);
            return {
              id: form.id, // Include ID for existing records
              food: foodItem?.id || 0,
              price: foodItem?.per_pex || 0,
              min_persons: foodItem?.min_pex || 0,
              total_persons: parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0)
            };
          }),

        ziarat_details: ziaratForms
          .filter(form => form.ziaratId && !ziaratSelf)
          .map(form => {
            const ziaratItem = ziaratPrices.find(z => z.id.toString() === form.ziaratId);
            return {
              id: form.id, // Include ID for existing records
              ziarat: ziaratItem?.id || 0,
              price: ziaratItem?.price || 0,
              contact_person: ziaratItem?.contact_person || "",
              contact_number: ziaratItem?.contact_number || ""
            };
          }),

        total_adaults: parseInt(formData.totalAdults || 0),
        total_children: parseInt(formData.totalChilds || 0),
        total_infants: parseInt(formData.totalInfants || 0),
        child_visa_price: visaPrices.childPrice,
        infant_visa_price: visaPrices.infantPrice,
        adault_visa_price: visaPrices.adultPrice,
        long_term_stay: formData.longTermVisa,
        is_full_transport: formData.withFullTransport,
        is_one_side_transport: formData.withOneSideTransport,
        only_visa: formData.onlyVisa,
        status: "Custom Umrah Package",
        organization: orgId,
        agent: 1, // Set agent ID from logged-in user
        agency: agencyId || 0 // Set agency ID from logged-in user
      };

      // Make the PUT request
      const response = await axios.put(
        `http://127.0.0.1:8000/api/custom-umrah-packages/${costs.queryNumber}/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Package updated successfully!");
      return response.data;
    } catch (error) {
      console.error("Error updating package:", error);
      toast.error("Failed to update package");
      throw error;
    }
  };

  // Fetch custom packages for the logged-in agency
  const fetchCustomPackages = async () => {
    try {
      const agencyId = localStorage.getItem("agencyId") 
      console.log(agencyId);

      // if (!agencyId) return;

      const response = await axios.get(
        `http://127.0.0.1:8000/api/custom-umrah-packages/?agency=${agencyId}&organization=${orgId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCustomPackages(response.data || []);
      // console.log(response.data)
    } catch (error) {
      console.error("Error fetching custom packages:", error);
      toast.error("Failed to fetch packages");
    }
  };

  // Call this in useEffect to load packages on component mount
  useEffect(() => {
    fetchCustomPackages();
  }, []);

  const handleDeleteCalculation = async (packageId) => {
    if (!packageId) {
      toast.error("No package selected to delete");
      return;
    }

    if (window.confirm("Are you sure you want to delete this package?")) {
      try {
        await axios.delete(
          `http://127.0.0.1:8000/api/custom-umrah-packages/${packageId}/?organization=${orgId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Refresh the packages list
        await fetchCustomPackages();

        // If we deleted the currently selected package, reset the form
        if (costs.queryNumber === packageId.toString()) {
          resetForm();
        }

        toast.success("Package deleted successfully");
      } catch (error) {
        console.error("Error deleting package:", error);
        toast.error("Failed to delete package");
      }
    }
  };

  // Helper function to reset the form
  const resetForm = () => {
    setFormData({
      totalAdults: 0,
      totalChilds: 0,
      totalInfants: 0,
      addVisaPrice: false,
      longTermVisa: false,
      withOneSideTransport: false,
      withFullTransport: false,
      visaTypeId: "",
      onlyVisa: false,
      hotelId: "",
      hotelName: "",
      hotelData: null,
      roomType: "",
      sharingType: "Gender or Family",
      checkIn: "",
      checkOut: "",
      noOfNights: 0,
      specialRequest: "Haraam View",
      transportType: "Company Shared Bus",
      transportSector: "",
      transportSectorId: "",
      self: false,
      margin: "",
    });

    setCosts({
      queryNumber: "",
      visaCost: "0",
      hotelCost: "0",
      transportCost: "0",
      flightCost: "0",
      foodCost: "0",
      ziaratCost: "0",
      totalCost: "0",
    });

    setSelectedFlight(null);
    setHotelForms([{
      id: Date.now(),
      hotelId: "",
      roomType: "",
      sharingType: "Gender or Family",
      checkIn: "",
      checkOut: "",
      noOfNights: 0,
      specialRequest: "Haraam View"
    }]);

    setTransportForms([{
      id: Date.now(),
      transportType: "Company Shared Bus",
      transportSectorId: "",
      self: false
    }]);

    setCurrentPackageId(null);
  };


  const validateForm = () => {
    // Always require at least 1 adult
    if ((formData.totalAdults || formData.totalChilds || formData.totalInfants) <= 0) {
      toast.error("At least 1 Passenger is required");
      return false;
    }

    // Validate visa type selection when visa-related options are checked
    if ((formData.addVisaPrice || formData.onlyVisa) && !formData.visaTypeId) {
      toast.error("Visa Type is required when adding visa price or only visa");
      return false;
    }

    // Rule 1: If "Add Visa Price" is checked, both hotel and flight are required
    if (formData.addVisaPrice) {
      // Check if at least one hotel is selected
      const hasHotels = hotelForms.some(form => form.hotelId);
      if (!hasHotels) {
        toast.error("Hotel selection is required when adding visa price");
        return false;
      }

      // Check flight selection
      if (!selectedFlight && flightOptions !== "none") {
        toast.error("Flight selection is required when adding visa price");
        return false;
      }
    }

    // Rule 2: If "Only Visa" is checked, flight is required but hotel is optional
    if (formData.onlyVisa) {
      // Check flight selection
      if (!selectedFlight && flightOptions !== "none") {
        toast.error("Flight selection is required for only visa option");
        return false;
      }
      // Hotel is optional in this case, no validation needed
    }

    // Rule 3: If neither is checked, no specific requirements
    // (No additional validation needed)

    return true;
  };

  const calculateHotelCost = (form) => {
    const selectedHotel = hotels.find(h => h.id.toString() === form.hotelId);
    if (!selectedHotel) return { perNight: 0, total: 0 };

    const activePrice = getActivePriceForDates(selectedHotel, form.checkIn);
    if (!activePrice) return { perNight: 0, total: 0 };

    const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
    const perNight = activePrice.price;
    const total = perNight * totalPersons * parseInt(form.noOfNights || 0);

    return { perNight, total };
  };

  const calculateTransportCost = (form) => {
    const selectedSector = transportSectors.find(s => s.id.toString() === form.transportSectorId);
    if (!selectedSector) return 0;

    return (
      (parseInt(formData.totalAdults || 0) * selectedSector.adault_price) +
      (parseInt(formData.totalChilds || 0) * selectedSector.child_price) +
      (parseInt(formData.totalInfants || 0) * selectedSector.infant_price)
    );
  };

  const [riyalRate, setRiyalRate] = useState(null)

  // And update the fetchRiyalRate function:
  const fetchRiyalRate = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/riyal-rates/", {
        params: { organization: orgId },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Assuming the API returns an array, take the first item
      if (response.data && response.data.length > 0) {
        setRiyalRate(response.data[0]);
      } else {
        setRiyalRate(null);
      }
    } catch (error) {
      console.error("Error fetching Rates:", error);
      toast.error("Failed to fetch Rates");
      setRiyalRate(null);
    }
  }

  // Update the getConvertedPrice function:
  const getConvertedPrice = (price, currencyType) => {
    if (!riyalRate || !riyalRate.rate) return price;

    // Check if prices are already in PKR for this category
    const isPkr = riyalRate[`is_${currencyType}_pkr`];

    if (isPkr) {
      // Prices are already in PKR, no conversion needed
      return price;
    } else {
      // Prices are in SAR, convert to PKR
      return price * riyalRate.rate;
    }
  };

  // Also update formatPriceWithCurrency to handle null riyalRate:
  const formatPriceWithCurrency = (price, currencyType, showBoth = false) => {
    if (!riyalRate || !riyalRate.rate) {
      return `PKR ${price.toLocaleString()}`;
    }

    const isPkr = riyalRate[`is_${currencyType}_pkr`];

    if (isPkr) {
      return `PKR ${price.toLocaleString()}`;
    } else {
      if (showBoth) {
        return `SAR ${price.toLocaleString()} (PKR ${(price * riyalRate.rate).toLocaleString()})`;
      } else {
        return `PKR ${(price * riyalRate.rate).toLocaleString()}`;
      }
    }
  };

  const formatPriceWithCurrencyNetPrice = (price, currencyType, showBoth = false) => {
    if (!riyalRate || !riyalRate.rate) {
      return `PKR ${price.toLocaleString()}`;
    }

    const isPkr = riyalRate[`is_${currencyType}_pkr`];

    if (isPkr) {
      return price;
    } else {
      if (showBoth) {
        return (price * riyalRate.rate);
      } else {
        return (price * riyalRate.rate);
      }
    }
  };

  const syncHotelDatesWithFlight = () => {
    if (formData.onlyVisa) return;
    if (!selectedFlight) return;

    try {
      const departureTrip = selectedFlight.trip_details?.find(
        t => t.trip_type?.toLowerCase() === "departure"
      );
      const returnTrip = selectedFlight.trip_details?.find(
        t => t.trip_type?.toLowerCase() === "return"
      );


      if (!departureTrip || !returnTrip) {
        toast.error("Flight dates are incomplete.");
        return;
      }

      const departureDate = new Date(departureTrip.departure_date_time);
      const returnDate = new Date(returnTrip.arrival_date_time);

      if (isNaN(departureDate) || isNaN(returnDate)) {
        toast.error("Invalid flight date format.");
        return;
      }

      if (returnDate <= departureDate) {
        toast.error("Return date must be after departure date.");
        return;
      }

      const nights = Math.ceil(
        (returnDate - departureDate) / (1000 * 60 * 60 * 24)
      );

      // Update main form data
      setFormData(prev => ({
        ...prev,
        checkIn: departureDate.toISOString().split("T")[0],
        checkOut: returnDate.toISOString().split("T")[0],
        noOfNights: nights > 0 ? nights : 0
      }));

      // Sync hotel forms as well
      setHotelForms(prev => {
        if (prev.length === 0) return prev;

        const updated = [...prev];

        // First hotel gets check-in = flight departure
        updated[0] = {
          ...updated[0],
          checkIn: departureDate.toISOString().split("T")[0]
        };

        // Last hotel gets check-out = flight return
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          checkOut: returnDate.toISOString().split("T")[0]
        };

        return updated;
      });
    } catch (err) {
      console.error("Error syncing hotel dates with flight:", err);
      toast.error("Failed to sync hotel dates with flight.");
    }
  };


  // Call this when a flight is selected
  useEffect(() => {
    if (selectedFlight && hotelForms.length > 0) {
      syncHotelDatesWithFlight();
    }
  }, [selectedFlight]);

  // Update the hotel form handlers to ensure date consistency
  const updateHotelForm = (index, field, value) => {
    setHotelForms(prev => {
      const updated = [...prev];

      // If updating check-in date, validate it's not in the past
      if (field === 'checkIn') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          toast.error("Check-in date cannot be in the past");
          return prev;
        }

        // If this is not the first hotel, check if check-in matches previous hotel's check-out
        if (index > 0 && updated[index - 1].checkOut && value !== updated[index - 1].checkOut) {
          toast.error(`Check-in must match previous hotel's check-out date (${updated[index - 1].checkOut})`);
          return prev;
        }
      }

      // If updating check-out date, validate it's after check-in and not in the past
      if (field === 'checkOut') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          toast.error("Check-out date cannot be in the past");
          return prev;
        }

        if (updated[index].checkIn && new Date(value) <= new Date(updated[index].checkIn)) {
          toast.error("Check-out date must be after check-in date");
          return prev;
        }

        // Update next hotel's check-in if it exists
        if (index < prev.length - 1) {
          updated[index + 1] = {
            ...updated[index + 1],
            checkIn: value
          };
        }
      }

      updated[index] = { ...updated[index], [field]: value };

      // If room type changes to non-Sharing, disable sharing type
      if (field === 'roomType' && value !== 'Sharing') {
        updated[index].sharingType = 'Gender or Family';
      }

      return updated;
    });
  };

  const addHotelForm = () => {
    setHotelForms(prev => {
      const newHotel = {
        id: Date.now(),
        hotelId: "",
        roomType: "",
        sharingType: "Gender or Family",
        checkIn: prev.length > 0 ? prev[prev.length - 1].checkOut : "",
        checkOut: "",
        noOfNights: 0,
        specialRequest: "Haraam View"
      };

      return [...prev, newHotel];
    });
  };


  const removeHotelForm = (index) => {
    setHotelForms(prev => prev.filter((_, i) => i !== index));
  };

  const renderHotelForm = (form, index) => (
    <div key={form.id} className="pb-3 mb-3">
      <div className="d-flex justify-content-between">
        <h5 className="mb-3 fw-semibold">Hotel Details {index + 1}</h5>
        <div>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => removeHotelForm(index)}
            disabled={hotelForms.length <= 1}
          >
            Remove
          </button>
        </div>
      </div>
      <div className="row">
        <div className="col-md-2 mb-3">
          <label htmlFor="" className="Control-label">Hotel Name</label>
          <select
            className="form-select shadow-none"
            value={form.hotelId}
            onChange={(e) => updateHotelForm(index, 'hotelId', e.target.value)}
            disabled={loading.hotels}
          >
            <option value="">Select Hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
            ))}
          </select>
        </div>
        {/* <div className="col-md-2 mb-3">
          <label htmlFor="" className="Control-label">Quantity</label>
          <input
            type="number"
            className="form-control shadow-none"
            placeholder="quantity"
          />
        </div> */}
        <div className="col-md-2 mb-3">
          <label htmlFor="" className="Control-label">Room Type</label>
          <select
            className="form-select shadow-none"
            value={form.roomType}
            onChange={(e) => updateHotelForm(index, 'roomType', e.target.value)}
          >
            <option value="">Select Room Type</option>
            {form.hotelId && hotels.find(h => h.id.toString() === form.hotelId)?.prices
              ?.filter(price => price.room_type !== "Only-Room")
              .map((price, i) => (
                <option key={i} value={price.room_type}>{price.room_type}</option>
              ))}
          </select>
        </div>
        <div className="col-md-2 mb-3">
          <label htmlFor="" className="Control-label">Sharing Type</label>
          <select
            className="form-select shadow-none"
            value={form.sharingType}
            onChange={(e) => updateHotelForm(index, 'sharingType', e.target.value)}
            disabled={form.roomType !== "Sharing"} // Disable if room type is not Sharing
          >
            <option value="Gender or Family">Gender or Family</option>
            <option value="Male Only">Male Only</option>
            <option value="Female Only">Female Only</option>
            <option value="Family Only">Family Only</option>
          </select>
        </div>
        <div className="col-md-2 mb-3">
          <label htmlFor="" className="Control-label">Check In</label>
          <input
            type="date"
            className="form-control shadow-none"
            value={form.checkIn}
            min={new Date().toISOString().split('T')[0]} // Set min to today
            onChange={(e) => {
              updateHotelForm(index, 'checkIn', e.target.value);
              if (e.target.value && form.noOfNights) {
                const checkOut = new Date(e.target.value);
                checkOut.setDate(checkOut.getDate() + parseInt(form.noOfNights));
                updateHotelForm(index, 'checkOut', checkOut.toISOString().split('T')[0]);
              }
            }}
          />
        </div>
        <div className="col-md-2 mb-3">
          <label htmlFor="" className="Control-label">No. of Night</label>
          <input
            type="number"
            className="form-control shadow-none"
            value={form.noOfNights}
            onChange={(e) => {
              updateHotelForm(index, 'noOfNights', e.target.value);
              if (e.target.value && form.checkIn) {
                const checkOut = new Date(form.checkIn);
                checkOut.setDate(checkOut.getDate() + parseInt(e.target.value));
                updateHotelForm(index, 'checkOut', checkOut.toISOString().split('T')[0]);
              }
            }}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-2 mb-3">
          <label htmlFor="" className="Control-label">Check Out</label>
          <input
            type="date"
            className="form-control shadow-none"
            value={form.checkOut}
            min={form.checkIn || new Date().toISOString().split('T')[0]} // Set min to check-in date or today
            onChange={(e) => {
              updateHotelForm(index, 'checkOut', e.target.value);
              if (e.target.value && form.checkIn) {
                const checkIn = new Date(form.checkIn);
                const checkOut = new Date(e.target.value);
                const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                updateHotelForm(index, 'noOfNights', nights > 0 ? nights : 0);
              }
            }}
          />
        </div>
        <div className="col-md-2 mb-3">
          <label htmlFor="" className="Control-label">Special Request</label>
          <input
            type="text"
            className="form-control shadow-none"
            placeholder="Haraam View"
            value={form.specialRequest}
            onChange={(e) => updateHotelForm(index, 'specialRequest', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  // Helper function to get room capacity based on room type
  const getRoomCapacity = (roomType) => {
    switch (roomType) {
      case "Single":
        return 1;
      case "Double":
      case "Double Bed":
        return 2;
      case "Triple":
      case "Triple Bed":
        return 3;
      case "Quad":
      case "Quad Bed":
        return 4;
      case "Quint":
      case "Quint Bed":
        return 5;
      case "Sharing":
        return 0; // Special case for sharing
      default:
        // Try to extract number from room type name (e.g., "3 Bed" -> 3)
        const match = roomType.match(/\d+/);
        return match ? parseInt(match[0]) : 1;
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        {/* Sidebar + Header Row */}
        <div className="row g-0">
          {/* Sidebar */}
          <div className="col-12 col-lg-2">
            <AgentSidebar />
          </div>

          {/* Main Content */}
          <div className="col-12 col-lg-10 ps-lg-5">
            {/* Header is now at top of main content */}
            <div className="container">
              <AgentHeader />

              <div className="px-3 mt-3 px-lg-4">
                {/* Navigation Tabs */}
                <div className="row ">
                  <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                    <nav className="nav flex-wrap gap-2">
                      {tabs.map((tab, index) => (
                        <NavLink
                          key={index}
                          to={tab.path}
                          className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Umrah Calculator"
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
                  <div className="min-vh-100 border  rounded-4 p-3">
                    <div className="card border-0 p-2">
                      <h4 className="mb-0 text-dark fw-bold">
                        Umrah Package Calculator
                      </h4>
                      <div className="card-body">
                        {/* Top Section - Counts */}
                        <div className="row mb-4">
                          <div className="col-md-3 mb-3">
                            <label htmlFor="" className="Control-label">Total Adults</label>
                            <input
                              type="number"
                              className="form-control bg-light shadow-none"
                              value={formData.totalAdults}
                              onChange={(e) =>
                                handleInputChange("totalAdults", e.target.value)
                              }
                            />
                          </div>
                          <div className="col-md-3 mb-3">
                            <label htmlFor="" className="Control-label">Total Childs</label>

                            <input
                              type="number"
                              className="form-control bg-light shadow-none"
                              value={formData.totalChilds}
                              onChange={(e) =>
                                handleInputChange("totalChilds", e.target.value)
                              }
                            />
                          </div>
                          <div className="col-md-3 mb-3">
                            <label htmlFor="" className="Control-label">Total Infants</label>

                            <input
                              type="number"
                              className="form-control bg-light shadow-none"
                              value={formData.totalInfants}
                              onChange={(e) =>
                                handleInputChange("totalInfants", e.target.value)
                              }
                            />
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
                          <div className="col-md-2 mb-2">
                            <div className="form-check d-flex align-items-center gap-2">
                              <input
                                className="form-check-input border border-black"
                                type="checkbox"
                                checked={formData.onlyVisa}
                                onChange={() => handleCheckboxChange("onlyVisa")}
                                id="onlyvisa"
                              />
                              <label htmlFor="onlyvisa">Only Visa</label>
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
                          {/* <div className="col-md-3">
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
                      <div className="form-check d-flex align-items-center gap-2">
                        <input
                          className="form-check-input border border-black"
                          type="checkbox"
                          checked={formData.withFullTransport}
                          onChange={() =>
                            handleCheckboxChange("withFullTransport")
                          }
                          id="withfulltransport"
                        />
                        <label htmlFor="withfulltransport">
                          With full transport
                        </label>
                      </div>
                    </div> */}
                        </div>
                        {renderVisaPriceInfo()}
                      </div>
                      {/* Hotel Details */}
                      {/* <div className="mb-4 mt-5">
                        {hotelForms.map((form, index) => (
                          <div key={form.id} className=" pb-3 mb-3">
                            <div className="d-flex justify-content-between">
                              <h5 className="mb-3 fw-semibold">Hotel Details{index + 1}</h5>
                              <div className="">
                                {index === hotelForms.length - 1 ? (
                                  <button
                                    id="btn" className="btn btn-sm w-100 py-2 px-3"
                                    onClick={addHotelForm}
                                  >
                                    Add Another Hotel
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-danger btn-sm w-100 py-2 px-3"
                                    onClick={() => removeHotelForm(index)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="row">
                              <div className="col-md-2 mb-3">
                                <label htmlFor="" className="Control-label">Hotel Name</label>
                                <select
                                  className="form-select shadow-none"
                                  value={form.hotelId}
                                  onChange={(e) => updateHotelForm(index, 'hotelId', e.target.value)}
                                  disabled={loading.hotels}
                                >
                                  <option value="">Select Hotel</option>
                                  {hotels.map((hotel) => (
                                    <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-2 mb-3">
                                <label htmlFor="" className="Control-label">Quantity</label>
                                <input
                                  type="number"
                                  className="form-control shadow-none"
                                  placeholder="quantity"
                                />
                              </div>
                              <div className="col-md-2 mb-3">
                                <label htmlFor="" className="Control-label">Room Type</label>

                                <select
                                  className="form-select shadow-none"
                                  value={form.roomType}
                                  onChange={(e) => updateHotelForm(index, 'roomType', e.target.value)}
                                >
                                  <option value="">Select Room Type</option>
                                  {form.hotelId && hotels.find(h => h.id.toString() === form.hotelId)?.prices
                                    ?.filter(price => price.room_type !== "Only-Room")
                                    .map((price, i) => (
                                      <option key={i} value={price.room_type}>{price.room_type}</option>
                                    ))}
                                </select>
                              </div>
                              <div className="col-md-2 mb-3">
                                <label htmlFor="" className="Control-label">Sharing Type</label>

                                <select
                                  className="form-select shadow-none"
                                  value={form.sharingType}
                                  onChange={(e) => updateHotelForm(index, 'sharingType', e.target.value)}
                                >
                                  <option value="Gender or Family">Gender or Family</option>
                                  <option value="Male Only">Male Only</option>
                                  <option value="Female Only">Female Only</option>
                                  <option value="Family Only">Family Only</option>
                                </select>
                              </div>
                              <div className="col-md-2 mb-3">
                                <label htmlFor="" className="Control-label">Check In</label>

                                <input
                                  type="date"
                                  className="form-control shadow-none"
                                  value={form.checkIn}
                                  onChange={(e) => {
                                    updateHotelForm(index, 'checkIn', e.target.value);
                                    if (e.target.value && form.noOfNights) {
                                      const checkOut = new Date(e.target.value);
                                      checkOut.setDate(checkOut.getDate() + parseInt(form.noOfNights));
                                      updateHotelForm(index, 'checkOut', checkOut.toISOString().split('T')[0]);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className="row">
                              <div className="col-md-2 mb-3">
                                <label htmlFor="" className="Control-label">No. of Night</label>

                                <input
                                  type="number"
                                  className="form-control shadow-none"
                                  value={form.noOfNights}
                                  onChange={(e) => {
                                    updateHotelForm(index, 'noOfNights', e.target.value);
                                    if (e.target.value && form.checkIn) {
                                      const checkOut = new Date(form.checkIn);
                                      checkOut.setDate(checkOut.getDate() + parseInt(e.target.value));
                                      updateHotelForm(index, 'checkOut', checkOut.toISOString().split('T')[0]);
                                    }
                                  }}
                                />
                              </div>
                              <div className="col-md-2 mb-3">
                                <label htmlFor="" className="Control-label">Check Out</label>

                                <input
                                  type="date"
                                  className="form-control shadow-none"
                                  value={form.checkOut}
                                  onChange={(e) => {
                                    updateHotelForm(index, 'checkOut', e.target.value);
                                    if (e.target.value && form.checkIn) {
                                      const checkIn = new Date(form.checkIn);
                                      const checkOut = new Date(e.target.value);
                                      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                                      updateHotelForm(index, 'noOfNights', nights > 0 ? nights : 0);
                                    }
                                  }}
                                />
                              </div>
                              <div className="col-md-2 mb-3">
                                <label htmlFor="" className="Control-label">Special Request</label>

                                <input
                                  type="text"
                                  className="form-control shadow-none"
                                  placeholder="Haraam View"
                                  value={form.specialRequest}
                                  onChange={(e) => updateHotelForm(index, 'specialRequest', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div> */}

                      <div className="mb-4 mt-5">
                        {hotelForms.map((form, index) => renderHotelForm(form, index))}
                        <button
                          id="btn" className="btn"
                          onClick={addHotelForm}
                        >
                          Add Another Hotel
                        </button>
                      </div>

                      {/* Transport Details */}
                      <div className="mb-4">
                        {transportForms.map((form, index) => (
                          <div key={form.id} className=" pb-3 mb-3">
                            <div className="d-flex justify-content-between">
                              <h5 className="mb-3 fw-semibold">Transport Details {index + 1}</h5>
                              <div className="d-flex align-items-center mb-3">
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => removeTransportForm(index)}
                                  disabled={transportForms.length <= 1}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label htmlFor="" className="Control-label">Transport Type</label>
                                <select
                                  className="form-select shadow-none"
                                  value={form.transportType}
                                  onChange={(e) => {
                                    updateTransportForm(index, 'transportType', e.target.value);
                                    updateTransportForm(index, 'transportSectorId', '');
                                  }}
                                  disabled={form.self}
                                >
                                  <option value="">Select Transport Type</option>
                                  {[...new Set(filteredTransportSectors.map(s => s.vehicle_type))].map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Transport Details */}

                              <div className="col-md-4 mb-3">
                                <label htmlFor="" className="Control-label">Transport Sector</label>

                                <select
                                  className="form-select shadow-none"
                                  value={form.transportSectorId}
                                  onChange={(e) => updateTransportForm(index, 'transportSectorId', e.target.value)}
                                  disabled={form.self || !form.transportType}
                                >
                                  <option value="">Select Sector</option>
                                  {filteredTransportSectors
                                    .filter(s => s.vehicle_type === form.transportType)
                                    .map(sector => (
                                      <option key={sector.id} value={sector.id}>
                                        {sector.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                              <div className="form-check col-md-2 d-flex align-items-center">
                                <input
                                  className="form-check-input border border-black me-2"
                                  type="checkbox"
                                  checked={form.self}
                                  onChange={(e) => updateTransportForm(index, 'self', e.target.checked)}
                                  style={{ width: "1.3rem", height: "1.3rem" }}
                                />
                                <label className="form-check-label">Self</label>
                              </div>
                            </div>
                            {form.transportSectorId && !form.self && (
                              <div className="row mt-3">
                                <div className="col-md-3">
                                  <div className="alert alert-info p-2">
                                    <small>
                                      Adult Transport: Rs.{" "}
                                      {transportSectors.find(s => s.id.toString() === form.transportSectorId)?.adault_price.toLocaleString()}
                                    </small>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="alert alert-info p-2">
                                    <small>
                                      Child Transport: Rs.{" "}
                                      {transportSectors.find(s => s.id.toString() === form.transportSectorId)?.child_price.toLocaleString()}
                                    </small>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="alert alert-info p-2">
                                    <small>
                                      Infant Transport: Rs.{" "}
                                      {transportSectors.find(s => s.id.toString() === form.transportSectorId)?.infant_price.toLocaleString()}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          id="btn" className="btn"
                          onClick={addTransportForm}
                        >
                          Add Another Route
                        </button>
                      </div>
                      {/* Flight Details Section */}
                      <div className="">
                        <div className="row">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-semibold">Flight Details</h5>
                            <div className="d-flex gap-3 align-items-center justify-content-between">
                              <select
                                className="form-select"
                                value={flightOptions}
                                onChange={(e) => {
                                  setFlightOptions(e.target.value);
                                  if (e.target.value === "none") {
                                    setWithoutFlight(true);
                                    resetFlightFields();
                                    setSelectedFlight(null);
                                  } else {
                                    setWithoutFlight(false);
                                  }
                                }}
                              >
                                <option value="select">Select Existing Flight</option>
                                <option value="custom">Create Custom Flight</option>
                                <option value="none">Without Flight</option>
                              </select>
                              {flightOptions === "select" && (
                                <button
                                  id="btn" className="btn px-3 py-2 w-100"
                                  onClick={() => setShowFlightModal(true)}
                                >
                                  Select Flight
                                </button>
                              )}
                              {flightOptions === "custom" && (
                                <button
                                  id="btn" className="btn px-3 py-2 w-100"
                                  onClick={() => setShowCustomTicketModal(true)}
                                >
                                  Create Custom Flight
                                </button>
                              )}
                            </div>
                          </div>
                          {selectedFlight && flightOptions === "select" && (
                            <div className="alert alert-info mb-4">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <strong>Selected Flight:</strong>{" "}
                                  {airlinesMap[selectedFlight.airline]?.name} - PNR:{" "}
                                  {selectedFlight.pnr} - Seats: {selectedFlight.seats}
                                </div>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => {
                                    setSelectedFlight(null);
                                    resetFlightFields();
                                  }}
                                >
                                  Change Flight
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <FlightModal
                        show={showFlightModal}
                        onClose={() => setShowFlightModal(false)}
                        flights={ticketsList}
                        onSelect={handleFlightSelect}
                        airlinesMap={airlinesMap}
                        citiesMap={citiesMap}
                      />
                      <CustomTicketModal
                        show={showCustomTicketModal}
                        onClose={() => setShowCustomTicketModal(false)}
                        onSubmit={(ticket) => {
                          setTicketId(ticket.id);
                          setSelectedFlight(ticket);
                          setFlightOptions("custom");
                          setShowCustomTicketModal(false);
                          toast.success("Custom ticket created successfully!");
                        }}
                      />

                      {/* Food Details */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-semibold">Food Details</h5>
                          <div className="d-flex gap-2">
                            <button
                              id="btn" className="btn"
                              onClick={() => {
                                setFoodForms([...foodForms, { id: Date.now(), foodId: "" }]);
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {foodForms.map((form, index) => (
                          <div key={form.id} className="row mb-3">
                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">Food</label>

                              <select
                                className="form-select shadow-none"
                                value={form.foodId}
                                onChange={(e) => {
                                  const updated = [...foodForms];
                                  updated[index].foodId = e.target.value;
                                  setFoodForms(updated);
                                }}
                                disabled={foodSelf || loading.food}
                              >
                                <option value="">Select Food</option>
                                {loading.food ? (
                                  <option>Loading food options...</option>
                                ) : foodPrices.length === 0 ? (
                                  <option>No food options available</option>
                                ) : (
                                  foodPrices
                                    .filter(food => food.active)
                                    .map((food) => (
                                      <option key={food.id} value={food.id}>
                                        {food.title} (Min {food.min_pex} persons)
                                      </option>
                                    ))
                                )}
                              </select>
                            </div>
                            <div className="form-check d-flex mt-3 align-items-center gap-2 col-md-2">
                              <input
                                className="form-check-input border border-black"
                                type="checkbox"
                                checked={foodSelf}
                                onChange={() => setFoodSelf(!foodSelf)}
                                id="foodSelf"
                              />
                              <label htmlFor="foodSelf">Self</label>
                            </div>
                            <div className="col-md-2 d-flex align-items-center">
                              {index === foodForms.length - 1 && foodForms.length > 1 ? (
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => {
                                    const updated = foodForms.filter((_, i) => i !== index);
                                    setFoodForms(updated);
                                  }}
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Ziarat Details */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-semibold">Ziarat Details</h5>
                          <div className="d-flex gap-2">

                            <button
                              id="btn" className="btn"
                              onClick={() => {
                                setZiaratForms([...ziaratForms, { id: Date.now(), ziaratId: "" }]);
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {ziaratForms.map((form, index) => (
                          <div key={form.id} className="row mb-3">
                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">Ziarat</label>

                              <select
                                className="form-select shadow-none"
                                value={form.ziaratId}
                                onChange={(e) => {
                                  const updated = [...ziaratForms];
                                  updated[index].ziaratId = e.target.value;
                                  setZiaratForms(updated);
                                }}
                                disabled={ziaratSelf || loading.ziarat}
                              >
                                <option value="">Select Ziarat</option>
                                {loading.ziarat ? (
                                  <option>Loading ziarat options...</option>
                                ) : ziaratPrices.length === 0 ? (
                                  <option>No ziarat options available</option>
                                ) : (
                                  ziaratPrices.map((ziarat) => (
                                    <option key={ziarat.id} value={ziarat.id}>
                                      {ziarat.Name}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>
                            <div className="form-check d-flex align-items-center gap-2 mt-3 col-md-2">
                              <input
                                className="form-check-input border border-black"
                                type="checkbox"
                                checked={ziaratSelf}
                                onChange={() => setZiaratSelf(!ziaratSelf)}
                                id="ziaratSelf"
                              />
                              <label htmlFor="ziaratSelf">Self</label>
                            </div>
                            <div className="col-md-2 d-flex align-items-center">
                              {index === ziaratForms.length - 1 && ziaratForms.length > 1 ? (
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => {
                                    const updated = ziaratForms.filter((_, i) => i !== index);
                                    setZiaratForms(updated);
                                  }}
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="row">
                        <div className="col-md-3 mb-3 mt-3">
                          <label htmlFor="" className="Control-label">Margin</label>
                          <input
                            type="text"
                            className="form-control shadow-none"
                            placeholder="Rs 30,000/."
                            value={formData.margin}
                            onChange={(e) =>
                              handleInputChange("margin", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="text-end mb-4 d-flex justify-content-end gap-5">
                        <button id="btn" className="btn" onClick={handleViewClick}>
                          View
                        </button>

                        <Modal show={showViewModal} onHide={handleCloseViewModal} size="xl">
                          <Modal.Header closeButton>
                            <Modal.Title>Package Details</Modal.Title>
                          </Modal.Header>
                          <Modal.Body>
                            <div className="d-flex gap-2 justify-content-end align-items-center">
                              <button className="btn btn-sm btn-outline-secondary">
                                <Printer /> Print
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={downloadModalAsPDF}
                              >
                                <Download size={"15px"} /> Download
                              </button>
                            </div>
                            <div className="p-3" ref={modalRef}>
                              {/* Pax Information */}
                              <h6 className="fw-bold mb-3">Pax Information</h6>
                              <div className="table-responsive mb-4">
                                <table className="table table-sm text-center">
                                  <thead className="">
                                    <tr>
                                      <th className="fw-normal">Passenger Name</th>
                                      <th className="fw-normal">Passport No</th>
                                      <th className="fw-normal">PAX</th>
                                      <th className="fw-normal">DOB</th>
                                      <th className="fw-normal">Total Pax</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* You would map through actual passenger data here */}
                                    <tr>
                                      <td>N/A</td>
                                      <td>N/A</td>
                                      <td>Adult</td>
                                      <td>N/A</td>
                                      <td>{formData.totalAdults || 0} Adult & {formData.totalChilds || 0} Child & {formData.totalInfants || 0} Infant</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Hotel Details */}
                              {hotelForms.filter(f => f.hotelId).length > 0 && (
                                <>
                                  <h6 className="fw-bold mb-3">Accommodation</h6>
                                  <div className="table-responsive mb-4">
                                    <table className="table table-sm text-center">
                                      <thead className=" ">
                                        <tr>
                                          <th className="fw-normal">Hotel Name</th>
                                          <th className="fw-normal">Type</th>
                                          <th className="fw-normal">Check-in</th>
                                          <th className="fw-normal">Nights</th>
                                          <th className="fw-normal">Check-Out</th>
                                          <th className="fw-normal">Rate</th>
                                          <th className="fw-normal">Quantity</th>
                                          <th className="fw-normal">Net</th>
                                          <th className="fw-normal">Riyal Rate</th>
                                          <th className="fw-normal">Net PKR</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {hotelForms.filter(f => f.hotelId).map((form, index) => {
                                          const hotel = hotels.find(h => h.id.toString() === form.hotelId);
                                          const hotelCost = calculateHotelCost(form);

                                          // Calculate quantity based on room type and passenger count
                                          const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                          let quantity = 0;

                                          if (form.roomType === "Sharing") {
                                            // For sharing, show total persons
                                            quantity = totalPersons;
                                          } else {
                                            // For other room types, calculate based on room capacity
                                            const roomCapacity = getRoomCapacity(form.roomType);
                                            if (roomCapacity > 0) {
                                              quantity = Math.ceil(totalPersons / roomCapacity);
                                            }
                                          }

                                          return (
                                            <tr key={index}>
                                              <td>{hotel?.name || 'N/A'}</td>
                                              <td>{form.roomType}</td>
                                              <td>{form.checkIn}</td>
                                              <td>{form.noOfNights}</td>
                                              <td>{form.checkOut}</td>
                                              <td>
                                                {riyalRate.is_hotel_pkr ? "PKR " : "SAR "}
                                                {hotelCost?.perNight}
                                              </td>
                                              <td>{quantity}</td>
                                              <td> {riyalRate.is_hotel_pkr ? "PKR " : "SAR "} {hotelCost?.total}</td>
                                              <td>
                                                {riyalRate.rate}
                                              </td>
                                              <td>
                                                {formatPriceWithCurrencyNetPrice(
                                                  hotelCost?.total || 0,
                                                  "hotel",
                                                  true
                                                )}
                                              </td>
                                            </tr>

                                          );
                                        })}
                                        <tr className="fw-bold">
                                          <td>Total</td>
                                          <td></td>
                                          <td></td>
                                          <td>{hotelForms.reduce((sum, form) => sum + parseInt(form.noOfNights || 0), 0)} </td>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                          <td>
                                            {formatPriceWithCurrencyNetPrice(
                                              hotelForms.filter(f => f.hotelId).reduce((total, form) => {
                                                const hotelCost = calculateHotelCost(form);
                                                return total + (hotelCost?.total || 0);
                                              }, 0),
                                              "hotel",
                                              true
                                            )}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    {/* <div className="d-flex justify-content-around px-5 align-items-center">
                                      <div>Total Accommodation:</div>
                                      <div>{hotelForms.reduce((sum, form) => sum + parseInt(form.noOfNights || 0), 0)} Nights</div>
                                      <div className="d-flex gap-5">
                                        <div>
                                          {formatPriceWithCurrencyNetPrice(
                                            hotelForms.filter(f => f.hotelId).reduce((total, form) => {
                                              const hotelCost = calculateHotelCost(form);
                                              return total + (hotelCost?.total || 0);
                                            }, 0),
                                            "hotel",
                                            true
                                          )}
                                        </div>
                                      </div>
                                    </div> */}
                                  </div>
                                </>
                              )}


                              {/* Visa Details */}
                              {(formData.addVisaPrice || formData.onlyVisa) && (
                                <>
                                  <h6 className="fw-bold row mb-3 ps-2">Umrah Visa & Tickets Rates Details</h6>
                                  <div className="table-responsive mb-4 col-md-6">
                                    <table className="table table-sm">
                                      <thead className="">
                                        <tr>
                                          <th>Pax</th>
                                          <th>Total Pax</th>
                                          <th>Visa Rate</th>
                                          <th>Ticket Rate</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {formData.totalAdults > 0 && (
                                          <tr>
                                            <td>Adult</td>
                                            <td>{formData.totalAdults}</td>
                                            <td>
                                              {formatPriceWithCurrency(
                                                calculatedVisaPrices.adultPrice || 0,
                                                "visa",
                                                true
                                              )}
                                            </td>
                                            <td> PKR{' '} {selectedFlight ? (
                                              (selectedFlight.adult_price || 0) * parseInt(formData.totalAdults || 0)
                                            ) : (
                                              0
                                            )}</td>
                                          </tr>
                                        )}
                                        {formData.totalChilds > 0 && (
                                          <tr>
                                            <td>Child</td>
                                            <td>{formData.totalChilds}</td>
                                            <td>
                                              {formatPriceWithCurrency(
                                                calculatedVisaPrices.childPrice || 0,
                                                "visa",
                                                true
                                              )}
                                            </td>
                                            <td>PKR{' '} {selectedFlight ? (
                                              (selectedFlight.child_price || 0) * parseInt(formData.totalChilds || 0)
                                            ) : (
                                              0
                                            )}</td>
                                          </tr>
                                        )}
                                        {formData.totalInfants > 0 && (
                                          <tr>
                                            <td>Infant</td>
                                            <td>{formData.totalInfants}</td>
                                            <td>
                                              {formatPriceWithCurrency(
                                                calculatedVisaPrices.infantPrice || 0,
                                                "visa",
                                                true
                                              )}
                                            </td>
                                            <td>PKR{' '} {selectedFlight ? (
                                              (selectedFlight.infant_price || 0) * parseInt(formData.totalInfants || 0)
                                            ) : (
                                              0
                                            )}</td>
                                          </tr>
                                        )}
                                        <tr className="fw-semibold">
                                          <td>Total</td>
                                          <td>{parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0) + parseInt(formData.totalInfants || 0)}</td>
                                          <td> {formatPriceWithCurrency(
                                            (calculatedVisaPrices.adultPrice || 0) * parseInt(formData.totalAdults || 0) +
                                            (calculatedVisaPrices.childPrice || 0) * parseInt(formData.totalChilds || 0) +
                                            (calculatedVisaPrices.infantPrice || 0) * parseInt(formData.totalInfants || 0),
                                            "visa",
                                            true
                                          )}</td>
                                          <td>
                                            PKR{' '}
                                            {
                                              selectedFlight ? (
                                                (selectedFlight.adult_price || 0) * parseInt(formData.totalAdults || 0) +
                                                (selectedFlight.child_price || 0) * parseInt(formData.totalChilds || 0) +
                                                (selectedFlight.infant_price || 0) * parseInt(formData.totalInfants || 0)
                                              ) : 0
                                            }
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    {/* <div className="d-flex justify-content-around align-items-center">
                                    <div>Total:</div>
                                    <div className="d-flex gap-5">
                                      <div>{parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0) + parseInt(formData.totalInfants || 0)} Persons</div>
                                      <div>
                                        {formatPriceWithCurrency(
                                          (calculatedVisaPrices.adultPrice || 0) * parseInt(formData.totalAdults || 0) +
                                          (calculatedVisaPrices.childPrice || 0) * parseInt(formData.totalChilds || 0) +
                                          (calculatedVisaPrices.infantPrice || 0) * parseInt(formData.totalInfants || 0),
                                          "visa",
                                          true
                                        )}
                                      </div>
                                    </div>
                                  </div> */}
                                  </div>
                                </>
                              )}

                              {/* Transport Details */}
                              {transportForms.filter(f => f.transportSectorId && !f.self).length > 0 && (
                                <>
                                  <h6 className="fw-bold mb-3">Transportation</h6>
                                  <div className="table-responsive mb-4">
                                    <table className="table table-sm">
                                      <thead className="">
                                        <tr>
                                          <th>Vehicle type</th>
                                          <th>Route</th>
                                          <th>Rate</th>
                                          <th>QTY</th>
                                          <th>Net</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {transportForms.filter(f => f.transportSectorId && !f.self).map((form, index) => {
                                          const sector = transportSectors.find(s => s.id.toString() === form.transportSectorId);
                                          const transportCost = calculateTransportCost(form);
                                          return (
                                            <tr key={index}>
                                              <td>{form.transportType}</td>
                                              <td>{sector?.name || 'N/A'}</td>
                                              <td>
                                                {formatPriceWithCurrency(
                                                  sector?.adault_price || 0,
                                                  "transport",
                                                  false
                                                )}
                                              </td>
                                              <td>{formData.totalAdults || 0} Adults, {formData.totalChilds || 0} Children</td>
                                              <td>
                                                {formatPriceWithCurrency(
                                                  transportCost || 0,
                                                  "transport",
                                                  true
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                    <div className="d-flex justify-content-around">
                                      <div>Total Transportation: </div>
                                      <div>
                                        {formatPriceWithCurrency(
                                          transportForms.filter(f => f.transportSectorId && !f.self).reduce((total, form) => {
                                            return total + calculateTransportCost(form);
                                          }, 0),
                                          "transport",
                                          true
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Food Details */}
                              {foodForms.filter(f => f.foodId && !foodSelf).length > 0 && (
                                <>
                                  <h6 className="fw-bold mb-3">Food Details</h6>
                                  <div className="table-responsive mb-4">
                                    <table className="table table-sm">
                                      <thead className="">
                                        <tr>
                                          <th>Food Option</th>
                                          <th>Price per Person</th>
                                          <th>Total Persons</th>
                                          <th>Net</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {foodForms.filter(f => f.foodId && !foodSelf).map((form, index) => {
                                          const foodItem = foodPrices.find(f => f.id.toString() === form.foodId);
                                          const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                          const foodCost = (foodItem?.per_pex || 0) * totalPersons;

                                          return (
                                            <tr key={index}>
                                              <td>{foodItem?.title || 'N/A'}</td>
                                              <td>
                                                {formatPriceWithCurrency(
                                                  foodItem?.per_pex || 0,
                                                  "food",
                                                  false
                                                )}
                                              </td>
                                              <td>{totalPersons}</td>
                                              <td>
                                                {formatPriceWithCurrency(
                                                  foodCost,
                                                  "food",
                                                  true
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                    <div className="d-flex justify-content-around">
                                      <div>Total Food Cost: </div>
                                      <div>
                                        {formatPriceWithCurrency(
                                          foodForms.filter(f => f.foodId && !foodSelf).reduce((total, form) => {
                                            const foodItem = foodPrices.find(f => f.id.toString() === form.foodId);
                                            const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                            return total + ((foodItem?.per_pex || 0) * totalPersons);
                                          }, 0),
                                          "food",
                                          true
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Ziarat Details */}
                              {ziaratForms.filter(f => f.ziaratId && !ziaratSelf).length > 0 && (
                                <>
                                  <h6 className="fw-bold mb-3">Ziarat Details</h6>
                                  <div className="table-responsive mb-4">
                                    <table className="table table-sm">
                                      <thead className="">
                                        <tr>
                                          <th>Ziarat Option</th>
                                          <th>Price per Person</th>
                                          <th>Total Persons</th>
                                          <th>Net</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {ziaratForms.filter(f => f.ziaratId && !ziaratSelf).map((form, index) => {
                                          const ziaratItem = ziaratPrices.find(z => z.id.toString() === form.ziaratId);
                                          const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                          const ziaratCost = (ziaratItem?.price || 0) * totalPersons;

                                          return (
                                            <tr key={index}>
                                              <td>{ziaratItem?.Name || 'N/A'}</td>
                                              <td>
                                                {formatPriceWithCurrency(
                                                  ziaratItem?.price || 0,
                                                  "ziarat",
                                                  false
                                                )}
                                              </td>
                                              <td>{totalPersons}</td>
                                              <td>
                                                {formatPriceWithCurrency(
                                                  ziaratCost,
                                                  "ziarat",
                                                  true
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                    <div className="d-flex justify-content-around">
                                      <div>Total Ziarat Cost: </div>
                                      <div>
                                        {formatPriceWithCurrency(
                                          ziaratForms.filter(f => f.ziaratId && !ziaratSelf).reduce((total, form) => {
                                            const ziaratItem = ziaratPrices.find(z => z.id.toString() === form.ziaratId);
                                            const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                            return total + ((ziaratItem?.price || 0) * totalPersons);
                                          }, 0),
                                          "ziarat",
                                          true
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Invoice Summary */}
                              <h6 className="fw-bold mb-3">Invoice Details</h6>
                              <div className="row">
                                <div className="col-lg-8 col-md-7 col-12 mb-3">
                                  {/* ... (booking date and travel dates) */}
                                </div>

                                <div className="col-lg-4 col-md-5 col-12">
                                  <div className="card border-0 h-100">
                                    <div className="card-body p-3">
                                      <div className="d-flex justify-content-between mb-2">
                                        <span>Total Pax:</span>
                                        <strong>
                                          {parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0) + parseInt(formData.totalInfants || 0)}
                                        </strong>
                                      </div>

                                      {/* Visa Cost */}
                                      {(formData.addVisaPrice || formData.onlyVisa) && (
                                        <div className="d-flex justify-content-between mb-2">
                                          <div>
                                            <span>Visa:</span>
                                            <span className="fw-bold ms-2">@{riyalRate.rate}</span>
                                          </div>
                                          <strong>
                                            {formatPriceWithCurrency(
                                              (calculatedVisaPrices.adultPrice || 0) * parseInt(formData.totalAdults || 0) +
                                              (calculatedVisaPrices.childPrice || 0) * parseInt(formData.totalChilds || 0) +
                                              (calculatedVisaPrices.infantPrice || 0) * parseInt(formData.totalInfants || 0),
                                              "visa",
                                              false
                                            )}
                                          </strong>
                                        </div>
                                      )}

                                      {/* Flight Cost */}
                                      {selectedFlight && (
                                        <div className="d-flex justify-content-between mb-2">
                                          <span>Tickets:</span>
                                          <strong> <span>PKR </span>
                                            {
                                              (selectedFlight.adult_price || 0) * parseInt(formData.totalAdults || 0) +
                                              (selectedFlight.child_price || 0) * parseInt(formData.totalChilds || 0) +
                                              (selectedFlight.infant_price || 0) * parseInt(formData.totalInfants || 0)
                                            }
                                          </strong>
                                        </div>
                                      )}

                                      {/* Hotel Cost */}
                                      {hotelForms.filter(f => f.hotelId).length > 0 && (
                                        <div className="d-flex justify-content-between mb-2">
                                          <div>
                                            <span>Hotel:</span>
                                            <span className="fw-bold ms-2">@{riyalRate.rate}</span>
                                          </div>
                                          <strong>
                                            {formatPriceWithCurrency(
                                              hotelForms.filter(f => f.hotelId).reduce((total, form) => {
                                                const hotelCost = calculateHotelCost(form);
                                                return total + (hotelCost?.total || 0);
                                              }, 0),
                                              "hotel",
                                              false
                                            )}
                                          </strong>
                                        </div>
                                      )}

                                      {/* Transport Cost */}
                                      {transportForms.filter(f => f.transportSectorId && !f.self).length > 0 && (
                                        <div className="d-flex justify-content-between mb-2">
                                          <div>
                                            <span>Transport:</span>
                                            <span className="fw-bold ms-2">@{riyalRate.rate}</span>
                                          </div>
                                          <strong>
                                            {formatPriceWithCurrency(
                                              transportForms.filter(f => f.transportSectorId && !f.self).reduce((total, form) => {
                                                return total + calculateTransportCost(form);
                                              }, 0),
                                              "transport",
                                              false
                                            )}
                                          </strong>
                                        </div>
                                      )}

                                      {/* Food Cost */}
                                      {foodForms.filter(f => f.foodId && !foodSelf).length > 0 && (
                                        <div className="d-flex justify-content-between mb-2">
                                          <div>
                                            <span>Food:</span>
                                            <span className="fw-bold ms-2">@{riyalRate.rate}</span>
                                          </div>
                                          <strong>
                                            {formatPriceWithCurrency(
                                              foodForms.filter(f => f.foodId && !foodSelf).reduce((total, form) => {
                                                const foodItem = foodPrices.find(f => f.id.toString() === form.foodId);
                                                const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                                return total + ((foodItem?.per_pex || 0) * totalPersons);
                                              }, 0),
                                              "food",
                                              false
                                            )}
                                          </strong>
                                        </div>
                                      )}

                                      {/* Ziarat Cost */}
                                      {ziaratForms.filter(f => f.ziaratId && !ziaratSelf).length > 0 && (
                                        <div className="d-flex justify-content-between mb-3">
                                          <div>
                                            <span>Ziarat:</span>
                                            <span className="fw-bold ms-2">@{riyalRate.rate}</span>
                                          </div>
                                          <strong>
                                            {formatPriceWithCurrency(
                                              ziaratForms.filter(f => f.ziaratId && !ziaratSelf).reduce((total, form) => {
                                                const ziaratItem = ziaratPrices.find(z => z.id.toString() === form.ziaratId);
                                                const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                                return total + ((ziaratItem?.price || 0) * totalPersons);
                                              }, 0),
                                              "ziarat",
                                              false
                                            )}
                                          </strong>
                                        </div>
                                      )}

                                      <hr />

                                      {/* Total Cost */}
                                      <div className="d-flex justify-content-between align-items-center py-2 px-3 text-white rounded-5" style={{ background: "#1B78CE" }}>
                                        <span><strong>Net PKR:</strong></span>
                                        {/* {formatPriceWithCurrency(
                                          // Visa cost
                                          ((formData.addVisaPrice || formData.onlyVisa) ? (
                                            (calculatedVisaPrices.adultPrice || 0) * parseInt(formData.totalAdults || 0) +
                                            (calculatedVisaPrices.childPrice || 0) * parseInt(formData.totalChilds || 0) +
                                            (calculatedVisaPrices.infantPrice || 0) * parseInt(formData.totalInfants || 0)
                                          ) : 0) +

                                          // Flight cost
                                          (selectedFlight ? (
                                            (selectedFlight.adult_price || 0) * parseInt(formData.totalAdults || 0) +
                                            (selectedFlight.child_price || 0) * parseInt(formData.totalChilds || 0) +
                                            (selectedFlight.infant_price || 0) * parseInt(formData.totalInfants || 0)
                                          ) : 0) +

                                          // Hotel cost
                                          hotelForms.filter(f => f.hotelId).reduce((total, form) => {
                                            const hotelCost = calculateHotelCost(form);
                                            return total + (hotelCost?.total || 0);
                                          }, 0) +

                                          // Transport cost
                                          transportForms.filter(f => f.transportSectorId && !f.self).reduce((total, form) => {
                                            return total + calculateTransportCost(form);
                                          }, 0) +

                                          // Food cost
                                          foodForms.filter(f => f.foodId && !foodSelf).reduce((total, form) => {
                                            const foodItem = foodPrices.find(f => f.id.toString() === form.foodId);
                                            const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                            return total + ((foodItem?.per_pex || 0) * totalPersons);
                                          }, 0) +

                                          // Ziarat cost
                                          ziaratForms.filter(f => f.ziaratId && !ziaratSelf).reduce((total, form) => {
                                            const ziaratItem = ziaratPrices.find(z => z.id.toString() === form.ziaratId);
                                            const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                            return total + ((ziaratItem?.price || 0) * totalPersons);
                                          }, 0),
                                          "total",
                                          false
                                        )} */}

                                        {(() => {
                                          // Flight cost (raw number)
                                          const flightCost = selectedFlight ? (
                                            (selectedFlight.adult_price || 0) * parseInt(formData.totalAdults || 0) +
                                            (selectedFlight.child_price || 0) * parseInt(formData.totalChilds || 0) +
                                            (selectedFlight.infant_price || 0) * parseInt(formData.totalInfants || 0)
                                          ) : 0;

                                          // Other costs (raw numbers - NOT formatted)
                                          const otherCosts =
                                            // Visa cost
                                            ((formData.addVisaPrice || formData.onlyVisa) ? (
                                              (calculatedVisaPrices.adultPrice || 0) * parseInt(formData.totalAdults || 0) +
                                              (calculatedVisaPrices.childPrice || 0) * parseInt(formData.totalChilds || 0) +
                                              (calculatedVisaPrices.infantPrice || 0) * parseInt(formData.totalInfants || 0)
                                            ) : 0) +

                                            // Hotel cost
                                            hotelForms.filter(f => f.hotelId).reduce((total, form) => {
                                              const hotelCost = calculateHotelCost(form);
                                              return total + (hotelCost?.total || 0);
                                            }, 0) +

                                            // Transport cost
                                            transportForms.filter(f => f.transportSectorId && !f.self).reduce((total, form) => {
                                              return total + calculateTransportCost(form);
                                            }, 0) +

                                            // Food cost
                                            foodForms.filter(f => f.foodId && !foodSelf).reduce((total, form) => {
                                              const foodItem = foodPrices.find(f => f.id.toString() === form.foodId);
                                              const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                              return total + ((foodItem?.per_pex || 0) * totalPersons);
                                            }, 0) +

                                            // Ziarat cost
                                            ziaratForms.filter(f => f.ziaratId && !ziaratSelf).reduce((total, form) => {
                                              const ziaratItem = ziaratPrices.find(z => z.id.toString() === form.ziaratId);
                                              const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                              return total + ((ziaratItem?.price || 0) * totalPersons);
                                            }, 0);

                                          // Net price - flightCost is already in PKR, just add to formatted otherCosts
                                          const formattedOtherCosts = formatPriceWithCurrencyNetPrice(otherCosts);
                                          const netPrice = flightCost + formattedOtherCosts;

                                          return (
                                            <strong>
                                              {netPrice}
                                            </strong>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Modal.Body>
                          <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseViewModal}>
                              Close
                            </Button>
                            {costs.queryNumber ? (
                              <Button
                                id="btn"
                                onClick={handleAddToCalculations}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? 'Updating...' : 'Update Package'}
                              </Button>
                            ) : (
                              <Button
                                id="btn"
                                onClick={handleAddToCalculations}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? 'Submitting...' : 'Add to Calculations'}
                              </Button>
                            )}
                          </Modal.Footer>
                        </Modal>

                      </div>
                    </div>
                  </div>

                  <div className="shadow-sm der rounded-4 p-4 mt-3 mb-4">
                    <div className="mb-4">
                      <ul className="nav nav-pills">
                        {buttonTabs.map((tab) => (
                          <li className="nav-item me-2" key={tab}>
                            <button
                              className={`nav-link ${activeTab === tab
                                ? "active"
                                : "btn-outline-secondary"
                                }`}
                              onClick={() => handleTabClick(tab)}
                              style={{
                                backgroundColor:
                                  activeTab === tab ? "#4169E1" : "#E1E1E1",
                                color: activeTab === tab ? "#FFFFFF" : "#667085",
                                border: "none",
                                borderRadius: "10px",
                                fontSize: "0.875rem",
                              }}
                            >
                              {tab}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="row">
                      <div className="table-responsive">
                        <table className="table">
                          <thead className="table-light">
                            <tr>
                              <th className="small">Query Number</th>
                              <th className="small">Adults</th>
                              <th className="small">Childs</th>
                              <th className="small">Infants</th>
                              <th className="small">Visa</th>
                              <th className="small">Hotel</th>
                              <th className="small">Transport</th>
                              <th className="small">Flight</th>
                              <th className="small">Food</th>
                              <th className="small">Ziarat</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customPackages.length === 0 ? (
                              <tr>
                                <td colSpan="11" className="text-center">No packages found</td>
                              </tr>
                            ) : (
                              customPackages.map(pkg => {
                                // Check if each component exists
                                const hasVisa = pkg.adault_visa_price > 0 || pkg.child_visa_price > 0 || pkg.infant_visa_price > 0;
                                const hasHotel = pkg.hotel_details && pkg.hotel_details.length > 0;
                                const hasTransport = pkg.transport_details && pkg.transport_details.length > 0;
                                const hasFlight = pkg.ticket_details && pkg.ticket_details.length > 0;
                                const hasFood = pkg.food_details && pkg.food_details.length > 0;
                                const hasZiarat = pkg.ziarat_details && pkg.ziarat_details.length > 0;

                                return (
                                  <tr key={pkg.id}>
                                    <td className="small">{pkg.id}</td>
                                    <td className="small">{pkg.total_adaults}</td>
                                    <td className="small">{pkg.total_children}</td>
                                    <td className="small">{pkg.total_infants}</td>
                                    <td className="small">{hasVisa ? "Yes" : "No"}</td>
                                    <td className="small">{hasHotel ? "Yes" : "No"}</td>
                                    <td className="small">{hasTransport ? "Yes" : "No"}</td>
                                    <td className="small">{hasFlight ? "Yes" : "No"}</td>
                                    <td className="small">{hasFood ? "Yes" : "No"}</td>
                                    <td className="small">{hasZiarat ? "Yes" : "No"}</td>
                                    <td>
                                      <Dropdown>
                                        <Dropdown.Toggle variant="link" className="p-0">
                                          <Gear size={18} />
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                          <Dropdown.Item
                                            as={Link}
                                            to={`/packages/custom-umrah/detail/${pkg.id}`}
                                            className="text-primary"
                                          >
                                            Add Order
                                          </Dropdown.Item>
                                          <Dropdown.Item
                                            className="text-primary"
                                            onClick={() => handleEditCalculation(pkg.id)}
                                          >
                                            Edit Calculation
                                          </Dropdown.Item>
                                          <Dropdown.Item
                                            className="text-danger"
                                            onClick={() => handleDeleteCalculation(pkg.id)}
                                          >
                                            Delete Calculation
                                          </Dropdown.Item>
                                        </Dropdown.Menu>
                                      </Dropdown>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div >
      </div>
    </>
  );
};

export default AgentUmrahCalculator;