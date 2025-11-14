# 📊 Reports Module API Documentation

## Overview
Complete reporting system for Saer.pk backend with three main report types:
1. **Sales Summary Report** - Comprehensive booking and sales statistics
2. **Financial Summary Report** - Ledger-based receivables and payables
3. **Top Sellers Report** - Agent performance rankings

## API Endpoints

### 1️⃣ Sales Summary Report

**Endpoint:** `GET /api/v1/reports/sales-summary/`

**Description:** 
Returns comprehensive sales statistics including booking counts by category, payment status breakdowns, and agent-wise summaries.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization_id` | integer | ✅ Yes | Organization ID for which report is needed |
| `date_from` | date | ❌ No | Start date (YYYY-MM-DD). Default: first day of current month |
| `date_to` | date | ❌ No | End date (YYYY-MM-DD). Default: last day of current month |
| `agent_id` | integer | ❌ No | Filter by specific agent |
| `branch_id` | integer | ❌ No | Filter by specific branch |

**Response Structure:**
```json
{
  "message": "Sales summary report generated successfully",
  "data": {
    "total_bookings": 125,
    "total_group_bookings": 45,
    "total_ticket_bookings": 60,
    "total_umrah_bookings": 30,
    "total_visa_bookings": 25,
    "total_hotel_nights": 450,
    "total_transport_bookings": 40,
    "total_food_bookings": 35,
    "total_ziyarat_bookings": 30,
    "total_paid_orders": 95,
    "total_unpaid_orders": 25,
    "total_expired_orders": 5,
    "total_amount": 5250000.00,
    "total_paid_amount": 4100000.00,
    "total_unpaid_amount": 1000000.00,
    "total_expired_amount": 150000.00,
    "agent_wise_summary": [
      {
        "agent_id": 101,
        "agent_name": "Saer.pk Islamabad Agent",
        "total_orders": 45,
        "paid_orders": 32,
        "unpaid_orders": 13,
        "total_sales_amount": 1200000.00,
        "paid_sales_amount": 850000.00,
        "service_breakdown": {
          "umrah": { "count": 10, "amount": 400000.00 },
          "visa": { "count": 8, "amount": 150000.00 },
          "tickets": { "count": 20, "amount": 350000.00 },
          "hotel": { "nights": 45, "amount": 200000.00 },
          "transport": { "count": 5, "amount": 50000.00 },
          "food": { "count": 4, "amount": 30000.00 },
          "ziyarat": { "count": 3, "amount": 20000.00 }
        }
      }
    ],
    "date_range": {
      "from": "2025-11-01",
      "to": "2025-11-30"
    }
  }
}
```

**Calculation Rules:**
- `total_bookings` = COUNT(all bookings in date range)
- `total_ticket_bookings` = COUNT where category contains 'ticket'
- `total_umrah_bookings` = COUNT where category='umrah' OR umrah_package is not null
- `total_hotel_nights` = SUM of BookingHotelDetails.total_nights
- `total_paid_amount` = SUM(total_amount) WHERE payment_status='Paid' OR is_paid=True
- `total_unpaid_amount` = SUM(total_amount) WHERE payment_status IN ('Pending', 'Partial')
- `total_expired_amount` = SUM(total_amount) WHERE expiry_time < NOW AND is_paid=False

---

### 2️⃣ Financial Summary Report

**Endpoint:** `GET /api/v1/reports/financial-summary/`

**Description:** 
Returns comprehensive financial overview including receivables, payables, net balance, and breakdowns by counterparty and agent.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization_id` | integer | ✅ Yes | Organization ID |

**Response Structure:**
```json
{
  "message": "Financial summary report generated successfully",
  "data": {
    "organization_id": 202,
    "organization_name": "Saer.pk Pakistan",
    "total_receivable_amount": 540000.00,
    "total_payable_amount": 380000.00,
    "receivable_settled_amount": 350000.00,
    "receivable_unsettled_amount": 190000.00,
    "payable_settled_amount": 250000.00,
    "payable_unsettled_amount": 130000.00,
    "net_balance": 160000.00,
    "by_counterparty": [
      {
        "organization_id": 303,
        "organization_name": "FlyWorld Travels",
        "receivable": 90000.00,
        "payable": 40000.00
      }
    ],
    "by_agent": [
      {
        "agent_id": 101,
        "agent_name": "Ahmad Tours",
        "receivable": 150000.00,
        "payable": 30000.00
      }
    ]
  }
}
```

**Calculation Rules:**
- `total_receivable_amount` = SUM(transaction_amount) from LedgerEntry WHERE organization_id = given org AND transaction_type='credit'
- `total_payable_amount` = SUM(transaction_amount) from LedgerEntry WHERE organization_id = given org AND transaction_type='debit'
- `net_balance` = total_receivable_amount - total_payable_amount
- `settled/unsettled` split based on remarks containing 'settled'
- `by_counterparty` groups by seller_organization_id
- `by_agent` groups by agent bookings and their ledger entries

---

### 3️⃣ Top Sellers Report

**Endpoint:** `GET /api/v1/reports/top-sellers/`

