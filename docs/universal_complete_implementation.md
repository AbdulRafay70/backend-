# Universal Registration - Complete Implementation Guide

## 🎯 Overview

The Universal Registration system with:
- ✅ **Auto-generated IDs** (organization_id & branch_id) - **READ-ONLY, cannot be input**
- ✅ **Mandatory parent selection** based on entity type
- ✅ **Dynamic parent options** - get available parents via API
- ✅ **Image upload support** from gallery (CNIC front/back, visiting card)

---

## 🔒 Read-Only Fields (Auto-Generated)

These fields are **automatically generated** and **cannot be input** by users:

- `id` - Primary ID (e.g., ORG-0001, BRN-0001, AGT-0001, EMP-0001)
- `organization_id` - Auto-generated for orgs, auto-inherited for others
- `branch_id` - Auto-generated for branches, auto-inherited for others
- `created_at` - Timestamp
- `updated_at` - Timestamp

**❌ These fields will be ignored if included in the request**
**✅ These fields will be displayed in the response**

---

## 📋 Parent Selection Rules (MANDATORY)

### Organization
- **Parent Required?** ❌ No
- **Parent Type:** None

### Branch
- **Parent Required?** ✅ YES (Mandatory)
- **Parent Type:** Must be an **Organization**
- **Error if not selected:** "Branch must select an Organization as parent"

### Agent
- **Parent Required?** ✅ YES (Mandatory)
- **Parent Type:** Must be a **Branch** (NOT Organization)
- **Error if not selected:** "Agent must select a Branch as parent"
- **Note:** Agents are linked to Branches, not directly to Organizations

### Employee
- **Parent Required?** ✅ YES (Mandatory)
- **Parent Type:** Must be an **Organization** OR **Branch** (NOT Agent)
- **Error if not selected:** "Employee must select an Organization or Branch as parent"
- **Note:** Employees can be linked directly to Organizations or Branches

---

## 🔌 API Endpoints

### 1. Get Available Parent Options

**Endpoint:** `GET /api/universal/available-parents/?type=<entity_type>`

Get the list of available parents based on what you're registering.

#### For Branch Registration
```http
GET /api/universal/available-parents/?type=branch

Response:
{
    "message": "Select an organization as parent for the branch",
    "entity_type": "branch",
    "available_parents": [
        {
            "id": "ORG-0001",
            "type": "organization",
            "name": "ABC Travel Agency",
            "organization_id": "ORG-0001",
            "branch_id": null,
            "is_active": true
        },
        {
            "id": "ORG-0002",
            "type": "organization",
            "name": "XYZ Tours",
            "organization_id": "ORG-0002",
            "branch_id": null,
            "is_active": true
        }
    ]
}
```

#### For Agent Registration
```http
GET /api/universal/available-parents/?type=agent

Response:
{
    "message": "Select a branch as parent for the agent",
    "entity_type": "agent",
    "available_parents": [
        {
            "id": "BRN-0001",
            "type": "branch",
            "name": "ABC Travel - Lahore Branch",
            "organization_id": "ORG-0001",
            "branch_id": "BRN-0001",
            "is_active": true
        },
        {
            "id": "BRN-0002",
            "type": "branch",
            "name": "ABC Travel - Karachi Branch",
            "organization_id": "ORG-0001",
            "branch_id": "BRN-0002",
            "is_active": true
        }
    ]
}
```

#### For Employee Registration
```http
GET /api/universal/available-parents/?type=employee

Response:
{
    "message": "Select an organization, branch, or agent as parent for the employee",
    "entity_type": "employee",
    "available_parents": [
        {
            "id": "ORG-0001",
            "type": "organization",
            "name": "ABC Travel Agency",
            "organization_id": "ORG-0001",
            "branch_id": null,
            "is_active": true
        },
        {
            "id": "BRN-0001",
            "type": "branch",
            "name": "ABC Travel - Lahore",
            "organization_id": "ORG-0001",
            "branch_id": "BRN-0001",
            "is_active": true
        },
        {
            "id": "AGT-0001",
            "type": "agent",
            "name": "Ahmed Hassan",
            "organization_id": "ORG-0001",
            "branch_id": "BRN-0001",
            "is_active": true
        }
    ]
}
```

#### For Organization Registration
```http
GET /api/universal/available-parents/?type=organization

Response:
{
    "message": "Organizations do not require a parent",
    "available_parents": []
}
```

---

### 2. Register New Entity

**Endpoint:** `POST /api/universal/register`

#### Example 1: Register Organization

