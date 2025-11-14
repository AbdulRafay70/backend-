# Area Leads (Customer Lead Management)

This app stores and manages branch-level customer leads, follow-ups, conversations and payment promises.

Key features:
- Store leads by passport or contact number (passport unique)
- Auto-fetch lead info for bookings (via service/signals)
- Manage follow-ups and today's reminders
- Conversation logs (call, whatsapp, meeting, note)
- Payment promises with overdue marking command
- Branch-based permissioning — only branch users can modify leads

Endpoints are mounted under `area_leads.urls` when included in project urls.
