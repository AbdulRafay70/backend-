# Extracted Requirements from SAER.PK PENDINg.docx

Kuickpay apis 

Logs api

Public api to see vocher details like it is approved or no or which things included in this vocher. Qr code scan system.

Group and permission api

Customer side web page handling like taking booking then delivering order of booking follow up that client.

COMMISSION OF BRACH FROM AGENT AND AREA AGENT AND CUSTOMERS_Branch commissions from umrah packages,hotels and tickets see everything of commissions 

Hotel outside sourcing (like where from i purchase this hotel hotel name,room no,room type,room price, room quantity etc.)

All agent can see movement of there pex (for example in makkah,madina or jeddah)

Get all prices apis some updates

🧾 LEDGER AUTO CREATION SYSTEM – FINAL STRUCTURE

⚙️ Auto Create Rule

Whenever a booking is marked as “Paid” →System will auto-create a ledger transaction between the respective parties,based on booking ownership and payment flow.

🔹 LEDGER ENTRY FORMAT (for every auto/post/manual record)

Field

Description

creation_datetime

Auto set (timezone aware)

booking_no

Booking reference (auto from booking table)

service_type

ticket / umrah / hotel / transport / package / payment / refund

narration

Text summary (e.g., “Advance payment for Umrah Booking #SK1234”)

transaction_type

debit or credit

seller_organization_id

Organization who owns the inventory

inventory_owner_organization_id

Owner org of that inventory item (auto detect from item)

area_agent_id

if booking linked with area agent

agency_id

if created by an agent

branch_id

if created under branch

payment_ids

list of all linked payment records

group_ticket_: total number

if multiple tickets are in group booking

umrah_visa : total number

if Umrah visa included

hotel_nights : total number

all hotels involved with this booking

final_balance : 

auto-calc from (total paid - total due)

internal_notes ids 

array of internal notes text only (example below)

Internal Notes Example (text format):

[2025-10-17 11:24] Payment received via Bank Alfalah.

[2025-10-17 11:25] Commission auto-posted to agent.

[2025-10-17 11:26] Linked with Umrah package #U245.

🔹 GET ENDPOINTS (5 LEDGER LEVELS)

1️⃣     Organization Ledger (with all its branches & linked orgs)GET /api/ledger/organization/<organization_id>/→ shows all transactions related to that organization and its branches.

2️⃣     Branch LedgerGET /api/ledger/branch/<branch_id>/→ shows all transactions between branch ↔ organization / agents.

3️⃣     Agency LedgerGET /api/ledger/agency/<agency_id>/→ shows all transactions between agent ↔ branch / organization.

4️⃣      Area Agency LedgerGET /api/ledger/area-agency/<area_agency_id>/→ shows all transactions between area agency ↔ organization.

5️⃣    Organization-to-Organization LedgerGET /api/ledger/org-to-org/<org1_id>/<org2_id>/→ shows receivable/payable summary and full transaction history between two companies.

🧮 Auto Posting Logic

Condition

Debit

Credit

Narration Example

Agent booked inventory owned by Saer.pk

Agent

Saer.pk

“Agent payment for ticket booking”

Branch booked inventory owned by Saer.pk

Branch

Saer.pk

“Branch booking settlement”

Area Agent got commission

Saer.pk

Area Agent

“Area commission for booking”

Organization A using inventory of Organization B

Org A

Org B

“Inventory share settlement”

Refund issued

Saer.pk

Agent / Customer

“Refund for cancelled booking”

🏨 HOTEL & INVENTORY LINK RULE

Each booking item (hotel, ticket, transport, etc.) must have:

"inventory_owner_organization_id": 12

📘 How it works:

System auto-detects who owns that item.

When booking is paid, ledger auto creates between buyer org and owner org.

If multiple hotels belong to different owners, separate ledger entries auto-created for each.

🧠 Example:

Booking has 2 hotels —Hotel A (owned by Saer.pk) and Hotel B (owned by Al Madina Group).

When booking is paid →One ledger entry creates Saer.pk ↔ AgentAnother ledger entry creates Al Madina ↔ Saer.pk (as reseller flow).

🚫 What NOT to do (important rules)

❌ Don’t allow manual change in:

inventory_owner_organization_id

booking_no

linked payment IDsBecause this breaks the auto-balance logic and audit trail.

❌ Don’t allow double posting:

Once booking marked “Paid”, one ledger entry per service type.

Any later changes should be adjustment entries, not overwrite.

❌ Don’t allow cross-ledger updates manually:

If one org → another org, both sides should sync auto, not manually edited.

🧩 Summary for Developer

Ledger table auto-created on booking “paid” status.

Must handle multiple parties (Org, Branch, Agent, Area Agent).

5 GET endpoints for viewing by level.

Internal notes stored as text array.

inventory_owner_organization_id is key to all cross-company calculations.

Currency (SAR/PKR) handled at auto conversion level.

Receivable/payable summary auto-calculated using debit-credit.

API: GET /api/agents/pending-balances

Purpose:Yeh API un sab agents ki list deti hai jinka final balance minus mein hai (i.e. company ke against outstanding amount hai).System organization-wise data fetch karega.(all agency and area agency)

Request:

GET /api/agents/pending-balances?organization_id={organization_id}

Query Parameters:

Field

Type

Required

Description

organization_id

     string

✅

Jis organization ke agents ka data chahiye

Response (200 OK):

{

  "organization_id": "ORG12345",

  "organization_name": "Saer.pk",

  "total_pending_agents": 5,

  "agents": [

    {

      "agent_id": "AGT001",

      "agency_name": "Star Travel",

      "agent_name": "Ahmed Raza",

      "contact_no": "+92 300 1234567",

      "pending_balance": -25000,

      "internal_note_ids": MULTIPLE IDS    },

    {

      "agent_id": "AGT002",

      "agency_name": "Umrah Express",

      "agent_name": "Ali Khan",

      "contact_no": "+92 333 9876543",

      "pending_balance": -12000,

      "internal_note_ids": ["NOTE125"]

    }

  ]

}

Logic:

System ledger table se saare agents ka final_balance check karega.

Jo agents ka final_balance < 0 hai unko list karega.

Data organization_id ke basis par filter hoga.

internal_note_ids optional array hai (agar koi internal note linked hai).

API: GET /api/final-balance

Purpose:Yeh API kisi bhi agent, area agent, organization, ya branch ka final balance return karti hai (ledger ke base par total debit-credit summary).

Request:

GET /api/final-balance?type={type}&id={id}

Query Parameters:

Field

Type

Required

Description

type

string

✅

"agent", "area_agent", "organization", or "branch"

id

string

✅

ID of the respective entity (e.g. agent_id, branch_id, etc.)

Response (200 OK):

{

  "type": "agent",

  "id": "AGT001",

  "name": "Ahmed Travels",

  "total_debit": 250000,

  "total_credit": 230000,

  "final_balance": 20000,

  "currency": "PKR",

  "last_updated": "2025-10-17T10:30:00Z"

}

Logic:

System ledger entries se total debit aur credit calculate karega.

final_balance = total_debit - total_credit

Positive balance → organization ke favour mein.

Negative balance → agent/branch ne pay karna hai.

Data real-time ledger ke according auto update hoga.

🧩 1️⃣   Universal Register API

API Name:

POST /universal/register

Request Body:

{

  "id": "auto-generate",

  "type": "organization | branch | agent | employee",

  "parent_id": "ID of parent (organization/branch)",

  "name": "string",

  "email": "string",

  "phone": "string",

  "cnic_front": "file/url",

  "cnic_back": "file/url",

  "address": "string",

  "city": "string",

  "visiting_card": "file/url",

  "dts_license": "file/url", (FILES ATTACHEDMENT IS NOT REQUIRED)

  "created_at": "auto",

  "updated_at": "auto"

}

Required Endpoints:

Method

Endpoint

Purpose

POST

/universal/register

Create new record (organization / branch / agent / employee)

GET

/universal/list?type=agent

Get all agents

GET

/universal/list?type=branch

Get all branches

GET

/universal/list?type=employee

Get all employees

PUT

/universal/update/{id}

Update record details

DELETE

/universal/delete/{id}

Delete record

Logic & Relationship Rules:

type and parent_id define hierarchy.

If type = branch, → parent_id must be an organization.

If type = agent, → parent_id must be a branch.

If type = employee, → parent_id can be either organization or branch.

 2️⃣    Registration Rules Table (Dynamic Guidelines)

Table Fields:

Field

Type

Description

id

string

Auto-generated

type

string

"agent", "employee", "branch"

requirement_text

string

Registration requirements

benefit_text

string

Benefits of registration

city_needed

string

Required only for branch (optional)

service_allowed

string

Allowed services (for agent, optional)

post_available

string

Post options (for employee, optional)

created_at

datetime

Auto

updated_at

datetime

Auto

Intimation api exit and entry report of umrah pex

•Jab bhi agent booking API se koi passenger add hota hai/ BOOKING PAID HOTI HAI → system usko automatically “checkpoint” bana dega.

•Uske baad agar flight update hoti hai to system entry/exit track karega.

•Har pax ka status hamesha clear rahega:

•In Pakistan

•Entered KSA

•In KSA

•Exited KSA (verified / not verified)

In Makkah 

Madina 

Jeddah

OR ANY OTHER CITY IF DATA IS AVAILABLE

⸻

🔹 Database Design (short version)

pax_movements

1.id

Flight ki ful details Kb ja raha AUR kb wapis a raha hai

2.pax_id (linked to booking)

Pex passport info

3.flight_no

4.departure_airport

5.arrival_airport

6.departure_time AND DATE

7.arrival_time AND DATE

8.status (in_pakistan, entered_ksa, in_ksa, exited_ksa, exit_pending)

9.verified_exit (true/false)

Organisation 

10.agent_id

11.created_at

12.updated_at

13. Is this reported to shirka yes or no (this will change to auto no if agnet update data of flight of any dep or return flight.)

⸻

🔹 API Endpoints

1.POST /booking/create

•Create booking & auto generate pax movement checkpoint.

2.PUT /pax-movement/update/{id}

•Update flight info (entry/exit).

•If new flight → update status accordingly.

3.GET /pax-movement/status/{id}

•Return pax status (in Pakistan, in KSA, exited, etc).

4.GET /pax-movement/summary

•Returns total counts:

•how many in Pakistan

•how many in KSA

. HOW MANY IN MAKKAH AND MADINA AND OR ANY OTHER CITY IF DATA AVAILABLE

•how many exited

5.POST /pax-movement/verify-exit/{id}

•Admin manually checks system (PNR/exit report) → confirm exit or reject.

6.POST /pax-movement/notify-agent

•If pax not exited as claimed → send auto notification to agent to update flight info.

⸻

🔹 Example Workflow

1.Agent books → POST /booking/create → pax created in pax_movements with status = in_pakistan.

2.Flight update entry KSA → status = entered_ksa then in_ksa.

3.Return flight update → status = exit_pending.

4.Admin verifies → if yes → status = exited_ksa + verified_exit=true.

5.If no → system auto → notify_agent.

📊 REPORTS MODULE API STRUCTURE (DJANGO REST FRAMEWORK)

1️⃣    Sales Counting Report API

Endpoint:GET /api/v1/reports/sales-summary/

Query Params:

date_from → Start date (YYYY-MM-DD)

date_to → End date (YYYY-MM-DD)

organization_id → Required (for which company report is needed)

agent_id → Optional (filter)

branch_id → Optional (filter)

Output Fields:

{

  "total_bookings": 0,

  "total_group_bookings": 0,

  "total_ticket_bookings": 0,

  "total_umrah_bookings": 0,

  "total_visa_bookings": 0,

  "total_hotel_nights": 0,

  "total_transport_bookings": 0,

  "total_food_bookings": 0,

  "total_ziyarat_bookings": 0,

  "total_paid_orders": 0,

  "total_unpaid_orders": 0,

  "total_expired_orders": 0,

  "total_amount": 0,

  "total_paid_amount": 0,

  "total_unpaid_amount": 0,

  "total_expired_amount": 0,

  "agent_wise_summary": [

    {

      "agent_id": 101,

      "agent_name": "Saer.pk Islamabad Agent",

      "total_orders": 45,

      "paid_orders": 32,

      "unpaid_orders": 13,

      "total_sales_amount": 1200000,

      "paid_sales_amount": 850000,

      "service_breakdown": {

        "umrah": { "count": 10, "amount": 400000 },

        "visa": { "count": 8, "amount": 150000 },

        "tickets": { "count": 20, "amount": 350000 },

        "hotel": { "nights": 45, "amount": 200000 }

      }

    }

  ]

}

Calculation Rules:

From Booking table:

total_bookings = COUNT(all bookings)

total_ticket_bookings, etc. = COUNT filtered by category

total_amount = SUM(total_amount)

total_paid_amount = SUM(total_amount WHERE payment_status = "paid")

From Ledger (optional for precision):

Adjust final_amount where ledger entries exist for same booking_id

For total_hotel_nights:

SUM of hotel_booking.total_nights in same date range

Apply date_from, date_to on booking_date / created_at

Filter by org, agent, branch accordingly.

2️⃣   Financial / Ledger Summary Report API

Endpoint:GET /api/v1/reports/financial-summary/

Query Params:

organization_id → Required

Output Fields:

{

  "organization_id": 202,

  "total_receivable_amount": 540000,

  "total_payable_amount": 380000,

  "receivable_settled_amount": 350000,

  "receivable_unsettled_amount": 190000,

  "payable_settled_amount": 250000,

  "payable_unsettled_amount": 130000,

  "net_balance": 160000,

  "by_counterparty": [

    {

      "organization_id": 303,

      "organization_name": "FlyWorld Travels",

      "receivable": 90000,

      "payable": 40000

    }

  ],

  "by_agent": [

    {

      "agent_id": 101,

      "agent_name": "Ahmad Tours",

      "receivable": 150000,

      "payable": 30000

    }

  ]

}

Calculation Rules (short):

Receivable:SUM(amount) from Ledger where to_company_id = organization_id

Payable:SUM(amount) from Ledger where from_company_id = organization_id

Net Balance:total_receivable_amount - total_payable_amount

Settled / Unsettled split:Based on status = settled / pending

By Counterparty:Group by organization_id and aggregate receivable/payable

By Agent:Group by agent_id and aggregate receivable/payable

3️⃣   Top Seller (Agent-Wise) Report API

Endpoint:GET /api/v1/reports/top-sellers/

Query Params:

date_from → optional

date_to → optional

organization_id → required

limit → optional (default = 10)

sort_by → total_amount or total_bookings

Output Fields:

[

  {

    "agent_id": 101,

    "agent_name": "Ahmad Tours",

    "total_bookings": 48,

    "total_amount": 1250000,

    "categories": [

      { "category": "ticket", "count": 20, "amount": 400000 },

      { "category": "umrah", "count": 12, "amount": 500000 },

      { "category": "visa", "count": 6, "amount": 150000 },

      { "category": "hotel", "count": 10, "amount": 200000 }

    ],

    "ranking": 1

  }

]

Calculation Logic:

From Booking:

Group by agent_id

Count total bookings per agent

Sum total_amount per agent

Group again by (agent_id, category) for category breakdown.

Ranking logic:

Sort by total_amount (or total_bookings) descending.

Assign ranking field sequentially.

Filter optional: by organization, by date range, by booking status (only paid).

Common Rules for All Reports

✅ General

Must support filters by organization_id, branch_id, agent_id, date_from, date_to

Default date range → current month

Return data in consistent structure with status, message, and data

✅ Performance

Use .annotate() and Sum(), Count() for aggregation.

Avoid for-loops; aggregate at query level.

Always select_related('agent', 'organization') to reduce DB hits.

✅ Pagination

Only for large list APIs like top sellers (limit, offset)

✅ Permissions

Org admin → see all their agents + branches

Branch → see their own data only

Agent → see self only

✅ Optional Caching

Cache heavy reports (e.g. sales-summary, financial-summary) for 10–15 min with Redis.

✅ Auto Update

Whenever booking/ledger changes, update computed fields next cron or on-demand (via recalculation function).

🔄 Example Model References

Booking → id, agent_id, organization_id, category, total_amount, payment_status, created_at

Ledger → from_company_id, to_company_id, amount, status, transaction_type

Agent → id, name, branch_id, organization_id

Organization → id, name, type

🧭 DAILY OPERATIONS MANAGEMENT APIS

🔹 Common Rules:

Sab APIs date filter ke sath kaam karein: ?date=YYYY-MM-DD

Har service mein status update ho sakta hai: pending / started / completed / canceled

Har record mein pax_id, first_name, last_name, booking_id mandatory.

Clicking on a pax name → GET full pax details (separate endpoint at the end).

1️⃣    HOTEL CHECK-IN / CHECK-OUT API

GET /daily/hotels

Get all today’s hotel check-ins or check-outs.

Query Params:?date=YYYY-MM-DD&type=checkin / checkout

Response Example:

{

  "date": "2025-10-17",

  "hotels": [

    {

      "booking_id": "BKG-101",

      "Contact no of family head": "+92300-0709017",

      "hotel_name": "Hilton Makkah",

      "city": "Makkah",

      "check_in": "2025-10-17",

      "check_out": "2025-10-20",

      "status": "checked_in / pending / checked_out",

      "pax_list": [

        {

          "pax_id": "PAX001",

          "first_name": "Ali",

          "last_name": "Raza",

         "Contact no of pex": "+92300-0709017",

          "room_no": "204",

          "bed_no": "B1"

        }

      ]

    }

  ]

}

PUT /daily/hotel/update-status

Update check-in / check-out status.

{

  "booking_id": "BKG-101",

  "pax_id": "PAX001",

  "status": "checked_in / checked_out / pending",

  "updated_by": "EMP-12"

}

2️⃣   ZIYARAT MANAGEMENT API

GET /daily/ziyarats

Get today’s scheduled ziyarats list.

{

  "date": "2025-10-17",

  "ziyarats": [

    {

      "booking_id": "BKG-101",

      "location": "Uhud Mountain",

      "pickup_time": "08:00 AM",

      "status": "pending / started / completed / canceled",

      "pax_list": [

        { "pax_id": "PAX001", "first_name": "Ali", "last_name": "Raza", "contact no": "+923000709017" }

      ]

    }

  ]

}

PUT /daily/ziyarats/update

{

  "booking_id": "BKG-101",

  "pax_id": "PAX001",

  "status": "completed / pending / canceled / not_picked",

  "updated_by": "EMP-12"

}

3️⃣   TRANSPORT MANAGEMENT API (City or Intercity Transfers)

GET /daily/transport

Get all today’s transport jobs (pickup/drop between hotels or cities).

{

  "date": "2025-10-17",

  "transports": [

    {

      "booking_id": "BKG-101",

      "pickup": "Makkah Hotel",

      "drop": "Madinah Hotel",

      "vehicle": "Hiace",

      "driver_name": "Abdullah",

      "status": "departed / arrived / pending",

      "pax_list": [

        { "pax_id": "PAX001", "first_name": "Ali", "last_name": "Raza", "contact no": "+923000709017" }

      ]

    }

  ]

}

PUT /daily/transport/update

{

  "booking_id": "BKG-101",

  "pax_id": "PAX001",

  "status": "departed / arrived / pending / canceled",

  "updated_by": "EMP-12"

}

4️⃣   AIRPORT PICKUP / DROP API

GET /daily/airport

For all pickups/drops (based on flight timings).

{

  "date": "2025-10-17",

  "airport_transfers": [

    {

      "booking_id": "BKG-101",

      "transfer_type": "pickup / drop",

      "flight_number": "SV802",

      "flight_time": "15:30",

      "pickup_point": "Jeddah Airport",

      "drop_point": "Makkah Hotel",

      "status": "waiting / departed / arrived",

      "pax_list": [

        { "pax_id": "PAX001", "first_name": "Ali", "last_name": "Raza", "contact no": "+923000709017" }

      ]

    }

  ]

}

PUT /daily/airport/update

{

  "booking_id": "BKG-101",

  "pax_id": "PAX001",

  "status": "waiting / departed / arrived / not_picked",

  "updated_by": "EMP-12"

}

5️⃣   FOOD MANAGEMENT API

GET /daily/food

Get all meals for today.

{

  "date": "2025-10-17",

  "meals": [

    {

      "booking_id": "BKG-101",

      "meal_type": "Dinner",

      "time": "08:00 PM",

      "menu": "Biryani + Raita",

      "location": "Makkah Hotel",

      "status": "served / pending",

      "pax_list": [

        { "PAX001", "first_name": "Ali", "last_name": "Raza", "contact no": "+923000709017" }

      ]

    }

  ]

}

PUT /daily/food/update

{

  "booking_id": "BKG-101",

  "pax_id": "PAX001",

  "status": "served / pending / canceled",

  "updated_by": "EMP-12"

}

6️⃣   GET PAX FULL DETAILS

GET /pax/details/{pax_id}

Get full details of one pax when clicked.

{

  "pax_id": "PAX001",

  "first_name": "Ali",

  "last_name": "Raza",

  "passport_no": "AB123456",

  "family_no": "FAM-20",

  "booking_id": "BKG-101",

  "package_type": "Umrah",

  "flight": {

    "departure": "LHE",

    "arrival": "JED",

    "flight_time": "2025-10-17 15:30"

  },

  "hotel": [

    { "name": "Hilton Makkah", "check_in": "2025-10-17", "check_out": "2025-10-20" }

  ],

  "transport": [

    { "pickup": "Airport", "drop": "Hotel", "status": "completed" }

  ],

  "ziyarats": [

    { "location": "Uhud", "status": "completed" }

  ],

  "food": [

    { "meal_type": "Dinner", "status": "served" }

  ]

}

🧠 Backend Logic Notes

Date filter is must → default = today.

Every update auto-syncs to the main booking table.

Pax details show combined data from all modules.

All modules independent (hotel / ziyarats / transport / airport / food) → but connected by booking_id + pax_id.

Airport transfers use flight_time for coordination.

Must show family head contact number when we get data 

API: Get All Unpaid Orders

Endpoint:GET /api/bookings/unpaid

Description:Fetches all unpaid bookings (of all agents or clients under that organization) that are still active (not expired).it simply returns all unpaid orders with pending balance > 0.

Response Example

{

  "total_unpaid": 2,

  "unpaid_bookings": [

    {

      "booking_id": 101,

      "booking_no": "INV-101",

      "customer_name": "Ali Raza",

      "contact_number": "+92-300000000",

      "total_amount": 250000,

      "paid_payment": 50000,

      "pending_payment": 200000,

      "expiry_time": "2025-09-30T23:59:00Z",

      "agent_id": 12,

      "status": "unpaid",

      "call_status": false,

      "client_note": null

    },

    {

      "booking_id": 102,

      "booking_no": "INV-102",

      "customer_name": "Fatima",

      "contact_number": "+92-300111111",

      "total_amount": 180000,

      "paid_payment": 0,

      "pending_payment": 180000,

      "expiry_time": "2025-09-28T23:59:00Z",

      "agent_id": 15,

      "status": "unpaid",

      "call_status": true,

      "client_note": "Customer will pay tomorrow"

    }

  ]

}

Unpaid order api

🔹 API 1: Get Unpaid Orders

GET /api/bookings/unpaid/org id 

Response Example

{

  "total_unpaid": 2,

  "unpaid_bookings": [

    {

      "booking_id": 101,

      "booking_no": "INV-101",

      "customer_name": "Ali Raza",

      "contact_number": "+92-300000000",

      "total_amount": 250000,

      "paid_payment": 50000,

      "pending_payment": 200000,

      "expiry_time": "2025-09-30T23:59:00Z",

      "agent_id": 12,

      "status": "unpaid",

      "call_status": false,

      "client_note": null

    },

    {

      "booking_id": 102,

      "booking_no": "INV-102",

      "customer_name": "Fatima",

      "contact_number": "+92-300111111",

      "total_amount": 180000,

      "paid_payment": 0,

      "pending_payment": 180000,

      "expiry_time": "2025-09-28T23:59:00Z",

      "agent_id": 15,

      "status": "unpaid",

      "call_status": true,

      "client_note": "Customer will pay tomorrow"

    }

  ]

}

Logic / Filters

✅ status = unpaid

✅ pending_payment > 0

✅ expiry_time >= current_date (exclude expired)

✅ or_id → filter by organization

✅ Include all related agents & clients under the given organization_id

Unpaid order api

🔹 API 1: Get Unpaid Orders

GET /api/bookings/unpaid/org id 

Response Example

{

  "total_unpaid": 2,

  "unpaid_bookings": [

    {

      "booking_id": 101,

      "booking_no": "INV-101",

      "customer_name": "Ali Raza",

      "contact_number": "+92-300000000",

      "total_amount": 250000,

      "paid_payment": 50000,

      "pending_payment": 200000,

      "expiry_time": "2025-09-30T23:59:00Z",

      "agent_id": 12,

      "status": "unpaid",

      "call_status": false,

      "client_note": null

    },

    {

      "booking_id": 102,

      "booking_no": "INV-102",

      "customer_name": "Fatima",

      "contact_number": "+92-300111111",

      "total_amount": 180000,

      "paid_payment": 0,

      "pending_payment": 180000,

      "expiry_time": "2025-09-28T23:59:00Z",

      "agent_id": 15,

      "status": "unpaid",

      "call_status": true,

      "client_note": "Customer will pay tomorrow"

    }

  ]

}

🔹 API 2: Add Call Remarks (Update Booking Call Status)

POST /api/bookings/unpaid/remarks

Request Body

{

  "booking_id": 101,

  "call_status": true,

  "Internal remarks (multiples ids 

)

  "created_by": 7

}

