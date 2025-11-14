import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { CloudUpload } from "lucide-react";
import { PersonDash } from "react-bootstrap-icons";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const CustomUmrahPackagesDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();

  // State declarations
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [packageData, setPackageData] = useState(state?.packageData || null);
  const [totalPrice, setTotalPrice] = useState(state?.totalPrice || 0);
  const [passengers, setPassengers] = useState(state?.passengers || []);

  const countries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Congo-Brazzaville)",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Ivory Coast",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar (Burma)",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe"
  ]

  const token = localStorage.getItem("agentAccessToken");
  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0];
  };
  const orgId = getOrgId();

  // Create passenger function
  const createPassenger = (type) => ({
    id: Date.now() + Math.random(),
    type,
    title: "",
    name: "",
    lName: "",
    DOD: "",
    passportNumber: "",
    passportExpiry: "",
    country: "",
    passportFile: null,
    includeBed: false,
    visa: false,
  });

  // Initialize passengers based on package data
  const initializePassengers = (packageData) => {
    const initialPassengers = [];
    const { total_adaults, total_children, total_infants } = packageData;

    for (let i = 0; i < total_adaults; i++) {
      initialPassengers.push(createPassenger("Adult"));
    }
    for (let i = 0; i < total_children; i++) {
      initialPassengers.push(createPassenger("Child"));
    }
    for (let i = 0; i < total_infants; i++) {
      initialPassengers.push(createPassenger("Infant"));
    }

    return initialPassengers;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Always fetch cities data
        const citiesResponse = await axios.get(
          `http://127.0.0.1:8000/api/cities/?organization=${orgId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCities(citiesResponse.data);

        if (state?.packageData) {
          // If coming back from review, use existing state
          setPackageData(state.packageData);
          setPassengers(state.passengers);
          setTotalPrice(state.totalPrice);
        } else {
          // Otherwise fetch fresh package data
          const packageResponse = await axios.get(
            `http://127.0.0.1:8000/api/custom-umrah-packages/${id}/?organization=${orgId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          setPackageData(packageResponse.data);
          calculateTotalPrice(packageResponse.data);

          // Initialize passengers only if not coming from state
          if (!state?.passengers) {
            setPassengers(initializePassengers(packageResponse.data));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, state, orgId, token]);
  const handleContinue = (e) => {
    e.preventDefault();
    if (validateForm()) {
      navigate("/packages/custom-umrah/review", {
        state: {
          packageData,
          passengers,
          totalPrice,
          cities,
          id
        }
      });
    }
  };


  const getCityCode = (cityId) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.code : `City (ID: ${cityId})`;
  };

  const [riyalRate, setRiyalRate] = useState(null);

  // Add this useEffect to fetch the riyal rates
  useEffect(() => {
    const fetchRiyalRates = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/riyal-rates/?organization=${orgId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.length > 0) {
          setRiyalRate(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching riyal rates:", error);
      }
    };

    fetchRiyalRates();
  }, [token]);

  // Updated conversion function
  const convertPrice = (price, isInPKR) => {
    if (!riyalRate) return price; // Return original if rates not loaded yet

    // If price is already in PKR or rate is 0, return as-is
    if (isInPKR || riyalRate.rate === 0) {
      return price;
    }
    // Otherwise convert from SAR to PKR
    return price * riyalRate.rate;
  };

  // Updated calculateTotalPrice function
  const calculateTotalPrice = (data) => {
    if (!data || !riyalRate) return 0;

    let total = 0;

    // Calculate hotel costs
    data.hotel_details.forEach(hotel => {
      const price = riyalRate.is_hotel_pkr ? hotel.price : hotel.price * riyalRate.rate;
      total += price * data.total_adaults;
    });

    // Calculate visa costs
    const adultVisaPrice = riyalRate.is_visa_pkr ? data.adault_visa_price : data.adault_visa_price * riyalRate.rate;
    const childVisaPrice = riyalRate.is_visa_pkr ? data.child_visa_price : data.child_visa_price * riyalRate.rate;
    const infantVisaPrice = riyalRate.is_visa_pkr ? data.infant_visa_price : data.infant_visa_price * riyalRate.rate;

    total += adultVisaPrice * data.total_adaults;
    total += childVisaPrice * data.total_children;
    total += infantVisaPrice * data.total_infants;

    // Calculate transport costs
    data.transport_details.forEach(transport => {
      const adultTransportPrice = riyalRate.is_transport_pkr
        ? transport.transport_sector_info?.adault_price || 0
        : (transport.transport_sector_info?.adault_price || 0) * riyalRate.rate;

      const childTransportPrice = riyalRate.is_transport_pkr
        ? transport.transport_sector_info?.child_price || 0
        : (transport.transport_sector_info?.child_price || 0) * riyalRate.rate;

      const infantTransportPrice = riyalRate.is_transport_pkr
        ? transport.transport_sector_info?.infant_price || 0
        : (transport.transport_sector_info?.infant_price || 0) * riyalRate.rate;

      total += adultTransportPrice * data.total_adaults;
      total += childTransportPrice * data.total_children;
      total += infantTransportPrice * data.total_infants;
    });

    // Calculate flight costs (always in PKR)
    data.ticket_details.forEach(ticket => {
      total += (ticket.ticket_info?.adult_price || 0) * data.total_adaults;
      total += (ticket.ticket_info?.child_price || 0) * data.total_children;
      total += (ticket.ticket_info?.infant_price || 0) * data.total_infants;
    });

    setTotalPrice(total);
  };

  useEffect(() => {
    if (packageData && riyalRate) {
      calculateTotalPrice(packageData);
    }
  }, [packageData, riyalRate]);

  // const calculateTotalPrice = (data) => {
  //   if (!data) return 0;

  //   let total = 0;

  //   // Calculate hotel costs
  //   data.hotel_details.forEach(hotel => {
  //     total += (hotel.price || 0) * data.total_adaults;
  //   });

  //   // Calculate visa costs
  //   total += (data.adault_visa_price || 0) * data.total_adaults;
  //   total += (data.child_visa_price || 0) * data.total_children;
  //   total += (data.infant_visa_price || 0) * data.total_infants;

  //   // Calculate transport costs
  //   data.transport_details.forEach(transport => {
  //     total += (transport.transport_sector_info?.adault_price || 0) * data.total_adaults;
  //     total += (transport.transport_sector_info?.child_price || 0) * data.total_children;
  //     total += (transport.transport_sector_info?.infant_price || 0) * data.total_infants;
  //   });

  //   // Calculate flight costs
  //   data.ticket_details.forEach(ticket => {
  //     total += (ticket.ticket_info?.adult_price || 0) * data.total_adaults;
  //     total += (ticket.ticket_info?.child_price || 0) * data.total_children;
  //     total += (ticket.ticket_info?.infant_price || 0) * data.total_infants;
  //   });

  //   setTotalPrice(total);
  // };

  const getCityName = (cityId) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : `City (ID: ${cityId})`;
  };

  const getTitleOptions = (passengerType) => {
    switch (passengerType) {
      case "Adult":
        return (
          <>
            <option value="">Select Title</option>
            <option value="MR">MR</option>
            <option value="MRS">MRS</option>
            <option value="MS">MS</option>
          </>
        );
      case "Child":
        return (
          <>
            <option value="">Select Title</option>
            <option value="MSTR">MSTR</option>
            <option value="MISS">MISS</option>
          </>
        );
      case "Infant":
        return (
          <>
            <option value="">Select Title</option>
            <option value="MSTR">MSTR</option>
            <option value="MISS">MISS</option>
          </>
        );
      default:
        return <option value="">Select Type First</option>;
    }
  };

  // const [passengers, setPassengers] = useState([]);

  const addPassenger = () => {
    setPassengers([...passengers, createPassenger("Adult")]);
  };

  const removePassenger = (id) => {
    if (passengers.length <= packageData.total_adaults + packageData.total_children + packageData.total_infants) {
      alert("You cannot remove the initial passengers included in the package");
      return;
    }
    setPassengers(passengers.filter((p) => p.id !== id));
  };

  const updatePassenger = (id, field, value) => {
    setPassengers(
      passengers.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handlePassportUpload = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors({
          ...formErrors,
          [`passenger-passportFile-${id}`]: "File size should be less than 2MB"
        });
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setFormErrors({
          ...formErrors,
          [`passenger-passportFile-${id}`]: "Only JPEG, PNG, or PDF files are allowed"
        });
        return;
      }
      updatePassenger(id, "passportFile", file);
      setFormErrors({
        ...formErrors,
        [`passenger-passportFile-${id}`]: undefined
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    passengers.forEach(passenger => {
      if (!passenger.title) {
        errors[`passenger-title-${passenger.id}`] = "Title is required";
        isValid = false;
      }
      if (!passenger.name) {
        errors[`passenger-name-${passenger.id}`] = "First name is required";
        isValid = false;
      }
      if (!passenger.lName) {
        errors[`passenger-lName-${passenger.id}`] = "Last name is required";
        isValid = false;
      }
      if (!passenger.DOB) {
        errors[`passenger-DOB-${passenger.id}`] = "DOB is required";
        isValid = false;
      }
      if (!passenger.passportNumber) {
        errors[`passenger-passportNumber-${passenger.id}`] = "Passport number is required";
        isValid = false;
      }
      if (!passenger.passportExpiry) {
        errors[`passenger-passportExpiry-${passenger.id}`] = "Passport expiry is required";
        isValid = false;
      } else if (new Date(passenger.passportExpiry) < new Date()) {
        errors[`passenger-passportExpiry-${passenger.id}`] = "Passport must be valid";
        isValid = false;
      }
      if (!passenger.country) {
        errors[`passenger-country-${passenger.id}`] = "Country is required";
        isValid = false;
      }
      if (!passenger.passportFile) {
        errors[`passenger-passportFile-${passenger.id}`] = "Passport copy is required";
        isValid = false;
      }

      if (passenger.dob) {
        const dobDate = new Date(passenger.dob);
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear();

        if (passenger.type === "Adult" && age < 12) {
          errors[`passenger-${passenger.id}-dob`] = "Adult must be 12+ years";
          isValid = false;
        } else if (passenger.type === "Child" && (age < 2 || age >= 12)) {
          errors[`passenger-${passenger.id}-dob`] = "Child must be 2-11 years";
          isValid = false;
        } else if (passenger.type === "Infant" && age >= 2) {
          errors[`passenger-${passenger.id}-dob`] = "Infant must be under 2 years";
          isValid = false;
        }
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleFieldChange = (passengerId, field, value) => {
    setPassengers(prev =>
      prev.map(p =>
        p.id === passengerId ? { ...p, [field]: value } : p
      )
    );

    // Clear error for this field if it becomes valid
    setFormErrors(prevErrors => {
      const updatedErrors = { ...prevErrors };
      if (value && updatedErrors[`passenger-${field}-${passengerId}`]) {
        delete updatedErrors[`passenger-${field}-${passengerId}`];
      }
      return updatedErrors;
    });
  };


  // const handleContinue = (e) => {
  //   e.preventDefault();
  //   if (validateForm()) {
  //     // Prepare the data to pass to BookingReview
  //     const bookingData = {
  //       packageData,
  //       passengers,
  //       totalPrice,
  //       cities // if you need city names in the review
  //     };

  //     // Navigate to BookingReview with state
  //     navigate("/packages/custom-umrah/review", { state: bookingData });
  //   }
  // };

  if (loading) {
    return <div className="text-center py-5">Loading...</div>;
  }

  if (!packageData) {
    return <div className="text-center py-5">Package not found</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleString();
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
            <div className="px-3 mt-3 px-lg-4 mb-3">
              {/* Header */}
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
                      style={{ height: "2px", backgroundColor: "#dee2e6" }}
                    ></div>

                    {/* Step 2 (now marked complete) */}
                    <div className="d-flex align-items-center mx-4">
                      <div
                        className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        2
                      </div>
                      <span className="ms-2 text-muted">
                        Booking Review
                      </span>
                    </div>

                    {/* Line 2 (inactive) */}
                    <div
                      className="flex-grow-1"
                      style={{ height: "2px", backgroundColor: "#dee2e6" }}
                    ></div>

                    {/* Step 3 (still upcoming) */}
                    <div className="d-flex align-items-center">
                      <div
                        className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        3
                      </div>
                      <span className="ms-2 text-muted">Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="row mt-5">
                <div className="col-12">
                  <h5 className="mb-4 fw-bold">Booking Detail</h5>

                  {/* Package Details Card */}
                  <div className="card mb-4">
                    <div className="card-body" style={{ background: "#F2F9FF" }}>
                      <div className="row">
                        <div className="col-md-8">
                          <h4 className="mb-3 fw-bold">Custom Umrah Package</h4>

                          {/* Hotel Details */}
                          <div className="mb-2">
                            <strong>Hotels:</strong>
                            {packageData.hotel_details.map((hotel, index) => (
                              <div key={index} className="small text-muted">
                                {hotel.number_of_nights} Nights at {hotel.hotel_info?.name} ({hotel.room_type}) -
                                Check-in: {formatDate(hotel.check_in_time)},
                                Check-out: {formatDate(hotel.check_out_time)}
                              </div>
                            ))}
                          </div>

                          {/* Visa Details */}
                          <div className="mb-2">
                            <strong>Visa:</strong>
                            <div className="small text-muted">
                              Adults: {packageData.total_adaults} (SAR {packageData.adault_visa_price} each) |
                              Children: {packageData.total_children} (SAR {packageData.child_visa_price} each) |
                              Infants: {packageData.total_infants} (SAR {packageData.infant_visa_price} each)
                            </div>
                          </div>

                          {/* Transport Details */}
                          <div className="mb-2">
                            <strong>Transport:</strong>
                            {packageData.transport_details.map((transport, index) => (
                              <div key={index} className="small text-muted">
                                {transport.vehicle_type} -
                                Adult: SAR {transport.transport_sector_info?.adault_price} |
                                Child: SAR {transport.transport_sector_info?.child_price} |
                                Infant: SAR {transport.transport_sector_info?.infant_price}
                              </div>
                            ))}
                          </div>

                          {/* Flight Details */}
                          <div className="mb-2">
                            <strong>Flight:</strong>
                            {packageData.ticket_details.map((ticket, index) => (
                              <React.Fragment key={index}>
                                {ticket.ticket_info?.trip_details.map((trip, tripIndex) => (
                                  <div key={tripIndex} className="small text-muted">
                                    {trip.trip_type === "Departure" ? "Travel Date" : "Return Date"} : {getCityCode(trip.departure_city)} to {getCityCode(trip.arrival_city)} -
                                    {formatDateTime(trip.departure_date_time)} to {formatDateTime(trip.arrival_date_time)}
                                  </div>
                                ))}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        <div className="col-md-4">
                          <h4 className="mb-3">Prices Summary</h4>

                          {/* Hotel Prices */}
                          <div className="mb-2">
                            <div className="small text-muted">Hotel Prices:</div>
                            {packageData.hotel_details.map((hotel, index) => (
                              <div key={index} className="small">
                                {hotel.hotel_info?.name} ({hotel.room_type}):
                                {riyalRate?.is_hotel_pkr ? ' SAR ' : ' PKR '}
                                {riyalRate?.is_hotel_pkr
                                  ? (hotel.price || 0).toFixed(2)
                                  : ((hotel.price || 0) * (riyalRate?.rate || 1)).toFixed(2)}
                                {` for ${hotel.number_of_nights} nights`}
                              </div>
                            ))}
                          </div>

                          {/* Visa Prices */}
                          <div className="mb-2">
                            <div className="small text-muted">Visa:</div>
                            <div className="small">
                              {riyalRate?.is_visa_pkr ? 'SAR ' : 'PKR '}
                              {(riyalRate?.is_visa_pkr
                                ? (packageData.adault_visa_price || 0)
                                : (packageData.adault_visa_price || 0) * (riyalRate?.rate || 1)
                              ).toFixed(2)}
                              /Adult |
                              {riyalRate?.is_visa_pkr ? 'SAR ' : 'PKR '}
                              {(riyalRate?.is_visa_pkr
                                ? (packageData.child_visa_price || 0)
                                : (packageData.child_visa_price || 0) * (riyalRate?.rate || 1)
                              ).toFixed(2)}
                              /Child |
                              {riyalRate?.is_visa_pkr ? 'SAR ' : 'PKR '}
                              {(riyalRate?.is_visa_pkr
                                ? (packageData.infant_visa_price || 0)
                                : (packageData.infant_visa_price || 0) * (riyalRate?.rate || 1)
                              ).toFixed(2)}
                              /Infant
                            </div>
                          </div>

                          {/* Transport Prices */}
                          <div className="mb-2">
                            <div className="small text-muted">Transport:</div>
                            <div className="small">
                              {riyalRate?.is_transport_pkr ? 'SAR ' : 'PKR '}
                              {(riyalRate?.is_transport_pkr
                                ? (packageData.transport_details[0]?.transport_sector_info?.adault_price || 0)
                                : (packageData.transport_details[0]?.transport_sector_info?.adault_price || 0) * (riyalRate?.rate || 1)
                              ).toFixed(2)}
                              /Adult |
                              {riyalRate?.is_transport_pkr ? 'SAR ' : 'PKR '}
                              {(riyalRate?.is_transport_pkr
                                ? (packageData.transport_details[0]?.transport_sector_info?.child_price || 0)
                                : (packageData.transport_details[0]?.transport_sector_info?.child_price || 0) * (riyalRate?.rate || 1)
                              ).toFixed(2)}
                              /Child |
                              {riyalRate?.is_transport_pkr ? 'SAR ' : 'PKR '}
                              {(riyalRate?.is_transport_pkr
                                ? (packageData.transport_details[0]?.transport_sector_info?.infant_price || 0)
                                : (packageData.transport_details[0]?.transport_sector_info?.infant_price || 0) * (riyalRate?.rate || 1)
                              ).toFixed(2)}
                              /Infant
                            </div>
                          </div>

                          {/* Flight Prices (always in PKR) */}
                          <div className="mb-2">
                            <div className="small text-muted">Flight:</div>
                            <div className="small">
                              PKR {(packageData.ticket_details[0]?.ticket_info?.adult_price || 0).toFixed(2)}/Adult |
                              PKR {(packageData.ticket_details[0]?.ticket_info?.child_price || 0).toFixed(2)}/Child |
                              PKR {(packageData.ticket_details[0]?.ticket_info?.infant_price || 0).toFixed(2)}/Infant
                            </div>
                          </div>

                          {/* Total Price */}
                          <div className="mt-3 pt-2 border-top">
                            <h5 className="fw-bold">Total Price: PKR {(totalPrice || 0).toFixed(2)}</h5>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passengers Details */}
                  <div className="small">
                    <div className="card-body">
                      <h4 className="mb-4">Passengers Details For Umrah Package</h4>

                      {passengers.map((passenger) => (
                        <div key={passenger.id} className="row mb-3">
                          {/* Passenger Type */}
                          <div className="col-lg-2 mb-2">
                            <label className="control-label">Type</label>
                            <select
                              className={`form-select bg-light shadow-none ${formErrors[`passenger-type-${passenger.id}`] ? "is-invalid" : ""}`}
                              value={passenger.type}
                              onChange={(e) => handleFieldChange(passenger.id, "type", e.target.value)}
                              required
                              disabled
                            >
                              <option value="">Select Type</option>
                              <option value="Adult">Adult</option>
                              <option value="Child">Child</option>
                              <option value="Infant">Infant</option>
                            </select>
                          </div>

                          {/* Title */}
                          <div className="col-lg-2 mb-2">
                            <label className="control-label">Title</label>
                            <select
                              className={`form-select bg-light shadow-none ${formErrors[`passenger-title-${passenger.id}`] ? "is-invalid" : ""}`}
                              value={passenger.title}
                              onChange={(e) => handleFieldChange(passenger.id, "title", e.target.value)}
                              required
                            >
                              {getTitleOptions(passenger.type)}
                            </select>
                            {formErrors[`passenger-title-${passenger.id}`] && (
                              <div className="invalid-feedback">{formErrors[`passenger-title-${passenger.id}`]}</div>
                            )}
                          </div>

                          {/* First Name */}
                          <div className="col-lg-2 mb-2">
                            <label className="control-label">First Name</label>
                            <input
                              type="text"
                              className={`form-control bg-light shadow-none ${formErrors[`passenger-name-${passenger.id}`] ? "is-invalid" : ""}`}
                              value={passenger.name}
                              onChange={(e) => handleFieldChange(passenger.id, "name", e.target.value)}
                              placeholder="First name"
                              required
                            />
                            {formErrors[`passenger-name-${passenger.id}`] && (
                              <div className="invalid-feedback">{formErrors[`passenger-name-${passenger.id}`]}</div>
                            )}
                          </div>

                          {/* Last Name */}
                          <div className="col-lg-2 mb-2">
                            <label className="control-label">Last Name</label>
                            <input
                              type="text"
                              className={`form-control bg-light shadow-none ${formErrors[`passenger-lName-${passenger.id}`] ? "is-invalid" : ""}`}
                              value={passenger.lName}
                              onChange={(e) => handleFieldChange(passenger.id, "lName", e.target.value)}
                              placeholder="Last name"
                              required
                            />
                            {formErrors[`passenger-lName-${passenger.id}`] && (
                              <div className="invalid-feedback">{formErrors[`passenger-lName-${passenger.id}`]}</div>
                            )}
                          </div>

                          {/* Last Name */}
                          <div className="col-lg-2 mb-2">
                            <label className="control-label">DOB</label>
                            <input
                              type="date"
                              className={`form-control bg-light shadow-none ${formErrors[`passenger-DOB-${passenger.id}`] ? "is-invalid" : ""}`}
                              value={passenger.DOB}
                              onChange={(e) => handleFieldChange(passenger.id, "DOB", e.target.value)}
                              placeholder="Last name"
                              required
                            />
                            {formErrors[`passenger-lName-${passenger.id}`] && (
                              <div className="invalid-feedback">{formErrors[`passenger-DOB-${passenger.id}`]}</div>
                            )}
                          </div>

                          {/* Passport Number */}
                          <div className="col-lg-2 mb-2">
                            <label className="control-label">Passport</label>
                            <input
                              type="text"
                              className={`form-control bg-light shadow-none ${formErrors[`passenger-passportNumber-${passenger.id}`] ? "is-invalid" : ""}`}
                              value={passenger.passportNumber}
                              onChange={(e) => handleFieldChange(passenger.id, "passportNumber", e.target.value)}
                              placeholder="AB1234567"
                              required
                            />
                            {formErrors[`passenger-passportNumber-${passenger.id}`] && (
                              <div className="invalid-feedback">{formErrors[`passenger-passportNumber-${passenger.id}`]}</div>
                            )}
                          </div>

                          {/* Passport Expiry */}
                          <div className="col-lg-2 mb-2">
                            <label className="control-label">Passport Expiry</label>
                            <input
                              type="date"
                              className={`form-control bg-light shadow-none ${formErrors[`passenger-passportExpiry-${passenger.id}`] ? "is-invalid" : ""}`}
                              value={passenger.passportExpiry}
                              onChange={(e) => handleFieldChange(passenger.id, "passportExpiry", e.target.value)}
                              required
                              min={new Date().toISOString().split('T')[0]}
                            />
                            {formErrors[`passenger-passportExpiry-${passenger.id}`] && (
                              <div className="invalid-feedback">{formErrors[`passenger-passportExpiry-${passenger.id}`]}</div>
                            )}
                          </div>

                          {/* Country */}
                          <div className="col-lg-2 mb-2">
                            <label className="control-label">Country</label>
                            <select
                              className={`form-select bg-light shadow-none ${formErrors[`passenger-country-${passenger.id}`] ? "is-invalid" : ""}`}
                              value={passenger.country}
                              onChange={(e) => handleFieldChange(passenger.id, "country", e.target.value)}
                              required
                            >
                              <option value="">Select Country</option>
                              {countries.map(country => (
                                <option key={country} value={country}>{country}</option>
                              ))}
                            </select>
                            {formErrors[`passenger-country-${passenger.id}`] && (
                              <div className="invalid-feedback">{formErrors[`passenger-country-${passenger.id}`]}</div>
                            )}
                          </div>

                          {/* Passport Upload */}
                          <div className="col-lg-2 mb-2 mt-2 d-flex align-items-center">
                            <input
                              type="file"
                              id={`passport-upload-${passenger.id}`}
                              style={{ display: 'none' }}
                              onChange={(e) => handlePassportUpload(passenger.id, e)}
                              accept="image/*,.pdf"
                              required={!passenger.passportFile}
                            />
                            <label
                              htmlFor={`passport-upload-${passenger.id}`}
                              className={`btn ${passenger.passportFile ? 'btn-success' : 'btn-primary'}`}
                            >
                              <CloudUpload />
                              {passenger.passportFile ? "Uploaded" : 'Passport'}
                            </label>
                            {formErrors[`passenger-passportFile-${passenger.id}`] && (
                              <div className="invalid-feedback d-block">{formErrors[`passenger-passportFile-${passenger.id}`]}</div>
                            )}
                            <div className="d-flex align-items-center ms-2">
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => removePassenger(passenger.id)}
                                disabled={passengers.length <= packageData.total_adaults + packageData.total_children + packageData.total_infants}
                              >
                                <PersonDash size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* <div className="row mt-4">
                      <div className="col-12">
                        <button
                          className="btn btn-primary me-3"
                          onClick={addPassenger}
                        >
                          Add Passenger
                        </button>
                      </div>
                    </div> */}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="row mt-4">
                    <div className="col-12 text-end">
                      <Link
                        to="/packages/umrah-calculater"
                        className="btn btn-secondary me-2"
                      >
                        Close
                      </Link>
                      <button
                        className="btn "
                        id="btn"
                        onClick={handleContinue}
                      >
                        Continue Booking
                      </button>
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

export default CustomUmrahPackagesDetail;