```http
POST /api/universal/register
Content-Type: application/json

{
    "type": "organization",
    "name": "ABC Travel Agency",
    "owner_name": "Muhammad Ali",
    "email": "contact@abctravel.com",
    "contact_no": "+92-300-1234567",
    "cnic": "12345-6789012-3",
    "address": "123 Main Street",
    "city": "Karachi"
}

Response:
{
    "message": "Organization registered successfully",
    "data": {
        "id": "ORG-0001",               ✅ Auto-generated
        "type": "organization",
        "parent": null,
        "organization_id": "ORG-0001",  ✅ Auto-generated
        "branch_id": null,
        "name": "ABC Travel Agency",
        "owner_name": "Muhammad Ali",
        "email": "contact@abctravel.com",
        "contact_no": "+92-300-1234567",
        "cnic": "12345-6789012-3",
        "address": "123 Main Street",
        "city": "Karachi",
        "status": "active",
        "is_active": true,
        "created_at": "2025-11-01T10:00:00Z",
        "updated_at": "2025-11-01T10:00:00Z"
    }
}
```

#### Example 2: Register Branch (Parent Selection Required)

```http
POST /api/universal/register
Content-Type: application/json

{
    "type": "branch",
    "name": "ABC Travel - Lahore Branch",
    "parent": "ORG-0001",              ✅ REQUIRED - must select organization
    "owner_name": "Fatima Khan",
    "email": "lahore@abctravel.com",
    "contact_no": "+92-42-1234567",
    "address": "456 Mall Road",
    "city": "Lahore"
}

Response:
{
    "message": "Branch registered successfully",
    "data": {
        "id": "BRN-0001",               ✅ Auto-generated
        "type": "branch",
        "parent": "ORG-0001",
        "organization_id": "ORG-0001",  ✅ Auto-inherited from parent
        "branch_id": "BRN-0001",        ✅ Auto-generated
        "name": "ABC Travel - Lahore Branch",
        "owner_name": "Fatima Khan",
        "email": "lahore@abctravel.com",
        "contact_no": "+92-42-1234567",
        "address": "456 Mall Road",
        "city": "Lahore",
        "status": "active",
        "is_active": true,
        "created_at": "2025-11-01T10:15:00Z",
        "updated_at": "2025-11-01T10:15:00Z"
    }
}
```

#### Example 3: Register Agent with Images (Parent Selection Required)

```http
POST /api/universal/register
Content-Type: multipart/form-data

{
    "type": "agent",
    "name": "Ahmed Hassan",
    "parent": "BRN-0001",              ✅ REQUIRED - must select branch
    "email": "ahmed@abctravel.com",
    "contact_no": "+92-300-9876543",
    "cnic": "54321-0987654-3",
    "cnic_front": <image file>,        📸 From gallery
    "cnic_back": <image file>,         📸 From gallery
    "visiting_card": <image file>      📸 From gallery
}

Response:
{
    "message": "Agent registered successfully",
    "data": {
        "id": "AGT-0001",               ✅ Auto-generated
        "type": "agent",
        "parent": "BRN-0001",
        "organization_id": "ORG-0001",  ✅ Auto-inherited from parent's org
        "branch_id": "BRN-0001",        ✅ Auto-inherited from parent
        "name": "Ahmed Hassan",
        "email": "ahmed@abctravel.com",
        "contact_no": "+92-300-9876543",
        "cnic": "54321-0987654-3",
        "cnic_front": "/media/universal/cnic/cnic_front_abc123.jpg",
        "cnic_back": "/media/universal/cnic/cnic_back_abc123.jpg",
        "visiting_card": "/media/universal/visiting_cards/card_abc123.jpg",
        "address": null,
        "city": null,
        "status": "active",
        "is_active": true,
        "created_at": "2025-11-01T10:30:00Z",
        "updated_at": "2025-11-01T10:30:00Z"
    }
}
```

#### Example 4: Error - Missing Parent Selection

```http
POST /api/universal/register
Content-Type: application/json

{
    "type": "agent",
    "name": "Ahmed Hassan",
    "email": "ahmed@abctravel.com"
    // ❌ Missing "parent" field
}

Response: 400 Bad Request
{
    "parent": [
        "Agent must select a Branch as parent. Please select a branch."
    ]
}
```

---

## 📱 Mobile App Integration Flow

### Step 1: User Selects Entity Type
```javascript
const entityType = 'agent'; // User selected "Register as Agent"
```

### Step 2: Fetch Available Parents
```javascript
const response = await fetch(
    `https://api.example.com/api/universal/available-parents/?type=${entityType}`,
    {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }
);

