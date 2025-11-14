from django.test import TestCase
from django.contrib.auth.models import User
from organization.models import Organization
from packages.models import City

from tickets.models import Hotels, HotelRooms
from .models import RoomMap
from rest_framework.test import APIClient
import logging
from django.urls import reverse


class ManualOverrideAPITests(TestCase):
    def setUp(self):
        # create admin user
        self.admin = User.objects.create_user(username='admin', password='adminpass', is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

        # create minimal objects: org/city/hotel/room/roommap
        self.org = Organization.objects.create(name='Org2')
        self.city = City.objects.create(organization=self.org, name='Madinah', code='MAD')
        self.hotel = Hotels.objects.create(organization=self.org, name='Admin Hotel', city=self.city, address='Addr', available_start_date='2025-01-01', available_end_date='2026-01-01')
        self.hotel_room = HotelRooms.objects.create(hotel=self.hotel, floor='G', room_type='Single', room_number='201', total_beds=1)
        self.roommap = RoomMap.objects.create(hotel=self.hotel, floor_no='G', room_no='201', beds=1)

    def test_manual_override_sets_status_and_logs(self):
        # capture logs
        logger = logging.getLogger('operations.roommap.audit')
        logs = []

        class Handler(logging.Handler):
            def emit(self, record):
                logs.append(record.__dict__)

        # ensure INFO logs are emitted (logger may default to WARNING)
        logger.setLevel(logging.INFO)
        h = Handler()
        logger.addHandler(h)

        url = reverse('room-map-set-status', args=[self.roommap.id])
        payload = {'status': 'maintenance', 'reason': 'Electrical check'}
        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, 200)

        self.roommap.refresh_from_db()
        self.assertEqual(self.roommap.availability_status, 'maintenance')

        # ensure a log entry captured
        logger.removeHandler(h)
        self.assertTrue(len(logs) >= 1)
        found = any(l.get('new_status') == 'maintenance' and l.get('reason') == 'Electrical check' for l in logs)
        self.assertTrue(found, 'Audit log entry not found')
