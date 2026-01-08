"""
Create Additional Tickets and Comprehensive Umrah Packages
This script will:
1. Create 5 additional tickets/flights
2. Create comprehensive Umrah packages using all available data

Usage: python create_tickets_and_packages.py
"""

import os
import django
import sys
from datetime import datetime, timedelta, date
from decimal import Decimal
import random

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import (
    UmrahPackage, UmrahPackageHotelDetails, UmrahPackageTransportDetails,
    UmrahPackageTicketDetails, Airlines, City, FoodPrice, ZiaratPrice,
    TransportSectorPrice, OnlyVisaPrice
)
from tickets.models import Ticket, Hotels, HotelPrices
from organization.models import Organization

def get_saer_organization():
    """Get the SAER organization (ORG-0001)"""
    try:
        org = Organization.objects.get(org_code="ORG-0001")
        print(f"✅ Found organization: {org.name} ({org.org_code})")
        return org
    except Organization.DoesNotExist:
        print("❌ Organization ORG-0001 not found!")
        return None

def create_additional_tickets(org):
    """Create 5 additional tickets"""
    print("\n🛫 Creating 5 additional tickets...")
    
    # Get cities and airlines
    cities = {city.code: city for city in City.objects.filter(organization=org)}
    airlines_list = list(Airlines.objects.filter(organization=org))
    
    if not airlines_list:
        print("  ❌ No airlines found!")
        return []
    
    # Additional ticket data
    additional_tickets = [
        {
            'flight_number': 'QR-629',
            'airline_code': 'QR',
            'origin': 'KHI',
            'destination': 'JED',
            'base_price': 110000,
            'departure_time': '16:45',
            'arrival_time': '20:30',
        },
        {
            'flight_number': 'EY-243',
            'airline_code': 'EY', 
            'origin': 'LHE',
            'destination': 'RUH',
            'base_price': 125000,
            'departure_time': '22:15',
            'arrival_time': '02:45',
        },
        {
            'flight_number': 'PK-751',
            'airline_code': 'PK',
            'origin': 'ISB',
            'destination': 'JED',
            'base_price': 115000,
            'departure_time': '13:20',
            'arrival_time': '17:05',
        },
        {
            'flight_number': 'SV-803',
            'airline_code': 'SV',
            'origin': 'KHI',
            'destination': 'MED',
            'base_price': 135000,
            'departure_time': '08:30',
            'arrival_time': '12:15',
        },
        {
            'flight_number': 'EK-612',
            'airline_code': 'EK',
            'origin': 'MUX',
            'destination': 'DXB',
            'base_price': 95000,
            'departure_time': '19:00',
            'arrival_time': '22:30',
        },
    ]
    
    created_tickets = []
    
    for ticket_data in additional_tickets:
        # Find airline
        airline = next((a for a in airlines_list if a.code == ticket_data['airline_code']), airlines_list[0])
        
        # Create multiple flights for different dates
        for i in range(2):  # 2 flights per route
            departure_date = date.today() + timedelta(days=10 + (i * 10))
            arrival_date = departure_date + timedelta(days=1) if ticket_data['arrival_time'] < ticket_data['departure_time'] else departure_date
            
            ticket = Ticket.objects.create(
                organization=org,
                owner_organization_id=org.id,
                airline=airline,
                flight_number=f"{ticket_data['flight_number']}-{i+1}",
                origin=cities[ticket_data['origin']],
                destination=cities[ticket_data['destination']],
                departure_date=departure_date,
                departure_time=ticket_data['departure_time'],
                arrival_date=arrival_date,
                arrival_time=ticket_data['arrival_time'],
                adult_price=ticket_data['base_price'],
                child_price=ticket_data['base_price'] * 0.75,
                infant_price=ticket_data['base_price'] * 0.2,
                adult_purchase_price=ticket_data['base_price'] * 0.7,
                child_purchase_price=ticket_data['base_price'] * 0.55,
                infant_purchase_price=ticket_data['base_price'] * 0.15,
                total_seats=150,
                left_seats=150,
                booked_tickets=0,
                confirmed_tickets=0,
                status='available',
                is_umrah_seat=True,
                trip_type='one_way',
                departure_stay_type='standard',
                return_stay_type='standard',
                baggage_weight=25,
                baggage_pieces=2,
                is_refundable=True,
                refund_rule='refundable',
                reselling_allowed=True,
            )
            
            created_tickets.append(ticket)
            print(f"  ✅ Created ticket: {ticket.flight_number} - {cities[ticket_data['origin']].name} to {cities[ticket_data['destination']].name}")
    
    return created_tickets

