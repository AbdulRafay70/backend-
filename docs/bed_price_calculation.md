Bed Price Calculation — Documentation
=====================================

Purpose
-------
This document explains how bed/room prices are modeled and calculated in the codebase, how the `bed_price_calculation` JSON structure (example provided by you) maps to model/fields, and where the implementation lives. It also lists the exact formulas used by the backend when producing package pricing.

Example JSON (your snippet)
---------------------------

{
  "bed_price_calculation": {
    "currency": "Rs.",
    "unit": "per adult",
    "rates": {
      "sharing": { "label": "SHARING", "price": 36200 },
      "quint":   { "label": "QUINT",   "price": 46200 },
      "quad":    { "label": "QUAD",    "price": 56200 },
      "triple":  { "label": "TRIPLE",  "price": 66200 },
      "double":  { "label": "DOUBLE",  "price": 76200 },
      "infant":  { "label": "INFANT",  "price": 20000 }
    }
  }
}

How this maps to the codebase
-----------------------------
- Backend model fields:
  - `UmrahPackageHotelDetails` (file `packages/models.py`) contains per-hotel bed-selling & purchase fields:
    - `sharing_bed_selling_price`, `sharing_bed_purchase_price`
    - `quaint_bed_selling_price`  (note: model uses the name `quaint` for "quint")
    - `quad_bed_selling_price`, `quad_bed_purchase_price`
    - `triple_bed_selling_price`, `triple_bed_purchase_price`
    - `double_bed_selling_price`, `double_bed_purchase_price`
  - Legacy base fields exist too (e.g. `sharing_bed_price`, `double_bed_price`) — see schema / SQL dumps.

- Serializer / API:
  - `packages/serializers.py` exposes a `total_price_breakdown` (uses `UmrahPackage.calculate_total_price` internally).

- Calculation implementation:
  - The main logic is in `packages/models.py` (methods shown below):
    - `calculate_total_price(adults, children, infants)` — top-level total price calculation.
    - `infant_price()` — returns infant ticket + infant visa.
    - `child_discount()` — adult ticket selling price - child ticket selling price.
    - `adult_cost()` — sums food + makkah + madinah + transport + adult visa + adult ticket.
    - `_sum_hotel_room_component(room_field_name)` — sums per-hotel room selling price * number_of_nights.
    - `room_cost(room_type)` — returns `adult_cost()` + hotel component for the requested bed type.
    - Convenience wrappers: `sharing_cost()`, `quad_cost()`, `quint_cost()`, `double_cost()`, `triple_cost()`.

Where to find the code (links)
------------------------------
- Core calculation (models): `packages/models.py` — look for:
  - `def calculate_total_price(self, adults=1, children=0, infants=0):`
  - `def room_cost(self, room_type):`
  - `def adult_cost(self):`
  - `def _sum_hotel_room_component(self, room_field_name):`

- Serializer exposing breakdown:
  - `packages/serializers.py` — method `get_total_price_breakdown` calls `calculate_total_price`.

- Frontend places where bed prices are edited or used:
  - `src/pages/admin/HotelAvailabilityManager.jsx` — builds `bed_prices` arrays and renders hotel bed-price UI.
  - `src/pages/admin/AddPackages.jsx` — reads/writes fields such as `hotel.sharing_bed_price`, `hotel.quad_bed_price`, etc.

- SQL / fixtures showing stored columns / sample data:
  - `saerkaro_testapi (1).sql` — contains `double_bed_price`, `quad_bed_price`, `quaint_bed_price`, `sharing_bed_price`, `triple_bed_price` columns and sample INSERT rows.

Formulas (explicit)
-------------------
The code implements these formulas (comments and functions are in `packages/models.py`):

1) INFANT PRICE
   - Formula:
     INFANT_PRICE = INFANT_TICKET_SELLING_PRICE + INFANT_VISA_SELLING_PRICE
   - Implementation:
     - `UmrahPackage.infant_price()` uses the first ticket included in the package (if available) and adds `infant_visa_selling_price` from the package.

2) CHILD DISCOUNT
   - Formula:
     CHILD_DISCOUNT = ADULT_TICKET_SELLING_PRICE - CHILD_TICKET_SELLING_PRICE
   - Implementation:
     - `UmrahPackage.child_discount()` computes the difference using the package's first linked Ticket.

3) ADULT COST (base components)
   - Formula (per adult):
     ADULT_COST = FOOD + MAKKAH_ZIYARAT + MADINAH_ZIYARAT + TRANSPORT + ADULT_VISA + ADULT_TICKET_SELLING_PRICE
   - Implementation:
     - `UmrahPackage.adult_cost()` sums the configured selling fields for food, makkah ziarat, madinah ziarat, transport, adult visa and the adult ticket price from the first ticket.