🔹 Kaise Kaam Karega

1.GET /unpaid → system booking table me se payment_status = unpaid ya pending_payment > 0 filter karega.

2.POST /unpaid/remarks → call agent remarks add karega aur call_status update karega.

3.Baad me reports me aap dekh sakte ho kis customer ko kitni baar call hui aur kya reply mila.

Agency Profile API (Relationship & Work Overview)

Endpoint:GET /api/agency/profile?agency_id=123

Notes for Dev:This API will return the complete relationship profile of any agency, including behavior, work status, and history.

Response Structure Example:

{

  "agency_id": 123,

  "agency_name": "Al Saer Travels",

  "contact_person": "Ahmed Khan",

  "contact_number": "+92-300000000",

  "relationship_status": "active", 

  "relation_history": [

    {

      "date": "2025-10-15",

      "type": "discussion",

      "note": "Talked about new Umrah rates"

    },

    {

      "date": "2025-09-20",

      "type": "conflict",

      "note": "Delayed payment for 2 weeks"

    }

  ],

  "working_with_companies": [

    {

      "organization_id": 1,

      "organization_name": "Saer.pk",

      "work_type": ["Umrah Packages", "Tickets"]

    },

    {

      "organization_id": 2,

      "organization_name": "Al Noor Travels",

      "work_type": ["Hotels", "Visa"]

    }

  ],

  "performance_summary": {

    "total_bookings": 85,

    "on_time_payments": 79,

    "late_payments": 6,

    "disputes": 1,

    "remarks": "Overall good performance, some delay in payments."

  },

  "recent_communication": [

    {

      "date": "2025-10-10",

      "by": "Admin",

      "message": "Confirmed next Umrah batch."

    }

  ],

  "conflict_history": [

    {

      "date": "2025-08-25",

      "reason": "Misunderstanding over refund",

      "resolved": true

    }

  ]

}

