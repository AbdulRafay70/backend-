# Pending Balance & Final Balance API Documentation

## Overview
This document details the **4 Pending Balance Endpoints** and **1 Final Balance Endpoint** that track outstanding amounts across agents, area agents, branches, and organizations using the enhanced ledger system.

## Key Features
- ✅ Real-time balance calculation from ledger entries
- ✅ Filters by `final_balance < 0` (outstanding amounts)
- ✅ Includes internal note references
- ✅ Cross-organization balance tracking
- ✅ Supports both individual and aggregate queries
- ✅ Comprehensive entity balance calculation

---

## 1️⃣ Agents Pending Balances

### Endpoint
```
GET /api/agents/pending-balances?organization_id={organization_id}
```

### Purpose
Returns all agents with **negative final balance** (outstanding amount owed to the organization).

### Query Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| organization_id | ✅ Yes | ID of the organization to check |

### Response Format
```json
{
  "organization_id": "ORG00001",
  "organization_name": "Saer.pk",
  "total_pending_agents": 5,
  "agents": [
    {
      "agent_id": "AGT001",
      "agency_name": "Al Madina Travel Agency",
      "agent_name": "Ahmed Khan",
      "contact_no": "+92-300-1234567",
      "pending_balance": -15000.00,
      "internal_note_ids": [123, 456, 789]
    },
    {
      "agent_id": "AGT002",
      "agency_name": "Mecca Tours",
      "agent_name": "Fatima Ali",
      "contact_no": "+92-321-9876543",
      "pending_balance": -8500.50,
      "internal_note_ids": [234, 567]
    }
  ]
}
```

### Logic
1. Gets all agencies belonging to the specified organization (including via branches)
2. For each agency:
   - Calculates `total_debit` - `total_credit` from ledger entries
   - Only includes agencies where `final_balance < 0`
3. Returns list sorted by pending balance amount

### Use Cases
- **Finance team**: Track which agents owe money
- **Collection**: Prioritize follow-ups based on outstanding amounts
- **Reporting**: Generate pending receivables report

---

## 2️⃣ Area Agents Pending Balances

### Endpoint
```
GET /api/area-agents/pending-balances?organization_id={organization_id}
```

### Purpose
Returns all area agents with **negative final balance** (commission or payment pending).

### Query Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| organization_id | ✅ Yes | ID of the organization to check |

### Response Format
```json
{
  "organization_id": "ORG00001",
  "organization_name": "Saer.pk",
  "total_pending_area_agents": 3,
  "area_agents": [
    {
      "area_agent_id": "AREA001",
      "area_agent_name": "Lahore Region - Hassan Malik",
      "contact_no": "+92-300-1111111",
      "pending_balance": -5000.00,
      "internal_note_ids": [890, 891]
    },
    {
      "area_agent_id": "AREA002",
      "area_agent_name": "Karachi Region - Sara Ahmed",
      "contact_no": "+92-321-2222222",
      "pending_balance": -3500.00,
      "internal_note_ids": [892]
    }
  ]
}
```

### Logic
1. Gets all area leads linked to the specified organization
2. For each area lead:
   - Calculates `total_debit` - `total_credit` from ledger entries where `area_agency = area_lead`
   - Only includes area agents where `final_balance < 0`
3. Returns list with area agent details

### Use Cases
- **Commission tracking**: See which area agents have pending commission payouts
- **Payment management**: Track amounts owed to area agents
- **Financial reconciliation**: Ensure area agent balances are accurate

---

## 3️⃣ Branch Pending Balances

### Endpoint
```
GET /api/branch/pending-balances?organization_id={organization_id}
```

### Purpose
Returns all branches with **negative final balance** (outstanding amounts).

### Query Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| organization_id | ✅ Yes | ID of the organization to check |

### Response Format
```json
{
  "organization_id": "ORG00001",
  "organization_name": "Saer.pk",
  "total_pending_branches": 2,
  "branches": [
    {
      "branch_id": "BRN0001",
      "branch_name": "Lahore Branch",
      "contact_no": "+92-42-111-2222",
      "pending_balance": -25000.00,
      "internal_note_ids": [111, 222, 333]
    },
    {
      "branch_id": "BRN0002",
      "branch_name": "Karachi Branch",
      "contact_no": "+92-21-333-4444",
      "pending_balance": -12000.00,
      "internal_note_ids": [444]
    }
  ]
}
```

### Logic
1. Gets all branches belonging to the specified organization
2. For each branch:
   - Calculates `total_debit` - `total_credit` from ledger entries where `branch = branch`
   - Only includes branches where `final_balance < 0`
3. Returns list with branch details

### Use Cases
- **Branch performance**: Track which branches have outstanding payments
- **Financial oversight**: Monitor branch-level balances
- **Inter-branch settlements**: Identify branches needing balance reconciliation

---

## 4️⃣ Organization Pending Balances

