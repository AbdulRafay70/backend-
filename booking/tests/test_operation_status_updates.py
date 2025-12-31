from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from organization.models import Organization, Branch, Agency
from booking.models import Booking, BookingPersonDetail, BookingFoodDetails, BookingZiyaratDetails

class OperationStatusUpdateTest(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username="staff", is_staff=True)
        self.client = APIClient()
        self.client.force_login(self.staff)

        self.org = Organization.objects.create(name="OrgX")
        self.branch = Branch.objects.create(name="BranchX", organization=self.org)
        self.agency = Agency.objects.create(name="AgencyX", branch=self.branch)

        self.booking = Booking.objects.create(
            user=self.staff, 
            organization=self.org, 
            branch=self.branch, 
            agency=self.agency, 
            booking_number="B1", 
            status="Delivered"
        )
        
        self.pax = BookingPersonDetail.objects.create(
            booking=self.booking,
            first_name="John",
            last_name="Doe",
            visa_status="Pending",
            ticket_status="Pending"
        )
        
        self.food = BookingFoodDetails.objects.create(
            booking=self.booking,
            food="Dinner",
            status="Served"
        )
        
        self.ziyarat = BookingZiyaratDetails.objects.create(
            booking=self.booking,
            ziarat="Makkah Ziyarat",
            city="Makkah",
            status="Pending"
        )

    def test_update_pax_visa_status(self):
        url = "/api/daily-operations/update-status/"
        data = {
            "model_type": "pax",
            "item_id": self.pax.id,
            "status": "Approved",
            "status_field": "visa_status"
        }
        resp = self.client.patch(url, data, format='json')
        self.assertEqual(resp.status_code, 200)
        self.pax.refresh_from_db()
        self.assertEqual(self.pax.visa_status, "Approved")

    def test_update_food_status(self):
        url = "/api/daily-operations/update-status/"
        data = {
            "model_type": "food",
            "item_id": self.food.id,
            "status": "Cancelled"
        }
        resp = self.client.patch(url, data, format='json')
        self.assertEqual(resp.status_code, 200)
        self.food.refresh_from_db()
        self.assertEqual(self.food.status, "Cancelled")

    def test_update_ziyarat_status(self):
        url = "/api/daily-operations/update-status/"
        data = {
            "model_type": "ziyarat",
            "item_id": self.ziyarat.id,
            "status": "Completed"
        }
        resp = self.client.patch(url, data, format='json')
        self.assertEqual(resp.status_code, 200)
        self.ziyarat.refresh_from_db()
        self.assertEqual(self.ziyarat.status, "Completed")
