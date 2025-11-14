# 🏨 Operations Module - API Documentation

## Overview
Comprehensive operations management system for Saer.pk backend covering daily hotel, transport, food, airport, and ziyarat operations with real-time tracking and status management.

## Module Components

### 1️⃣ **Room Map Management**
Master data for hotel room inventory and allocation.

### 2️⃣ **Hotel Operations**
Daily check-in/check-out tracking with room assignments.

### 3️⃣ **Transport Operations**
Vehicle pickup/drop scheduling and tracking.

### 4️⃣ **Food Operations**
Meal service management (breakfast, lunch, dinner).

### 5️⃣ **Airport Operations**
Airport pickup/drop transfer management.

### 6️⃣ **Ziyarat Operations**
Religious site visit scheduling and tracking.

### 7️⃣ **Passenger Details**
Centralized passenger information access.

---

## API Endpoints

### 🏨 Room Map API

**Base URL:** `/api/operations/room-map/`

#### Endpoints:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operations/room-map/` | List all room maps |
| POST | `/api/operations/room-map/` | Create new room map |
| GET | `/api/operations/room-map/{id}/` | Get room details |
| PUT/PATCH | `/api/operations/room-map/{id}/` | Update room map |
| DELETE | `/api/operations/room-map/{id}/` | Delete room map |
| GET | `/api/operations/room-map/availability/` | Get room availability by hotel/date |
| POST | `/api/operations/room-map/assign-room/` | Assign passenger to room/bed |
| GET | `/api/operations/room-map/by-hotel/` | List rooms by hotel |
| GET | `/api/operations/room-map/available/` | List available rooms |
| POST | `/api/operations/room-map/{id}/mark-occupied/` | Mark room as occupied |
| POST | `/api/operations/room-map/{id}/mark-available/` | Mark room as available |

**Query Parameters:**
- `hotel_id` - Filter by hotel ID
- `floor_no` - Filter by floor number
- `availability_status` - Filter by status (available, occupied, cleaning_pending, maintenance, reserved, blocked)

**Example:**
```bash
GET /api/operations/room-map/?hotel_id=5&availability_status=available
GET /api/operations/room-map/availability/?hotel_id=5&date_from=2025-11-01&date_to=2025-11-30&organization=1
```

---

### 🛏️ Hotel Operations API

**Base URL:** `/api/operations/daily/hotels/`

#### Endpoints:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operations/daily/hotels/` | List hotel operations (grouped by date) |
| POST | `/api/operations/daily/hotels/` | Create hotel operation |
| GET | `/api/operations/daily/hotels/{id}/` | Get operation details |
| PUT/PATCH | `/api/operations/daily/hotels/{id}/` | Update operation |
| DELETE | `/api/operations/daily/hotels/{id}/` | Delete operation |
| PUT | `/api/operations/daily/hotels/update-status/` | Update status for specific pax |
| POST | `/api/operations/daily/hotels/bulk-create/` | Create operations for all pax in booking |
| GET | `/api/operations/daily/hotels/by-booking/` | List by booking ID |
| GET | `/api/operations/daily/hotels/pending/` | List pending operations |
| GET | `/api/operations/daily/hotels/statistics/` | Get operation statistics |
| POST | `/api/operations/daily/hotels/{id}/mark-checked-in/` | Mark as checked in |
| POST | `/api/operations/daily/hotels/{id}/mark-checked-out/` | Mark as checked out |

**Query Parameters:**
- `date` - Filter by operation date (YYYY-MM-DD)
- `type` - Filter by type (checkin, checkout)
- `hotel_id` - Filter by hotel ID
- `city` - Filter by city (Makkah, Madinah)
- `status` - Filter by status (pending, checked_in, checked_out, canceled)
- `check_in_date` - Filter by check-in date
- `check_out_date` - Filter by check-out date

**Example:**
```bash
GET /api/operations/daily/hotels/?date=2025-11-02&type=checkin&city=Makkah
PUT /api/operations/daily/hotels/update-status/
{
  "booking_id": "BK123",
  "pax_id": 456,
  "status": "checked_in"
}
```

