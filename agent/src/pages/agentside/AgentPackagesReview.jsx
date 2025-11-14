import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import axios from "axios";

const BookingReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { package: pkg, passengers = [], roomTypes = [], totalPrice = 0, childPrices: initialChildPrices = 0, infantPrices: initialInfantPrices = 0 } = location.state || {};
  const [childPrices, setChildPrices] = useState(initialChildPrices || 0);
  const [infantPrices, setInfantPrices] = useState(initialInfantPrices || 0);
  const [riyalRate, setRiyalRate] = useState(0);
  const [expiryTime, setExpiryTime] = useState(24);
  const [bookingNumber, setBookingNumber] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [currentPassport, setCurrentPassport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShowPassport = (passportFile) => {
    setCurrentPassport(passportFile);
    setShowModal(true);
  };

  // Fetch riyal rate and expiry time from API
  useEffect(() => {
    const fetchRiyalRate = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const orgId = getOrgId();
        const response = await axios.get(`http://127.0.0.1:8000/api/riyal-rates/?organization=${orgId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          const data = response.data;
          if (data && data.length > 0) {
            setRiyalRate(data[0] || {});
          }
        }

      } catch (error) {
        console.error('Error fetching riyal rate:', error);
      }
    };

    const fetchExpiryTime = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const orgId = getOrgId();
        const response = await fetch(`http://127.0.0.1:8000/api/booking-expiry/?organization=${orgId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setExpiryTime(data[0].umrah_expiry_time || 24);
          }
        }
      } catch (error) {
        console.error('Error fetching expiry time:', error);
      }
    };

    const fetchLastBookingNumber = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const orgId = getOrgId();
        const response = await fetch(`http://127.0.0.1:8000/api/bookings/?organization=${orgId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setBookingNumber(data.count + 1);
        }
      } catch (error) {
        console.error('Error fetching booking count:', error);
      }
    };

    fetchRiyalRate();
    fetchExpiryTime();
    fetchLastBookingNumber();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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

  const calculateRoomQuantity = (roomType, paxCount) => {
    const paxPerRoom = getPassengerCountForRoomType(roomType);
    return Math.ceil(paxCount / paxPerRoom);
  };

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

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0];
  };

  const userId = localStorage.getItem("userId");
  const agencyId = Number(localStorage.getItem("agencyId"));
  const BranchId = Number(localStorage.getItem("branchId"));

  // const submitBooking = async () => {
  //   setIsSubmitting(true);
  //   try {
  //     const token = localStorage.getItem("agentAccessToken");
  //     const orgId = getOrgId();
  //     const bookingData = await formatBookingData();

  //     console.log("BookingData Payload:", bookingData);

  //     const response = await axios.post(`http://127.0.0.1:8000/api/bookings/`, bookingData, {
  //       headers: {
  //         // "Content-Type": "application/json",
  //          "Content-Type": "multipart/form-data",
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });

  //     if (response.status >= 200 && response.status < 300) {
  //       console.log('Booking created successfully:', response.data);
  //       navigate('/packages/pay', {
  //         state: {
  //           bookingId: response.data.id,
  //           totalAmount: totalPrice,
  //           package: pkg
  //         }
  //       });
  //     } else {
  //       console.error('Failed to create booking:', response.statusText);
  //       alert('Failed to create booking. Please try again.');
  //     }
  //   } catch (error) {
  //     console.error('Error creating booking:', error);
  //     if (error.response) {
  //       console.error('Error response data:', error.response.data);
  //     }
  //     alert('An error occurred while creating the booking. Please check the console for details.');
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const formatBookingData = async () => {
    if (!pkg) return null;

    // Count paxs for each room type (excluding infants)
    const roomTypeCounts = {};
    roomTypes.forEach(type => {
      const paxCount = passengers.filter(p => p.roomType === type && p.type !== "Infant").length;
      roomTypeCounts[type] = paxCount;
    });

    // Format hotel details
    const hotelDetails = pkg.hotel_details.map(hotel => {
      const roomType = hotel.hotel_info?.prices?.[0]?.room_type || "";
      const paxCount = roomTypeCounts[roomType] || 0;
      const quantity = calculateRoomQuantity(roomType, paxCount);

      let pricePerNight = 0;
      switch (roomType.toUpperCase()) {
        case 'SHARING': pricePerNight = hotel.sharing_bed_price || 0; break;
        case 'DOUBLE': pricePerNight = hotel.double_bed_price || 0; break;
        case 'TRIPLE': pricePerNight = hotel.triple_bed_price || 0; break;
        case 'QUAD': pricePerNight = hotel.quad_bed_price || 0; break;
        case 'QUINT': pricePerNight = hotel.quaint_bed_price || 0; break;
        default: pricePerNight = 0;
      }

      const totalPrice = pricePerNight * (hotel.number_of_nights || 0);
      // const totalPrice = pricePerNight * (hotel.number_of_nights || 0) * quantity;

      return {
        check_in_time: hotel.check_in_date || hotel.check_in_time || "",
        check_out_time: hotel.check_out_date || hotel.check_out_time || "",
        number_of_nights: parseInt(hotel.number_of_nights) || 0,
        room_type: roomType,
        price: parseFloat(pricePerNight),
        quantity: parseInt(quantity),
        total_price: parseFloat(totalPrice),
        riyal_rate: parseFloat(riyalRate?.rate || 0),
        is_price_pkr: riyalRate?.is_hotel_pkr ?? true,
        hotel: hotel.hotel_info?.id,
      };
    });

    // Format transport details
    const transportDetails = pkg.transport_details.map(transport => ({
      vehicle_type: transport.transport_sector_info?.vehicle_type,
      transport_sector: transport.transport_sector_info?.id,
      price: parseFloat(transport.price || transport.transport_sector_info?.adault_price),
      quantity: 1,
      total_price: parseFloat(transport.price || transport.transport_sector_info?.adault_price),
      is_price_pkr: riyalRate?.is_transport_pkr ?? true,
      riyal_rate: parseFloat(riyalRate?.rate || 0),
    }));

    // Format ticket details
    const flightDetails = getFlightDetails();
    const ticketDetails = [{
      trip_details: [
        {
          departure_date_time: flightDetails.departure?.departure_date_time || new Date().toISOString(),
          arrival_date_time: flightDetails.departure?.arrival_date_time || new Date().toISOString(),
          trip_type: "Depearture",
          departure_city: parseInt(flightDetails.departure?.departure_city),
          arrival_city: parseInt(flightDetails.departure?.arrival_city)
        },
        flightDetails.return ? {
          departure_date_time: flightDetails.return?.departure_date_time || new Date().toISOString(),
          arrival_date_time: flightDetails.return?.arrival_date_time || new Date().toISOString(),
          trip_type: "Return",
          departure_city: parseInt(flightDetails.return?.departure_city),
          arrival_city: parseInt(flightDetails.return?.arrival_city)
        } : null
      ].filter(Boolean),
      stopover_details: flightDetails.stopover_city && flightDetails.stopover_city !== null ? [
        {
          stopover_duration: parseInt(flightDetails.stopover_duration),
          trip_type: parseInt(flightDetails.trip_type),
          stopover_city: parseInt(flightDetails.stopover_city)
        }
      ] : [],
      is_meal_included: pkg.ticket_details?.[0]?.ticket_info?.is_meal_included || false,
      is_refundable: pkg.ticket_details?.[0]?.ticket_info?.is_refundable || false,
      // pnr: pkg.ticket_details?.[0]?.ticket_info?.pnr || "",
      child_price: parseFloat(pkg.child_visa_price),
      infant_price: parseFloat(pkg.infant_visa_price),
      adult_price: parseFloat(pkg.adault_visa_price),
      seats: parseInt(pkg.total_seats),
      weight: parseFloat(pkg.ticket_details?.[0]?.ticket_info?.weight),
      pieces: parseInt(pkg.ticket_details?.[0]?.ticket_info?.pieces),
      is_umrah_seat: true,
      // trip_type: pkg.ticket_details?.[0]?.ticket_info?.trip_type || "",
      // departure_stay_type: pkg.ticket_details?.[0]?.ticket_info?.departure_stay_type || "",
      // return_stay_type: pkg.ticket_details?.[0]?.ticket_info?.return_stay_type || "",
      status: "CONFIRMED",
      is_price_pkr: true,
      riyal_rate: parseFloat(riyalRate?.rate || 0),
      // ticket: parseInt(pkg.ticket_details?.[0]?.ticket_info?.id),
      pnr: pkg.ticket_details?.[0]?.ticket_info?.pnr || "TEMP-PNR",
      trip_type: pkg.ticket_details?.[0]?.ticket_info?.trip_type,   // ensure numeric ID
      departure_stay_type: pkg.ticket_details?.[0]?.ticket_info?.departure_stay_type,
      return_stay_type: pkg.ticket_details?.[0]?.ticket_info?.return_stay_type,
      ticket: pkg.ticket_details?.[0]?.ticket_info?.id

    }];

    // Format person details - convert files to base64
    const personDetails = await Promise.all(passengers.map(async (passenger, index) => {
      const isAdult = passenger.type === "Adult";
      const isChild = passenger.type === "Child";

      const isVisaIncluded = pkg.adault_visa_price > 0 || pkg.child_visa_price > 0 || pkg.infant_visa_price > 0;
      const visaStatus = isVisaIncluded ? "NOT APPLIED" : "NOT INCLUDED";

      const isTicketIncluded = pkg.ticket_details && pkg.ticket_details.length > 0;
      const ticketStatus = isTicketIncluded ? "NOT APPROVED" : "NOT INCLUDED";

      const adultTicketPrice = pkg.ticket_details?.[0]?.ticket_info?.adult_price || 0;
      const childTicketPrice = pkg.ticket_details?.[0]?.ticket_info?.child_price || 0;
      const infantTicketPrice = pkg.ticket_details?.[0]?.ticket_info?.infant_price || 0;

      // Handle passport file - convert to base64 string
      let passportPictureBase64 = null;
      if (passenger.passportFile) {
        try {
          let blob;

          if (typeof passenger.passportFile === "string" && passenger.passportFile.startsWith("blob:")) {
            // Convert blob URL to blob
            const response = await fetch(passenger.passportFile);
            blob = await response.blob();
          } else if (passenger.passportFile instanceof File) {
            // Already a file object
            blob = passenger.passportFile;
          } else if (typeof passenger.passportFile === "string" && passenger.passportFile.startsWith("data:")) {
            // Already a base64 string
            passportPictureBase64 = passenger.passportFile;
          }

          // Convert blob to base64 if we have a blob
          if (blob) {
            passportPictureBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.error('Error processing passport file:', error);
        }
      }

      return {
        ziyarat_details: [
          {
            city: "no",
            date: new Date().toISOString().split('T')[0],
            price: isAdult ? parseFloat((pkg.makkah_ziyarat_price || 0) + (pkg.madinah_ziyarat_price || 0)) : 0,
            is_price_pkr: riyalRate?.is_ziarat_pkr ?? true,
            riyal_rate: parseFloat(riyalRate?.rate || 0)
          }
        ],
        food_details: [
          {
            food: "no",
            price: parseFloat(pkg.food_price) || 0,
            is_price_pkr: riyalRate?.is_food_pkr ?? true,
            riyal_rate: parseFloat(riyalRate?.rate || 0)
          }
        ],
        age_group: passenger.type.toUpperCase(),
        person_title: passenger.title || '',
        first_name: passenger.name || '',
        last_name: passenger.lName || '',
        passport_number: passenger.passportNumber || '',
        date_of_birth: passenger.dob ? new Date(passenger.dob).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        passpoet_issue_date: passenger.passportIssue ? new Date(passenger.passportIssue).toISOString().split('T')[0] : '', // Fixed: use passenger.passportIssue
        passport_expiry_date: passenger.passportExpiry ? new Date(passenger.passportExpiry).toISOString().split('T')[0] : '', // Fixed: use passenger.passportExpiry
        passport_picture: passenger.passportFile, // Now this is a base64 string
        country: passenger.country || '',
        is_visa_included: isVisaIncluded,
        is_ziyarat_included: true,
        is_food_included: true,
        visa_price: parseFloat(isAdult ? pkg.adault_visa_price : isChild ? pkg.child_visa_price : pkg.infant_visa_price) || 0,
        food_price: parseFloat(pkg.food_price) || 0,
        ziyarat_price: parseFloat(isAdult ? (pkg.makkah_ziyarat_price || 0) + (pkg.madinah_ziyarat_price || 0) : 0) || 0,
        ticket_price: parseFloat(isAdult ? adultTicketPrice : isChild ? childTicketPrice : infantTicketPrice) || 0,
        is_family_head: passenger.isFamilyHead || false,
        family_number: parseInt(passenger.familyNumber) || 0,
        visa_status: visaStatus,
        ticket_status: ticketStatus,
        ticket_remarks: "",
        visa_group_number: "",
        ticket_voucher_number: "",
        ticker_brn: "",
        food_voucher_number: "",
        food_brn: "",
        ziyarat_voucher_number: "",
        ziyarat_brn: "",
        transport_voucher_number: "",
        transport_brn: "",
      };
    }));


    // Calculate total amounts
    const totalTicketAmount = personDetails.reduce((sum, person) => sum + person.ticket_price, 0);
    const totalHotelAmount = hotelDetails.reduce((sum, hotel) => sum + hotel.total_price, 0);
    const totalTransportAmount = transportDetails.reduce((sum, transport) => sum + transport.total_price, 0);
    const totalVisaAmount = personDetails.reduce((sum, person) => sum + person.visa_price, 0);
    const totalFoodAmount = personDetails.reduce((sum, person) => sum + person.food_price, 0);
    const totalZiyaratAmount = personDetails.reduce((sum, person) => sum + person.ziyarat_price, 0);
    const allTotalPrice = totalTicketAmount + totalPrice + totalTransportAmount +
      totalVisaAmount + totalFoodAmount + totalZiyaratAmount;

    const orgId = parseInt(getOrgId()) || 0;
    const userIdNum = parseInt(userId) || 0;
    const agencyIdNum = parseInt(agencyId) || 0;
    const branchIdNum = parseInt(BranchId) || 0;

    return {
      hotel_details: hotelDetails,
      transport_details: transportDetails,
      ticket_details: ticketDetails,
      person_details: personDetails,
      payment_details: [],

      booking_number: `UMRAH-${bookingNumber}`,
      expiry_time: new Date(Date.now() + expiryTime * 60 * 60 * 1000).toISOString(),
      total_pax: parseInt(passengers.length),
      total_adult: parseInt(passengers.filter(p => p.type === "Adult").length),
      total_infant: parseInt(passengers.filter(p => p.type === "Infant").length) || 0,
      total_child: parseInt(passengers.filter(p => p.type === "Child").length) || 0,
      total_ticket_amount: parseFloat(totalTicketAmount),
      total_hotel_amount: parseFloat(totalPrice),
      total_transport_amount: parseFloat(totalTransportAmount),
      total_visa_amount: parseFloat(totalVisaAmount),
      total_amount: parseFloat(allTotalPrice),
      is_paid: false,
      status: "un-approve",
      payment_status: "PENDING",
      is_partial_payment_allowed: true,
      category: "Package",
      user: userIdNum,
      organization: orgId,
      branch: branchIdNum,
      agency: agencyIdNum
    };
  };

  const submitBooking = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("agentAccessToken");
      const orgId = getOrgId();
      const bookingData = await formatBookingData();

      const formData = new FormData();

      // -------- Main object fields --------
      const mainFields = {
        booking_number: bookingData.booking_number,
        expiry_time: bookingData.expiry_time,
        total_pax: bookingData.total_pax,
        total_adult: bookingData.total_adult,
        total_infant: bookingData.total_infant,
        total_child: bookingData.total_child,
        total_ticket_amount: bookingData.total_ticket_amount,
        total_hotel_amount: bookingData.total_hotel_amount,
        total_transport_amount: bookingData.total_transport_amount,
        total_visa_amount: bookingData.total_visa_amount,
        total_amount: bookingData.total_amount,
        is_paid: bookingData.is_paid,
        status: bookingData.status,
        payment_status: bookingData.payment_status,
        is_partial_payment_allowed: bookingData.is_partial_payment_allowed,
        user: bookingData.user,
        organization: bookingData.organization || orgId,
        branch: bookingData.branch,
        agency: bookingData.agency,
      };

      Object.entries(mainFields).forEach(([key, val]) => {
        formData.append(key, val ?? "");
      });

      // -------- Ticket details (JSON) --------
      if (Array.isArray(bookingData.ticket_details)) {
        formData.append("ticket_details", JSON.stringify(bookingData.ticket_details));
      }

      // -------- Hotel details (JSON) --------
      if (Array.isArray(bookingData.hotel_details)) {
        formData.append("hotel_details", JSON.stringify(bookingData.hotel_details));
      }

      // -------- Transport details (JSON) --------
      if (Array.isArray(bookingData.transport_details)) {
        formData.append("transport_details", JSON.stringify(bookingData.transport_details));
      }

      // -------- Person details (JSON + File refs) --------
      let personDetailsWithRefs = [];
      let fileIndex = 1;

      if (Array.isArray(bookingData.person_details)) {
        bookingData.person_details.forEach((person) => {
          let personCopy = { ...person };

          // If file exists, replace with reference key
          if (person.passport_picture instanceof File) {
            const refKey = `passport_picture_${fileIndex}`;
            personCopy.passport_picture_field = refKey;

            // Attach actual file
            formData.append(`person_files[${refKey}]`, person.passport_picture);

            fileIndex++;
          }

          // Remove the File object before pushing
          delete personCopy.passport_picture;
          personDetailsWithRefs.push(personCopy);
        });

        formData.append("person_details", JSON.stringify(personDetailsWithRefs));
      }

      console.log("BookingData Payload (stringified):", {
        ...mainFields,
        ticket_details: bookingData.ticket_details,
        hotel_details: bookingData.hotel_details,
        transport_details: bookingData.transport_details,
        person_details: personDetailsWithRefs,
      });

      // -------- API call --------
      const response = await axios.post(
        `http://127.0.0.1:8000/api/bookings/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        console.log("Booking created successfully:", response.data);
        navigate("/packages/pay", {
          state: {
            bookingId: response.data.id,
            totalAmount: totalPrice,
            package: pkg,
          },
        });
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
      }
      alert("An error occurred while creating the booking. Please check the console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        <div className="col-12 col-lg-10 ps-lg-4">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4">
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="d-flex align-items-center me-4">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "30px", height: "30px", fontSize: "14px" }}>
                        1
                      </div>
                      <span className="ms-2 text-primary fw-bold">Booking Detail</span>
                    </div>
                    <div className="flex-grow-1 bg-primary" style={{ height: "2px" }}></div>
                    <div className="d-flex align-items-center mx-4">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "30px", height: "30px", fontSize: "14px" }}>
                        2
                      </div>
                      <span className="ms-2 text-primary fw-bold">Booking Review</span>
                    </div>
                    <div className="flex-grow-1" style={{ height: "2px", backgroundColor: "#dee2e6" }}></div>
                    <div className="d-flex align-items-center">
                      <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border"
                        style={{ width: "30px", height: "30px", fontSize: "14px" }}>
                        3
                      </div>
                      <span className="ms-2 text-muted">Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row my-5">
                <div className="col-12">
                  <h5 className="mb-4 fw-bold">Booking Review</h5>
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
                          <div className="mb-3">
                            {roomTypes.map((type) => {
                              const paxCount = passengers.filter(p => p.roomType === type && p.type !== "Infant").length;
                              const price = getPriceForRoomType(type);
                              const quantity = calculateRoomQuantity(type, paxCount);

                              return (
                                <div key={type} className="mb-2 small">
                                  <span className="fw-bold">{type} Room:</span>
                                  <span> Rs. {price.toLocaleString()} × {quantity} = </span>
                                  <span className="text-primary">Rs. {(price * quantity).toLocaleString()}</span>
                                  <div className="text-muted">({paxCount} paxs in {quantity} rooms)</div>
                                </div>
                              );
                            })}
                          </div>

                          {childPrices > 0 && (
                            <div className="text-success small">
                              Child Discounts Applied: Rs. {childPrices.toLocaleString()}
                            </div>
                          )}

                          {infantPrices > 0 && (
                            <div className="text-info small">
                              Infant Charges: Rs. {infantPrices.toLocaleString()}
                            </div>
                          )}

                          <div className="border-top pt-2 mt-2 fw-bold">
                            Grand Total: Rs. {totalPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded mb-4">
                    <h5 className="mb-3 fw-bold">Passengers Passport Detail</h5>
                    <div className="table-responsive">
                      <table className="table mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Type</th>
                            <th>Title</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Passport No</th>
                            <th>Passport Issue</th>
                            <th>Passport Expiry</th>
                            <th>Country</th>
                            <th>Room Type</th>
                            <th>Visa Pic</th>
                          </tr>
                        </thead>
                        <tbody>
                          {passengers.map((passenger, index) => (
                            <tr key={index}>
                              <td>{passenger.type}</td>
                              <td>{passenger.title}</td>
                              <td>{passenger.name}</td>
                              <td>{passenger.lName}</td>
                              <td>{passenger.passportNumber || "N/A"}</td>
                              <td>{formatDate(passenger.passportIssue)}</td>
                              <td>{formatDate(passenger.passportExpiry)}</td>
                              <td>{passenger.country}</td>
                              <td>{passenger.roomType}</td>
                              <td>
                                {passenger.passportFile ? (
                                  <Button
                                    variant="link"
                                    onClick={() => handleShowPassport(passenger.passportFile)}
                                  >
                                    See
                                  </Button>
                                ) : (
                                  "Not Provided"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-3">
                    <Link
                      to="/packages/detail"
                      className="btn btn-secondary px-4"
                      state={{ package: pkg, passengers, roomTypes, totalPrice }}
                    >
                      Back To Edit
                    </Link>
                    <button
                      onClick={submitBooking}
                      className="btn px-4"
                      id="btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Make Booking"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Passport Document</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {currentPassport ? (
            typeof currentPassport === "string" && currentPassport.startsWith("data:application/pdf") ? (
              <iframe
                src={currentPassport}
                width="100%"
                height="500px"
                title="Passport PDF"
                frameBorder="0"
              />
            ) : (
              <img
                src={typeof currentPassport === "string" ? currentPassport : URL.createObjectURL(currentPassport)}
                alt="Passport"
                style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
              />
            )
          ) : (
            <div>No passport document available</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BookingReview;