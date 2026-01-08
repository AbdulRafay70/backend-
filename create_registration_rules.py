"""
Create actual rules in the database for all 8 rule types.
This script will populate the RegistrationRule model with comprehensive rules.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from universal.models import RegistrationRule
from organization.models import Organization

print("=" * 80)
print("CREATING RULES FOR ALL RULE TYPES")
print("=" * 80)

# Get organization
try:
    org = Organization.objects.first()
    print(f"\nUsing organization: {org.name if org else 'None'}")
    org_id = org.id if org else None
except:
    org_id = None
    print("\nNo organization found")

# Clear existing rules (optional - comment out if you want to keep existing)
# RegistrationRule.objects.all().delete()
# print("\n✅ Cleared existing rules")

# Define rules for each type
rules_data = [
    # Terms & Conditions (2 rules)
    {
        "type": "organization",
        "requirement_text": "General Terms and Conditions for Umrah Services",
        "benefit_text": """1. All bookings are subject to availability and confirmation
2. Customers must provide accurate information during booking
3. False information may result in booking cancellation without refund
4. Payment must be completed within 24 hours of booking confirmation
5. Full payment must be received 7 days before departure
6. Customers are responsible for obtaining valid passports, visas, and vaccinations
7. Children under 18 must be accompanied by an adult
8. Company reserves the right to modify terms with prior notice""",
        "city_needed": None,
        "service_allowed": None,
        "post_available": None
    },
    {
        "type": "branch",
        "requirement_text": "Terms and Conditions for Branch Operations",
        "benefit_text": """1. Branch must maintain proper licensing and documentation
2. All customer bookings must be processed through central system
3. Branch is responsible for accurate data entry
4. Customer complaints must be escalated within 24 hours
5. Branch must comply with all company policies and procedures
6. Regular audits will be conducted for quality assurance
7. Branch staff must complete mandatory training programs""",
        "city_needed": "All Cities",
        "service_allowed": "Umrah, Hajj, Visa Services",
        "post_available": None
    },
    
    # Cancellation Policy (2 rules)
    {
        "type": "agent",
        "requirement_text": "Standard Cancellation Policy",
        "benefit_text": """1. Cancellations 30+ days before departure: 90% refund
2. Cancellations 15-29 days before departure: 50% refund
3. Cancellations 7-14 days before departure: 25% refund
4. Cancellations less than 7 days: No refund
5. Processing fee of $50 applies to all cancellations
6. Medical emergencies: 75% refund with valid documentation
7. No-show passengers forfeit all payments
8. Group cancellations handled individually""",
        "city_needed": None,
        "service_allowed": "Umrah Packages, Visa Processing",
        "post_available": None
    },
    {
        "type": "employee",
        "requirement_text": "Emergency Cancellation Policy",
        "benefit_text": """1. Medical emergencies require certificate within 48 hours
2. Death in family: 75% refund with death certificate
3. Visa rejection: Refund minus processing fees
4. Force majeure events handled case-by-case
5. Travel restrictions by government: Full refund
6. Documentation must be submitted promptly
7. Refund processing takes 14-21 business days""",
        "city_needed": None,
        "service_allowed": None,
        "post_available": "Customer Service, Operations"
    },
    
    # Refund Policy (2 rules)
    {
        "type": "organization",
        "requirement_text": "Refund Processing Policy",
        "benefit_text": """1. Approved refunds processed within 14-21 business days
2. Refunds issued to original payment method
3. Bank processing may take additional 5-7 days
4. Partial refunds calculated based on service cost
5. Minimum $25 processing fee applies
6. Visa fees are non-refundable
7. Travel insurance is non-refundable
8. Third-party bookings subject to their policies""",
        "city_needed": None,
        "service_allowed": None,
        "post_available": None
    },
    {
        "type": "branch",
        "requirement_text": "Partial Refund Policy",
        "benefit_text": """1. Service-specific cancellations allowed
2. Hotel upgrade cancellation: Refund minus processing fee
3. Ziyarat tour cancellation: 50% refund if 7+ days notice
4. Food package cancellation: No refund after confirmation
5. Transport changes: Subject to availability
6. Minimum processing fee: $25
7. Refund calculations based on actual service cost""",
        "city_needed": "Major Cities",
        "service_allowed": "All Services",
        "post_available": None
    },
    
    # Commission Policy (2 rules)
    {
        "type": "agent",
        "requirement_text": "Agent Commission Structure",
        "benefit_text": """1. Monthly sales under $10,000: 5% commission
2. Monthly sales $10,000-$25,000: 7% commission
3. Monthly sales over $25,000: 10% commission
4. Commission paid within 30 days of customer payment
5. Bonus incentives for high performers
6. Commission clawback on customer cancellations
7. Special rates for group bookings (10+ people)
8. Performance reviewed quarterly""",
        "city_needed": None,
        "service_allowed": "Umrah, Hajj, Visa",
        "post_available": None
    },
    {
        "type": "employee",
        "requirement_text": "Commission Clawback Policy",
        "benefit_text": """1. Customer cancellation reverses agent commission
