
# Universal Registration API

Base path: `/api/universal/`

## Endpoints

POST /api/universal/register
- Create an entity (organization, branch, agent, employee)
- Request body (example):

{
  "type": "agent",
  "parent": "BRN-0001",
  "name": "Star Travel Agency",
  "email": "info@startravel.com",
  "contact_no": "+92 300 1234567",
  "address": "Shop 12, Liberty Market, Lahore",
  "city": "Lahore",
  "country": "Pakistan"
}

- Response (201):
{
  "message": "Agent registered successfully",
  "data": { ... created object ... }
}

GET /api/universal/list
- Query params: type, parent_id, status, search, limit, offset
- Returns paginated list of registrations

GET /api/universal/{id}
- Return details for a single entity

PUT /api/universal/update/{id}
- Update fields (validated)

DELETE /api/universal/delete/{id}
- Soft delete (cascade deactivation)

## Validation rules (summary)
- `type` is required and one of: organization, branch, agent, employee
- Branch parent must be an organization
- Agent parent must be a branch
- Employee parent must be organization, branch, or agent
- `email` is unique across entities
- Defaults: `status` = active, `country` = Pakistan

## ID Generation
IDs are generated server-side with prefixes: ORG-, BRN-, AGT-, EMP- and a zero-padded sequence (example: AGT-0012).

## Notes
- Notifications: optional email notifications are sent on new registration if EMAIL settings are configured and `REGISTRATION_NOTIFICATION_RECIPIENTS` is set in settings.
- Permissions: basic placeholder permissions are implemented in `universal/permissions.py`. Integrate with your project role system for production-level controls.

*** End of file