Purpose:– To view agency behavior, performance, and communication history.– To check which organizations the agency works with and how the relationship is going.– Helps admin/team know if the agency is reliable, problematic, or improving.

POST API — Add / Update Agency Profile Details

Endpoint:POST /api/agency/profile

Purpose:To add or update complete relationship information of an agency — including their work history, communication, conflicts, and associated companies.

🧩 Request Body Example

{

  "agency_id": 123,

  "relationship_status": "active", 

  "relation_history": [

    {

      "date": "2025-10-17",

      "type": "discussion",

      "note": "Talked about upcoming Umrah package commission"

    },

    {

      "date": "2025-09-28",

      "type": "meeting",

      "note": "Met in office, discussed hotel rates"

    }

  ],

  "working_with_companies": [

    {

      "organization_id": 1,

      "organization_name": "Saer.pk",

      "work_type": ["Tickets", "Hotels"]

    },

    {

      "organization_id": 3,

      "organization_name": "FlySmart Travels",

      "work_type": ["Visa", "Umrah Packages"]

    }

  ],

  "performance_summary": {

    "total_bookings": 90,

    "on_time_payments": 85,

    "late_payments": 5,

    "disputes": 0,

    "remarks": "Active and responsive agent with good market relationship"

  },

  "recent_communication": [

    {

      "date": "2025-10-16",

      "by": "Admin",

      "message": "Shared new Umrah package details"

    }

  ],

  "conflict_history": [

    {

      "date": "2025-08-12",

      "reason": "Late commission clearance",

      "resolved": true,

      "resolution_note": "Payment cleared within 3 days"

    }

  ]

}