def create_comprehensive_packages(org):
    """Create comprehensive Umrah packages using all available data"""
    print("\n📦 Creating comprehensive Umrah packages...")
    
    # Get all available data
    tickets = list(Ticket.objects.filter(organization=org, is_umrah_seat=True)[:10])
    hotels = list(Hotels.objects.filter(organization=org)[:8])  
    food_items = list(FoodPrice.objects.filter(organization=org, active=True))
    ziyarat_items = list(ZiaratPrice.objects.filter(organization=org, status='active'))
    transport_items = list(TransportSectorPrice.objects.filter(organization=org))
    visa_items = list(OnlyVisaPrice.objects.filter(organization=org, status='active'))
    
    print(f"  📊 Available data:")
    print(f"    - Tickets: {len(tickets)}")
    print(f"    - Hotels: {len(hotels)}")
    print(f"    - Food items: {len(food_items)}")
    print(f"    - Ziyarat items: {len(ziyarat_items)}")
    print(f"    - Transport items: {len(transport_items)}")
    print(f"    - Visa items: {len(visa_items)}")
    
    if not all([tickets, hotels, food_items, visa_items]):
        print("  ❌ Missing required data for package creation!")
        return []
    
    # Package configurations
    package_configs = [
        {
            'title': 'Economy Umrah Package - 15 Days',
            'description': 'Budget-friendly Umrah package with all essentials',
            'package_type': 'umrah',
            'duration_days': 15,
            'max_capacity': 50,
            'ticket_idx': 0,
            'hotel_indices': [0, 1],  # 2 hotels
            'food_idx': 0,  # Standard meals
            'ziyarat_indices': [0],  # Basic ziyarat
            'transport_idx': 0,  # Economy transport
            'visa_idx': 0,  # Standard visa
            'profit_percent': 15,
        },
        {
            'title': 'Standard Umrah Package - 21 Days',
            'description': 'Popular Umrah package with comfortable accommodations',
            'package_type': 'umrah',
            'duration_days': 21,
            'max_capacity': 40,
            'ticket_idx': 1,
            'hotel_indices': [1, 2, 3],  # 3 hotels
            'food_idx': 1,  # Premium meals
            'ziyarat_indices': [0, 1],  # Multiple ziyarat
            'transport_idx': 1,  # Standard transport
            'visa_idx': 1,  # Visa with transport
            'profit_percent': 20,
        },
        {
            'title': 'Premium Umrah Package - 30 Days',
            'description': 'Luxury Umrah experience with premium services',
            'package_type': 'umrah',
            'duration_days': 30,
            'max_capacity': 25,
            'ticket_idx': 2,
            'hotel_indices': [0, 3, 4],  # Premium hotels
            'food_idx': 2 if len(food_items) > 2 else 1,  # Deluxe meals
            'ziyarat_indices': [1, 2] if len(ziyarat_items) > 2 else [0, 1],  # Full ziyarat
            'transport_idx': 2 if len(transport_items) > 2 else 1,  # Luxury transport
            'visa_idx': 2 if len(visa_items) > 2 else 1,  # Long-term visa
            'profit_percent': 25,
        },
        {
            'title': 'Family Umrah Package - 20 Days',
            'description': 'Perfect for families with children-friendly services',
            'package_type': 'umrah',
            'duration_days': 20,
            'max_capacity': 35,
            'ticket_idx': 3 if len(tickets) > 3 else 0,
            'hotel_indices': [2, 4] if len(hotels) > 4 else [0, 1],
            'food_idx': 0,  # Family-friendly meals
            'ziyarat_indices': [0, 2] if len(ziyarat_items) > 2 else [0],
            'transport_idx': 1 if len(transport_items) > 1 else 0,
            'visa_idx': 0,  # Standard visa
            'profit_percent': 18,
        },
        {
            'title': 'VIP Umrah Package - 35 Days',
            'description': 'Ultimate luxury Umrah experience with exclusive services',
            'package_type': 'umrah',
            'duration_days': 35,
            'max_capacity': 15,
            'ticket_idx': 4 if len(tickets) > 4 else 1,
            'hotel_indices': [0, 3, 5] if len(hotels) > 5 else [0, 1, 2],
            'food_idx': len(food_items) - 1,  # Best food option
            'ziyarat_indices': list(range(min(3, len(ziyarat_items)))),  # All available ziyarat
            'transport_idx': len(transport_items) - 1,  # Best transport
            'visa_idx': len(visa_items) - 1,  # Best visa option
            'profit_percent': 30,
        }
    ]
    
    created_packages = []
    
    for idx, config in enumerate(package_configs):
        try:
            # Get selected items
            selected_ticket = tickets[config['ticket_idx']] if config['ticket_idx'] < len(tickets) else tickets[0]
            selected_visa = visa_items[config['visa_idx']] if config['visa_idx'] < len(visa_items) else visa_items[0]
            selected_food = food_items[config['food_idx']] if config['food_idx'] < len(food_items) else food_items[0]
            selected_transport = transport_items[config['transport_idx']] if config['transport_idx'] < len(transport_items) else transport_items[0]
            
            # Calculate base price
            base_adult_price = selected_ticket.adult_price + selected_visa.adult_selling_price
            base_child_price = selected_ticket.child_price + selected_visa.child_selling_price  
            base_infant_price = selected_ticket.infant_price + selected_visa.infant_selling_price
            
            # Add food and transport costs
            base_adult_price += selected_food.adult_selling_price + selected_transport.adult_selling_price
            base_child_price += selected_food.child_selling_price + selected_transport.child_selling_price
            base_infant_price += selected_food.infant_selling_price + selected_transport.infant_selling_price
            
            # Create package
            package = UmrahPackage.objects.create(
                organization=org,
                title=config['title'],
                description=config['description'],
                package_type=config['package_type'],
                status='active',
                start_date=date.today(),
                end_date=date.today() + timedelta(days=365),
                max_capacity=config['max_capacity'],
                total_seats=config['max_capacity'],
                left_seats=config['max_capacity'],
                booked_seats=0,
                confirmed_seats=0,
                price_per_person=base_adult_price,
                profit_percent=Decimal(str(config['profit_percent'])),
                
                # Visa pricing
                adault_visa_selling_price=selected_visa.adult_selling_price,
                adault_visa_purchase_price=selected_visa.adult_purchase_price,
                child_visa_selling_price=selected_visa.child_selling_price,
                child_visa_purchase_price=selected_visa.child_purchase_price,
                infant_visa_selling_price=selected_visa.infant_selling_price,
                infant_visa_purchase_price=selected_visa.infant_purchase_price,
                
                # Food pricing
                food_selling_price=selected_food.adult_selling_price,
                food_purchase_price=selected_food.adult_purchase_price,
                food_price_id=selected_food.id,
                
                # Transport pricing
                transport_selling_price=selected_transport.adult_selling_price,
                transport_purchase_price=selected_transport.adult_purchase_price,
                
                # Service charges
                adault_service_charge=2000,
                child_service_charge=1500,
                infant_service_charge=500,
                is_service_charge_active=True,
                
                # Partial payment
                adault_partial_payment=base_adult_price * 0.3,  # 30% advance
                child_partial_payment=base_child_price * 0.3,
                infant_partial_payment=base_infant_price * 0.3,
                is_partial_payment_active=True,
                min_partial_percent=Decimal('30.00'),
                
                # Age restrictions
                filght_min_adault_age=18,
                filght_max_adault_age=75,
                max_chilld_allowed=4,
                max_infant_allowed=2,
                
                # Availability
                is_active=True,
                is_quaint_active=True,
                is_sharing_active=True,
                is_quad_active=True,
                is_triple_active=True,
                is_double_active=True,
                
                inventory_owner_organization_id=org.id,
                reselling_allowed=True,
                is_public=True,
                available_start_date=date.today(),
                available_end_date=date.today() + timedelta(days=365),
            )
            
            print(f"  ✅ Created package: {package.title}")
            
            # Add ticket details
            UmrahPackageTicketDetails.objects.create(
                package=package,
                ticket=selected_ticket,
            )
            
            # Add hotel details
            for hotel_idx in config['hotel_indices']:
                if hotel_idx < len(hotels):
                    selected_hotel = hotels[hotel_idx]
                    
                    # Get hotel prices (use first available price)
                    hotel_price = HotelPrices.objects.filter(hotel=selected_hotel).first()
                    
                    if hotel_price:
                        UmrahPackageHotelDetails.objects.create(
                            package=package,
                            hotel=selected_hotel,
                            check_in_date=date.today() + timedelta(days=1),
                            check_out_date=date.today() + timedelta(days=config['duration_days'] - 1),
                            number_of_nights=config['duration_days'] - 2,
                            
                            # Use hotel room pricing
                            quaint_bed_selling_price=hotel_price.price,
                            quaint_bed_purchase_price=hotel_price.purchase_price or hotel_price.price * 0.8,
                            sharing_bed_selling_price=hotel_price.price * 0.7,
                            sharing_bed_purchase_price=(hotel_price.purchase_price or hotel_price.price * 0.8) * 0.7,
                            quad_bed_selling_price=hotel_price.price * 0.8,
                            quad_bed_purchase_price=(hotel_price.purchase_price or hotel_price.price * 0.8) * 0.8,
                            triple_bed_selling_price=hotel_price.price * 0.9,
                            triple_bed_purchase_price=(hotel_price.purchase_price or hotel_price.price * 0.8) * 0.9,
                            double_bed_selling_price=hotel_price.price * 1.1,
                            double_bed_purchase_price=(hotel_price.purchase_price or hotel_price.price * 0.8) * 1.1,
                        )
            
            # Add transport details  
            UmrahPackageTransportDetails.objects.create(
                package=package,
                transport_sector=selected_transport,
                vehicle_type='bus',
                transport_selling_price=selected_transport.adult_selling_price,
                transport_purchase_price=selected_transport.adult_purchase_price,
            )
            
            # Add ziyarat pricing to package
            if config['ziyarat_indices']:
                total_ziyarat_selling = sum(ziyarat_items[i].adult_selling_price for i in config['ziyarat_indices'] if i < len(ziyarat_items))
                total_ziyarat_purchase = sum(ziyarat_items[i].adult_purchase_price for i in config['ziyarat_indices'] if i < len(ziyarat_items))
                
                package.makkah_ziyarat_selling_price = total_ziyarat_selling * 0.6  # 60% for Makkah
                package.makkah_ziyarat_purchase_price = total_ziyarat_purchase * 0.6
                package.madinah_ziyarat_selling_price = total_ziyarat_selling * 0.4  # 40% for Madinah  
                package.madinah_ziyarat_purchase_price = total_ziyarat_purchase * 0.4
                
                if config['ziyarat_indices']:
                    package.makkah_ziyarat_id = ziyarat_items[config['ziyarat_indices'][0]].id
                    if len(config['ziyarat_indices']) > 1:
                        package.madinah_ziyarat_id = ziyarat_items[config['ziyarat_indices'][1]].id if config['ziyarat_indices'][1] < len(ziyarat_items) else None
                
                package.save()
            
            created_packages.append(package)
            
        except Exception as e:
            print(f"  ❌ Error creating package {config['title']}: {str(e)}")
            continue
    
    return created_packages