const data = await response.json();
// data.available_parents = list of branches to choose from
```

### Step 3: Display Parent Selection Dropdown
```javascript
// Show dropdown/picker with available parents
data.available_parents.forEach(parent => {
    console.log(`${parent.name} - ID: ${parent.id}`);
    console.log(`Organization: ${parent.organization_id}`);
    console.log(`Branch: ${parent.branch_id}`);
});

// User selects: "ABC Travel - Lahore Branch (BRN-0001)"
const selectedParent = "BRN-0001";
```

### Step 4: Submit Registration with Images
```javascript
const formData = new FormData();
formData.append('type', 'agent');
formData.append('name', 'Ahmed Hassan');
formData.append('parent', selectedParent);  // From step 3
formData.append('email', 'ahmed@example.com');
formData.append('contact_no', '+92-300-1234567');
formData.append('cnic', '12345-6789012-3');

// Add images from gallery
formData.append('cnic_front', {
    uri: cnicFrontImage.uri,
    type: 'image/jpeg',
    name: 'cnic_front.jpg'
});

formData.append('cnic_back', {
    uri: cnicBackImage.uri,
    type: 'image/jpeg',
    name: 'cnic_back.jpg'
});

formData.append('visiting_card', {
    uri: visitingCardImage.uri,
    type: 'image/jpeg',
    name: 'visiting_card.jpg'
});

// Submit
const registerResponse = await fetch(
    'https://api.example.com/api/universal/register',
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        },
        body: formData
    }
);

const result = await registerResponse.json();
console.log('Registered:', result.data);
console.log('Agent ID:', result.data.id);              // AGT-0001
console.log('Organization ID:', result.data.organization_id); // ORG-0001
console.log('Branch ID:', result.data.branch_id);      // BRN-0001
```

---

## 🎨 UI/UX Flow Recommendations

### Organization Registration
1. Type: "Organization" (selected)
2. Show form fields (name, email, contact, etc.)
3. **No parent selection needed**
4. Submit → Get back: `id`, `organization_id` (auto-generated)

### Branch Registration
1. Type: "Branch" (selected)
2. **Fetch available organizations** via `/available-parents/?type=branch`
3. Show dropdown: "Select Parent Organization" (REQUIRED)
4. Display: Organization Name + Organization ID
5. User selects organization
6. Show remaining form fields
7. Submit → Get back: `id`, `branch_id` (auto-generated), `organization_id` (auto-inherited)

### Agent Registration
1. Type: "Agent" (selected)
2. **Fetch available branches** via `/available-parents/?type=agent`
3. Show dropdown: "Select Parent Branch" (REQUIRED)
4. Display: Branch Name + Organization ID + Branch ID
5. User selects branch
6. Show remaining form fields + image pickers
7. Submit → Get back: `id`, `organization_id`, `branch_id` (auto-inherited)

### Employee Registration
1. Type: "Employee" (selected)
2. **Fetch all available parents** via `/available-parents/?type=employee`
3. Show dropdown: "Select Parent" (REQUIRED)
4. Display: Name + Type + IDs
5. User selects parent
6. Show remaining form fields
7. Submit → Get back: `id`, inherited IDs

---

## ✅ Validation & Error Messages

| Scenario | Error Message |
|----------|--------------|
| Branch without parent | "Branch must select an Organization as parent. Please select an organization." |
| Branch with wrong parent type | "Branch parent must be an organization. Selected parent is agent." |
| Agent without parent | "Agent must select a Branch as parent. Please select a branch." |
| Agent with wrong parent type | "Agent parent must be a branch. Selected parent is organization." |
| Employee without parent | "Employee must select a parent (Organization, Branch, or Agent). Please select a parent." |
| Trying to input organization_id | Field will be ignored (read-only) |
| Trying to input branch_id | Field will be ignored (read-only) |

---

## 📊 ID Display Logic

After successful registration, display the IDs prominently:

```
✅ Registration Successful!

Your Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: AGT-0001
Type: Agent
Name: Ahmed Hassan
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Organizational Hierarchy:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Organization ID: ORG-0001
🏪 Branch ID: BRN-0001
👤 Agent ID: AGT-0001
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Technical Summary

### What's Blocked (Read-Only)
- ✅ `organization_id` - Cannot be input, auto-generated/inherited
- ✅ `branch_id` - Cannot be input, auto-generated/inherited
- ✅ `id` - Primary key, auto-generated
- ✅ `created_at`, `updated_at` - Timestamps

### What's Required (Mandatory)
- ✅ Branch → Must have Organization parent
- ✅ Agent → Must have Branch parent
- ✅ Employee → Must have parent (Org/Branch/Agent)

### What's Dynamic
- ✅ Parent options fetched based on entity type
- ✅ IDs displayed after registration
- ✅ Hierarchy shown in response

---

**Last Updated:** November 1, 2025
