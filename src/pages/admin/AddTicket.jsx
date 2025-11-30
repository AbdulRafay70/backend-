import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import AdminFooter from "../../components/AdminFooter";
import axios from "axios";

const FlightBookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initial form state - moved to top
  const INITIAL_FORM_STATE = {
    airline: "",
    returnAirline: "",
    // 1-stop segment fields (departure)
    stop1_airline: "",
    stop1_flightNumber: "",
    stop1_departureDateTime: "",
    stop1_arrivalDateTime: "",
    stop1_departure: "",
    stop1_arrival: "",
    meal: "Yes",
    ticketType: "Refundable",
    pnr: "",
    price: "",
    totalSeats: "",
    weight: "",
    piece: "0",
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
  // 1-stop segment fields (return)
  return_stop1_airline: "",
  return_stop1_flightNumber: "",
  return_stop1_departureDateTime: "",
  return_stop1_arrivalDateTime: "",
  return_stop1_departure: "",
  return_stop1_arrival: "",
    flightNumber: "",
    returnFlightNumber: "",
    adultSellingPrice: "",
    adultPurchasePrice: "",
    childSellingPrice: "",
    childPurchasePrice: "",
    infantSellingPrice: "",
    infantPurchasePrice: "",
    resellingAllowed: false,
  };

  // Get edit data from location state if available
  const { editData, ticketId } = location.state || {};
  // normalize editData when a wrapped array is provided
  const initialTicketFromLocation = Array.isArray(editData) && editData.length ? editData[0] : editData;
  // keep ticket data in state so we can fetch full ticket when navigation passed a partial object
  const [ticketDataState, setTicketDataState] = useState(initialTicketFromLocation);
  const ticketData = ticketDataState;
  // Initialize form state with edit data if available
  const [formData, setFormData] = useState(
    ticketData ? {
      ...ticketData,
      // Ensure pricing fields are properly mapped
      adultSellingPrice: ticketData.adultSellingPrice || ticketData.adult_fare || "",
      adultPurchasePrice: ticketData.adultPurchasePrice || ticketData.adult_purchase_price || ticketData.adult_price || "",
      childSellingPrice: ticketData.childSellingPrice || ticketData.child_fare || "",
      childPurchasePrice: ticketData.childPurchasePrice || ticketData.child_purchase_price || ticketData.child_price || "",
      infantSellingPrice: ticketData.infantSellingPrice || ticketData.infant_fare || "",
      infantPurchasePrice: ticketData.infantPurchasePrice || ticketData.infant_purchase_price || ticketData.infant_price || "",
      // Map primary trip and stopover fields into the flat form fields the UI expects
      ...(function(data){
        try {
          const outTrip = Array.isArray(data.trip_details) && data.trip_details.length ? (data.trip_details.find(t=>t.trip_type==='Departure') || data.trip_details[0]) : null;
          const retTrip = Array.isArray(data.trip_details) && data.trip_details.length ? (data.trip_details.find(t=>t.trip_type==='Return') || data.trip_details[1]) : null;
          const stop = Array.isArray(data.stopover_details) && data.stopover_details.length ? (data.stopover_details.find(s=>s.trip_type==='Departure') || data.stopover_details[0]) : null;

          const mapCityId = (c) => {
            if (!c) return "";
            if (typeof c === 'object') return c.id || c.value || "";
            return c;
          };

          const formatForDatetimeLocal = (iso) => {
            if (!iso) return "";
            try {
              const d = new Date(iso);
              if (isNaN(d.getTime())) return "";
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const hh = String(d.getHours()).padStart(2, '0');
              const min = String(d.getMinutes()).padStart(2, '0');
              return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
            } catch (e) { return ""; }
          };

          return {
            // Ensure top-level airline is derived from trip if present
            airline: outTrip ? (outTrip.airline ? (typeof outTrip.airline === 'object' ? outTrip.airline.id : outTrip.airline) : (data.airline || "")) : (data.airline || ""),
            // Outbound trip
            departureDateTime: outTrip ? formatForDatetimeLocal(outTrip.departure_date_time || outTrip.departureDateTime || outTrip.departure_date_time) : (data.departure_date && data.departure_time ? `${data.departure_date}T${data.departure_time.slice(0,5)}` : (data.departureDateTime || "")),
            arrivalDateTime: outTrip ? formatForDatetimeLocal(outTrip.arrival_date_time || outTrip.arrivalDateTime || outTrip.arrival_date_time) : (data.arrival_date && data.arrival_time ? `${data.arrival_date}T${data.arrival_time.slice(0,5)}` : (data.arrivalDateTime || "")),
            departure: outTrip ? mapCityId(outTrip.departure_city || outTrip.departure_city_id || outTrip.departure_city) : (data.origin || data.departure || ""),
            arrival: outTrip ? mapCityId(outTrip.arrival_city || outTrip.arrival_city_id || outTrip.arrival_city) : (data.destination || data.arrival || ""),
            flightNumber: outTrip ? (outTrip.flight_number || outTrip.flightNumber || outTrip.number || outTrip.flight || data.flight_number || "") : (data.flight_number || ""),

            // Stopover (departure-side)
            stop1_departure: stop ? mapCityId(stop.stopover_city || stop.stopover_city_id || stop.stopover_city) : (data.stopLocation1 || data.stop1_departure || ""),
              stop1_arrival: (function(){
                if (!stop) return (data.stop1_arrival || "");
                // Prefer explicit stop-level arrival_city on the stopover record
                if (stop.arrival_city) return (typeof stop.arrival_city === 'object' ? stop.arrival_city.id : stop.arrival_city);
                // Some payloads embed trip info under stop.trip; use that if present
                if (stop.trip && stop.trip.arrival_city) {
                  return (typeof stop.trip.arrival_city === 'object' ? stop.trip.arrival_city.id : stop.trip.arrival_city);
                }
                // fallback to outbound trip arrival city if stop-level arrival not provided
                if (outTrip && outTrip.arrival_city) return (typeof outTrip.arrival_city === 'object' ? outTrip.arrival_city.id : outTrip.arrival_city);
                return (data.stop1_arrival || "");
              })(),
            stop1_departureDateTime: (function(){
              if (!stop) return (data.stop1_departureDateTime || "");
              if (stop.trip && (stop.trip.departure_date_time || stop.trip.departureDateTime)) {
                return formatForDatetimeLocal(stop.trip.departure_date_time || stop.trip.departureDateTime);
              }
              // fallback to outbound trip departure
              if (outTrip && (outTrip.departure_date_time || outTrip.departureDateTime)) return formatForDatetimeLocal(outTrip.departure_date_time || outTrip.departureDateTime);
              return (data.stop1_departureDateTime || "");
            })(),
            stop1_arrivalDateTime: (function(){
              if (!stop) return (data.stop1_arrivalDateTime || "");
              if (stop.trip && (stop.trip.arrival_date_time || stop.trip.arrivalDateTime)) {
                return formatForDatetimeLocal(stop.trip.arrival_date_time || stop.trip.arrivalDateTime);
              }
              // fallback to outbound trip arrival
              if (outTrip && (outTrip.arrival_date_time || outTrip.arrivalDateTime)) return formatForDatetimeLocal(outTrip.arrival_date_time || outTrip.arrivalDateTime);
              return (data.stop1_arrivalDateTime || "");
            })(),
            stop1_airline: (function(){
              // Prefer an explicit stop-level airline, then the stop.airline_id,
              // then the outbound trip's airline, then legacy top-level fields.
              if (!stop) {
                if (outTrip && outTrip.airline) return (typeof outTrip.airline === 'object' ? outTrip.airline.id : outTrip.airline);
                return (data.stop1_airline || data.airline || "");
              }
              if (stop.airline) return (typeof stop.airline === 'object' ? stop.airline.id : stop.airline);
              if (stop.airline_id) return stop.airline_id;
              if (outTrip && outTrip.airline) return (typeof outTrip.airline === 'object' ? outTrip.airline.id : outTrip.airline);
              return (data.stop1_airline || data.airline || "");
            })(),
            stop1_flightNumber: (function(){
              if (!stop) return (data.stop1_flightNumber || "");
              if (stop.trip && (stop.trip.flight_number || stop.trip.flightNumber)) return (stop.trip.flight_number || stop.trip.flightNumber);
              // fallback to outbound trip flight number
              if (outTrip && (outTrip.flight_number || outTrip.flightNumber)) return (outTrip.flight_number || outTrip.flightNumber);
              return (data.stop1_flightNumber || "");
            })(),
            stopTime1: (function(){ if (!stop) return (data.stopTime1 || ""); return (stop.stopover_duration || data.stopTime1 || ""); })(),

            // Return trip (if present)
            returnDepartureDateTime: retTrip ? (retTrip.departure_date_time || retTrip.departureDateTime || "") : (data.returnDepartureDateTime || ""),
            returnArrivalDateTime: retTrip ? (retTrip.arrival_date_time || retTrip.arrivalDateTime || "") : (data.returnArrivalDateTime || ""),
            returnDeparture: retTrip ? mapCityId(retTrip.departure_city || retTrip.departure_city_id || retTrip.departure_city) : (data.returnDeparture || ""),
            returnArrival: retTrip ? mapCityId(retTrip.arrival_city || retTrip.arrival_city_id || retTrip.arrival_city) : (data.returnArrival || ""),
            returnFlightNumber: retTrip ? (retTrip.flight_number || retTrip.flightNumber || "") : (data.return_flight_number || data.returnFlightNumber || ""),
          };
        } catch (e) { return {}; }
      })(ticketData),
      // Map other API fields if needed
      // Extract numeric suffixes from per-trip flight numbers when available
      flightNumber: (function(v){
        try {
          if(!v) return "";
          const extract = (s) => { if(!s && s !== 0) return ""; const str = String(s); return (str.includes('-') ? str.split('-').pop() : str).replace(/\D/g, ''); };
          // prefer trip_details Departure entry
          const td = Array.isArray(v.trip_details) && v.trip_details.length ? (v.trip_details.find(t=>t.trip_type==='Departure') || v.trip_details[0]) : null;
          if (td) return extract(td.flight_number || td.flightNumber || td.number || td.flight || v.flight_number);
          return extract(v.flight_number || v.departure_flight_number || "");
        } catch(e){ return "" }
      })(ticketData),
      returnFlightNumber: (function(v){
        try {
          if(!v) return "";
          const extract = (s) => { if(!s && s !== 0) return ""; const str = String(s); return (str.includes('-') ? str.split('-').pop() : str).replace(/\D/g, ''); };
          // prefer trip_details Return entry (or second index)
          const td = Array.isArray(v.trip_details) && v.trip_details.length ? (v.trip_details.find(t=>t.trip_type==='Return') || v.trip_details[1]) : null;
          if (td) return extract(td.flight_number || td.flightNumber || td.number || td.flight || v.return_flight_number);
          return extract(v.return_flight_number || v.returnFlightNumber || "");
        } catch(e){ return "" }
      })(ticketData),
      meal: ticketData?.is_meal_included ? "Yes" : "No",
      ticketType: ticketData?.is_refundable ? "Refundable" : "Non-Refundable",
      umrahSeat: ticketData?.is_umrah_seat ? "Yes" : "No",
      resellingAllowed:
        ticketData?.reselling_allowed === true ||
        ticketData?.reselling_allowed === "true" ||
        ticketData?.reselling_allowed === 1 ||
        ticketData?.reselling_allowed === "1" ||
        ticketData?.resellingAllowed === true ||
        ticketData?.resellingAllowed === "true" ||
        !!ticketData?.resellingAllowed,
    } : INITIAL_FORM_STATE
  );

  // Ensure formData reflects any editData changes (normalize reselling flag)
  useEffect(() => {
    if (!ticketData) return;

    const normalized = {
      resellingAllowed:
        ticketData?.reselling_allowed === true ||
        ticketData?.reselling_allowed === "true" ||
        ticketData?.reselling_allowed === 1 ||
        ticketData?.reselling_allowed === "1" ||
        ticketData?.resellingAllowed === true ||
        ticketData?.resellingAllowed === "true" ||
        !!ticketData?.resellingAllowed,
    };

    // Ensure trip-level flight numbers map into the editable numeric suffix fields
    const mapFlightSuffix = (data) => {
      const extract = (s) => { if(!s && s !== 0) return ""; const str = String(s); return (str.includes('-') ? str.split('-').pop() : str).replace(/\D/g, ''); };
      const outTrip = Array.isArray(data.trip_details) && data.trip_details.length ? (data.trip_details.find(t=>t.trip_type==='Departure') || data.trip_details[0]) : null;
      const retTrip = Array.isArray(data.trip_details) && data.trip_details.length ? (data.trip_details.find(t=>t.trip_type==='Return') || data.trip_details[1]) : null;
      // also map trip/stopover display fields to keep the edit form populated
      const stop = Array.isArray(data.stopover_details) && data.stopover_details.length ? (data.stopover_details.find(s=>s.trip_type==='Departure') || data.stopover_details[0]) : null;
      const mapCityId = (c) => { if (!c) return ""; if (typeof c === 'object') return c.id || c.value || ""; return c; };

      const formatForDatetimeLocal = (iso) => {
        if (!iso) return "";
        try {
          const d = new Date(iso);
          if (isNaN(d.getTime())) return "";
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
        } catch (e) { return ""; }
      };

      return {
        flightNumber: outTrip ? extract(outTrip.flight_number || outTrip.flightNumber || outTrip.number || outTrip.flight || data.flight_number) : extract(data.flight_number || data.departure_flight_number),
        returnFlightNumber: retTrip ? extract(retTrip.flight_number || retTrip.flightNumber || retTrip.number || retTrip.flight || data.return_flight_number) : extract(data.return_flight_number || data.returnFlightNumber),
        departureDateTime: outTrip ? formatForDatetimeLocal(outTrip.departure_date_time || outTrip.departureDateTime || outTrip.departure_date_time) : (data.departure_date && data.departure_time ? `${data.departure_date}T${data.departure_time.slice(0,5)}` : (data.departureDateTime || "")),
        arrivalDateTime: outTrip ? formatForDatetimeLocal(outTrip.arrival_date_time || outTrip.arrivalDateTime || outTrip.arrival_date_time) : (data.arrival_date && data.arrival_time ? `${data.arrival_date}T${data.arrival_time.slice(0,5)}` : (data.arrivalDateTime || "")),
        departure: outTrip ? mapCityId(outTrip.departure_city || outTrip.departure_city_id || outTrip.departure_city) : (data.origin || data.departure || ""),
        arrival: outTrip ? mapCityId(outTrip.arrival_city || outTrip.arrival_city_id || outTrip.arrival_city) : (data.destination || data.arrival || ""),
        stop1_departure: stop ? mapCityId(stop.stopover_city || stop.stopover_city_id || stop.stopover_city) : (data.stopLocation1 || data.stop1_departure || ""),
        stop1_arrival: (function(){ if(!stop) return (data.stop1_arrival || ""); if (stop.trip && stop.trip.arrival_city) { return (typeof stop.trip.arrival_city === 'object' ? stop.trip.arrival_city.id : stop.trip.arrival_city); } if (outTrip && outTrip.arrival_city) return (typeof outTrip.arrival_city === 'object' ? outTrip.arrival_city.id : outTrip.arrival_city); return (data.stop1_arrival || ""); })(),
        stop1_departureDateTime: (function(){ if(!stop) return (data.stop1_departureDateTime || ""); if (stop.departure_date_time || stop.departureDateTime) { return formatForDatetimeLocal(stop.departure_date_time || stop.departureDateTime); } if (stop.trip && (stop.trip.departure_date_time || stop.trip.departureDateTime)) { return formatForDatetimeLocal(stop.trip.departure_date_time || stop.trip.departureDateTime); } if (outTrip && (outTrip.departure_date_time || outTrip.departureDateTime)) return formatForDatetimeLocal(outTrip.departure_date_time || outTrip.departureDateTime); return (data.stop1_departureDateTime || ""); })(),
        stop1_arrivalDateTime: (function(){ if(!stop) return (data.stop1_arrivalDateTime || ""); if (stop.arrival_date_time || stop.arrivalDateTime) { return formatForDatetimeLocal(stop.arrival_date_time || stop.arrivalDateTime); } if (stop.trip && (stop.trip.arrival_date_time || stop.trip.arrivalDateTime)) { return formatForDatetimeLocal(stop.trip.arrival_date_time || stop.trip.arrivalDateTime); } if (outTrip && (outTrip.arrival_date_time || outTrip.arrivalDateTime)) return formatForDatetimeLocal(outTrip.arrival_date_time || outTrip.arrivalDateTime); return (data.stop1_arrivalDateTime || ""); })(),
        stop1_airline: (function(){
          if (!stop) {
            if (outTrip && outTrip.airline) return (typeof outTrip.airline === 'object' ? outTrip.airline.id : outTrip.airline);
            return (data.stop1_airline || data.airline || "");
          }
          if (stop.airline) return (typeof stop.airline === 'object' ? stop.airline.id : stop.airline);
          if (stop.airline_id) return stop.airline_id;
          if (outTrip && outTrip.airline) return (typeof outTrip.airline === 'object' ? outTrip.airline.id : outTrip.airline);
          return (data.stop1_airline || data.airline || "");
        })(),
        stop1_flightNumber: (function(){ if (!stop) return (data.stop1_flightNumber || (outTrip && (outTrip.flight_number || outTrip.flightNumber)) || (data.flight_number || "")); if (stop.flight_number || stop.flightNumber) return (stop.flight_number || stop.flightNumber); if (stop.trip && (stop.trip.flight_number || stop.trip.flightNumber)) return (stop.trip.flight_number || stop.trip.flightNumber); if (outTrip && (outTrip.flight_number || outTrip.flightNumber)) return (outTrip.flight_number || outTrip.flightNumber); return (data.stop1_flightNumber || (data.flight_number || "")); })(),
        stopTime1: (function(){ if (!stop) return (data.stopTime1 || ""); return (stop.stopover_duration || data.stopTime1 || ""); })(),
      };
    };

      const flightSuffixes = mapFlightSuffix(ticketData);

        setFormData((prev) => ({ ...prev, ...ticketData, ...normalized, ...flightSuffixes }));
      }, [ticketData]);

  // Debug: log incoming editData and formData for troubleshooting reselling flag
  useEffect(() => {
    console.debug("AddTicket - editData:", ticketData);
  }, [ticketData]);

  useEffect(() => {
    console.debug("AddTicket - formData (resellingAllowed):", {
      resellingAllowed: formData?.resellingAllowed,
      type: typeof formData?.resellingAllowed,
    });
  }, [formData]);


  const tabs = [
    { name: "Ticket Bookings", path: "/ticket-booking" },
    { name: "Add Tickets", path: "/ticket-booking/add-ticket" },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // // Initial form state
  // const INITIAL_FORM_STATE = {
  //   airline: "",
  //   meal: "Yes",
  //   ticketType: "Refundable",
  //   pnr: "",
  //   price: "",
  //   totalSeats: "",
  //   weight: "",
  //   piece: "",
  //   umrahSeat: "Yes",
  //   tripType: "One-way",
  //   flightType: "Non-Stop",
  //   returnFlightType: "Non-Stop",
  //   departureDateTime: "",
  //   arrivalDateTime: "",
  //   departure: "",
  //   arrival: "",
  //   returnDepartureDateTime: "",
  //   returnArrivalDateTime: "",
  //   returnDeparture: "",
  //   returnArrival: "",
  //   stopLocation1: "",
  //   stopTime1: "",
  //   stopLocation2: "",
  //   stopTime2: "",
  //   returnStopLocation1: "",
  //   returnStopTime1: "",
  //   returnStopLocation2: "",
  //   returnStopTime2: "",
  // };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // When a stopover is active (1-Stop), keep the stop's departure city
  // auto-filled from the Trip Details Arrival city. The Trip Arrival
  // remains editable; when it changes and the flight is '1-Stop', we
  // copy that value into the stop's departure and disable the stop
  // departure control so it cannot be changed manually.
  useEffect(() => {
    if (formData.flightType === "1-Stop") {
      if (formData.arrival && formData.arrival !== formData.stop1_departure) {
        setFormData((prev) => ({ ...prev, stop1_departure: prev.arrival }));
      }
    }
  }, [formData.flightType, formData.arrival, formData.stop1_departure]);

  // Mirror behavior for return trip: when return flight is 1-Stop,
  // auto-fill `return_stop1_departure` from `returnArrival` and keep
  // the stop departure disabled.
  useEffect(() => {
    if (formData.tripType === "Round-trip" && formData.returnFlightType === "1-Stop") {
      if (formData.returnArrival && formData.returnArrival !== formData.return_stop1_departure) {
        setFormData((prev) => ({ ...prev, return_stop1_departure: prev.returnArrival }));
      }
    }
  }, [formData.tripType, formData.returnFlightType, formData.returnArrival, formData.return_stop1_departure]);

  // Automatically compute stopover wait time (departure stop)
  useEffect(() => {
    // Only compute outbound wait when the departure flight is actually a 1-Stop itinerary
    if (formData.flightType !== "1-Stop") {
      if (formData.stopTime1) {
        setFormData((prev) => ({ ...prev, stopTime1: "" }));
      }
      return;
    }
    const computeWait = (stopDepartureIso, tripArrivalIso) => {
      // Compute time between trip arrival and stop departure: stopDeparture - tripArrival
      if (!stopDepartureIso || !tripArrivalIso) return "";
      try {
        const dep = new Date(stopDepartureIso); // stop departure
        const arr = new Date(tripArrivalIso); // trip arrival
        if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return "";
        const diffMin = Math.round((dep.getTime() - arr.getTime()) / 60000);
        if (diffMin <= 0) return "0m";
        // under 1 hour -> minutes
        if (diffMin < 60) return `${diffMin}m`;
        // under 24 hours -> hours and minutes
        const mins = diffMin % 60;
        const totalHours = Math.floor(diffMin / 60);
        if (diffMin < 24 * 60) {
          return mins > 0 ? `${totalHours}h ${mins}m` : `${totalHours}h`;
        }
        // 24 hours or more -> show days and hours (omit minutes)
        const days = Math.floor(totalHours / 24);
        const remHours = totalHours % 24;
        return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
      } catch (err) {
        return "";
      }
    };

    // For outbound stop: compare trip arrivalDateTime vs stop1_departureDateTime
    const newWait = computeWait(formData.stop1_departureDateTime, formData.arrivalDateTime);
    if (newWait !== formData.stopTime1) {
      setFormData((prev) => ({ ...prev, stopTime1: newWait }));
    }
  }, [formData.stop1_departureDateTime, formData.arrivalDateTime, formData.flightType]);

  // Automatically compute stopover wait time (return stop)
  useEffect(() => {
    // Only compute return wait when this is a round-trip with a 1-Stop return
    if (!(formData.tripType === "Round-trip" && formData.returnFlightType === "1-Stop")) {
      if (formData.returnStopTime1) {
        setFormData((prev) => ({ ...prev, returnStopTime1: "" }));
      }
      return;
    }
    const computeWait = (stopDepartureIso, tripArrivalIso) => {
      // Compute time between trip arrival and stop departure: stopDeparture - tripArrival
      if (!stopDepartureIso || !tripArrivalIso) return "";
      try {
        const dep = new Date(stopDepartureIso);
        const arr = new Date(tripArrivalIso);
        if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return "";
        const diffMin = Math.round((dep.getTime() - arr.getTime()) / 60000);
        if (diffMin <= 0) return "0m";
        if (diffMin < 60) return `${diffMin}m`;
        const mins = diffMin % 60;
        const totalHours = Math.floor(diffMin / 60);
        if (diffMin < 24 * 60) {
          return mins > 0 ? `${totalHours}h ${mins}m` : `${totalHours}h`;
        }
        const days = Math.floor(totalHours / 24);
        const remHours = totalHours % 24;
        return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
      } catch (err) {
        return "";
      }
    };

    // For return stop: compare return trip arrival vs return stop departure
    const newReturnWait = computeWait(formData.return_stop1_departureDateTime, formData.returnArrivalDateTime);
    if (newReturnWait !== formData.returnStopTime1) {
      setFormData((prev) => ({ ...prev, returnStopTime1: newReturnWait }));
    }
  }, [formData.return_stop1_departureDateTime, formData.returnArrivalDateTime, formData.returnFlightType, formData.tripType]);

  // State for airlines and cities data
  const [airlines, setAirlines] = useState([]);
  const [cities, setCities] = useState([]);
  // Deduplicate cities by code+name (case-insensitive) to avoid
  // duplicate visible entries even when backend returns multiple
  // records with different IDs for the same city.
  const uniqueCities = useMemo(() => {
    if (!Array.isArray(cities)) return [];
    const map = new Map();
    for (const c of cities) {
      if (!c) continue;
      const code = (c.code || "").toString().trim().toLowerCase();
      const name = (c.name || "").toString().trim().toLowerCase();
      const key = `${code}|${name}`;
      if (!map.has(key)) map.set(key, c);
    }
    return Array.from(map.values());
  }, [cities]);
  const [loading, setLoading] = useState({
    airlines: true,
    cities: true,
  });
  const [error, setError] = useState({
    airlines: null,
    cities: null,
  });

  // Fetch airlines and cities on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get organization from localStorage
        const orgData = JSON.parse(
          localStorage.getItem("selectedOrganization")
        );
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");

        if (!organizationId) {
          throw new Error("Organization ID not found");
        }
        if (!token) {
          throw new Error("Access token not found");
        }

        // Fetch Airlines
        setLoading((prev) => ({ ...prev, airlines: true }));
        setError((prev) => ({ ...prev, airlines: null }));
        const airlinesResponse = await axios.get(
          "http://127.0.0.1:8000/api/airlines/",
          {
            params: { organization: organizationId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAirlines(airlinesResponse.data);

        // Fetch Cities
        setLoading((prev) => ({ ...prev, cities: true }));
        setError((prev) => ({ ...prev, cities: null }));
        const citiesResponse = await axios.get(
          "http://127.0.0.1:8000/api/cities/",
          {
            params: { organization: organizationId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCities(citiesResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err.message.includes("airlines")) {
          setError((prev) => ({ ...prev, airlines: err.message }));
        } else {
          setError((prev) => ({ ...prev, cities: err.message }));
        }
      } finally {
        setLoading({
          airlines: false,
          cities: false,
        });
      }
    };

    fetchData();
  }, []);

  // If we have a ticketId but the passed `ticketData` is incomplete, fetch full ticket
  useEffect(() => {
    const fetchTicketIfNeeded = async () => {
      try {
        if (!ticketId) return;
        // if we already have trip_details or stopover_details, assume data is complete
        if (ticketData && (Array.isArray(ticketData.trip_details) && ticketData.trip_details.length)) return;
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;
        const token = localStorage.getItem("accessToken");
        if (!organizationId || !token) return;
        const resp = await axios.get(`http://127.0.0.1:8000/api/tickets/${ticketId}/`, {
          params: { organization: organizationId },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp && resp.data) {
          setTicketDataState(resp.data);
        }
      } catch (e) {
        console.debug('Failed to fetch ticket for edit:', e);
      }
    };
    fetchTicketIfNeeded();
  }, [ticketId]);

  // Helper: derive airline code from a flight number string like "PIA-202" or "PIA202"
  const parseAirlineCodeFromFlight = (flight) => {
    if (!flight) return null;
    try {
      const s = String(flight).trim();
      // look for CODE-123 or CODE123 patterns (letters then optional separator)
      const m = s.match(/^([A-Za-z]{2,4})[- ]?\d+/);
      if (m && m[1]) return m[1].toUpperCase();
      return null;
    } catch (e) { return null; }
  };

  // When airlines have loaded and we have ticketData without an airline,
  // try to derive the airline from the flight_number prefix and auto-select it.
  useEffect(() => {
    if (!ticketData) return;
    if (!Array.isArray(airlines) || airlines.length === 0) return;
    // prefer already-populated formData.airline
    if (formData && formData.airline) return;

    const flightStr = ticketData.flight_number || ticketData.flightNumber || ticketData.flightNumberSuffix || null;
    const code = parseAirlineCodeFromFlight(flightStr);
    if (!code) return;

    const match = airlines.find(a => {
      const keys = [a.code, a.iata_code, a.airline_code, a.code_name, a.name].map(x => (x || "").toString().toUpperCase());
      return keys.includes(code);
    });
    if (match) {
      const id = match.id;
      console.debug('AddTicket - auto-derived airline from flight code', { code, id, name: match.name });
      setFormData(prev => ({ ...prev, airline: id, stop1_airline: prev.stop1_airline || id }));
    }
  }, [airlines, ticketData]);

  // Safety-net: ensure formData receives airline IDs from ticketData
  useEffect(() => {
    if (!ticketData) return;
    try {
      const outTrip = Array.isArray(ticketData.trip_details) && ticketData.trip_details.length ? (ticketData.trip_details.find(t => t.trip_type === 'Departure') || ticketData.trip_details[0]) : null;
      const stop = Array.isArray(ticketData.stopover_details) && ticketData.stopover_details.length ? (ticketData.stopover_details.find(s => s.trip_type === 'Departure') || ticketData.stopover_details[0]) : null;
      const derivedAirline = outTrip && outTrip.airline ? (typeof outTrip.airline === 'object' ? outTrip.airline.id : outTrip.airline) : null;
      const derivedStopAirline = stop && stop.airline ? (typeof stop.airline === 'object' ? stop.airline.id : stop.airline) : null;
      setFormData(prev => ({
        ...prev,
        airline: prev.airline || derivedAirline || prev.airline,
        stop1_airline: prev.stop1_airline || derivedStopAirline || derivedAirline || prev.stop1_airline,
      }));
    } catch (e) {
      console.debug('AddTicket - fill airlines from ticketData failed', e);
    }
  }, [ticketData]);

  const [submitError, setSubmitError] = useState({ type: "", message: "" });
  const [resellingTouched, setResellingTouched] = useState(false);

  // Submit form to API
  const submitForm = async (action) => {
    setIsSubmitting(true);
    setSubmitError({ type: "", message: "" });

    try {
      // Get organization and token
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;
      const token = localStorage.getItem("accessToken");

      if (!organizationId || !token) {
        throw new Error("Organization or token not found");
      }

      // Clean and validate data
      const cleanPrice = formData.price
        ? parseFloat(formData.price.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanAdultSelling = formData.adultSellingPrice
        ? parseFloat(formData.adultSellingPrice.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanAdultPurchase = formData.adultPurchasePrice
        ? parseFloat(formData.adultPurchasePrice.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanChildSelling = formData.childSellingPrice
        ? parseFloat(formData.childSellingPrice.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanChildPurchase = formData.childPurchasePrice
        ? parseFloat(formData.childPurchasePrice.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanInfantSelling = formData.infantSellingPrice
        ? parseFloat(formData.infantSellingPrice.replace(/[^0-9.]/g, ""))
        : 0;
      const cleanInfantPurchase = formData.infantPurchasePrice
        ? parseFloat(formData.infantPurchasePrice.replace(/[^0-9.]/g, ""))
        : 0;

      // Validate required fields
      if (!formData.airline || isNaN(parseInt(formData.airline))) {
        throw new Error("Please select a valid airline");
      }
      if (!formData.departure) {
        throw new Error("Departure city is required");
      }
      if (!formData.arrival) {
        throw new Error("Arrival city is required");
      }
      if (!formData.departureDateTime) {
        throw new Error("Departure date and time is required");
      }
      if (!formData.arrivalDateTime) {
        throw new Error("Arrival date and time is required");
      }
      if (!formData.totalSeats || parseInt(formData.totalSeats) <= 0) {
        throw new Error("Total seats must be greater than 0");
      }

      // Validate round-trip fields if applicable
      if (formData.tripType === "Round-trip") {
        if (!formData.returnDeparture) {
          throw new Error("Return departure city is required");
        }
        if (!formData.returnArrival) {
          throw new Error("Return arrival city is required");
        }
        if (!formData.returnDepartureDateTime) {
          throw new Error("Return departure date and time is required");
        }
        if (!formData.returnArrivalDateTime) {
          throw new Error("Return arrival date and time is required");
        }
      }

      // Prepare payload
      const payload = {
        is_meal_included: formData.meal === "Yes",
        is_refundable: formData.ticketType === "Refundable",
        pnr: formData.pnr || "N/A",
        // price: cleanPrice,
  // Purchase prices -> `*_price` (purchase / cost)
  adult_price: cleanAdultPurchase,
  child_price: cleanChildPurchase,
  infant_price: cleanInfantPurchase,
  // Selling prices -> store in `*_fare` (selling / fare)
  adult_fare: cleanAdultSelling,
  child_fare: cleanChildSelling,
  infant_fare: cleanInfantSelling,
        total_seats: parseInt(formData.totalSeats) || 0,
        left_seats: parseInt(formData.totalSeats) || 0,
        baggage_weight: parseFloat((formData.weight || "").toString().replace(/[^0-9.]/g, '')) || 0,
        baggage_pieces: parseInt(formData.piece.replace(/[^0-9]/g, '')) || 0,
        is_umrah_seat: formData.umrahSeat === "Yes",
        trip_type: formData.tripType,
        departure_stay_type: formData.flightType,
        return_stay_type:
          formData.tripType === "Round-trip"
            ? formData.returnFlightType
            : "Non-Stop",
        organization: organizationId,
        // For creates: default to false unless the user explicitly toggled the checkbox.
        // For edits (ticketId present): preserve the current value.
        reselling_allowed: ticketId
          ? !!formData.resellingAllowed
          : resellingTouched
          ? !!formData.resellingAllowed
          : false,
        airline: parseInt(formData.airline),
        trip_details: [],
        stopover_details: [],
      };

      // helpers to lookup airline and city objects for nested payloads
      const findAirlineById = (id) => {
        if (!id) return null;
        return airlines.find((a) => String(a.id) === String(id)) || null;
      };
      const findCityById = (id) => {
        if (!id) return null;
        return uniqueCities.find((c) => String(c.id) === String(id)) || null;
      };

      // Include explicit flight number suffix so backend can set ticket.flight_number
      // Backend expects `flight_number_suffix` (numeric) to combine with airline code.
      if (formData.flightNumber) {
        payload.flight_number_suffix = (formData.flightNumber || "").toString().replace(/\D/g, '');
        // Also include full flight_number (AIRLINECODE-123) to avoid backend fallback generation.
        try {
          const selAir = airlines.find((a) => String(a.id) === String(formData.airline) || Number(a.id) === Number(formData.airline));
          const code = selAir && (selAir.code || selAir.airline_code || selAir.iata_code || selAir.code_name) ? (selAir.code || selAir.airline_code || selAir.iata_code || selAir.code_name) : null;
          if (code) {
            const suffix = (formData.flightNumber || "").toString().replace(/\D/g, '');
            if (suffix) payload.flight_number = `${code}-${suffix}`;
          }
        } catch (e) {
          // ignore
        }
      }

      // Add departure trip details (include nested airline and city objects)
      const selAir = findAirlineById(formData.airline);
      const depCityObj = findCityById(formData.departure);
      const arrCityObj = findCityById(formData.arrival);
      // If this is a 1-Stop itinerary, the trip's arrival should be the
      // stop's departure city (the intermediate), and the stopover record
      // will carry the final passenger destination. Otherwise the trip's
      // arrival is the passenger destination as usual.
      let tripArrivalCityForModel = arrCityObj;
      let tripArrivalRawValue = formData.arrival;
      if (formData.flightType === "1-Stop") {
        // prefer explicit stop1_departure as the trip arrival
        const stopDep = findCityById(formData.stop1_departure || formData.stopLocation1);
        if (stopDep) {
          tripArrivalCityForModel = stopDep;
          tripArrivalRawValue = formData.stop1_departure || formData.stopLocation1;
        }
      }

      payload.trip_details.push({
        airline: selAir ? selAir.id : parseInt(formData.airline),
        flight_number: formData.flightNumber || "",
        departure_date_time: new Date(formData.departureDateTime).toISOString(),
        arrival_date_time: new Date(formData.arrivalDateTime).toISOString(),
        departure_city: depCityObj ? depCityObj.id : (formData.departure ? parseInt(formData.departure) : undefined),
        arrival_city: tripArrivalCityForModel ? tripArrivalCityForModel.id : (tripArrivalRawValue ? parseInt(tripArrivalRawValue) : undefined),
        trip_type: "Departure",
      });

      // Client-side validation to catch missing required trip/stopover fields
      const validatePayload = (p) => {
        const errors = [];
        if (!Array.isArray(p.trip_details) || p.trip_details.length === 0) {
          errors.push('trip_details: at least one trip is required');
        } else {
          p.trip_details.forEach((t, i) => {
            if (!t) {
              errors.push(`trip_details[${i}]: missing`);
              return;
            }
            if (!t.departure_date_time) errors.push(`trip_details[${i}].departure_date_time is required`);
            if (!t.arrival_date_time) errors.push(`trip_details[${i}].arrival_date_time is required`);
            if (!t.departure_city) errors.push(`trip_details[${i}].departure_city is required`);
            if (!t.arrival_city) errors.push(`trip_details[${i}].arrival_city is required`);
            if (t.airline === undefined || t.airline === null) errors.push(`trip_details[${i}].airline is required`);
          });
        }
        if (Array.isArray(p.stopover_details)) {
          p.stopover_details.forEach((s, i) => {
            if (!s) return;
            if (!s.departure_city) errors.push(`stopover_details[${i}].departure_city is required`);
            if (!s.arrival_city) errors.push(`stopover_details[${i}].arrival_city is required`);
            if (!s.departure_date_time && !s.arrival_date_time) errors.push(`stopover_details[${i}]: at least one of departure_date_time/arrival_date_time is required`);
          });
        }
        return errors;
      };

      const validationErrors = validatePayload(payload);
      if (validationErrors.length) {
        const msg = validationErrors.join(' ; ');
        console.error('Client-side payload validation failed:', validationErrors);
        setSubmitError({ type: 'error', message: `Payload validation: ${msg}` });
        setIsSubmitting(false);
        return;
      }

      console.log('Final payload being sent:', payload);

      // Add return trip details if round-trip
      if (formData.tripType === "Round-trip") {
        const retAir = findAirlineById(formData.returnAirline || formData.airline);
        const retDepCity = findCityById(formData.returnDeparture);
        const retArrCity = findCityById(formData.returnArrival);
        payload.trip_details.push({
          airline: retAir ? retAir.id : parseInt(formData.returnAirline || formData.airline),
          flight_number: formData.returnFlightNumber || "",
          departure_date_time: new Date(
            formData.returnDepartureDateTime
          ).toISOString(),
          arrival_date_time: new Date(
            formData.returnArrivalDateTime
          ).toISOString(),
          trip_type: "Return",
          departure_city: retDepCity ? retDepCity.id : (formData.returnDeparture ? parseInt(formData.returnDeparture) : undefined),
          arrival_city: retArrCity ? retArrCity.id : (formData.returnArrival ? parseInt(formData.returnArrival) : undefined),
        });
        // Also include a return suffix if present (optional - backend currently uses first trip)
        if (formData.returnFlightNumber) {
          payload.return_flight_number_suffix = (formData.returnFlightNumber || "").toString().replace(/\D/g, '');
        }
      }

      // Add stopover details (include full flight-leg fields and nested airline + city objects)
      if (formData.flightType === "1-Stop") {
        // For stopovers, ensure the stopover record represents the leg from
        // the stop departure -> final passenger destination.
        const stopDepCityId = formData.stop1_departure || formData.stopLocation1;
        const stopArrCityId = formData.stop1_arrival || formData.arrival || null; // prefer explicit stop arrival, otherwise final arrival
        const stopDepCity = findCityById(stopDepCityId);
        const stopArrCity = findCityById(stopArrCityId);
        const stopAir = findAirlineById(formData.stop1_airline || formData.airline);
        const stopoverCityForModel = stopArrCity ? stopArrCity.id : (stopDepCity ? stopDepCity.id : null);
        payload.stopover_details.push({
          airline: stopAir ? stopAir.id : (formData.stop1_airline ? parseInt(formData.stop1_airline) : undefined),
          flight_number: formData.stop1_flightNumber || "",
          departure_date_time: formData.stop1_departureDateTime ? new Date(formData.stop1_departureDateTime).toISOString() : undefined,
          arrival_date_time: formData.stop1_arrivalDateTime ? new Date(formData.stop1_arrivalDateTime).toISOString() : undefined,
          departure_city: stopDepCity ? stopDepCity.id : (stopDepCityId ? parseInt(stopDepCityId) : undefined),
          arrival_city: stopArrCity ? stopArrCity.id : (stopArrCityId ? parseInt(stopArrCityId) : undefined),
          stopover_duration: formData.stopTime1,
          trip_type: "Departure",
          stopover_city: stopoverCityForModel,
        });
      }

      if (formData.tripType === "Round-trip" && formData.returnFlightType === "1-Stop") {
        const rStopDepId = formData.return_stop1_departure || formData.returnStopLocation1;
        const rStopArrId = formData.return_stop1_arrival || null;
        const rStopDep = findCityById(rStopDepId);
        const rStopArr = findCityById(rStopArrId);
        const rStopAir = findAirlineById(formData.return_stop1_airline || formData.returnAirline || formData.airline);
        const rStopoverCityForModel = rStopArr ? rStopArr.id : (rStopDep ? rStopDep.id : null);
        payload.stopover_details.push({
          airline: rStopAir ? { id: rStopAir.id, name: rStopAir.name } : (formData.return_stop1_airline ? parseInt(formData.return_stop1_airline) : undefined),
          flight_number: formData.return_stop1_flightNumber || "",
          departure_date_time: formData.return_stop1_departureDateTime ? new Date(formData.return_stop1_departureDateTime).toISOString() : undefined,
          arrival_date_time: formData.return_stop1_arrivalDateTime ? new Date(formData.return_stop1_arrivalDateTime).toISOString() : undefined,
          departure_city: rStopDep ? { id: rStopDep.id, name: rStopDep.name } : (rStopDepId ? parseInt(rStopDepId) : undefined),
          arrival_city: rStopArr ? { id: rStopArr.id, name: rStopArr.name } : (rStopArrId ? parseInt(rStopArrId) : undefined),
          stopover_duration: formData.returnStopTime1,
          trip_type: "Return",
          stopover_city: rStopoverCityForModel,
        });
      }

      let response;
      if (ticketId) {
        // Update existing ticket
        response = await axios.put(
          `http://127.0.0.1:8000/api/tickets/${ticketId}/`,
          payload,
          {
            params: { organization: organizationId },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // Create new ticket
        response = await axios.post(
          "http://127.0.0.1:8000/api/tickets/",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Show success message
      // On success
      setSubmitError({
        type: "success",
        message: ticketId
          ? "Ticket updated successfully!"
          : "Ticket created successfully!",
      });
      // Invalidate tickets cache so TicketBooking reloads fresh data
      try {
        const orgDataForCache = JSON.parse(localStorage.getItem("selectedOrganization"));
        const orgIdForCache = orgDataForCache?.id;
        if (orgIdForCache) {
          const cacheKey = `ticketData-${orgIdForCache}`;
          localStorage.removeItem(cacheKey);
          console.log('Removed cache key', cacheKey);
        }
      } catch (e) {
        console.debug('Failed to clear ticket cache', e);
      }
      // Also set a refresh flag so TicketBooking will bypass cache if needed
      try {
        const orgDataForFlag = JSON.parse(localStorage.getItem("selectedOrganization"));
        const orgIdForFlag = orgDataForFlag?.id;
        if (orgIdForFlag) {
          localStorage.setItem(`ticket_refresh_${orgIdForFlag}`, "1");
        }
      } catch (e) {
        console.debug('Failed to set ticket refresh flag', e);
      }
      // Handle redirects based on action
      if (ticketId || action === "saveAndClose") {
        // Redirect after 1.5 seconds for updates or saveAndClose
        setTimeout(() => {
          navigate("/ticket-booking");
        }, 1000);
      } else if (action === "saveAndNew") {
        // Reset form for new entry
        setFormData({
          ...INITIAL_FORM_STATE,
          meal: "Yes",
          ticketType: "Refundable",
          umrahSeat: "Yes",
          tripType: "One-way",
          flightType: "Non-Stop",
          returnFlightType: "Non-Stop",
          adultSellingPrice: "",
          adultPurchasePrice: "",
          childSellingPrice: "",
          childPurchasePrice: "",
          infantSellingPrice: "",
          infantPurchasePrice: "",
          resellingAllowed: false,
        });
      }
    } catch (error) {
      // Log rich error details for debugging
      console.error("API Error:", error);
      try {
        console.error("API Error - response data:", error.response && error.response.data ? error.response.data : null);
      } catch (e) {
        // ignore
      }

      // Prefer server-provided validation payloads when available
      const serverData = error.response && error.response.data ? error.response.data : null;
      let message = error.message || "Failed to save ticket";
      if (serverData) {
        // If server returned a 'detail' or 'message' field, prefer that
        if (serverData.detail) message = serverData.detail;
        else if (serverData.message) message = serverData.message;
        else if (serverData.non_field_errors) message = Array.isArray(serverData.non_field_errors) ? serverData.non_field_errors.join(', ') : String(serverData.non_field_errors);
        else if (serverData.trip_details) {
          // Format nested trip_details validation errors into readable text
          try {
            const parts = [];
            serverData.trip_details.forEach((entry, idx) => {
              if (!entry) return;
              if (typeof entry === 'string') {
                parts.push(`trip_details[${idx}]: ${entry}`);
                return;
              }
              if (typeof entry === 'object') {
                const fieldParts = [];
                Object.keys(entry).forEach((k) => {
                  const val = entry[k];
                  if (Array.isArray(val)) fieldParts.push(`${k}: ${val.join('; ')}`);
                  else fieldParts.push(`${k}: ${String(val)}`);
                });
                parts.push(`trip_details[${idx}]: ${fieldParts.join(' | ')}`);
              }
            });
            if (parts.length) {
              message = parts.join(' ; ');
            } else {
              message = JSON.stringify(serverData);
            }
          } catch (e) {
            message = JSON.stringify(serverData);
          }
          // Also log structured trip_details for debugging
          console.error('API validation errors - trip_details:', serverData.trip_details);
        } else {
          // Otherwise stringify the object (trim to reasonable length)
          try {
            const s = JSON.stringify(serverData);
            message = s.length > 1000 ? s.slice(0, 1000) + '... (truncated)' : s;
          } catch (e) {
            // fallback
            message = String(serverData);
          }
        }
      }

      setSubmitError({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => submitForm("save");
  const handleSaveAndNew = () => submitForm("saveAndNew");
  const handleSaveAndClose = () => submitForm("saveAndClose");

  const handleCancel = () => {
    navigate("/ticket-booking");
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
  const renderCityOptions = (field, currentValue, required = false) => {
    if (loading.cities) return <ShimmerLoader />;
    if (error.cities)
      return <div className="text-danger small">{error.cities}</div>;

    return (
      <select
        className="form-select  shadow-none"
        required={required}
        value={currentValue}
        onChange={(e) => handleInputChange(field, e.target.value)}
      >
        <option value="">Select a city</option>
        {uniqueCities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.code} ({city.name})
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>

      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              {/* Navigation Tabs */}
              <div className="row ">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  {/* Navigation Tabs */}
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3  ${tab.name === "Add Tickets"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                          }`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        {tab.name}
                      </NavLink>
                    ))}
                  </nav>

                  {/* Action Buttons */}
                  <div className="d-flex">
                    <div className="input-group" style={{ maxWidth: "300px" }}>
                      <span className="input-group-text">
                        <Search />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search name, address, job, etc"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="">
                      <button
                        className="btn text-white"
                        style={{ background: "#1976D2" }}
                      >
                        Export
                      </button>
                    </div>
                  </div>
                </div>

                {submitError.message && (
                  <div
                    className={`alert mx-3 alert-${submitError.type === "error" ? "danger" : "success"
                      }`}
                  >
                    {submitError.message}
                  </div>
                )}
                <div className="px-2 py-4 border rounded-4">
                  <div className="card border-0 rounded-3 p-2">
                    <div className="card-body">
                      {/* Ticket Details Section */}
                      <div className="mb-4">
                        <h5 className="card-title mb-3 fw-bold">Ticket (Details)</h5>
                        <div className="row g-3">
                          {/* Select Airline moved to Trip (Details) section per UI change request */}
                          <div className="col-md-2">
                            <label htmlFor="" className="Control-label">
                              Meal
                            </label>
                            <select
                              className="form-select  shadow-none"
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
                            <label htmlFor="" className="Control-label">
                              Type
                            </label>
                            <select
                              className="form-select  shadow-none"
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
                            <label htmlFor="" className="Control-label">
                              PNR
                            </label>
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="PND32323"
                              value={formData.pnr}
                              onChange={(e) =>
                                handleInputChange("pnr", e.target.value)
                              }
                            />
                          </div>
                          {/* <div className="col-md-3">
                      <fieldset
                        className="border border-black p-2 rounded mb-3"
                        style={{
                          paddingTop: "0.5rem",
                          paddingBottom: "0.5rem",
                        }}
                      >
                        <legend
                          className="float-none w-auto px-1 fs-6"
                          style={{
                            marginBottom: "0.25rem",
                            fontSize: "0.9rem",
                            lineHeight: "-1",
                          }}
                        >
                          Price
                        </legend>
                        <input
                          type="text"
                          className="form-control rounded shadow-none  px-1 py-2"
                          required
                          placeholder="Rs- 120,000/."
                          value={formData.price}
                          onChange={(e) =>
                            handleInputChange("price", e.target.value)
                          }
                        />
                      </fieldset>
                    </div> */}
                        </div>
                      </div>

                      <div className="row g-3 mt-2">
                        <div className="col-md-2">
                          <label htmlFor="" className="Control-label">
                            Total Seats
                          </label>
                          <input
                            type="text"
                            className="form-control rounded shadow-none  px-1 py-2"
                            required
                            placeholder="30"
                            value={formData.totalSeats}
                            onChange={(e) =>
                              handleInputChange("totalSeats", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-2">
                          <label htmlFor="" className="Control-label">
                            Weight
                          </label>
                          <input
                            type="text"
                            className="form-control rounded shadow-none  px-1 py-2"
                            placeholder="30 KG"
                            value={formData.weight}
                            onChange={(e) =>
                              handleInputChange("weight", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-2">
                          <label htmlFor="" className="Control-label">
                            Piece
                          </label>
                          <input
                            type="text"
                            className="form-control rounded shadow-none  px-1 py-2"
                            placeholder="2"
                            value={formData.piece}
                            onChange={(e) =>
                              handleInputChange("piece", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-2">
                          <label htmlFor="" className="Control-label">
                            Umrah Seat
                          </label>
                          <select
                            className="form-select  shadow-none"
                            value={formData.umrahSeat}
                            onChange={(e) =>
                              handleInputChange("umrahSeat", e.target.value)
                            }
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label htmlFor="" className="Control-label">
                            Adult Prices
                          </label>
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Selling - Rs 120,000"
                              value={formData.adultSellingPrice}
                              onChange={(e) =>
                                handleInputChange("adultSellingPrice", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Purchasing - Rs 100,000"
                              value={formData.adultPurchasePrice}
                              onChange={(e) =>
                                handleInputChange("adultPurchasePrice", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <label htmlFor="" className="Control-label">
                            Child Prices
                          </label>
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Selling - Rs 100,000"
                              value={formData.childSellingPrice}
                              onChange={(e) =>
                                handleInputChange("childSellingPrice", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Purchasing - Rs 80,000"
                              value={formData.childPurchasePrice}
                              onChange={(e) =>
                                handleInputChange("childPurchasePrice", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <label htmlFor="" className="Control-label">
                            Infant Prices
                          </label>
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Selling - Rs 80,000"
                              value={formData.infantSellingPrice}
                              onChange={(e) =>
                                handleInputChange("infantSellingPrice", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Purchasing - Rs 60,000"
                              value={formData.infantPurchasePrice}
                              onChange={(e) =>
                                handleInputChange("infantPurchasePrice", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trip Details Section */}
                    <div className="mb-4 p-3">
                      <h5 className="card-title mb-3 fw-bold">Trip (Details)</h5>
                      <div className="row g-3">
                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">
                            Trip Type
                          </label>
                          <select
                            className="form-select  shadow-none"
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

                      {/* Trip fields arranged: Select Airline, Flight Number, Departure/Arrival datetimes, Departure/Arrival cities */}
                      <div className="row g-3 mt-2">
                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">
                            Select Airline
                          </label>
                          {loading.airlines ? (
                            <ShimmerLoader />
                          ) : error.airlines ? (
                            <div className="text-danger small">{error.airlines}</div>
                          ) : (
                            <select
                              className="form-select  shadow-none"
                              required
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

                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">
                            Flight Number
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="form-control rounded shadow-none  px-1 py-2"
                            placeholder="e.g. 202"
                            value={formData.flightNumber}
                            onChange={(e) =>
                              // sanitize input to digits only
                              handleInputChange("flightNumber", (e.target.value || "").replace(/\D/g, ""))
                            }
                          />
                        </div>

                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">
                            Departure Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            className="form-control rounded shadow-none  px-1 py-2"
                            required
                            value={formData.departureDateTime}
                            onChange={(e) =>
                              handleInputChange("departureDateTime", e.target.value)
                            }
                          />
                        </div>

                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">
                            Arrival Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            className="form-control rounded shadow-none  px-1 py-2"
                            required
                            value={formData.arrivalDateTime}
                            onChange={(e) =>
                              handleInputChange("arrivalDateTime", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="row g-3 mt-2">
                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">
                            Departure City
                          </label>
                          {renderCityOptions("departure", formData.departure, true)}
                        </div>
                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">
                            Arrival City
                          </label>
                          {loading.cities ? (
                            <ShimmerLoader />
                          ) : error.cities ? (
                            <div className="text-danger small">{error.cities}</div>
                          ) : (
                            <select
                              className="form-select  shadow-none"
                              required
                              value={formData.arrival}
                              onChange={(e) => handleInputChange("arrival", e.target.value)}
                            >
                              <option value="">Select a city</option>
                              {uniqueCities.map((city) => (
                                <option key={city.id} value={city.id}>
                                  {city.code} ({city.name})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Round Trip Additional Fields */}
                      {formData.tripType === "Round-trip" && (
                        <>
                          {/* Return trip fields - mirror outbound order */}
                          <div className="row g-3 mt-2">
                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">
                                Select Airline (Return)
                              </label>
                              {loading.airlines ? (
                                <ShimmerLoader />
                              ) : error.airlines ? (
                                <div className="text-danger small">{error.airlines}</div>
                              ) : (
                                <select
                                  className="form-select  shadow-none"
                                  value={formData.returnAirline || formData.airline}
                                  onChange={(e) =>
                                    handleInputChange("returnAirline", e.target.value)
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

                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">
                                Return Flight Number
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="form-control rounded shadow-none  px-1 py-2"
                                placeholder="e.g. 203"
                                value={formData.returnFlightNumber}
                                onChange={(e) =>
                                  handleInputChange("returnFlightNumber", (e.target.value || "").replace(/\D/g, ""))
                                }
                              />
                            </div>

                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">
                                Return Departure Date & Time
                              </label>
                              <input
                                type="datetime-local"
                                className="form-control rounded shadow-none  px-1 py-2"
                                required
                                value={formData.returnDepartureDateTime}
                                onChange={(e) =>
                                  handleInputChange("returnDepartureDateTime", e.target.value)
                                }
                              />
                            </div>

                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">
                                Return Arrival Date & Time
                              </label>
                              <input
                                type="datetime-local"
                                className="form-control rounded shadow-none  px-1 py-2"
                                required
                                value={formData.returnArrivalDateTime}
                                onChange={(e) =>
                                  handleInputChange("returnArrivalDateTime", e.target.value)
                                }
                              />
                            </div>
                          </div>

                          <div className="row g-3 mt-2">
                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">
                                Return Departure City
                              </label>
                              {renderCityOptions("returnDeparture", formData.returnDeparture, true)}
                            </div>
                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">
                                Return Arrival City
                              </label>
                              {loading.cities ? (
                                <ShimmerLoader />
                              ) : error.cities ? (
                                <div className="text-danger small">{error.cities}</div>
                              ) : (
                                <select
                                  className="form-select  shadow-none"
                                  required
                                  value={formData.returnArrival}
                                  onChange={(e) => handleInputChange("returnArrival", e.target.value)}
                                >
                                  <option value="">Select a city</option>
                                  {uniqueCities.map((city) => (
                                    <option key={city.id} value={city.id}>
                                      {city.code} ({city.name})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Stay Details Section */}
                    <div className="mb-4 p-3">
                      <h5 className="card-title mb-3 fw-bold">Stay (Details)</h5>
                      <div className="row g-3">
                        <div className="col-md-3">
                          <label htmlFor="" className="Control-label">
                            Flight Type (Departure)
                          </label>
                          <select
                            className="form-select  shadow-none"
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
                            <label htmlFor="" className="Control-label">
                              Flight Type (Return)
                            </label>
                            <select
                              className="form-select  shadow-none"
                              value={formData.returnFlightType}
                              onChange={(e) =>
                                handleInputChange(
                                  "returnFlightType",
                                  e.target.value
                                )
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
                          {/* Mirror main trip fields for the stop segment */}
                          <div className="col-md-3">
                            <label htmlFor="" className="Control-label">
                              Select Airline (Stop)
                            </label>
                            {loading.airlines ? (
                              <ShimmerLoader />
                            ) : error.airlines ? (
                              <div className="text-danger small">{error.airlines}</div>
                            ) : (
                              <select
                                className="form-select  shadow-none"
                                value={formData.stop1_airline || formData.airline}
                                onChange={(e) => handleInputChange("stop1_airline", e.target.value)}
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

                          <div className="col-md-3">
                            <label htmlFor="" className="Control-label">
                              Flight Number (Stop)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="e.g. 205"
                              value={formData.stop1_flightNumber}
                              onChange={(e) => handleInputChange("stop1_flightNumber", (e.target.value || "").replace(/\D/g, ""))}
                            />
                          </div>

                          <div className="col-md-3">
                            <label htmlFor="" className="Control-label">
                              Departure Date & Time (Stop)
                            </label>
                            <input
                              type="datetime-local"
                              className="form-control rounded shadow-none  px-1 py-2"
                              value={formData.stop1_departureDateTime}
                              onChange={(e) => handleInputChange("stop1_departureDateTime", e.target.value)}
                            />
                          </div>

                          <div className="col-md-3">
                            <label htmlFor="" className="Control-label">
                              Arrival Date & Time (Stop)
                            </label>
                            <input
                              type="datetime-local"
                              className="form-control rounded shadow-none  px-1 py-2"
                              value={formData.stop1_arrivalDateTime}
                              onChange={(e) => handleInputChange("stop1_arrivalDateTime", e.target.value)}
                            />
                          </div>

                          <div className="col-md-3 mt-2">
                            <label htmlFor="" className="Control-label">
                              Stop over City (Stop)
                            </label>
                            {renderCityOptions("stop1_arrival", formData.stop1_arrival)}
                          </div>
                          <div className="col-md-3 mt-2">
                            <label htmlFor="" className="Control-label">
                              Arrival  City (Stop)
                            </label>
                            {loading.cities ? (
                              <ShimmerLoader />
                            ) : error.cities ? (
                              <div className="text-danger small">{error.cities}</div>
                            ) : (
                              <select
                                className="form-select  shadow-none"
                                value={formData.stop1_departure}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  handleInputChange("stop1_departure", v);
                                  // If not a stopover-driven arrival, allow the stop change to drive arrival
                                  if (formData.flightType !== "1-Stop") {
                                    handleInputChange("arrival", v);
                                  }
                                }}
                                disabled={formData.flightType === "1-Stop"}
                              >
                                <option value="">Select a city</option>
                                {uniqueCities.map((city) => (
                                  <option key={city.id} value={city.id}>
                                    {city.code} ({city.name})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div className="col-md-3 mt-2">
                            <label htmlFor="" className="Control-label">
                              Wait Time
                            </label>
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              value={formData.stopTime1}
                              onChange={(e) => handleInputChange("stopTime1", e.target.value)}
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
                              <label htmlFor="" className="Control-label">
                                Select Airline (Return Stop)
                              </label>
                              {loading.airlines ? (
                                <ShimmerLoader />
                              ) : error.airlines ? (
                                <div className="text-danger small">{error.airlines}</div>
                              ) : (
                                <select
                                  className="form-select  shadow-none"
                                  value={formData.return_stop1_airline || formData.returnAirline || formData.airline}
                                  onChange={(e) => handleInputChange("return_stop1_airline", e.target.value)}
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

                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">
                                Flight Number (Return Stop)
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="form-control rounded shadow-none  px-1 py-2"
                                placeholder="e.g. 206"
                                value={formData.return_stop1_flightNumber}
                                onChange={(e) => handleInputChange("return_stop1_flightNumber", (e.target.value || "").replace(/\D/g, ""))}
                              />
                            </div>

                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">
                                Departure Date & Time (Return Stop)
                              </label>
                              <input
                                type="datetime-local"
                                className="form-control rounded shadow-none  px-1 py-2"
                                value={formData.return_stop1_departureDateTime}
                                onChange={(e) => handleInputChange("return_stop1_departureDateTime", e.target.value)}
                              />
                            </div>

                            <div className="col-md-3">
                              <label htmlFor="" className="Control-label">
                                Arrival Date & Time (Return Stop)
                              </label>
                              <input
                                type="datetime-local"
                                className="form-control rounded shadow-none  px-1 py-2"
                                value={formData.return_stop1_arrivalDateTime}
                                onChange={(e) => handleInputChange("return_stop1_arrivalDateTime", e.target.value)}
                              />
                            </div>

                            <div className="col-md-3 mt-2">
                              <label htmlFor="" className="Control-label">
                                Departure City (Return Stop)
                              </label>
                              {loading.cities ? (
                                <ShimmerLoader />
                              ) : error.cities ? (
                                <div className="text-danger small">{error.cities}</div>
                              ) : (
                                <select
                                  className="form-select  shadow-none"
                                  value={formData.return_stop1_departure}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    handleInputChange("return_stop1_departure", v);
                                    // Only drive returnArrival when return is NOT stop-driven
                                    if (formData.returnFlightType !== "1-Stop") {
                                      handleInputChange("returnArrival", v);
                                    }
                                  }}
                                  disabled={formData.returnFlightType === "1-Stop"}
                                >
                                  <option value="">Select a city</option>
                                  {uniqueCities.map((city) => (
                                    <option key={city.id} value={city.id}>
                                      {city.code} ({city.name})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            <div className="col-md-3 mt-2">
                              <label htmlFor="" className="Control-label">
                                Arrival City (Return Stop)
                              </label>
                              {renderCityOptions("return_stop1_arrival", formData.return_stop1_arrival)}
                            </div>

                            <div className="col-md-3 mt-2">
                              <label htmlFor="" className="Control-label">
                                Wait Time
                              </label>
                              <input
                                type="text"
                                className="form-control rounded shadow-none  px-1 py-2"
                                value={formData.returnStopTime1}
                                onChange={(e) => handleInputChange("returnStopTime1", e.target.value)}
                                placeholder="30 Minutes"
                              />
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Reselling Section */}
                    <div className="d-flex gap-5 p-4">
                      <div className="form-check d-flex align-items-center">
                        <input
                          className="form-check-input border border-black me-2"
                          type="checkbox"
                          id="reselling-allowed"
                          checked={!!formData.resellingAllowed}
                          onChange={(e) => {
                            handleInputChange("resellingAllowed", e.target.checked);
                            setResellingTouched(true);
                          }}
                          style={{ width: "1.3rem", height: "1.3rem" }}
                        />
                        <label className="form-check-label fw-medium" htmlFor="reselling-allowed">
                          Allow Reselling
                        </label>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="row">
                      <div className="col-12 d-flex flex-wrap justify-content-end gap-2 mt-4 pe-3">
                        <button
                          type="button"
                          className="btn btn-primary px-4"
                          onClick={handleSave}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary px-4"
                          onClick={handleSaveAndNew}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Saving..." : "Save and New"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary px-4"
                          onClick={handleSaveAndClose}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Saving..." : "Save and Close"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary px-4"
                          onClick={handleCancel}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <AdminFooter />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightBookingForm;