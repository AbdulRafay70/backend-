# Universal Registration - Auto ID Generation & Image Upload

## Overview
The Universal Registration system now automatically generates `organization_id` and `branch_id` for entities. Additionally, CNIC front/back and visiting card fields support image uploads from the gallery.

## Changes Made

### 1. Automatic ID Generation

#### Organization
- When creating an organization, `organization_id` is **automatically generated**
- Format: `ORG-0001`, `ORG-0002`, etc.
- No need to provide this field in the request

#### Branch
- When creating a branch, `branch_id` is **automatically generated**
- Format: `BRN-0001`, `BRN-0002`, etc.
- `organization_id` is **automatically inherited** from the parent organization
- No need to provide these fields in the request

#### Agent
- Agents automatically inherit `branch_id` and `organization_id` from their parent branch
- No manual ID assignment required

#### Employee
- Employees automatically inherit `branch_id` and `organization_id` from their parent
- No manual ID assignment required

### 2. Image Upload Fields

The following fields now support image uploads from gallery:
- `cnic_front` - Upload CNIC front image
- `cnic_back` - Upload CNIC back image  
- `visiting_card` - Upload visiting card image

**Image Storage:**
- CNIC images: `media/universal/cnic/`
- Visiting cards: `media/universal/visiting_cards/`

## API Usage

### Creating an Organization

**Request:**
```http
POST /api/universal/register/
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
```

**Response:**
```json
{
    "message": "Organization registered successfully",
    "data": {
        "id": "ORG-0001",
        "type": "organization",
        "organization_id": "ORG-0001",  // ✅ Auto-generated
        "branch_id": null,
        "name": "ABC Travel Agency",
        "owner_name": "Muhammad Ali",
        "email": "contact@abctravel.com",
        "status": "active",
        "is_active": true,
        "created_at": "2025-11-01T10:00:00Z"
    }
}
```

### Creating a Branch

**Request:**
```http
POST /api/universal/register/
Content-Type: application/json

{
    "type": "branch",
    "name": "ABC Travel - Lahore Branch",
    "parent": "ORG-0001",
    "owner_name": "Fatima Khan",
    "email": "lahore@abctravel.com",
    "contact_no": "+92-42-1234567",
    "address": "456 Mall Road",
    "city": "Lahore"
}
```

**Response:**
```json
{
    "message": "Branch registered successfully",
    "data": {
        "id": "BRN-0001",
        "type": "branch",
        "parent": "ORG-0001",
        "organization_id": "ORG-0001",  // ✅ Auto-inherited from parent
        "branch_id": "BRN-0001",        // ✅ Auto-generated
        "name": "ABC Travel - Lahore Branch",
        "owner_name": "Fatima Khan",
        "email": "lahore@abctravel.com",
        "status": "active",
        "is_active": true,
        "created_at": "2025-11-01T10:15:00Z"
    }
}
```

### Creating an Agent with Images

**Request:**
```http
POST /api/universal/register/
Content-Type: multipart/form-data

{
    "type": "agent",
    "name": "Ahmed Hassan",
    "parent": "BRN-0001",
    "email": "ahmed@abctravel.com",
    "contact_no": "+92-300-9876543",
    "cnic": "54321-0987654-3",
    "cnic_front": <image file>,      // 📸 Upload from gallery
    "cnic_back": <image file>,       // 📸 Upload from gallery
    "visiting_card": <image file>    // 📸 Upload from gallery
}
```

**Response:**
```json
{
    "message": "Agent registered successfully",
    "data": {
        "id": "AGT-0001",
        "type": "agent",
        "parent": "BRN-0001",
        "organization_id": "ORG-0001",  // ✅ Auto-inherited
        "branch_id": "BRN-0001",        // ✅ Auto-inherited
        "name": "Ahmed Hassan",
        "email": "ahmed@abctravel.com",
        "contact_no": "+92-300-9876543",
        "cnic": "54321-0987654-3",
        "cnic_front": "/media/universal/cnic/cnic_front_abc123.jpg",
        "cnic_back": "/media/universal/cnic/cnic_back_abc123.jpg",
        "visiting_card": "/media/universal/visiting_cards/card_abc123.jpg",
        "status": "active",
        "is_active": true,
        "created_at": "2025-11-01T10:30:00Z"
    }
}
```

## Mobile App Integration

### For React Native / Flutter

When uploading images from the gallery:

```javascript
// Example: React Native with FormData
const formData = new FormData();
formData.append('type', 'agent');
formData.append('name', 'Ahmed Hassan');
formData.append('parent', 'BRN-0001');
formData.append('email', 'ahmed@abctravel.com');
formData.append('contact_no', '+92-300-9876543');
formData.append('cnic', '54321-0987654-3');

// Add images from gallery
formData.append('cnic_front', {
    uri: pickedImage.uri,
    type: 'image/jpeg',
    name: 'cnic_front.jpg',
});

formData.append('cnic_back', {
    uri: pickedImageBack.uri,
    type: 'image/jpeg',
    name: 'cnic_back.jpg',
});

formData.append('visiting_card', {
    uri: visitingCardImage.uri,
    type: 'image/jpeg',
    name: 'visiting_card.jpg',
});

// Make the request
fetch('https://api.example.com/api/universal/register/', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'multipart/form-data',
    },
    body: formData,
})
.then(response => response.json())
.then(data => console.log(data));
```

## Database Migration

A migration has been created to update the model fields:

**Migration:** `universal/migrations/0004_alter_universalregistration_cnic_back_and_more.py`

**To apply the migration:**
```bash
python manage.py migrate universal
```

## Technical Implementation Details

### Model Changes (`universal/models.py`)
- Changed `cnic_front`, `cnic_back`, and `visiting_card` from `CharField` to `ImageField`
- Added `upload_to` paths for organized file storage
- Added help text for clarity

### Serializer Changes (`universal/serializers.py`)
- Made `organization_id` and `branch_id` optional fields (auto-generated)
- Enhanced `create()` method with automatic ID generation logic:
  - Organizations: Generate unique `organization_id`
  - Branches: Generate unique `branch_id` and inherit `organization_id`
  - Agents: Inherit both IDs from parent branch
  - Employees: Inherit IDs from parent entity

### ID Generation (`universal/utils.py`)
- Uses `generate_prefixed_id()` function
- Atomic operation with database locks to prevent duplicates
- Format: `{PREFIX}-{NUMBER}` (e.g., ORG-0001, BRN-0002)

## Benefits

✅ **Simplified API** - No need to manually generate or track IDs  
✅ **Automatic Inheritance** - IDs automatically flow down the hierarchy  
✅ **Image Support** - Direct gallery upload support for CNIC and visiting cards  
✅ **Organized Storage** - Images stored in categorized folders  
✅ **Unique IDs** - Atomic generation prevents duplicates  
✅ **Mobile-Friendly** - Easy integration with mobile apps

## Testing

Run the tests to verify the functionality:
```bash
python manage.py test universal.tests
```

## Notes

- Image uploads require `Content-Type: multipart/form-data`
- Supported image formats: JPEG, PNG, GIF, BMP, WEBP
- Maximum file size is determined by Django's `FILE_UPLOAD_MAX_MEMORY_SIZE` setting
- Images are accessible via the `/media/` URL prefix

---

**Last Updated:** November 1, 2025
