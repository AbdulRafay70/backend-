from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction

from .models import HotelOperation, RoomMap
from . import services


@receiver(post_save, sender=HotelOperation)
def hotel_operation_post_save(sender, instance: HotelOperation, created, **kwargs):
    """React to HotelOperation changes.

    - When a pax is checked out -> free bed and mark room as cleaning_pending
    - When a pax is checked_in -> mark room occupied
    - When canceled -> mark room available
    """
    try:
        # Ensure we operate in a transaction to safely update bed row
        with transaction.atomic():
            status = (instance.status or '').lower()
            roommap = instance.room  # RoomMap or None

            if status == 'checked_out':
                # free the bed (if we have enough info)
                try:
                    # Attempt to free the bed via services.free_bed
                    # We need to locate the canonical HotelRooms record
                    from tickets.models import HotelRooms
                    if instance.room_no and instance.bed_no:
                        hotel_room = HotelRooms.objects.filter(hotel_id=instance.hotel_id, room_number=instance.room_no).first()
                        if hotel_room:
                            services.free_bed(hotel_room_id=hotel_room.id, bed_no=instance.bed_no, user=instance.updated_by)
                except Exception:
                    # Do not break the signal chain on errors; log optionally
                    pass

                # mark room cleaning pending so housekeeping can act
                if roommap:
                    services.mark_room_cleaning(roommap, user=instance.updated_by)

            elif status == 'checked_in':
                if roommap:
                    roommap.mark_occupied()

            elif status == 'canceled':
                # free bed and mark available
                try:
                    from tickets.models import HotelRooms
                    if instance.room_no and instance.bed_no:
                        hotel_room = HotelRooms.objects.filter(hotel_id=instance.hotel_id, room_number=instance.room_no).first()
                        if hotel_room:
                            services.free_bed(hotel_room_id=hotel_room.id, bed_no=instance.bed_no, user=instance.updated_by)
                except Exception:
                    pass
                if roommap:
                    services.mark_room_available(roommap, user=instance.updated_by)

    except Exception:
        # Keep signals safe: swallow exceptions to avoid crashing the saving process
        pass


@receiver(post_save, sender='booking.Booking')
def booking_post_save(sender, instance, created, **kwargs):
    """Handle booking status transitions.

    - If booking.status indicates cancellation -> free all associated hotel operation beds and mark rooms available.
    """
    try:
        status = (getattr(instance, 'status', '') or '').lower()
        if 'cancel' in status:
            # Free beds for all non-canceled hotel operations associated with this booking
            ops = HotelOperation.objects.filter(booking_id=instance.id).exclude(status='canceled')
            for op in ops:
                try:
                    # free bed
                    from tickets.models import HotelRooms
                    if op.room_no and op.bed_no:
                        hotel_room = HotelRooms.objects.filter(hotel_id=op.hotel_id, room_number=op.room_no).first()
                        if hotel_room:
                            services.free_bed(hotel_room_id=hotel_room.id, bed_no=op.bed_no, user=None)
                except Exception:
                    pass
                # mark op canceled if not already
                if op.status != 'canceled':
                    op.status = 'canceled'
                    op.save()
                if op.room:
                    services.mark_room_available(op.room, user=None)
        # Auto-assign beds when booking is confirmed
        if 'confirm' in status:
            try:
                from tickets.models import HotelRooms
                # Use the first hotel detail as the allocation target (could be extended)
                bh = getattr(instance, 'hotel_details', None)
                bh_first = bh.first() if bh and bh.exists() else None
                if bh_first:
                    hotel_id = bh_first.hotel_id
                    room_type = bh_first.room_type
                    # iterate pax and try to allocate
                    pax_list = getattr(instance, 'person_details', None)
                    if pax_list:
                        for pax in pax_list.all():
                            # skip if operation already exists
                            existing = HotelOperation.objects.filter(booking=instance, pax=pax).exclude(status='canceled').first()
                            if existing:
                                continue
                            rooms = HotelRooms.objects.filter(hotel_id=hotel_id, room_type=room_type).prefetch_related('details')
                            for room in rooms:
                                bed = room.details.filter(is_assigned=False).first()
                                if bed:
                                    try:
                                        services.assign_bed(hotel_room_id=room.id, bed_no=bed.bed_number, booking=instance, pax=pax, user=None)
                                        break
                                    except Exception:
                                        continue
            except Exception:
                pass
    except Exception:
        pass
