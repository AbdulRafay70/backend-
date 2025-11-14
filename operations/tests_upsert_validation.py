from django.test import TestCase
from django.contrib.auth.models import User
from organization.models import Organization
from packages.models import City
from rest_framework.test import APIClient
from django.urls import reverse

from tickets.models import Hotels

class UpsertValidationTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='upsert', password='pass', is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        self.org = Organization.objects.create(name='OrgUp')
        self.city = City.objects.create(organization=self.org, name='Madinah', code='MAD')
        self.hotel = Hotels.objects.create(organization=self.org, name='Up Hotel', city=self.city, address='Addr', available_start_date='2025-01-01', available_end_date='2026-01-01')

    def test_duplicate_beds_rejected(self):
        payload = {
            'hotel_id': self.hotel.id,
            'floor_no': 'G',
            'rooms': [
                {
                    'room_no': '201',
                    'capacity': 2,
                    'beds': [
                        {'bed_no': '1', 'status': 'available'},
                        {'bed_no': '1', 'status': 'available'}
                    ]
                }
            ]
        }
        url = reverse('hotel-room-map')
        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_capacity_mismatch_rejected(self):
        payload = {
            'hotel_id': self.hotel.id,
            'floor_no': 'G',
            'rooms': [
                {
                    'room_no': '202',
                    'capacity': 3,
                    'beds': [
                        {'bed_no': '1', 'status': 'available'},
                        {'bed_no': '2', 'status': 'available'}
                    ]
                }
            ]
        }
        url = reverse('hotel-room-map')
        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, 400)
