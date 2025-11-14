"""
Create fake customer data for testing Customer Auto-Collection API
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from customers.models import Customer
from organization.models import Organization, Branch
from django.contrib.auth import get_user_model

User = get_user_model()

# Get or create organization and branch
try:
    org = Organization.objects.first()
    if not org:
        org = Organization.objects.create(name="Test Organization")
    
    branch = Branch.objects.filter(organization=org).first()
    if not branch:
        branch = Branch.objects.create(
            organization=org,
            name="Main Branch"
        )
    
    # Get or create a user
    user = User.objects.first()
    if not user:
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    # Create fake customers
    fake_customers = [
        {
            "full_name": "Ali Raza Khan",
            "phone": "+92-300-1234567",
            "email": "ali.raza@gmail.com",
            "city": "Lahore",
            "source": "Booking",
            "last_activity": "2025-10-14",
        },
        {
            "full_name": "Fatima Ahmed",
            "phone": "+92-333-8889999",
            "email": "fatima@gmail.com",
            "city": "Karachi",
            "source": "Passport Lead",
            "last_activity": "2025-10-12",
        },
        {
            "full_name": "Muhammad Hassan",
            "phone": "+92-321-5556666",
            "email": "hassan.m@yahoo.com",
            "city": "Islamabad",
            "source": "Walk-in",
            "last_activity": "2025-10-20",
        },
        {
            "full_name": "Ayesha Malik",
            "phone": "+92-345-7778888",
            "email": "ayesha.malik@hotmail.com",
            "city": "Faisalabad",
            "source": "Booking",
            "last_activity": "2025-10-18",
        },
        {
            "full_name": "Usman Tariq",
            "phone": "+92-301-2223334",
            "email": "usman.tariq@gmail.com",
            "city": "Multan",
            "source": "Area Agent",
            "last_activity": "2025-10-25",
        },
        {
            "full_name": "Zainab Hussain",
            "phone": "+92-335-4445556",
            "email": "zainab.h@gmail.com",
            "city": "Lahore",
            "source": "Passport Lead",
            "last_activity": "2025-10-22",
        },
        {
            "full_name": "Ahmed Ali",
            "phone": "+92-300-9998887",
            "email": "ahmed.ali@gmail.com",
            "city": "Karachi",
            "source": "Booking",
            "last_activity": "2025-10-28",
        },
        {
            "full_name": "Sara Khan",
            "phone": "+92-321-6667778",
            "email": "sara.khan@yahoo.com",
            "city": "Peshawar",
            "source": "Walk-in",
            "last_activity": "2025-10-15",
        },
    ]
    
    created_count = 0
    for customer_data in fake_customers:
        customer, created = Customer.objects.get_or_create(
            phone=customer_data["phone"],
            defaults={
                **customer_data,
                "organization": org,
                "branch": branch,
                "is_active": True
            }
        )
        if created:
            created_count += 1
            print(f"✓ Created: {customer.full_name} ({customer.phone})")
        else:
            print(f"- Already exists: {customer.full_name}")
    
    total = Customer.objects.filter(is_active=True).count()
    print(f"\n✅ Total active customers: {total}")
    print(f"✅ Newly created: {created_count}")
    print(f"\n🔗 Organization: {org.name}")
    print(f"🔗 Branch: {branch.name}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
