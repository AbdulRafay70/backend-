"""
Example script demonstrating automatic branch_id and organization_id generation
in Universal Registration.

This shows how the system automatically generates IDs:
- Organizations get auto-generated organization_id
- Branches get auto-generated branch_id and inherit organization_id from parent
- Agents inherit branch_id and organization_id from parent branch
- Employees inherit from their parent

Image fields (cnic_front, cnic_back, visiting_card) accept file uploads from gallery.
"""

# Example data for creating registrations

# 1. Create an Organization
organization_data = {
    "type": "organization",
    "name": "ABC Travel Agency",
    "owner_name": "Muhammad Ali",
    "email": "contact@abctravel.com",
    "contact_no": "+92-300-1234567",
    "cnic": "12345-6789012-3",
    "address": "123 Main Street",
    "city": "Karachi",
    # organization_id will be auto-generated as ORG-0001, ORG-0002, etc.
}

# 2. Create a Branch under the Organization
# Assuming organization was created with id="ORG-0001"
branch_data = {
    "type": "branch",
    "name": "ABC Travel - Lahore Branch",
    "parent": "ORG-0001",  # Reference to parent organization
    "owner_name": "Fatima Khan",
    "email": "lahore@abctravel.com",
    "contact_no": "+92-42-1234567",
    "address": "456 Mall Road",
    "city": "Lahore",
    # branch_id will be auto-generated as BRN-0001, BRN-0002, etc.
    # organization_id will be inherited from parent (ORG-0001)
}

# 3. Create an Agent under the Branch
# Assuming branch was created with id="BRN-0001"
agent_data = {
    "type": "agent",
    "name": "Ahmed Hassan",
    "parent": "BRN-0001",  # Reference to parent branch
    "email": "ahmed@abctravel.com",
    "contact_no": "+92-300-9876543",
    "cnic": "54321-0987654-3",
    # branch_id will be inherited from parent (BRN-0001)
    # organization_id will be inherited from parent's organization (ORG-0001)
}

# 4. Create an Employee under the Branch
employee_data = {
    "type": "employee",
    "name": "Sara Malik",
    "parent": "BRN-0001",  # Reference to parent branch
    "email": "sara@abctravel.com",
    "contact_no": "+92-333-5555555",
    "cnic": "11111-2222222-3",
    # branch_id will be inherited from parent (BRN-0001)
    # organization_id will be inherited from parent's organization (ORG-0001)
}

# Example API request with image uploads from gallery
# When using multipart/form-data for file uploads:
"""
POST /api/universal/register/
Content-Type: multipart/form-data

{
    "type": "agent",
    "name": "Ahmed Hassan",
    "parent": "BRN-0001",
    "email": "ahmed@abctravel.com",
    "contact_no": "+92-300-9876543",
    "cnic": "54321-0987654-3",
    "cnic_front": <file from gallery>,
    "cnic_back": <file from gallery>,
    "visiting_card": <file from gallery>
}

Response:
{
    "message": "Agent registered successfully",
    "data": {
        "id": "AGT-0001",
        "type": "agent",
        "name": "Ahmed Hassan",
        "parent": "BRN-0001",
        "organization_id": "ORG-0001",  // Auto-inherited
        "branch_id": "BRN-0001",        // Auto-inherited
        "email": "ahmed@abctravel.com",
        "contact_no": "+92-300-9876543",
        "cnic": "54321-0987654-3",
        "cnic_front": "/media/universal/cnic/cnic_front_xyz.jpg",
        "cnic_back": "/media/universal/cnic/cnic_back_xyz.jpg",
        "visiting_card": "/media/universal/visiting_cards/card_xyz.jpg",
        "status": "active",
        "is_active": true,
        "created_at": "2025-11-01T10:30:00Z",
        "updated_at": "2025-11-01T10:30:00Z"
    }
}
"""
