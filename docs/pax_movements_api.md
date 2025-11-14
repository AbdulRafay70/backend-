# Passenger Movement & Travel Management API Documentation

## Overview
This module provides comprehensive tracking and management for passenger movements, airport transfers, city transport, ziyarat schedules, and food services for Umrah/Hajj pilgrims.

---

## 📍 API Endpoints Summary

### 1️⃣ Pax Movement Tracking
- **GET** `/api/pax-movement/` - List all passenger movements
- **GET** `/api/pax-movement/{id}/` - Get specific passenger movement
- **POST** `/api/pax-movement/` - Create new passenger movement
- **PUT** `/api/pax-movement/{id}/` - Update passenger movement
- **GET** `/api/pax-movement/{id}/status/` - Get movement status
- **PUT** `/api/pax-movement/{id}/update/` - Update movement status
- **GET** `/api/pax-movement/summary/` - Get summary statistics
- **POST** `/api/pax-movement/{id}/verify-exit/` - Verify passenger exit
- **POST** `/api/pax-movement/{id}/notify-agent/` - Send notification to agent

### 2️⃣ Airport Transfer Management
- **GET** `/api/daily/airport/` - List all airport transfers
- **GET** `/api/daily/airport/daily/?date=2025-10-17` - Get daily airport transfers
- **PUT** `/api/daily/airport/update/` - Update pax status in transfer

### 3️⃣ Transport Management
- **GET** `/api/daily/transport/` - List all transports
- **GET** `/api/daily/transport/daily/?date=2025-10-17` - Get daily transports
- **PUT** `/api/daily/transport/update/` - Update pax status in transport

### 4️⃣ Ziyarat Management
- **GET** `/api/daily/ziyarats/` - List all ziyarats
- **GET** `/api/daily/ziyarats/daily/?date=2025-10-17` - Get daily ziyarats
- **PUT** `/api/daily/ziyarats/update/` - Update pax status in ziyarat

### 5️⃣ Food Service Management
- **GET** `/api/daily/food/` - List all food services
- **GET** `/api/daily/food/daily/?date=2025-10-17` - Get daily meals
- **PUT** `/api/daily/food/update/` - Update pax status in food service

### 6️⃣ Pax Full Details
- **GET** `/api/pax/details/{pax_id}/` - Get complete passenger details across all modules

---

## 📖 Detailed API Documentation

### 1️⃣ Pax Movement Tracking

#### GET /api/pax-movement/summary/
Get summary statistics of all passenger movements.

**Response:**
```json
{
  "total_pax": 150,
  "in_pakistan": 30,
  "entered_ksa": 20,
  "in_ksa": 80,
  "exited_ksa": 20,
  "verified_exits": 15,
  "not_verified_exits": 5,
  "by_city": {
    "Makkah": 50,
    "Madinah": 25,
    "Jeddah": 5
  }
}
```

#### POST /api/pax-movement/{id}/verify-exit/
Verify passenger exit from KSA.

**Request:**
```json
{
  "exit_verification": "verified",
  "remarks": "Exit verified via immigration system"
}
```

**Response:**
```json
{
  "message": "Exit verification updated successfully",
  "data": {
    "pax_id": "PAX00010001",
    "status": "exited_ksa",
    "exit_verification": "verified",
    "verified_by": 35,
    "verified_at": "2025-11-01T10:30:00Z"
  }
}
```

---

### 2️⃣ Airport Transfer Management

#### GET /api/daily/airport/daily/?date=2025-10-17
Get all airport transfers for a specific date.

**Response:**
```json
{
  "date": "2025-10-17",
  "airport_transfers": [
    {
      "booking_id": "BKG-101",
      "transfer_type": "pickup",
      "flight_number": "SV802",
      "flight_time": "15:30",
      "pickup_point": "Jeddah Airport",
      "drop_point": "Makkah Hotel",
      "status": "waiting",
      "pax_list": [
        {
          "pax_id": "PAX00010001",
          "first_name": "Ali",
          "last_name": "Raza",
          "contact_no": "+923000709017"
        }
      ]
    }
  ]
}
```