✅ Response Example

{

  "success": true,

  "message": "Agency profile updated successfully",

  "updated_profile": {

    "agency_id": 123,

    "relationship_status": "active"

  }

}

⚙️ Dev Notes

If agency_id exists → update existing record.

If not → create a new agency profile.

Auto-track created_by, updated_by, and timestamps.

Future scope:

Add auto-sync with booking and payment APIs to auto-update performance.

Add filter for relationship_status (active, inactive, risky, dispute, etc.).

Option to upload documents or screenshots as evidence for disputes or meetings.

1. API — Hotel Availability with Map

Endpoint:GET /api/hotels/availability?hotel_id=123&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD

Purpose:To fetch hotel availability (rooms, beds, floors, maps) with occupied/available status based on bookings.

Response Example

{

  "hotel_id": 123,

  "hotel_name": "Hilton Makkah",

  "total_rooms": 120,

"total_quint-rooms": 120,

"total_quad-rooms": 120,

"total_Triple-rooms": 120,

"total_double-rooms": 120,

  "available_rooms": 35,

 "available_beds": 35,

"available_sharing-beds": 35,

 "available_quint-rooms": 35,

 "available_quad-rooms": 35,

"available_Triple-rooms": 35,

"available_double-rooms": 35,

  "occupied_rooms": 85,

  "floors": [

    {

      "floor_no": 1,

      "floor_map_url": "https://cdn.saer.pk/maps/floor_1.png",

      "rooms": [

        {

          "room_id": 101,

          "room_no": "101",

          "room_type": "Double",

          "capacity": 2,

          "available_beds": 0,

          "status": "occupied",

          "current_booking_id": 5023,

          "guest_names": ["Ali Raza", "Ahmed Khan"],

          "checkin_date": "2025-10-17",

          "checkout_date": "2025-10-20"

        },

        {

          "room_id": 102,

          "room_no": "102",

          "room_type": "Triple",

          "capacity": 3,

          "available_beds": 1,

          "status": "partially_occupied",

          "current_booking_id": 5024,

          "guest_names": ["Usman"],

          "checkin_date": "2025-10-17",

          "checkout_date": "2025-10-21"

        }

      ]

    }

  ]

}

🧩 2. API — Assign Room/Bed to Pax

Endpoint:POST /api/hotels/assign-room

Purpose:To assign a pax (passenger) to a room or specific bed and update hotel map availability instantly.

Request Body Example

{

  "booking_id": 5024,

  "hotel_id": 123,

  "pax_id": 987,

  "room_id": 102,

  "bed_no": 2,

  "assigned_by": "admin_001",

  "checkin_date": "2025-10-17",

  "checkout_date": "2025-10-21"

}

Response Example

{

  "success": true,

  "message": "Room assigned successfully",

  "assigned_details": {

    "room_id": 102,

    "room_no": "102",

    "bed_no": 2,

    "pax_id": 987,

    "hotel_id": 123,

    "status": "occupied"

  }

}

🧩 3. API — Room & Bed Map Management (Admin Panel)

Endpoint:POST /api/hotels/room-map

Purpose:To create or update floor/room/bed layout with map image and coordinates.

Request Body Example

{

  "hotel_id": 123,

  "floor_no": 2,

  "floor_map_url": "https://cdn.saer.pk/maps/floor_2.png",

  "rooms": [

    {

      "room_no": "201",

      "room_type": "Quad",

      "capacity": 4,

      "beds": [

        { "bed_no": 1, "status": "available" },

        { "bed_no": 2, "status": "available" },

        { "bed_no": 3, "status": "available" },

        { "bed_no": 4, "status": "available" }

      ]

    },

    {

      "room_no": "202",

      "room_type": "Double",

      "capacity": 2,

      "beds": [

        { "bed_no": 1, "status": "available" },

        { "bed_no": 2, "status": "available" }

      ]

    }

  ]

}

🧩 4. Auto Availability Rules (Backend Logic)

Trigger

Action

New Booking Confirmed

Mark assigned rooms/beds as occupied

Checkout Completed

Auto change status to cleaning_pending

Cleaning Done

Change room/beds to available again

Booking Cancelled

Free the assigned room/beds instantly

Manual Override

Admin can set custom status manually (e.g., maintenance, reserved, etc.)

🧩 5. Booking Integration

When a booking is created with hotel_id, system auto-checks:

Room type availability

Dates overlap

Current room map

Assigns available rooms automatically if not assigned manually.

Keeps room_assignment under booking JSON:

"hotel_details": {

  "hotel_id": 123,

  "room_assignments": [

    { "pax_id": 987, "room_id": 102, "bed_no": 2 }

  ]

}

🧩 6. Auto Sync Points

/api/hotels/availability auto-syncs with:

/api/bookings (for active and future bookings)

/api/hotels/assign-room

Cron job updates status daily (check-ins / checkouts auto-refresh).

Jin orders ka balance payable hai un orders ki list har agnecy ki load ho one api.

🧩 1. API — Create / Update Rules (Terms & Conditions)

Endpoint:POST /api/rules/create

Purpose:Admin can create new rules or update existing ones, and define where they will be displayed (e.g. Booking Page, Agent Dashboard, Hotel Info Page, etc.)

Request Body Example

{

  "id": null,

  "title": "Umrah Booking Terms",

  "description": "All Umrah bookings are subject to advance payment and visa approval.",

  "rule_type": "terms_and_conditions",

  "pages_to_display": ["booking_page", "agent_portal"],

  "is_active": true,

  "language": "en",

  "created_by": "admin_001"

}

Response Example

{

  "success": true,

  "message": "Rule created successfully",

  "rule_id": 23

}

🧩 2. API — Get Rules

Endpoint:GET /api/rules/list?type=terms_and_conditions&page=booking_page

Purpose:Fetch rules dynamically based on where they need to be shown.

Response Example

{

  "rules": [

    {

      "id": 23,

      "title": "Umrah Booking Terms",

      "description": "All Umrah bookings are subject to advance payment and visa approval.",

      "pages_to_display": ["booking_page", "agent_portal"],

      "is_active": true

    },

    {

      "id": 24,

      "title": "Hotel Cancellation Policy",

      "description": "Cancellation within 24 hours of check-in is non-refundable.",

      "pages_to_display": ["hotel_page"],

      "is_active": true

    }

  ]

}

🧩 3. API — Update / Delete Rule

Endpoint:PUT /api/rules/update/{id}DELETE /api/rules/delete/{id}

PUT Request Example

{

  "title": "Updated Umrah Terms",

  "description": "Advance payment must be cleared within 48 hours after confirmation.",

  "pages_to_display": ["booking_page", "agent_portal"],

  "is_active": true

}

🧩 4. Dynamic Display Rules

Page / Section

Example Displayed Rules

booking_page

Payment, cancellation, change policies

agent_portal

Agent commissions, usage rights, lead policies

hotel_page

Check-in/out, refund, room policy

transport_page

Pickup, delay, liability rules

visa_page

Document, rejection, refund rules

🧩 5. Auto Behavior

When is_active = true, the rule automatically appears on assigned pages.

Frontend dynamically pulls from /api/rules/list?page={page_name}

Rules are versioned (keep history for compliance).

language field allows multilingual display (Urdu / English both).

Jin orders ka balance payable hai un orders ki list har agnecy ki load ho one api.

🏨 WALK-IN CUSTOMERS (HOTEL MANAGEMENT MODULE)

🔹 Purpose:

To manage customers who come directly to the hotel (not through online booking or agent).System should handle:

Booking / Check-in / Check-out

Room assignment

Price, discount, and profit tracking

Ledger + Organization earning

🔸 1. POST /api/walkin/create

Purpose: Create a new walk-in booking directly from the hotel panel.

Request Example:

{

  "hotel_id": 201,

  "organization_id": 10,

  "booking_type": "walk_in",

  "customer": {

    "name": "Ahmed Khan",

    "cnic": "35202-1234567-8",

    "phone": "+92-3121234567",

    "address": "Lahore, Pakistan"

  },

  "room_details": [

    {

      "room_id": 101,

      "room_no": "A-102",

      "bed_type": "double",

      "price_per_night": 8000,

      "discount": 500,

      "check_in": "2025-10-17T14:00:00Z",

      "check_out": "2025-10-18T12:00:00Z"

    }

  ],

  "advance_paid": 4000,

  "payment_mode": "cash",

  "remarks": "Late night check-in"

}

Auto Actions:

