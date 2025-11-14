# Agency Profile API Documentation

# Agency Profile API Documentation

## Implementation Summary

The following features have been implemented and fully tested for the Agency Profile API:

- **AgencyProfile Model:**
  - Created in `organization/models.py` with all required fields (agency, relationship_status, relation_history, working_with_companies, performance_summary, recent_communication, conflict_history, created_by, updated_by, created_at, updated_at).
  - Migrations created and applied.
- **AgencyProfileSerializer:**
  - Added in `organization/serializers.py` for read/write operations.
- **API Endpoints:**
  - Implemented GET and POST `/api/agency/profile` endpoints in `organization/views.py`.
  - GET fetches the profile by `agency_id`.
  - POST creates or updates the profile, with proper handling of timestamps and user tracking.
- **Routes:**
  - Registered endpoints in `organization/urls.py`.
- **Tests:**
  - Added comprehensive tests in `organization/tests.py` to cover creation, update, fetch, and validation scenarios.
- **Authentication:**
  - All endpoints require authentication.
- **Status:**
  - All features are implemented, migrations are applied, and all tests are passing.

---

## Overview
The Agency Profile API provides endpoints to view and update the relationship, performance, and communication profile of an agency.

---

## Endpoints

### 1. GET `/api/agency/profile?agency_id=<id>`
**Description:**
Fetch the full profile for a given agency.

**Query Parameters:**
- `agency_id` (required): The ID of the agency to fetch the profile for.

**Response Example:**
```
{
  "id": 1,
  "agency": 123,
  "relationship_status": "active",
  "relation_history": ["joined", "renewed"],
  "working_with_companies": ["CompanyA"],
  "performance_summary": {"score": 90},
  "recent_communication": ["call"],
  "conflict_history": [],
  "created_by": 7,
  "updated_by": 7,
  "created_at": "2025-10-28T12:00:00Z",
  "updated_at": "2025-10-28T12:00:00Z"
}
```

### 2. POST `/api/agency/profile`
**Description:**
Create or update the profile for an agency.

**Request Body Example:**
```
{
  "agency": 123,
  "relationship_status": "active",
  "relation_history": ["joined", "renewed"],
  "working_with_companies": ["CompanyA"],
  "performance_summary": {"score": 90},
  "recent_communication": ["call"],
  "conflict_history": []
}
```

**Response Example:**
```
{
  "success": true,
  "message": "Agency profile updated successfully",
  "updated_profile": {
    "agency": 123,
    "relationship_status": "active",
    ...
  }
}
```

---

## Model Fields
- `agency`: Agency ID (OneToOne)
- `relationship_status`: String (default: 'active')
- `relation_history`: List
- `working_with_companies`: List
- `performance_summary`: Dict
- `recent_communication`: List
- `conflict_history`: List
- `created_by`: User ID
- `updated_by`: User ID
- `created_at`: Timestamp
- `updated_at`: Timestamp

---

## Notes
- Both endpoints require authentication.
- POST will update if a profile exists, or create a new one if not.
- All changes are tracked with `created_by` and `updated_by` fields.
