import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CloudUpload, PersonDash } from "react-bootstrap-icons";
import { Plus, Upload } from "lucide-react";

const AgentPackagesDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    package: pkg,
    roomType,
    totalPrice: initialTotalPrice,
    passengers: initialPassengers = [],
    roomTypes: initialRoomTypes = [],
    childPrices: initialChildPrices = 0,
    infantPrices: initialInfantPrices = 0
  } = location.state || {};

  // Initialize state with values from location.state if available
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes.length ? initialRoomTypes : (roomType ? [roomType] : []));
  const [passengers, setPassengers] = useState(initialPassengers);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [availableSeats, setAvailableSeats] = useState(pkg?.total_seats || 0);
  const [totalPrice, setTotalPrice] = useState(initialTotalPrice || 0);
  const [childPrices, setChildPrices] = useState(initialChildPrices || 0);
  const [infantPrices, setInfantPrices] = useState(initialInfantPrices || 0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [familyHeads, setFamilyHeads] = useState([]);
  const [showInfantModal, setShowInfantModal] = useState(false);
  const [selectedFamilyHead, setSelectedFamilyHead] = useState("");

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
  ];

  const calculateChildPrice = () => {
    if (!pkg) return 0;
    return (pkg.adault_visa_price || 0) - (pkg.child_visa_price || 0);
  };

  const calculateInfantPrice = () => {
    if (!pkg) return 0;
    return (pkg.infant_visa_price || 0) + (pkg.ticket_details?.[0]?.ticket_info?.infant_price || 0);
  };

  const getPriceForPassenger = (passenger) => {
    if (passenger.type === "Child") {
      return getPriceForRoomType(passenger.roomType) - calculateChildPrice();
    } else if (passenger.type === "Infant") {
      return calculateInfantPrice();
    }
    return getPriceForRoomType(passenger.roomType);
  };

  const updatePassenger = (id, field, value) => {
    const passengerIndex = passengers.findIndex(p => p.id === id);
    const passenger = passengers[passengerIndex];
    const oldType = passenger.type;
    const oldPrice = getPriceForPassenger(passenger);

    const updatedPassengers = passengers.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );

    setPassengers(updatedPassengers);

    // Clear error for this field when user starts typing/selecting
    const errorKey = `passenger-${id}-${field}`;
    if (formErrors[errorKey]) {
      const newErrors = { ...formErrors };
      delete newErrors[errorKey];
      setFormErrors(newErrors);
    }

    // Update prices if passenger type changed
    if (field === "type" && value !== oldType) {
      const newPrice = getPriceForPassenger({ ...passenger, type: value });
      const priceDifference = newPrice - oldPrice;

      setTotalPrice(prev => prev + priceDifference);

      if (value === "Child") {
        setChildPrices(prev => prev + calculateChildPrice());
      } else if (oldType === "Child") {
        setChildPrices(prev => prev - calculateChildPrice());
      }

      if (value === "Infant") {
        setInfantPrices(prev => prev + calculateInfantPrice());
      } else if (oldType === "Infant") {
        setInfantPrices(prev => prev - calculateInfantPrice());
      }
    }
  };

  // Initialize passengers and prices based on room types on first load
  useEffect(() => {
    if (!pkg) {
      navigate('/packages');
      return;
    }

    if (!isInitialized && passengers.length === 0) {
      const maxSeats = pkg?.total_seats || 0;
      let remainingSeats = maxSeats;
      const newPassengers = [];
      let priceTotal = 0;

      roomTypes.forEach(type => {
        const count = getPassengerCountForRoomType(type);

        if (remainingSeats >= count) {
          const roomPrice = getPriceForRoomType(type);
          priceTotal += roomPrice * count;

          const groupId = `${type}-${Math.random().toString(36).substr(2, 9)}`;

          for (let i = 0; i < count; i++) {
            newPassengers.push({
              id: `${groupId}-${i}`,
              type: i === 0 ? "" : "",
              title: i === 0 ? "" : "",
              name: "",
              lName: "",
              passportNumber: "",
              passportIssue: "",
              passportExpiry: "",
              country: "",
              passportFile: null,
              roomType: type,
              groupId: groupId,
              isFamilyHead: i === 0
            });
            remainingSeats--;
          }
        }
      });

      setPassengers(newPassengers);
      setTotalPrice(priceTotal);
      setAvailableSeats(remainingSeats);
      setIsInitialized(true);
    }
  }, [pkg, navigate, roomTypes, isInitialized, passengers.length]);

  // Update family heads whenever passengers change
  useEffect(() => {
    const heads = passengers.filter(p => p.isFamilyHead);
    setFamilyHeads(heads);
  }, [passengers]);

  // Save to localStorage when data changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      const bookingData = {
        roomTypes,
        passengers,
        totalPrice,
        package: pkg
      };
      localStorage.setItem('umrahBookingData', JSON.stringify(bookingData));
    }
  }, [roomTypes, passengers, totalPrice, pkg, isInitialized]);

  // Cleanup localStorage when leaving the booking flow
  useEffect(() => {
    const currentPath = location.pathname;

    return () => {
      const newPath = window.location.pathname;
      if (!newPath.startsWith("/packages")) {
        localStorage.removeItem("umrahBookingData");
      }
    };
  }, [location.pathname]);

  const getPassengerCountForRoomType = (type) => {
    switch (type.toUpperCase()) {
      case 'SHARING': return 1;
      case 'DOUBLE': return 2;
      case 'TRIPLE': return 3;
      case 'QUAD': return 4;
      case 'QUINT': return 5;
      default: return 1;
    }
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

  const getPriceForRoomType = (type) => {
    if (!pkg) return 0;

    const basePrice =
      (pkg.adault_visa_price || 0) +
      (pkg.transport_price || 0) +
      (pkg.ticket_details?.[0]?.ticket_info?.adult_price || 0) +
      (pkg.food_price || 0) +
      (pkg.makkah_ziyarat_price || 0) +
      (pkg.madinah_ziyarat_price || 0);

    const hotelPrice = pkg.hotel_details?.reduce((sum, hotel) => {
      let pricePerNight = 0;
      switch (type.toUpperCase()) {
        case 'SHARING': pricePerNight = hotel.sharing_bed_price || 0; break;
        case 'DOUBLE': pricePerNight = hotel.double_bed_price || 0; break;
        case 'TRIPLE': pricePerNight = hotel.triple_bed_price || 0; break;
        case 'QUAD': pricePerNight = hotel.quad_bed_price || 0; break;
        case 'QUINT': pricePerNight = hotel.quaint_bed_price || 0; break;
        default: pricePerNight = 0;
      }
      return sum + (pricePerNight * (hotel.number_of_nights || 0));
    }, 0) || 0;

    return basePrice + hotelPrice;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFlightDetails = () => {
    if (!pkg?.ticket_details?.[0]?.ticket_info) return {};

    const ticket = pkg.ticket_details[0].ticket_info;
    const tripDetails = ticket.trip_details || [];
    return {
      departure: tripDetails[0] || {},
      return: tripDetails[1] || {},
      airline: ticket.airline || {}
    };
  };

  const flightDetails = getFlightDetails();

  const flightMinAdultAge = pkg?.filght_min_adault_age || 0;
  const flightMaxAdultAge = pkg?.filght_max_adault_age || 0;
  const maxInfantAllowed = pkg?.max_infant_allowed || 0;

  // const addRoomType = (type) => {
  //   const count = getPassengerCountForRoomType(type);
  //   if (availableSeats < count) {
  //     alert(`Only ${availableSeats} seat(s) left - not enough for ${type} room`);
  //     return;
  //   }

  //   const roomPrice = getPriceForRoomType(type);
  //   const groupId = `${type}-${Math.random().toString(36).substr(2, 9)}`;
  //   const newPassengers = [...passengers];

  //   for (let i = 0; i < count; i++) {
  //     newPassengers.push({
  //       id: `${groupId}-${i}`,
  //       type: i === 0 ? "" : "",
  //       title: i === 0 ? "" : "",
  //       name: "",
  //       lName: "",
  //       passportNumber: "",
  //       passportIssue: "",
  //       passportExpiry: "",
  //       country: "",
  //       passportFile: null,
  //       roomType: type,
  //       groupId: groupId,
  //       isFamilyHead: i === 0
  //     });
  //   }

  //   setPassengers(newPassengers);
  //   setRoomTypes([...roomTypes, type]);
  //   setTotalPrice(totalPrice + (roomPrice * count));
  //   setAvailableSeats(availableSeats - count);
  //   setShowRoomModal(false);
  // };

  // const removePassengerGroup = (groupId) => {
  //   const groupPassengers = passengers.filter(p => p.groupId === groupId);
  //   const removedRoomType = groupPassengers[0]?.roomType;

  //   let priceReduction = 0;
  //   let seatsFreed = 0;

  //   groupPassengers.forEach(passenger => {
  //     if (passenger.type === "Infant") {
  //       priceReduction += calculateInfantPrice();
  //     } else {
  //       priceReduction += getPriceForRoomType(removedRoomType);
  //     }
  //     seatsFreed++;
  //   });

  //   const updatedPassengers = passengers.filter(p => p.groupId !== groupId);
  //   const updatedRoomTypes = roomTypes.filter(rt => rt !== removedRoomType);
  //   const newTotalPrice = totalPrice - priceReduction;

  //   setPassengers(updatedPassengers);
  //   setRoomTypes(updatedRoomTypes);
  //   setTotalPrice(newTotalPrice);
  //   setAvailableSeats(availableSeats + seatsFreed);
  // };

  const handleAddInfant = () => {
    if (!canAddInfant()) {
      alert(`You can only add ${maxInfantAllowed} infant(s) with at least ${flightMinAdultAge} adult(s)`);
      return;
    }
    setShowInfantModal(true);
  };

  const confirmAddInfant = () => {
    if (!selectedFamilyHead) {
      alert("Please select a family head for the infant");
      return;
    }

    const familyHead = passengers.find(p => p.id === selectedFamilyHead);
    if (!familyHead) return;

    const newPassenger = {
      id: `infant-${Math.random().toString(36).substr(2, 9)}`,
      type: "Infant",
      title: "",
      name: "",
      lName: "",
      passportNumber: "",
      passportIssue: "",
      passportExpiry: "",
      country: "",
      passportFile: null,
      roomType: familyHead.roomType,
      groupId: familyHead.groupId,
      isFamilyHead: false
    };

    setPassengers([...passengers, newPassenger]);
    setTotalPrice(totalPrice + calculateInfantPrice());
    setAvailableSeats(availableSeats - 1);
    setShowInfantModal(false);
    setSelectedFamilyHead("");
  };

  const canAddInfant = () => {
    const totalAdultsChildren = passengers.filter(p =>
      p.type === "Adult" || p.type === "Child"
    ).length;
    const totalInfants = passengers.filter(p => p.type === "Infant").length;

    return (
      totalInfants < maxInfantAllowed &&
      totalAdultsChildren >= flightMinAdultAge &&
      totalAdultsChildren <= flightMaxAdultAge
    );
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    passengers.forEach((passenger) => {
      const requiredFields = [
        'type', 'title', 'name', 'lName',
        'passportNumber', 'passportIssue'
        , 'passportExpiry', 'country'
      ];

      requiredFields.forEach(field => {
        const fieldKey = `passenger-${passenger.id}-${field}`;
        if (!passenger[field] || passenger[field].toString().trim() === '') {
          errors[fieldKey] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
          isValid = false;
        }
      });

      // Check for passport file
      if (!passenger.passportFile) {
        errors[`passenger-${passenger.id}-passportFile`] = "Passport file is required";
        isValid = false;
      }

      if (passenger.passportExpiry && passenger.passportIssue) {
        const expiryDate = new Date(passenger.passportExpiry);
        const issueDate = new Date(passenger.passportIssue);
        if (expiryDate <= issueDate) {
          errors[`passenger-${passenger.id}-passportExpiry`] = "Passport expiry must be after issue date";
          isValid = false;
        }
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

    console.log('Validation errors:', errors);
    setFormErrors(errors);
    return isValid;
  };

  const handleNavigation = (path, options = {}) => {
    navigate(path, {
      ...options,
      state: {
        package: pkg,
        passengers,
        roomTypes,
        totalPrice
      }
    });
  };

  const handleContinue = () => {
    console.log('Validating form...');
    if (validateForm()) {
      console.log('Validation passed');
      handleNavigation("/packages/review", {
        state: {
          package: pkg,
          passengers,
          roomTypes,
          totalPrice,
          childPrices,
          infantPrices
        }
      });
    } else {
      // console.log('Validation failed, errors:', formErrors);
      // Scroll to first error
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.is-invalid');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };


  // const [cities, setCities] = useState([]);

  // const getCityCode = (cityId) => {
  //   const city = cities.find(c => c.id === cityId);
  //   return city.code;
  // };

  // const token = localStorage.getItem("agentAccessToken");
  // const getOrgId = () => {
  //   const agentOrg = localStorage.getItem("agentOrganization");
  //   if (!agentOrg) return null;
  //   const orgData = JSON.parse(agentOrg);
  //   return orgData.ids[0];
  // };
  // const orgId = getOrgId();

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       // Always fetch cities data
  //       const citiesResponse = await axios.get(
  //         `http://127.0.0.1:8000/api/cities/?organization=${orgId}`,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       setCities(citiesResponse.data);
  //     } catch (error) {
  //       console.error("Error fetching cities:", error);
  //     }
  //   };

  //   fetchData();
  // }, [orgId, token]);

  // Add familyNumber state
  const [familyCounter, setFamilyCounter] = useState(1);

  // Modify addRoomType function
  const addRoomType = (type) => {
    const count = getPassengerCountForRoomType(type);
    if (availableSeats < count) {
      alert(`Only ${availableSeats} seat(s) left - not enough for ${type} room`);
      return;
    }

    const roomPrice = getPriceForRoomType(type);
    const groupId = `${type}-${Math.random().toString(36).substr(2, 9)}`;
    const familyNumber = familyCounter; // Assign current family number
    const newPassengers = [...passengers];

    for (let i = 0; i < count; i++) {
      newPassengers.push({
        id: `${groupId}-${i}`,
        type: i === 0 ? "" : "",
        title: i === 0 ? "" : "",
        name: "",
        lName: "",
        passportNumber: "",
        passportIssue: "",
        passportExpiry: "",
        country: "",
        passportFile: null,
        roomType: type,
        groupId: groupId,
        isFamilyHead: i === 0,
        familyNumber: familyNumber
      });
    }

    setPassengers(newPassengers);
    setRoomTypes([...roomTypes, type]);
    setTotalPrice(totalPrice + (roomPrice * count));
    setAvailableSeats(availableSeats - count);
    setFamilyCounter(familyCounter + 1); // Increment for next family
    setShowRoomModal(false);
  };

  // Modify removePassengerGroup function
  const removePassengerGroup = (groupId) => {
    const groupPassengers = passengers.filter(p => p.groupId === groupId);
    const removedRoomType = groupPassengers[0]?.roomType;
    const removedFamilyNumber = groupPassengers[0]?.familyNumber;

    let priceReduction = 0;
    let seatsFreed = 0;

    groupPassengers.forEach(passenger => {
      if (passenger.type === "Infant") {
        priceReduction += calculateInfantPrice();
      } else {
        priceReduction += getPriceForRoomType(removedRoomType);
      }
      seatsFreed++;
    });

    const updatedPassengers = passengers.filter(p => p.groupId !== groupId);
    const updatedRoomTypes = roomTypes.filter(rt => rt !== removedRoomType);
    const newTotalPrice = totalPrice - priceReduction;

    setPassengers(updatedPassengers);
    setRoomTypes(updatedRoomTypes);
    setTotalPrice(newTotalPrice);
    setAvailableSeats(availableSeats + seatsFreed);

    // Note: We don't decrement familyCounter as numbers should remain unique
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
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center flex-wrap">
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
                    <div
                      className="flex-grow-1 bg-primary"
                      style={{ height: "2px", backgroundColor: "#dee2e6" }}
                    ></div>
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
                      <span className="ms-2 text-muted">Booking Review</span>
                    </div>
                    <div
                      className="flex-grow-1"
                      style={{ height: "2px", backgroundColor: "#dee2e6" }}
                    ></div>
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
              <div className="row my-5">
                <div className="col-12">
                  <h5 className="mb-4 fw-bold">Booking Detail</h5>

                  {/* Package Details Card */}
                  <div className="card mb-4">
                    <div className="card-body" style={{ background: "#F2F9FF" }}>
                      <div className="row">
                        <div className="col-md-8">
                          <h4 className="mb-3 fw-bold">{pkg?.title || "Umrah Package"}</h4>
                          <div className="mb-2">
                            <strong>Hotels:</strong>
                            <div className="small text-muted">
                              {pkg?.hotel_details?.map((hotel, i) => (
                                `${hotel.number_of_nights} Nights at ${hotel.hotel_info?.city} (${hotel.hotel_info?.name})`
                              )).join(" / ") || "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Selected Room Types:</strong>
                            <div className="small text-muted">
                              {roomTypes.join(", ") || "None selected"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Transport:</strong>
                            <div className="small text-muted">
                              {pkg?.transport_details
                                ?.map(t => t.transport_sector_info?.name)
                                .join(" - ") || "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Flight:</strong>
                            <div className="small text-muted">
                              Travel Date: {flightDetails.departure?.departure_date_time ?
                                `${flightDetails.airline?.code} - ${formatDateTime(flightDetails.departure.departure_date_time)} to ${formatDateTime(flightDetails.departure.arrival_date_time)}` :
                                "N/A"}
                            </div>
                            <div className="small text-muted">
                              Return Date: {flightDetails.return?.departure_date_time ?
                                `${flightDetails.airline?.code} - ${formatDateTime(flightDetails.return.departure_date_time)} to ${formatDateTime(flightDetails.return.arrival_date_time)}` :
                                "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <h4 className="mb-3 fw-bold">Price Calculation</h4>

                          {/* Room Type Prices */}
                          <div className="mb-3">
                            {roomTypes.map((type) => {
                              const count = passengers.filter(p => p.roomType === type).length;
                              const price = getPriceForRoomType(type);
                              return (
                                <div key={type} className="mb-2 small">
                                  <span className="fw-bold">{type} Room:</span>
                                  <span> Rs. {price.toLocaleString()} × {count} = </span>
                                  <span className="text-primary">Rs. {(price * count).toLocaleString()}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Child Discounts (if any) */}
                          {childPrices > 0 && (
                            <div className="text-success small">
                              Child Discounts Applied: Rs. {childPrices.toLocaleString()}
                            </div>
                          )}

                          {/* Infant Charges (if any) */}
                          {infantPrices > 0 && (
                            <div className="text-info small">
                              Infant Charges: Rs. {infantPrices.toLocaleString()}
                            </div>
                          )}

                          {/* Grand Total */}
                          <div className="border-top pt-2 mt-2 fw-bold">
                            Grand Total: Rs. {totalPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passengers Details */}
                  <div className="small">
                    <div className="d-flex justify-content-between flex-wrap small align-items-center mb-4">
                      <h4 className="fw-bold">
                        Passengers Details For Umrah Package
                      </h4>
                      <div className="d-flex align-items-center ">
                        <button
                          id="btn" className="btn me-2"
                          onClick={handleAddInfant}
                          disabled={!canAddInfant()}
                        >
                          <Plus size={16} /> Infant
                        </button>
                        <button
                          id="btn" className="btn"
                          onClick={() => setShowRoomModal(true)}
                          disabled={availableSeats <= 0}
                        >
                          Add Room
                        </button>
                      </div>
                    </div>

                    {formErrors.general && (
                      <div className="alert alert-danger">{formErrors.general}</div>
                    )}

                    {passengers.length === 0 ? (
                      <div className="alert alert-info">
                        No passengers added yet. Please select a room type.
                      </div>
                    ) : (
                      Object.values(
                        passengers.reduce((groups, passenger) => {
                          if (!groups[passenger.groupId]) {
                            groups[passenger.groupId] = {
                              roomType: passenger.roomType,
                              passengers: []
                            };
                          }
                          groups[passenger.groupId].passengers.push(passenger);
                          return groups;
                        }, {})
                      ).map((group, groupIndex) => {
                        const groupAdults = group.passengers.filter(p => p.type === "Adult");
                        return (
                          <div key={groupIndex} className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h5 className="fw-bold text-primary">
                                {group.roomType} Room 
                                {/* {groupIndex + 1} */}
                              </h5>
                              <div className="d-flex gap-3">
                                <div className="mb-2">
                                  <label className="control-label">Family Head</label>
                                  <select
                                    className="form-select bg-light shadow-none"
                                    value={group.passengers.find(p => p.isFamilyHead)?.id || ""}
                                    onChange={(e) => {
                                      const newPassengers = passengers.map(p => ({
                                        ...p,
                                        isFamilyHead: p.id === e.target.value
                                      }));
                                      setPassengers(newPassengers);
                                    }}
                                    required
                                  >
                                    <option value="">Select Family Head</option>
                                    {groupAdults.map(adult => (
                                      <option key={adult.id} value={adult.id}>
                                        {adult.name} {adult.lName} ({adult.type})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="d-flex align-items-center">
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removePassengerGroup(group.passengers[0].groupId)}
                                  >
                                    <PersonDash size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {group.passengers.map((passenger, index) => {
                              return (
                                <div key={passenger.id} className="row mb-3">
                                  {/* Passenger Type */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Type</label>
                                    <select
                                      className={`form-select bg-light shadow-none ${formErrors[`passenger-${passenger.id}-type`] ? "is-invalid" : ""}`}
                                      value={passenger.type}
                                      onChange={(e) => updatePassenger(passenger.id, "type", e.target.value)}
                                      required
                                    >
                                      <option value="">Select Type</option>
                                      <option value="Adult">Adult</option>
                                      <option value="Child">Child</option>
                                      {passenger.type === "Infant" && <option value="Infant">Infant</option>}
                                    </select>
                                    {formErrors[`passenger-${passenger.id}-type`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-type`]}</div>
                                    )}
                                  </div>

                                  {/* Title */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Title</label>
                                    <select
                                      className={`form-select bg-light shadow-none ${formErrors[`passenger-${passenger.id}-title`] ? "is-invalid" : ""}`}
                                      value={passenger.title}
                                      onChange={(e) => updatePassenger(passenger.id, "title", e.target.value)}
                                      required
                                      disabled={!passenger.type}
                                    >
                                      {getTitleOptions(passenger.type)}
                                    </select>
                                    {formErrors[`passenger-${passenger.id}-title`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-title`]}</div>
                                    )}
                                  </div>

                                  {/* First Name */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">First Name</label>
                                    <input
                                      type="text"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-name`] ? "is-invalid" : ""}`}
                                      value={passenger.name}
                                      onChange={(e) => updatePassenger(passenger.id, "name", e.target.value)}
                                      placeholder="First name"
                                      required
                                    />
                                    {formErrors[`passenger-${passenger.id}-name`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-name`]}</div>
                                    )}
                                  </div>

                                  {/* Last Name */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Last Name</label>
                                    <input
                                      type="text"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-lName`] ? "is-invalid" : ""}`}
                                      value={passenger.lName}
                                      onChange={(e) => updatePassenger(passenger.id, "lName", e.target.value)}
                                      placeholder="Last name"
                                      required
                                    />
                                    {formErrors[`passenger-${passenger.id}-lName`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-lName`]}</div>
                                    )}
                                  </div>

                                  {/* Passport Number */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Passport</label>
                                    <input
                                      type="text"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-passportNumber`] ? "is-invalid" : ""}`}
                                      value={passenger.passportNumber}
                                      onChange={(e) => updatePassenger(passenger.id, "passportNumber", e.target.value)}
                                      placeholder="AB1234567"
                                      required
                                    />
                                    {formErrors[`passenger-${passenger.id}-passportNumber`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-passportNumber`]}</div>
                                    )}
                                  </div>

                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Passport Issue</label>
                                    <input
                                      type="date"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-passportIssue`] ? "is-invalid" : ""}`}
                                      value={passenger.passportIssue}
                                      onChange={(e) => updatePassenger(passenger.id, "passportIssue", e.target.value)}
                                      required
                                      min={new Date().toISOString().split('T')[0]} // Today's date
                                    />
                                    {formErrors[`passenger-${passenger.id}-passportIssue`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-passportIssue`]}</div>
                                    )}
                                  </div>

                                  {/* Passport Expiry */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Passport Expiry</label>
                                    <input
                                      type="date"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-passportExpiry`] ? "is-invalid" : ""}`}
                                      value={passenger.passportExpiry}
                                      onChange={(e) => updatePassenger(passenger.id, "passportExpiry", e.target.value)}
                                      required
                                      min={new Date().toISOString().split('T')[0]} // Today's date
                                    />
                                    {formErrors[`passenger-${passenger.id}-passportExpiry`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-passportExpiry`]}</div>
                                    )}
                                  </div>

                                  {/* Country */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Country</label>
                                    <select
                                      className={`form-select bg-light shadow-none ${formErrors[`passenger-${passenger.id}-country`] ? "is-invalid" : ""}`}
                                      value={passenger.country}
                                      onChange={(e) => updatePassenger(passenger.id, "country", e.target.value)}
                                      required
                                    >
                                      <option value="">Select Country</option>
                                      {countries.map(country => (
                                        <option key={country} value={country}>{country}</option>
                                      ))}
                                    </select>
                                    {formErrors[`passenger-${passenger.id}-country`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-country`]}</div>
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
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Infant Selection Modal */}
                  {showInfantModal && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Select Family Head for Infant</h5>
                            <button type="button" className="btn-close" onClick={() => setShowInfantModal(false)}></button>
                          </div>
                          <div className="modal-body">
                            <div className="mb-3">
                              <label className="form-label">Select Family Head:</label>
                              <select
                                className="form-select"
                                value={selectedFamilyHead}
                                onChange={(e) => setSelectedFamilyHead(e.target.value)}
                              >
                                <option value="">Select Family Head</option>
                                {familyHeads.map(head => (
                                  <option key={head.id} value={head.id}>
                                    {head.name} {head.lName} ({head.roomType} Room)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="modal-footer">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setShowInfantModal(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              id="btn" className="btn"
                              onClick={confirmAddInfant}
                            >
                              Add Infant
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Room Type Modal */}
                  {showRoomModal && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Select Room Type</h5>
                            <button type="button" className="btn-close" onClick={() => setShowRoomModal(false)}></button>
                          </div>
                          <div className="modal-body">
                            <div className="row">
                              {pkg?.is_sharing_active && (
                                <div className="col-md-6 mb-3 hover">
                                  <div
                                    className="card cursor-pointer"
                                    onClick={() => addRoomType('SHARING')}
                                    style={{ minHeight: '120px' }}
                                  >
                                    <div className="card-body text-center">
                                      <h5>SHARING</h5>
                                      <h4 className="text-primary">
                                        Rs. {getPriceForRoomType('SHARING').toLocaleString()} × 1
                                      </h4>
                                      <small className="text-muted">(1 passenger)</small>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {pkg?.is_double_active && (
                                <div className="col-md-6 mb-3">
                                  <div
                                    className="card cursor-pointer"
                                    onClick={() => addRoomType('DOUBLE')}
                                    style={{ minHeight: '120px' }}
                                  >
                                    <div className="card-body text-center">
                                      <h5>DOUBLE BED</h5>
                                      <h4 className="text-primary">
                                        Rs. {getPriceForRoomType('DOUBLE').toLocaleString()} × 2
                                      </h4>
                                      <small className="text-muted">(2 passengers)</small>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {pkg?.is_triple_active && (
                                <div className={`col-md-6 mb-3 ${pkg?.is_triple_active ? 'border-primary border-3' : 'border-secondary'}`}>
                                  <div
                                    className="card cursor-pointer"
                                    onClick={() => addRoomType('TRIPLE')}
                                    style={{ minHeight: '120px' }}
                                  >
                                    <div className="card-body text-center">
                                      <h5>TRIPLE BED</h5>
                                      <h4 className="text-primary">
                                        Rs. {getPriceForRoomType('TRIPLE').toLocaleString()} × 3
                                      </h4>
                                      <small className="text-muted">(3 passengers)</small>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {pkg?.is_quad_active && (
                                <div className="col-md-6 mb-3">
                                  <div
                                    className="card cursor-pointer"
                                    onClick={() => addRoomType('QUAD')}
                                    style={{ minHeight: '120px' }}
                                  >
                                    <div className="card-body text-center">
                                      <h5>QUAD BED</h5>
                                      <h4 className="text-primary">
                                        Rs. {getPriceForRoomType('QUAD').toLocaleString()} × 4
                                      </h4>
                                      <small className="text-muted">(4 passengers)</small>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {pkg?.is_quaint_active && (
                                <div className="col-md-6 mb-3">
                                  <div
                                    className="card cursor-pointer"
                                    onClick={() => addRoomType('QUINT')}
                                    style={{ minHeight: '120px' }}
                                  >
                                    <div className="card-body text-center">
                                      <h5>QUINT</h5>
                                      <h4 className="text-primary">
                                        Rs. {getPriceForRoomType('QUINT').toLocaleString()} × 5
                                      </h4>
                                      <small className="text-muted">(5 passengers)</small>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="row mt-4">
                    <div className="col-12 text-end">
                      <Link to="/packages" className="btn btn-secondary me-2">
                        Close
                      </Link>
                      <button
                        onClick={handleContinue}
                        id="btn" className="btn"
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

export default AgentPackagesDetail;