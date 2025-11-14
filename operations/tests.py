from django.test import TestCase
from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from packages.models import City

from tickets.models import Hotels, HotelRooms, RoomDetails
from booking.models import Booking, BookingPersonDetail

from .models import RoomMap, HotelOperation
from . import services
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


class AvailabilitySignalsTests(TestCase):
    def setUp(self):
        # minimal org/branch/agency/user setup
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.org = Organization.objects.create(name='Org1')
        self.branch = Branch.objects.create(name='Main', organization=self.org)
        self.agency = Agency.objects.create(name='Agency1', branch=self.branch)

        # city and hotel
        self.city = City.objects.create(organization=self.org, name='Makkah', code='MAK')
        self.hotel = Hotels.objects.create(organization=self.org, name='Demo Hotel', city=self.city, address='Addr', available_start_date='2025-01-01', available_end_date='2026-01-01')

        # canonical room and bed
        self.hotel_room = HotelRooms.objects.create(hotel=self.hotel, floor='1', room_type='Double', room_number='101', total_beds=2)
        self.bed = RoomDetails.objects.create(room=self.hotel_room, bed_number='1', is_assigned=True)

        # RoomMap
        self.roommap = RoomMap.objects.create(hotel=self.hotel, floor_no='1', room_no='101', beds=2)

        # Booking and pax
        self.booking_user = User.objects.create_user(username='bookuser', password='bpass')
        self.booking = Booking.objects.create(user=self.booking_user, organization=self.org, branch=self.branch, agency=self.agency, booking_number='BKG-TEST', date='2025-10-29', status='confirmed')
        self.pax = BookingPersonDetail.objects.create(booking=self.booking, first_name='Demo', last_name='Pax')

        # HotelOperation - checked_in
        self.operation = HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax,
            pax_id_str=str(self.pax.id),
            pax_first_name=self.pax.first_name,
            pax_last_name=self.pax.last_name,
            booking_id_str=str(self.booking.id),
            hotel=self.hotel,
            hotel_name=self.hotel.name,
            city=self.city.name,
            room=self.roommap,
            room_no=self.hotel_room.room_number,
            bed_no=self.bed.bed_number,
            date='2025-10-29',
            check_in_date='2025-10-29',
            check_out_date='2025-11-01',
            status='checked_in',
            created_by=self.user
        )

    def test_checkout_triggers_cleaning_pending_and_frees_bed(self):
        # ensure precondition
        self.bed.refresh_from_db()
        self.assertTrue(self.bed.is_assigned)

        # Mark checked out and save -> signals should run
        self.operation.status = 'checked_out'
        self.operation.save()

        # bed should be freed
        self.bed.refresh_from_db()
        self.assertFalse(self.bed.is_assigned, "Bed should be freed on checkout")

        # roommap should be marked cleaning_pending
        self.roommap.refresh_from_db()
        self.assertEqual(self.roommap.availability_status, 'cleaning_pending')

    def test_assign_bed_service_creates_assignment(self):
        # create a new free bed
        bed2 = RoomDetails.objects.create(room=self.hotel_room, bed_number='2', is_assigned=False)
        self.assertFalse(bed2.is_assigned)

        # use service to assign
        services.assign_bed(hotel_room_id=self.hotel_room.id, bed_no='2', booking=self.booking, pax=self.pax, user=self.user)

        bed2.refresh_from_db()
        self.assertTrue(bed2.is_assigned)
from django.test import TestCase
from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from packages.models import City

from tickets.models import Hotels, HotelRooms, RoomDetails
from booking.models import Booking, BookingPersonDetail

from .models import RoomMap, HotelOperation
from . import services
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


class AvailabilitySignalsTests(TestCase):
    def setUp(self):
        # minimal org/branch/agency/user setup
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.org = Organization.objects.create(name='Org1')
        self.branch = Branch.objects.create(name='Main', organization=self.org)
        self.agency = Agency.objects.create(name='Agency1', branch=self.branch)

        # city and hotel
        self.city = City.objects.create(organization=self.org, name='Makkah', code='MAK')
        self.hotel = Hotels.objects.create(organization=self.org, name='Demo Hotel', city=self.city, address='Addr', available_start_date='2025-01-01', available_end_date='2026-01-01')

        # canonical room and bed
        self.hotel_room = HotelRooms.objects.create(hotel=self.hotel, floor='1', room_type='Double', room_number='101', total_beds=2)
        self.bed = RoomDetails.objects.create(room=self.hotel_room, bed_number='1', is_assigned=True)

        # RoomMap
        self.roommap = RoomMap.objects.create(hotel=self.hotel, floor_no='1', room_no='101', beds=2)

        # Booking and pax
        self.booking_user = User.objects.create_user(username='bookuser', password='bpass')
        self.booking = Booking.objects.create(user=self.booking_user, organization=self.org, branch=self.branch, agency=self.agency, booking_number='BKG-TEST', date='2025-10-29', status='confirmed')
        self.pax = BookingPersonDetail.objects.create(booking=self.booking, first_name='Demo', last_name='Pax')

        # HotelOperation - checked_in
        self.operation = HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax,
            pax_id_str=str(self.pax.id),
            pax_first_name=self.pax.first_name,
            pax_last_name=self.pax.last_name,
            booking_id_str=str(self.booking.id),
            hotel=self.hotel,
            hotel_name=self.hotel.name,
            city=self.city.name,
            room=self.roommap,
            room_no=self.hotel_room.room_number,
            bed_no=self.bed.bed_number,
            date='2025-10-29',
            check_in_date='2025-10-29',
            check_out_date='2025-11-01',
            status='checked_in',
            created_by=self.user
        )

    def test_checkout_triggers_cleaning_pending_and_frees_bed(self):
        # ensure precondition
        self.bed.refresh_from_db()
        self.assertTrue(self.bed.is_assigned)

        # Mark checked out and save -> signals should run
        self.operation.status = 'checked_out'
        self.operation.save()

        # bed should be freed
        self.bed.refresh_from_db()
        self.assertFalse(self.bed.is_assigned, "Bed should be freed on checkout")

        # roommap should be marked cleaning_pending
        self.roommap.refresh_from_db()
        self.assertEqual(self.roommap.availability_status, 'cleaning_pending')

    def test_assign_bed_service_creates_assignment(self):
        # create a new free bed
        bed2 = RoomDetails.objects.create(room=self.hotel_room, bed_number='2', is_assigned=False)
        self.assertFalse(bed2.is_assigned)

        # use service to assign
        services.assign_bed(hotel_room_id=self.hotel_room.id, bed_no='2', booking=self.booking, pax=self.pax, user=self.user)

        bed2.refresh_from_db()
        self.assertTrue(bed2.is_assigned)
