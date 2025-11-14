from django.test import TransactionTestCase
from threading import Thread
from django.db import transaction
from decimal import Decimal

from .serializers import WalkInBookingSerializer
from .models import Organization, WalkInBooking
from tickets.models import Hotels, HotelRooms, RoomDetails
from django.contrib.auth import get_user_model


class WalkInConcurrencyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create(username="concurrent_user")
        self.org = Organization.objects.create(name="concurrency.org")
        self.hotel = Hotels.objects.create(
            name="Concurrency Hotel",
            organization=self.org,
            address="123 Test St",
            category="budget",
            available_start_date="2025-01-01",
            available_end_date="2026-01-01",
        )
        # create one room and one bed
        self.room = HotelRooms.objects.create(hotel=self.hotel, floor="1", room_type="single", room_number="101", total_beds=1)
        self.bed = RoomDetails.objects.create(room=self.room, bed_number="1", is_assigned=False)

    def _make_booking(self, results, idx):
        data = {
            "hotel": self.hotel.id,
            "organization": self.org.id,
            "booking_type": "walk_in",
            "customer": "Test Customer",
            "room_details": [{
                "room_id": self.room.id,
                "price_per_night": "100.00",
                "check_in": "2025-10-30",
                "check_out": "2025-10-31",
            }],
            "advance_paid": "0.00",
        }

        try:
            with transaction.atomic():
                serializer = WalkInBookingSerializer(data=data)
                if not serializer.is_valid():
                    results[idx] = ("error", serializer.errors)
                    return
                instance = serializer.save()
                # try to occupy room (this will raise ValueError if no bed free)
                try:
                    instance.mark_rooms_occupied()
                    results[idx] = ("ok", instance.id)
                except Exception as e:
                    results[idx] = ("error", str(e))
        except Exception as e:
            # any DB-level exception
            results[idx] = ("error", str(e))

    def test_two_concurrent_bookings_one_bed(self):
        results = {}
        t1 = Thread(target=self._make_booking, args=(results, 1))
        t2 = Thread(target=self._make_booking, args=(results, 2))

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        oks = [r for r in results.values() if r[0] == "ok"]
        errs = [r for r in results.values() if r[0] == "error"]

        # Exactly one should succeed and one should fail
        self.assertEqual(len(oks), 1, f"Expected 1 success, got {results}")
        self.assertEqual(len(errs), 1, f"Expected 1 failure, got {results}")

        # Ensure the bed is assigned exactly once
        assigned_count = RoomDetails.objects.filter(room=self.room, is_assigned=True).count()
        self.assertEqual(assigned_count, 1)
