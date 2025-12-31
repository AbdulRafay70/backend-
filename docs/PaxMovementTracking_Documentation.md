# Pax Movement Tracking System - Technical Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Core Functionality](#core-functionality)
4. [Status Logic & Flow](#status-logic--flow)
5. [Data Sources & API Integration](#data-sources--api-integration)
6. [Data Transformation](#data-transformation)
7. [Flight Detection Algorithm](#flight-detection-algorithm)
8. [Transport Sector Analysis](#transport-sector-analysis)
9. [Statistics & Reporting](#statistics--reporting)
10. [UI Components](#ui-components)
11. [Search & Filter Features](#search--filter-features)
12. [Error Handling](#error-handling)
13. [Performance Optimizations](#performance-optimizations)
14. [Code Examples](#code-examples)

---

## 📋 Overview

### **Purpose**
The **Pax Movement Tracking System** is an intelligent passenger tracking solution designed for Umrah/Hajj travel agencies. It monitors passengers throughout their entire journey from Pakistan to Saudi Arabia and back, automatically determining their current location and status based on flight schedules and transport itineraries.

### **Key Features**
- ✅ Real-time passenger status tracking
- 🛫 Intelligent flight-based location detection
- 🚌 Transport sector analysis for city identification
- 📊 Statistical dashboard with visual indicators
- 🔍 Advanced search and filtering capabilities
- 👤 Agent and organization tracking
- 🔄 Automatic status updates based on dates
- 📱 Responsive design for all devices

### **Technology Stack**
- **Frontend**: React.js with React Bootstrap
- **State Management**: React Hooks (useState, useEffect)
- **API**: RESTful API integration
- **Icons**: Lucide React icons
- **Styling**: Bootstrap 5 + Custom CSS

---

## 🔐 System Requirements

### **Passenger Display Criteria**
A passenger is displayed in the tracking system ONLY when **BOTH** conditions are met:

```javascript
Condition 1: Booking Status = "Approved"
Condition 2: Individual Passenger visa_status = "Approved"
```

**Rationale:**
- **Booking Approval**: Ensures the entire booking has been reviewed and approved by admin
- **Visa Approval**: Ensures individual passenger's visa application has been approved
- **Combined Check**: Guarantees only fully processed passengers are tracked

**Implementation:**
```javascript
// API filters bookings by status
const response = await fetch(
  `http://127.0.0.1:8000/api/bookings/?organization=${organizationId}&status=Approved`
);

// Code filters passengers by visa status
if (person.visa_status !== "Approved") {
  continue; // Skip this passenger
}
```

---

## 🚦 Status Logic & Flow

### **Complete Status Flow**
```
┌─────────────┐
│ In Pakistan │ 🇵🇰
└──────┬──────┘
       │ Departure DateTime reached
       ▼
┌─────────────┐
│  In Flight  │ ✈️
└──────┬──────┘
       │ Arrival DateTime reached
       ▼
┌─────────────┐
│ Entered KSA │ 🛬
└──────┬──────┘
       │ Transport sector analysis
       ▼
┌─────────────────────────────────┐
│ In Makkah / Madina / Jeddah     │ 🕋🕌🏙️
└──────┬──────────────────────────┘
       │ Return date approaching (≤2 days)
       ▼
┌─────────────┐
│Exit Pending │ ⏳
└──────┬──────┘
       │ Return DateTime reached
       ▼
┌─────────────┐
│ Exited KSA  │ ✅
└─────────────┘
```

---

## 📊 Detailed Status Definitions

### **1. In Pakistan** 🇵🇰

**Condition:**
```javascript
Current DateTime < Departure DateTime
```

**Properties:**
- **Status**: `"in_pakistan"`
- **Current City**: `"Pakistan"`
- **Last Updated**: `booking.updated_at`
- **Description**: Passenger is still in Pakistan, waiting for their flight

**Example:**
```
Current Time: 2024-12-25 10:00 AM
Departure: 2024-12-26 03:00 AM
→ Status: "in_pakistan"
```

---

### **2. In Flight** ✈️

**Condition:**
```javascript
Departure DateTime ≤ Current DateTime < Arrival DateTime
```

**Properties:**
- **Status**: `"in_flight"`
- **Current City**: `"In Flight to KSA"`
- **Last Updated**: `ticket.departure_date`
- **Description**: Passenger is currently on the flight to Saudi Arabia

**Logic Details:**
1. Parse departure time (e.g., "03:00 AM") and create full datetime
2. Parse arrival time and date
3. If no arrival time specified, assume 6-hour flight duration
4. Check if current time is between departure and arrival

**Example:**
```
Departure: 2024-12-26 03:00 AM
Arrival: 2024-12-26 09:00 AM
Current: 2024-12-26 06:00 AM
→ Status: "in_flight"
```

**Code Implementation:**
```javascript
// Create full datetime for departure
const [depHour, depMin] = departureTime.split(':').map(t => parseInt(t) || 0);
departureDatetime = new Date(departureDate);
departureDatetime.setHours(depHour, depMin, 0, 0);

// Create full datetime for arrival
const [arrHour, arrMin] = arrivalTime.split(':').map(t => parseInt(t) || 0);
arrivalDatetime = new Date(arrivalDate);
arrivalDatetime.setHours(arrHour, arrMin, 0, 0);

// Check if in flight
if (currentDate >= departureDatetime && currentDate < arrivalDatetime) {
  status = "in_flight";
}
```

---

### **3. Entered KSA** 🛬

**Condition:**
```javascript
Current DateTime ≥ Arrival DateTime AND no specific city identified
```

**Properties:**
- **Status**: `"entered_ksa"`
- **Current City**: `"KSA"`
- **Last Updated**: `ticket.arrival_date`
- **Description**: Passenger has landed in Saudi Arabia but specific city not yet determined

**Note:** This is a temporary status until transport sector analysis identifies the specific city.

---

### **4. In Makkah** 🕋

**Condition:**
```javascript
Arrival DateTime passed AND transport sector shows Makkah
```

**Properties:**
- **Status**: `"in_makkah"`
- **Current City**: `"Makkah"`
- **Last Updated**: `ticket.arrival_date`
- **Description**: Passenger is currently in Makkah

**Detection Logic:**
```javascript
const arrivalCity = sector.arrival_city?.toLowerCase() || "";
if (arrivalCity.includes("makkah") || arrivalCity.includes("mecca")) {
  status = "in_makkah";
  current_city = "Makkah";
}
```

---

### **5. In Madina** 🕌

**Condition:**
```javascript
Arrival DateTime passed AND transport sector shows Madina
```

**Properties:**
- **Status**: `"in_madina"`
- **Current City**: `"Madina"`
- **Last Updated**: `ticket.arrival_date`
- **Description**: Passenger is currently in Madina

**Detection Logic:**
```javascript
const arrivalCity = sector.arrival_city?.toLowerCase() || "";
if (arrivalCity.includes("madinah") || arrivalCity.includes("madina")) {
  status = "in_madina";
  current_city = "Madina";
}
```

---

### **6. In Jeddah** 🏙️

**Condition:**
```javascript
Arrival DateTime passed AND transport sector shows Jeddah
```

**Properties:**
- **Status**: `"in_jeddah"`
- **Current City**: `"Jeddah"`
- **Last Updated**: `ticket.arrival_date`
- **Description**: Passenger is currently in Jeddah

**Detection Logic:**
```javascript
const arrivalCity = sector.arrival_city?.toLowerCase() || "";
if (arrivalCity.includes("jeddah") || arrivalCity.includes("jed")) {
  status = "in_jeddah";
  current_city = "Jeddah";
}
```

---

### **7. Exit Pending** ⏳

**Condition:**
```javascript
Return Date is within 2 days
```

**Properties:**
- **Status**: `"exit_pending"`
- **Current City**: Current city (unchanged)
- **Last Updated**: Current city's last updated
- **Description**: Passenger's return date is approaching

**Calculation:**
```javascript
const daysUntilReturn = Math.ceil((returnDate - currentDate) / (1000 * 60 * 60 * 24));
if (daysUntilReturn <= 2 && daysUntilReturn >= 0) {
  status = "exit_pending";
}
```

**Example:**
```
Current Date: 2024-12-26
Return Date: 2024-12-28
Days Until Return: 2
→ Status: "exit_pending"
```

---

### **8. Exited KSA** ✅

**Condition:**
```javascript
Current DateTime ≥ Return DateTime
```

**Properties:**
- **Status**: `"exited_ksa"`
- **Current City**: `"Pakistan"`
- **Last Updated**: `ticket.return_date`
- **Verified Exit**: `true` (automatically set)
- **Description**: Passenger has returned to Pakistan

**Example:**
```
Current Time: 2024-12-29 10:00 AM
Return: 2024-12-28 11:00 PM
→ Status: "exited_ksa"
```

---

## 📡 Data Sources & API Integration

### **1. Bookings API**

**Endpoint:**
```
GET /api/bookings/?organization={organizationId}&status=Approved
```

**Headers:**
```javascript
{
  "Authorization": "Bearer {accessToken}",
  "Content-Type": "application/json"
}
```

**Response Structure:**
```json
[
  {
    "id": 123,
    "booking_number": "BK001",
    "status": "Approved",
    "agency": 456,
    "organization_name": "Saer.pk Corporation",
    "branch_name": "Lahore Branch",
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-15T14:30:00Z",
    "total_pax": 5,
    
    "person_details": [
      {
        "first_name": "Ahmed",
        "last_name": "Ali",
        "passport_number": "AB1234567",
        "visa_status": "Approved",
        "age_group": "Adult",
        "date_of_birth": "1990-01-15"
      }
    ],
    
    "ticket_details": [
      {
        "flight_number": "PK-740",
        "departure_airport": "Islamabad (ISB)",
        "arrival_airport": "Jeddah (JED)",
        "departure_date": "2024-12-20",
        "departure_time": "03:00 AM",
        "arrival_date": "2024-12-20",
        "arrival_time": "07:30 AM",
        "return_date": "2024-12-30",
        "return_time": "10:00 PM",
        "return_flight_number": "PK-741"
      }
    ],
    
    "transport_details": [
      {
        "vehicle_type_display": "Coaster",
        "sector_details": [
          {
            "departure_city": "Jeddah",
            "arrival_city": "Makkah",
            "is_airport_pickup": true,
            "is_airport_drop": false
          }
        ]
      }
    ],
    
    "hotel_details": [...],
    "food_details": [...],
    "ziyarat_details": [...]
  }
]
```

---

### **2. Agency API**

**Endpoint:**
```
GET /api/agencies/?organization_id={organizationId}&id={agencyId}
```

**Purpose:** Fetch agent name for display

**Response Structure:**
```json
{
  "results": [
    {
      "id": 456,
      "ageny_name": "Mubeen Abbas",
      "name": "Mubeen Abbas Travel Agency",
      "agency_code": "MBA001",
      "phone_number": "+92-300-1234567",
      "contacts": [...]
    }
  ]
}
```

**Caching Implementation:**
```javascript
const agencyCache = {};

const fetchAgencyData = async (agencyId) => {
  if (!agencyId) return null;
  if (agencyCache[agencyId]) return agencyCache[agencyId]; // Return cached
  
  // Fetch from API
  const agency = await fetch(...);
  agencyCache[agencyId] = agency; // Cache for reuse
  return agency;
};
```

---

## 🔄 Data Transformation

### **From Booking to Passenger Records**

**Input:** Booking object with person_details array  
**Output:** Individual passenger records

**Transformation Process:**

```javascript
for (const booking of bookings) {
  // Fetch agency data once per booking
  const agencyId = typeof booking.agency === 'object' 
    ? booking.agency.id 
    : booking.agency;
  const agencyData = await fetchAgencyData(agencyId);
  const agentName = agencyData?.ageny_name || agencyData?.name || "N/A";

  for (let index = 0; index < booking.person_details.length; index++) {
    const person = booking.person_details[index];
    
    // Filter: Only approved visa status
    if (person.visa_status !== "Approved") {
      continue;
    }

    // Extract flight information
    const flights = extractFlights(booking.ticket_details);

    // Determine status intelligently
    const { status, current_city, last_updated } = 
      determinePassengerStatus(booking, person);

    // Create passenger object
    transformedPassengers.push({
      id: `${booking.id}_${index}`,
      pax_id: `PAX${booking.booking_number}_${index + 1}`,
      name: `${person.first_name} ${person.last_name}`,
      passport_no: person.passport_number || "N/A",
      organization: booking.organization_name || "N/A",
      branch: booking.branch_name || "N/A",
      agent_id: agencyId,
      agent_name: agentName,
      booking_date: booking.created_at,
      booking_number: booking.booking_number,
      status: status,
      current_city: current_city,
      verified_exit: status === "exited_ksa",
      shirkat_reported: false,
      flights: flights,
      last_updated: last_updated,
      visa_status: person.visa_status,
      age_group: person.age_group || "Adult",
      date_of_birth: person.date_of_birth
    });
  }
}
```

---

## ✈️ Flight Detection Algorithm

### **Flight Data Extraction**

**Entry Flight:**
```javascript
if (ticket.departure_date) {
  flights.push({
    flight_no: ticket.flight_number || "N/A",
    departure_airport: ticket.departure_airport || "Pakistan",
    arrival_airport: ticket.arrival_airport || "Jeddah (JED)",
    departure_date: ticket.departure_date,
    departure_time: ticket.departure_time || "N/A",
    arrival_date: ticket.arrival_date || ticket.departure_date,
    arrival_time: ticket.arrival_time || "N/A",
    type: "entry"
  });
}
```

**Exit Flight:**
```javascript
if (ticket.return_date) {
  flights.push({
    flight_no: ticket.return_flight_number || "N/A",
    departure_airport: ticket.arrival_airport || "Jeddah (JED)", // Reversed
    arrival_airport: ticket.departure_airport || "Pakistan",     // Reversed
    departure_date: ticket.return_date,
    departure_time: ticket.return_time || "N/A",
    arrival_date: ticket.return_arrival_date || ticket.return_date,
    arrival_time: ticket.return_arrival_time || "N/A",
    type: "exit"
  });
}
```

---

### **DateTime Parsing Logic**

**Creating Full DateTime Objects:**

```javascript
// Parse departure time string
const departureTime = ticket?.departure_time || "00:00"; // e.g., "03:00 AM"
const [depHour, depMin] = departureTime.split(':').map(t => parseInt(t) || 0);

// Create full datetime
const departureDatetime = new Date(departureDate);
departureDatetime.setHours(depHour, depMin, 0, 0);

// Example:
// departureDate: "2024-12-26"
// departureTime: "03:00 AM"
// Result: 2024-12-26T03:00:00
```

**Handling Missing Arrival Time:**

```javascript
if (departureDate && ticket?.arrival_date) {
  // Use provided arrival date/time
  const arrivalDate = new Date(ticket.arrival_date);
  const [arrHour, arrMin] = arrivalTime.split(':').map(t => parseInt(t) || 0);
  arrivalDatetime = new Date(arrivalDate);
  arrivalDatetime.setHours(arrHour, arrMin, 0, 0);
} else if (departureDatetime) {
  // Assume 6-hour flight duration
  arrivalDatetime = new Date(departureDatetime.getTime() + (6 * 60 * 60 * 1000));
}
```

---

## 🚌 Transport Sector Analysis

### **Purpose**
Identify passenger's exact location in Saudi Arabia by analyzing transport sector details.

### **Data Structure**
```json
{
  "transport_details": [
    {
      "vehicle_type_display": "Coaster",
      "sector_details": [
        {
          "departure_city": "Jeddah",
          "arrival_city": "Makkah",
          "is_airport_pickup": true,
          "is_airport_drop": false
        },
        {
          "departure_city": "Makkah",
          "arrival_city": "Madina",
          "is_airport_pickup": false,
          "is_airport_drop": false
        }
      ]
    }
  ]
}
```

### **Analysis Algorithm**

```javascript
// Passenger is in KSA, check transport sectors to determine location
if (booking.transport_details && booking.transport_details.length > 0) {
  for (const transport of booking.transport_details) {
    if (transport.sector_details && transport.sector_details.length > 0) {
      const sectors = transport.sector_details;
      
      // Check each sector to find current location
      for (const sector of sectors) {
        const arrivalCity = sector.arrival_city?.toLowerCase() || "";
        
        if (arrivalCity.includes("makkah") || arrivalCity.includes("mecca")) {
          status = "in_makkah";
          current_city = "Makkah";
          break;
        } else if (arrivalCity.includes("madinah") || arrivalCity.includes("madina")) {
          status = "in_madina";
          current_city = "Madina";
          break;
        } else if (arrivalCity.includes("jeddah") || arrivalCity.includes("jed")) {
          status = "in_jeddah";
          current_city = "Jeddah";
          break;
        }
      }
      
      // If we found a specific city, break
      if (status !== "entered_ksa") {
        break;
      }
    }
  }
}
```

### **City Matching Rules**

| City | Matching Keywords |
|------|------------------|
| Makkah | "makkah", "mecca" |
| Madina | "madinah", "madina" |
| Jeddah | "jeddah", "jed" |

**Note:** Matching is case-insensitive

---

## 📈 Statistics & Reporting

### **Statistics Calculation**

```javascript
const getStatistics = () => {
  return {
    total: passengers.length,
    in_pakistan: passengers.filter(p => p.status === "in_pakistan").length,
    in_flight: passengers.filter(p => p.status === "in_flight").length,
    entered_ksa: passengers.filter(p => p.status === "entered_ksa").length,
    in_ksa: passengers.filter(p => p.status === "in_ksa").length,
    in_makkah: passengers.filter(p => p.status === "in_makkah").length,
    in_madina: passengers.filter(p => p.status === "in_madina").length,
    in_jeddah: passengers.filter(p => p.status === "in_jeddah").length,
    exit_pending: passengers.filter(p => p.status === "exit_pending").length,
    exited_ksa: passengers.filter(p => p.status === "exited_ksa").length,
    verified_exits: passengers.filter(p => p.verified_exit).length,
    shirkat_reported: passengers.filter(p => !p.shirkat_reported).length
  };
};
```

### **Dashboard Cards**

Each status has a visual card displaying:
- **Icon**: Emoji representing the status
- **Count**: Number of passengers in this status
- **Color**: Unique color for visual identification
- **Click Action**: Filter passengers by this status

---

## 🎨 UI Components

### **Status Badge Colors**

| Status | Color | Hex Code | Icon |
|--------|-------|----------|------|
| In Pakistan | Gray | #6c757d | 🇵🇰 |
| In Flight | Cyan | #17a2b8 | ✈️ |
| Entered KSA | Yellow | #ffc107 | 🛬 |
| In KSA | Light Blue | #0dcaf0 | 🕋 |
| In Makkah | Green | #198754 | 🕋 |
| In Madina | Teal | #20c997 | 🕌 |
| In Jeddah | Blue | #0d6efd | 🏙️ |
| Exit Pending | Orange | #fd7e14 | ⏳ |
| Exited KSA | Green | #198754 | ✅ |

### **Status Badge Component**

```javascript
const getStatusBadge = (status) => {
  const statusObj = statusOptions.find(s => s.value === status);
  if (!statusObj) return null;

  return (
    <Badge 
      style={{ 
        backgroundColor: statusObj.color,
        padding: "6px 12px",
        fontSize: "13px",
        fontWeight: 500
      }}
    >
      <span className="me-1">{statusObj.icon}</span>
      {statusObj.label}
    </Badge>
  );
};
```

---

## 🔍 Search & Filter Features

### **Search Query**
Searches across multiple fields:
- Passenger name
- Passport number
- Pax ID
- Agent name

**Implementation:**
```javascript
if (searchQuery) {
  const query = searchQuery.toLowerCase();
  filtered = filtered.filter(pax =>
    pax.name.toLowerCase().includes(query) ||
    pax.passport_no.toLowerCase().includes(query) ||
    pax.pax_id.toLowerCase().includes(query) ||
    pax.agent_name.toLowerCase().includes(query)
  );
}
```

### **Status Filter**
Filter by any status option from dropdown

```javascript
if (statusFilter !== "all") {
  filtered = filtered.filter(pax => pax.status === statusFilter);
}
```

### **City Filter**
Filter by current city location

```javascript
if (cityFilter !== "all") {
  filtered = filtered.filter(pax => pax.current_city === cityFilter);
}
```

### **Active Tab Filter**
Click on statistics cards to filter

```javascript
if (activeTab !== "all") {
  filtered = filtered.filter(pax => pax.status === activeTab);
}
```

---

## 🛡️ Error Handling

### **API Error Handling**

```javascript
const loadPassengers = async () => {
  setLoading(true);
  try {
    const response = await fetch(...);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.status}`);
    }
    
    const bookings = await response.json();
    // Process data...
    
  } catch (error) {
    console.error("Error loading passengers:", error);
    showAlert("danger", "Failed to load passenger data");
  } finally {
    setLoading(false);
  }
};
```

### **Alert System**

```javascript
const showAlert = (type, message) => {
  setAlert({ show: true, type, message });
  setTimeout(() => {
    setAlert({ show: false, type: "", message: "" });
  }, 5000); // Auto-hide after 5 seconds
};
```

### **Loading States**

```javascript
{loading ? (
  <div className="text-center py-5">
    <Spinner animation="border" variant="primary" />
    <p className="text-muted mt-3">Loading passenger data...</p>
  </div>
) : filteredPassengers.length === 0 ? (
  <div className="text-center py-5">
    <Users size={64} className="text-muted mb-3" />
    <h5 className="text-muted">No passengers found</h5>
    <p className="text-muted">Try adjusting your search or filter criteria</p>
  </div>
) : (
  // Display passengers table
)}
```

---

## 🚀 Performance Optimizations

### **1. Single API Call**
Fetches all approved bookings in one request instead of multiple calls

```javascript
// ✅ Good: Single call
const response = await fetch(
  `http://127.0.0.1:8000/api/bookings/?organization=${organizationId}&status=Approved`
);

// ❌ Bad: Multiple calls
for (const bookingId of bookingIds) {
  await fetch(`/api/bookings/${bookingId}`);
}
```

### **2. Agency Caching**
Reuses fetched agency data to avoid duplicate API calls

```javascript
const agencyCache = {};

const fetchAgencyData = async (agencyId) => {
  if (agencyCache[agencyId]) {
    return agencyCache[agencyId]; // Return from cache
  }
  
  const agency = await fetch(...);
  agencyCache[agencyId] = agency; // Store in cache
  return agency;
};
```

### **3. Client-side Filtering**
Fast filtering without additional API calls

```javascript
// All filtering happens on already-loaded data
const filterPassengers = () => {
  let filtered = [...passengers];
  
  if (activeTab !== "all") {
    filtered = filtered.filter(pax => pax.status === activeTab);
  }
  
  if (statusFilter !== "all") {
    filtered = filtered.filter(pax => pax.status === statusFilter);
  }
  
  // ... more filters
  
  setFilteredPassengers(filtered);
};
```

### **4. Efficient Loops**
Uses `for...of` with early breaks when city found

```javascript
for (const transport of booking.transport_details) {
  for (const sector of transport.sector_details) {
    if (arrivalCity.includes("makkah")) {
      status = "in_makkah";
      break; // Exit inner loop
    }
  }
  
  if (status !== "entered_ksa") {
    break; // Exit outer loop
  }
}
```

### **5. Memoization Opportunities**
Statistics are calculated on-demand, not on every render

```javascript
const stats = getStatistics(); // Called once per render
```

---

## 💻 Code Examples

### **Complete Status Determination Function**

```javascript
const determinePassengerStatus = (booking, person) => {
  const currentDate = new Date();
  let status = "in_pakistan";
  let current_city = "Pakistan";
  let last_updated = booking.updated_at || new Date().toISOString();

  // Get flight dates and times
  const ticket = booking.ticket_details?.[0];
  const departureDate = ticket?.departure_date ? new Date(ticket.departure_date) : null;
  const returnDate = ticket?.return_date ? new Date(ticket.return_date) : null;
  
  // Get departure and arrival times
  const departureTime = ticket?.departure_time || "00:00";
  const arrivalTime = ticket?.arrival_time || "23:59";
  
  // Create full datetime for departure and arrival
  let departureDatetime = null;
  let arrivalDatetime = null;
  
  if (departureDate) {
    const [depHour, depMin] = departureTime.split(':').map(t => parseInt(t) || 0);
    departureDatetime = new Date(departureDate);
    departureDatetime.setHours(depHour, depMin, 0, 0);
  }
  
  if (departureDate && ticket?.arrival_date) {
    const arrivalDate = new Date(ticket.arrival_date);
    const [arrHour, arrMin] = arrivalTime.split(':').map(t => parseInt(t) || 0);
    arrivalDatetime = new Date(arrivalDate);
    arrivalDatetime.setHours(arrHour, arrMin, 0, 0);
  } else if (departureDatetime) {
    // If no arrival date, assume arrival is 6 hours after departure
    arrivalDatetime = new Date(departureDatetime.getTime() + (6 * 60 * 60 * 1000));
  }

  // Check if passenger is in flight or has arrived
  if (departureDatetime && currentDate >= departureDatetime) {
    // Check if passenger is currently in flight
    if (arrivalDatetime && currentDate < arrivalDatetime) {
      status = "in_flight";
      current_city = "In Flight to KSA";
      last_updated = ticket.departure_date;
    } else {
      // Passenger has arrived in KSA
      status = "entered_ksa";
      current_city = "KSA";
      last_updated = ticket.arrival_date || ticket.departure_date;

      // Check if passenger has returned to Pakistan
      if (returnDate && currentDate >= returnDate) {
        status = "exited_ksa";
        current_city = "Pakistan";
        last_updated = ticket.return_date;
      } else {
        // Passenger is in KSA, check transport sectors
        if (booking.transport_details && booking.transport_details.length > 0) {
          for (const transport of booking.transport_details) {
            if (transport.sector_details && transport.sector_details.length > 0) {
              const sectors = transport.sector_details;

              for (const sector of sectors) {
                const arrivalCity = sector.arrival_city?.toLowerCase() || "";

                if (arrivalCity.includes("makkah") || arrivalCity.includes("mecca")) {
                  status = "in_makkah";
                  current_city = "Makkah";
                  break;
                } else if (arrivalCity.includes("madinah") || arrivalCity.includes("madina")) {
                  status = "in_madina";
                  current_city = "Madina";
                  break;
                } else if (arrivalCity.includes("jeddah") || arrivalCity.includes("jed")) {
                  status = "in_jeddah";
                  current_city = "Jeddah";
                  break;
                }
              }

              if (status !== "entered_ksa") {
                break;
              }
            }
          }
        }

        // Check if return date is approaching (exit pending)
        if (returnDate) {
          const daysUntilReturn = Math.ceil((returnDate - currentDate) / (1000 * 60 * 60 * 24));
          if (daysUntilReturn <= 2 && daysUntilReturn >= 0) {
            status = "exit_pending";
          }
        }
      }
    }
  }

  return { status, current_city, last_updated };
};
```

---

## 📝 Key Technical Decisions

### **1. Time-based Detection**
Uses full datetime comparison (not just dates) for accurate flight status

**Rationale:** Flights can depart and arrive on the same date, so time comparison is essential

### **2. Transport Sector Priority**
Checks transport sectors to identify exact city in KSA

**Rationale:** Transport bookings contain the most accurate information about passenger movements

### **3. Agency Caching**
Prevents duplicate API calls for same agency

**Rationale:** Multiple passengers from same agency don't need repeated API calls

### **4. Automatic Exit Verification**
Sets `verified_exit = true` when status is "exited_ksa"

**Rationale:** If return date has passed, exit is automatically verified

### **5. 6-Hour Default**
Assumes 6-hour flight if arrival time not specified

**Rationale:** Average flight time from Pakistan to Saudi Arabia is 5-7 hours

### **6. Case-insensitive City Matching**
Handles "Makkah", "makkah", "Mecca", etc.

**Rationale:** Different data sources may use different spellings

---

## 🔧 Configuration

### **Status Options Configuration**

```javascript
const statusOptions = [
  { value: "in_pakistan", label: "In Pakistan", color: "#6c757d", icon: "🇵🇰" },
  { value: "in_flight", label: "In Flight", color: "#17a2b8", icon: "✈️" },
  { value: "entered_ksa", label: "Entered KSA", color: "#ffc107", icon: "🛬" },
  { value: "in_ksa", label: "In KSA", color: "#0dcaf0", icon: "🕋" },
  { value: "in_makkah", label: "In Makkah", color: "#198754", icon: "🕋" },
  { value: "in_madina", label: "In Madina", color: "#20c997", icon: "🕌" },
  { value: "in_jeddah", label: "In Jeddah", color: "#0d6efd", icon: "🏙️" },
  { value: "exit_pending", label: "Exit Pending", color: "#fd7e14", icon: "⏳" },
  { value: "exited_ksa", label: "Exited KSA", color: "#198754", icon: "✅" },
];
```

### **API Endpoints Configuration**

```javascript
const API_BASE_URL = "http://127.0.0.1:8000/api";

const ENDPOINTS = {
  bookings: `${API_BASE_URL}/bookings/`,
  agencies: `${API_BASE_URL}/agencies/`,
};
```

### **Exit Pending Threshold**

```javascript
const EXIT_PENDING_DAYS = 2; // Days before return date

if (daysUntilReturn <= EXIT_PENDING_DAYS && daysUntilReturn >= 0) {
  status = "exit_pending";
}
```

### **Default Flight Duration**

```javascript
const DEFAULT_FLIGHT_HOURS = 6; // Hours

arrivalDatetime = new Date(
  departureDatetime.getTime() + (DEFAULT_FLIGHT_HOURS * 60 * 60 * 1000)
);
```

---

## 🧪 Testing Scenarios

### **Scenario 1: Passenger in Pakistan**
```
Input:
- Current Date: 2024-12-25
- Departure Date: 2024-12-26 03:00 AM

Expected Output:
- Status: "in_pakistan"
- City: "Pakistan"
```

### **Scenario 2: Passenger in Flight**
```
Input:
- Current Date: 2024-12-26 06:00 AM
- Departure: 2024-12-26 03:00 AM
- Arrival: 2024-12-26 09:00 AM

Expected Output:
- Status: "in_flight"
- City: "In Flight to KSA"
```

### **Scenario 3: Passenger in Makkah**
```
Input:
- Current Date: 2024-12-26 12:00 PM
- Arrival: 2024-12-26 09:00 AM
- Transport Sector: arrival_city = "Makkah"

Expected Output:
- Status: "in_makkah"
- City: "Makkah"
```

### **Scenario 4: Exit Pending**
```
Input:
- Current Date: 2024-12-28
- Return Date: 2024-12-30
- Days Until Return: 2

Expected Output:
- Status: "exit_pending"
- City: Current city (unchanged)
```

### **Scenario 5: Exited KSA**
```
Input:
- Current Date: 2024-12-31
- Return Date: 2024-12-30 11:00 PM

Expected Output:
- Status: "exited_ksa"
- City: "Pakistan"
- Verified Exit: true
```

---

## 📊 Database Schema Reference

### **Booking Model**
```
- id (integer)
- booking_number (string)
- status (string): "Approved", "Un-approved", etc.
- agency (foreign key)
- organization (foreign key)
- organization_name (string)
- branch_name (string)
- created_at (datetime)
- updated_at (datetime)
- total_pax (integer)
```

### **Person Details (JSON field in Booking)**
```
- first_name (string)
- last_name (string)
- passport_number (string)
- visa_status (string): "Approved", "Pending", "Rejected"
- age_group (string): "Adult", "Child", "Infant"
- date_of_birth (date)
```

### **Ticket Details (JSON field in Booking)**
```
- flight_number (string)
- departure_airport (string)
- arrival_airport (string)
- departure_date (date)
- departure_time (string)
- arrival_date (date)
- arrival_time (string)
- return_date (date)
- return_time (string)
- return_flight_number (string)
```

### **Transport Details (JSON field in Booking)**
```
- vehicle_type_display (string)
- sector_details (array):
  - departure_city (string)
  - arrival_city (string)
  - is_airport_pickup (boolean)
  - is_airport_drop (boolean)
```

---

## 🔐 Security Considerations

### **Authentication**
All API calls require Bearer token authentication:

```javascript
headers: {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
}
```

### **Organization Filtering**
Data is filtered by organization ID to ensure users only see their own data:

```javascript
const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
const organizationId = orgData?.id;
```

### **Input Validation**
- Passport numbers are validated
- Dates are parsed safely
- API responses are checked before processing

---

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 992px
- **Desktop**: > 992px

### **Responsive Features**
- Statistics cards stack vertically on mobile
- Table scrolls horizontally on small screens
- Search and filters adapt to screen size
- Sidebar collapses on mobile

---

## 🎯 Future Enhancements

### **Potential Features**
1. **Real-time Updates**: WebSocket integration for live status updates
2. **Notifications**: Email/SMS alerts for status changes
3. **Export**: Export passenger data to Excel/PDF
4. **Historical Data**: View passenger movement history
5. **Analytics**: Charts and graphs for passenger trends
6. **Mobile App**: Native mobile application
7. **Geolocation**: GPS tracking integration
8. **Multi-language**: Support for Arabic and Urdu

---

## 📞 Support & Maintenance

### **Common Issues**

**Issue 1: Passengers not showing**
- Check booking status is "Approved"
- Verify visa_status is "Approved"
- Check organization filter

**Issue 2: Wrong status displayed**
- Verify flight dates and times are correct
- Check transport sector data
- Ensure system time is accurate

**Issue 3: Agent name not showing**
- Check agency API is accessible
- Verify agency ID in booking
- Check agency data structure

---

## 📚 Glossary

| Term | Definition |
|------|------------|
| **Pax** | Passenger |
| **KSA** | Kingdom of Saudi Arabia |
| **Umrah** | Islamic pilgrimage to Mecca |
| **Hajj** | Annual Islamic pilgrimage to Mecca |
| **Shirkat** | Company/Organization reporting |
| **Ziyarat** | Religious site visits |
| **Sector** | Transport route segment |

---

## 📄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-26 | Initial implementation with basic tracking |
| 1.1.0 | 2024-12-26 | Added "In Flight" status detection |
| 1.2.0 | 2024-12-26 | Enhanced transport sector analysis |
| 1.3.0 | 2024-12-26 | Added agent name fetching and caching |

---

## 📝 Summary

The **Pax Movement Tracking System** provides automated, intelligent passenger tracking by:

✅ **Filtering** only fully approved passengers (booking + visa)  
⏰ **Using** real-time date/time comparisons for accurate status  
🗺️ **Analyzing** transport sectors for precise location identification  
📊 **Providing** visual statistics dashboard with real-time counts  
🔄 **Auto-updating** status based on journey progress  
👤 **Displaying** proper agent names from agency data  
🚀 **Optimizing** performance with caching and efficient algorithms  

**Result:** Complete visibility of passenger movements from Pakistan → KSA → Pakistan with minimal manual intervention!

---

## 📧 Contact Information

For technical support or questions about this system, please contact:
- **Development Team**: dev@saer.pk
- **Technical Lead**: [Your Name]
- **Documentation**: This file

---

**Document Version**: 1.0  
**Last Updated**: December 26, 2024  
**Author**: Development Team  
**Status**: Active

---

*End of Documentation*
