import logging
from .models import Lead


logger = logging.getLogger(__name__)


class LeadService:
    @staticmethod
    def auto_create_from_booking(booking):
        """Create or link a Lead from a Booking instance.

        Logic:
        - try to find lead by passport in booking.person_details
        - fallback to contact number
        - if found: attach booking and mark converted
        - if not found: create a new lead under booking.branch/organization
        """
        try:
            person = booking.person_details.first() if hasattr(booking, "person_details") else None
        except Exception as e:
            logger.exception(f"Error accessing booking.person_details for booking {getattr(booking, 'id', None)}: {e}")
            person = None

        passport = getattr(person, "passport_number", None) if person else None
        contact = getattr(person, "contact_number", None) if person else None

        org = getattr(booking, "organization", None)
        branch = getattr(booking, "branch", None)

        lead = None
        if passport:
            lead = Lead.objects.filter(organization=org, passport_number=passport).first()

        if not lead and contact:
            lead = Lead.objects.filter(organization=org, contact_number=contact).first()

        if lead:
            lead.booking = booking
            lead.conversion_status = "converted_to_booking"
            lead.lead_status = "confirmed"
            lead.save()
            logger.info(f"Linked existing lead {lead.id} to booking {getattr(booking, 'id', None)}")
            return lead

        # create new lead
        name = None
        if person:
            name = f"{person.first_name or ''} {person.last_name or ''}".strip()

        try:
            lead = Lead.objects.create(
                customer_full_name=name or booking.client_note or "",
                passport_number=passport,
                contact_number=contact,
                branch=branch,
                organization=org,
                lead_source="walk-in",
                lead_status="confirmed" if getattr(booking, "status", None) == "Confirmed" else "new",
                conversion_status="converted_to_booking",
                booking=booking,
                created_by_user=getattr(booking, "user", None),
            )
            logger.info(f"Created lead {lead.id} from booking {getattr(booking, 'id', None)}")
            return lead
        except Exception as e:
            logger.exception(f"Failed to create lead for booking {getattr(booking, 'id', None)}: {e}")
            raise