#### PUT /api/daily/airport/update/
Update individual passenger status in airport transfer.

**Request:**
```json
{
  "booking_id": "BKG-101",
  "pax_id": "PAX00010001",
  "status": "arrived",
  "updated_by": 35
}
```

**Response:**
```json
{
  "message": "Status updated successfully",
  "pax_id": "PAX00010001",
  "new_status": "arrived"
}
```

---

### 3️⃣ Transport Management

#### GET /api/daily/transport/daily/?date=2025-10-17
Get all transports for a specific date.

**Response:**
```json
{
  "date": "2025-10-17",
  "transports": [
    {
      "booking_id": "BKG-101",
      "pickup": "Makkah Hotel",
      "drop": "Madinah Hotel",
      "vehicle": "Hiace",
      "driver_name": "Abdullah",
      "status": "pending",
      "pax_list": [
        {
          "pax_id": "PAX00010001",
          "first_name": "Ali",
          "last_name": "Raza",
          "contact_no": "+923000709017"
        }
      ]
    }
  ]
}
```

#### PUT /api/daily/transport/update/
Update individual passenger status in transport.

**Request:**
```json
{
  "booking_id": "BKG-101",
  "pax_id": "PAX00010001",
  "status": "departed",
  "updated_by": 35
}
```

**Response:**
```json
{
  "message": "Status updated successfully",
  "pax_id": "PAX00010001",
  "new_status": "departed"
}
```

---

### 4️⃣ Ziyarat Management

#### GET /api/daily/ziyarats/daily/?date=2025-10-17
Get all ziyarats for a specific date.

**Response:**
```json
{
  "date": "2025-10-17",
  "ziyarats": [
    {
      "booking_id": "BKG-101",
      "location": "Uhud Mountain",
      "pickup_time": "08:00 AM",
      "status": "pending",
      "pax_list": [
        {
          "pax_id": "PAX00010001",
          "first_name": "Ali",
          "last_name": "Raza",
          "contact_no": "+923000709017"
        }
      ]
    }
  ]
}
```

#### PUT /api/daily/ziyarats/update/
Update individual passenger status in ziyarat.

**Request:**
```json
{
  "booking_id": "BKG-101",
  "pax_id": "PAX00010001",
  "status": "completed",
  "updated_by": 35
}
```

**Response:**
```json
{
  "message": "Status updated successfully",
  "pax_id": "PAX00010001",
  "new_status": "completed"
}
```

---

### 5️⃣ Food Service Management

#### GET /api/daily/food/daily/?date=2025-10-17
Get all meals for a specific date.

**Response:**
```json
{
  "date": "2025-10-17",
  "meals": [
    {
      "booking_id": "BKG-101",
      "meal_type": "Dinner",
      "time": "08:00 PM",
      "menu": "Biryani + Raita",
      "location": "Makkah Hotel",
      "status": "pending",
      "pax_list": [
        {
          "pax_id": "PAX00010001",
          "first_name": "Ali",
          "last_name": "Raza",
          "contact_no": "+923000709017"
        }
      ]
    }
  ]
}
```

#### PUT /api/daily/food/update/
Update individual passenger status in food service.

**Request:**
```json
{
  "booking_id": "BKG-101",
  "pax_id": "PAX00010001",
  "status": "served",
  "updated_by": 35
}
```

**Response:**
```json
{
  "message": "Status updated successfully",
  "pax_id": "PAX00010001",
  "new_status": "served"
}
```

---

### 6️⃣ Pax Full Details

#### GET /api/pax/details/{pax_id}/
Get complete passenger details across all modules.

