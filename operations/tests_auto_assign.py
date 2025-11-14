from django.test import TestCase
from django.contrib.auth.models import User
from organization.models import Organization
from packages.models import City

from tickets.models import Hotels, HotelRooms, RoomDetails
from rest_framework.test import APIClient
from booking.models import Booking, BookingHotelDetails, BookingPersonDetail
from .models import HotelOperation

class AutoAssignTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='auto', password='pass')
        self.org = Organization.objects.create(name='OrgAA')
        self.city = City.objects.create(organization=self.org, name='Madinah', code='MAD')
        self.hotel = Hotels.objects.create(organization=self.org, name='Auto Hotel', city=self.city, address='Addr', available_start_date='2025-01-01', available_end_date='2026-01-01')
        self.hotel_room = HotelRooms.objects.create(hotel=self.hotel, floor='G', room_type='Single', room_number='501', total_beds=1)
        self.bed = RoomDetails.objects.create(room=self.hotel_room, bed_number='1', is_assigned=False)

        # create minimal branch and agency for Booking FK
        from organization.models import Branch, Agency
        self.branch = Branch.objects.create(organization=self.org, name='Main Branch')
        self.agency = Agency.objects.create(branch=self.branch, name='Agency A')

    def test_booking_confirm_triggers_auto_assign(self):
        booking = Booking.objects.create(
            user=self.admin,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number='B2',
            status='pending'
        )

        # add booking hotel detail linking to our hotel
        bh = BookingHotelDetails.objects.create(
            booking=booking,
            hotel=self.hotel,
            check_in_date='2025-10-20',
            check_out_date='2025-10-22',
            room_type='Single'
        )
        pax = BookingPersonDetail.objects.create(booking=booking, first_name='Auto', last_name='Assign')

        # now confirm booking -> should trigger post_save and attempt assignment
        booking.status = 'confirmed'
        booking.save()

        # bed should now be assigned and a HotelOperation created
        bed = RoomDetails.objects.get(id=self.bed.id)
        self.assertTrue(bed.is_assigned)
        self.assertTrue(HotelOperation.objects.filter(booking=booking, pax=pax).exists())
