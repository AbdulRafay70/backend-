from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import RoomMap, HotelOperation, OperationLog
from booking.models import BookingHotelDetails




def _get_hotel_room_model():
    from tickets.models import HotelRooms
    return HotelRooms


def _get_room_details_model():
    from tickets.models import RoomDetails
    return RoomDetails


def assign_bed(hotel_id=None, room_number=None, hotel_room_id=None, bed_no=None, booking=None, pax=None, user=None):
    """Atomically mark a bed assigned and optionally create a HotelOperation.

    Either provide hotel_room_id or (hotel_id and room_number).
    Returns the updated RoomDetails row.
    """
    HotelRooms = _get_hotel_room_model()
    RoomDetails = _get_room_details_model()

    if hotel_room_id:
        hotel_room = get_object_or_404(HotelRooms, pk=hotel_room_id)
    else:
        hotel_room = get_object_or_404(HotelRooms, hotel_id=hotel_id, room_number=room_number)

    with transaction.atomic():
        bed = RoomDetails.objects.select_for_update().filter(room=hotel_room, bed_number=str(bed_no)).first()
        if not bed:
            raise RoomDetails.DoesNotExist("Bed not found")
        if bed.is_assigned:
            raise Exception("Bed already assigned")

        bed.is_assigned = True
        bed.save()

        # Create minimal HotelOperation if booking/pax provided
        if booking and pax:
            roommap = RoomMap.objects.filter(hotel_id=hotel_room.hotel_id, room_no=hotel_room.room_number).first()
            op = HotelOperation.objects.create(
                booking=booking,
                pax=pax,
                pax_id_str=str(pax.id),
                pax_first_name=pax.first_name or '',
                pax_last_name=pax.last_name or '',
                booking_id_str=str(booking.id),
                hotel=hotel_room.hotel,
                hotel_name=hotel_room.hotel.name,
                city=getattr(hotel_room.hotel, 'city', '') and getattr(hotel_room.hotel.city, 'name', '') or '',
                room=roommap,
                room_no=hotel_room.room_number,
                bed_no=str(bed_no),
                date=booking.date if hasattr(booking, 'date') else None,
                check_in_date=getattr(booking, 'date', None),
                check_out_date=getattr(booking, 'date', None),
                status='checked_in',
                created_by=user,
                updated_by=user,
            )
            # persist an operation log for this assign
            try:
                roommap = RoomMap.objects.filter(hotel_id=hotel_room.hotel_id, room_no=hotel_room.room_number).first()
                OperationLog.objects.create(
                    action='assign',
                    room=roommap,
                    hotel=hotel_room.hotel,
                    performed_by=user,
                    performed_by_username=getattr(user, 'username', None) if user else None,
                    prev_status=None,
                    new_status='assigned',
                    reason=f'Assign via service for booking {getattr(booking, "id", None)}'
                )
            except Exception:
                # best-effort logging; do not fail assignment if log creation fails
                pass
        return bed


def free_bed(hotel_id=None, room_number=None, hotel_room_id=None, bed_no=None, user=None):
    """Atomically free a bed (is_assigned=False).

    Returns the updated RoomDetails row.
    """
    HotelRooms = _get_hotel_room_model()
    RoomDetails = _get_room_details_model()

    if hotel_room_id:
        hotel_room = get_object_or_404(HotelRooms, pk=hotel_room_id)
    else:
        hotel_room = get_object_or_404(HotelRooms, hotel_id=hotel_id, room_number=room_number)

    with transaction.atomic():
        bed = RoomDetails.objects.select_for_update().filter(room=hotel_room, bed_number=str(bed_no)).first()
        if not bed:
            raise RoomDetails.DoesNotExist("Bed not found")

        if bed.is_assigned:
            bed.is_assigned = False
            bed.save()
            # persist an operation log for this free
            try:
                hotel_room = hotel_room
                roommap = RoomMap.objects.filter(hotel_id=hotel_room.hotel_id, room_no=hotel_room.room_number).first()
                OperationLog.objects.create(
                    action='free',
                    room=roommap,
                    hotel=hotel_room.hotel,
                    performed_by=user,
                    performed_by_username=getattr(user, 'username', None) if user else None,
                    prev_status='assigned',
                    new_status='free',
                    reason=f'Freed bed {bed_no} via service'
                )
            except Exception:
                pass

    return bed


def mark_room_cleaning(roommap: RoomMap, user=None):
    """Mark the given RoomMap as cleaning_pending."""
    if not roommap:
        return None
    roommap.availability_status = 'cleaning_pending'
    if user:
        try:
            roommap.created_by = user
        except Exception:
            pass
    roommap.save()
    return roommap


def mark_room_available(roommap: RoomMap, user=None):
    """Mark the given RoomMap as available."""
    if not roommap:
        return None
    roommap.availability_status = 'available'
    roommap.save()
    return roommap


def assign_beds_for_booking(booking, user=None, group_pax=True):
    """Attempt to auto-assign unassigned pax in a booking to available beds.

    Behavior (defaults):
    - For each pax in booking.person_details, if there is no HotelOperation already, try to find a first-available bed
      in the booking.hotel_details (matching room_type). Assign the pax to that bed and create HotelOperation + OperationLog.
    - Persist results into BookingHotelDetails.room_assignments as a list of dicts.

    Returns: list of assignment dicts: { 'pax_id': ..., 'booking_hotel_detail_id': ..., 'room_no': ..., 'bed_no': ... }
    """
    HotelRooms = _get_hotel_room_model()
    RoomDetails = _get_room_details_model()
    assignments = []

    # simple transactional loop to avoid races
    with transaction.atomic():
        # Preload booking hotel details
        hotel_details = list(booking.hotel_details.select_for_update())

        # iterate through pax and try to assign each if not already assigned
        for pax in booking.person_details.all():
            # skip if already has HotelOperation
            if HotelOperation.objects.filter(booking=booking, pax=pax).exists():
                continue

            assigned = False
            # try each hotel detail (in order). Default behaviour: match room_type if present
            for bh in hotel_details:
                # choose candidate rooms for this booking hotel detail
                candidates = HotelRooms.objects.filter(hotel=bh.hotel)
                if bh.room_type:
                    candidates = candidates.filter(room_type=bh.room_type)

                # order by id/room_number stable selection
                candidates = candidates.order_by('room_number')

                for hr in candidates:
                    # find an unassigned bed
                    rd = RoomDetails.objects.select_for_update().filter(room=hr, is_assigned=False).first()
                    if not rd:
                        continue

                    # assign using existing helper (will create HotelOperation and OperationLog)
                    try:
                        assign_bed(hotel_room_id=hr.id, bed_no=rd.bed_number, booking=booking, pax=pax, user=user)
                    except Exception:
                        # skip failures and try next
                        continue

                    # append to booking hotel detail assignments
                    try:
                        # ensure bh instance is up-to-date
                        if not isinstance(bh.room_assignments, list):
                            bh.room_assignments = list(bh.room_assignments) if bh.room_assignments else []
                        entry = {'pax_id': pax.id, 'room_no': hr.room_number, 'bed_no': rd.bed_number}
                        bh.room_assignments.append(entry)
                        bh.save()

                        assignments.append({
                            'pax_id': pax.id,
                            'booking_hotel_detail_id': bh.id,
                            'room_no': hr.room_number,
                            'bed_no': rd.bed_number,
                        })
                        assigned = True
                        break
                    except Exception:
                        # do not fail the whole transaction for a persistence issue
                        assigned = True
                        break

                if assigned:
                    break

    return assignments