---

### 🚌 Transport Operations API

**Base URL:** `/api/operations/daily/transport/`

#### Endpoints:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operations/daily/transport/` | List transport operations |
| POST | `/api/operations/daily/transport/` | Create transport operation |
| GET | `/api/operations/daily/transport/{id}/` | Get operation details |
| PUT/PATCH | `/api/operations/daily/transport/{id}/` | Update operation |
| DELETE | `/api/operations/daily/transport/{id}/` | Delete operation |
| GET | `/api/operations/daily/transport/today/` | Today's operations (grouped) |
| PUT | `/api/operations/daily/transport/update-status/` | Update operation status |
| POST | `/api/operations/daily/transport/bulk-create/` | Bulk create for booking |
| GET | `/api/operations/daily/transport/by-booking/` | List by booking |
| GET | `/api/operations/daily/transport/by-vehicle/` | List by vehicle |
| GET | `/api/operations/daily/transport/pending/` | List pending operations |
| POST | `/api/operations/daily/transport/{id}/mark-departed/` | Mark as departed |
| POST | `/api/operations/daily/transport/{id}/mark-arrived/` | Mark as arrived |

**Query Parameters:**
- `date` - Filter by date (YYYY-MM-DD)
- `status` - Filter by status (pending, departed, arrived, canceled)
- `vehicle_id` - Filter by vehicle ID
- `pickup_location` - Filter by pickup location
- `drop_location` - Filter by drop location

**Example:**
```bash
GET /api/operations/daily/transport/?date=2025-11-02&status=pending
GET /api/operations/daily/transport/by-vehicle/?vehicle_id=10
```

---

### 🍽️ Food Operations API

**Base URL:** `/api/operations/daily/food/`

#### Endpoints:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operations/daily/food/` | List food operations |
| POST | `/api/operations/daily/food/` | Create food operation |
| GET | `/api/operations/daily/food/{id}/` | Get operation details |
| PUT/PATCH | `/api/operations/daily/food/{id}/` | Update operation |
| DELETE | `/api/operations/daily/food/{id}/` | Delete operation |
| GET | `/api/operations/daily/food/today/` | Today's operations (grouped) |
| PUT | `/api/operations/daily/food/update-status/` | Update operation status |
| POST | `/api/operations/daily/food/bulk-create/` | Bulk create for booking |
| GET | `/api/operations/daily/food/by-booking/` | List by booking |
| GET | `/api/operations/daily/food/by-meal-type/` | List by meal type |
| GET | `/api/operations/daily/food/pending/` | List pending operations |
| POST | `/api/operations/daily/food/{id}/mark-served/` | Mark as served |
| POST | `/api/operations/daily/food/{id}/mark-not-served/` | Mark as not served |

**Query Parameters:**
- `date` - Filter by date (YYYY-MM-DD)
- `status` - Filter by status (pending, served, not_served, canceled)
- `meal_type` - Filter by meal type (breakfast, lunch, dinner, snack)

**Example:**
```bash
GET /api/operations/daily/food/?date=2025-11-02&meal_type=breakfast
GET /api/operations/daily/food/by-meal-type/?meal_type=dinner
```

---

### ✈️ Airport Operations API

**Base URL:** `/api/operations/daily/airport/`

#### Endpoints:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operations/daily/airport/` | List airport operations |
| POST | `/api/operations/daily/airport/` | Create airport operation |
| GET | `/api/operations/daily/airport/{id}/` | Get operation details |
| PUT/PATCH | `/api/operations/daily/airport/{id}/` | Update operation |
| DELETE | `/api/operations/daily/airport/{id}/` | Delete operation |
| GET | `/api/operations/daily/airport/today/` | Today's operations (grouped) |
| PUT | `/api/operations/daily/airport/update-status/` | Update operation status |
| POST | `/api/operations/daily/airport/bulk-create/` | Bulk create for booking |
| GET | `/api/operations/daily/airport/by-booking/` | List by booking |
| GET | `/api/operations/daily/airport/by-transfer-type/` | List by transfer type |
| GET | `/api/operations/daily/airport/waiting/` | List waiting operations |
| POST | `/api/operations/daily/airport/{id}/mark-picked-up/` | Mark as picked up |
| POST | `/api/operations/daily/airport/{id}/mark-dropped/` | Mark as dropped |