from django.test import TestCase
from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from packages.models import City

from tickets.models import Hotels, HotelRooms, RoomDetails
from booking.models import Booking, BookingPersonDetail

from .models import RoomMap, HotelOperation
from . import services
from rest_framework.test import APIClient
import logging


class ManualOverrideAPITests(TestCase):
    def setUp(self):
        # create admin user
        self.admin = User.objects.create_user(username='admin', password='adminpass', is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

        from django.test import TestCase
        from django.contrib.auth.models import User
        from organization.models import Organization, Branch, Agency
        from packages.models import City

        from tickets.models import Hotels, HotelRooms, RoomDetails
        from booking.models import Booking, BookingPersonDetail

        from .models import RoomMap, HotelOperation
        from . import services
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



        class AvailabilitySignalsTests(TestCase):
            def setUp(self):
                # minimal org/branch/agency/user setup
                self.user = User.objects.create_user(username='testuser', password='pass')
                self.org = Organization.objects.create(name='Org1')
                self.branch = Branch.objects.create(name='Main', organization=self.org)
                self.agency = Agency.objects.create(name='Agency1', branch=self.branch)

                # city and hotel
                self.city = City.objects.create(organization=self.org, name='Makkah', code='MAK')
                self.hotel = Hotels.objects.create(organization=self.org, name='Demo Hotel', city=self.city, address='Addr', available_start_date='2025-01-01', available_end_date='2026-01-01')

                # canonical room and bed
                self.hotel_room = HotelRooms.objects.create(hotel=self.hotel, floor='1', room_type='Double', room_number='101', total_beds=2)
                self.bed = RoomDetails.objects.create(room=self.hotel_room, bed_number='1', is_assigned=True)

                # RoomMap
                self.roommap = RoomMap.objects.create(hotel=self.hotel, floor_no='1', room_no='101', beds=2)

                # Booking and pax
                self.booking_user = User.objects.create_user(username='bookuser', password='bpass')
                self.booking = Booking.objects.create(user=self.booking_user, organization=self.org, branch=self.branch, agency=self.agency, booking_number='BKG-TEST', date='2025-10-29', status='confirmed')
                self.pax = BookingPersonDetail.objects.create(booking=self.booking, first_name='Demo', last_name='Pax')

                # HotelOperation - checked_in
        self.operation = HotelOperation.objects.create(
            booking=self.booking,
            pax=self.pax,
            pax_id_str=str(self.pax.id),
            pax_first_name=self.pax.first_name,
            pax_last_name=self.pax.last_name,
            booking_id_str=str(self.booking.id),
            hotel=self.hotel,
            hotel_name=self.hotel.name,
            city=self.city.name,
            room=self.roommap,
            room_no=self.hotel_room.room_number,
            bed_no=self.bed.bed_number,
            date='2025-10-29',
            check_in_date='2025-10-29',
            check_out_date='2025-11-01',
            status='checked_in',
            created_by=self.user
        )

    def test_checkout_triggers_cleaning_pending_and_frees_bed(self):
        # ensure precondition
        self.bed.refresh_from_db()
        self.assertTrue(self.bed.is_assigned)

        # Mark checked out and save -> signals should run
        self.operation.status = 'checked_out'
        self.operation.save()

        # bed should be freed
        self.bed.refresh_from_db()
        self.assertFalse(self.bed.is_assigned, "Bed should be freed on checkout")

        # roommap should be marked cleaning_pending
        self.roommap.refresh_from_db()
        self.assertEqual(self.roommap.availability_status, 'cleaning_pending')

    def test_assign_bed_service_creates_assignment(self):
        # create a new free bed
        bed2 = RoomDetails.objects.create(room=self.hotel_room, bed_number='2', is_assigned=False)
        self.assertFalse(bed2.is_assigned)

        # use service to assign
        services.assign_bed(hotel_room_id=self.hotel_room.id, bed_no='2', booking=self.booking, pax=self.pax, user=self.user)

        bed2.refresh_from_db()
        self.assertTrue(bed2.is_assigned)
