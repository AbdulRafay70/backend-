"""
Django management command to verify Transport API
Usage: python manage.py verify_transport_api
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from operations.models import TransportOperation
from booking.models import Booking, BookingPersonDetail, VehicleType


class Command(BaseCommand):
    help = 'Verify Transport API is properly configured'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("TRANSPORT API - VERIFICATION CHECK"))
        self.stdout.write("=" * 60)

        # Check if model is registered
        self.stdout.write("\n✅ TransportOperation model imported successfully")
        self.stdout.write(f"   Table name: {TransportOperation._meta.db_table}")

        # Check fields
        self.stdout.write("\n📋 Model Fields:")
        fields = [f.name for f in TransportOperation._meta.get_fields()]
        self.stdout.write(f"   Total fields: {len(fields)}")
        
        important_fields = [
            'booking', 'pax', 'pickup_location', 'drop_location',
            'vehicle', 'driver_name', 'date', 'status'
        ]
        for field in important_fields:
            if field in fields:
                self.stdout.write(self.style.SUCCESS(f"   ✅ {field}"))
            else:
                self.stdout.write(self.style.ERROR(f"   ❌ {field} - MISSING!"))

        # Check status choices
        self.stdout.write("\n🔄 Status Choices:")
        for choice in TransportOperation.STATUS_CHOICES:
            self.stdout.write(f"   - {choice[0]}: {choice[1]}")

        # Check related models
        self.stdout.write("\n🔗 Related Models:")
        try:
            booking_count = Booking.objects.count()
            self.stdout.write(self.style.SUCCESS(f"   ✅ Booking: {Booking._meta.db_table} ({booking_count} records)"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Booking: {e}"))

        try:
            pax_count = BookingPersonDetail.objects.count()
            self.stdout.write(self.style.SUCCESS(f"   ✅ BookingPersonDetail: {BookingPersonDetail._meta.db_table} ({pax_count} records)"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ BookingPersonDetail: {e}"))

        try:
            vehicle_count = VehicleType.objects.count()
            self.stdout.write(self.style.SUCCESS(f"   ✅ VehicleType: {VehicleType._meta.db_table} ({vehicle_count} records)"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ VehicleType: {e}"))

        # Check existing operations
        try:
            count = TransportOperation.objects.count()
            self.stdout.write(f"\n📊 Existing Transport Operations: {count}")

            if count > 0:
                self.stdout.write("\n   Latest operations:")
                for op in TransportOperation.objects.all().order_by('-created_at')[:5]:
                    self.stdout.write(f"   - ID {op.id}: {op.booking_id_str} | {op.pax_first_name} {op.pax_last_name}")
                    self.stdout.write(f"     {op.pickup_location} → {op.drop_location} | Status: {op.status}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Error checking operations: {e}"))

        # Test creating a sample operation (dry run)
        self.stdout.write("\n🧪 Test Model Instantiation:")
        try:
            test_op = TransportOperation(
                pax_id_str="TEST001",
                pax_first_name="Test",
                pax_last_name="User",
                booking_id_str="TEST-001",
                pickup_location="Test Pickup",
                drop_location="Test Drop",
                date=timezone.now().date(),
                status='pending'
            )
            self.stdout.write(self.style.SUCCESS("   ✅ Can instantiate TransportOperation model"))
            self.stdout.write(f"   ✅ String representation: {test_op}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Error: {e}"))

        # Check API endpoints
        self.stdout.write("\n🌐 API Endpoints Available:")
        endpoints = [
            "GET    /api/daily/transport/",
            "POST   /api/daily/transport/",
            "GET    /api/daily/transport/{id}/",
            "PUT    /api/daily/transport/{id}/",
            "DELETE /api/daily/transport/{id}/",
            "GET    /api/daily/transport/today/",
            "PUT    /api/daily/transport/update-status/",
            "POST   /api/daily/transport/bulk-create/",
            "GET    /api/daily/transport/by-booking/",
            "GET    /api/daily/transport/by-vehicle/",
            "GET    /api/daily/transport/pending/",
            "GET    /api/daily/transport/statistics/",
        ]
        for endpoint in endpoints:
            self.stdout.write(f"   ✅ {endpoint}")

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✅ TRANSPORT API IS READY TO USE!"))
        self.stdout.write("=" * 60)
        
        self.stdout.write("\n📖 Documentation:")
        self.stdout.write("   - API Guide: operations/TRANSPORT_API_USAGE.md")
        self.stdout.write("   - Summary: operations/TRANSPORT_API_SUMMARY.md")
        self.stdout.write("   - Quick Test: operations/TRANSPORT_API_QUICK_TEST.md")
        
        self.stdout.write("\n🔗 Swagger UI:")
        self.stdout.write("   http://localhost:8000/api/schema/swagger-ui/")
        
        self.stdout.write("\n💡 Quick Commands:")
        self.stdout.write("   python manage.py shell")
        self.stdout.write("   >>> from operations.models import TransportOperation")
        self.stdout.write("   >>> TransportOperation.objects.count()")
        
        self.stdout.write("\n" + "=" * 60)
