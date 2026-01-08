"""
Create rules for the organization.Rule model that the API uses.
This will populate rules that will be displayed in the admin panel.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Rule

print("=" * 80)
print("CREATING RULES FOR ORGANIZATION.RULE MODEL")
print("=" * 80)

# Clear existing rules (optional)
existing_count = Rule.objects.count()
print(f"\nExisting rules in database: {existing_count}")

# Define comprehensive rules for all 8 types
rules_data = [
    # Terms & Conditions (2 rules)
    {
        "title": "General Booking Terms and Conditions",
        "description": """1. All bookings are subject to availability and confirmation
2. Customers must provide accurate information during booking
3. False information may result in booking cancellation without refund
4. Payment must be completed within 24 hours of booking confirmation
5. Partial payments are accepted as per package terms
6. Full payment must be received 7 days before departure
7. Customers are responsible for obtaining valid passports, visas, and required vaccinations
8. Children under 18 must be accompanied by an adult
9. Infants under 2 years travel at reduced rates but do not occupy a seat
10. Senior citizens above 65 may require medical clearance
11. Company reserves the right to modify terms with prior notice""",
        "rule_type": "terms_and_conditions",
        "pages_to_display": ["booking_page", "agent_portal", "dashboard"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    {
        "title": "Customer Responsibilities",
        "description": """1. Customers must ensure passport validity of 6+ months from travel date
2. All required vaccinations must be completed before travel
3. Visa applications must be submitted with complete documentation
4. Any medical conditions must be disclosed at time of booking
5. Travel insurance is strongly recommended
6. Customers must arrive at departure point 3 hours before scheduled time
7. Lost or damaged documents are customer's responsibility
8. Customers must comply with all local laws and regulations
9. Behavior that disrupts other passengers may result in removal from service
10. Company is not liable for delays due to customer non-compliance""",
        "rule_type": "terms_and_conditions",
        "pages_to_display": ["booking_page", "visa_page"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    
    # Cancellation Policy (2 rules)
    {
        "title": "Standard Cancellation Policy",
        "description": """1. Cancellations made 30+ days before departure: 90% refund
2. Cancellations made 15-29 days before departure: 50% refund
3. Cancellations made 7-14 days before departure: 25% refund
4. Cancellations made less than 7 days before departure: No refund
5. Processing fee of $50 applies to all cancellations
6. Cancellation requests must be submitted in writing
7. Cancellation effective date is when written notice is received
8. Group cancellations (10+ people) handled individually
9. No-show passengers forfeit all payments
10. Cancellation confirmation will be sent via email within 48 hours""",
        "rule_type": "cancellation_policy",
        "pages_to_display": ["booking_page", "payment_page", "agent_portal"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    {
        "title": "Emergency Cancellation Policy",
        "description": """1. Medical emergencies: 75% refund with valid medical certificate
2. Medical certificate must be submitted within 48 hours of cancellation
3. Death in immediate family: 75% refund with death certificate
4. Visa rejection: Refund minus processing fees (with rejection letter)
5. Force majeure events (natural disasters, war): Handled case-by-case
6. Government travel restrictions: Full refund with official documentation
7. Emergency documentation must be from recognized authorities
8. Refund processing takes 14-21 business days after document verification
9. Appeals for emergency cancellations reviewed within 5 business days
10. Company reserves right to verify authenticity of emergency claims""",
        "rule_type": "cancellation_policy",
        "pages_to_display": ["booking_page", "dashboard"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    
    # Refund Policy (2 rules)
    {
        "title": "Refund Processing Policy",
        "description": """1. Approved refunds processed within 14-21 business days
2. Refunds issued to original payment method only
3. Bank processing may take additional 5-7 business days
4. Refund status can be tracked through customer portal
5. Email notification sent when refund is processed
6. Minimum processing fee of $25 applies to all refunds
7. Visa processing fees are non-refundable
8. Travel insurance premiums are non-refundable
9. Service charges are non-refundable
10. Third-party bookings (flights, hotels) subject to their respective policies
11. Refund calculations based on package cost minus applicable fees""",
        "rule_type": "refund_policy",
        "pages_to_display": ["payment_page", "dashboard"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    {
        "title": "Partial Refund Policy",
        "description": """1. Service-specific cancellations allowed up to 14 days before departure