**Response:**
```json
{
  "pax_id": "PAX00010001",
  "first_name": "Ali",
  "last_name": "Raza",
  "passport_no": "AB123456",
  "booking_id": "BKG-101",
  "movement_status": "in_ksa",
  "current_city": "Makkah",
  "flight": {
    "departure": "LHE",
    "arrival": "JED",
    "flight_time_to_ksa": "2025-10-17T15:30:00",
    "flight_number_to_ksa": "SV802",
    "flight_time_from_ksa": "2025-10-25T10:00:00",
    "flight_number_from_ksa": "SV803"
  },
  "hotel": [
    {
      "name": "Hilton Makkah",
      "check_in": "2025-10-17",
      "check_out": "2025-10-20",
      "room_type": "double",
      "status": "active"
    }
  ],
  "transport": [
    {
      "pickup": "Airport",
      "drop": "Hotel",
      "scheduled_date": "2025-10-17",
      "status": "completed"
    }
  ],
  "ziyarats": [
    {
      "location": "Uhud Mountain",
      "scheduled_date": "2025-10-18",
      "pickup_time": "08:00",
      "status": "completed"
    }
  ],
  "food": [
    {
      "meal_type": "Dinner",
      "service_date": "2025-10-17",
      "service_time": "20:00",
      "menu": "Biryani + Raita",
      "status": "served"
    }
  ]
}
```

---

## 🔧 Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Status Values

### Pax Movement Status
- `in_pakistan` - Passenger is in Pakistan
- `entered_ksa` - Passenger entered KSA
- `in_ksa` - Passenger is in KSA
- `exited_ksa` - Passenger exited KSA

### Exit Verification
- `pending` - Verification pending
- `verified` - Exit verified
- `not_verified` - Exit not verified

### Transfer/Transport/Ziyarat Status
- `pending` - Scheduled but not started
- `waiting` - Waiting for pickup/departure
- `departed` - Departed from pickup point
- `arrived` - Arrived at destination
- `started` - Activity started
- `completed` - Activity completed
- `cancelled` - Activity cancelled
- `not_picked` - Passenger not picked up

### Food Service Status
- `pending` - Meal not served yet
- `served` - Meal served
- `cancelled` - Meal cancelled

---

## 🚀 Auto-Generated Features

### PaxMovement Auto-Creation
When a booking is created or payment status changes to "paid", the system automatically:
1. Creates a `PaxMovement` record for each passenger
2. Assigns a unique PAX ID (format: `PAX{booking_id}{person_id}`)
3. Sets initial status to `in_pakistan`

### Signal Triggers
- **Booking Created/Paid**: Auto-generates PaxMovement for all passengers
- **New Person Added to Paid Booking**: Auto-generates PaxMovement for that person

---

## 📊 Database Models

### Core Models:
1. **PaxMovement** - Main tracking table for passenger lifecycle
2. **AirportTransfer** - Airport pickup/drop management
3. **AirportTransferPax** - Individual pax status in airport transfers
4. **Transport** - City-to-city transport management
5. **TransportPax** - Individual pax status in transports
6. **Ziyarat** - Ziyarat schedule management
7. **ZiyaratPax** - Individual pax status in ziyarats
8. **FoodService** - Meal service management
9. **FoodServicePax** - Individual pax status in food services

---

## 📝 Usage Examples

### Example 1: Track passenger movement
```bash
# Get summary
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/pax-movement/summary/

# Update passenger status
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_ksa", "current_city": 19}' \
  http://localhost:8000/api/pax-movement/1/update/
```

### Example 2: Get daily airport transfers
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/daily/airport/daily/?date=2025-10-17"
```

### Example 3: Update pax status in transport
```bash
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "BKG-101",
    "pax_id": "PAX00010001",
    "status": "arrived",
    "updated_by": 35
  }' \
  http://localhost:8000/api/daily/transport/update/
```

---

## ✅ Implementation Status

- ✅ Models created and migrated
- ✅ Serializers implemented
- ✅ ViewSets and endpoints configured
- ✅ Admin interface configured
- ✅ Auto-generation signals implemented
- ✅ URL routing configured
- ✅ Authentication integrated

---

## 🔜 Next Steps

1. Test all endpoints with actual data
2. Implement notification system (email/SMS)
3. Add real-time dashboard for monitoring
4. Create reports and analytics
5. Integrate with external immigration APIs for exit verification