**Query Parameters:**
- `date` - Filter by date (YYYY-MM-DD)
- `status` - Filter by status (waiting, picked_up, dropped, canceled)
- `transfer_type` - Filter by transfer type (pickup, drop)
- `airport` - Filter by airport name

**Example:**
```bash
GET /api/operations/daily/airport/?date=2025-11-02&transfer_type=pickup
GET /api/operations/daily/airport/waiting/
```

---

### 🕌 Ziyarat Operations API

**Base URL:** `/api/operations/daily/ziyarats/`

#### Endpoints:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operations/daily/ziyarats/` | List ziyarat operations |
| POST | `/api/operations/daily/ziyarats/` | Create ziyarat operation |
| GET | `/api/operations/daily/ziyarats/{id}/` | Get operation details |
| PUT/PATCH | `/api/operations/daily/ziyarats/{id}/` | Update operation |
| DELETE | `/api/operations/daily/ziyarats/{id}/` | Delete operation |
| GET | `/api/operations/daily/ziyarats/today/` | Today's operations (grouped) |
| PUT | `/api/operations/daily/ziyarats/update-status/` | Update operation status |
| POST | `/api/operations/daily/ziyarats/bulk-create/` | Bulk create for booking |
| GET | `/api/operations/daily/ziyarats/by-booking/` | List by booking |
| GET | `/api/operations/daily/ziyarats/by-location/` | List by location |
| GET | `/api/operations/daily/ziyarats/pending/` | List pending operations |
| POST | `/api/operations/daily/ziyarats/{id}/mark-started/` | Mark as started |
| POST | `/api/operations/daily/ziyarats/{id}/mark-completed/` | Mark as completed |
| POST | `/api/operations/daily/ziyarats/{id}/mark-not-picked/` | Mark as not picked |

**Query Parameters:**
- `date` - Filter by date (YYYY-MM-DD)
- `status` - Filter by status (pending, started, completed, not_picked, canceled)
- `location` - Filter by ziyarat location
- `city` - Filter by city (Makkah, Madinah)

**Example:**
```bash
GET /api/operations/daily/ziyarats/?date=2025-11-02&city=Makkah
GET /api/operations/daily/ziyarats/by-location/?location=Mount%20Uhud
```

---

### 👤 Passenger Details API

**Base URL:** `/api/operations/pax/`

#### Endpoints:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operations/pax/` | List all passengers |
| GET | `/api/operations/pax/{id}/` | Get passenger details with all operations |
| GET | `/api/operations/pax/{id}/details/` | Get full passenger details |

**Query Parameters:**
- `booking_id` - Filter by booking ID

**Example:**
```bash
GET /api/operations/pax/{pax_id}/details/?date=2025-11-02
```

---

## Status Values

### Hotel Operations
- `pending` - Not yet checked in
- `checked_in` - Checked in
- `checked_out` - Checked out
- `canceled` - Operation canceled

### Transport Operations
- `pending` - Awaiting departure
- `departed` - Vehicle departed
- `arrived` - Vehicle arrived
- `canceled` - Operation canceled

### Food Operations
- `pending` - Not yet served
- `served` - Meal served
- `not_served` - Meal not served
- `canceled` - Operation canceled

### Airport Operations
- `waiting` - Waiting for pickup/drop
- `picked_up` - Passenger picked up
- `dropped` - Passenger dropped
- `canceled` - Operation canceled

### Ziyarat Operations
- `pending` - Not yet started
- `started` - Ziyarat started
- `completed` - Ziyarat completed
- `not_picked` - Passenger not picked
- `canceled` - Operation canceled

---

## Common Features