System auto-generates booking number (WALKIN-###).

Room status → changes to “Occupied”.

On check-out → room status auto → “Cleaning Pending”.

Ledger entry auto-created under that organization (debit: customer, credit: organization revenue).

🔸 2. GET /api/walkin/list

Purpose: Show all walk-in customers (active + completed).

Response Example:

{

  "total_walkin_bookings": 3,

  "walkins": [

    {

      "booking_no": "WALKIN-001",

      "customer_name": "Ahmed Khan",

      "room_no": "A-102",

      "check_in": "2025-10-17T14:00:00Z",

      "check_out": "2025-10-18T12:00:00Z",

      "status": "checked_in",

      "total_amount": 8000,

      "paid": 4000,

      "balance": 4000

    },

    {

      "booking_no": "WALKIN-002",

      "customer_name": "Fatima",

      "room_no": "B-201",

      "status": "checked_out",

      "total_amount": 6000,

      "paid": 6000,

      "profit": 1500

    }

  ]

}

🔸 3. PUT /api/walkin/update-status/{booking_id}

Purpose: Update check-in / check-out / cleaning status.

Request Example:

{

  "status": "checked_out",

  "checkout_time": "2025-10-18T12:30:00Z",

  "final_amount": 8200,

  "remarks": "Extra 200 charged for late checkout"

}

Auto Actions:

Ledger updates → credit organization, close booking balance.

Room auto becomes “Cleaning Pending”.

After cleaning confirmation → “Available” again.

🔸 4. GET /api/walkin/summary

Purpose: Show hotel’s profit/loss summary.

Response Example:

{

  "hotel_id": 201,

  "date": "2025-10-17",

  "total_rooms": 25,

  "occupied_rooms": 10,

  "available_rooms": 15,

  "total_sales": 85000,

  "total_expense": 20000,

  "profit": 65000

}

🔸 5. Auto Ledger Entry Logic

Event

Debit

Credit

Description

Booking Created

Customer

Organization

Booking payment receivable

Advance Paid

Cash

Customer

Advance payment received

Check-out

Customer

Organization

Balance cleared

Expense (cleaning, service)

Expense Account

Cash

Recorded as cost

Profit Summary

-

-

Auto from total sales - total expense

🔸 6. Optional Add-ons

✅ Add “walk-in” toggle in hotel availability API✅ Auto print mini invoice on check-out✅ Add filter: “Today Check-in / Today Check-out / In-house Guests”✅ Daily email or dashboard summary

🔒 7. Security & Ownership Rules

Walk-in booking always belongs to hotel’s inventory_owner_organization_id.

Cannot assign walk-in booking to external agency.

All payments stay internal under that organization’s ledger only.

📘 Profit, Loss & Expense Management (Full Module Overview)

🎯 Goal

To calculate and track profit, loss, and expenses for every service type — including Hotels, Visas, Transports, Tickets, and Umrah Packages — per organization, branch, and agent.

1️⃣   Data Structure (Database Design / JSON Format)

Main Table: financial_records

Each record represents a single transaction entry related to any module.

{

  "id": "auto_generated",

  "organization_id": "uuid",

  "branch_id": "uuid",

  "agent_id": "uuid",

  "module_type": "hotel | visa | transport | ticket | umrah_package",

  "booking_id": "uuid",

  "reference_no": "SAER-HTL-00125",

  "income_amount": 120000,

  "expense_amount": 85000,

  "profit_amount": 35000,

  "loss_amount": 0,

  "description": "Profit from Umrah hotel booking (Makkah Hilton)",

  "record_date": "2025-10-17",

  "created_by": "user_id",

  "last_updated_by": "user_id",

  "status": "active | archived"

}

2️⃣   Expense Management

Endpoint: POST /api/finance/expense/add

Used to add any type of expense linked to module or independent expense (like salary, maintenance, etc.)

{

  "organization_id": "uuid",

  "branch_id": "uuid",

  "expense_type": "hotel_cleaning | staff_salary | fuel | visa_fee | maintenance | other",

  "module_type": "hotel | visa | transport | ticket | umrah_package | general",

  "booking_id": "optional_uuid",

  "description": "Fuel cost for airport transfer vehicle",

  "amount": 4000,

  "payment_mode": "cash | bank | pending",

  "paid_to": "vendor_name",

  "expense_date": "2025-10-17"

}

3️⃣   Profit/Loss Auto Calculation (Backend Logic)

System will auto-record profit/loss whenever a booking is confirmed or updated.

Formula:

Profit = Total Selling Price - Total Purchase Cost - Total Expenses

Loss = If (Profit < 0) then abs(Profit)

All modules (Hotel, Visa, Transport, Ticket, Umrah) will send transaction data to financial_records table through internal API calls.

4️⃣    API Endpoints

✅ GET /api/finance/summary/all

Return full financial summary by organization, branch, or agent.

Query Params:

organization_id

branch_id

agent_id

module_type (optional)

Response:

{

  "organization_id": "uuid",

  "total_income": 12400000,

  "total_expense": 8700000,

  "total_profit": 3700000,

  "total_loss": 0,

  "breakdown_by_module": {

    "hotel": { "income": 5000000, "expense": 3000000, "profit": 2000000 },

    "visa": { "income": 2000000, "expense": 1600000, "profit": 400000 },

    "transport": { "income": 1000000, "expense": 700000, "profit": 300000 },

    "ticket": { "income": 4400000, "expense": 3400000, "profit": 1000000 }

  }

}

✅ GET /api/finance/ledger/by-service

Returns detailed transaction list for one module.

Query:

module_type=hotel&organization_id=uuid

Response:

{

  "records": [

    {

      "booking_id": "uuid",

      "reference_no": "SAER-HTL-00125",

      "income_amount": 120000,

      "expense_amount": 85000,

      "profit": 35000,

      "record_date": "2025-10-17",

      "agent_name": "Ahsan Travels"

    }

  ]

}

✅ GET /api/finance/expense/list

List all expenses by type or date.

Query Params:

organization_id

expense_type (optional)

start_date

end_date

5️⃣   Walk-in + Linked Booking

For walk-in customers (especially for hotel bookings):

Expense and income will auto-sync when checkout is marked “Done.”

Staff can manually adjust costs, taxes, or extra charges.

API will post data to financial_records.

6️⃣   Dashboard Summary

Show real-time:

Today’s Profit/Loss

This Week / This Month

By Module (Hotel, Ticket, etc.)

By Branch / Agent

7️⃣    Audit Trail

Every change in financial record (update, delete) should store:

{

  "action": "update",

  "old_value": { ... },

  "new_value": { ... },

  "updated_by": "user_id",

  "updated_at": "timestamp"

}

🧾 System Name:

Financial Bookkeeping & Tax Reporting System

🔹 Main Purpose:

Track every rupee movement (income, expense, transfer) for:

Each organization

Each branch

Each agent

Each booking type (ticket, hotel, Umrah, visa, transport)

And generate FBR-ready profit/loss + tax return reports

🔹 Core Modules

1. Chart of Accounts (COA)

All money movements are categorized:

Account Type

Examples

Assets

Cash in hand, bank account, receivables

Liabilities

Payables, customer advances

Income

Ticket sales, Umrah packages, hotel income

Expenses

Salaries, rent, transport fuel, commission

Equity

Owner capital, retained earnings

✅ Auto created per organization and branch.

2. Transactions Journal

Every event creates a journal entry (auto + manual allowed):

Structure

{

  "id": 1,

  "date": "2025-10-17",

  "organization_id": 101,

  "branch_id": 12,

  "description": "Umrah package booking by Agent X",

  "entries": [

    {"account": "Cash", "type": "debit", "amount": 200000},

    {"account": "Umrah Income", "type": "credit", "amount": 200000}

  ],

  "source_type": "booking/expense/manual",

  "source_id": 15001,

  "created_by": 2

}

✅ Auto entries generated from bookings, invoices, and payments.🧾 Manual entries allowed via /manual/posting for adjustments.

3. Branch Ledger

Tracks branch-wise transactions:

Auto-linked to organization COA.

Every branch has separate cashbook, bank ledger, and expense ledger.

Can filter by:

Date

Transaction type

Booking type

Profit/loss report view

4. Profit & Loss Engine (Auto)

System auto-calculates P&L per branch, per product, and per period.

Auto-calculation rule:

Profit = (Total Income + Adjustments) - (Total Expenses + Discounts + Commissions)

Endpoints

GET /reports/profit-loss?branch_id=12&month=2025-09

GET /reports/profit-loss?organization_id=101&year=2025

✅ Calculates:

Hotel profit/loss

Ticket profit/loss

Visa profit/loss

Umrah profit/loss

Transport profit/loss

5. Expense Management

Manual & recurring expenses supported.

Expense categories linked to chart of accounts.

Example:

{

  "type": "monthly_rent",

  "branch_id": 5,

  "amount": 45000,

  "date": "2025-10-01",

  "remarks": "October rent",

  "approved_by": 1

}

6. FBR Return & Tax Report

System auto-generates:

Sales Tax Summary

Income Tax Return Summary

Withholding Tax on payments

Yearly Profit Statement (for FBR)

Endpoint

GET /reports/fbr/summary?organization_id=101&year=2025

Auto Data Sources

All invoices (with tax fields)

Expenses (with tax %)

Payments (cross org or branch)

7. Audit Trail

Every entry → timestamp + user IDFull traceability for FBR audit.

API:

GET /audit/transactions?branch_id=12&date_from=...&date_to=...

8. Manual Posting & Adjustments

When something isn’t auto (like office renovation, manual cash transfer):

POST /manual/posting

{

  "date": "2025-10-15",

  "branch_id": 3,

  "debit_account": "Office Renovation Expense",

  "credit_account": "Cash",

  "amount": 120000,

  "description": "Renovation of Islamabad branch"

}

✅ Goes directly to ledger + auto reflected in reports.

🔹 Reporting APIs Summary

API

Purpose

GET /ledger/branch

View branch-wise transactions

GET /ledger/organization

Consolidated financial report

GET /reports/profit-loss

Profit & loss (branch/org level)

GET /reports/fbr/summary

Yearly FBR summary

GET /audit/transactions

Complete history for audit

POST /manual/posting

Add manual entries

GET /reports/balance-sheet

Assets, liabilities, equity report

🔹 Automation Summary

Task

Auto / Manual

Booking income posting

✅ Auto

Supplier payment

✅ Auto

Expense entry

⚙️ Manual

Bank deposit / withdrawal

⚙️ Manual

Profit calculation

✅ Auto

FBR tax summary

✅ Auto

Adjustments

⚙️ Manual (for corrections)

🧭 Module Name:

Passport Leads & Follow-up Management API

🔹 1️⃣    POST /passport-leads/create

➡️ Create a new passport lead (for branch or customer).

Request Body:

{

  "branch_id": 12,

  "organization_id": 101,

  "lead_source": "walk-in / facebook / agent",

  "customer_name": "Ali Raza",

  "customer_phone": "+92-3001234567",

  "cnic": "35202-1234567-1",

  "passport_number": "AB1234567",

  "city": "Lahore",

  "remarks": "Asked for Umrah package, said will decide in 2 days",

  "followup_status": "pending",

  "next_followup_date": "2025-10-18",

  "assigned_to": 5,

  "pending_balance": 50000,

  "pax_details": [

    {

      "first_name": "Ali",

      "last_name": "Raza",

      "age": 34,

      "gender": "male",

      "passport_number": "AB1234567",

      "nationality": "Pakistani"

    }

  ]

}

✅ Auto create PAX record linked with lead.

🔹 2️⃣   GET /passport-leads/list

➡️ Get all passport leads (with filters).

Query Params:

/passport-leads/list?branch_id=12&status=pending&date_from=2025-10-01&date_to=2025-10-31

Response Example:

{

  "total_leads": 3,

  "leads": [

    {

      "lead_id": 201,

      "customer_name": "Ali Raza",

      "customer_phone": "+92-3001234567",

      "passport_number": "AB1234567",

      "pending_balance": 50000,

      "followup_status": "pending",

      "next_followup_date": "2025-10-18",

      "remarks": "Interested in Umrah package",

      "branch_id": 12,

      "assigned_to_name": "Ahmed"

    }

  ]

}

🔹 3️⃣    GET /passport-leads/{lead_id}

➡️ Get full details of one lead + all PAX under it.

Response Example:

{

  "lead_id": 201,

  "customer_name": "Ali Raza",

  "customer_phone": "+92-3001234567",

  "pending_balance": 50000,

  "followup_status": "pending",

  "next_followup_date": "2025-10-18",

  "remarks": "Waiting for customer response",

  "pax_details": [

    {

      "pax_id": 1,

      "first_name": "Ali",

      "last_name": "Raza",

      "passport_number": "AB1234567",

      "gender": "male",

      "nationality": "Pakistani",

      "previous_bookings": [

        {"booking_id": 101, "type": "Umrah", "status": "completed"}

      ]

    }

  ]

}

✅ Each pax’s old booking & payment history auto loads.

🔹   4️⃣    PUT /passport-leads/update/{lead_id}

➡️ Update lead status, remarks, follow-up, or pending balance.

Request Example:

{

  "followup_status": "completed",

  "remarks": "Customer booked Umrah",

  "pending_balance": 0,

  "next_followup_date": null

}

✅ Auto linked with branch ledger — if pending balance cleared → transaction auto closes.

🔹 5️⃣    DELETE /passport-leads/{lead_id}

➡️ Soft delete a lead (kept in archive for audit).

🔹 6️⃣    GET /passport-leads/followups/today

➡️ Get today’s all pending or due follow-ups for call team.

Response:

{

  "total_due": 5,

  "followups": [

    {

      "lead_id": 201,

      "customer_name": "Ali Raza",

      "phone": "+92-3001234567",

      "remarks": "Will pay today",

      "next_followup_date": "2025-10-17"

    }

  ]

}

🔹 7️⃣    POST /pax/update/{pax_id}

➡️ Update or edit any PAX record (for re-use in next booking).

{

  "first_name": "Ali",

  "last_name": "Raza",

  "passport_number": "AB1234567",

  "phone": "+92-3001234567",

  "notes": "Frequent Umrah traveller"

}

✅ PAX reused automatically in next booking forms.

🔹 8️⃣    GET /pax/list

➡️ Show all saved PAX of organization or branch with search filter.

Query Example:

/pax/list?branch_id=12&search=Ali

🔹 Automation Summary

Function

Auto / Manual

Description

Link lead to booking

✅ Auto

Once booking created, lead marked as converted

Follow-up reminder

✅ Auto

Shows in dashboard on due date

Pending balance link to ledger

✅ Auto

Updates branch balance

PAX record save/update

✅ Auto

Once passport added, stored globally

Manual remark entry

⚙️ Manual

By agent or branch operator

✅ Core Benefit

All passport leads + follow-ups + pending balances + pax records in one unified API.

Agent or branch can easily manage calls, re-book customers, or check who still owes balance.

🧩 Module Name:

Customer Data Auto-Collection API (Branch + Area + Leads + Bookings)

🔹 Objective:

Automatically collect and merge all customer contact details (name, phone, email, city, source, etc.) from all existing APIs — Passport Leads, Booking, and Area Branch customers — into one centralized list for marketing, follow-ups, and data analysis.

Endpoints

1️⃣    GET /customers/auto-collection

➡️ Get all customers automatically collected from all sources (Bookings, Leads, Area Customers).

Query Params:

/customers/auto-collection?branch_id=12&organization_id=5

Response Example:

{

  "total_customers": 5,

  "customers": [

    {

      "customer_id": 101,

      "full_name": "Ali Raza",

      "phone": "+92-3001234567",

      "email": "ali.raza@gmail.com",

      "city": "Lahore",

      "source": "Booking",

      "last_activity": "2025-10-14",

      "service_type": "Umrah Package",

      "branch_id": 12,

      "organization_id": 5

    },

    {

      "customer_id": 102,

      "full_name": "Fatima",

      "phone": "+92-3338889999",

      "email": "fatima@gmail.com",

      "city": "Karachi",

      "source": "Passport Lead",

      "last_activity": "2025-10-12",

      "service_type": "Visa Inquiry",

      "branch_id": 12,

      "organization_id": 5

    }

  ]

}

✅ Automatically merges data from:

Bookings (customer info)

Passport Leads (contact info)

Area Branch records (clients who shared contact numbers)

2️⃣    GET /customers/{id}

➡️ Get full details of one customer from any source (lead or booking).

Response Example:

{

  "customer_id": 101,

  "full_name": "Ali Raza",

  "phone": "+92-3001234567",

  "email": "ali.raza@gmail.com",

  "city": "Lahore",

  "source": "Booking",

  "total_bookings": 3,

  "last_service": "Ticket",

  "last_contacted_on": "2025-10-14",

  "notes": [

    {"text": "Interested in Hajj 2026", "date": "2025-10-12"}

  ]

}

3️⃣    POST /customers/manual-add

➡️ Add a new walk-in or untracked customer manually.

Request Example:

{

  "name": "Ahmed Khan",

  "phone": "+92-3009876543",

  "email": "ahmed@gmail.com",

  "city": "Faisalabad",

  "source": "Walk-in",

  "branch_id": 12,

  "organization_id": 5

}

4️⃣     DELETE /customers/{id}

➡️ Delete a customer from the collection list (if duplicate or incorrect).

5️⃣    AUTO SYNC

Whenever a new booking or passport lead is created, or when an area agent/branch saves a customer number or email →system automatically checks:

If same number/email already exists → update activity

If new → create new customer record

🧠 Developer Notes

Auto-collect data from:

/api/bookings

/api/passport/leads

/api/area/customers

Merge duplicates by phone/email

Always attach branch_id, organization_id, and source

No ledger or payment logic required

💡 Goal:

Split any booking safely (e.g. 1 group booking → 2 smaller bookings)Auto-manage ledgers, totals, journal items, and dependencies.

🔧 POST API (Booking Split API)

POST /api/bookings/split

Request Body Example:

{

  "original_booking_id": "BKG-1023",

  "split_reason": "Customer group divided into 2 separate travel plans",

  "split_by_user_id": "USR-2301",

  "new_booking_structure": [

    {

      "pax_ids": ["PAX-1", "PAX-2"],

      "hotel_ids": ["HOTEL-101"],

      "transport_ids": ["TRN-201"],

      "ziyarat_ids": ["ZIY-15", "ZIY-16"],

      "food_ids": ["FD-12"],

      "payment_adjustment": 25000

    },

    {

      "pax_ids": ["PAX-3"],

      "hotel_ids": ["HOTEL-102"],

      "transport_ids": ["TRN-202"],

      "ziyarat_ids": [],

      "food_ids": ["FD-13"],

      "payment_adjustment": 18000

    }

  ],

  "auto_ledger_update": true,

  "notes": "Split due to different return dates"

}

Response:

{

  "status": "success",

  "message": "Booking successfully split into 2 new bookings.",

  "new_booking_ids": ["BKG-2024-A", "BKG-2024-B"],

  "ledger_updates": [

    {

      "booking_id": "BKG-2024-A",

      "ledger_id": "LEDGER-8891",

      "auto_entry": true

    },

    {

      "booking_id": "BKG-2024-B",

      "ledger_id": "LEDGER-8892",

      "auto_entry": true

    }

  ]

}

⚙️ How It Works (System Flow)

Clone original booking → Duplicate structure & references (hotels, pax, payments, etc.).

Assign selected pax and items to each new booking.

Auto-create new booking IDs and link them back to original_booking_id.

Recalculate totals (per pax, per service, tax, commissions, discounts).

Ledger auto-update:

Create a new ledger entry per booking.

Update journal_items.

Keep audit trail (who split, when, and why).

Auto close original booking or mark as partially_split.

Auto generate history logs for FBR/tax and booking audit.

🧾 Supporting APIs (Optional Helpers)

1. Get booking details before splitting

GET /api/bookings/{booking_id}

2. Update ledger after split

POST /api/ledger/update-after-split

3. Merge back (if needed)

POST /api/bookings/merge

🧠 Important Notes

Always keep original_booking_id in both new bookings for traceability.

Use soft-delete (mark is_active: false) for removed items — don’t hard delete.

Ledger must be generated automatically from split data, no manual entry needed.

Auto-calculate commission or profit changes based on new totals.

History and audit logs must record each split and data change.

📞 LEAD GENERATION & AREA CUSTOMER MANAGEMENT API (For Branch Customers Only)

🔹 1. PURPOSE

This API is used to:

Collect passport leads and customer data when a walk-in or local customer visits the office.

Automatically save customer details for future bookings and follow-ups.

Manage lead follow-ups, loan commitments, and booking conversions.

Maintain full lead history, remarks, and conversion tracking (linked with PEX details and bookings).

Not for agents — this is strictly for branch area customers.

🔹 2. API STRUCTURE

🧾 Main Table: Leads

{

  "id": 1,

  "customer_full_name": "Ahmed Ali",

  "passport_number": "AB1234567",

  "passport_expiry": "2028-03-01",

  "contact_number": "+923001234567",

  "email": "ahmed@example.com",

  "cnic_number": "35201-1234567-8",

  "address": "Lahore, Pakistan",

  "branch_id": 3,

  "organization_id": 1,

  "lead_source": "walk-in / call / whatsapp / facebook / referral",

  "lead_status": "new / followup / confirmed / lost",

  "interested_in": "ticket / umrah_package / visa / transport / hotel",

  "interested_travel_date": "2025-12-01",

  "next_followup_date": "2025-11-20",

  "next_followup_time": "14:00",

  "remarks": "Customer wants to travel in December, waiting for salary.",

  "loan_promise_date": "2025-11-15",

  "loan_status": "pending / cleared / overdue",

  "last_contacted_date": "2025-10-18",

  "conversion_status": "not_converted / converted_to_booking / lost",

  "booking_id": null, 

  "pex_id": null,

  "created_by_user_id": 22,

  "created_at": "2025-10-19T10:00:00Z",

  "updated_at": "2025-10-19T12:00:00Z"

}

🔹 3. FUNCTIONALITY FLOW

🟢 (A) Auto Lead Creation from Booking

Whenever a booking is created:

System checks if passport_number or contact_number already exists in Leads.

If not found → auto create new lead record.

If found → auto link booking with that lead.

Result:All customer data becomes reusable by passport number or phone number.

🟢 (B) Manual Lead Creation

Branch user can manually create a new lead from:

Walk-in customer

WhatsApp inquiry

Cold call

Required fields: name, passport_number, contact_number

🟢 (C) Lead Follow-up Management

Each lead will have a follow-up log:

Follow-up API Example:

{

  "lead_id": 1,

  "followup_date": "2025-11-20",

  "followup_time": "14:00",

  "contacted_via": "call / whatsapp / in-person",

  "remarks": "Customer said will confirm next week.",

  "next_followup_date": "2025-11-27",

  "followup_result": "pending / confirmed / lost"

}

➡ Each entry auto-saves in FollowUpHistory table.➡ Once booking is confirmed, status auto-updates to confirmed.

🟢 (D) Loan or Payment Commitment Tracking

If any customer has payment due before travel, store their commitment:

{

  "lead_id": 1,

  "booking_id": 20,

  "promised_clear_date": "2025-11-15",

  "status": "pending / cleared / overdue",

  "remarks": "Customer said will clear remaining 50,000 before 15 Nov."

}

System can auto alert branch user when:

Date = promised_clear_date

Status = still pending → mark as overdue

🟢 (E) Lead Conversion Tracking

When lead converts to booking:

conversion_status = converted_to_booking

Auto link booking_id + pex_id

Auto create ledger if applicable

If not converted:

Mark as lost

Add reason in remarks.

🟢 (F) Auto Search by Passport or Contact Number

When creating a booking, system checks:

If passport/contact found in Leads → auto fetch full customer details(name, contact, CNIC, email, etc.)

Prefill booking form with that data.

Save any new updates back to the lead record.

🔹 4. RELATED TABLES

1️⃣ Leads

Stores main lead data (passport, contact, etc.)

2️⃣ FollowUpHistory

Stores all communication records for each lead.

3️⃣ LoanCommitments

Tracks payment promise data.

🔹 5. RULES & VALIDATIONS

✅ Auto-create lead on first contact or booking.✅ Passport or contact number must be unique per organization.✅ Only branch users can create/update these leads (not agents).✅ All dates stored in UTC.✅ Use pagination + filter:

by branch_id

by lead_status

by next_followup_date

by created_date range✅ Always store created_by_user_id and updated_at.✅ Maintain full conversion history in one thread.

🔹 6. API ENDPOINTS (Suggested)

Method

Endpoint

Description

POST

/api/leads/create/

Create new lead

GET

/api/leads/list/

Get all leads (pagination + filters)

GET

/api/leads/detail/<id>/

View single lead

PUT

/api/leads/update/<id>/

Update lead info

POST

/api/leads/followup/

Add follow-up record

POST

/api/leads/loan-promise/

Add or update loan commitment

GET

/api/leads/search/?passport=AB1234567

Auto search for existing lead

PUT

/api/leads/convert/<id>/

Mark lead as converted to booking

PUT

/api/leads/lost/<id>/

Mark lead as lost

🔹 7. AUTO ACTIONS (Triggers)

Auto-create Lead: When new booking created without existing lead.

Auto-update Conversion: When booking linked → lead auto updates.

Auto Reminder: If next_followup_date == today → reminder shown to branch user.

Auto Overdue Loan: If promised_clear_date < today and not cleared → mark overdue.

🧩 1. Customer Lead API (Passport / Contact Based)

Purpose:To store every new walk-in or call-in customer’s passport & contact info once — and auto-fetch it when creating bookings later.

Endpoints

➤ POST /area-leads/create

Use: Save new customer lead (passport + contact + personal info).Body:

{

  "branch_id": "BR123",

  "lead_type": "walkin", 

  "customer_name": "Ahmed Khan",

  "passport_number": "AB1234567",

  "contact_number": "+923001234567",

  "cnic": "35202-1234567-1",

  "email": "ahmed@gmail.com",

  "address": "Lahore",

  "notes": "Visited office for Umrah info",

  "lead_status": "pending",

  "source": "office_walkin",

  "created_by": "employee_id_45"

}

➤ GET /area-leads/search

Use: Auto-fill booking form by searching passport or contact.Query params:?passport_number=AB1234567 or ?contact_number=+923001234567

✅ Returns full stored customer data for quick auto-fill.

🧭 2. Lead Follow-up Management API

Purpose:Track communication and next follow-up reminders for unconfirmed leads.

Endpoints

➤ POST /area-leads/followup/create

Use: Log next call/meeting reminder or customer promise date.Body:

{

  "lead_id": "LID123",

  "next_followup_date": "2025-10-25",

  "next_followup_time": "15:30",

  "remarks": "Customer said will confirm Umrah package after salary",

  "followup_status": "waiting_response"

}

➤ GET /area-leads/followup/today

Use: Get all leads that need contact today for reminders.

🗣️ 3. Lead Communication History API

Purpose:Save every conversation or action on the lead (like CRM timeline).

➤ POST /area-leads/conversation/add

{

  "lead_id": "LID123",

  "message_type": "call",  

  "summary": "Customer said will clear payment next week",

  "recorded_by": "employee_id_45",

  "timestamp": "2025-10-19T16:30:00"

}

➤ GET /area-leads/conversation/history?lead_id=LID123

Returns all call/text/note history in timeline format.

💰 4. Lead Loan / Payment Promise Tracker

Purpose:If a customer has pending payments or loan-type booking, store promise date & enforce contact.

➤ POST /area-leads/payment-promise/add

{

  "lead_id": "LID123",

  "booking_id": "BKG567",

  "amount_due": 35000,

  "due_date": "2025-10-27",

  "customer_promise": "Will clear before travel date",

  "status": "pending"

}

➤ GET /area-leads/payment-promise/upcoming

Returns customers who must be contacted today or before due date.

✅ 5. Lead Conversion / Status Change API

Purpose:When lead turns into booking or is lost.

➤ PATCH /area-leads/update-status

{

  "lead_id": "LID123",

  "status": "converted",  

  "converted_booking_id": "BKG567",

  "closed_reason": null

}

or

{

  "lead_id": "LID123",

  "status": "lost",

  "closed_reason": "Customer bought from other agency"

}

🔗 6. System Behavior

Every booking API auto-checks passport_number or contact_number in leads table.➜ If found → auto-fill customer data.➜ If not found → auto-save as a new lead record.

Every area branch has separate leads dataset (only visible to that branch).

Agents cannot access or modify branch leads.

🧩 1. Table: area_leads

Stores all customer passport/contact data + main lead info.

CREATE TABLE area_leads (

  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  branch_id VARCHAR(50) NOT NULL,

  customer_name VARCHAR(150),

  passport_number VARCHAR(50) UNIQUE,

  contact_number VARCHAR(50),

  cnic VARCHAR(25),

  email VARCHAR(120),

  address TEXT,

  source ENUM('office_walkin','call','facebook','instagram','website','whatsapp','other') DEFAULT 'office_walkin',

  lead_status ENUM('pending','waiting_response','converted','lost') DEFAULT 'pending',

  notes TEXT,

  created_by VARCHAR(50),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);

📅 2. Table: lead_followups

Stores each reminder or customer follow-up plan.

CREATE TABLE lead_followups (

  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  lead_id BIGINT NOT NULL,

  next_followup_date DATE,

  next_followup_time TIME,

  remarks TEXT,

  followup_status ENUM('waiting_response','done','cancelled') DEFAULT 'waiting_response',

  created_by VARCHAR(50),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (lead_id) REFERENCES area_leads(id) ON DELETE CASCADE

);

🗣️ 3. Table: lead_conversations

Logs all conversations, voice call summaries, or WhatsApp notes.

CREATE TABLE lead_conversations (

  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  lead_id BIGINT NOT NULL,

  message_type ENUM('call','whatsapp','text','note') DEFAULT 'note',

  summary TEXT,

  recorded_by VARCHAR(50),

  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (lead_id) REFERENCES area_leads(id) ON DELETE CASCADE

);

💰 4. Table: lead_payment_promises

Used when a customer owes money or promised a date for payment clearance.

CREATE TABLE lead_payment_promises (

  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  lead_id BIGINT NOT NULL,

  booking_id VARCHAR(50),

  amount_due DECIMAL(10,2),

  due_date DATE,

  customer_promise TEXT,

  status ENUM('pending','cleared','cancelled') DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (lead_id) REFERENCES area_leads(id) ON DELETE CASCADE

);

🔄 5. Optional Link in Booking Table

In your main bookings table, add:

ALTER TABLE bookings ADD COLUMN lead_id BIGINT NULL;

ALTER TABLE bookings ADD FOREIGN KEY (lead_id) REFERENCES area_leads(id);

This way:

When you create a booking → system auto-detects by passport or contact → links lead_id.

Booking conversion auto-updates lead_status → “converted”.

⚙️ 6. API Auto-Behavior Rules

Action

Trigger

Effect

New booking created

passport/contact match

auto-link lead_id

New booking created (no match)

none found

auto-create new lead

Lead marked converted

manual or via booking

lead_status → converted

Lead lost manually

no booking done

lead_status → lost

Follow-up date reached

daily cron

show in reminders dashboard

Loan due date reached

daily cron

alert branch team

🧩 INVENTORY PERMISSION & BOOKING SYSTEM RULES (Updated Text for Developer)

🔹 1. ORGANIZATION LINK API

Purpose:Super Admin can link organizations to share inventory.

Fields:

{

  "main_organization_id": 1,

  "linked_organizations": [

    {

      "linked_organization": 2,

      "request_status": "accepted"

    },

    {

      "linked_organization": 3,

      "request_status": "rejected"

    },

    {

      "linked_organization": 4,

      "request_status": "pending"

    }

  ]

}

Request Status Types:

accepted

pending

rejected

Rules:

Only Super Admin can perform these actions.

Once a request is created, both parties see the inventory share request in Partners Page.

Shared inventories are visible only after both sides accept.

🔹 2. INVENTORY MODULES UPDATES

🟢 TICKETS API

Add field: reselling_allowed (boolean)

Only show tickets:

Where organization is allowed

Not expired (no passed dates)

Status = active

available_seats > 0

Do not show:

Inactive

Zero-seat

Not shareable tickets

🟢 UMRAH PACKAGES API

Add field: reselling_allowed (boolean)

Add fields for commission:

area_agent_commission_per_adult

area_agent_commission_per_child

area_agent_commission_per_infant

branch_commission_per_adult

branch_commission_per_child

branch_commission_per_infant

Get filters:

Show own + allowed organization packages

Active only

Future-dated only

Exclude non-shareable packages

🟢 HOTELS API

Remove: google_drive_link

Add:

photos → multiple image upload allowed

inventory_owner_organization_id

reselling_allowed (boolean)

Filters:

Show own + allowed organization hotels

Show only active inventories

Cannot edit others’ inventory data

Exclude non-shareable hotels

🟢 DISCOUNTS API

Structure:

{

  "name": "Winter Offer",

  "group_type": "organization/group/agent",

  "organization": 1,

  "is_active": true,

  "discounts": {

    "group_ticket_discount_amount": 500,

    "umrah_package_discount_amount": 1000,

    "hotel_night_discounts": [

      {

        "quint_discount": 300,

        "quad_discount": 250,

        "triple_discount": 200,

        "double_discount": 150,

        "sharing_discount": 100,

        "other_discount": 0,

        "discounted_hotels": [1, 2, 3]

      },

      {

        "quint_discount": 200,

        "quad_discount": 150,

        "triple_discount": 100,

        "double_discount": 50,

        "sharing_discount": 0,

        "other_discount": 0,

        "discounted_hotels": [4, 5]

      }

    ]

  }

}

🔹 3. BOOKING API CHANGES

🧾 Additions:

"journal_items": [

  {

    "name": "Service Fee",

    "price": 1000,

    "quantity": 1,

    "extra": "optional field"

  }

],

"payments": [1, 2, 3], // Multiple payment IDs

"pex_details": {

  "pex_id": 12

}

New Columns:

Field

Description

area_agency_id

For area agency tracking

discount_id

Linked discount applied

area_agency_discount_type

Type of discount used

created_by_user_id

Booking created by which user

organization_id

Selling organization

branch_id

Booking branch

agency_id

Linked agency ID

package_owner_organization_id

Package owner organization

expiry_time

Auto expiry timestamp

booking_type

ticket / umrah_package / hotel / transport / visa / combined

is_full_package

Boolean (True = package owner rule applies)

🧾 Additional Details

Hotels:Add → owner_organization_id, room_no, bed_no

Tickets:Add → owner_organization_id, ticket_type(ticket_type = buy_from_us OR data_only)

Transport:Add → total_seats

🔹 4. AGENCY / AREA AGENCY CHANGES

Field

Description

credit_limit

Max purchase limit without payment

credit_limit_days

Max allowed due days before lock

agency_type

full / area

agency_code

Auto generated unique ID

Rule:If due days > credit_limit_days → lock new bookings until payment cleared.

🔹 5. PAYMENTS API

Fields:

{

  "method": "cash/bank/kuickpay/other",

  "amount": 0,

  "remarks": "Payment against booking #123",

  "status": "pending/approved/rejected",

  "image": "string (optional proof)",

  "transaction_number": "string",

  "organization": 1,

  "branch": 2,

  "agency": 3,

  "agent": 4,

  "created_by": 10,

  "agent_bank": 5,

  "organization_bank": 6,

  "kuickpay_trn": 7

}

🔹 6. GET FILTER RULES (For All Inventory APIs)

✅ Always show:

Organization’s own inventories

Allowed & linked organization inventories

🚫 Never show:

Inactive or expired items

Non-shareable inventories

Zero seat items (in tickets)

🔹 7. GENERAL RULES (Developer Standards)

Always use pagination for list endpoints.

Support filter by organization_id, branch_id, date_from, date_to, category, agent_id where applicable.

Always validate permissions before showing linked organization data.

Maintain consistent JSON response with data, count, next, previous.

Add signals / triggers for:

Auto ledger creation on booking.

Auto expiry based on expiry_time.

Auto update of total paid/unpaid amounts.

Always wrap bulk data in transactions.

Use loops carefully — avoid N+1 queries (use .select_related() / .prefetch_related()).

Every POST/PUT API must validate:

Ownership

Credit limit

Active status

Every model must have fields:

created_at, updated_at, created_by, modified_by.

Write reusable functions for totals / commissions.

🎯 Auto Seat Management Logic

Affected Tables:

tickets_inventory

umrah_packages_inventory

bookings

Each inventory table already has these columns:

total_seats INT,

booked_seats INT,

confirmed_seats INT,

available_seats INT

⚙️ Logic Flow — Booking Lifecycle Automation

1️⃣ When a new booking is created:

Condition: booking_status = "unpaid" or "pending"

Action:

booked_seats += number_of_passengers

available_seats -= number_of_passengers

✅ Update in:

tickets_inventory or umrah_packages_inventory (depending on category)

2️⃣ When booking is marked as "paid" or "confirmed":

Condition: booking_status changes from "pending/unpaid" → "paid/confirmed"

Action:

booked_seats -= number_of_passengers

confirmed_seats += number_of_passengers

💡 This moves seats from booked to confirmed once payment is done.

3️⃣ When booking expires or cancelled:

Condition: booking_status = "expired" or "cancelled"

Action:

available_seats += number_of_passengers

IF booking_status WAS "pending" THEN booked_seats -= number_of_passengers;

IF booking_status WAS "confirmed" THEN confirmed_seats -= number_of_passengers;

💡 This restores those seats back to availability.

4️⃣ When booking is edited (number of passengers changed):

Condition: booking already exists and pax updated.

Action:System re-calculates difference:

seat_difference = new_pax_count - old_pax_count

IF seat_difference > 0:

    available_seats -= seat_difference

    booked_seats += seat_difference

ELSE:

    available_seats += ABS(seat_difference)

    booked_seats -= ABS(seat_difference)

5️⃣ Cron job (daily auto-checker)

Every midnight (or hourly if needed), run a CRON JOB:

UPDATE bookings 

SET status = 'expired'

WHERE status = 'pending' AND expiry_date < CURRENT_DATE;

Then trigger seat restoration logic for those expired bookings automatically.

💻 Example API Logic (Pseudocode)

def update_inventory_on_booking(booking):

    inv = get_inventory(booking.item_id, booking.category)

    if booking.status == "pending":

        inv.booked_seats += booking.pax

        inv.available_seats -= booking.pax

    elif booking.status == "confirmed":

        inv.confirmed_seats += booking.pax

        inv.available_seats -= booking.pax

    elif booking.status in ["cancelled", "expired"]:

        if booking.previous_status == "pending":

            inv.booked_seats -= booking.pax

        elif booking.previous_status == "confirmed":

            inv.confirmed_seats -= booking.pax

        inv.available_seats += booking.pax

    save_inventory(inv)

📊 API Summary

API

Purpose

Triggers

/bookings/create

On new booking

Auto update booked & available seats

/bookings/update_status

On payment/confirmation

Move booked → confirmed

/bookings/cancel_or_expire

On cancel or expiry

Add seats back to available

/system/cron/expire_bookings

Daily auto expire

Auto update expired + seat restore