4) HOTEL / ROOM COST (per adult)
   - Formula:
     ROOM_COST(room_type) = ADULT_COST + SUM_OVER_HOTELS( HOTEL.<room_type>_SELLING_PRICE * number_of_nights )
   - Notes:
     - `room_type` is one of `sharing`, `quint` (stored as `quaint` in the model), `quad`, `triple`, `double`.
     - The method `_sum_hotel_room_component(room_field_name)` implements the SUM_OVER_HOTELS(...) behavior.

5) TOTAL PACKAGE PRICE (simplified steps used by `calculate_total_price`):
   - Algorithm (as implemented):
     a) Start with `total = adults * price_per_person` (package-level `price_per_person`).
     b) Add per-person visa selling prices: adults, children, infants.
     c) Add service charges (if active): per-adult, per-child, per-infant service charges.
     d) Apply profit percent (if configured): total += total * profit_percent/100
     e) (Note) The method as-is adds the above, and the room/hotel cost helpers are available for more detailed breakdowns via `room_cost()` and the convenience wrappers.

Example calculation using your rates
-----------------------------------
Assumptions for this simple example:
- We treat the JSON rates as the per-adult hotel selling price for 1 night (hotel component).
- Other components (food, visa, ticket) are 0 for this example to isolate bed calculation.

Given rates:
- SHARING = 36,200
- QUINT   = 46,200
- QUAD    = 56,200
- TRIPLE  = 66,200
- DOUBLE  = 76,200
- INFANT  = 20,000

Scenario A — single adult, 1 night, double bed
- ADULT_COST = 0 (food, visas, tickets assumed 0)
- HOTEL_COMPONENT (double) = 76,200 * nights(1) = 76,200
- ROOM_COST(double) = ADULT_COST + HOTEL_COMPONENT = 76,200
- If `calculate_total_price` uses `price_per_person=0` and no service/visa, total = 0 + 0 + profit => 0; to include room costs you would add `room_cost` value manually when building payload or the package may include room cost elsewhere.

Scenario B — if `price_per_person` is set to include base per-person package (e.g., 10,000), and you add double room component:
- base total = adults * price_per_person = 1 * 10,000 = 10,000
- add room component (76,200) if the package model includes it in trip/hotel details
- add visa/service/profit as implemented

Note: The repository separates `price_per_person` (package core) from hotel bed selling prices (stored per `UmrahPackageHotelDetails`). The `calculate_total_price` method builds totals from `price_per_person`, visa and service charges; to get the full per-adult price including hotel bed prices, call `room_cost(room_type)` and add it appropriately.

Files & locations (quick links)
-------------------------------
- Backend model & formulas:
  - `packages/models.py` — contains `UmrahPackage` and `UmrahPackageHotelDetails`.
    - Key methods: `calculate_total_price`, `room_cost`, `adult_cost`, `infant_price`, `_sum_hotel_room_component`

- Serializer exposing totals:
  - `packages/serializers.py` — `UmrahPackageSerializer.get_total_price_breakdown`.

- Frontend hotel/bed management UI (where rates are entered):
  - `src/pages/admin/HotelAvailabilityManager.jsx` — constructs `bed_prices` arrays and renders hotel bed-price UI widgets.
  - `src/pages/admin/AddPackages.jsx` — reads/writes hotel bed price fields when creating packages.

- SQL schema and fixtures showing bed columns and sample rows:
  - `saerkaro_testapi (1).sql` — contains `double_bed_price`, `quad_bed_price`, `quaint_bed_price`, `sharing_bed_price`, `triple_bed_price` columns and sample insert data.

How to verify calculations in your environment
---------------------------------------------
1. Use the Django shell to load a package and call helpers:

```powershell
& ".\.venv\Scripts\Activate.ps1"
& ".\.venv\Scripts\python.exe" manage.py shell
>>> from packages.models import UmrahPackage
>>> pkg = UmrahPackage.objects.get(id=1)
>>> pkg.calculate_total_price(adults=2, children=1, infants=0)
>>> pkg.room_cost('double')
>>> pkg.sharing_cost()
```

2. The serializer `total_price_breakdown` is available from the API:
- GET `/api/packages/<id>/` will include `total_price_breakdown` produced by the serializer.

3. Frontend: open package creation in admin UI (`AddPackages.jsx`) and confirm bed rates saved in hotel details.

Notes & caveats
---------------
- The model uses the word `quaint` internally for the "quint" (5-person) bed type – be careful when mapping external JSON keys to model fields.
- Some legacy fields (`*_bed_price` without "selling") exist in DB dumps; the serializers intentionally exclude legacy base fields and prefer the explicit selling/purchase fields.
- `calculate_total_price` uses `price_per_person` as a starting point. Depending on how your UI builds payloads, you may need to add `room_cost()` values to the final total for a complete per-person price including hotel components.

If you want
-----------
- I can add a small code snippet that, given your JSON block and a package id, computes a sample per-adult price using the same formulas and prints a worked example (Django shell script).
- Or I can add this document to the repository at `docs/BED_PRICE_CALCULATION.md` (already created) and update it with a concrete worked example using a real package from your DB.

