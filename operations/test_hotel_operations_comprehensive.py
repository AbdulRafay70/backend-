"""
Comprehensive Tests for Hotel Operations API
Tests all features requested by client:
1. GET /daily/hotels with date filtering and type (checkin/checkout)
2. PUT /daily/hotels/update-status for status updates
3. Response format matching client requirements
4. All date filtering options
5. Status transitions and validations
"""

import json
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from booking.models import Booking, BookingPersonDetail
from tickets.models import Hotels
from packages.models import City
from organization.models import Organization
from operations.models import HotelOperation, RoomMap

User = get_user_model()


class HotelOperationAPITest(TestCase):
    """Test suite for Hotel Operations API"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        
        # Setup API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create organization
        self.org = Organization.objects.create(
            name='Test Organization',
            phone_number='1234567890',
            email='org@test.com',
            address='Test Address'
        )
        
        # Create cities
        self.makkah = City.objects.create(
            name='Makkah',
            country='Saudi Arabia'
        )
        self.madinah = City.objects.create(
            name='Madinah',
            country='Saudi Arabia'
        )
        
        # Create hotels
        self.hotel_makkah = Hotels.objects.create(
            name='Hilton Makkah',
            city=self.makkah,
            address='Test Address',
            contact='1234567890',
            email='hotel@makkah.com',
            stars_rating=5
        )
        
        self.hotel_madinah = Hotels.objects.create(
            name='Sheraton Madinah',
            city=self.madinah,
            address='Test Address',
            contact='0987654321',
            email='hotel@madinah.com',
            stars_rating=5
        )
        
        # Create booking (simplified, no package or sector needed for these tests)
        self.booking = Booking.objects.create(
            organization=self.org,
            booking_reference='BKG-101',
            booking_date=date.today(),
            status='confirmed',
            total_amount=Decimal('50000.00'),
            created_by=self.user
        )
        
        # Create pax (passengers)
        self.pax1 = BookingPersonDetail.objects.create(
            booking=self.booking,
            pax_id='PAX001',
            first_name='Ali',
            last_name='Raza',
            contact_no='+92300-0709017',
            is_family_head=True
        )
        
        self.pax2 = BookingPersonDetail.objects.create(
            booking=self.booking,
            pax_id='PAX002',
            first_name='Fatima',
            last_name='Raza',
            contact_no='+92300-0709018',
            is_family_head=False
        )
        
        # Create rooms
        self.room1 = RoomMap.objects.create(
            hotel=self.hotel_makkah,
            floor_no=2,
            room_no='204',
            room_type='Double',
            beds=2,
            availability_status='available',
            created_by=self.user
        )
        
        self.room2 = RoomMap.objects.create(
            hotel=self.hotel_makkah,
            floor_no=2,
            room_no='205',
            room_type='Double',
            beds=2,
            availability_status='available',
            created_by=self.user
        )
        
        # Test dates
        self.today = date.today()
        self.tomorrow = self.today + timedelta(days=1)
        self.in_3_days = self.today + timedelta(days=3)
        self.in_7_days = self.today + timedelta(days=7)
    
    def test_01_create_hotel_operation(self):
        """Test creating a hotel operation"""
        data = {
            'booking': self.booking.id,
            'pax': self.pax1.id,
            'pax_id_str': self.pax1.pax_id,
            'pax_first_name': self.pax1.first_name,
            'pax_last_name': self.pax1.last_name,
            'booking_id_str': self.booking.booking_reference,
            'contact_no': self.pax1.contact_no,
            'family_head_contact': self.pax1.contact_no,
            'hotel': self.hotel_makkah.id,
            'hotel_name': self.hotel_makkah.name,
            'city': self.hotel_makkah.city.name,
            'room': self.room1.id,
            'room_no': self.room1.room_no,
            'bed_no': 'B1',
            'date': str(self.today),
            'check_in_date': str(self.today),
            'check_out_date': str(self.in_3_days),
            'status': 'pending'
        }
        
        response = self.client.post('/api/daily/hotels/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['pax_id_str'], 'PAX001')
        self.assertEqual(response.data['status'], 'pending')
        print("✅ Test 1 Passed: Hotel operation created successfully")
    
    def test_02_get_daily_hotels_with_date_filter(self):
        """Test GET /daily/hotels?date=YYYY-MM-DD"""
        # Create test operations
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax1.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            room=self.room1,
            room_no=self.room1.room_no,
            bed_no='B1',
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        response = self.client.get(f'/api/daily/hotels/?date={self.today}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('date', response.data)
        self.assertIn('hotels', response.data)
        self.assertEqual(response.data['date'], str(self.today))
        print("✅ Test 2 Passed: Date filtering works correctly")
    
    def test_03_get_hotels_with_type_checkin(self):
        """Test GET /daily/hotels?date=YYYY-MM-DD&type=checkin"""
        # Create check-in operation for today
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax1.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            room=self.room1,
            room_no=self.room1.room_no,
            bed_no='B1',
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        # Create check-out operation (should not appear in results)
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax2,
            pax_id_str=self.pax2.pax_id,
            pax_first_name=self.pax2.first_name,
            pax_last_name=self.pax2.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax2.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            room=self.room2,
            room_no=self.room2.room_no,
            bed_no='B2',
            date=self.today,
            check_in_date=self.today - timedelta(days=3),
            check_out_date=self.today,
            status='checked_in',
            created_by=self.user
        )
        
        response = self.client.get(f'/api/daily/hotels/?date={self.today}&type=checkin')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['hotels']), 1)
        print("✅ Test 3 Passed: Type=checkin filter works correctly")
    
    def test_04_get_hotels_with_type_checkout(self):
        """Test GET /daily/hotels?date=YYYY-MM-DD&type=checkout"""
        # Create check-out operation for today
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax1.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            room=self.room1,
            room_no=self.room1.room_no,
            bed_no='B1',
            date=self.today,
            check_in_date=self.today - timedelta(days=3),
            check_out_date=self.today,
            status='checked_in',
            created_by=self.user
        )
        
        response = self.client.get(f'/api/daily/hotels/?date={self.today}&type=checkout')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['hotels']), 0)
        print("✅ Test 4 Passed: Type=checkout filter works correctly")
    
    def test_05_response_format_matches_requirements(self):
        """Test that response format matches client requirements"""
        # Create test operation
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax1.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            room=self.room1,
            room_no=self.room1.room_no,
            bed_no='B1',
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        response = self.client.get(f'/api/daily/hotels/?date={self.today}')
        
        # Check root structure
        self.assertIn('date', response.data)
        self.assertIn('hotels', response.data)
        
        # Check hotel structure
        hotel_data = response.data['hotels'][0]
        self.assertIn('booking_id', hotel_data)
        self.assertIn('contact_no_of_family_head', hotel_data)
        self.assertIn('hotel_name', hotel_data)
        self.assertIn('city', hotel_data)
        self.assertIn('pax_list', hotel_data)
        
        # Check pax structure
        pax_data = hotel_data['pax_list'][0]
        self.assertIn('pax_id', pax_data)
        self.assertIn('pax_first_name', pax_data)
        self.assertIn('pax_last_name', pax_data)
        self.assertIn('contact_no', pax_data)
        self.assertIn('room_no', pax_data)
        self.assertIn('bed_no', pax_data)
        self.assertIn('check_in_date', pax_data)
        self.assertIn('check_out_date', pax_data)
        self.assertIn('status', pax_data)
        
        print("✅ Test 5 Passed: Response format matches client requirements")
    
    def test_06_update_status_to_checked_in(self):
        """Test PUT /daily/hotels/update-status/ - check-in"""
        # Create operation
        operation = HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax1.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            room=self.room1,
            room_no=self.room1.room_no,
            bed_no='B1',
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        data = {
            'operation_id': operation.id,
            'status': 'checked_in'
        }
        
        response = self.client.put('/api/daily/hotels/update-status/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['operation']['status'], 'checked_in')
        
        # Verify in database
        operation.refresh_from_db()
        self.assertEqual(operation.status, 'checked_in')
        print("✅ Test 6 Passed: Status updated to checked_in successfully")
    
    def test_07_update_status_to_checked_out(self):
        """Test PUT /daily/hotels/update-status/ - check-out"""
        # Create operation that's already checked in
        operation = HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax1.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            room=self.room1,
            room_no=self.room1.room_no,
            bed_no='B1',
            date=self.today,
            check_in_date=self.today - timedelta(days=3),
            check_out_date=self.today,
            status='checked_in',
            created_by=self.user
        )
        
        data = {
            'operation_id': operation.id,
            'status': 'checked_out'
        }
        
        response = self.client.put('/api/daily/hotels/update-status/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['operation']['status'], 'checked_out')
        
        # Verify in database
        operation.refresh_from_db()
        self.assertEqual(operation.status, 'checked_out')
        print("✅ Test 7 Passed: Status updated to checked_out successfully")
    
    def test_08_update_status_to_canceled(self):
        """Test PUT /daily/hotels/update-status/ - cancel"""
        operation = HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax1.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            room=self.room1,
            room_no=self.room1.room_no,
            bed_no='B1',
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        data = {
            'operation_id': operation.id,
            'status': 'canceled'
        }
        
        response = self.client.put('/api/daily/hotels/update-status/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['operation']['status'], 'canceled')
        print("✅ Test 8 Passed: Status updated to canceled successfully")
    
    def test_09_multiple_pax_same_booking(self):
        """Test grouping multiple passengers from same booking"""
        # Create operations for both pax in same booking
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax1.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            room=self.room1,
            room_no=self.room1.room_no,
            bed_no='B1',
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax2,
            pax_id_str=self.pax2.pax_id,
            pax_first_name=self.pax2.first_name,
            pax_last_name=self.pax2.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax2.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            room=self.room1,
            room_no=self.room1.room_no,
            bed_no='B2',
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        response = self.client.get(f'/api/daily/hotels/?date={self.today}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        hotel_data = response.data['hotels'][0]
        self.assertEqual(len(hotel_data['pax_list']), 2)
        self.assertEqual(hotel_data['booking_id'], 'BKG-101')
        print("✅ Test 9 Passed: Multiple passengers grouped correctly")
    
    def test_10_date_range_filtering(self):
        """Test date range filtering with date_after and date_before"""
        # Create operations on different dates
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax1.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax2,
            pax_id_str=self.pax2.pax_id,
            pax_first_name=self.pax2.first_name,
            pax_last_name=self.pax2.last_name,
            booking_id_str=self.booking.booking_reference,
            contact_no=self.pax2.contact_no,
            family_head_contact=self.pax1.contact_no,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            date=self.in_7_days,
            check_in_date=self.in_7_days,
            check_out_date=self.in_7_days + timedelta(days=3),
            status='pending',
            created_by=self.user
        )
        
        # Test date_after
        response = self.client.get(f'/api/daily/hotels/?date_after={self.today}&grouped=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
        
        # Test date_before
        response = self.client.get(f'/api/daily/hotels/?date_before={self.tomorrow}&grouped=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        
        print("✅ Test 10 Passed: Date range filtering works correctly")
    
    def test_11_filter_by_booking_id(self):
        """Test filtering by booking_id"""
        # Create another booking
        booking2 = Booking.objects.create(
            organization=self.org,
            booking_reference='BKG-102',
            booking_date=date.today(),
            status='confirmed',
            total_amount=Decimal('50000.00'),
            created_by=self.user
        )
        
        pax3 = BookingPersonDetail.objects.create(
            booking=booking2,
            pax_id='PAX003',
            first_name='Ahmed',
            last_name='Khan',
            contact_no='+92300-1234567',
            is_family_head=True
        )
        
        # Create operations for both bookings
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        HotelOperation.objects.create(
            booking=booking2,
            pax=pax3,
            pax_id_str=pax3.pax_id,
            pax_first_name=pax3.first_name,
            pax_last_name=pax3.last_name,
            booking_id_str=booking2.booking_reference,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        response = self.client.get(f'/api/daily/hotels/?booking_id=BKG-101&grouped=false')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['booking_id_str'], 'BKG-101')
        print("✅ Test 11 Passed: Booking ID filtering works correctly")
    
    def test_12_filter_by_status(self):
        """Test filtering by status"""
        # Create operations with different statuses
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax2,
            pax_id_str=self.pax2.pax_id,
            pax_first_name=self.pax2.first_name,
            pax_last_name=self.pax2.last_name,
            booking_id_str=self.booking.booking_reference,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='checked_in',
            created_by=self.user
        )
        
        # Filter by pending
        response = self.client.get('/api/daily/hotels/?status=pending&grouped=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for op in response.data:
            self.assertEqual(op['status'], 'pending')
        
        # Filter by checked_in
        response = self.client.get('/api/daily/hotels/?status=checked_in&grouped=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for op in response.data:
            self.assertEqual(op['status'], 'checked_in')
        
        print("✅ Test 12 Passed: Status filtering works correctly")
    
    def test_13_authentication_required(self):
        """Test that authentication is required"""
        # Logout
        self.client.force_authenticate(user=None)
        
        response = self.client.get('/api/daily/hotels/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = self.client.put('/api/daily/hotels/update-status/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        print("✅ Test 13 Passed: Authentication is properly enforced")
    
    def test_14_invalid_status_update(self):
        """Test updating with invalid status value"""
        operation = HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax1,
            pax_id_str=self.pax1.pax_id,
            pax_first_name=self.pax1.first_name,
            pax_last_name=self.pax1.last_name,
            booking_id_str=self.booking.booking_reference,
            hotel=self.hotel_makkah,
            hotel_name=self.hotel_makkah.name,
            city=self.hotel_makkah.city.name,
            date=self.today,
            check_in_date=self.today,
            check_out_date=self.in_3_days,
            status='pending',
            created_by=self.user
        )
        
        data = {
            'operation_id': operation.id,
            'status': 'invalid_status'
        }
        
        response = self.client.put('/api/daily/hotels/update-status/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print("✅ Test 14 Passed: Invalid status rejected correctly")
    
    def test_15_statistics_endpoint(self):
        """Test statistics endpoint"""
        # Create operations with various statuses
        statuses = ['pending', 'checked_in', 'checked_out', 'canceled']
        for i, stat in enumerate(statuses):
            HotelOperation.objects.create(
                booking=self.booking,
                pax=self.pax1,
                pax_id_str=f'PAX{i}',
                pax_first_name='Test',
                pax_last_name='User',
                booking_id_str=self.booking.booking_reference,
                hotel=self.hotel_makkah,
                hotel_name=self.hotel_makkah.name,
                city=self.hotel_makkah.city.name,
                date=self.today,
                check_in_date=self.today,
                check_out_date=self.in_3_days,
                status=stat,
                created_by=self.user
            )
        
        response = self.client.get('/api/daily/hotels/statistics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('by_status', response.data)
        print("✅ Test 15 Passed: Statistics endpoint works correctly")


def run_tests():
    """Helper function to run tests and display results"""
    import sys
    from io import StringIO
    from django.test.runner import DiscoverRunner
    
    # Capture test output
    test_runner = DiscoverRunner(verbosity=2)
    failures = test_runner.run_tests(['operations.test_hotel_operations_comprehensive'])
    
    if failures == 0:
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED SUCCESSFULLY!")
        print("="*60)
    else:
        print("\n" + "="*60)
        print(f"❌ {failures} TEST(S) FAILED")
        print("="*60)
    
    return failures


if __name__ == '__main__':
    run_tests()