### Endpoint
```
GET /api/organization/pending-balances?org1_id={org1_id}&org2_id={org2_id}
```
OR
```
GET /api/organization/pending-balances?org1_id={org1_id}
```

### Purpose
Returns pending balance between two organizations OR all organizations with pending balance against one organization.

### Query Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| org1_id (or organization_id) | ✅ Yes | ID of the first organization |
| org2_id | ⚪ Optional | ID of the second organization |

### Response Format - Two Organizations
```json
{
  "org1_id": "ORG00001",
  "org1_name": "Saer.pk",
  "org2_id": "ORG00002",
  "org2_name": "Al Madina Hotels",
  "org1_owes_to_org2": 50000.00,
  "org2_owes_to_org1": 30000.00,
  "net_pending_balance": -20000.00,
  "balance_description": "Saer.pk owes Al Madina Hotels"
}
```

### Response Format - All Organizations
```json
{
  "organization_id": "ORG00001",
  "organization_name": "Saer.pk",
  "total_pending_organizations": 3,
  "organizations": [
    {
      "organization_id": "ORG00002",
      "organization_name": "Al Madina Hotels",
      "pending_balance": -20000.00,
      "balance_description": "Saer.pk owes Al Madina Hotels"
    },
    {
      "organization_id": "ORG00003",
      "organization_name": "Mecca Transport Co.",
      "pending_balance": 15000.00,
      "balance_description": "Mecca Transport Co. owes Saer.pk"
    }
  ]
}
```

### Logic
1. **Two organizations mode** (org2_id provided):
   - Calculates ledger entries where `seller_organization=org1` AND `inventory_owner_organization=org2`
   - Calculates reverse ledger entries where `seller_organization=org2` AND `inventory_owner_organization=org1`
   - Computes net balance: `org2_owes - org1_owes`
   - Positive = org2 owes org1, Negative = org1 owes org2

2. **All organizations mode** (org2_id not provided):
   - Finds all organizations that have transactions with org1
   - For each organization, calculates net balance
   - Only includes organizations with non-zero balance

### Use Cases
- **Inter-company settlement**: Track amounts between different organizations
- **Inventory ownership tracking**: When using another company's inventory
- **Financial clearing**: Reconcile cross-organization transactions
- **Partnership management**: Monitor balances with partner organizations

---

## 5️⃣ Final Balance Endpoint

### Endpoint
```
GET /api/final-balance?type={type}&id={id}
```

### Purpose
Returns comprehensive final balance for any entity type (agent, area_agent, branch, organization).

### Query Parameters
| Parameter | Required | Description | Valid Values |
|-----------|----------|-------------|--------------|
| type | ✅ Yes | Type of entity | `agent`, `area_agent`, `branch`, `organization` |
| id | ✅ Yes | ID of the entity | Integer |

### Response Format
```json
{
  "type": "agent",
  "id": "5",
  "name": "Al Madina Travel Agency",
  "total_debit": 150000.00,
  "total_credit": 135000.00,
  "final_balance": 15000.00,
  "currency": "PKR",
  "last_updated": "2025-01-15T14:30:00Z"
}
```

### Logic
1. Validates entity type and retrieves entity
2. Filters ledger entries based on entity type:
   - **Agent**: `agency = entity`
   - **Area Agent**: `area_agency = entity`
   - **Branch**: `branch = entity`
   - **Organization**: `organization = entity OR seller_organization = entity OR inventory_owner_organization = entity`
3. Aggregates:
   - `total_debit = SUM(transaction_amount WHERE transaction_type='debit')`
   - `total_credit = SUM(transaction_amount WHERE transaction_type='credit')`
   - `final_balance = total_debit - total_credit`
4. Gets last updated timestamp from most recent ledger entry

### Use Cases
- **Balance inquiry**: Check current balance for any entity
- **Financial dashboard**: Display real-time balance status
- **Audit trail**: Show complete debit/credit breakdown
- **Multi-entity reporting**: Query different entity types with single endpoint

---

## Balance Calculation Rules

### Debit vs Credit
- **Debit (+)**: Amount charged to entity (increases balance)
- **Credit (-)**: Amount paid or credited (decreases balance)
- **Final Balance**: `Total Debit - Total Credit`

### Negative Balance Meaning
| Entity Type | Negative Balance Means |
|-------------|----------------------|
| Agent | Agent owes money to organization |
| Area Agent | Area agent has pending commission/payment |
| Branch | Branch has outstanding payment to organization |
| Organization | Organization owes to another organization |

### Positive Balance Meaning
| Entity Type | Positive Balance Means |
|-------------|----------------------|
| Agent | Organization owes refund/credit to agent |
| Area Agent | Overpaid commission (organization owes area agent) |
| Branch | Branch has credit balance (organization owes branch) |
| Organization | Another organization owes this organization |

---

## Internal Notes Integration

### Purpose
The `internal_note_ids` field in pending balance responses references ledger entries that have internal notes attached.

