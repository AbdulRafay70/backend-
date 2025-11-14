from django.test import TestCase
from django.contrib.auth.models import User
from organization.models import Organization
from packages.models import City

from tickets.models import Hotels, HotelRooms, RoomDetails
from .models import RoomMap, OperationLog, HotelOperation
from rest_framework.test import APIClient
from django.urls import reverse
from booking.models import Booking
from organization.models import Branch, Agency

class OperationLogTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin2', password='adminpass', is_staff=True, is_superuser=True)
        self.staff = User.objects.create_user(username='staff2', password='staffpass')
        self.client = APIClient()

        self.org = Organization.objects.create(name='OrgOL')
        self.city = City.objects.create(organization=self.org, name='Madinah', code='MAD')
        self.hotel = Hotels.objects.create(organization=self.org, name='OL Hotel', city=self.city, address='Addr', available_start_date='2025-01-01', available_end_date='2026-01-01')
        self.hotel_room = HotelRooms.objects.create(hotel=self.hotel, floor='G', room_type='Single', room_number='401', total_beds=1)
        self.roommap = RoomMap.objects.create(hotel=self.hotel, floor_no='G', room_no='401', beds=1, availability_status='cleaning_pending')
        self.bed = RoomDetails.objects.create(room=self.hotel_room, bed_number='1', is_assigned=False)
        # create organization branch and agency used by booking
        self.branch = Branch.objects.create(organization=self.org, name='Main')
        self.agency = Agency.objects.create(branch=self.branch, name='AG1')

        # create a checked_out HotelOperation to be updated by cleaning_done
        booking = Booking.objects.create(user=self.admin, organization=self.org, branch=self.branch, agency=self.agency, booking_number='B1', status='confirmed')
        # create a basic BookingPersonDetail minimal
        from booking.models import BookingPersonDetail
        pax = BookingPersonDetail.objects.create(booking=booking, first_name='Pax', last_name='One')
        self.op = HotelOperation.objects.create(booking=booking, pax=pax, pax_id_str=str(pax.id), pax_first_name=pax.first_name, pax_last_name=pax.last_name, booking_id_str=str(booking.id), hotel=self.hotel, hotel_name=self.hotel.name, city=self.city.name, room=self.roommap, room_no=self.hotel_room.room_number, bed_no='1', date='2025-10-20', check_in_date='2025-10-18', check_out_date='2025-10-20', status='checked_out')

    def test_cleaning_done_creates_operationlog_and_updates_operation(self):
        self.client.force_authenticate(user=self.staff)
        url = reverse('room-map-cleaning-done', args=[self.roommap.id])
        resp = self.client.post(url, {}, format='json')
        self.assertEqual(resp.status_code, 200)

        # operation log exists
        self.assertTrue(OperationLog.objects.filter(action='cleaning_done', room=self.roommap).exists())

        # HotelOperation housekeeping_done set
        op = HotelOperation.objects.get(id=self.op.id)
        self.assertTrue(op.housekeeping_done)
        self.assertIn('Housekeeping: cleaning_done', op.notes)

    def test_manual_override_creates_operationlog(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('room-map-set-status', args=[self.roommap.id])
        payload = {'status': 'maintenance', 'reason': 'Test'}
        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(OperationLog.objects.filter(action='manual_override', room=self.roommap, new_status='maintenance').exists())
