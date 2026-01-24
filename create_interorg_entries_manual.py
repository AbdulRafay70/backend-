"""
Manually create inter-org ledger entries for existing booking BK-20260123-2253CB
This booking was created before the inter-org integration was added.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from decimal import Decimal
from booking.models import Booking
from ledger.utils import create_interorg_ledger_entries

booking_number = "BK-20260123-2253CB"

print(f"\n{'='*70}")
print(f"Creating Inter-Org Ledger Entries for {booking_number}")
print(f"{'='*70}\n")

try:
    booking = Booking.objects.get(booking_number=booking_number)
    
    print(f"✅ Booking found:")
    print(f"   - Organization: {booking.organization.name} (ID: {booking.organization_id})")
    print(f"   - Status: {booking.status}")
    print(f"   - Total Amount: PKR {booking.total_amount}\n")
    
    # Check hotels for inter-org scenario
    for hotel_detail in booking.hotel_details.all():
        if hotel_detail.hotel and hotel_detail.hotel.organization:
            hotel_owner_org = hotel_detail.hotel.organization
            booking_org = booking.organization
            
            # Only create inter-org entries if organizations differ
            if hotel_owner_org.id != booking_org.id:
                print(f"🏨 Inter-org booking detected:")
                print(f"   - Reseller: {booking_org.name} (Org {booking_org.id})")
                print(f"   - Owner: {hotel_owner_org.name} (Org {hotel_owner_org.id})")
                print(f"   - Hotel: {hotel_detail.hotel.name}")
                
                # Calculate hotel amount
                hotel_amount = Decimal(str(
                    hotel_detail.total_in_pkr or 
                    hotel_detail.total_price or 
                    booking.total_hotel_amount_pkr or 
                    0
                ))
                print(f"   - Amount: PKR {hotel_amount}\n")
                
                if hotel_amount > 0:
                    print(f"Creating inter-org ledger entries...")
                    
                    try:
                        reseller_entry, owner_entry = create_interorg_ledger_entries(
                            booking=booking,
                            reseller_org_id=booking_org.id,
                            owner_org_id=hotel_owner_org.id,
                            amount=hotel_amount,
                            service_type='hotel'
                        )
                        
                        print(f"✅ Inter-org ledger entries created successfully!\n")
                        print(f"Reseller Entry (Org {booking_org.id}):")
                        print(f"   - Entry ID: {reseller_entry.id}")
                        print(f"   - Narration: {reseller_entry.narration}")
                        for line in reseller_entry.lines.all():
                            print(f"   - {line.account.name}: DR {line.debit}, CR {line.credit}")
                        
                        print(f"\nOwner Entry (Org {hotel_owner_org.id}):")
                        print(f"   - Entry ID: {owner_entry.id}")
                        print(f"   - Narration: {owner_entry.narration}")
                        for line in owner_entry.lines.all():
                            print(f"   - {line.account.name}: DR {line.debit}, CR {line.credit}")
                        
                    except Exception as e:
                        print(f"❌ Error creating inter-org entries: {str(e)}")
                        import traceback
                        traceback.print_exc()
                else:
                    print(f"⚠️ Hotel amount is 0, skipping inter-org entry creation")
            else:
                print(f"ℹ️ Same organization - not a reseller scenario")

except Booking.DoesNotExist:
    print(f"❌ Booking {booking_number} not found")
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

print(f"\n{'='*70}\n")