### What are Internal Notes?
Internal notes are JSON arrays stored in `LedgerEntry.internal_notes`:
```json
[
  {
    "timestamp": "2025-01-15T10:30:00Z",
    "author": "admin",
    "note": "Partial payment received, balance pending"
  },
  {
    "timestamp": "2025-01-16T14:00:00Z",
    "author": "finance_team",
    "note": "Follow-up scheduled for next week"
  }
]
```

### How to Use
1. Get pending balances endpoint response
2. Extract `internal_note_ids` array
3. Query individual ledger entries: `GET /api/ledger/{id}/`
4. Read `internal_notes` field from ledger entry

### Example Flow
```python
# 1. Get pending agents
response = requests.get('/api/agents/pending-balances?organization_id=1')
agent = response.json()['agents'][0]

# agent['internal_note_ids'] = [123, 456, 789]

# 2. Get ledger entry details
ledger_response = requests.get('/api/ledger/123/')
notes = ledger_response.json()['internal_notes']

# 3. Display notes
for note in notes:
    print(f"{note['timestamp']}: {note['note']} (by {note['author']})")
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "organization_id query parameter is required"
}
```

```json
{
  "detail": "Both 'type' and 'id' query parameters are required"
}
```

```json
{
  "detail": "Invalid type. Must be one of: agent, area_agent, organization, branch"
}
```

### 404 Not Found
```json
{
  "detail": "Organization not found"
}
```

```json
{
  "detail": "Agent not found"
}
```

---

## Authentication
All endpoints require authentication using JWT tokens:

```bash
# Get token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use token
curl -X GET "http://localhost:8000/ledger/api/agents/pending-balances?organization_id=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Testing

### Run Test Suite
```bash
cd "c:\Users\Abdul Rafay\Downloads\All\All"
python test_pending_balances_api.py
```

### Test Individual Endpoint
```bash
# Test agents pending balance
curl -X GET "http://localhost:8000/ledger/api/agents/pending-balances?organization_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test final balance
curl -X GET "http://localhost:8000/ledger/api/final-balance?type=agent&id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Performance Considerations

### Database Indexing
Ensure these indexes exist on `LedgerEntry` table:
```sql
CREATE INDEX idx_ledger_agency ON ledger_ledgerentry(agency_id, reversed);
CREATE INDEX idx_ledger_area_agency ON ledger_ledgerentry(area_agency_id, reversed);
CREATE INDEX idx_ledger_branch ON ledger_ledgerentry(branch_id, reversed);
CREATE INDEX idx_ledger_seller_inventory ON ledger_ledgerentry(seller_organization_id, inventory_owner_organization_id);
```

### Query Optimization
- Uses `aggregate()` with conditional filters (efficient single-query approach)
- Excludes reversed entries to avoid double counting
- Uses `distinct()` for organization queries to prevent duplicates

### Caching Recommendations
For high-traffic scenarios:
```python
from django.core.cache import cache

# Cache pending balances for 5 minutes
cache_key = f"pending_agents_{organization_id}"
result = cache.get(cache_key)
if not result:
    result = calculate_pending_agents(organization_id)
    cache.set(cache_key, result, 300)  # 5 minutes
```

---

## Migration from Old Balance System

### Old System (Account.balance)
```python
# Old approach
account = Account.objects.get(agency=agency)
balance = account.balance
```

### New System (LedgerEntry aggregation)
```python
# New approach
ledger_summary = LedgerEntry.objects.filter(
    agency=agency,
    reversed=False
).aggregate(
    total_debit=Sum('transaction_amount', filter=Q(transaction_type='debit')),
    total_credit=Sum('transaction_amount', filter=Q(transaction_type='credit'))
)
balance = ledger_summary['total_debit'] - ledger_summary['total_credit']
```

### Benefits of New System
✅ Real-time calculation (no stale data)  
✅ Audit trail (every transaction tracked)  
✅ Reversible entries (can undo transactions)  
✅ Multi-organization support (cross-ledger tracking)  
✅ Historical analysis (monthly/yearly breakdowns)

---

## Complete Endpoint Summary

| # | Endpoint | Purpose | Filter |
|---|----------|---------|--------|
| 1 | `/api/agents/pending-balances` | Agents with negative balance | `final_balance < 0` |
| 2 | `/api/area-agents/pending-balances` | Area agents with negative balance | `final_balance < 0` |
| 3 | `/api/branch/pending-balances` | Branches with negative balance | `final_balance < 0` |
| 4 | `/api/organization/pending-balances` | Org-to-org balances | `net_balance != 0` |
| 5 | `/api/final-balance` | Any entity's complete balance | Any entity type |

---

## Related Documentation
- [Enhanced Ledger System](ledger_enhanced_system.md)
- [5-Level Ledger Queries](ledger_5_level_queries.md)
- [Auto-Posting Logic](ledger_auto_posting.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