2. Hotel upgrade cancellation: Refund minus $25 processing fee
3. Ziyarat tour cancellation: 50% refund if cancelled 7+ days in advance
4. Food package cancellation: No refund after confirmation
5. Transport changes subject to availability and additional charges
6. Minimum processing fee: $25 per service cancellation
7. Refund calculations based on actual service cost
8. Multiple service cancellations processed separately
9. Partial refunds take 14-21 business days to process
10. No partial refunds within 7 days of departure""",
        "rule_type": "refund_policy",
        "pages_to_display": ["booking_page", "hotel_page"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    
    # Commission Policy (2 rules)
    {
        "title": "Agent Commission Structure",
        "description": """1. Monthly sales under $10,000: 5% commission
2. Monthly sales $10,000-$25,000: 7% commission
3. Monthly sales over $25,000: 10% commission
4. Commission calculated on net package price (after discounts)
5. Commission paid within 30 days of customer full payment
6. Bonus incentives for high performers (quarterly review)
7. Special commission rates for group bookings (10+ people)
8. Commission statements provided monthly via email
9. Performance metrics reviewed quarterly
10. Commission disputes must be raised within 15 days of statement
11. Early payment discounts available for agents with good track record""",
        "rule_type": "commission_policy",
        "pages_to_display": ["agent_portal", "dashboard"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    {
        "title": "Commission Clawback Policy",
        "description": """1. Customer cancellation reverses agent commission
2. Already paid commissions deducted from next payment
3. Fraudulent bookings result in full commission clawback plus penalties
4. Partial cancellations: Proportional commission clawback
5. Commission clawback processed within 7 days of cancellation
6. Agents notified via email of all clawback transactions
7. Disputed clawbacks reviewed within 15 days
8. Documentation required for all commission transactions
9. Repeated cancellations may result in commission rate review
10. Commission clawback does not apply to emergency cancellations with valid documentation""",
        "rule_type": "commission_policy",
        "pages_to_display": ["agent_portal"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    
    # Transport Policy (2 rules)
    {
        "title": "Transport and Luggage Policy",
        "description": """1. Each passenger allowed: 1 check-in bag (23kg) + 1 carry-on (7kg)
2. Excess baggage charged at $10 per kg
3. Fragile items must be declared at check-in
4. Company not liable for lost or damaged luggage
5. Passengers must arrive 3 hours before scheduled departure
6. Valid ID required for boarding
7. Children under 2 years do not get separate seat
8. Special assistance available on request (wheelchairs, etc.)
9. Prohibited items not allowed (weapons, flammable materials)
10. Luggage must be properly tagged with passenger information
11. Unclaimed luggage held for 30 days then disposed""",
        "rule_type": "transport_policy",
        "pages_to_display": ["transport_page", "booking_page"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    {
        "title": "Transport Delay and Changes Policy",
        "description": """1. Company not responsible for weather-related delays
2. Traffic delays: No compensation provided
3. Force majeure events: Alternative arrangements made when possible
4. Delays under 4 hours: No compensation
5. Delays over 4 hours: Refreshments provided
6. Route changes communicated 24 hours in advance when possible
7. Emergency contact available 24/7 for transport issues
8. Passengers must remain at designated waiting areas during delays
9. Company reserves right to change transport provider if necessary
10. Refunds not provided for delays beyond company control""",
        "rule_type": "transport_policy",
        "pages_to_display": ["transport_page"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    
    # Document Policy (2 rules)
    {
        "title": "Document Requirements Policy",
        "description": """1. Passport must be valid for 6+ months from travel date
2. Clear scanned copies required (passport bio page, photos)
3. Vaccination certificates mandatory (Meningitis, COVID-19)
4. CNIC/National ID proof required for Pakistani nationals
5. Incomplete documents will delay processing
6. All documents verified for authenticity
7. Document submission deadline: 15 days before travel
8. Original documents must be presented at departure
9. Photocopies not accepted for travel
10. Document corrections must be requested within 24 hours of submission
11. Company not responsible for delays due to incomplete documentation""",
        "rule_type": "document_policy",
        "pages_to_display": ["visa_page", "booking_page", "dashboard"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    {
        "title": "Document Verification Policy",
        "description": """1. All documents verified for authenticity before processing
