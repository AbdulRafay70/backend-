import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Link, NavLink } from "react-router-dom";
import { Download, Import, Search, Eye } from "lucide-react";
import axios from "axios";
import RawSelect from 'react-select';

// Wrapper around react-select to render menus into document.body (portal)
// and ensure the dropdown does not expand parent width or get clipped by overflow.
const Select = (props) => {
  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  return (
    <RawSelect
      {...props}
      menuPortalTarget={portalTarget}
      menuPosition="fixed"
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
        control: (base, state) => ({
          ...base,
          minWidth: 0,
          height: 38,
          minHeight: 38,
          borderRadius: 4,
          backgroundColor: '#fff',
          border: state.isFocused ? '1px solid #86b7fe' : '1px solid #ced4da',
          boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13,110,253,.25)' : 'none',
          overflow: 'hidden',
          '&:hover': { border: state.isFocused ? '1px solid #86b7fe' : '1px solid #bfc7cd' },
        }),
        valueContainer: (base) => ({ ...base, overflow: 'hidden', padding: '0 8px' }),
        singleValue: (base) => ({ ...base, margin: 0, paddingLeft: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }),
        placeholder: (base) => ({ ...base, margin: 0, color: '#6c757d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
        dropdownIndicator: (base) => ({ ...base, padding: '0 8px' }),
        indicatorSeparator: (base) => ({ ...base, display: 'none' }),
      }}
    />
  );
};
import { Button, Dropdown, Modal } from "react-bootstrap";
import { Gear, Printer, Trash, PlusCircle } from "react-bootstrap-icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import mockData from "../../mock/mockData";
// Prevent duplicate toasts when multiple <ToastContainer /> are mounted.
// We wrap common toast methods to provide a stable `toastId` based on message content.
const _hashString = (s) => {
  try {
    const str = typeof s === 'string' ? s : JSON.stringify(s);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h = h & h;
    }
    return Math.abs(h).toString(36);
  } catch (e) {
    return String(Math.random()).slice(2, 8);
  }
};

['info', 'success', 'error', 'warning'].forEach((m) => {
  const orig = toast[m];
  toast[m] = (message, options = {}) => {
    const id = options.toastId || `auto_${m}_${_hashString(message)}`;
    // If an identical toast is already active, skip creating a duplicate
    try {
      if (toast.isActive && toast.isActive(id)) return null;
    } catch (e) {
      // ignore
    }
    return orig(message, { ...options, toastId: id });
  };
});

// ✅ FIXED: Missing closing bracket
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