**Description:** 
Returns ranking of agents by total sales or booking count with category breakdowns.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization_id` | integer | ✅ Yes | Organization ID |
| `date_from` | date | ❌ No | Start date (YYYY-MM-DD) |
| `date_to` | date | ❌ No | End date (YYYY-MM-DD) |
| `limit` | integer | ❌ No | Number of top sellers to return (default: 10) |
| `sort_by` | string | ❌ No | Sort by 'total_amount' or 'total_bookings' (default: total_amount) |

**Response Structure:**
```json
{
  "message": "Top sellers report generated successfully",
  "data": [
    {
      "agent_id": 101,
      "agent_name": "Ahmad Tours",
      "total_bookings": 48,
      "total_amount": 1250000.00,
      "categories": [
        { "category": "ticket", "count": 20, "amount": 400000.00 },
        { "category": "umrah", "count": 12, "amount": 500000.00 },
        { "category": "visa", "count": 6, "amount": 150000.00 },
        { "category": "hotel", "count": 10, "amount": 200000.00 }
      ],
      "ranking": 1
    },
    {
      "agent_id": 102,
      "agent_name": "Pakistan Travel Services",
      "total_bookings": 35,
      "total_amount": 980000.00,
      "categories": [
        { "category": "umrah", "count": 15, "amount": 600000.00 },
        { "category": "ticket", "count": 15, "amount": 300000.00 },
        { "category": "visa", "count": 5, "amount": 80000.00 }
      ],
      "ranking": 2
    }
  ]
}
```

**Calculation Rules:**
- Groups bookings by agent_id
- Only includes PAID bookings (payment_status='Paid' OR is_paid=True)
- `total_bookings` = COUNT of all paid bookings per agent
- `total_amount` = SUM(total_amount) of all paid bookings per agent
- Category breakdown groups by (agent_id, category)
- Ranking assigned after sorting by specified field (total_amount or total_bookings)
- Results limited to top N agents (default: 10)

---

## Common Features

### ✅ General Rules
- All endpoints require authentication (JWT token)
- Consistent response format: `{ "message": string, "data": object }`
- Default date range: current month (if not specified)
- All monetary amounts in PKR (Pakistani Rupees)

### ✅ Permission-Based Filtering
- **Organization Admin**: Can see all agents and branches in their organization
- **Branch Manager**: Can only see their branch data
- **Agent**: Can only see their own data

### ✅ Performance Optimizations
- Uses Django ORM `.annotate()`, `Sum()`, `Count()` for efficient aggregation
- Avoids for-loops by using query-level aggregation
- Uses `select_related()` to reduce database hits
- All queries filtered by date range and organization

### ✅ Swagger Documentation
All endpoints are fully documented in Swagger UI with:
- Parameter descriptions and examples
- Request/response schemas
- Success and error response codes
- Interactive testing capability

---

## Usage Examples

### Example 1: Get Sales Summary for November 2025
```bash
GET /api/v1/reports/sales-summary/?organization_id=1&date_from=2025-11-01&date_to=2025-11-30
Authorization: Bearer <your_jwt_token>
```

### Example 2: Get Financial Summary
```bash
GET /api/v1/reports/financial-summary/?organization_id=1
Authorization: Bearer <your_jwt_token>
```

### Example 3: Get Top 5 Sellers by Amount
```bash
GET /api/v1/reports/top-sellers/?organization_id=1&limit=5&sort_by=total_amount
Authorization: Bearer <your_jwt_token>
```

### Example 4: Get Agent-Specific Sales Report
```bash
GET /api/v1/reports/sales-summary/?organization_id=1&agent_id=101&date_from=2025-01-01&date_to=2025-12-31
Authorization: Bearer <your_jwt_token>
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "organization_id is required",
  "data": null
}
```

### 404 Not Found
```json
{
  "message": "Organization not found",
  "data": null
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Database Models Used

### Booking Model
- `total_amount`, `payment_status`, `category`, `is_paid`
- `total_ticket_amount`, `total_hotel_amount`, `total_visa_amount`
- `total_transport_amount`, `total_food_amount_pkr`, `total_ziyarat_amount_pkr`
- `organization`, `branch`, `agency`, `created_at`, `expiry_time`

### LedgerEntry Model
- `transaction_amount`, `transaction_type` (debit/credit)
- `organization`, `seller_organization`, `booking`
- `remarks` (for settled/unsettled status)

### BookingHotelDetails Model
- `booking`, `total_nights`

### Organization, Branch, Agency Models
- Basic relationship data

---

## Testing

Access Swagger UI at: `http://your-domain/api/schema/swagger-ui/`

Search for "Reports Module" to find all three endpoints with interactive testing capabilities.

---

## Notes

- **Caching**: Heavy reports can be cached for 10-15 minutes using Redis (optional implementation)
- **Export**: CSV export functionality can be added for all reports
- **Scheduling**: Reports can be auto-generated via cron jobs for periodic updates
- **Permissions**: Role-based filtering is partially implemented; can be enhanced with custom permission classes

---

## Future Enhancements

1. **CSV Export**: Add export functionality for all reports
2. **Email Reports**: Schedule automatic email delivery
3. **Dashboard Widgets**: Create visual charts for reports
4. **Comparison Reports**: Year-over-year, month-over-month comparisons
5. **Custom Date Ranges**: Quarterly, yearly preset options
6. **Advanced Filters**: Multiple agents, categories, payment statuses
7. **Redis Caching**: Implement caching for performance
8. **PDF Generation**: Generate PDF reports with charts

---

## Support

For issues or questions, contact the development team or refer to the main API documentation.
