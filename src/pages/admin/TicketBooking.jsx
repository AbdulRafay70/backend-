import React, { useState, useEffect, useCallback } from "react";
import { BedDouble, Search } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";
import flightlogo from "../../assets/flightlogo.png";
import { Bag } from "react-bootstrap-icons";
import axios from "axios";
import api from "../../utils/Api";
import AdminFooter from "../../components/AdminFooter";

// Helper function to get organization ID
const getOrgId = (org) => {
  console.log('getOrgId input:', org, 'type:', typeof org);
  if (org && typeof org === "object") {
    console.log('Returning org.id:', org.id);
    return org.id;
  }
  console.log('Returning org as-is:', org);
  return org;
};

const FlightCard = ({ ticket, airlineMap, cityMap, orgId }) => {
  if (!ticket) return null;

  // Get airline info (try both numeric/string keys) and prepare fallbacks
  const airlineInfo =
    (ticket && (airlineMap[ticket.airline] || airlineMap[String(ticket.airline)])) || {};

  // Airline display fallback will be resolved after `fallbackAirlines` is available.

  // Robust resolver for city display name. Handles:
  // - city id (number/string) mapped via `cityMap`
  // - city object { id, name } or { id } or { name }
  // - raw string values (already a name)
  // - fallback to 'Unknown City'
  const getCityName = (cityRef) => {
    if (cityRef === null || cityRef === undefined) return "Unknown City";
    try {
      if (typeof cityRef === "object") {
        if (cityRef.name) return cityRef.name;
        if (cityRef.city_name) return cityRef.city_name;
        if (cityRef.code && cityRef.name === undefined) return String(cityRef.code);
        if (cityRef.id || cityRef.id === 0) {
          const idKey = cityRef.id;
          if (cityMap && (cityMap[idKey] || cityMap[String(idKey)])) return cityMap[idKey] || cityMap[String(idKey)];
        }
        return String(cityRef);
      }

      if (cityMap && (cityMap[cityRef] || cityMap[String(cityRef)])) {
        return cityMap[cityRef] || cityMap[String(cityRef)];
      }

      if (typeof cityRef === "string" && cityRef.trim() !== "") return cityRef;

      return String(cityRef);
    } catch (e) {
      return "Unknown City";
    }
  };

  // Resolve city name with additional fallbacks using the trip/stopover object
  const resolveCityName = (cityRef, contextObj) => {
    const isNumericString = (s) => typeof s === 'string' && /^\d+$/.test(s.trim());

    // If there's no explicit cityRef, try sensible context fallbacks (trip arrival, nested names)
    if (cityRef === null || cityRef === undefined || (typeof cityRef === 'string' && cityRef.trim() === '')) {
      if (contextObj && typeof contextObj === 'object') {
        const candidates = [
          contextObj.name,
          contextObj.city_name,
          contextObj.departure_city_name,
          contextObj.arrival_city_name,
          contextObj.display_name,
          contextObj.label,
        ];
        for (const c of candidates) {
          if (c && typeof c === 'string' && c.trim() !== '') return c;
        }
        const nested = contextObj.departure_city || contextObj.arrival_city || contextObj.stopover_city;
        if (nested && typeof nested === 'object') {
          if (nested.name) return nested.name;
          if (nested.city_name) return nested.city_name;
        }
        if (contextObj.arrival_city) {
          const arrivalFallback = getCityName(contextObj.arrival_city);
          if (arrivalFallback && arrivalFallback !== 'Unknown City' && !isNumericString(arrivalFallback)) return arrivalFallback;
        }
      }
      return 'Unknown City';
    }

    // We have an explicit cityRef (could be id, object, or name). Prefer it.
    const primary = getCityName(cityRef);

    // If the primary lookup returned a readable name (non-numeric and not Unknown), use it
    if (primary && primary !== 'Unknown City' && !isNumericString(primary)) return primary;

    // If we have a numeric id or unresolved primary, try lazy-fallback maps first
    const idKey = (typeof cityRef === 'object' && (cityRef.id !== undefined && cityRef.id !== null)) ? String(cityRef.id).trim() : String(cityRef).trim();
    if (idKey) {
      if (fallbackCities[idKey]) return fallbackCities[idKey];
    }

    // If primary is numeric string but no fallback available yet, return a sensible placeholder
    if (primary && isNumericString(primary)) {
      return `City (${primary})`;
    }

    // Fallback to the raw primary value or Unknown City
    return primary || 'Unknown City';
  };

  // Fallback map for city names fetched lazily when current org doesn't have the city list
  const [fallbackCities, setFallbackCities] = useState({});
  // Fallback map for airline info fetched lazily when current org doesn't have the airline list
  const [fallbackAirlines, setFallbackAirlines] = useState({});

  // If the resolved display name looks like a numeric id, try fallbackAirlines or airlineMap by id
  // This runs after `fallbackAirlines` is declared to avoid TDZ ReferenceError.
  // NOTE: removed a premature IIFE that referenced `displayAirlineName`
  // before it was defined. That could cause a ReferenceError and prevent
  // fallbacks from being applied. We now rely on the fetch-effect to
  // populate `fallbackAirlines` and on `computeAirlineDisplay()` below.

  // If this ticket belongs to another organization (shared inventory), try to fetch any missing
  // city names by id from the owning organization so linked org can display names.
  // NOTE: lazy-fetch effect moved below where `outboundTrip` and `returnTrip` are defined

  // Safely get trip and stopover details
  const tripDetails = ticket.trip_details || [];
  const stopoverDetails = ticket.stopover_details || [];

  // FIX: Updated trip_type values to match backend data
  const outboundTrip = tripDetails.find((t) => t.trip_type === "Departure") || tripDetails[0];
  // If the backend does not set `trip_type`, assume a two-item array is [outbound, return]
  let returnTrip = tripDetails.find((t) => t.trip_type === "Return");
  if (!returnTrip && tripDetails.length > 1) {
    returnTrip = tripDetails[1];
  }

  // Determine displayed flight numbers (compute after outbound/return trip are known)
  const getFlightNumber = (trip, ticketObj) => {
    if (!trip) return null;
    // prefer several possible keys that backend might return
    const raw = trip.flight_number || trip.flightNumber || trip.flight_no || trip.number || trip.flight;
    if (raw) {
      const rawStr = String(raw);
      // If the trip-level value already contains an airline-code (e.g. PIA-777), return as-is
      if (rawStr.includes("-")) return rawStr;

      // If trip-level value is numeric-only (e.g. "777") and the parent ticket has a code
      // like "PIA-777", reuse that code so UI shows "PIA-777" and "PIA-888" correctly.
      const parentFn = ticketObj && ticketObj.flight_number;
      if (parentFn && String(parentFn).includes("-")) {
        const code = String(parentFn).split("-")[0];
        const digits = rawStr.replace(/\D/g, "");
        if (digits) return `${code}-${digits}`;
      }

      // Otherwise return the raw string (may be numeric or some other format)
      return rawStr;
    }

    // fallback to top-level ticket.flight_number if trip-level not present
    return (ticketObj && ticketObj.flight_number) || null;
  };

  const outboundFlightNumber = getFlightNumber(outboundTrip, ticket) || "N/A";
  const returnFlightNumber = getFlightNumber(returnTrip, ticket);

  // Debug: if there's a return trip but no flight number, warn so we can inspect API shape
  if (returnTrip && !returnFlightNumber) {
    // eslint-disable-next-line no-console
    console.warn(`Ticket ${ticket.id} has a return trip but no flight number in trip_details`, returnTrip, ticket);
  }

  // Prefer explicit trip_type on stopovers, but accept legacy shape where
  // stopover entries lack trip_type by falling back to positional entries.
  const outboundStopover = stopoverDetails.find((s) => s.trip_type === "Departure") || (stopoverDetails.length ? stopoverDetails[0] : undefined);
  const returnStopover = stopoverDetails.find((s) => s.trip_type === "Return") || (stopoverDetails.length > 1 ? stopoverDetails[1] : undefined);

  // Debug: log resolved city names and raw values to diagnose stopover vs arrival mapping
  useEffect(() => {
    try {
      console.debug("FlightCard debug:", {
        ticketId: ticket && ticket.id,
        outboundTrip: outboundTrip,
        outboundStopover: outboundStopover,
        stopoverCityRaw: outboundStopover?.stopover_city,
        resolvedStopover: resolveCityName(outboundStopover?.stopover_city, outboundStopover),
        resolvedArrival: resolveCityName(outboundTrip?.arrival_city, outboundTrip),
        cityMapKeys: Object.keys(cityMap || {}).slice(0, 20),
      });
    } catch (e) {
      console.debug('FlightCard debug failed', e);
    }
  }, [ticket, outboundTrip, outboundStopover, cityMap]);

  // If this ticket belongs to another organization (shared inventory), try to fetch any missing
  // city names by id from the owning organization so linked org can display names.
  useEffect(() => {

    if (!ticket) return;

    // Resolve owner org id reliably (ticket.organization can be id or an object)
    const ownerOrgId = getOrgId(ticket.organization) || ticket.organization_id || ticket.inventory_owner_organization_id;
    if (!ownerOrgId) return;
    // Only fetch when the viewing org differs from the owner org
    if (String(ownerOrgId) === String(orgId)) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const candidateIds = new Set();
    const collect = (ref) => {
      if (ref === null || ref === undefined) return;
      // If ref is an object with an id, use that
      if (typeof ref === 'object') {
        const idVal = ref.id || ref.city || ref.city_id || ref.cityId;
        if (idVal !== undefined && (typeof idVal === 'number' || (typeof idVal === 'string' && /^\d+$/.test(String(idVal).trim())))) {
          const key = String(idVal).trim();
          if (!cityMap[key] && !fallbackCities[key]) candidateIds.add(key);
        }
        return;
      }

      // primitive number or numeric string
      if (typeof ref === 'number' || (typeof ref === 'string' && /^\d+$/.test(ref.trim()))) {
        const key = String(ref).trim();
        if (!cityMap[key] && !fallbackCities[key]) candidateIds.add(key);
      }
    };

    collect(outboundTrip?.departure_city);
    collect(outboundTrip?.arrival_city);
    collect(returnTrip?.departure_city);
    collect(returnTrip?.arrival_city);
    if (outboundStopover) collect(outboundStopover.stopover_city);
    if (returnStopover) collect(returnStopover.stopover_city);

    if (candidateIds.size === 0) return;

    // Fetch each missing city by id from the owning org
    candidateIds.forEach((id) => {
      (async () => {
        try {
          const res = await axios.get(`http://127.0.0.1:8000/api/cities/${id}/`, {
            params: { organization: ownerOrgId },
            headers: { Authorization: `Bearer ${token}` },
          });
          const name = res?.data?.name || res?.data?.city_name || String(res?.data || "");
          if (name) setFallbackCities((s) => ({ ...s, [id]: name }));
        } catch (e) {
          // ignore failures — we'll still fallback to whatever we have
        }
      })();
    });
  }, [ticket, outboundTrip, returnTrip, outboundStopover, returnStopover]);

  // Compute display airline name/logo using available sources in order of preference:
  // 1. airlineInfo (from local airlineMap)
  // 2. fallbackAirlines (fetched from owning org when airline is an id)
  // 3. ticket-level readable fields (airline_name, airlineName)
  // 4. placeholder
  const computeAirlineDisplay = () => {
    const fromMap = airlineInfo && (airlineInfo.name || airlineInfo.logo) ? { name: airlineInfo.name, logo: airlineInfo.logo } : null;

    // try to determine an airline id if present
    const potentialIds = [];
    if (ticket.airline !== undefined && ticket.airline !== null) potentialIds.push(ticket.airline);
    if (ticket.airline_id !== undefined && ticket.airline_id !== null) potentialIds.push(ticket.airline_id);
    if (outboundTrip && (outboundTrip.airline !== undefined && outboundTrip.airline !== null)) potentialIds.push(outboundTrip.airline);
    if (outboundTrip && (outboundTrip.airline_id !== undefined && outboundTrip.airline_id !== null)) potentialIds.push(outboundTrip.airline_id);
    if (returnTrip && (returnTrip.airline !== undefined && returnTrip.airline !== null)) potentialIds.push(returnTrip.airline);
    if (returnTrip && (returnTrip.airline_id !== undefined && returnTrip.airline_id !== null)) potentialIds.push(returnTrip.airline_id);

    // normalize to string keys and check fallbackAirlines/airlineMap
    for (const idRaw of potentialIds) {
      if (idRaw === null || idRaw === undefined) continue;
      // If idRaw is an object like { id, name }, prefer readable name if present
      if (typeof idRaw === 'object') {
        if (idRaw.name) {
          // Directly return the provided name on the trip/stopover when available
          return { name: idRaw.name || "Unknown Airline", logo: idRaw.logo || "" };
        }
        // If object contains an id, try to resolve by that id
        if (idRaw.id !== undefined && idRaw.id !== null) {
          const idStrObj = String(idRaw.id).trim();
          if (/^\d+$/.test(idStrObj)) {
            if (fallbackAirlines[idStrObj] && fallbackAirlines[idStrObj].name) {
              return { name: fallbackAirlines[idStrObj].name, logo: fallbackAirlines[idStrObj].logo || fromMap?.logo || "" };
            }
            if (airlineMap[idStrObj] && airlineMap[idStrObj].name) {
              return { name: airlineMap[idStrObj].name, logo: airlineMap[idStrObj].logo || fromMap?.logo || "" };
            }
          }
        }
        // otherwise fall through to next candidate
        continue;
      }

      const idStr = String(idRaw).trim();
      if (/^\d+$/.test(idStr)) {
        if (fallbackAirlines[idStr] && fallbackAirlines[idStr].name) {
          console.log("computeAirlineDisplay: matched fallbackAirlines", { ticketId: ticket && ticket.id, id: idStr, entry: fallbackAirlines[idStr] });
          return { name: fallbackAirlines[idStr].name, logo: fallbackAirlines[idStr].logo || fromMap?.logo || "" };
        }
        if (airlineMap[idStr] && airlineMap[idStr].name) {
          console.log("computeAirlineDisplay: matched airlineMap", { ticketId: ticket && ticket.id, id: idStr, entry: airlineMap[idStr] });
          return { name: airlineMap[idStr].name, logo: airlineMap[idStr].logo || fromMap?.logo || "" };
        }
      }
    }

    // fallback to readable ticket fields
    const nameFromTicket = ticket.airline_name || ticket.airlineName || ticket.airline_name_display || ticket.airline_label || null;
    const logoFromTicket = ticket.airline_logo || ticket.airline_logo_url || ticket.airlineLogo || null;
    if (fromMap) return { name: fromMap.name || nameFromTicket || "Unknown Airline", logo: fromMap.logo || logoFromTicket || "" };
    if (nameFromTicket || logoFromTicket) return { name: nameFromTicket || "Unknown Airline", logo: logoFromTicket || "" };

    // last resort: show numeric id as string if present, else Unknown
    if (ticket.airline !== undefined && ticket.airline !== null) {
      console.log("computeAirlineDisplay: falling back to numeric airline id", { ticketId: ticket && ticket.id, airline: ticket.airline });
      return { name: String(ticket.airline), logo: "" };
    }
    return { name: "Unknown Airline", logo: "" };
  };

  const { name: displayAirlineName, logo: displayAirlineLogo } = computeAirlineDisplay();

  // If this ticket belongs to another organization, fetch missing airline info (name/logo)
  useEffect(() => {
    if (!ticket) return;
    const ownerOrgId = getOrgId(ticket.organization) || ticket.organization_id || ticket.inventory_owner_organization_id;
    if (!ownerOrgId) return;
    if (String(ownerOrgId) === String(orgId)) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const candidateIds = new Set();
    const collect = (ref) => {
      if (ref === null || ref === undefined) return;
      if (typeof ref === 'object') {
        const idVal = ref.id || ref.airline || ref.airline_id || ref.airlineId;
        if (idVal !== undefined && (typeof idVal === 'number' || (typeof idVal === 'string' && /^\d+$/.test(String(idVal).trim())))) {
          const key = String(idVal).trim();
          if (!airlineMap[key] && !fallbackAirlines[key]) candidateIds.add(key);
        }
        return;
      }

      if (typeof ref === 'number' || (typeof ref === 'string' && /^\d+$/.test(String(ref).trim()))) {
        const key = String(ref).trim();
        if (!airlineMap[key] && !fallbackAirlines[key]) candidateIds.add(key);
      }
    };

    collect(ticket.airline);
    collect(ticket.airline_id);
    collect(outboundTrip?.airline);
    collect(outboundTrip?.airline_id);
    collect(returnTrip?.airline);
    collect(returnTrip?.airline_id);

    if (candidateIds.size === 0) return;
    // Debugging: log what airline ids we're going to fetch from owner org
    console.log("TicketBooking: airline fallback candidateIds", {
      ticketId: ticket && ticket.id,
      ownerOrgId,
      candidateIds: Array.from(candidateIds),
      tokenPresent: !!token,
    });

    candidateIds.forEach((id) => {
      (async () => {
        try {
          const url = `http://127.0.0.1:8000/api/airlines/${encodeURIComponent(id)}/`;
          const res = await axios.get(url, {
            params: { organization: ownerOrgId },
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = res?.data || {};
          const name = data.name || data.airline_name || data.display_name || String(data || "");
          const logo = data.logo || data.image || data.logo_url || data.airline_logo || "";
          console.log("TicketBooking: airline fetch result (owner single)", { id, status: res.status, data });
          if (name || logo) {
            setFallbackAirlines((s) => {
              const next = { ...s, [id]: { name, logo } };
              console.log("TicketBooking: setFallbackAirlines (owner single)", { id, entry: next[id] });
              return next;
            });
            return;
          }
        } catch (e) {
          console.log("TicketBooking: airline fetch error (owner single)", { id, err: (e && e.message) || e });
        }

        // If single fetch failed or returned no name/logo, try the owner's airlines list
        try {
          const listRes = await axios.get(`http://127.0.0.1:8000/api/airlines/`, {
            params: { organization: ownerOrgId },
            headers: { Authorization: `Bearer ${token}` },
          });
          const list = Array.isArray(listRes?.data) ? listRes.data : (Array.isArray(listRes?.data?.results) ? listRes.data.results : []);
          const found = list.find((a) => String(a.id) === String(id) || String(a.pk) === String(id));
          console.log("TicketBooking: airline list fetch result (owner list)", { id, listCount: list.length, found });
          if (found) {
            const name = found.name || found.airline_name || found.display_name || String(found || "");
            const logo = found.logo || found.image || found.logo_url || found.airline_logo || "";
            setFallbackAirlines((s) => ({ ...s, [id]: { name, logo } }));
            return;
          }
        } catch (listErr) {
          console.log("TicketBooking: airline fetch error (owner list)", { id, err: (listErr && listErr.message) || listErr });
        }

        // Try fetching the airline without organization (global single)
        try {
          const res2 = await axios.get(`http://127.0.0.1:8000/api/airlines/${encodeURIComponent(id)}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data2 = res2?.data || {};
          const name2 = data2.name || data2.airline_name || data2.display_name || String(data2 || "");
          const logo2 = data2.logo || data2.image || data2.logo_url || data2.airline_logo || "";
          console.log("TicketBooking: airline fetch result (global single)", { id, status: res2.status, data: data2 });
          if (name2 || logo2) {
            setFallbackAirlines((s) => ({ ...s, [id]: { name: name2, logo: logo2 } }));
            return;
          }
        } catch (globalSingleErr) {
          console.log("TicketBooking: airline fetch error (global single)", { id, err: (globalSingleErr && globalSingleErr.message) || globalSingleErr });
        }

        // Finally, try fetching the global airlines list and match id
        try {
          const globalListRes = await axios.get(`http://127.0.0.1:8000/api/airlines/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const globalList = Array.isArray(globalListRes?.data) ? globalListRes.data : (Array.isArray(globalListRes?.data?.results) ? globalListRes.data.results : []);
          const foundGlobal = globalList.find((a) => String(a.id) === String(id) || String(a.pk) === String(id));
          console.log("TicketBooking: airline list fetch result (global list)", { id, listCount: globalList.length, found: foundGlobal });
          if (foundGlobal) {
            const name = foundGlobal.name || foundGlobal.airline_name || foundGlobal.display_name || String(foundGlobal || "");
            const logo = foundGlobal.logo || foundGlobal.image || foundGlobal.logo_url || foundGlobal.airline_logo || "";
            setFallbackAirlines((s) => ({ ...s, [id]: { name, logo } }));
            return;
          }
        } catch (globalListErr) {
          console.log("TicketBooking: airline fetch error (global list)", { id, err: (globalListErr && globalListErr.message) || globalListErr });
        }
      })();
    });
  }, [ticket, outboundTrip, returnTrip, airlineMap, fallbackAirlines, orgId]);

  // Debug: print fallbackAirlines whenever it updates
  useEffect(() => {
    if (Object.keys(fallbackAirlines).length > 0) {
      console.log("TicketBooking: fallbackAirlines changed", fallbackAirlines);
    }
  }, [fallbackAirlines]);

  if (!outboundTrip) {
    return (
      <div className="card border-1 shadow-sm mb-4 rounded-2">
        <div className="card-body p-4">
          <h5>Ticket ID: {ticket.id}</h5>
          <p className="text-danger">Missing outbound trip details</p>
        </div>
      </div>
    );
  }

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "--:--";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-- ---";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      // Get day and month
      const day = date.getDate();
      // Use short month names
      const month = date.toLocaleString("en-US", { month: "short" });
      return `${day} ${month}`;
    } catch (e) {
      return "-- ---";
    }
  };

  const getDuration = (departure, arrival) => {
    if (!departure || !arrival) return "--h --m";
    try {
      const dep = new Date(departure);
      const arr = new Date(arrival);
      const diff = Math.abs(arr - dep);
      const totalMinutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // Format rules:
      // - If duration is at least 1 hour and minutes == 0 -> show "N hour(s)"
      // - If duration is at least 1 hour and minutes > 0 -> show compact "Nh Mm" (e.g. "1h 30m")
      // - If duration is less than 1 hour -> show "Xm"
      if (hours > 0) {
        if (minutes === 0) {
          return `${hours} hour${hours > 1 ? "s" : ""}`;
        }
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch (e) {
      return "--h --m";
    }
  };

  // Compute stopover duration for a trip (returns string like "1h 20m")
  const computeStopoverDuration = (tripType) => {
    try {
      const stop = stopoverDetails.find((s) => s.trip_type === tripType);
      // If there's a stopover record with explicit times, use them
      if (stop) {
        const start =
          stop.arrival_date_time ||
          stop.stopover_arrival_date_time ||
          stop.arrival_time ||
          stop.stopover_arrival ||
          stop.arrival;
        const end =
          stop.departure_date_time ||
          stop.stopover_departure_date_time ||
          stop.departure_time ||
          stop.stopover_departure ||
          stop.departure;

        if (start && end) {
          return getDuration(start, end);
        }
      }

      // Fallback: infer from trip_details segments for the given tripType
      const legs = tripDetails.filter((t) => t.trip_type === tripType);
      if (legs.length > 1) {
        const firstArr = legs[0].arrival_date_time || legs[0].arrival;
        const secondDep = legs[1].departure_date_time || legs[1].departure;
        if (firstArr && secondDep) return getDuration(firstArr, secondDep);
      }

      return null;
    } catch (e) {
      return null;
    }
  };

  // Format a raw stopover_duration value (minutes or text) into a friendly string.
  const formatRawStopoverDuration = (raw) => {
    if (raw === null || raw === undefined) return null;
    // If it's a number, treat as total minutes
    if (typeof raw === "number") {
      const mins = raw;
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      if (hours > 0) {
        if (minutes === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }

    // If it's a numeric string like "120" or "120m", extract digits
    const trimmed = String(raw).trim();
    const onlyDigits = /^\d+$/;
    const digitsWithM = /^(\d+)\s*m(in)?$/i;
    const digitsWithH = /^(\d+)\s*h(ours?)?$/i;

    if (onlyDigits.test(trimmed)) {
      return formatRawStopoverDuration(Number(trimmed));
    }
    let m = trimmed.match(digitsWithM);
    if (m) return formatRawStopoverDuration(Number(m[1]));
    let h = trimmed.match(digitsWithH);
    if (h) {
      const hrs = Number(h[1]);
      return hrs === 1 ? `1 hour` : `${hrs} hours`;
    }

    // If it's already human readable like "1h 30m" or "2 hours", just return as-is
    return trimmed;
  };

  const formatStopoverDurationForDisplay = (tripType, stop) => {
    const computed = computeStopoverDuration(tripType);
    if (computed) return computed;
    if (!stop) return null;
    const raw = stop.stopover_duration;
    return formatRawStopoverDuration(raw);
  };

  // Get formatted stopover flight number (e.g., "PIA-202")
  const getStopoverFlightNumber = (stop, ticket) => {
    const flightNumber = stop.flight_number || stop.flightNo || stop.flight_no || stop.number || stop.stopover_flight_number || null;
    if (!flightNumber) return null;
    if (flightNumber.includes('-')) return flightNumber; // already formatted
    // Get code from ticket's flight_number
    const parentFn = ticket && ticket.flight_number;
    if (parentFn && parentFn.includes('-')) {
      const code = parentFn.split('-')[0];
      return `${code}-${flightNumber}`;
    }
    return flightNumber;
  };

  // Determine seat warning style
  const seatWarningStyle =
    ticket.left_seats <= 9
      ? {
        color: "#FB4118",
        border: "1px solid #F14848",
        display: "inline-block",
        fontWeight: 500,
      }
      : {
        color: "#3391FF",
        border: "1px solid #3391FF",
        display: "inline-block",
        fontWeight: 500,
      };

  // Refundable badge style
  const refundableBadgeStyle = ticket.is_refundable
    ? {
      background: "#E4F0FF",
      color: "#206DA9",
    }
    : {
      background: "#FFE4E4",
      color: "#D32F2F",
    };

  return (
    <div className="flight-card card mb-4 rounded-3">
    <div className="card-body p-4">
        {/* Outbound Flight Segment */}
        <div className="d-flex justify-conter-between align-items-center gy-3">
          <div className="col-md-2 text-center">
            <img
              src={displayAirlineLogo || flightlogo}
              alt={`${displayAirlineName} logo`}
              className="img-fluid"
              style={{ maxHeight: "60px", objectFit: "contain" }}
            />
            <div className="text-muted mt-2 small fw-medium">
              {displayAirlineName}
            </div>
            {fallbackAirlines && fallbackAirlines[String(ticket.airline)] && (
              <div className="text-success mt-1 small">
                Resolved: {fallbackAirlines[String(ticket.airline)].name}
              </div>
            )}
          
            <div className="d-flex flex-column align-items-center justify-content-center gap-2">
              <div className="flight-number">{outboundFlightNumber}</div>
              {(ticket.reselling_allowed === true || ticket.reselling_allowed === "true" || ticket.reselling_allowed === 1 || ticket.reselling_allowed === "1") && String(ticket.organization) !== String(orgId) && (
                <span className="badge bg-success">Reselling</span>
              )}
            </div>
          </div>
          <div className="col-md-2 text-center text-md-start">
            <h6 className="mb-0">
              {formatTime(outboundTrip.departure_date_time)}
            </h6>
            <div className="text-muted small">
              {formatDate(outboundTrip.departure_date_time)}
            </div>
            <div className="text-muted small">
              {resolveCityName(outboundTrip.departure_city, outboundTrip)}
            </div>
          </div>

          <div className="col-md-4 text-center">
            <div className="text-muted mb-1 small">
              {getDuration(
                outboundTrip.departure_date_time,
                outboundTrip.arrival_date_time
              )}
            </div>
            <div className="position-relative">
              <div className="d-flex align-items-center justify-content-center position-relative">
                {outboundStopover ? (
                  <>
                    <hr className="w-50 m-0" />
                    <div
                      className="d-flex flex-column align-items-center"
                      style={{ margin: "0 10px" }}
                    >
                      <span
                        className="rounded-circle"
                        style={{
                          width: "10px",
                          height: "10px",
                          backgroundColor: "#699FC9",
                          position: "relative",
                          zIndex: 1,
                        }}
                      ></span>
                      <div
                        className="text-muted small mt-2"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <div>{resolveCityName(outboundStopover.stopover_city, outboundStopover) || "Unknown City"}</div>
                        {(() => {
                          const flightNum = getStopoverFlightNumber(outboundStopover, ticket);
                          return flightNum ? <div style={{ fontSize: '0.75rem', color: '#495057' }}>{flightNum}</div> : null;
                        })()}
                      </div>
                    </div>
                    <hr className="w-50 m-0" />
                  </>
                ) : (
                  <hr className="w-100 m-0" />
                )}
              </div>
            </div>

            <div className="text-muted mt-4 small">
              {outboundStopover ? ` Stopover — ${formatStopoverDurationForDisplay("Departure", outboundStopover) || "N/A"}` : "Non-stop"}
            </div>
          </div>
          <div className="col-md-2 text-center text-md-start">
            <h6 className="mb-0 ">
              {formatTime(outboundTrip.arrival_date_time)}
            </h6>
            <div className="text-muted small">
              {formatDate(outboundTrip.arrival_date_time)}
            </div>
            <div className="text-muted small">
              {resolveCityName(outboundTrip.arrival_city, outboundTrip)}
            </div>
          </div>
            <div className="col-md-2 text-center">
            <div className="fw-medium flight-duration">
              {getDuration(
                outboundTrip.departure_date_time,
                outboundTrip.arrival_date_time
              )}
            </div>
            <div
              className="text-uppercase fw-semibold small mt-1"
              style={{ color: "#699FC9" }}
            >
              {outboundStopover ? `${formatStopoverDurationForDisplay("Departure", outboundStopover) || "Stopover"}` : "Non-stop"}
            </div>
            <div
              className="small mt-1 px-2 py-1 rounded"
              style={seatWarningStyle}
            >
              {ticket.left_seats <= 9
                ? `Only ${ticket.left_seats} seats left`
                : `${ticket.left_seats} seats left`}
            </div>
          </div>
        </div>

        {/* Return Flight Segment (if exists) */}
        {returnTrip && (
          <>
            <hr className="my-4" />
            <div className="d-flex justify-conter-between align-items-center gy-3 mt-3">
              <div className="col-md-2 text-center">
                  <img
                    src={displayAirlineLogo || flightlogo}
                    alt={`${displayAirlineName} logo`}
                    className="img-fluid"
                    style={{ maxHeight: "60px", objectFit: "contain" }}
                  />
                <div className="text-muted mt-2 small fw-medium">
                  {displayAirlineName}
                </div>
                {fallbackAirlines && fallbackAirlines[String(ticket.airline)] && (
                  <div className="text-success mt-1 small">
                    Resolved: {fallbackAirlines[String(ticket.airline)].name}
                  </div>
                )}
                {returnFlightNumber && (
                  <div className="flight-number mt-1">{returnFlightNumber}</div>
                )}
              </div>
              <div className="col-md-2 text-center text-md-start">
                <h6 className="mb-0 ">
                  {formatTime(returnTrip.departure_date_time)}
                </h6>
                <div className="text-muted small">
                  {formatDate(returnTrip.departure_date_time)}
                </div>
                <div className="text-muted small">
                  {resolveCityName(returnTrip.departure_city, returnTrip)}
                </div>
              </div>

              <div className="col-md-4 text-center">
                <div className="text-muted mb-1 small">
                  {getDuration(
                    returnTrip.departure_date_time,
                    returnTrip.arrival_date_time
                  )}
                </div>
                <div className="position-relative">
                  <div className="d-flex align-items-center justify-content-center position-relative">
                    {returnStopover ? (
                      <>
                        <hr className="w-50 m-0" />
                        <div
                          className="position-relative d-flex flex-column align-items-center"
                          style={{ margin: "0 10px" }}
                        >
                          <span
                            className="rounded-circle"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor: "#699FC9",
                              position: "relative",
                              zIndex: 1,
                            }}
                          ></span>
                            <div
                              className="text-muted small mt-2"
                              style={{ whiteSpace: "nowrap" }}
                            >
                              <div>{resolveCityName(returnStopover.stopover_city, returnStopover) || "Unknown City"}</div>
                              {(() => {
                                const flightNum = getStopoverFlightNumber(returnStopover, ticket);
                                return flightNum ? <div style={{ fontSize: '0.75rem', color: '#495057' }}>{flightNum}</div> : null;
                              })()}
                            </div>
                        </div>
                        <hr className="w-50 m-0" />
                      </>
                    ) : (
                      <hr className="w-100 m-0" />
                    )}
                  </div>
                </div>

                <div className="text-muted mt-4 small">
                  {returnStopover ? `${resolveCityName(returnStopover.stopover_city, returnStopover) || 'Stopover'} Stopover — ${formatStopoverDurationForDisplay("Return", returnStopover) || "N/A"}` : "Non-stop"}
                </div>
              </div>
              <div className="col-md-2 text-center text-md-start">
                <h6 className="mb-0 ">
                  {formatTime(returnTrip.arrival_date_time)}
                </h6>
                <div className="text-muted small">
                  {formatDate(returnTrip.arrival_date_time)}
                </div>
                <div className="text-muted small">
                  {resolveCityName(returnTrip.arrival_city, returnTrip)}
                </div>
              </div>
              <div className="col-md-2 text-center">
                <div className="fw-medium">
                  {getDuration(
                    returnTrip.departure_date_time,
                    returnTrip.arrival_date_time
                  )}
                </div>
                <div
                  className="text-uppercase fw-semibold small mt-1"
                  style={{ color: "#699FC9" }}
                >
                  {returnStopover ? `${formatStopoverDurationForDisplay("Return", returnStopover) || "1 Stop"}` : "Non-stop"}
                </div>
                {/* <div
                  className="small mt-1 px-2 py-1 rounded"
                  style={seatWarningStyle}
                >
                  {ticket.left_seats <= 9
                    ? `Only ${ticket.left_seats} seats left`
                    : `${ticket.left_seats} seats left`}
                </div> */}
              </div>
            </div>
          </>
        )}

        <hr className="my-4" />

        <div className="row align-items-center gy-3">
          <div className="col-md-7 d-flex flex-wrap gap-3 align-items-center">
            <span
              className="badge px-3 py-2 rounded"
              style={refundableBadgeStyle}
            >
              {ticket.is_refundable ? "Refundable" : "Non-Refundable"}
            </span>

            <span className="small" style={{ color: "#699FC9" }}>
              <Bag /> {ticket.baggage_weight || ticket.weight || 0}kg Baggage ({ticket.baggage_pieces || ticket.pieces || 0} pieces)
            </span>

            <span
              className="small"
              style={{ color: ticket.is_meal_included ? "#699FC9" : "#FB4118" }}
            >
              {ticket.is_meal_included ? "Meal Included" : "No Meal Included"}
            </span>
          </div>

          <div className="col-md-5 text-md-end text-center d-flex flight-right">
            <div className="d-flex flex-column me-3 align-items-center">
              <div className="flight-price">
                PKR {ticket.adult_price}{" "}
                <span className="text-muted fw-normal" style={{ fontWeight: 500, fontSize: '0.85rem' }}>/per person</span>
              </div>
            </div>
            <Link to={`/ticket-booking/detail/${ticket.id}`}>
              <button
                className="btn btn-primary btn-sm w-100 rounded btn-see-details"
                style={{ padding: "0.5rem 1.2rem" }}
              >
                See Details
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Shimmer Effect Component
const FlightCardShimmer = () => {
  return (
    <div className="card border-1 shadow-sm mb-4 rounded-2 shimmer">
      <div className="card-body p-4">
        <div className="row align-items-center gy-3">
          {/* Airline Logo */}
          <div className="col-md-2 text-center">
            <div
              className="shimmer-image rounded-3 shadow-sm border p-1 mx-auto"
              style={{ height: "60px", width: "60px" }}
            ></div>
            <div
              className="shimmer-line mt-2 mx-auto"
              style={{ width: "80px", height: "10px" }}
            ></div>
          </div>

          {/* Departure */}
          <div className="col-md-2 text-center text-md-start">
            <div
              className="shimmer-line"
              style={{
                width: "50px",
                height: "20px",
                margin: "0 auto 5px auto",
              }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "70px", height: "12px", margin: "0 auto" }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "60px", height: "12px", margin: "0 auto" }}
            ></div>
          </div>

          {/* Duration and stop */}
          <div className="col-md-4 text-center">
            <div
              className="shimmer-line"
              style={{
                width: "60px",
                height: "12px",
                margin: "0 auto 10px auto",
              }}
            ></div>
            <div className="d-flex align-items-center justify-content-center">
              <div
                className="shimmer-line"
                style={{ flex: 1, height: "1px" }}
              ></div>
              <div
                className="shimmer-dot rounded-circle mx-2"
                style={{ width: "10px", height: "10px" }}
              ></div>
              <div
                className="shimmer-line"
                style={{ flex: 1, height: "1px" }}
              ></div>
            </div>
            <div
              className="shimmer-line mt-1"
              style={{ width: "60px", height: "12px", margin: "0 auto" }}
            ></div>
          </div>

          {/* Arrival */}
          <div className="col-md-2 text-center text-md-start">
            <div
              className="shimmer-line"
              style={{
                width: "50px",
                height: "20px",
                margin: "0 auto 5px auto",
              }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "70px", height: "12px", margin: "0 auto" }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "60px", height: "12px", margin: "0 auto" }}
            ></div>
          </div>

          {/* Duration and button */}
          <div className="col-md-2 text-center">
            <div
              className="shimmer-line"
              style={{
                width: "70px",
                height: "20px",
                margin: "0 auto 5px auto",
              }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "80px", height: "20px", margin: "0 auto" }}
            ></div>
          </div>
        </div>

        <hr className="my-4" />

        <div className="row align-items-center gy-3">
          <div className="col-md-7 d-flex flex-wrap gap-3 align-items-center">
            <div
              className="shimmer-badge"
              style={{ width: "100px", height: "25px" }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "80px", height: "20px" }}
            ></div>
            <div
              className="shimmer-line"
              style={{ width: "100px", height: "20px" }}
            ></div>
          </div>
          <div className="col-md-5 text-md-end text-center d-flex">
            <div className="d-flex flex-column me-3 align-items-center">
              <div
                className="shimmer-line"
                style={{ width: "100px", height: "20px" }}
              ></div>
            </div>
            <div
              className="shimmer-button"
              style={{ width: "100px", height: "38px" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TicketBooking = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [airlineMap, setAirlineMap] = useState({});
  const [cityMap, setCityMap] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [pnr, setPnr] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [sortOptions, setSortOptions] = useState({
    airline: false,
    price: false,
    departureDate: false,
    umrahGroups: false,
    closedBooking: false,
    travelDatePassed: false,
    deleteHistory: false,
  });

  const token = localStorage.getItem("accessToken");
  const selectedOrg = JSON.parse(localStorage.getItem("selectedOrganization"));
  const orgId = getOrgId(selectedOrg);

  // Check if we have required data
  if (!selectedOrg) {
    console.error('No selectedOrganization in localStorage');
    setError("No organization selected. Please select an organization first.");
    setIsLoading(false);
    return;
  }

  const [cityCodeMap, setCityCodeMap] = useState({});
  const [routeFilters, setRouteFilters] = useState({}); // Changed to empty object

  const [airlineFilters, setAirlineFilters] = useState({});

  const tabs = [
    { name: "Ticket Bookings", path: "/ticket-booking" },
    { name: "Add Tickets", path: "/ticket-booking/add-ticket" },
  ];

  const [filteredTickets, setFilteredTickets] = useState([]);

  // Use shared api wrapper (automatically attaches token)

  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds for debugging
    return Date.now() - cachedData.timestamp < fiveMinutes;
  };

  const getTicketRoute = useCallback(
    (ticket) => {
      const tripDetails = ticket.trip_details || [];
      const outboundTrip = tripDetails.find((t) => t.trip_type === "Departure") || tripDetails[0];
      const returnTrip = tripDetails.find((t) => t.trip_type === "Return");

      if (!outboundTrip) return "UNK-UNK";

      // Helper to resolve a city reference to a code string.
      const resolveCityCode = (cityRef) => {
        if (!cityRef && cityRef !== 0) return "UNK";
        // cityRef might be an object with id or code, or a numeric/string id
        if (typeof cityRef === "object") {
          if (cityRef.code) return cityRef.code;
          if (cityRef.id) {
            return (
              cityCodeMap[cityRef.id] ||
              cityCodeMap[String(cityRef.id)] ||
              cityMap[cityRef.id] ||
              "UNK"
            );
          }
        }
        // primitive id or string
        if (cityCodeMap[cityRef]) return cityCodeMap[cityRef];
        if (cityCodeMap[String(cityRef)]) return cityCodeMap[String(cityRef)];
        // fallback to city name if available
        if (cityMap[cityRef]) return cityMap[cityRef].substr(0, 3).toUpperCase();
        // as last resort, coerce to string and take first 3 chars
        try {
          return String(cityRef).substr(0, 3).toUpperCase();
        } catch (e) {
          return "UNK";
        }
      };

      const depCode = resolveCityCode(outboundTrip.departure_city);
      const arrCode = resolveCityCode(outboundTrip.arrival_city);

      if (!returnTrip) {
        return `${depCode}-${arrCode}`;
      }

      const returnDepCode = resolveCityCode(returnTrip.departure_city);
      const returnArrCode = resolveCityCode(returnTrip.arrival_city);

      if (arrCode === returnDepCode) {
        return `${depCode}-${arrCode}-${returnArrCode}`;
      }

      return `${depCode}-${arrCode}-${returnDepCode}-${returnArrCode}`;
    },
    [cityCodeMap]
  );

  // Fetch all data in parallel
  useEffect(() => {
    const fetchData = async () => {
      console.log('Auth data:', { token: token ? 'present' : 'missing', selectedOrg, orgId });

      if (!selectedOrg) {
        console.error('No selectedOrganization in localStorage');
        setError("No organization selected. Please select an organization first.");
        setIsLoading(false);
        return;
      }

      if (!orgId || !token) {
        console.error('Missing orgId or token:', { orgId, token: token ? 'present' : 'missing' });
        setError("Organization ID or token not found");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if we have valid cached data
        const cacheKey = `ticketData-${orgId}`;
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));

        // If a refresh flag is present, ignore cache and remove flag so we fetch fresh data
        const refreshFlag = localStorage.getItem(`ticket_refresh_${orgId}`);
        if (refreshFlag) {
          console.log('ticket refresh flag found — ignoring cache');
          localStorage.removeItem(`ticket_refresh_${orgId}`);
        }

        console.log(`Org ID: ${orgId}, Cache key: ${cacheKey}`);
        console.log(`Cache exists: ${!!cachedData}, Cache valid: ${cachedData ? isCacheValid(cachedData) : false}, refreshFlag: ${!!refreshFlag}`);

        // Use cache only when it appears valid and contains tickets and no refresh flag set.
        // A cached object with an empty tickets array can hide newly created tickets
        // (observed when some code seeded an empty cache with a future timestamp).
        if (!refreshFlag && cachedData && isCacheValid(cachedData) && Array.isArray(cachedData.tickets) && cachedData.tickets.length > 0) {
          // Use cached data
          console.log('Using cached data');
          setTickets(cachedData.tickets);
          setAirlineMap(cachedData.airlineMap);
          setCityMap(cachedData.cityMap);
          setCityCodeMap(cachedData.cityCodeMap);

          // Initialize airline filters (only for airlines that appear in tickets)
          const initialAirlineFilters = {};
          try {
            // Collect airline ids and names present in cached tickets (also inspect trip_details)
            const airlineIdsInTickets = new Set();
            const airlineNamesInTickets = new Set();
            (cachedData.tickets || []).forEach((t) => {
              if (!t) return;
              // top-level airline (could be id or object)
              if (t.airline && typeof t.airline === 'object') {
                if (t.airline.id) airlineIdsInTickets.add(t.airline.id);
                if (t.airline.name) airlineNamesInTickets.add(t.airline.name);
              } else if (t.airline) {
                airlineIdsInTickets.add(t.airline);
              }
              if (t.airline_id) airlineIdsInTickets.add(t.airline_id);
              if (t.airline_name) airlineNamesInTickets.add(t.airline_name);
              if (t.airlineName) airlineNamesInTickets.add(t.airlineName);

              // inspect trip_details entries (some APIs put airline info at trip-level)
              if (Array.isArray(t.trip_details)) {
                t.trip_details.forEach((trip) => {
                  if (!trip) return;
                  if (trip.airline && typeof trip.airline === 'object') {
                    if (trip.airline.id) airlineIdsInTickets.add(trip.airline.id);
                    if (trip.airline.name) airlineNamesInTickets.add(trip.airline.name);
                  } else if (trip.airline) {
                    airlineIdsInTickets.add(trip.airline);
                  }
                  if (trip.airline_id) airlineIdsInTickets.add(trip.airline_id);
                  if (trip.airline_name) airlineNamesInTickets.add(trip.airline_name);
                  if (trip.airlineName) airlineNamesInTickets.add(trip.airlineName);
                });
              }
            });

            // Add names from airlineMap for ids present in tickets
            Object.keys(cachedData.airlineMap).forEach((airlineId) => {
              if (airlineIdsInTickets.has(Number(airlineId)) || airlineIdsInTickets.has(airlineId)) {
                const airlineName = cachedData.airlineMap[airlineId].name;
                if (airlineName) airlineNamesInTickets.add(airlineName);
              }
            });

            // Initialize filters using collected names
            airlineNamesInTickets.forEach((name) => {
              if (name) initialAirlineFilters[name] = false;
            });
          } catch (e) {
            // Fallback: include all known airlines if something goes wrong parsing cached data
            Object.keys(cachedData.airlineMap).forEach((airlineId) => {
              const airlineName = cachedData.airlineMap[airlineId].name;
              if (airlineName) initialAirlineFilters[airlineName] = false;
            });
          }
          setAirlineFilters(initialAirlineFilters);

          setIsLoading(false);
          return;
        }

        if (cachedData && isCacheValid(cachedData) && Array.isArray(cachedData.tickets) && cachedData.tickets.length === 0) {
          // Log an explicit warning to help debug stale/empty caches
          console.warn(`Found valid cache for ${cacheKey} but it contains 0 tickets — ignoring cache and fetching fresh data.`);
        }

        console.log('Fetching fresh data from API');
        // No valid cache, fetch fresh data from local API wrapper
        // declare these in outer scope so they are available after the try/catch
        let ticketsData = [];
        let airlinesData = [];
        let citiesData = [];
        try {
          const [ticketsResponse, airlinesResponse, citiesResponse] = await Promise.all([
            api.get(`/tickets/`, { params: { organization: orgId } }),
            api.get(`/airlines/`, { params: { organization: orgId } }),
            api.get(`/cities/`, { params: { organization: orgId } }),
          ]);

          console.log('API Responses:');
          console.log('Tickets response:', ticketsResponse);
          console.log('Tickets data:', ticketsResponse?.data);
          console.log('Airlines data:', airlinesResponse?.data);
          console.log('Cities data:', citiesResponse?.data);

          // Handle different response structures
          ticketsData = [];
          if (ticketsResponse?.data) {
            if (Array.isArray(ticketsResponse.data)) {
              ticketsData = ticketsResponse.data;
            } else if (ticketsResponse.data.data && Array.isArray(ticketsResponse.data.data)) {
              ticketsData = ticketsResponse.data.data;
            } else if (ticketsResponse.data.results && Array.isArray(ticketsResponse.data.results)) {
              ticketsData = ticketsResponse.data.results;
            }
          }

          airlinesData = Array.isArray(airlinesResponse?.data) ? airlinesResponse.data : [];
          citiesData = Array.isArray(citiesResponse?.data) ? citiesResponse.data : [];

          console.log(`Parsed data - Tickets: ${ticketsData.length}, Airlines: ${airlinesData.length}, Cities: ${citiesData.length}`);          console.log(`Parsed data - Tickets: ${ticketsData.length}, Airlines: ${airlinesData.length}, Cities: ${citiesData.length}`);
        } catch (apiError) {
          console.error('API call failed:', apiError);
          console.error('API error response:', apiError.response);
          throw apiError;
        }

        console.log(`Parsed data - Tickets: ${ticketsData.length}, Airlines: ${airlinesData.length}, Cities: ${citiesData.length}`);

        // Create airline map with names and logos
        const airlineMapData = airlinesData.reduce((map, airline) => {
          map[airline.id] = {
            name: airline.name,
            logo: airline.logo,
          };
          return map;
        }, {});

        // Create city map (for names)
        const cityMapData = citiesData.reduce((map, city) => {
          map[city.id] = city.name;
          return map;
        }, {});

        // Create city code map
        const cityCodeMapData = citiesData.reduce((map, city) => {
          map[city.id] = city.code;
          return map;
        }, {});

        // Initialize airline filters only for airlines present in the ticket results
        const initialAirlineFilters = {};
        try {
          // Collect airline ids and readable names from tickets (also inspect trip_details)
          const airlineIdsInTickets = new Set();
          const airlineNamesInTickets = new Set();
          (ticketsData || []).forEach((t) => {
            if (!t) return;
            if (t.airline && typeof t.airline === 'object') {
              if (t.airline.id) airlineIdsInTickets.add(t.airline.id);
              if (t.airline.name) airlineNamesInTickets.add(t.airline.name);
            } else if (t.airline) {
              airlineIdsInTickets.add(t.airline);
            }
            if (t.airline_id) airlineIdsInTickets.add(t.airline_id);
            if (t.airline_name) airlineNamesInTickets.add(t.airline_name);
            if (t.airlineName) airlineNamesInTickets.add(t.airlineName);

            if (Array.isArray(t.trip_details)) {
              t.trip_details.forEach((trip) => {
                if (!trip) return;
                if (trip.airline && typeof trip.airline === 'object') {
                  if (trip.airline.id) airlineIdsInTickets.add(trip.airline.id);
                  if (trip.airline.name) airlineNamesInTickets.add(trip.airline.name);
                } else if (trip.airline) {
                  airlineIdsInTickets.add(trip.airline);
                }
                if (trip.airline_id) airlineIdsInTickets.add(trip.airline_id);
                if (trip.airline_name) airlineNamesInTickets.add(trip.airline_name);
                if (trip.airlineName) airlineNamesInTickets.add(trip.airlineName);
              });
            }
          });

          // Add names for airlines that match ids in tickets
          airlinesData.forEach((airline) => {
            if (airlineIdsInTickets.has(Number(airline.id)) || airlineIdsInTickets.has(airline.id)) {
              if (airline.name) airlineNamesInTickets.add(airline.name);
            }
          });

          // Initialize filters using collected names
          airlineNamesInTickets.forEach((name) => {
            if (name) initialAirlineFilters[name] = false;
          });
        } catch (e) {
          // fallback: include all airlines
          airlinesData.forEach((airline) => {
            if (airline.name) initialAirlineFilters[airline.name] = false;
          });
        }

        // Update state
        setTickets(ticketsData);
        setAirlineMap(airlineMapData);
        setCityMap(cityMapData);
        setCityCodeMap(cityCodeMapData);
        setAirlineFilters(initialAirlineFilters);

        // Cache the data with a timestamp
        const dataToCache = {
          tickets: ticketsData,
          airlineMap: airlineMapData,
          cityMap: cityMapData,
          cityCodeMap: cityCodeMapData,
          timestamp: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(dataToCache));

        console.log(`Fetched ${ticketsData.length} tickets for organization ${orgId}`);
      } catch (err) {
        let errorMessage = "Failed to load data";

        if (err.response) {
          // Server responded with error status
          errorMessage =
            err.response.data?.message ||
            err.response.data?.detail ||
            `Server error: ${err.response.status}`;
        } else if (err.request) {
          // Request was made but no response received
          errorMessage = "Network error: No response from server";
        } else if (err.code === "ECONNABORTED") {
          // Request timed out
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message) {
          // Other errors
          errorMessage = err.message;
        }

        setError(errorMessage);
        console.error("API error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, orgId]);

  // Filter and sort tickets
  useEffect(() => {
    if (isLoading) {
      setFilteredTickets([]);
      return;
    }

    if (!tickets.length) {
      setFilteredTickets([]);
      return;
    }

    let result = [...tickets];

    // Filter out tickets without trip details
    result = result.filter(
      (ticket) =>
        ticket.trip_details &&
        Array.isArray(ticket.trip_details) &&
        ticket.trip_details.length > 0
    );

    // Hide tickets from other organizations unless owner allowed reselling
    result = result.filter((ticket) => {
      // Accept several possible owner fields since backend responses vary
      const ticketOrg =
        ticket.organization ||
        ticket.organization_id ||
        ticket.inventory_owner_organization_id ||
        ticket.owner_organization_id ||
        ticket.inventory_owner_company ||
        null;
      const isExternalTicket = ticketOrg && String(ticketOrg) !== String(orgId);

      // Debug: log owner/resell state to help trace visibility issues
      console.debug("Ticket filter:", {
        ticketId: ticket.id,
        ticketOrg,
        viewingOrg: orgId,
        isExternalTicket,
        reselling_allowed: ticket.reselling_allowed,
      });

      const resellAllowed =
        ticket.reselling_allowed === true ||
        ticket.reselling_allowed === "true" ||
        ticket.reselling_allowed === 1 ||
        ticket.reselling_allowed === "1";

      if (isExternalTicket && !resellAllowed) {
        return false;
      }
      return true;
    });

    console.log(`After filtering: ${result.length} tickets from ${tickets.length} total`);

    // PNR search (robust): search common pnr fields and nested booking objects
    if (pnr && String(pnr).trim() !== "") { 
      const q = String(pnr).toLowerCase().trim();
      result = result.filter((ticket) => {
        if (!ticket) return false;

        const candidates = [];

        // Top-level common fields
        candidates.push(ticket.pnr);
        candidates.push(ticket.pnr_number);
        candidates.push(ticket.pnr_no);
        candidates.push(ticket.reference);
        candidates.push(ticket.booking_reference);

        // nested booking object
        if (ticket.booking && typeof ticket.booking === "object") {
          candidates.push(ticket.booking.pnr);
          candidates.push(ticket.booking.pnr_number);
          candidates.push(ticket.booking.reference);
        }

        // Try inventory or meta fields that sometimes hold PNR
        candidates.push(ticket.code);
        candidates.push(ticket.booking_code);

        // Check each candidate for a match
        return candidates.some((c) => {
          try {
            return c && String(c).toLowerCase().includes(q);
          } catch (e) {
            return false;
          }
        });
      });
    }

    // Destination search
    if (destination) {
      const destUpper = destination.toUpperCase();
      result = result.filter((ticket) => {
        // FIX: Updated to match backend trip_type value
        const outbound = ticket.trip_details?.find(
          (t) => t.trip_type === "Departure"
        ) || ticket.trip_details?.[0];
        if (!outbound) return false;
        const arrivalCity = (resolveCityName(outbound.arrival_city, outbound) || "");
        return arrivalCity.toUpperCase().includes(destUpper);
      });
    }

    // Travel date filter
    if (travelDate) {
      const selectedDate = new Date(travelDate);
      result = result.filter((ticket) => {
        // FIX: Updated to match backend trip_type value
        const outbound = ticket.trip_details?.find(
          (t) => t.trip_type === "Departure"
        ) || ticket.trip_details?.[0];
        if (!outbound) return false;
        const depDate = new Date(outbound.departure_date_time);
        return (
          depDate.getDate() === selectedDate.getDate() &&
          depDate.getMonth() === selectedDate.getMonth() &&
          depDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }

    // Route filters
    const selectedRoutes = Object.entries(routeFilters)
      .filter(([_, selected]) => selected)
      .map(([route]) => route);

    if (selectedRoutes.length > 0) {
      result = result.filter((ticket) => {
        const ticketRoute = getTicketRoute(ticket);
        return selectedRoutes.includes(ticketRoute);
      });
    }

    // Airline filters
    const selectedAirlines = Object.entries(airlineFilters)
      .filter(([_, selected]) => selected)
      .map(([airline]) => airline);

    if (selectedAirlines.length > 0) {
      result = result.filter((ticket) => {
        // Resolve airline name robustly from multiple possible shapes
        let airlineName = "";
        if (ticket && ticket.airline) {
          if (typeof ticket.airline === "object") {
            airlineName = ticket.airline.name || ticket.airline.label || "";
          } else {
            airlineName = airlineMap[String(ticket.airline)]?.name || airlineMap[ticket.airline]?.name || "";
          }
        }
        airlineName = airlineName || ticket.airline_name || ticket.airlineName || "";
        return airlineName && selectedAirlines.includes(airlineName);
      });
    }

    // Sorting
    const activeSorts = Object.entries(sortOptions)
      .filter(([_, selected]) => selected)
      .map(([key]) => key);

    if (activeSorts.length > 0) {
      result.sort((a, b) => {
        for (const key of activeSorts) {
          let cmp = 0;
          switch (key) {
            case "airline": {
              const resolveName = (ticket) => {
                if (!ticket) return "";
                if (ticket.airline && typeof ticket.airline === "object") return ticket.airline.name || ticket.airline.label || "";
                return airlineMap[String(ticket.airline)]?.name || airlineMap[ticket.airline]?.name || ticket.airline_name || ticket.airlineName || "";
              };
              const airlineA = resolveName(a);
              const airlineB = resolveName(b);
              cmp = airlineA.localeCompare(airlineB);
              break;
            }
            case "price":
              cmp = a.adult_price - b.adult_price;
              break;
            case "departureDate": {
              // FIX: Updated to match backend trip_type value
              const outboundA = a.trip_details?.find(
                (t) => t.trip_type === "Departure"
              ) || a.trip_details?.[0];
              const outboundB = b.trip_details?.find(
                (t) => t.trip_type === "Departure"
              ) || b.trip_details?.[0];
              const dateA = outboundA
                ? new Date(outboundA.departure_date_time)
                : 0;
              const dateB = outboundB
                ? new Date(outboundB.departure_date_time)
                : 0;
              cmp = dateA - dateB;
              break;
            }
            case "umrahGroups":
              if (a.is_umrah_seat && !b.is_umrah_seat) cmp = -1;
              else if (!a.is_umrah_seat && b.is_umrah_seat) cmp = 1;
              break;
            case "closedBooking": {
              // Put closed bookings first
              const closedA = !!(a.closed || a.closed_at || a.booking_status === "closed");
              const closedB = !!(b.closed || b.closed_at || b.booking_status === "closed");
              if (closedA === closedB) cmp = 0;
              else cmp = closedA ? -1 : 1;
              break;
            }
            case "travelDatePassed": {
              // Tickets with travel date in the past are considered "passed".
              const outboundA = a.trip_details?.find((t) => t.trip_type === "Departure") || a.trip_details?.[0];
              const outboundB = b.trip_details?.find((t) => t.trip_type === "Departure") || b.trip_details?.[0];
              const now = Date.now();
              const passedA = outboundA && new Date(outboundA.departure_date_time).getTime() < now;
              const passedB = outboundB && new Date(outboundB.departure_date_time).getTime() < now;
              // Keep non-passed first
              if (passedA === passedB) cmp = 0;
              else cmp = passedA ? 1 : -1;
              break;
            }
            case "deleteHistory": {
              // If ticket appears deleted/archived, sort it to the end
              const deletedA = !!(a.deleted || a.is_deleted || a.deleted_at || a.delete_history);
              const deletedB = !!(b.deleted || b.is_deleted || b.deleted_at || b.delete_history);
              if (deletedA === deletedB) cmp = 0;
              else cmp = deletedA ? 1 : -1;
              break;
            }
            default:
              cmp = 0;
          }
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    }

    setFilteredTickets(result);
  }, [
    tickets,
    pnr,
    destination,
    travelDate,
    routeFilters,
    airlineFilters,
    sortOptions,
    airlineMap,
    cityMap,
    isLoading,
    cityCodeMap,
    routeFilters,
    getTicketRoute,
  ]);

  // Generate unique routes from tickets
  useEffect(() => {
    if (tickets.length === 0 || Object.keys(cityCodeMap).length === 0) return;

    const uniqueRoutes = {};

    const hasAirline = (ticket) => {
      if (!ticket) return false;
      // top-level airline fields
      if (ticket.airline && (typeof ticket.airline === 'object' ? (ticket.airline.name || ticket.airline.id) : ticket.airline)) return true;
      if (ticket.airline_id || ticket.airline_name || ticket.airlineName) return true;
      // inspect trip_details for trip-level airline info
      if (Array.isArray(ticket.trip_details)) {
        for (const trip of ticket.trip_details) {
          if (!trip) continue;
          if (trip.airline && (typeof trip.airline === 'object' ? (trip.airline.name || trip.airline.id) : trip.airline)) return true;
          if (trip.airline_id || trip.airline_name || trip.airlineName) return true;
        }
      }
      return false;
    };

    tickets.forEach((ticket) => {
      // Only include routes for tickets that have airline information
      if (!hasAirline(ticket)) return;
      const route = getTicketRoute(ticket);
      uniqueRoutes[route] = true;
    });

    // Initialize routeFilters with unique routes
    const newRouteFilters = {};
    Object.keys(uniqueRoutes).forEach((route) => {
      newRouteFilters[route] = routeFilters[route] || false;
    });

    setRouteFilters(newRouteFilters);
  }, [tickets, cityCodeMap, getTicketRoute]);

  const handleSearch = () => {
    console.log("Searching:", { pnr, destination, travelDate });
  };

  const handleShowAll = () => {
    setPnr("");
    setDestination("");
    setTravelDate("");
    // Reset route filters to their default (no selected routes).
    setRouteFilters((prev) => {
      const reset = { ...prev };
      for (const key in reset) {
        reset[key] = false;
      }
      return reset;
    });

    // Reset airline filters
    const resetAirlineFilters = { ...airlineFilters };
    for (const key in resetAirlineFilters) {
      resetAirlineFilters[key] = false;
    }
    setAirlineFilters(resetAirlineFilters);

    // Reset sort options
    setSortOptions({
      airline: false,
      price: false,
      departureDate: false,
      umrahGroups: false,
      closedBooking: false,
      travelDatePassed: false,
      deleteHistory: false,
    });
  };

  const handleSortChange = (key) => {
    setSortOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRouteFilterChange = (route) => {
    setRouteFilters((prev) => ({ ...prev, [route]: !prev[route] }));
  };

  const handleAirlineFilterChange = (airline) => {
    setAirlineFilters((prev) => ({ ...prev, [airline]: !prev[airline] }));
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
          }
          .shimmer-line, .shimmer-image, .shimmer-badge, .shimmer-button, .shimmer-dot {
            background: #e0e0e0;
            border-radius: 4px;
          }

          /* Flight card modern styles */
          .flight-card {
            border: none;
            border-radius: 12px;
            box-shadow: 0 6px 18px rgba(16,24,40,0.08);
            transition: transform .12s ease, box-shadow .12s ease;
            overflow: hidden;
            background: #ffffff;
          }
          .flight-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(16,24,40,0.12); }
          .flight-card .card-body { padding: 1.25rem 1.25rem; }
          .flight-header { display:flex; gap:1rem; align-items:center; }
          .flight-logo { max-height:56px; width:auto; object-fit:contain; }
          .flight-number { font-size:1.05rem; font-weight:700; color:#0d6efd; letter-spacing:0.4px; }
          .flight-return { font-size:0.85rem; color:#6c757d; }
          .flight-meta { color:#495057; font-size:0.95rem; }
          .flight-duration { color:#6b7280; font-size:0.9rem; }
          .flight-right { display:flex; flex-direction:column; align-items:flex-end; justify-content:space-between; gap:0.6rem; }
          .flight-price { font-size:1.15rem; font-weight:800; color:#0b5ed7; }
          .flight-badges { display:flex; gap:0.5rem; align-items:center; }
          .flight-card .badge { border-radius:6px; padding:.35rem .6rem; font-weight:600; }
          .btn-see-details { box-shadow: 0 6px 18px rgba(11,94,215,0.12); }
          @media (max-width: 767px) {
            .flight-header { flex-direction:row; }
            .flight-right { align-items:flex-start; text-align:left; }
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
            <div className="px-3 mt-3 px-lg-4">
              {/* Navigation Tabs */}
              <div className="row">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  {/* Navigation Tabs */}
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3  ${tab.name === "Ticket Bookings"
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
                    {/* <div className="input-group" style={{ maxWidth: "300px" }}>
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
                    </div> */}
                    <div className="mb-2">
                      <button
                        className="btn text-white"
                        style={{ background: "#1976D2" }}
                      >
                        Export
                      </button>
                    </div>
                  </div>
                </div>


                {/* Flight Booking Interface */}
                <div className="container-fluid min-vh-100">
                  {/* Header */}
                  <div className="shadow-sm p-3 mb-4 rounded">
                    <h5 className="mb-4 fw-bold">Groups Tickets</h5>

                    {/* Search Form */}
                    <div className="row g-3 d-flex flex-wrap justify-content-center align-items-center">
                      <div className="col-md-3">
                        <label htmlFor="" className="form-label">PNR</label>
                        <input
                          type="text"
                          className="form-control rounded shadow-none  px-1 py-2"
                          value={pnr}
                          onChange={(e) => setPnr(e.target.value)}
                          placeholder="SY192382"
                        />
                      </div>

                      <div className="col-md-3">
                        <label htmlFor="" className="form-label">
                          Enter Destination
                        </label>
                        <div className="input-group">
                          {/* <span className="input-group-text bg-white  text-primary">
                            <BedDouble />
                          </span> */}
                          <input
                            type="text"
                            className="form-control rounded shadow-none  px-1 py-2"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="Dubai (DXB)"
                          />
                        </div>
                      </div>

                      <div className="col-md-3">
                        <label htmlFor="" className="form-label">
                          Travel Date
                        </label>
                        <div className="input-group">
                          <input
                            type="date"
                            className="form-control rounded shadow-none  px-1 py-2"
                            value={travelDate}
                            onChange={(e) => setTravelDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-3 d-flex align-items-end ">

                        <button
                          className="btn btn-sm btn-primary me-2 px-4"
                          onClick={handleSearch}
                        >
                          Search
                        </button>


                        <button
                          className="btn btn-sm  btn-primary px-4"
                          onClick={handleShowAll}
                        >
                         All
                        </button>

                      </div>
                    </div>
                  </div>
                  {/* Sort Options */}
                  <div className=" mb-4 d-flex gap-5 flex-wrap">
                    <div className="">
                      <h5 className="mb-0 fw-bold">Sort:</h5>
                    </div>
                    <div className="d-flex gap-3 flex-nowrap overflow-auto">
                      {Object.entries({
                        airline: "Airline",
                        price: "Price",
                        departureDate: "Departure Date",
                        umrahGroups: "Umrah Groups",
                        closedBooking: "Closed Booking",
                        travelDatePassed: "Travel Date Passed",
                        deleteHistory: "Delete History",
                      }).map(([key, label]) => (
                        <div className="form-check" key={key}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={sortOptions[key]}
                            onChange={() => handleSortChange(key)}
                            id={key}
                          />
                          <label className="form-check-label text-nowrap" htmlFor={key}>
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>

                  </div>
                  <div className="row">
                    <div className="col-md-3">
                      {/* Route Filter */}
                      <div className="mb-4  border rounded">
                        <div className="mt-4">
                          <h6
                            className="mb-4 fw-bold text-center"
                            style={{ color: "#548579" }}
                          >
                            Route
                          </h6>
                        </div>
                        <div className="d-flex flex-md-column justify-content-start align-items-start gap-3 ps-4 overflow-auto flex-nowrap">
                          {/* Dynamic route filters */}
                          {Object.keys(routeFilters).map((route) => (
                            <div className="form-check" key={route}>
                              <input
                                className="form-check-input "
                                type="checkbox"
                                checked={routeFilters[route]}
                                onChange={() => handleRouteFilterChange(route)}
                                id={route}
                              />
                              <label
                                className="form-check-label small text-nowrap"
                                htmlFor={route}
                              >
                                {route}
                              </label>
                            </div>
                          ))}
                        </div>
                        {/* Airline Filter */}
                        <div className="">
                          <h6
                            className="mb-4 fw-bold mt-4 text-center"
                            style={{ color: "#548579" }}
                          >
                            Airline
                          </h6>
                        </div>
                        <div className="d-flex flex-md-column justify-content-start align-items-start gap-3 ps-4 overflow-auto flex-nowrap">
                          {/* Dynamic route filters */}
                          {Object.keys(airlineFilters).map((airlineName) => (
                            <div className="form-check" key={airlineName}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={airlineFilters[airlineName]}
                                onChange={() =>
                                  handleAirlineFilterChange(airlineName)
                                }
                                id={airlineName}
                              />
                              <label
                                className="form-check-label small text-nowrap"
                                htmlFor={airlineName}
                              >
                                {airlineName}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9">
                      {/* Loading state with shimmer effect */}
                      {isLoading && (
                        <>
                          <FlightCardShimmer />
                          <FlightCardShimmer />
                          <FlightCardShimmer />
                        </>
                      )}

                      {/* Error state */}
                      {!isLoading && error && (
                        <div className="alert alert-danger my-5">
                          <h5>Error Loading Data</h5>
                          <p className="mb-1">{error}</p>
                          <p className="small mb-0">Organization ID: {orgId}</p>
                          <div className="mt-3">
                            <button
                              className="btn btn-sm btn-outline-danger me-2"
                              onClick={() => window.location.reload()}
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      )}

                      {/* No tickets found */}
                      {!isLoading && !error && filteredTickets.length === 0 && (
                        <div className="text-center my-5">
                          <h5>No tickets found</h5>
                          <p>Try adjusting your search criteria</p>
                          <button
                            className="btn btn-primary mt-2"
                            onClick={handleShowAll}
                          >
                            Show All Tickets
                          </button>
                        </div>
                      )}

                      {/* Display filtered tickets */}
                      {!isLoading && !error && filteredTickets.length > 0 && (
                        <div className="small">
                          {/* <div className="mb-3 text-muted">
                      Showing {filteredTickets.length} of {tickets.length}{" "}
                      tickets
                    </div> */}
                          {filteredTickets.map((ticket, idx) => {
                            // Ensure a stable, unique key for each ticket entry.
                            // Prefer numeric `ticket.id` when present; otherwise
                            // fallback to a combination of pnr, organization and index.
                            const safeId = ticket.id !== undefined && ticket.id !== null
                              ? String(ticket.id)
                              : `${String(ticket.pnr || "pnr")}-${String(ticket.organization || ticket.organization_id || "org")}-${idx}`;

                            return (
                              <FlightCard
                                key={safeId}
                                ticket={ticket}
                                airlineMap={airlineMap}
                                cityMap={cityMap}
                                orgId={orgId}
                              />
                            );
                          })}
                        </div>
                      )}
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

export default TicketBooking;
