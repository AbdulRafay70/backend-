from django.test import TestCase
from django.contrib.auth.models import User
from organization.models import Organization
from packages.models import City

from tickets.models import Hotels, HotelRooms
from .models import RoomMap
from rest_framework.test import APIClient
from django.urls import reverse


class HousekeepingAPITests(TestCase):
    def setUp(self):
        # create regular user
        self.user = User.objects.create_user(username='staff', password='staffpass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # create minimal objects: org/city/hotel/room/roommap
        self.org = Organization.objects.create(name='OrgHK')
        self.city = City.objects.create(organization=self.org, name='Madinah', code='MAD')
        self.hotel = Hotels.objects.create(organization=self.org, name='HK Hotel', city=self.city, address='Addr', available_start_date='2025-01-01', available_end_date='2026-01-01')
        self.hotel_room = HotelRooms.objects.create(hotel=self.hotel, floor='G', room_type='Single', room_number='301', total_beds=1)
        self.roommap = RoomMap.objects.create(hotel=self.hotel, floor_no='G', room_no='301', beds=1, availability_status='cleaning_pending')

    def test_cleaning_done_sets_room_available(self):
        url = reverse('room-map-cleaning-done', args=[self.roommap.id])
        resp = self.client.post(url, {}, format='json')
        self.assertEqual(resp.status_code, 200)

        self.roommap.refresh_from_db()
        self.assertEqual(self.roommap.availability_status, 'available')