2. Already paid commissions deducted from next payment
3. Fraudulent bookings result in full clawback
4. Partial cancellations: Proportional clawback
5. Commission disputes resolved within 15 days
6. Documentation required for all transactions
7. Monthly commission statements provided""",
        "city_needed": None,
        "service_allowed": None,
        "post_available": "Sales, Accounts"
    },
    
    # Transport Policy (2 rules)
    {
        "type": "organization",
        "requirement_text": "Transport and Luggage Policy",
        "benefit_text": """1. Each passenger: 1 check-in bag (23kg) + 1 carry-on (7kg)
2. Excess baggage: $10 per kg
3. Fragile items must be declared
4. Company not liable for lost/damaged luggage
5. Passengers must arrive 3 hours before departure
6. Valid ID required for boarding
7. Children under 2: No separate seat
8. Special assistance available on request""",
        "city_needed": None,
        "service_allowed": None,
        "post_available": None
    },
    {
        "type": "branch",
        "requirement_text": "Transport Delay and Changes Policy",
        "benefit_text": """1. Not responsible for weather-related delays
2. Traffic delays: No compensation
3. Force majeure events: Alternative arrangements
4. Delays under 4 hours: No compensation
5. Delays over 4 hours: Refreshments provided
6. Route changes communicated 24 hours in advance
7. Emergency contact available 24/7""",
        "city_needed": "All Cities",
        "service_allowed": "Ground Transport",
        "post_available": None
    },
    
    # Document Policy (2 rules)
    {
        "type": "agent",
        "requirement_text": "Document Requirements Policy",
        "benefit_text": """1. Passport valid for 6+ months from travel date
2. Clear scanned copies required (passport, photos)
3. Vaccination certificates mandatory
4. CNIC/ID proof for Pakistani nationals
5. Incomplete documents delay processing
6. All documents verified for authenticity
7. Document submission deadline: 15 days before travel
8. Original documents required at departure""",
        "city_needed": None,
        "service_allowed": "Visa Processing, Umrah",
        "post_available": None
    },
    {
        "type": "employee",
        "requirement_text": "Document Verification Policy",
        "benefit_text": """1. All documents verified for authenticity
2. Fraudulent documents: Immediate cancellation + legal action
3. Information must match official documents exactly
4. Discrepancies reported within 24 hours
5. Re-verification required for corrections
6. Document copies retained for 2 years
7. Customer consent required for document storage""",
        "city_needed": None,
        "service_allowed": None,
        "post_available": "Documentation, Verification"
    },
    
    # Hotel Policy (2 rules)
    {
        "type": "organization",
        "requirement_text": "Hotel Check-in and Check-out Policy",
        "benefit_text": """1. Standard check-in: 2:00 PM
2. Standard check-out: 12:00 PM (noon)
3. Early check-in: Subject to availability + charges
4. Late check-out: Subject to availability + charges
5. Valid ID and booking confirmation required
6. Room allocation based on availability
7. Requests accommodated when possible
8. Hotel changes due to availability: Similar standard guaranteed""",
        "city_needed": None,
        "service_allowed": None,
        "post_available": None
    },
    {
        "type": "branch",
        "requirement_text": "Hotel Damage and Liability Policy",
        "benefit_text": """1. Guests liable for any property damage
2. Security deposit may be required
3. Smoking in non-smoking rooms: $200 fine
4. Lost key cards: $25 replacement fee
5. Excessive noise complaints: Warning then eviction
6. Damage assessment within 24 hours of checkout
7. Disputes resolved through hotel management
8. Company mediates between guest and hotel""",
        "city_needed": "Makkah, Madinah",
        "service_allowed": "Hotel Bookings",
        "post_available": None
    },
    
    # Visa Policy (2 rules)
    {
        "type": "agent",
        "requirement_text": "Visa Processing Policy",
        "benefit_text": """1. Standard processing: 7-14 business days
2. Rush processing: 3-5 days (additional fee)
3. Company assists with application
4. Approval at embassy's discretion
5. Visa fees non-refundable if rejected
6. Complete documentation required
7. Processing delays communicated promptly
8. Visa status tracking available""",
        "city_needed": None,
        "service_allowed": "Visa Services",
        "post_available": None
    },
    {
        "type": "employee",
        "requirement_text": "Visa Rejection and Appeal Policy",
        "benefit_text": """1. Rejection reasons provided by embassy
2. Appeal process available (additional fee)
3. Re-application after 30 days
4. New documentation may be required
5. No guarantee of approval on appeal
6. Processing fees non-refundable
7. Alternative visa options explored
8. Customer support throughout process""",
        "city_needed": None,
        "service_allowed": None,
        "post_available": "Visa Department"
    }
]

print(f"\n📝 Creating {len(rules_data)} rules...")
print("=" * 80)

created_count = 0
for idx, rule_data in enumerate(rules_data, 1):
    rule = RegistrationRule.objects.create(**rule_data)
    created_count += 1
    print(f"\n✅ Rule {idx}: {rule.type.upper()} - {rule.requirement_text}")
    print(f"   Benefits: {rule.benefit_text[:80]}...")

print("\n" + "=" * 80)
print(f"✅ Successfully created {created_count} rules!")
print("=" * 80)

# Summary by type
print("\n📊 SUMMARY BY RULE TYPE:")
print("=" * 80)

for rule_type in ["organization", "branch", "agent", "employee"]:
    count = RegistrationRule.objects.filter(type=rule_type).count()
    print(f"{rule_type.upper()}: {count} rules")

print("\n" + "=" * 80)
print("🎉 DONE!")
print("=" * 80)
