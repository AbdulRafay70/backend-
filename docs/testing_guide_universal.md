# Quick Testing Guide - Universal Registration

## Test Sequence

### 1. Get Available Parents for Branch
```bash
curl -X GET "http://localhost:8000/api/universal/available-parents/?type=branch" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** List of organizations

### 2. Register Organization
```bash
curl -X POST "http://localhost:8000/api/universal/register" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "organization",
    "name": "ABC Travel Agency",
    "owner_name": "Muhammad Ali",
    "email": "contact@abctravel.com",
    "contact_no": "+92-300-1234567",
    "cnic": "12345-6789012-3",
    "address": "123 Main Street",
    "city": "Karachi"
  }'
```
**Expected Response:**
```json
{
  "message": "Organization registered successfully",
  "data": {
    "id": "ORG-0001",
    "organization_id": "ORG-0001",
    "branch_id": null,
    ...
  }
}
```

### 3. Get Available Parents for Branch (should show the org we just created)
```bash
curl -X GET "http://localhost:8000/api/universal/available-parents/?type=branch" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** List including ORG-0001

### 4. Register Branch (with parent selection)
```bash
curl -X POST "http://localhost:8000/api/universal/register" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "branch",
    "name": "ABC Travel - Lahore Branch",
    "parent": "ORG-0001",
    "owner_name": "Fatima Khan",
    "email": "lahore@abctravel.com",
    "contact_no": "+92-42-1234567",
    "address": "456 Mall Road",
    "city": "Lahore"
  }'
```
**Expected Response:**
```json
{
  "message": "Branch registered successfully",
  "data": {
    "id": "BRN-0001",
    "organization_id": "ORG-0001",  // Inherited
    "branch_id": "BRN-0001",        // Auto-generated
    "parent": "ORG-0001",
    ...
  }
}
```

### 5. Test Missing Parent Error
```bash
curl -X POST "http://localhost:8000/api/universal/register" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "branch",
    "name": "Test Branch Without Parent",
    "email": "test@example.com"
  }'
```
**Expected Response (400 Error):**
```json
{
  "parent": [
    "Branch must select an Organization as parent. Please select an organization."
  ]
}
```

### 6. Get Available Parents for Agent
```bash
curl -X GET "http://localhost:8000/api/universal/available-parents/?type=agent" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** List of branches (should include BRN-0001)

### 7. Register Agent with Images
```bash
curl -X POST "http://localhost:8000/api/universal/register" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "type=agent" \
  -F "name=Ahmed Hassan" \
  -F "parent=BRN-0001" \
  -F "email=ahmed@abctravel.com" \
  -F "contact_no=+92-300-9876543" \
  -F "cnic=54321-0987654-3" \
  -F "cnic_front=@/path/to/cnic_front.jpg" \
  -F "cnic_back=@/path/to/cnic_back.jpg" \
  -F "visiting_card=@/path/to/visiting_card.jpg"
```
**Expected Response:**
```json
{
  "message": "Agent registered successfully",
  "data": {
    "id": "AGT-0001",
    "organization_id": "ORG-0001",  // Inherited from branch's org
    "branch_id": "BRN-0001",        // Inherited from parent
    "parent": "BRN-0001",
    "cnic_front": "/media/universal/cnic/cnic_front_xyz.jpg",
    "cnic_back": "/media/universal/cnic/cnic_back_xyz.jpg",
    "visiting_card": "/media/universal/visiting_cards/card_xyz.jpg",
    ...
  }
}
```

### 8. List All Entities
```bash
curl -X GET "http://localhost:8000/api/universal/list" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9. Filter by Type
```bash
# Get all branches
curl -X GET "http://localhost:8000/api/universal/list?type=branch" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get all agents
curl -X GET "http://localhost:8000/api/universal/list?type=agent" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 10. Get Entity Details
```bash
curl -X GET "http://localhost:8000/api/universal/ORG-0001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Verification Checklist

- [ ] Organizations auto-generate organization_id
- [ ] Branches auto-generate branch_id and inherit organization_id
- [ ] Agents inherit both branch_id and organization_id
- [ ] Cannot input organization_id or branch_id (they're read-only)
- [ ] Branch registration fails without parent
- [ ] Agent registration fails without parent
- [ ] Available parents endpoint returns correct entities
- [ ] Image uploads work for cnic_front, cnic_back, visiting_card
- [ ] Images stored in correct directories
- [ ] IDs displayed in response

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Branch must select..." | Provide "parent" field with valid organization ID |
| "Agent must select..." | Provide "parent" field with valid branch ID |
| organization_id ignored | This is expected - it's read-only and auto-generated |
| branch_id ignored | This is expected - it's read-only and auto-generated |
| "Invalid type" | Use: organization, branch, agent, or employee |
| Image upload fails | Ensure Content-Type is multipart/form-data |

---

**Note:** Replace `YOUR_TOKEN` with actual authentication token and adjust the base URL as needed.
