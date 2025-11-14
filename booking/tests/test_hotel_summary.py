from .test_hotel_summary_fixed import HotelSummaryAPITest

        self.org = Organization.objects.create(name="OrgH")
        self.branch = Branch.objects.create(name="BranchH", organization=self.org)
        self.agency = Agency.objects.create(name="AgencyH", branch=self.branch)

        city1 = City.objects.create(name="Makkah", organization=self.org)
        city2 = City.objects.create(name="Madinah", organization=self.org)

        today = datetime.date.today()
        h1 = Hotels.objects.create(name="Hilton Makkah", city=city1, organization=self.org, address="x", category="4", available_start_date=today, available_end_date=today)
        h2 = Hotels.objects.create(name="Zamzam Tower", city=city2, organization=self.org, address="y", category="3", available_start_date=today, available_end_date=today)

        b1 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="HB1", total_pax=2)
        BookingHotelDetails.objects.create(booking=b1, hotel=h1, number_of_nights=2, total_price=200)

        b2 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="HB2", total_pax=3)
        BookingHotelDetails.objects.create(booking=b2, hotel=h2, number_of_nights=3, total_price=300)

        # older booking to test date filtering
        old_date = datetime.date(2020, 1, 1)
        b3 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="HB3", total_pax=4, created_at=old_date)
        BookingHotelDetails.objects.create(booking=b3, hotel=h1, number_of_nights=1, total_price=100)

    def test_hotel_summary_basic(self):
        resp = self.client.get("/api/pax-summary/hotel-status/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # should contain two hotels (h1 and h2) with counts
        hotels = {d["hotel"]: d for d in data}
        self.assertIn("Hilton Makkah", hotels)
        self.assertIn("Zamzam Tower", hotels)
        self.assertEqual(hotels["Hilton Makkah"]["pax"], 6)  # b1(2) + b3(4)

    def test_hotel_summary_date_filter(self):
        # date_from after old_date should exclude HB3
        resp = self.client.get("/api/pax-summary/hotel-status/?date_from=2021-01-01")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        hotels = {d["hotel"]: d for d in data}
        # Hilton should now only include b1 (2 pax)
        self.assertEqual(hotels["Hilton Makkah"]["pax"], 2)