### ✅ Authentication
All endpoints require JWT authentication:
```bash
Authorization: Bearer <your_jwt_token>
```

### ✅ Date Filtering
Most endpoints support date filtering:
```
?date=YYYY-MM-DD
?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```

### ✅ Bulk Operations
Create operations for all passengers in a booking:
```json
POST /api/operations/daily/hotels/bulk-create/
{
  "booking_id": 123,
  "check_in_date": "2025-11-05",
  "check_out_date": "2025-11-10",
  "hotel_id": 5,
  "city": "Makkah"
}
```

### ✅ Status Updates
Update operation status:
```json
PUT /api/operations/daily/hotels/update-status/
{
  "booking_id": "BK123",
  "pax_id": 456,
  "status": "checked_in"
}
```

---

## Django Admin Panel

Access at: `http://your-domain/admin/operations/`

### Available Models:
1. **Room Map** - Manage hotel room inventory
2. **Hotel Operation** - Track check-ins/check-outs
3. **Transport Operation** - Manage transport schedules
4. **Food Operation** - Track meal services
5. **Airport Operation** - Manage airport transfers
6. **Ziyarat Operation** - Track religious site visits
7. **Operation Log** - Audit trail for all operations

### Admin Features:
- ✅ Bulk status updates
- ✅ Date range filtering
- ✅ Search by booking/passenger
- ✅ Export to CSV
- ✅ Audit logs
- ✅ Custom actions for common tasks

---

## Swagger Documentation

Access interactive API documentation at:
```
http://your-domain/api/schema/swagger-ui/
```

Search for "Operations" to find all operation-related endpoints with:
- ✅ Full parameter documentation
- ✅ Request/response examples
- ✅ Interactive testing
- ✅ Schema definitions

---

## Usage Examples

### Example 1: Get Today's Check-ins
```bash
GET /api/operations/daily/hotels/?date=2025-11-02&type=checkin
Authorization: Bearer <token>
```

### Example 2: Assign Room to Passenger
```bash
POST /api/operations/room-map/assign-room/
Authorization: Bearer <token>
Content-Type: application/json

{
  "booking_id": 5024,
  "hotel_id": 123,
  "pax_id": 987,
  "room_id": 102,
  "bed_no": 2,
  "assigned_by": "admin_001",
  "checkin_date": "2025-11-02",
  "checkout_date": "2025-11-06"
}
```

### Example 3: Bulk Create Transport Operations
```bash
POST /api/operations/daily/transport/bulk-create/
Authorization: Bearer <token>
Content-Type: application/json

{
  "booking_id": 123,
  "date": "2025-11-02",
  "vehicle_id": 10,
  "pickup_location": "Hotel Makkah",
  "drop_location": "Masjid al-Haram",
  "pickup_time": "08:00:00"
}
```

### Example 4: Get Passenger Full Details
```bash
GET /api/operations/pax/456/details/?date=2025-11-02
Authorization: Bearer <token>
```

---

## Database Tables

- `operations_roommap` - Room inventory
- `operations_hoteloperations` - Hotel operations
- `operations_transportoperation` - Transport operations
- `operations_foodoperation` - Food operations
- `operations_airportoperation` - Airport operations
- `operations_ziyaratoperation` - Ziyarat operations
- `operations_operationlog` - Audit logs

---

## Integration Points

### With Booking Module
- Links to `Booking` model
- Links to `BookingPersonDetail` model
- Uses `VehicleType` for transport

### With Tickets Module
- Links to `Hotels` model for hotel operations
- Uses hotel room data

### With Organization Module
- Organization-level filtering
- Branch-level access control

---

## Notes

- All timestamps are in UTC
- Date filters use YYYY-MM-DD format
- Operations are grouped by date for daily views
- Bulk operations create entries for all passengers in a booking
- Status transitions are logged in OperationLog
- Room assignments are atomic to prevent double-booking

---

## Support

For issues or questions about the Operations module:
1. Check Swagger documentation
2. Review this README
3. Contact the development team
4. Check audit logs in admin panel
