"""
Seed a few Booking records so the admin UI can display orders/bookings.

Run with:
python manage.py shell -c "from pathlib import Path; exec(Path(r'c:\\Users\\Abdul Rafay\\Downloads\\All\\All\\create_fake_bookings.py').read_text())"

This will create Booking objects tied to the first Organization/Branch/User in the DB and attach them to an Agency (creates one if none exist).
"""
import os
import django
import random
import secrets
from datetime import timedelta, datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import get_user_model
from organization.models import Organization, Branch, Agency
from booking.models import Booking
from packages.models import UmrahPackage
from customers.models import Customer

User = get_user_model()

def main():
    try:
        org = Organization.objects.first()
        if not org:
            print("No Organization found — create one via admin or run create_fake_many.py first.")
            return
        branch = Branch.objects.filter(organization=org).first()
        if not branch:
            branch = Branch.objects.create(organization=org, name='Main Branch')
            print(f"Created Branch: {branch}")

        agency = Agency.objects.filter(branch=branch).first()
        if not agency:
            agency = Agency.objects.create(branch=branch, name='Seed Agency')
            print(f"Created Agency: {agency}")

        user = User.objects.first()
        if not user:
            user = User.objects.create_user(username='seeduser', email='seed@example.com', password='seedpass')
            print(f"Created user: {user}")

        # pick some customers or create one if none
        customers = list(Customer.objects.filter(organization=org)[:10])
        if not customers:
            c = Customer.objects.create(
                full_name='Seed Customer', phone='+920000000000', email='seed.customer@example.com', organization=org, branch=branch, is_active=True
            )
            customers = [c]
            print(f"Created Customer: {c}")

        packages = list(UmrahPackage.objects.filter(organization=org)[:10])

        created = 0
        for i in range(1, 11):
            cust = random.choice(customers)
            pkg = random.choice(packages) if packages else None
            bk_num = f"SEEDBK{i:03d}"
            invoice = f"INV-SEED-{i}-{secrets.token_hex(4)}"
            total_pax = random.randint(1, 6)
            bdata = {
                'user': user,
                'organization': org,
                'branch': branch,
                'agency': agency,
                'booking_number': bk_num,
                'total_pax': total_pax,
                'total_amount': float(500 * total_pax),
                'status': 'Pending',
                'customer_name': cust.full_name,
                'customer_contact': cust.phone,
                'customer_email': cust.email,
                'invoice_no': invoice,
                'booking_type': 'UMRAH' if pkg else 'OTHER',
                'is_public_booking': False,
                'created_at': datetime.now() - timedelta(days=random.randint(0,10))
            }
            if pkg:
                bdata['umrah_package'] = pkg

            # create booking
            booking = Booking.objects.create(**bdata)
            created += 1
            print(f"Created Booking: {booking.booking_number} (id={booking.id}) customer={cust.full_name} pax={total_pax}")

        print(f"\nCreated {created} Booking(s) for organization {org} (id={org.id})")

    except Exception as e:
        print(f"Error creating bookings: {e}")
        import traceback
        traceback.print_exc()

# When this file is exec()'d inside `manage.py shell -c`, __name__ is not '__main__'.
# Call main() unconditionally so the script runs when executed via exec(Path(...).read_text()).
main()
