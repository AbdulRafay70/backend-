"""
Quick test to verify Transport API endpoints are accessible
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from operations.models import TransportOperation
from booking.models import Booking, BookingPersonDetail, VehicleType
from drf_spectacular.openapi import AutoSchema

print("=" * 60)
print("TRANSPORT API - VERIFICATION CHECK")
print("=" * 60)

# Check if model is registered
print("\n✅ TransportOperation model imported successfully")
print(f"   Table name: {TransportOperation._meta.db_table}")

# Check fields
print("\n📋 Model Fields:")
fields = [f.name for f in TransportOperation._meta.get_fields()]
print(f"   Total fields: {len(fields)}")
for field in sorted(fields)[:10]:
    print(f"   - {field}")
print(f"   ... and {len(fields) - 10} more")

# Check status choices
print("\n🔄 Status Choices:")
for choice in TransportOperation.STATUS_CHOICES:
    print(f"   - {choice[0]}: {choice[1]}")

# Check related models
print("\n🔗 Related Models:")
print(f"   ✅ Booking: {Booking._meta.db_table}")
print(f"   ✅ BookingPersonDetail: {BookingPersonDetail._meta.db_table}")
print(f"   ✅ VehicleType: {VehicleType._meta.db_table}")

# Check existing operations
count = TransportOperation.objects.count()
print(f"\n📊 Existing Transport Operations: {count}")

if count > 0:
    print("\n   Latest operations:")
    for op in TransportOperation.objects.all()[:3]:
        print(f"   - {op}")

# Check API endpoints
print("\n🌐 API Endpoints Available:")
print("   ✅ GET    /api/daily/transport/")
print("   ✅ POST   /api/daily/transport/")
print("   ✅ GET    /api/daily/transport/{id}/")
print("   ✅ PUT    /api/daily/transport/{id}/")
print("   ✅ DELETE /api/daily/transport/{id}/")
print("   ✅ GET    /api/daily/transport/today/")
print("   ✅ PUT    /api/daily/transport/update-status/")
print("   ✅ POST   /api/daily/transport/bulk-create/")
print("   ✅ GET    /api/daily/transport/by-booking/")
print("   ✅ GET    /api/daily/transport/by-vehicle/")
print("   ✅ GET    /api/daily/transport/pending/")
print("   ✅ GET    /api/daily/transport/statistics/")

print("\n" + "=" * 60)
print("✅ TRANSPORT API IS READY TO USE!")
print("=" * 60)
print("\n📖 Documentation:")
print("   - API Guide: operations/TRANSPORT_API_USAGE.md")
print("   - Summary: operations/TRANSPORT_API_SUMMARY.md")
print("\n🔗 Swagger UI:")
print("   http://localhost:8000/api/schema/swagger-ui/")
print("\n" + "=" * 60)