2. Fraudulent documents: Immediate booking cancellation + legal action
3. Information must match official documents exactly
4. Discrepancies reported to customer within 24 hours
5. Re-verification required for any corrections
6. Document copies retained for 2 years per legal requirements
7. Customer consent required for document storage
8. Documents shared with authorities only when legally required
9. Customers responsible for accuracy of submitted information
10. Company reserves right to refuse service for suspicious documents""",
        "rule_type": "document_policy",
        "pages_to_display": ["visa_page", "dashboard"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    
    # Hotel Policy (2 rules)
    {
        "title": "Hotel Check-in and Check-out Policy",
        "description": """1. Standard check-in time: 2:00 PM
2. Standard check-out time: 12:00 PM (noon)
3. Early check-in: Subject to availability + additional charges
4. Late check-out: Subject to availability + additional charges
5. Valid ID and booking confirmation required at check-in
6. Room allocation based on availability at time of check-in
7. Special requests (adjoining rooms, high floor) accommodated when possible
8. Hotel changes due to unavailability: Similar standard guaranteed
9. Room upgrades available at additional cost
10. Guests must report any room issues within 2 hours of check-in
11. Hotel rules and regulations must be followed by all guests""",
        "rule_type": "hotel_policy",
        "pages_to_display": ["hotel_page", "booking_page"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    {
        "title": "Hotel Damage and Liability Policy",
        "description": """1. Guests liable for any damage to hotel property
2. Security deposit may be required at check-in
3. Smoking in non-smoking rooms: $200 fine
4. Lost key cards: $25 replacement fee
5. Excessive noise complaints: Warning then eviction without refund
6. Damage assessment conducted within 24 hours of checkout
7. Disputes resolved through hotel management
8. Company mediates between guest and hotel when necessary
9. Guests must report any pre-existing damage immediately
10. Unauthorized guests in room may result in additional charges
11. Early checkout due to guest misconduct: No refund""",
        "rule_type": "hotel_policy",
        "pages_to_display": ["hotel_page"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    
    # Visa Policy (2 rules)
    {
        "title": "Visa Processing Policy",
        "description": """1. Standard processing time: 7-14 business days
2. Rush processing available: 3-5 days (additional $100 fee)
3. Company assists with application but does not guarantee approval
4. Visa approval at sole discretion of embassy/consulate
5. Visa processing fees non-refundable if application rejected
6. Complete documentation required before processing begins
7. Processing delays communicated promptly via email/SMS
8. Visa status tracking available through customer portal
9. Passport held during processing (returned after visa stamped)
10. Multiple entry visas subject to additional fees
11. Visa validity and conditions as determined by issuing authority""",
        "rule_type": "visa_policy",
        "pages_to_display": ["visa_page", "booking_page"],
        "is_active": True,
        "language": "en",
        "version": 1
    },
    {
        "title": "Visa Rejection and Appeal Policy",
        "description": """1. Rejection reasons provided by embassy (if disclosed)
2. Appeal process available for additional fee ($150)
3. Re-application allowed after 30 days of rejection
4. New or additional documentation may be required for appeal
5. No guarantee of approval on appeal
6. Original processing fees non-refundable
7. Appeal processing time: 10-15 business days
8. Alternative visa options explored when available
9. Customer support available throughout appeal process
10. Legal consultation recommended for complex cases
11. Company not liable for visa rejections or delays""",
        "rule_type": "visa_policy",
        "pages_to_display": ["visa_page"],
        "is_active": True,
        "language": "en",
        "version": 1
    }
]

print(f"\n📝 Creating {len(rules_data)} rules...")
print("=" * 80)

created_count = 0
for idx, rule_data in enumerate(rules_data, 1):
    rule = Rule.objects.create(**rule_data)
    created_count += 1
    print(f"\n✅ Rule {idx}: {rule.rule_type.upper()} - {rule.title}")
    print(f"   Pages: {', '.join(rule.pages_to_display)}")
    print(f"   Description: {rule.description[:80]}...")

print("\n" + "=" * 80)
print(f"✅ Successfully created {created_count} rules!")
print("=" * 80)

# Summary by type
print("\n📊 SUMMARY BY RULE TYPE:")
print("=" * 80)

for rule_type, label in Rule.RULE_TYPE_CHOICES[:8]:  # First 8 are the main ones
    count = Rule.objects.filter(rule_type=rule_type).count()
    print(f"{label}: {count} rules")

print("\n📊 TOTAL RULES IN DATABASE:")
print(f"Total: {Rule.objects.count()} rules")
print(f"Active: {Rule.objects.filter(is_active=True).count()} rules")

print("\n" + "=" * 80)
print("🎉 DONE! Rules are now available at /api/rules/list")
print("=" * 80)