def main():
    """Main function"""
    print("🚀 Creating Additional Tickets and Comprehensive Packages")
    print("=" * 65)
    
    # Get organization
    org = get_saer_organization()
    if not org:
        return
    
    # Create additional tickets
    print("\n📋 Step 1: Creating additional tickets...")
    new_tickets = create_additional_tickets(org)
    
    # Create comprehensive packages
    print("\n📋 Step 2: Creating comprehensive packages...")
    new_packages = create_comprehensive_packages(org)
    
    # Summary
    print("\n" + "=" * 65)
    print("🎉 CREATION COMPLETED SUCCESSFULLY!")
    print("=" * 65)
    print(f"✅ Organization: {org.name} ({org.org_code})")
    print(f"✅ New Tickets Created: {len(new_tickets)}")
    print(f"✅ New Packages Created: {len(new_packages)}")
    
    if new_packages:
        print("\n📦 Created Packages:")
        for package in new_packages:
            print(f"   - {package.title}")
            print(f"     💰 Base price per person: PKR {package.price_per_person:,.0f}")
            print(f"     👥 Capacity: {package.max_capacity} people")
            print(f"     🏨 Hotels: {package.hotel_details.count()}")
            print(f"     ✈️ Flight: {package.ticket_details.first().ticket.flight_number if package.ticket_details.first() else 'N/A'}")
    
    print("\n🎯 Ready for booking operations!")
    print("💡 Packages include flights, visas, hotels, transport, food & ziyarat services")

if __name__ == "__main__":
    main()