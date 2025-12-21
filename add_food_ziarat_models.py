# Script to add new booking-level food and ziarat models

models_code = '''

# Booking-level Food Details (per-passenger-type pricing)
class BookingFoodDetails(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='food_details')
    food = models.CharField(max_length=255)
    
    # Per-passenger-type prices
    adult_price = models.FloatField(default=0)
    child_price = models.FloatField(default=0)
    infant_price = models.FloatField(default=0)
    
    # Passenger counts
    total_adults = models.IntegerField(default=0)
    total_children = models.IntegerField(default=0)
    total_infants = models.IntegerField(default=0)
    
    # Currency and conversion
    is_price_pkr = models.BooleanField(default=False)
    riyal_rate = models.FloatField(default=0)
    total_price_pkr = models.FloatField(default=0)
    total_price_sar = models.FloatField(default=0)
    
    # Organization tracking
    inventory_owner_organization_id = models.IntegerField(null=True, blank=True)
    booking_organization_id = models.IntegerField(null=True, blank=True)
    
    # Additional details
    contact_person_name = models.CharField(max_length=255, null=True, blank=True)
    contact_number = models.CharField(max_length=50, null=True, blank=True)
    food_voucher_number = models.CharField(max_length=100, null=True, blank=True)
    food_brn = models.CharField(max_length=100, null=True, blank=True)
    
    def __str__(self):
        return f"{self.food} - Booking {self.booking.booking_number}"


# Booking-level Ziarat Details (per-passenger-type pricing)
class BookingZiyaratDetails(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='ziyarat_details')
    ziarat = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    
    # Per-passenger-type prices
    adult_price = models.FloatField(default=0)
    child_price = models.FloatField(default=0)
    infant_price = models.FloatField(default=0)
    
    # Passenger counts
    total_adults = models.IntegerField(default=0)
    total_children = models.IntegerField(default=0)
    total_infants = models.IntegerField(default=0)
    
    # Currency and conversion
    is_price_pkr = models.BooleanField(default=False)
    riyal_rate = models.FloatField(default=0)
    total_price_pkr = models.FloatField(default=0)
    total_price_sar = models.FloatField(default=0)
    
    # Organization tracking
    inventory_owner_organization_id = models.IntegerField(null=True, blank=True)
    booking_organization_id = models.IntegerField(null=True, blank=True)
    
    # Additional details
    date = models.DateField(null=True, blank=True)
    contact_person_name = models.CharField(max_length=255, null=True, blank=True)
    contact_number = models.CharField(max_length=50, null=True, blank=True)
    ziyarat_voucher_number = models.CharField(max_length=100, null=True, blank=True)
    ziyarat_brn = models.CharField(max_length=100, null=True, blank=True)
    
    def __str__(self):
        return f"{self.ziarat} - Booking {self.booking.booking_number}"
'''

# Append to models.py
with open('d:/Sear.pk/backend-/booking/models.py', 'a', encoding='utf-8') as f:
    f.write(models_code)

print("✅ Models added successfully!")