const FlightModal = ({
  show,
  onClose,
  flights,
  onSelect,
  airlinesMap,
  citiesMap,
}) => {
  // Filter only Umrah return flights
  const filteredFlights = (flights || []).filter((flight) => {
    const hasReturnTrip = flight.trip_details?.some(
      (t) => t.trip_type.toLowerCase() === "return"
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
            <h5 className="modal-title fw-bold">Select Umrah Flight</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="row g-3">
              {filteredFlights.length === 0 && (
                <div className="col-12 text-center text-muted">
                  No Umrah flights available
                </div>
              )}

              {filteredFlights.map((flight) => {
                const departureTrip = flight.trip_details?.find(
                  (t) => t.trip_type.toLowerCase() === "departure"
                );
                const returnTrip = flight.trip_details?.find(
                  (t) => t.trip_type.toLowerCase() === "return"
                );

                const fromCode =
                  citiesMap[departureTrip?.departure_city]?.code || "N/A";
                const toCode =
                  citiesMap[departureTrip?.arrival_city]?.code || "N/A";

                return (
                  <div key={flight.id} className="col-12 col-md-6">
                    <div className="card shadow-sm p-3 h-100">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            background: "#f5f5f5",
                            borderRadius: 6,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <small>
                            {airlinesMap[flight.airline]?.code ||
                              airlinesMap[flight.airline]?.name?.slice(0, 2) ||
                              "—"}
                          </small>
                        </div>

                        <div className="flex-grow-1">
                          <div className="fw-semibold">
                            {airlinesMap[flight.airline]?.name || "N/A"}
                          </div>
                          <div className="small text-muted">
                            {fromCode} → {toCode} • Seats:{" "}
                            {flight.seats || "N/A"}
                          </div>
                        </div>

                        <div className="text-end">
                          <div className="fw-bold text-success">
                            PKR {(flight.adult_price || 0).toLocaleString()}
                          </div>
                          <div className="small text-muted">Adult</div>
                        </div>
                      </div>

                      <div className="mt-3 d-flex justify-content-between align-items-center">
                        <div className="small text-muted">
                          <div>
                            Departure:{" "}
                            {departureTrip?.departure_date_time
                              ? new Date(
                                  departureTrip.departure_date_time
                                ).toLocaleString()
                              : "N/A"}
                          </div>
                          <div>
                            Return:{" "}
                            {returnTrip?.arrival_date_time
                              ? new Date(
                                  returnTrip.arrival_date_time
                                ).toLocaleString()
                              : "N/A"}
                          </div>
                        </div>

                        <button
                          className="btn btn-sm"
                          id="btn"
                          onClick={() => onSelect(flight)}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
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

  // Forcing orgId to 11 so the agent UI shows packages for organization 11
  const getOrgId = () => 11;
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

  // Helper to render city dropdown options (kept inside component so it can access
  // `loading`, `error`, `cities` and `handleInputChange` defined above)
  const renderCityOptions = (field, currentValue) => {
    if (loading.cities) return <ShimmerLoader />;
    if (error.cities) return <div className="text-danger small">{error.cities}</div>;

    const options = (cities || []).map(c => ({ value: String(c.id), label: `${c.code} (${c.name})` }));

    return (
      <Select
        options={options}
        value={options.find(o => o.value === String(currentValue)) || null}
        onChange={(opt) => handleInputChange(field, opt ? opt.value : "")}
        isClearable
        isSearchable
        placeholder="Select a city"
        classNamePrefix="react-select"
      />
    );
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

  return (
    <div
      className={`modal ${show ? "d-block" : "d-none"}`}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title text-center fw-bold">Create Custom Ticket</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
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
                    <Select
                      options={(airlines || []).map(a => ({ value: String(a.id), label: a.name }))}
                      value={(airlines || []).map(a => ({ value: String(a.id), label: a.name })).find(o => o.value === String(formData.airline)) || null}
                      onChange={(opt) => handleInputChange("airline", opt ? opt.value : "")}
                      isClearable
                      placeholder="Select an airline"
                      classNamePrefix="react-select"
                    />
                  )}
                </div>
                <div className="col-md-2">
                  <label htmlFor="">
                    Meal
                  </label>
                  <Select
                    options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
                    value={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }].find(o => o.value === formData.meal) || null}
                    onChange={(opt) => handleInputChange("meal", opt ? opt.value : "")}
                    isClearable={false}
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="col-md-2">
                  <label htmlFor="">
                    Type
                  </label>
                  <Select
                    options={[{ value: 'Refundable', label: 'Refundable' }, { value: 'Non-Refundable', label: 'Non-Refundable' }]}
                    value={[{ value: 'Refundable', label: 'Refundable' }, { value: 'Non-Refundable', label: 'Non-Refundable' }].find(o => o.value === formData.ticketType) || null}
                    onChange={(opt) => handleInputChange("ticketType", opt ? opt.value : "")}
                    isClearable={false}
                    classNamePrefix="react-select"
                  />
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
                <Select
                  options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
                  value={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }].find(o => o.value === formData.umrahSeat) || null}
                  onChange={(opt) => handleInputChange('umrahSeat', opt ? opt.value : '')}
                  isClearable={false}
                  classNamePrefix="react-select"
                />
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
                <Select
                  options={[{ value: 'One-way', label: 'One-way' }, { value: 'Round-trip', label: 'Round-trip' }]}
                  value={[{ value: 'One-way', label: 'One-way' }, { value: 'Round-trip', label: 'Round-trip' }].find(o => o.value === formData.tripType) || null}
                  onChange={(opt) => handleInputChange('tripType', opt ? opt.value : '')}
                  isClearable={false}
                  classNamePrefix="react-select"
                />
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
                  <label htmlFor="">Return Departure City</label>
                  {renderCityOptions("returnDeparture", formData.returnDeparture)}
                </div>

                <div className="col-md-3">
                  <label htmlFor="">Return Arrival City</label>
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
                <label htmlFor="">Flight Type (Departure)</label>
                <Select
                  options={[{ value: 'Non-Stop', label: 'Non-Stop' }, { value: '1-Stop', label: '1-Stop' }]}
                  value={[{ value: 'Non-Stop', label: 'Non-Stop' }, { value: '1-Stop', label: '1-Stop' }].find(o => o.value === formData.flightType) || null}
                  onChange={(opt) => handleInputChange('flightType', opt ? opt.value : '')}
                  isClearable={false}
                  classNamePrefix="react-select"
                />
              </div>

              {formData.tripType === "Round-trip" && (
                <div className="col-md-3">
                  <label htmlFor="">Flight Type (Return)</label>
                  <Select
                    options={[{ value: 'Non-Stop', label: 'Non-Stop' }, { value: '1-Stop', label: '1-Stop' }]}
                    value={[{ value: 'Non-Stop', label: 'Non-Stop' }, { value: '1-Stop', label: '1-Stop' }].find(o => o.value === formData.returnFlightType) || null}
                    onChange={(opt) => handleInputChange('returnFlightType', opt ? opt.value : '')}
                    isClearable={false}
                    classNamePrefix="react-select"
                  />
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
                  <label htmlFor="">1st Stop At</label>
                  {renderCityOptions("stopLocation1", formData.stopLocation1)}
                </div>

                <div className="col-md-3">
                  <label htmlFor="">Wait Time</label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none px-1 py-2"
                    value={formData.stopTime1}
                    onChange={(e) => handleInputChange("stopTime1", e.target.value)}
                    placeholder="30 Minutes"
                  />
                </div>
              </div>
            )}

            {/* 1-Stop Fields for Return Trip */}
            {formData.tripType === "Round-trip" && formData.returnFlightType === "1-Stop" && (
              <div className="row g-3 mt-2">
                <div className="col-12">
                  <h6 className="text-muted">Return Stop</h6>
                </div>

                <div className="col-md-3">
                  <label htmlFor="">1st Stop At</label>
                  {renderCityOptions("returnStopLocation1", formData.returnStopLocation1)}
                </div>

                <div className="col-md-3">
                  <label htmlFor="">Wait Time</label>
                  <input
                    type="text"
                    className="form-control rounded shadow-none px-1 py-2"
                    value={formData.returnStopTime1}
                    onChange={(e) => handleInputChange("returnStopTime1", e.target.value)}
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
                  id="btn"
                  className="btn px-4"
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
  // Inline component: fetches city codes and renders a portalized Select
  // Usage: <CitySelect value={code} onChange={setCode} placeholder="FROM" />
  const CitySelect = ({ value, onChange, placeholder, isDisabled }) => {
    const [citiesOptions, setCitiesOptions] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);

    useEffect(() => {
      let mounted = true;
      const fetchCities = async () => {
        setLoadingCities(true);
        try {
          const token = localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzk1NTU4Nzk0LCJpYXQiOjE3NjQwMjI3OTQsImp0aSI6ImViNTQ0ZTk5ZTA5YTQyYjY4ODAyMDIwN2JlZTAyOWM3IiwidXNlcl9pZCI6MzV9.hTZqqJSK-EF6-pMEBr8lR7VTE81Z7E5RUvp_ShxHjmY';
          const res = await fetch('http://127.0.0.1:8000/api/cities/', {
            headers: {
              accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) throw new Error('Failed to load cities');
          const data = await res.json();
          if (!mounted) return;
          const opts = (Array.isArray(data) ? data : []).map(c => ({ value: c.code, label: c.code }));
          setCitiesOptions(opts);
        } catch (err) {
          // keep error silent but log for developer
          console.error('City load error', err);
        } finally {
          if (mounted) setLoadingCities(false);
        }
      };
      fetchCities();
      return () => { mounted = false; };
    }, []);

    return (
      <Select
        options={citiesOptions}
        value={citiesOptions.find(o => o.value === (value || '')) || null}
        onChange={(opt) => onChange(opt ? opt.value : '')}
        isDisabled={isDisabled}
        isClearable
        isLoading={loadingCities}
        placeholder={placeholder || 'Select city'}
        classNamePrefix="react-select"
      />
    );
  };
  const tabs = [
    { name: "Umrah Package", path: "/packages" },
    { name: "Custom Umrah Package", path: "/packages/umrah-calculater" },
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
  // Force agent to use organization 11 for agent panel/testing purposes.
  // This ensures the agent sees packages for org 11 even if their stored
  // `agentOrganization` points to a different org (e.g., 39).
  const getOrgId = () => {
    try {
      // Prefer explicit override to org 11
      return 11;
    } catch (err) {
      return 11;
    }
  };

  const orgId = getOrgId();

  // State declarations
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
  // Extra flight PNR fields per Section 4 requirements
  const [arrivalPnr, setArrivalPnr] = useState("");
  const [returnPnr, setReturnPnr] = useState("");
  // If user chooses no airport pickup for transport-only bookings
  const [noAirportPickup, setNoAirportPickup] = useState(false);
  // Extra time fields to mirror the client's Flight Details layout (ETD / ETA)
  const [departureETD, setDepartureETD] = useState("");
  const [departureETA, setDepartureETA] = useState("");
  const [returnETD, setReturnETD] = useState("");
  const [returnETA, setReturnETA] = useState("");

  // Family Divider editor/state + groups
  const [editingFamilies, setEditingFamilies] = useState(false);
  const [familyGroups, setFamilyGroups] = useState([]);
  // Per-family per-hotel room type overrides (key: `${familyIndex}_${hotelIndex}`)
  const [familyRoomOverrides, setFamilyRoomOverrides] = useState({});
  // Per-family room type selection (single selection per family)
  const [familyRoomTypes, setFamilyRoomTypes] = useState({});

  const [hotels, setHotels] = useState([]);
  const hotelOptions = useMemo(() => {
    const opts = (hotels || []).filter(h => h.active !== false).map(h => ({ value: String(h.id), label: h.name }));
    // Add self-hotel option
    return [...opts, { value: "__SELF__", label: "Self Hotel (Enter manually)" }];
  }, [hotels]);
  const [transportSectors, setTransportSectors] = useState([]);
  const [transportPrices, setTransportPrices] = useState([]);
  const [visaPricesOne, setVisaPricesOne] = useState([]);
  const [visaPricesTwo, setVisaPricesTwo] = useState([]);
  const [visaTypes, setVisaTypes] = useState([]);
  const [onlyVisaPrices, setOnlyVisaPrices] = useState([]);
  const [showOnlyVisaDebug, setShowOnlyVisaDebug] = useState(false);

  // Matched visa for full-package (vtth) selection
  const [matchedVisaForFullPackage, setMatchedVisaForFullPackage] = useState(null);

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

  // Riyal rate fetched from API (used for currency conversions)
  const [riyalRate, setRiyalRate] = useState(null);


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

  // Booking Type Selection (Section 1)
  const bookingOptionsList = [
    { id: "vtth", label: "VISA + TRANSPORT + TICKETS + HOTEL", services: ["visa", "transport", "tickets", "hotel"], icon: "🕋" },
    { id: "vth", label: "VISA + TRANSPORT + HOTEL", services: ["visa", "transport", "hotel"], icon: "🕋" },
    { id: "vt", label: "VISA + TRANSPORT", services: ["visa", "transport"], icon: "🕋" },
    // Generic "VISA" option removed — use "Only Visa" or "Long term visa" cards
    { id: "h", label: "HOTELS", services: ["hotel"], icon: "🏨" },
    { id: "t", label: "TRANSPORT", services: ["transport"], icon: "🚐" },
    { id: "tk", label: "TICKETS", services: ["tickets"], icon: "✈️" },
    // Added cards for visa-related quick options
    { id: "onlyvisa", label: "Only Visa", services: ["visa"], icon: "🛂" },
    { id: "longtermvisa", label: "Long term visa", services: ["visa"], icon: "🕰️" },
  ];

  const [selectedBookingOptions, setSelectedBookingOptions] = useState([]);
  const [activeSection, setActiveSection] = useState(1);

  // Track whether we auto-added the hotel service when 'vt' was selected
  const [autoAddedHotelForVT, setAutoAddedHotelForVT] = useState(false);
  // Prevent re-auto-adding hotel after user explicitly removed it while VT remains
  const [preventAutoAddHotelForVT, setPreventAutoAddHotelForVT] = useState(false);

  const selectedServices = useMemo(() => {
    const s = new Set();
    selectedBookingOptions.forEach((id) => {
      const opt = bookingOptionsList.find((o) => o.id === id);
      if (opt) opt.services.forEach((svc) => s.add(svc));
    });
    return s;
  }, [selectedBookingOptions]);

  // Helper: full-package (VTTH) selected
  const isFullPackage = selectedBookingOptions.includes("vtth");
  // Helper: VT (Visa + Transport) selected
  const isVT = selectedBookingOptions.includes("vt");

  // When VT is selected, ensure hotel service is enabled and only self-hotel is used.
  useEffect(() => {
    try {
      // Note: previous behavior auto-added Hotels when VT was selected.
      // We're switching to an inline VT self-hotel editor instead, so we no
      // longer auto-select the 'h' booking option. This effect now only
      // performs cleanup if an auto-added hotel flag was set in older state.
      if (!isVT && autoAddedHotelForVT) {
        setSelectedBookingOptions(prev => prev.filter(id => id !== 'h'));
        setAutoAddedHotelForVT(false);
        setHotelForms([{
          id: Date.now(),
          hotelId: "",
          roomType: "",
          sharingType: "Gender or Family",
          checkIn: "",
          checkOut: "",
          noOfNights: 0,
          specialRequest: "",
          isSelfHotel: false,
          selfHotelName: "",
          quinty: "",
          checkInLocked: false,
          checkOutLocked: false,
          assignedFamilies: []
        }]);
      }
    } catch (e) {
      // defensive
      console.error('VT hotel sync error', e);
    }
  }, [isVT, autoAddedHotelForVT, selectedBookingOptions]);

  // Ensure any existing hotel forms reflect Self Hotel when VT is selected.
  // This runs on selectedBookingOptions changes and forces the hotel select
  // to show `__SELF__` immediately (covers timing where selectedServices
  // may not yet include 'hotel').
  useEffect(() => {
    // Only force existing hotel forms into Self-Hotel mode when VT is selected
    // and Hotel hasn't been explicitly selected by the user (so we don't override
    // when the user intentionally chose Hotels).
    if (selectedBookingOptions.includes('vt') && !selectedBookingOptions.includes('h')) {
      setHotelForms(prev => prev.map(h => ({ ...h, hotelId: '', isSelfHotel: true })));
      setFormData(prev => ({ ...prev, hotelId: "__SELF__", hotelName: "" }));
    }
  }, [selectedBookingOptions]);

  // Auto-clear hotel / transport forms when their service is deselected
  useEffect(() => {
    // If hotel service removed, reset hotel forms and related main form fields
    if (!selectedServices.has("hotel")) {
      setHotelForms([
        {
          id: Date.now(),
          hotelId: "",
          roomType: "",
          sharingType: "Gender or Family",
          checkIn: "",
          checkOut: "",
          noOfNights: 0,
          specialRequest: ""
        },
      ]);

      setFormData((prev) => ({
        ...prev,
        hotelId: "",
        hotelName: "",
        hotelData: null,
        roomType: "",
        checkIn: "",
        checkOut: "",
        noOfNights: 0,
      }));
    }

    // If transport service removed, reset transport forms and related main form fields
    if (!selectedServices.has("transport")) {
      setTransportForms([
        {
          id: Date.now(),
          transportType: "Company Shared Bus",
          transportSectorId: "",
          self: false,
        },
      ]);

      setFormData((prev) => ({
        ...prev,
        transportSectorId: "",
        transportSector: "",
      }));

      setTransportSectorPrices({ adultPrice: 0, childPrice: 0, infantPrice: 0 });
    }
  }, [selectedServices]);

  // Note: transport -> hotel reminder effect moved below after hotelForms declaration
  const toggleBookingOption = (id) => {
    setSelectedBookingOptions((prev) => {
      // If already selected, unselect and clear related flags for visa-cards
      if (prev.includes(id)) {
        const updated = prev.filter((x) => x !== id);
        // handle visa-card toggles
        if (id === "addvisa") handleCheckboxChange("addVisaPrice", false);
        if (id === "onlyvisa") handleCheckboxChange("onlyVisa", false);
        if (id === "longtermvisa") handleCheckboxChange("longTermVisa", false);
        return updated;
      }

      // Otherwise, add selection. If selecting a visa-card, set corresponding flag.
      const updated = [...prev, id];
      if (id === "addvisa") handleCheckboxChange("addVisaPrice", true);
      if (id === "onlyvisa") handleCheckboxChange("onlyVisa", true);
      if (id === "longtermvisa") handleCheckboxChange("longTermVisa", true);

      // Show a helpful info toast when a booking option is newly selected
      try {
        showBookingToast && showBookingToast(id);
        // Special: when Only Visa is selected, inform agent that direct prices are applied
        if (id === 'onlyvisa') {
          try { toast.info('Direct price applied', { autoClose: 4000 }); } catch (e) { /* ignore */ }
        }
      } catch (e) {
        // ignore
      }

      return updated;
    });
  };

  // Show an explanatory info toast for booking option behaviors
  const showBookingToast = (id) => {
    // Prefer a human-readable label from bookingOptionsList
    const opt = bookingOptionsList.find(o => o.id === id);
    const label = opt ? opt.label : id;

    let msg = '';
    switch (id) {
      case 'vt':
        msg = `${label}: enter Self Hotel using the inline Self-Hotel editor. Visa requires a flight with full details.`;
        break;
      case 'vth':
        msg = `${label}:. Visa requires a flight with full details.`;
        break;
      case 'vtth':
        msg = `${label}: Full package. Visa requires a flight with full details.`;
        break;
      case 'h':
        msg = `${label}: full hotel options are available.`;
        break;
      case 't':
        msg = `${label}: please select a hotel (or choose Self Hotel).`;
        break;
      case 'tk':
        msg = `${label}: manage flight/ticket details in the Flights section.`;
        break;
      case 'onlyvisa':
      case 'longtermvisa':
        msg = `${label}: flight and full flight details are required.`;
        break;
      case 'addvisa':
        msg = `${label}: selecting this requires a hotel to calculate visa-inclusive pricing.`;
        break;
      default:
        msg = `${label}`;
    }

    if (msg) toast.info(msg, { autoClose: 6000 });
  };

  const isOptionDisabled = (id) => {
    if (selectedBookingOptions.includes(id)) return false;
    const opt = bookingOptionsList.find((o) => o.id === id);
    if (!opt) return false;
    for (const s of opt.services) {
      if (selectedServices.has(s)) return true;
    }
    return false;
  };

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

  // Warnings/state for passenger / seats
  const [seatWarning, setSeatWarning] = useState("");
  const [passengerError, setPassengerError] = useState("");
  const adultsInputRef = useRef(null);

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

      const data = response.data || {};

      // Merge API data. In development merge mockData for convenient testing,
      // but in production rely only on the API response to avoid accidentally
      // showing mock values when live data is missing.
      const merged = process.env.NODE_ENV === "development"
        ? { ...mockData, ...data }
        : { ...data };

      // Set all the data from the merged response (mockData supplies defaults)
      setRiyalRate(merged.riyal_rates?.[0] || null);
      setHotels(merged.hotels || []);
      setTransportSectors(merged.transport_prices || merged.transport_sector_prices || merged.small_sectors || []);
      setVisaTypes(merged.set_visa_type || []);
      setVisaPricesOne(merged.umrah_visa_prices || []);
      setVisaPricesTwo(merged.umrah_visa_type_two || []);
      setOnlyVisaPrices(merged.only_visa_prices || []);
      setFoodPrices(merged.food_prices || []);
      setZiaratPrices(merged.ziarat_prices || []);
      setTicketsList(merged.tickets || []);

      // Create airlines and cities maps
      const airlinesMap = {};
      (merged.airlines || []).forEach((airline) => {
        airlinesMap[airline.id] = { name: airline.name, code: airline.code };
      });
      setAirlinesMap(airlinesMap);

      const citiesMap = {};
      (merged.cities || []).forEach((city) => {
        citiesMap[city.id] = { code: city.code, name: city.name };
      });
      setCitiesMap(citiesMap);

    } catch (error) {
      console.error("Error fetching all prices:", error);
      // In production do NOT load mock data. Notify the user and clear state
      // so the UI does not render stale/demo prices. Only allow mock data
      // when explicitly running in development.
      toast.error("Failed to load live data. Please try again.");

      if (process.env.NODE_ENV === "development") {
        toast.info("Using mock data for UI testing (development only)");

        // Use mockData (imported at top of file)
        setRiyalRate(mockData.riyal_rates?.[0] || null);
        setHotels(mockData.hotels || []);
        setTransportSectors(mockData.transport_sector_prices || []);
        setVisaTypes(mockData.set_visa_type || []);
        setVisaPricesOne(mockData.umrah_visa_prices || []);
        setVisaPricesTwo(mockData.umrah_visa_type_two || []);
        setOnlyVisaPrices(mockData.only_visa_prices || []);
        setFoodPrices(mockData.food_prices || []);
        setZiaratPrices(mockData.ziarat_prices || []);
        setTicketsList(mockData.tickets || []);

        const airlinesMap = {};
        (mockData.airlines || []).forEach((airline) => {
          airlinesMap[airline.id] = { name: airline.name, code: airline.code };
        });
        setAirlinesMap(airlinesMap);

        const citiesMap = {};
        (mockData.cities || []).forEach((city) => {
          citiesMap[city.id] = { code: city.code, name: city.name };
        });
        setCitiesMap(citiesMap);
      } else {
        // Production: clear sensitive/demo state so the agent UI doesn't show mock prices
        setRiyalRate(null);
        setHotels([]);
        setTransportSectors([]);
        setVisaTypes([]);
        setVisaPricesOne([]);
        setVisaPricesTwo([]);
        setOnlyVisaPrices([]);
        setFoodPrices([]);
        setZiaratPrices([]);
        setTicketsList([]);
        setAirlinesMap({});
        setCitiesMap({});
      }
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
        // Also ensure transport sectors are loaded from their dedicated endpoints
        try {
          await fetchTransportSectors();
        } catch (err) {
          // ignore, fetchAllPrices may have already populated transport sectors
        }
        // Also fetch only-visa-prices explicitly to ensure it's available
        try {
          await fetchOnlyVisaPrices();
        } catch (err) {
          // non-fatal
          console.warn('Failed to fetch only-visa-prices during init', err);
        }
      } catch (error) {
        console.error("Error in initial data fetching:", error);
      }
    };

    fetchInitialData();
  }, [orgId, token]);

  // Autofocus adults input when user navigates to Section 2
  useEffect(() => {
    if (activeSection === 2) {
      setTimeout(() => {
        adultsInputRef.current && adultsInputRef.current.focus && adultsInputRef.current.focus();
      }, 50);
    }
  }, [activeSection]);

  // Note: flightOptions dropdown removed; skipping old effect that watched it.

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

  const fetchTransportSectors = async () => {
    const endpoints = [
      "/api/transport-prices/",
      "/api/small-sectors/",
      "/api/transport-sector-prices/",
    ];

    // Try endpoints in order; stop at first successful response
    for (const ep of endpoints) {
      try {
        const url = `http://127.0.0.1:8000${ep}`;
        setLoading((prev) => ({ ...prev, transport: true }));
        const res = await axios.get(url, { params: { organization: orgId }, headers: { Authorization: `Bearer ${token}` } });
        // Backend may return paginated results or direct list
        let data = Array.isArray(res.data) ? res.data : (res.data.results || res.data || []);

        // Normalize different back-end shapes into a consistent sector object.
        const normalize = (s) => {
          if (!s) return s;

          // Base possible sources
          const src = s.transport_sector_info || s.transport_sector || s;

          const out = {
            id: src.id ?? s.id,
            // Prefer vehicle_name for transport-prices, otherwise use name from nested sector
            name: s.vehicle_name || src.name || src.title || `Sector ${src.id}`,
            vehicle_type: s.vehicle_type || src.vehicle_type || src.vehicleType || "",
            // Pricing: normalize various field names used across APIs
            adault_price: parseFloat(s.adult_selling_price ?? s.adault_price ?? s.adult_price ?? s.price ?? 0) || 0,
            child_price: parseFloat(s.child_selling_price ?? s.child_price ?? s.childPrice ?? 0) || 0,
            infant_price: parseFloat(s.infant_selling_price ?? s.infant_price ?? 0) || 0,
            // Keep purchase prices if present
            adult_purchase_price: parseFloat(s.adult_purchase_price ?? s.adultPurchasePrice ?? 0) || 0,
            child_purchase_price: parseFloat(s.child_purchase_price ?? s.childPurchasePrice ?? 0) || 0,
            infant_purchase_price: parseFloat(s.infant_purchase_price ?? s.infantPurchasePrice ?? 0) || 0,
            note: s.note || src.note || src.description || "",
            status: s.status ?? src.status ?? "",
            organization: s.organization ?? src.organization ?? null,
            // Include nested small/big sector objects if available
            small_sector: s.small_sector || src.small_sector || null,
            big_sector: s.big_sector || src.big_sector || null,
            // keep original object for reference
            _raw: s,
          };

          // If nested small_sector exists, try to resolve departure/arrival city codes
          if (out.small_sector) {
            const ss = { ...out.small_sector };

            // departure_city may be an id (number) or a code (string). Prefer code.
            const dep = ss.departure_city;
            const arr = ss.arrival_city;

            // helper to resolve code/name using citiesMap from top-level state
            const resolveCity = (val) => {
              if (val === null || val === undefined) return { code: null, name: null };
              // numeric id -> lookup citiesMap
              if (typeof val === 'number' || (!isNaN(parseInt(String(val))) && String(val).length < 6)) {
                const id = Number(val);
                const c = citiesMap && citiesMap[id] ? citiesMap[id] : null;
                return { code: c ? c.code : null, name: c ? c.name : null };
              }
              // otherwise assume it's already a code string
              const code = String(val);
              // try to find a name via reverse lookup in citiesMap
              let name = null;
              try {
                for (const k of Object.keys(citiesMap || {})) {
                  if ((citiesMap[k] || {}).code === code) {
                    name = (citiesMap[k] || {}).name || null;
                    break;
                  }
                }
              } catch (e) {
                name = null;
              }
              return { code, name };
            };

            const depResolved = resolveCity(dep);
            const arrResolved = resolveCity(arr);

            ss.departure_city_code = depResolved.code;
            ss.departure_city_name = depResolved.name;
            ss.arrival_city_code = arrResolved.code;
            ss.arrival_city_name = arrResolved.name;

            out.small_sector = ss;
          }

          return out;
        };

        data = (Array.isArray(data) ? data : []).map(normalize);
        setTransportSectors(data);
        setLoading((prev) => ({ ...prev, transport: false }));
        return;
      } catch (err) {
        // Try next endpoint
        console.warn(`Transport sectors fetch failed for ${ep}:`, err.message || err);
      }
    }

    // If all endpoints failed, fall back to empty (and optionally mock in dev)
    setTransportSectors(process.env.NODE_ENV === "development" ? (mockData.transport_sector_prices || []) : []);
    setLoading((prev) => ({ ...prev, transport: false }));
  };

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

  const formatTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return "";
    try {
      const d = new Date(dateTimeString);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    } catch (err) {
      return "";
    }
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
      (t) => (t.trip_type || "").toString().toLowerCase() === "departure"
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
      // Set ETD / ETA times for departure trip
      setDepartureETD(formatTimeForInput(departureTrip.departure_date_time));
      setDepartureETA(formatTimeForInput(departureTrip.arrival_date_time));
    }

    // Process return trip
    const returnTrip = flight.trip_details?.find(
      (t) => (t.trip_type || "").toString().toLowerCase() === "return"
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
      // Set ETD / ETA times for return trip
      setReturnETD(formatTimeForInput(returnTrip.departure_date_time));
      setReturnETA(formatTimeForInput(returnTrip.arrival_date_time));
    }

    // Fill Arrival/Return PNRs if available on flight
    setArrivalPnr(flight.pnr || "");
    setReturnPnr(flight.return_pnr || flight.pnr || "");

    // If user selected a flight, ensure airport pickup flag is reset
    setNoAirportPickup(false);

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

  // Show linked (filtered) transport sectors only for booking types that include visa+transport.
  // Otherwise return all transport sectors. Also attempt simple PAX-based filtering where possible
  // by using visa pricing ranges (visaPricesTwo) as a best-effort hint when available.
  const availableTransportSectors = useMemo(() => {
    if (!transportSectors.length) return [];

    // Determine if current booking type requires linked transport sectors
    // We consider linked when either "addVisaPrice" or "onlyVisa" is selected and
    // the calculated visa prices indicate transport included or visa-type related selections.
    // Follow client requirement: linked transport should be shown when the
    // booking type is one of the visa+transport variants selected via the
    // booking option cards. Treat these booking ids as "linked transport".
    const linkedBookingIds = ["vtth", "vth"]; // VISA+TRANSPORT+TICKETS+HOTEL, VISA+TRANSPORT+HOTEL
    const visaSelected = linkedBookingIds.some((id) => selectedBookingOptions.includes(id));

    let baseSectors = transportSectors;

    // If Only Visa / Long Term Visa + Transport are BOTH selected, prefer transport
    // sectors provided by the only-visa-prices API for the matching visa_option.
    // This intentionally "disconnects" the general transport price API in that case
    // and shows only the sectors supplied by the only-visa endpoint.
    try {
      const visaOption = formData.onlyVisa ? 'only' : (formData.longTermVisa ? 'long_term' : null);
      if (visaOption && selectedServices.has('transport') && onlyVisaPrices && onlyVisaPrices.length > 0) {
        const sectors = [];
        const seen = new Set();

        onlyVisaPrices
          .filter(p => (p.visa_option || p.type2_option || '').toString().toLowerCase() === visaOption)
          .forEach((p) => {
            // some entries declare sectors array; support both object and id shapes
            const pSectors = Array.isArray(p.sectors) ? p.sectors : [];
            pSectors.forEach((s) => {
              if (!s) return;
              if (typeof s === 'object') {
                const sid = s.id ?? JSON.stringify(s);
                if (seen.has(sid)) return;
                seen.add(sid);
                sectors.push({
                  id: s.id ?? sid,
                  name: s.name || s.title || (s.small_sector && `${s.small_sector.departure_city_code || ''} → ${s.small_sector.arrival_city_code || ''}`) || `Sector ${sid}`,
                  adault_price: parseFloat(s.adault_price ?? s.adult_price ?? s.adult_selling_price ?? s.price ?? 0) || 0,
                  child_price: parseFloat(s.child_price ?? s.child_selling_price ?? 0) || 0,
                  infant_price: parseFloat(s.infant_price ?? s.infant_selling_price ?? 0) || 0,
                  vehicle_type: s.vehicle_type || s.type || null,
                  small_sector: s.small_sector || null,
                  _raw: s
                });
              } else {
                // assume it's an id referencing the main transportSectors list
                const found = transportSectors.find(ts => String(ts.id) === String(s));
                if (found && !seen.has(found.id)) {
                  seen.add(found.id);
                  sectors.push(found);
                }
              }
            });
        });

        if (sectors.length > 0) return sectors;
      }
    } catch (err) {
      // if anything fails, fall back to the usual transport sectors below
      console.warn('Error building transport sectors from onlyVisaPrices', err);
    }

    if (visaSelected && filteredTransportSectors.length > 0) {
      baseSectors = filteredTransportSectors;
    }

    // If a full-package matched visa is present, filter by its vehicle_types (IDs)
    try {
      if (matchedVisaForFullPackage && matchedVisaForFullPackage.vehicle_types && matchedVisaForFullPackage.vehicle_types.length > 0) {
        const vehicleTypeIds = (matchedVisaForFullPackage.vehicle_types || []).map(v => (typeof v === 'object' ? v.id : v)).filter(Boolean).map(Number);
        // Only include sectors that explicitly declare a vehicle_type matching the visa's list
        const paxFiltered = baseSectors.filter(s => s.vehicle_type != null && vehicleTypeIds.includes(Number(s.vehicle_type)));
        if (paxFiltered.length > 0) return paxFiltered;
        // If none matched, fall back to baseSectors (do not include generic/null vehicle_type)
        return baseSectors.filter(s => s.vehicle_type != null && vehicleTypeIds.includes(Number(s.vehicle_type)));
      }
    } catch (err) {
      // ignore and fall back to baseSectors
    }

    return baseSectors;
  }, [transportSectors, filteredTransportSectors, selectedBookingOptions, formData.addVisaPrice, formData.onlyVisa, formData.totalAdults, formData.totalChilds, formData.totalInfants, visaPricesTwo, matchedVisaForFullPackage]);
  

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
    // For full-package (`vtth`) we also calculate even if those flags are not set
    const isFullPackage = selectedBookingOptions.includes("vtth");
    if (!formData.addVisaPrice && !formData.onlyVisa && !isFullPackage) {
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
    // If full-package selected, prefer the matched visa bracket computed earlier
    if (isFullPackage) {
      if (matchedVisaForFullPackage) {
        const mv = matchedVisaForFullPackage;
        const adultPrice = mv.adult_selling_price ?? mv.adault_price ?? mv.adult_price ?? mv.adultSellingPrice ?? 0;
        const childPrice = mv.child_selling_price ?? mv.child_price ?? mv.childPrice ?? 0;
        const infantPrice = mv.infant_selling_price ?? mv.infant_price ?? mv.infantPrice ?? 0;
        return {
          adultPrice: adultPrice || 0,
          childPrice: childPrice || 0,
          infantPrice: infantPrice || 0,
          includesTransport: mv.is_transport || false,
          visaType: mv.title || "Type 2 Visa"
        };
      }

      // No matched visa for full-package: return zero prices (warning shown elsewhere)
      return {
        adultPrice: 0,
        childPrice: 0,
        infantPrice: 0,
        includesTransport: false,
        visaType: "No Visa Available"
      };
    }

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

  // Improved checkbox handler: accepts an explicit boolean value or toggles when value omitted
  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [field]: typeof value === "boolean" ? value : !prev[field],
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

  // Passenger controls for Section 2
  const changePax = (field, delta) => {
    setFormData((prev) => {
      const current = parseInt(prev[field] || 0);
      let next = current + delta;
      if (next < 0) next = 0;

      // Enforce infant <= adults
      if (field === "totalInfants") {
        const adults = parseInt(prev.totalAdults || 0);
        if (next > adults) {
          setPassengerError("Number of infants cannot exceed number of adults");
          setTimeout(() => setPassengerError(""), 4000);
          return prev; // reject change
        }
      }

      // Prevent reducing adults below existing infants
      if (field === "totalAdults" && delta < 0) {
        const infants = parseInt(prev.totalInfants || 0);
        if (infants > next) {
          setPassengerError("Cannot reduce adults below current number of infants");
          setTimeout(() => setPassengerError(""), 4000);
          return prev;
        }
      }

      const updated = { ...prev, [field]: next };

      // clear passenger error on successful change
      setPassengerError("");

      // Update seat warning if flight selected
      const adults = parseInt(updated.totalAdults || 0);
      const childs = parseInt(updated.totalChilds || 0);
      const totalPax = adults + childs;
      if (selectedFlight && selectedFlight.seats != null) {
        if (totalPax > selectedFlight.seats) {
          setSeatWarning(`Selected flight has only ${selectedFlight.seats} seats for adults+children`);
        } else {
          setSeatWarning("");
        }
      }

      return updated;
    });

    // trigger recalculations that depend on pax counts
    setTimeout(() => {
      const prices = calculateVisaPrices();
      setCalculatedVisaPrices(prices);
      calculateCosts && calculateCosts();
    }, 0);
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

      // Prevent selecting future dates (max = today)
      if (selectedDate > today) {
        toast.error("Check-in date cannot be in the future");
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

      // Allow past check-out; only ensure it's after check-in

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
        .filter(form => form.hotelId || form.isSelfHotel)
        .map(form => ({
          room_type: form.roomType,
          quantity: parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0),
          sharing_type: form.sharingType,
          check_in_time: form.checkIn,
          check_out_time: form.checkOut,
          number_of_nights: parseInt(form.noOfNights || 0),
          special_request: form.specialRequest,
          price: 0, // This should be calculated based on your hotel pricing logic
          hotel: form.hotelId ? parseInt(form.hotelId) : null,
          is_self_hotel: !!form.isSelfHotel,
          self_hotel_name: form.isSelfHotel ? form.selfHotelName : null,
          quinty: form.quinty || null,
          assigned_families: form.assignedFamilies || []
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
        `http://127.0.0.1:8000/api/umrah-packages/?organization=${orgId}`,
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


  // When full-package (vtth) is selected, attempt to find a matching
  // `UmrahVisaPriceTwo` bracket based on adults+children (infants excluded)
  useEffect(() => {
    const isFullPackage = selectedBookingOptions.includes("vtth");
    if (!isFullPackage) {
      setMatchedVisaForFullPackage(null);
      return;
    }

    const adults = parseInt(formData.totalAdults || 0) || 0;
    const children = parseInt(formData.totalChilds || 0) || 0;
    const paxCount = adults + children;

    if (!visaPricesTwo || visaPricesTwo.length === 0) {
      setMatchedVisaForFullPackage(null);
      return;
    }

    const sorted = [...visaPricesTwo].sort((a, b) => (a.person_from || 0) - (b.person_from || 0));
    const match = sorted.find(vp => {
      const from = parseInt(vp.person_from || 0);
      const to = parseInt(vp.person_to || 0) || 2147483647;
      return paxCount >= from && paxCount <= to;
    });

    if (match) {
      setMatchedVisaForFullPackage(match);
    } else {
      setMatchedVisaForFullPackage(null);
      // Only warn the user when paxCount has been set (greater than zero).
      // This prevents an immediate warning when the user merely selects the
      // full-package card and hasn't entered any passengers yet.
      if (paxCount > 0) {
        try {
          toast.warning("No visa available for selected passenger count (Adults + Children)");
        } catch (e) {
          // ignore if toast not available for any reason
        }
      }
    }
  }, [selectedBookingOptions, formData.totalAdults, formData.totalChilds, visaPricesTwo]);

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
    specialRequest: "",
    // New fields per Section 5
    isSelfHotel: false,
    selfHotelName: "",
    quinty: "",
    checkInLocked: false,
    checkOutLocked: false
    ,assignedFamilies: []
  }]);

    // VT auto-add flags declared earlier near booking selection state

  // Options for self hotel names (reuse any previously entered self-hotel names)
  const selfHotelOptions = useMemo(() => {
    const names = Array.from(new Set(hotelForms.map(f => f.selfHotelName).filter(Boolean)));
    return names.map(n => ({ value: n, label: n }));
  }, [hotelForms]);

  // When transport is selected, remind the user to choose a hotel if none
  // is selected. We show a toast warning; no automatic changes are performed.
  useEffect(() => {
    // Only show reminder when the explicit Transport button (id: 't') is selected.
    if (!selectedBookingOptions.includes('t')) return;

    const noneSelected = (hotelForms || []).every(h => !h.hotelId && !h.isSelfHotel);
    if (noneSelected) {
      toast.info('Transport selected: please select a hotel (or choose Self Hotel).');
    }
  }, [selectedBookingOptions, hotelForms]);

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

      // Recalculate nights for this hotel when either date changes
      if (field === 'checkIn' || field === 'checkOut') {
        const ci = updated[index].checkIn;
        const co = updated[index].checkOut;
        if (ci && co) {
          const checkInDate = new Date(ci);
          const checkOutDate = new Date(co);
          const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
          updated[index].noOfNights = nights > 0 ? nights : 0;
        }
      }

      // When a transport sector is selected for this route, auto-fill route-level transportType and per-route prices
      if (field === 'transportSectorId') {
        const selectedSector = transportSectors.find(s => s.id.toString() === String(value));
        if (selectedSector) {
          updated[index].transportSector = selectedSector.name || selectedSector.vehicle_name || '';
          updated[index].transportType = selectedSector.vehicle_type || updated[index].transportType || '';
          // store normalized prices on the route so calculations can be route-local if needed
          updated[index].adault_price = selectedSector.adault_price || selectedSector.adult_selling_price || selectedSector.adult_price || 0;
          updated[index].child_price = selectedSector.child_price || selectedSector.child_selling_price || selectedSector.child_price || 0;
          updated[index].infant_price = selectedSector.infant_price || selectedSector.infant_selling_price || selectedSector.infant_price || 0;
          // attach nested sector info for small/big if present
          updated[index].small_sector = selectedSector.small_sector || null;
          updated[index].big_sector = selectedSector.big_sector || null;
        } else {
          // cleared selection
          updated[index].transportSector = '';
          updated[index].adault_price = 0;
          updated[index].child_price = 0;
          updated[index].infant_price = 0;
        }
      }
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
      <Select
        options={[{ value: '', label: 'Select Room Type' }, ...roomTypes.map(rt => ({ value: rt, label: rt }))]}
        value={roomTypes.map(rt => ({ value: rt, label: rt })).find(o => o.value === formData.roomType) || null}
        onChange={(opt) => handleInputChange('roomType', opt ? opt.value : '')}
        isClearable
        placeholder="Select Room Type"
        classNamePrefix="react-select"
      />
    );
  };

  const renderTransportSectorSelect = (transportType) => {
    // Filter sectors based on selected transport type using availableTransportSectors
    const filteredSectors = availableTransportSectors.filter(
      sector => sector.vehicle_type === transportType
    );

    const options = (filteredSectors || []).map(s => ({ value: String(s.id), label: `${s.name} (${s.vehicle_type})` }));
    return (
      <Select
        options={options}
        value={options.find(o => o.value === String(formData.transportSectorId)) || null}
        onChange={(opt) => handleInputChange('transportSectorId', opt ? opt.value : '')}
        isDisabled={formData.self || loading.transport}
        isClearable
        placeholder={loading.transport ? 'Loading transport sectors...' : (options.length ? 'Select Transport Sector' : 'No transport sectors available')}
        classNamePrefix="react-select"
      />
    );
  };

  const renderTransportTypeSelect = () => {
    const types = [...new Set(availableTransportSectors.map(s => s.vehicle_type))].filter(Boolean);
    const options = types.map(t => ({ value: t, label: t }));
    return (
      <Select
        options={options}
        value={options.find(o => o.value === formData.transportType) || null}
        isDisabled={formData.self}
        onChange={(opt) => {
          const v = opt ? opt.value : '';
          handleInputChange('transportType', v);
          handleInputChange('transportSectorId', '');
        }}
        isClearable
        placeholder="Select Transport Type"
        classNamePrefix="react-select"
      />
    );
  };

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
        .filter(form => form.hotelId || form.isSelfHotel)
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
            hotel: form.hotelId ? parseInt(form.hotelId) : null,
            is_self_hotel: !!form.isSelfHotel,
            self_hotel_name: form.isSelfHotel ? form.selfHotelName : null,
            quinty: form.quinty || null,
            assigned_families: form.assignedFamilies || []
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
            price: hotel.price || 0,
            // New fields
            isSelfHotel: hotel.is_self_hotel || false,
            selfHotelName: hotel.self_hotel_name || "",
            quinty: hotel.quinty || "",
            checkInLocked: false,
            checkOutLocked: false,
            assignedFamilies: hotel.assigned_families || []
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
        } catch (error) {
          console.error("Error fetching flight details:", error);
          setSelectedFlight(null);
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
          .filter(form => form.hotelId || form.isSelfHotel)
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
            hotel: form.hotelId ? parseInt(form.hotelId) : null,
            is_self_hotel: !!form.isSelfHotel,
            self_hotel_name: form.isSelfHotel ? form.selfHotelName : null,
            quinty: form.quinty || null,
            assigned_families: form.assignedFamilies || []
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
      // Build URL only including agency when it's present and non-empty
      const params = new URLSearchParams();
      params.append('organization', orgId);
      if (agencyId && agencyId !== 'null') params.append('agency', agencyId);

      const url = `http://127.0.0.1:8000/api/custom-umrah-packages/?${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    , assignedFamilies: []
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

    // Infants cannot exceed adults
    if (parseInt(formData.totalInfants || 0) > parseInt(formData.totalAdults || 0)) {
      toast.error("Number of infants cannot exceed number of adults");
      return false;
    }

    // If a flight is selected, ensure seats are sufficient (adults + children)
    const adults = parseInt(formData.totalAdults || 0);
    const childs = parseInt(formData.totalChilds || 0);
    const totalPax = adults + childs;
    if (selectedFlight && selectedFlight.seats != null) {
      if (totalPax > selectedFlight.seats) {
        toast.error(`Selected flight only has ${selectedFlight.seats} seats for adults+children`);
        return false;
      }
    }

    // Validate visa type selection when visa-related options are checked
    if ((formData.addVisaPrice || formData.onlyVisa) && !formData.visaTypeId) {
      toast.error("Visa Type is required when adding visa price or only visa");
      return false;
    }

    // If "Add Visa Price" is checked we still require a hotel selection
    if (formData.addVisaPrice) {
      const hasHotels = hotelForms.some(form => form.hotelId || form.isSelfHotel);
      if (!hasHotels) {
        toast.error("Hotel selection is required when adding visa price");
        return false;
      }
    }

    // STRICT POLICY: If any booking option includes visa (vt, vth, vtth, onlyvisa, longtermvisa)
    // then a flight selection and full flight details are always required.
    if (selectedServices.has('visa')) {
      if (!selectedFlight) {
        toast.error('Flight selection is required when visa is part of the booking');
        return false;
      }

      const missingFlightDetail = !pnr || !ticketId || !departureDate || !returnDate || !airlineName;
      if (missingFlightDetail) {
        toast.error('Complete flight details (PNR, ticket, airline, departure and return dates) are required when visa is part of the booking');
        return false;
      }
    }

    // Rule 3: If neither is checked, no specific requirements
    // (No additional validation needed)
    // City Linking Rule: If transport is added, and flight is provided, ensure
    // flight's arrival/departure cities match the transport sector route.
    // Only validate when at least one transport route is present and a flight is selected.
    try {
      const transportWithSector = transportForms.find(f => f.transportSectorId && !f.self);
      if (transportWithSector && selectedFlight) {
        const sector = transportSectors.find(s => s.id.toString() === transportWithSector.transportSectorId);
        if (sector) {
          // Derive first and last city names/labels from sector if available
          let firstCity = sector.start_city || sector.from_city || sector.city_from || null;
          let lastCity = sector.end_city || sector.to_city || sector.city_to || null;

          if (!firstCity || !lastCity) {
            // Try parsing from sector.name: e.g. "LHE - JED" or "LHE to JED"
            const parts = (sector.name || "").split(/[-–—→]| to /i).map(p => p.trim()).filter(Boolean);
            if (parts.length >= 2) {
              firstCity = firstCity || parts[0];
              lastCity = lastCity || parts[parts.length - 1];
            }
          }

          // Get flight trip details
          const departureTrip = selectedFlight.trip_details?.find(t => t.trip_type?.toLowerCase() === 'departure');
          const returnTrip = selectedFlight.trip_details?.find(t => t.trip_type?.toLowerCase() === 'return');

          // Compare arrival city of departure trip to firstCity
          if (departureTrip && firstCity) {
            const flightArrival = citiesMap[departureTrip.arrival_city]?.code || citiesMap[departureTrip.arrival_city]?.name || null;
            if (flightArrival && firstCity && flightArrival.toString().toLowerCase() !== firstCity.toString().toLowerCase()) {
              toast.error("Arrival city must match the first transport city");
              return false;
            }
          }

          // Compare departure city of return trip to lastCity
          if (returnTrip && lastCity) {
            const flightDeparture = citiesMap[returnTrip.departure_city]?.code || citiesMap[returnTrip.departure_city]?.name || null;
            if (flightDeparture && lastCity && flightDeparture.toString().toLowerCase() !== lastCity.toString().toLowerCase()) {
              toast.error("Departure city must match the last transport city");
              return false;
            }
          }
        }
      }
    } catch (err) {
      // don't block form submission on unexpected parsing errors
      console.error('Error validating transport <-> flight city linkage', err);
    }

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
          checkIn: departureDate.toISOString().split("T")[0],
          checkInLocked: true
        };

        // Last hotel gets check-out = flight return
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          checkOut: returnDate.toISOString().split("T")[0],
          checkOutLocked: true
        };

        // Distribute total nights across hotels (simple even distribution)
        const totalNights = Math.ceil((returnDate - departureDate) / (1000 * 60 * 60 * 24));
        if (totalNights > 0) {
          if (updated.length === 1) {
            updated[0].noOfNights = totalNights;
          } else {
            const base = Math.floor(totalNights / updated.length);
            let remainder = totalNights % updated.length;
            for (let i = 0; i < updated.length; i++) {
              updated[i].noOfNights = base + (remainder > 0 ? 1 : 0);
              if (remainder > 0) remainder--; 
            }
          }
        }

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

      // If updating check-in date, validate it's not in the past (min = today), unless locked by flight
      if (field === 'checkIn') {
        // If this field is locked (synced with flight), disallow manual changes
        if (updated[index].checkInLocked) {
          toast.error("Check-in date is locked to the flight arrival date");
          return prev;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value);
        selectedDate.setHours(0, 0, 0, 0);

        // Disallow selecting dates before today
        if (selectedDate < today) {
          toast.error("Check-in date cannot be before today");
          return prev;
        }

        // If this is not the first hotel, check if check-in matches previous hotel's check-out
        if (index > 0 && updated[index - 1].checkOut && value !== updated[index - 1].checkOut) {
          toast.error(`Check-in must match previous hotel's check-out date (${updated[index - 1].checkOut})`);
          return prev;
        }
      }

      // If updating check-out date, validate it's after check-in
      if (field === 'checkOut') {
        // If this field is locked (synced with flight), disallow manual changes
        if (updated[index].checkOutLocked) {
          toast.error("Check-out date is locked to the flight departure date");
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
        ,
        isSelfHotel: false,
        selfHotelName: "",
        quinty: "",
        checkInLocked: false,
        checkOutLocked: false
        ,assignedFamilies: []
      };

      return [...prev, newHotel];
    });
  };


  const removeHotelForm = (index) => {
    setHotelForms(prev => prev.filter((_, i) => i !== index));
  };

  const renderHotelForm = (form, index) => (
    <div key={form.id} className="card mb-3 shadow-sm border rounded-3 p-3">
      <div className="d-flex justify-content-between align-items-start">
        <h5 className="mb-2 fw-semibold">Hotel Details {index + 1}</h5>
        <div>
          <button
            className="btn btn-sm btn-outline-danger d-flex align-items-center"
            onClick={() => removeHotelForm(index)}
            disabled={hotelForms.length <= 1 || !selectedServices.has('hotel')}
            aria-label={`Remove hotel ${index + 1}`}
          >
            <Trash size={14} className="me-1" /> Remove
          </button>
        </div>
      </div>

      <div className="mb-3 border rounded p-3">
        <div className="row g-3">
          <div className="col-12 mb-2">
            <small className="fw-semibold">Hotel Info</small>
          </div>

          <div className="col-md-6">
            <label className="Control-label">Hotel Name</label>
            <Select
              // If VT is active but the user has explicitly selected Hotels ('h'),
              // show the full hotelOptions. Otherwise when VT-only, limit to Self Hotel.
              options={(isVT && !selectedBookingOptions.includes('h')) ? [{ value: "__SELF__", label: "Self Hotel (Enter manually)" }] : hotelOptions}
              value={((isVT && !selectedBookingOptions.includes('h')) ? [{ value: "__SELF__", label: "Self Hotel (Enter manually)" }] : hotelOptions).find(o => o.value === (form.isSelfHotel ? "__SELF__" : String(form.hotelId))) || null}
              onChange={(opt) => {
                if (!opt) {
                  updateHotelForm(index, 'hotelId', "");
                  updateHotelForm(index, 'isSelfHotel', false);
                  return;
                }
                const v = opt.value;
                if (v === "__SELF__") {
                  updateHotelForm(index, 'hotelId', "");
                  updateHotelForm(index, 'isSelfHotel', true);
                } else {
                  updateHotelForm(index, 'hotelId', v);
                  updateHotelForm(index, 'isSelfHotel', false);
                }
              }}
              isDisabled={loading.hotels || (!selectedServices.has('hotel') && !isVT)}
              isClearable
              placeholder="Select Hotel"
              classNamePrefix="react-select"
            />

            {/* Self-hotel name input moved to the Quinty / Room Title column below. */}
          </div>

          <div className="col-md-6">
            <label className="Control-label">Self Hotel Name</label>
            <Select
              options={selfHotelOptions}
              value={selfHotelOptions.find(o => o.value === (form.selfHotelName || '')) || null}
              onChange={(opt) => updateHotelForm(index, 'selfHotelName', opt ? opt.value : '')}
              isDisabled={!form.isSelfHotel || loading.hotels || (!selectedServices.has('hotel') && !isVT)}
              isClearable
              isSearchable
              placeholder="Select or enter self hotel"
              classNamePrefix="react-select"
            />
          </div>
        </div>
      </div>

      <div className="mb-3 border rounded p-3">
        <div className="row g-3">
          <div className="col-12 mb-2"><small className="fw-semibold">Dates</small></div>
          <div className="col-md-4">
            <label className="Control-label">Check In</label>
            <input
              type="date"
              className="form-control shadow-none"
              value={form.checkIn}
              min={new Date().toISOString().split('T')[0]}
              readOnly={form.checkInLocked}
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
          <div className="col-md-4">
            <label className="Control-label">No. of Night</label>
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
          <div className="col-md-4">
            <label className="Control-label">Check Out</label>
            <input
              type="date"
              className="form-control shadow-none"
              value={form.checkOut}
              readOnly
            />
            {form.checkOutLocked && <div className="small text-muted mt-1">Locked to flight departure date</div>}
          </div>

          <div className="col-12">
            <label className="Control-label">Special Request</label>
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

      <div className="mb-3 border rounded p-3">
        <div className="row g-3">
          <div className="col-12 mb-2"><small className="fw-semibold">Room Type</small></div>
          <div className="col-md-6">
            <label className="Control-label">Room Type</label>
            <Select
              options={(form.hotelId ? (hotels.find(h => h.id.toString() === form.hotelId)?.prices || []) : [])
                .filter(p => p.room_type !== 'Only-Room')
                .map(p => ({ value: p.room_type, label: p.room_type }))}
              value={(form.hotelId ? (hotels.find(h => h.id.toString() === form.hotelId)?.prices || []) : [])
                .map(p => ({ value: p.room_type, label: p.room_type })).find(o => o.value === form.roomType) || null}
              onChange={(opt) => updateHotelForm(index, 'roomType', opt ? opt.value : '')}
              isClearable
              placeholder="Select Room Type"
              classNamePrefix="react-select"
            />
          </div>

          <div className="col-md-6">
            <label className="Control-label">Sharing Type</label>
            <Select
              options={[
                { value: 'Gender or Family', label: 'Gender or Family' },
                { value: 'Male Only', label: 'Male Only' },
                { value: 'Female Only', label: 'Female Only' },
                { value: 'Family Only', label: 'Family Only' },
              ]}
              value={[{ value: 'Gender or Family', label: 'Gender or Family' }, { value: 'Male Only', label: 'Male Only' }, { value: 'Female Only', label: 'Female Only' }, { value: 'Family Only', label: 'Family Only' }].find(o => o.value === form.sharingType) || null}
              onChange={(opt) => updateHotelForm(index, 'sharingType', opt ? opt.value : '')}
              isDisabled={form.roomType !== 'Sharing'}
              isClearable={false}
              classNamePrefix="react-select"
            />
          </div>
        </div>
      </div>

      {/* Families info moved to the top-level Families section; per-hotel display removed */}

      <div className="row mt-3">
        <div className="col-12">
          <div className="small text-muted">Self Hotel Name: {form.isSelfHotel ? (form.selfHotelName || '—') : '—'}</div>
          {form.assignedFamilies && form.assignedFamilies.length > 0 && (
            <div className="small text-muted">Assigned Families: {form.assignedFamilies.join(', ')}</div>
          )}
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

  // Compute family groups greedily given total pax
  const computeFamilyGroups = (totalPax) => {
    const capacities = [5,4,3,2,1]; // quint, quad, triple, double, sharing
    const groups = [];
    let remaining = totalPax;
    while (remaining > 0) {
      // pick largest capacity <= remaining, else pick smallest (1)
      let picked = capacities.find(c => c <= remaining) || 1;
      groups.push(picked);
      remaining -= picked;
    }
    return groups;
  };

  // Sync hotelForms.assignedFamilies when familyGroups changes
  useEffect(() => {
    if (familyGroups && familyGroups.length > 0) {
      const familyNames = familyGroups.map((_, i) => `Family ${i + 1}`);
      setHotelForms(prev => prev.map(h => ({ ...h, assignedFamilies: [...familyNames] })));
    }
  }, [familyGroups]);

  // Ensure familyRoomOverrides has defaults when hotelForms or familyGroups change
  useEffect(() => {
    if (!familyGroups || familyGroups.length <= 1) return;

    setFamilyRoomOverrides(prev => {
      const copy = { ...prev };
      for (let f = 1; f < familyGroups.length; f++) {
        for (let h = 0; h < hotelForms.length; h++) {
          const key = `${f}_${h}`;
          if (typeof copy[key] === 'undefined') {
            copy[key] = hotelForms[h]?.roomType || '';
          }
        }
      }
      return copy;
    });
  }, [hotelForms, familyGroups]);

  // Compute union of available room types from currently selected hotels
  const unionRoomTypeOptions = useMemo(() => {
    try {
      const names = new Set();
      hotelForms.forEach((hf) => {
        if (!hf || !hf.hotelId) return;
        const hotelObj = hotels.find(h => h.id.toString() === hf.hotelId);
        if (!hotelObj || !hotelObj.prices) return;
        hotelObj.prices
          .filter(p => p.room_type && p.room_type !== 'Only-Room')
          .forEach(p => names.add(p.room_type));
      });
      return Array.from(names).map(n => ({ value: n, label: n }));
    } catch (err) {
      return [];
    }
  }, [hotelForms, hotels]);

  // Track family-room selections that are no longer valid given current hotels
  const [invalidFamilyRooms, setInvalidFamilyRooms] = useState({});

  useEffect(() => {
    // Build set of valid room type values
    const valid = new Set((unionRoomTypeOptions || []).map(o => o.value));
    const invalidKeys = {};

    // Check family-level selections
    Object.keys(familyRoomTypes || {}).forEach((key) => {
      const val = familyRoomTypes[key];
      if (val && !valid.has(val)) invalidKeys[`family_${key}`] = true;
    });

    // Also check older per-hotel overrides if present
    Object.keys(familyRoomOverrides || {}).forEach((key) => {
      const val = familyRoomOverrides[key];
      if (val && !valid.has(val)) invalidKeys[key] = true;
    });

    const hadInvalidBefore = Object.keys(invalidFamilyRooms || {}).length > 0;
    const hasInvalidNow = Object.keys(invalidKeys).length > 0;

    setInvalidFamilyRooms(invalidKeys);

    if (!hadInvalidBefore && hasInvalidNow) {
      toast.warn('Some family room-type selections are no longer available — please review the Families section.');
    }
  }, [unionRoomTypeOptions, familyRoomOverrides, familyRoomTypes]);

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
                          className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Custom Umrah Package"
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
                        Custom Umrah Package
                      </h4>
                      <div className="card-body">
                        {/* Booking Type Selection - Section 1 */}
                        <div className="row mb-4">
                          <div className="col-12">
                            <h6 className="fw-semibold">Which type of booking is this?</h6>
                            <div className="d-flex flex-wrap gap-2 mt-2">
                              {bookingOptionsList.map((opt) => {
                                const disabled = isOptionDisabled(opt.id);
                                const active = selectedBookingOptions.includes(opt.id);
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`card p-3 btn text-start ${active ? "border-primary bg-light" : ""} ${disabled && !active ? "opacity-50" : ""}`}
                                    disabled={disabled && !active}
                                    onClick={() => toggleBookingOption(opt.id)}
                                    style={{ minWidth: "220px" }}
                                  >
                                    <div className="d-flex align-items-center gap-2">
                                      <div style={{ fontSize: "20px" }}>{opt.icon}</div>
                                      <div>
                                        <div className="fw-bold" style={{ fontSize: "0.95rem" }}>{opt.label}</div>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                              <div className="mt-3">
                                <small className="text-muted">Selected: {selectedBookingOptions.length > 0 ? selectedBookingOptions.map(id => bookingOptionsList.find(o=>o.id===id)?.label).join(' • ') : 'None'}</small>
                                {/* Next button removed per request */}
                              </div>
                          </div>
                        </div>

                        {/* Top Section - Counts */}
                        <div className="row mb-4">
                          <div className="col-12">
                            <h6 className="fw-semibold">Passenger Details</h6>
                            <p className="small text-muted">Adjust passengers by category. Total PAX updates automatically.</p>
                          </div>

                          <div className="col-12 col-md-4 mb-3">
                            <label className="Control-label d-block">Adults (12+)</label>
                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => changePax("totalAdults", -1)}
                                aria-label="decrease adults"
                              >
                                ➖
                              </button>
                              <input
                                type="text"
                                readOnly
                                ref={adultsInputRef}
                                className="form-control text-center bg-light shadow-none"
                                value={formData.totalAdults}
                                aria-label="total adults"
                                style={{ maxWidth: "120px" }}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => changePax("totalAdults", 1)}
                                aria-label="increase adults"
                              >
                                ➕
                              </button>
                            </div>
                          </div>

                          <div className="col-12 col-md-4 mb-3">
                            <label className="Control-label d-block">Children (2–11)</label>
                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => changePax("totalChilds", -1)}
                                aria-label="decrease children"
                              >
                                ➖
                              </button>
                              <input
                                type="text"
                                readOnly
                                className="form-control text-center bg-light shadow-none"
                                value={formData.totalChilds}
                                aria-label="total children"
                                style={{ maxWidth: "120px" }}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => changePax("totalChilds", 1)}
                                aria-label="increase children"
                              >
                                ➕
                              </button>
                            </div>
                          </div>

                          <div className="col-12 col-md-4 mb-3">
                            <label className="Control-label d-block">Infants (&lt;2)</label>
                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => changePax("totalInfants", -1)}
                                aria-label="decrease infants"
                              >
                                ➖
                              </button>
                              <input
                                type="text"
                                readOnly
                                className="form-control text-center bg-light shadow-none"
                                value={formData.totalInfants}
                                aria-label="total infants"
                                style={{ maxWidth: "120px" }}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => changePax("totalInfants", 1)}
                                aria-label="increase infants"
                              >
                                ➕
                              </button>
                            </div>
                          </div>

                          <div className="col-12 mt-2">
                            <div className="fw-semibold">Total PAX: <span className="text-primary">{(parseInt(formData.totalAdults||0) + parseInt(formData.totalChilds||0) + parseInt(formData.totalInfants||0))}</span></div>
                          </div>
                          {seatWarning && (
                            <div className="col-12 mt-2">
                              <div className="alert alert-warning">{seatWarning}</div>
                            </div>
                          )}
                          {passengerError && (
                            <div className="col-12 mt-2">
                              <div className="text-danger small">{passengerError}</div>
                            </div>
                          )}
                        </div>
                        {/* Options Section (visa controls moved to booking cards) */}
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
                                <Select
                                  options={hotelOptions}
                                  value={hotelOptions.find(o => o.value === String(form.hotelId)) || null}
                                  onChange={(opt) => {
                                    if (!opt) return updateHotelForm(index, 'hotelId', '');
                                    if (opt.value === '__SELF__') {
                                      updateHotelForm(index, 'hotelId', '');
                                      updateHotelForm(index, 'isSelfHotel', true);
                                    } else {
                                      updateHotelForm(index, 'hotelId', opt.value);
                                      updateHotelForm(index, 'isSelfHotel', false);
                                    }
                                  }}
                                  isDisabled={loading.hotels}
                                  isClearable
                                  placeholder="Select Hotel"
                                  classNamePrefix="react-select"
                                />
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

                      

                      {/* Transport Details */}
                      <div className="mb-4">
                        <div className="card shadow-sm border p-3">
                          <h5 className="mb-3 fw-bold">Transport Details</h5>

                          {transportForms.map((form, index) => (
                            <div key={form.id} className="card mb-3 shadow-sm border p-3">
                              <div className="d-flex justify-content-between align-items-start">
                                <h6 className="mb-2 fw-semibold">Route {index + 1}</h6>
                              </div>

                              {/* Transport Info */}
                              <div className="mb-3 border rounded p-3">
                                <small className="fw-semibold">Transport Info</small>
                                <div className="row g-3 mt-2">
                                  {(() => {
                                    const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                                    const sectorObj = transportSectors.find(s => s.id.toString() === form.transportSectorId);
                                    const perPersonPrice = sectorObj ? (sectorObj.adault_price || 0) : 0;
                                    const totalPrice = perPersonPrice * totalPersons;

                                    return (
                                      <>
                                        <div className="col-12 col-md-6">
                                          <label className="form-label small mb-1">Transport Type</label>
                                          <Select
                                            options={[...new Set(availableTransportSectors.map(s => s.vehicle_type))].map(type => ({ value: String(type), label: String(type) }))}
                                            value={(([...new Set(availableTransportSectors.map(s => s.vehicle_type))].map(type => ({ value: String(type), label: String(type) })).find(o => o.value === String(form.transportType))) || null)}
                                            onChange={(opt) => {
                                              const val = opt ? opt.value : '';
                                              updateTransportForm(index, 'transportType', val);
                                              updateTransportForm(index, 'transportSectorId', '');
                                            }}
                                            isDisabled={form.self || !selectedServices.has('transport')}
                                            isClearable
                                            placeholder="Select Transport Type"
                                            classNamePrefix="react-select"
                                          />
                                        </div>

                                        <div className="col-12 col-md-6">
                                          <label className="form-label small mb-1">Transport Sector</label>
                                          <Select
                                            options={availableTransportSectors.filter(s => s.vehicle_type === form.transportType).map(sector => ({
                                              value: String(sector.id),
                                              label: `${sector.small_sector?.departure_city_code || sector.small_sector?.departure_city || ''} → ${sector.small_sector?.arrival_city_code || sector.small_sector?.arrival_city || ''} ${sector.name ? `(${sector.name})` : ''}`
                                            }))}
                                            value={(availableTransportSectors.filter(s => s.vehicle_type === form.transportType).map(sector => ({
                                              value: String(sector.id),
                                              label: `${sector.small_sector?.departure_city_code || sector.small_sector?.departure_city || ''} → ${sector.small_sector?.arrival_city_code || sector.small_sector?.arrival_city || ''} ${sector.name ? `(${sector.name})` : ''}`
                                            })).find(o => o.value === String(form.transportSectorId))) || null}
                                            onChange={(opt) => updateTransportForm(index, 'transportSectorId', opt ? opt.value : '')}
                                            isDisabled={form.self || !form.transportType || !selectedServices.has('transport')}
                                            isClearable
                                            placeholder="Select Sector"
                                            classNamePrefix="react-select"
                                          />
                                        </div>

                                        <div className="col-12 col-md-4 d-flex align-items-center">
                                          <div className="form-check d-flex align-items-center gap-2">
                                            <input
                                              className="form-check-input border border-black"
                                              type="checkbox"
                                              checked={form.self}
                                              onChange={(e) => updateTransportForm(index, 'self', e.target.checked)}
                                              id={`transportSelf-${form.id}`}
                                            />
                                            <label htmlFor={`transportSelf-${form.id}`} className="form-label small mb-1">Self</label>
                                          </div>
                                        </div>

                                        
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* Pricing */}
                              <div className="mb-3 border rounded p-3">
                                <small className="fw-semibold">Pricing</small>
                                {form.transportSectorId && !form.self && (
                                  <div className="row mt-2">
                                    <div className="col-12 col-md-4 mb-2 mb-md-0">
                                      <div className="alert alert-info p-2">
                                        <small>
                                          Adult Transport: Rs. {transportSectors.find(s => s.id.toString() === form.transportSectorId)?.adault_price.toLocaleString()}
                                        </small>
                                      </div>
                                    </div>
                                    <div className="col-12 col-md-4 mb-2 mb-md-0">
                                      <div className="alert alert-info p-2">
                                        <small>
                                          Child Transport: Rs. {transportSectors.find(s => s.id.toString() === form.transportSectorId)?.child_price.toLocaleString()}
                                        </small>
                                      </div>
                                    </div>
                                    <div className="col-12 col-md-4">
                                      <div className="alert alert-info p-2">
                                        <small>
                                          Infant Transport: Rs. {transportSectors.find(s => s.id.toString() === form.transportSectorId)?.infant_price.toLocaleString()}
                                        </small>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {form.transportSectorId && !form.self && (() => {
                                  const sector = transportSectors.find(s => s.id.toString() === form.transportSectorId);
                                  const note = sector?.note || sector?.description || sector?.transport_note || sector?.note_text || sector?.details;
                                  if (!note) return null;
                                  return (
                                    <div className="row mt-2">
                                      <div className="col-12">
                                        <div className="alert alert-secondary p-2">
                                          <small><strong>Note:</strong> {note}</small>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              <div className="d-flex justify-content-end mt-3">
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => removeTransportForm(index)}
                                  disabled={transportForms.length <= 1}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="mt-3">
                            <button
                              id="btn"
                              className="btn btn-primary btn-lg w-100 d-flex justify-content-center align-items-center"
                              onClick={addTransportForm}
                              disabled={!selectedServices.has('transport')}
                              style={{ backgroundColor: '#09559B', borderColor: '#09559B', color: '#fff' }}
                            >
                              <PlusCircle size={18} className="me-2" /> Add Another Route
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Family Divider editor moved inline; modal removed */}
                      {/* Flight Details Section */}
                      <div className="">
                        <div className="row">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-semibold">Flight Details</h5>
                            <div className="d-flex gap-3 align-items-center justify-content-between">
                              <button
                                id="btn"
                                className="btn px-3 py-2"
                                onClick={() => {
                                  setShowFlightModal(true);
                                  // reset no-pickup when user chooses to pick a flight
                                  setNoAirportPickup(false);
                                }}
                              >
                                Select from Available Umrah Flights
                              </button>

                              {/* Custom flight creation removed per client request */}

                              {/* If booking is transport-only (no visa), allow skipping airport pickup */}
                              {selectedServices.has('transport') && !selectedServices.has('visa') && (
                                <div className="form-check ms-2">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="noAirportPickup"
                                    checked={noAirportPickup}
                                    onChange={(e) => setNoAirportPickup(e.target.checked)}
                                  />
                                  <label className="form-check-label ms-1" htmlFor="noAirportPickup">No airport pickup</label>
                                </div>
                              )}
                            </div>
                          </div>
                              {/* Flight details table matching client design */}
                              <div className="table-responsive mb-3">
                                <table className="table table-sm align-middle">
                                  <thead>
                                    <tr>
                                      <th style={{ width: "90px" }}></th>
                                      <th style={{ width: "140px" }}>PNR</th>
                                      <th style={{ width: "160px" }}>Flight</th>
                                      <th style={{ width: "90px" }}>No</th>
                                      <th style={{ width: "120px" }}>FROM</th>
                                      <th style={{ width: "120px" }}>TO</th>
                                      <th style={{ width: "160px" }}>Departure Date & Time</th>
                                      <th style={{ width: "160px" }}>Arrival Date & Time</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td><strong>Departure</strong></td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="PNR"
                                          value={pnr}
                                          onChange={(e) => setPnr(e.target.value)}
                                          disabled={isFullPackage}
                                        />
                                      </td>
                                      <td>
                                        <Select
                                          options={ticketsList.map(f => ({ value: String(f.id), label: `${airlinesMap[f.airline]?.code || airlinesMap[f.airline]?.name || f.airline}` }))}
                                          value={ticketsList.map(f => ({ value: String(f.id), label: `${airlinesMap[f.airline]?.code || airlinesMap[f.airline]?.name || f.airline}` })).find(o => o.value === String(ticketId)) || null}
                                          onChange={(opt) => {
                                            const id = opt ? opt.value : '';
                                            if (!id) {
                                              setTicketId(0);
                                              setSelectedFlight(null);
                                              resetFlightFields();
                                              return;
                                            }
                                            const f = ticketsList.find(t => t.id.toString() === id.toString());
                                            if (f) handleFlightSelect(f);
                                          }}
                                          isClearable
                                          isDisabled={isFullPackage}
                                          placeholder="Select Flight"
                                          classNamePrefix="react-select"
                                        />
                                      </td>
                                      <td>
                                        <input type="text" className="form-control form-control-sm" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} disabled={isFullPackage} />
                                      </td>
                                      <td>
                                        {ticketId ? (
                                          <input type="text" className="form-control form-control-sm" value={fromSector} onChange={(e) => setFromSector(e.target.value)} disabled={isFullPackage} />
                                        ) : (
                                          <CitySelect
                                            value={fromSector}
                                            onChange={(v) => setFromSector(v)}
                                            placeholder="FROM"
                                            isDisabled={isFullPackage}
                                          />
                                        )}
                                      </td>
                                      <td>
                                        {ticketId ? (
                                          <input type="text" className="form-control form-control-sm" value={toSector} onChange={(e) => setToSector(e.target.value)} disabled={isFullPackage} />
                                        ) : (
                                          <CitySelect
                                            value={toSector}
                                            onChange={(v) => setToSector(v)}
                                            placeholder="TO"
                                            isDisabled={isFullPackage}
                                          />
                                        )}
                                      </td>
                                      <td>
                                        <input type="datetime-local" className="form-control form-control-sm" value={departureDate || ""} onChange={(e) => setDepartureDate(e.target.value)} disabled={isFullPackage} />
                                      </td>

                                      <td>
                                        <input type="datetime-local" className="form-control form-control-sm" value={returnDate || ""} onChange={(e) => setReturnDate(e.target.value)} disabled={isFullPackage} />
                                      </td>
                                    </tr>

                                    <tr>
                                      <td><strong>Return</strong></td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="PNR"
                                          value={returnPnr}
                                          onChange={(e) => setReturnPnr(e.target.value)}
                                          disabled={isFullPackage}
                                        />
                                      </td>
                                      <td>
                                        <Select
                                          options={ticketsList.map(f => ({ value: String(f.id), label: `${airlinesMap[f.airline]?.code || airlinesMap[f.airline]?.name || f.airline}` }))}
                                          value={ticketsList.map(f => ({ value: String(f.id), label: `${airlinesMap[f.airline]?.code || airlinesMap[f.airline]?.name || f.airline}` })).find(o => o.value === String(ticketId)) || null}
                                          onChange={(opt) => {
                                            const id = opt ? opt.value : '';
                                            if (!id) {
                                              setTicketId(0);
                                              setSelectedFlight(null);
                                              resetFlightFields();
                                              return;
                                            }
                                            const f = ticketsList.find(t => t.id.toString() === id.toString());
                                            if (f) handleFlightSelect(f);
                                          }}
                                          isClearable
                                          isDisabled={isFullPackage}
                                          placeholder="Select Flight"
                                          classNamePrefix="react-select"
                                        />
                                      </td>
                                      <td>
                                        <input type="text" className="form-control form-control-sm" value={returnFlightNumber} onChange={(e) => setReturnFlightNumber(e.target.value)} disabled={isFullPackage} />
                                      </td>
                                      <td>
                                        {ticketId ? (
                                          <input type="text" className="form-control form-control-sm" value={returnFromSector} onChange={(e) => setReturnFromSector(e.target.value)} disabled={isFullPackage} />
                                        ) : (
                                          <CitySelect
                                            value={returnFromSector}
                                            onChange={(v) => setReturnFromSector(v)}
                                            placeholder="FROM"
                                            isDisabled={isFullPackage}
                                          />
                                        )}
                                      </td>
                                      <td>
                                        {ticketId ? (
                                          <input type="text" className="form-control form-control-sm" value={returnToSector} onChange={(e) => setReturnToSector(e.target.value)} disabled={isFullPackage} />
                                        ) : (
                                          <CitySelect
                                            value={returnToSector}
                                            onChange={(v) => setReturnToSector(v)}
                                            placeholder="TO"
                                            isDisabled={isFullPackage}
                                          />
                                        )}
                                      </td>
                                      <td>
                                        <input type="datetime-local" className="form-control form-control-sm" value={returnDepartureDate || ""} onChange={(e) => setReturnDepartureDate(e.target.value)} disabled={isFullPackage} />
                                      </td>

                                      <td>
                                        <input type="datetime-local" className="form-control form-control-sm" value={returnReturnDate || ""} onChange={(e) => setReturnReturnDate(e.target.value)} disabled={isFullPackage} />
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
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
                          setShowCustomTicketModal(false);
                          toast.success("Custom ticket created successfully!");
                        }}
                      />

                      <div className="mb-4 mt-5">
                        {/* Families Section (moved out of each hotel card) */}
                        <div className="card mb-3 shadow-sm border p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="mb-0 fw-semibold">Families</h5>
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => {
                                const totalPax = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0) + parseInt(formData.totalInfants || 0);
                                const groups = computeFamilyGroups(totalPax);
                                setFamilyGroups(groups);
                              }}>Compute Families</button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingFamilies(true)}>Edit Families</button>
                            </div>
                          </div>

                          <div className="mt-2">
                            {editingFamilies ? (
                              <div>
                                <p>Suggested groups (greedy allocation): edit sizes or add/remove groups.</p>
                                <div>
                                  {familyGroups.map((g, i) => (
                                    <div className="d-flex align-items-center mb-2" key={i}>
                                      <div className="me-2">Family {i + 1}</div>
                                      <input type="number" className="form-control form-control-sm me-2" style={{ width: 100 }} value={g}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          setFamilyGroups(prev => {
                                            const copy = [...prev];
                                            copy[i] = val;
                                            return copy;
                                          });
                                        }} />
                                      <button className="btn btn-sm btn-outline-danger" onClick={() => {
                                        setFamilyGroups(prev => prev.filter((_, idx) => idx !== i));
                                      }}>Remove</button>
                                    </div>
                                  ))}
                                  <div>
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => setFamilyGroups(prev => [...prev, 1])}>Add Family</button>
                                  </div>
                                </div>
                                <div className="small text-muted mt-2">You can edit family sizes before applying. Apply will persist these groups and assign them to hotels (Family 1 becomes authoritative; other families inherit and can override room type).</div>
                                <div className="mt-3 d-flex justify-content-end gap-2">
                                  <button className="btn btn-primary" onClick={() => {
                                    // Persist groups and assign them to hotels.
                                    setHotelForms(prev => {
                                      const updated = prev.map(h => ({ ...h }));
                                      if (familyGroups.length === 0) return updated;

                                      const familyNames = familyGroups.map((_, i) => `Family ${i + 1}`);
                                      for (let i = 0; i < updated.length; i++) {
                                        updated[i].assignedFamilies = [...familyNames];
                                      }

                                      return updated;
                                    });

                                    // Initialize familyRoomOverrides for other families to match Family 1 room types
                                    setFamilyRoomOverrides(prev => {
                                      const copy = { ...prev };
                                      for (let f = 1; f < familyGroups.length; f++) {
                                        for (let h = 0; h < hotelForms.length; h++) {
                                          const key = `${f}_${h}`;
                                          if (typeof copy[key] === 'undefined') {
                                            copy[key] = hotelForms[h]?.roomType || '';
                                          }
                                        }
                                      }
                                      return copy;
                                    });

                                    // Initialize single room-type selection per family (empty by default)
                                    setFamilyRoomTypes(() => {
                                      const m = {};
                                      for (let i = 0; i < familyGroups.length; i++) m[i] = '';
                                      return m;
                                    });

                                    setEditingFamilies(false);
                                    toast.success('Family groups applied — Family 1 is authoritative; other families inherit details.');
                                  }}>Apply</button>
                                  <button className="btn btn-secondary" onClick={() => setEditingFamilies(false)}>Close</button>
                                </div>
                              </div>
                            ) : familyGroups && familyGroups.length > 0 ? (
                              <div>
                                <div className="small text-muted mb-2">Defined: {familyGroups.map((g, i) => `Family ${i + 1} (${g})`).join(' • ')}</div>

                                {/* Per-family overrides (only roomType editable for families > 1) */}
                                {familyGroups.map((size, fIdx) => (
                                  <div key={fIdx} className="mb-3">
                                    <div className="d-flex align-items-center justify-content-between">
                                      <div><strong>Family {fIdx + 1}</strong> <small className="text-muted">({size} pax)</small></div>
                                      <div style={{ minWidth: 280, maxWidth: 320 }}>
                                        <Select
                                          options={unionRoomTypeOptions}
                                          value={unionRoomTypeOptions.find(o => o.value === (familyRoomTypes[fIdx] ?? '')) || null}
                                          onChange={(opt) => {
                                            const v = opt ? opt.value : '';
                                            setFamilyRoomTypes(prev => ({ ...prev, [fIdx]: v }));
                                          }}
                                          isDisabled={!(unionRoomTypeOptions.length > 0 && selectedServices.has('hotel'))}
                                          isClearable
                                          placeholder={unionRoomTypeOptions.length ? 'Select room type' : 'No room types available'}
                                          classNamePrefix="react-select"
                                        />
                                        {((familyRoomTypes[fIdx] ?? '') && !unionRoomTypeOptions.find(o => o.value === (familyRoomTypes[fIdx] ?? ''))) && (
                                          <div className="text-danger small mt-1">Selected room type is not available for current hotels</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="small text-muted">No families defined. Click Compute Families or Edit Families.</div>
                            )}

                          {/* Selected Hotels summary rows (inside Families card) */}
                          <div className="mt-3">
                            <h6 className="fw-semibold small mb-2">Selected Hotels</h6>
                            {(hotelForms || []).map((hf, hi) => {
                              if (!hf) return null;
                              if (!hf.hotelId && !hf.selfHotelName && !hf.hotelName) return null;
                              const hotelObj = hotels.find(h => h.id.toString() === hf.hotelId);
                              const name = hotelObj?.name || hf.selfHotelName || hf.hotelName || `Hotel ${hi + 1}`;
                              const checkIn = hf.checkIn || '—';
                              const checkOut = hf.checkOut || '—';
                              const nights = hf.noOfNights || '—';
                              const sharingYesNo = (hf.sharingType === 'Gender or Family') ? 'Yes' : 'No';

                              return (
                                <div key={hi} className="d-flex align-items-center justify-content-between border rounded p-2 mb-2">
                                  <div style={{ minWidth: 220, fontWeight: 600 }}>{name}</div>
                                  <div className="small text-muted">Check-in: {checkIn}</div>
                                  <div className="small text-muted">Check-out: {checkOut}</div>
                                  <div className="small text-muted">Nights: {nights}</div>
                                </div>
                              );
                            })}
                          </div>
                          </div>
                        </div>

                        {hotelForms.map((form, index) => renderHotelForm(form, index))}
                        <div className="mt-3">
                          <button
                            id="btn" className="btn btn-primary btn-lg w-100 d-flex justify-content-center align-items-center"
                            onClick={addHotelForm}
                            disabled={!selectedServices.has('hotel')}
                            style={{ backgroundColor: '#09559B', borderColor: '#09559B', color: '#fff' }}
                          >
                            <PlusCircle size={18} className="me-2" /> Add Another Hotel
                          </button>

                          <div className="d-flex justify-content-end mt-2">
                            <button
                              id="btn" className="btn btn-outline-primary btn-sm"
                              onClick={() => {
                                const totalPax = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0) + parseInt(formData.totalInfants || 0);
                                const groups = computeFamilyGroups(totalPax);
                                setFamilyGroups(groups);
                                setEditingFamilies(true);
                              }}
                              disabled={!(parseInt(formData.totalAdults||0) + parseInt(formData.totalChilds||0) + parseInt(formData.totalInfants||0) > 0)}
                            >
                              Family Divider
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Food Details */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-semibold">Food Details</h5>
                        </div>

                        {foodForms.map((form, index) => {
                          const selectedFoodItem = foodPrices.find(f => f.id.toString() === form.foodId);
                          const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                          const unitRate = selectedFoodItem ? (selectedFoodItem.per_pex || 0) : (form.price || 0);
                          const computedTotal = unitRate * totalPersons;

                          return (
                            <div key={form.id} className="card mb-3 shadow-sm border p-3">
                              {/* Food Info */}
                              <div className="mb-3 pb-2 border-bottom">
                                <h6 className="small text-muted mb-2">Food Info</h6>
                                <div className="row g-2 align-items-center">
                                  <div className="col-md-6">
                                    <label className="small">Food</label>
                                    {
                                      (() => {
                                        const options = (foodPrices || [])
                                          .filter(f => f.active)
                                          .map(f => ({ value: String(f.id), label: `${f.title} (Min ${f.min_pex} persons)` }));

                                        return (
                                          <Select
                                            options={options}
                                            value={options.find(o => o.value === String(form.foodId)) || null}
                                            onChange={(opt) => {
                                              const updated = [...foodForms];
                                              updated[index].foodId = opt ? opt.value : "";
                                              setFoodForms(updated);
                                              // Recalculate totals after selection
                                              setTimeout(() => {
                                                try {
                                                  calculateCosts();
                                                } catch (err) {
                                                  // ignore
                                                }
                                              }, 0);
                                            }}
                                            isDisabled={foodSelf || loading.food}
                                            isClearable
                                            isSearchable
                                            placeholder={loading.food ? 'Loading food options...' : (options.length ? 'Select Food' : 'No food options available')}
                                            classNamePrefix="react-select"
                                          />
                                        );
                                      })()
                                    }
                                  </div>

                                  <div className="col-md-4">
                                    <label className="small">City / Hotel</label>
                                    <input
                                      type="text"
                                      className="form-control shadow-none"
                                      placeholder="City or Hotel name (optional)"
                                      value={form.city || ""}
                                      onChange={(e) => {
                                        const updated = [...foodForms];
                                        updated[index].city = e.target.value;
                                        setFoodForms(updated);
                                      }}
                                    />
                                  </div>

                                  <div className="col-md-2 d-flex align-items-center">
                                    <div className="form-check d-flex align-items-center gap-2">
                                      <input
                                        className="form-check-input border border-black"
                                        type="checkbox"
                                        checked={foodSelf}
                                        onChange={() => setFoodSelf(!foodSelf)}
                                        id={`foodSelf-${form.id}`}
                                      />
                                      <label htmlFor={`foodSelf-${form.id}`}>Self</label>
                                    </div>
                                  </div>

                                  <div className="col-12 mt-2">
                                    <label className="small">Note</label>
                                    <textarea
                                      className="form-control shadow-none"
                                      rows={2}
                                      placeholder="Optional note"
                                      value={form.note || ""}
                                      onChange={(e) => {
                                        const updated = [...foodForms];
                                        updated[index].note = e.target.value;
                                        setFoodForms(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Dates */}
                              <div className="mb-3 pb-2 border-bottom">
                                <h6 className="small text-muted mb-2">Dates</h6>
                                <div className="row g-2">
                                  <div className="col-md-6">
                                    <label className="small">Start Date</label>
                                    <input
                                      type="date"
                                      className="form-control shadow-none"
                                      value={form.startDate || ""}
                                      onChange={(e) => {
                                        const updated = [...foodForms];
                                        updated[index].startDate = e.target.value;
                                        setFoodForms(updated);
                                      }}
                                    />
                                  </div>

                                  <div className="col-md-6">
                                    <label className="small">Days / Meals</label>
                                    <input
                                      type="number"
                                      min={1}
                                      className="form-control shadow-none"
                                      value={form.noOfDays || ""}
                                      onChange={(e) => {
                                        const updated = [...foodForms];
                                        updated[index].noOfDays = e.target.value;
                                        setFoodForms(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Pricing */}
                              <div className="mb-3 pb-2 border-bottom">
                                <h6 className="small text-muted mb-2">Pricing</h6>
                                <div className="row g-2 align-items-center">
                                  <div className="col-md-4">
                                    <label className="small">Rate (per person)</label>
                                    <input
                                      type="text"
                                      className="form-control shadow-none"
                                      value={unitRate ? unitRate.toString() : ""}
                                      readOnly
                                    />
                                  </div>

                                  <div className="col-md-4">
                                    <label className="small">Min Persons</label>
                                    <input
                                      type="text"
                                      className="form-control shadow-none"
                                      value={selectedFoodItem ? (selectedFoodItem.min_pex || "") : (form.minPersons || "")}
                                      readOnly
                                    />
                                  </div>

                                  <div className="col-md-4">
                                    <label className="small">Total Price</label>
                                    <input
                                      type="text"
                                      className="form-control shadow-none"
                                      value={computedTotal.toString()}
                                      readOnly
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="d-flex justify-content-end">
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
                          );
                        })}

                        

                        {/* Add More Food button: use same filled primary style as Hotel (JSX-only) */}
                        <div className="mt-3">
                          <button
                            type="button"
                            className="btn btn-primary btn-lg w-100 d-flex justify-content-center align-items-center"
                            onClick={() => setFoodForms([...foodForms, { id: Date.now(), foodId: "" }])}
                            style={{ backgroundColor: '#09559B', borderColor: '#09559B', color: '#fff' }}
                          >
                            <PlusCircle size={18} className="me-2" /> Add More Food
                          </button>
                        </div>
                      </div>

                      {/* Ziarat Details */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-semibold">Ziarat Details</h5>
                        </div>

                        {ziaratForms.map((form, index) => {
                          const ziaratItem = ziaratPrices.find(z => z.id.toString() === form.ziaratId);
                          const totalPersons = parseInt(formData.totalAdults || 0) + parseInt(formData.totalChilds || 0);
                          const perPersonPrice = ziaratItem?.price || 0;
                          const totalPrice = perPersonPrice * totalPersons;

                          return (
                            <div key={form.id} className="card mb-3 shadow-sm border p-3">
                              {/* Ziyarat Info */}
                              <div className="mb-3 pb-2 border-bottom">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div className="fw-semibold small">Ziyarat Info</div>
                                </div>

                                <div className="row g-2 mt-2">
                                  <div className="col-md-6">
                                    <label className="form-label small">Ziarat</label>
                                    {
                                      (() => {
                                        const options = (ziaratPrices || []).map(z => ({ value: String(z.id), label: (z.ziarat_title || z.title || z.name) }));

                                        return (
                                          <Select
                                            options={options}
                                            value={options.find(o => o.value === String(form.ziaratId)) || null}
                                            onChange={(opt) => {
                                              const updated = [...ziaratForms];
                                              const selectedId = opt ? opt.value : "";
                                              updated[index].ziaratId = selectedId;

                                              // Try to auto-fill city from the selected ziarat entry
                                              try {
                                                const z = ziaratPrices.find(z => z.id?.toString() === selectedId?.toString());
                                                const cityName = z ? (citiesMap[(z.city_id || z.city)?.toString?.()]?.name || z.city_name || z.city?.name || "") : "";
                                                updated[index].city = cityName;
                                              } catch (err) {
                                                updated[index].city = updated[index].city || "";
                                              }

                                              setZiaratForms(updated);

                                              // Recalculate visa and totals immediately after selection
                                              setTimeout(() => {
                                                try {
                                                  const prices = calculateVisaPrices();
                                                  setCalculatedVisaPrices(prices);
                                                } catch (err) {
                                                  // ignore if calculation not ready
                                                }
                                                try {
                                                  calculateCosts();
                                                } catch (err) {
                                                  // ignore
                                                }
                                              }, 0);
                                            }}
                                            isDisabled={ziaratSelf || loading.ziarat}
                                            isClearable
                                            isSearchable
                                            placeholder={loading.ziarat ? 'Loading ziarat options...' : (options.length ? 'Select Ziarat' : 'No ziarat options available')}
                                            classNamePrefix="react-select"
                                          />
                                        );
                                      })()
                                    }
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label small">City</label>
                                    <input
                                      type="text"
                                      className="form-control shadow-none"
                                      placeholder="City"
                                      value={form.city || ""}
                                      onChange={(e) => {
                                        const updated = [...ziaratForms];
                                        updated[index].city = e.target.value;
                                        setZiaratForms(updated);
                                      }}
                                    />
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label small mb-1">Note (optional)</label>
                                    <input
                                      type="text"
                                      className="form-control shadow-none border rounded px-2 py-1"
                                      placeholder="Add note"
                                      value={form.note || ""}
                                      onChange={(e) => {
                                        const updated = [...ziaratForms];
                                        updated[index].note = e.target.value;
                                        setZiaratForms(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Dates */}
                              <div className="mb-3 pb-2 border-bottom">
                                <div className="fw-semibold small mb-2">Dates</div>
                                <div className="row g-2">
                                  <div className="col-md-4">
                                    <label className="form-label small">Visit Date</label>
                                    <input
                                      type="date"
                                      className="form-control shadow-none"
                                      value={form.visitDate || ""}
                                      onChange={(e) => {
                                        const updated = [...ziaratForms];
                                        updated[index].visitDate = e.target.value;
                                        setZiaratForms(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Transport & Pricing */}
                              <div className="mb-3 pb-2 border-bottom">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div className="fw-semibold small">Transport & Pricing</div>
                                </div>

                                <div className="row g-2 mt-2 align-items-center">
                                  <div className="col-md-4">
                                    <label className="form-label small">Transport Type</label>
                                    {
                                      (() => {
                                        const options = [
                                          { value: 'Company Shared Bus', label: 'Company Shared Bus' },
                                          { value: 'Private', label: 'Private' },
                                          { value: 'No Transport', label: 'No Transport' },
                                        ];

                                        return (
                                          <Select
                                            options={options}
                                            value={options.find(o => o.value === form.transportType) || null}
                                            onChange={(opt) => {
                                              const updated = [...ziaratForms];
                                              updated[index].transportType = opt ? opt.value : "";
                                              setZiaratForms(updated);
                                            }}
                                            isDisabled={ziaratSelf}
                                            isClearable
                                            isSearchable
                                            placeholder="Select Transport"
                                            classNamePrefix="react-select"
                                          />
                                        );
                                      })()
                                    }
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label small">Per Person</label>
                                    <input
                                      type="text"
                                      readOnly
                                      className="form-control shadow-none"
                                      value={formatPriceWithCurrency(perPersonPrice, "ziarat", false)}
                                    />
                                  </div>

                                  <div className="col-md-3 text-end">
                                    <label className="form-label small mb-1 d-block">Total Price</label>
                                    <input
                                      type="text"
                                      readOnly
                                      className="form-control shadow-none text-end fw-bold"
                                      value={formatPriceWithCurrency(totalPrice, "ziarat", true)}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="d-flex justify-content-end">
                                <div className="me-auto align-self-center small text-muted">&nbsp;</div>
                                <div className="d-flex gap-2">
                                  <div className="form-check d-flex align-items-center gap-2">
                                    <input
                                      className="form-check-input border border-black"
                                      type="checkbox"
                                      checked={ziaratSelf}
                                      onChange={() => setZiaratSelf(!ziaratSelf)}
                                      id={`ziaratSelf-${form.id}`}
                                    />
                                    <label htmlFor={`ziaratSelf-${form.id}`}>Self</label>
                                  </div>

                                  {index === ziaratForms.length - 1 && ziaratForms.length > 1 ? (
                                    <div className="text-end">
                                      <button
                                        className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center px-3"
                                        onClick={() => {
                                          const updated = ziaratForms.filter((_, i) => i !== index);
                                          setZiaratForms(updated);
                                        }}
                                      >
                                        <span className="me-2"><Trash /></span>
                                        Remove
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add More Ziyarat button: use same filled primary style as Hotel (JSX-only) */}
                        <div className="mt-3">
                          <button
                            type="button"
                            className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-between"
                            onClick={() => setZiaratForms([...ziaratForms, { id: Date.now(), ziaratId: "" }])}
                            style={{ backgroundColor: '#09559B', borderColor: '#09559B', color: '#fff' }}
                          >
                            <span style={{ width: 24 }} />
                            <span className="mx-auto">Add More Ziyarat</span>
                            <PlusCircle size={18} />
                          </button>
                        </div>
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

                      <div className="text-end mb-4 d-flex justify-content-end gap-3">
                        <button id="btn" className="btn btn-primary btn-sm d-flex align-items-center px-3 py-2" onClick={handleViewClick} style={{ backgroundColor: '#09559B', borderColor: '#09559B', color: '#fff' }}>
                          <Eye size={16} className="me-2" /> View
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
                                                {riyalRate?.is_hotel_pkr ? "PKR " : "SAR "}
                                                {hotelCost?.perNight}
                                              </td>
                                              <td>{quantity}</td>
                                              <td> {riyalRate?.is_hotel_pkr ? "PKR " : "SAR "} {hotelCost?.total}</td>
                                              <td>
                                                {riyalRate?.rate ?? '—'}
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
                                              <td>{ziaratItem?.ziarat_title || ziaratItem?.title || ziaratItem?.name || 'N/A'}</td>
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
                                            <span className="fw-bold ms-2">@{riyalRate?.rate ?? '—'}</span>
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
                                            <span className="fw-bold ms-2">@{riyalRate?.rate ?? '—'}</span>
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
                                            <span className="fw-bold ms-2">@{riyalRate?.rate ?? '—'}</span>
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
                                            <span className="fw-bold ms-2">@{riyalRate?.rate ?? '—'}</span>
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
                                            <span className="fw-bold ms-2">@{riyalRate?.rate ?? '—'}</span>
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

                  {/* Debug panel: Only Visa Prices (raw) - minimal connector, no business logic */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="mb-0">Only Visa Prices (raw)</h6>
                      <div>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => fetchOnlyVisaPrices()}
                        >
                          Refresh
                        </button>
                        <button
                          className={`btn btn-sm ${showOnlyVisaDebug ? 'btn-secondary' : 'btn-outline-secondary'}`}
                          onClick={() => setShowOnlyVisaDebug(s => !s)}
                        >
                          {showOnlyVisaDebug ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    {showOnlyVisaDebug && (
                      <div className="card p-3 bg-light" style={{ maxHeight: 280, overflow: 'auto' }}>
                        {onlyVisaPrices && onlyVisaPrices.length > 0 ? (
                          <table className="table table-sm table-bordered mb-0">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>City</th>
                                <th>Adult Sell</th>
                                <th>Child Sell</th>
                                <th>Infant Sell</th>
                                <th>Is Transport</th>
                                <th>Visa Option</th>
                              </tr>
                            </thead>
                            <tbody>
                              {onlyVisaPrices.map(v => (
                                <tr key={v.id}>
                                  <td>{v.id}</td>
                                  <td>{v.title || v.name || '-'}</td>
                                  <td>{v.city_id || v.city || '-'}</td>
                                  <td>{v.adult_selling_price ?? v.adult_price ?? '-'}</td>
                                  <td>{v.child_selling_price ?? v.child_price ?? '-'}</td>
                                  <td>{v.infant_selling_price ?? v.infant_price ?? '-'}</td>
                                  <td>{v.is_transport ? 'Yes' : 'No'}</td>
                                  <td>{v.visa_option || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="small text-muted">No Only Visa prices loaded</div>
                        )}
                      </div>
                    )}
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