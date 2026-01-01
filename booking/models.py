from django.db import models
import hmac
import hashlib
import secrets
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from packages.models import TransportSectorPrice, City, Shirka
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


# ...existing code...

# Place BookingCallRemark model after all imports and before other model classes

class BookingCallRemark(models.Model):
    booking = models.ForeignKey('booking.Booking', on_delete=models.CASCADE, related_name='call_remarks')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    remark_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

# Create your models here.


class Bank(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, blank=True, null=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    account_title = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.TextField(blank=True, null=True)
    iban = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        # branch_code does not exist on this model; avoid AttributeError by
        # returning a safe, human-readable representation using available fields.
        parts = []
        if self.name:
            parts.append(str(self.name))
        if self.account_title:
            parts.append(str(self.account_title))
        if parts:
            return " - ".join(parts)
        # fallback to id so __str__ always returns something
        #  useful
        return f"Bank #{self.id}"


    class TRNSequence(models.Model):
        """Simple per-month sequence table to generate transaction numbers safely.

        prefix is like TRN-YYYYMM and last_seq stores the last used integer for that month.
        We rely on DB-level INSERT ... ON DUPLICATE KEY UPDATE to atomically increment.
        """
        prefix = models.CharField(max_length=32, primary_key=True)
        last_seq = models.IntegerField(default=0)

        class Meta:
            db_table = 'booking_trnsequence'
class InternalNote(models.Model):
    NOTE_STATUS = (
        ("clear", "Clear"),
        ("not_clear", "Not Clear"),
    )

    note_type = models.CharField(max_length=255)
    follow_up_date = models.DateField(null=True, blank=True)
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="internal_notes")  
    date_time = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    note = models.TextField()
    attachment = models.FileField(upload_to="internal_notes/", null=True, blank=True)
    working_status = models.CharField(max_length=20, choices=NOTE_STATUS, default="not_clear")

    def __str__(self):
        return f"{self.note_type} - {self.employee.username}"

class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    rejected_employer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rejected_employer", blank=True, null=True)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="bookings"
    )
    internals = models.ManyToManyField(
        InternalNote, related_name="bookings", blank=True, null=True
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="bookings"
    )
    agency = models.ForeignKey(
        Agency, on_delete=models.CASCADE, related_name="bookings"
    )
    confirmed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, related_name="confirmed_bookings", blank=True, null=True
    )
    selling_organization_id = models.IntegerField(blank=True, null=True)
    owner_organization_id = models.IntegerField(blank=True, null=True)
    booking_number = models.CharField(max_length=20)
    date = models.DateTimeField(auto_now_add=True)
    expiry_time= models.DateTimeField(blank=True, null=True)
    total_pax = models.IntegerField(default=0)
    total_adult = models.IntegerField(default=0)
    total_infant = models.IntegerField(default=0)
    total_child = models.IntegerField(default=0)
    total_ticket_amount = models.FloatField(default=0)
    total_hotel_amount = models.FloatField(default=0)
    total_transport_amount = models.FloatField(default=0)
    total_visa_amount = models.FloatField(default=0)
    total_amount = models.FloatField(default=0)
    
    total_hotel_amount_pkr = models.FloatField(default=0, blank=True, null=True)
    total_hotel_amount_sar = models.FloatField(default=0, blank=True, null=True)

    total_ziyarat_amount_pkr = models.FloatField(default=0, blank=True, null=True)
    total_ziyarat_amount_sar = models.FloatField(default=0, blank=True, null=True)

    total_food_amount_pkr = models.FloatField(default=0, blank=True, null=True)
    total_food_amount_sar = models.FloatField(default=0, blank=True, null=True)

    total_transport_amount_pkr = models.FloatField(default=0, blank=True, null=True)
    total_transport_amount_sar = models.FloatField(default=0, blank=True, null=True)

    total_visa_amount_pkr = models.FloatField(default=0, blank=True, null=True)
    total_visa_amount_sar = models.FloatField(default=0, blank=True, null=True)

    total_ticket_amount_pkr = models.FloatField(default=0, blank=True, null=True)

    total_in_pkr = models.FloatField(default=0, blank=True, null=True)

    paid_payment = models.FloatField(default=0, blank=True, null=True)
    pending_payment = models.FloatField(default=0, blank=True, null=True)

    umrah_package = models.ForeignKey(
        "packages.UmrahPackage", on_delete=models.SET_NULL, blank=True, null=True, related_name="bookings"
    )

    STATUS_CHOICES = [
        ('Un-approved', 'Un-approved'),
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Under-process', 'Under-process'),
        ('Approved', 'Approved'),
        ('Delivered', 'Delivered'),
        ('Canceled', 'Canceled'),
        ('Rejected', 'Rejected'),
    ]

    call_status = models.BooleanField(default=False) 
    client_note = models.TextField(blank=True, null=True)  
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    is_partial_payment_allowed = models.BooleanField(default=False)
    category = models.CharField(max_length=20,blank=True, null=True) 
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True) 
    action = models.CharField(max_length=100, blank=True, null=True) 
    rejected_notes = models.TextField(blank=True, null=True)
    rejected_at = models.DateTimeField(blank=True, null=True)
    is_visa_price_pkr = models.BooleanField(default=True)  # True → PKR, False → SAR
    visa_riyal_rate = models.FloatField(default=0, blank=True, null=True)  # Riyal rate at booking time
    visa_rate = models.FloatField(default=0, blank=True, null=True)        # Base visa rate (jis currency me diya gaya)
    visa_rate_in_sar = models.FloatField(default=0, blank=True, null=True) # Converted visa rate in SAR
    visa_rate_in_pkr = models.FloatField(default=0, blank=True, null=True)
    is_ziyarat_included = models.BooleanField(default=False)
    is_food_included = models.BooleanField(default=False)
    inventory_owner_organization_id = models.IntegerField(blank=True, null=True)
    booking_organization_id = models.IntegerField(blank=True, null=True)

    # New fields requested:
    BOOKING_TYPE_CHOICES = [
        ("TICKET", "Ticket"),
        ("UMRAH", "Umrah Package"),
        ("HOTEL", "Hotel"),
        ("OTHER", "Other"),
    ]
    booking_type = models.CharField(max_length=20, choices=BOOKING_TYPE_CHOICES, default="TICKET")
    is_full_package = models.BooleanField(default=False)
    # Public booking flags and metadata
    is_public_booking = models.BooleanField(default=False)
    created_by_user_type = models.CharField(max_length=30, blank=True, null=True)
    # invoice / external booking number (unique public-facing invoice id)
    invoice_no = models.CharField(max_length=64, unique=True, blank=True, null=True)
    # accumulate payments (use decimal for accuracy)
    total_payment_received = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Flag to indicate if any part of booking uses external/outsourced services (hotels)
    is_outsourced = models.BooleanField(default=False)

    # payments: optional JSON array to store payment entries (mirrors Payment model or quick payload)
    payments = models.JSONField(default=list, blank=True)

    # journal_items: list of line items (name, price, qty, total) for bookkeeping
    journal_items = models.JSONField(default=list, blank=True)

    reseller_commission = models.FloatField(default=0, blank=True, null=True)
    markup_by_reseller = models.FloatField(default=0, blank=True, null=True)
    # Public secure reference for read-only public access (QR / hashed link)
    public_ref = models.CharField(max_length=128, unique=True, blank=True, null=True)
    
    # Customer information
    customer_name = models.CharField(max_length=255, blank=True, null=True)
    customer_contact = models.CharField(max_length=50, blank=True, null=True)
    customer_email = models.EmailField(blank=True, null=True)
    customer_address = models.TextField(blank=True, null=True)
    
    # Contact information for public bookings (array of contacts) - from Developer 2
    contact_information = models.JSONField(default=list, blank=True, null=True, help_text="Array of contact objects with name, email, phone")
    
    # Ledger integration - auto-created when payment is completed
    ledger_entry = models.ForeignKey(
        'ledger.LedgerEntry', 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True, 
        related_name='bookings',
        help_text="Auto-created ledger entry when booking is paid"
    )
    
    # Discount/Promotion tracking
    total_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_notes = models.TextField(blank=True, null=True)

    def generate_public_ref(self):
        """Generate a unique HMAC-SHA256 based public reference using SECRET_KEY and booking_number.

        Format: INV-{booking_number}-{HEX}
        Only first 12 chars of digest are kept for readability.
        Ensures uniqueness by appending a counter if collision occurs (rare).
        """
        # base value uses booking_number if available, else fallback to id/secret
        base = (self.booking_number or str(self.id) or secrets.token_hex(8)).encode()
        key = settings.SECRET_KEY.encode()
        digest = hmac.new(key, base + (str(self.date.timestamp()).encode() if getattr(self, 'date', None) else b""), hashlib.sha256).hexdigest()
        short = digest[:12].upper()
        candidate = f"INV-{self.booking_number}-{short}" if self.booking_number else f"INV-{short}"

        # ensure uniqueness
        from django.db import transaction

        counter = 0
        unique_candidate = candidate
        while True:
            exists = Booking.objects.filter(public_ref=unique_candidate).exists()
            if not exists:
                break
            counter += 1
            unique_candidate = f"{candidate}-{counter}"

        self.public_ref = unique_candidate

    def generate_invoice_no(self):
        """Generate a short unique invoice number for public bookings."""
        import secrets

        if self.invoice_no:
            return
        base = (self.booking_number or str(self.id) or secrets.token_hex(6)).encode()
        short = secrets.token_hex(6).upper()
        candidate = f"INV-{short}"
        counter = 0
        unique_candidate = candidate
        while Booking.objects.filter(invoice_no=unique_candidate).exists():
            counter += 1
            unique_candidate = f"{candidate}-{counter}"
        self.invoice_no = unique_candidate
    
    def create_ledger_entry(self):
        """
        Create a ledger entry for this booking when payment is completed.
        This creates a double-entry accounting record following the client requirements.
        """
        from ledger.models import LedgerEntry, LedgerLine, Account
        from decimal import Decimal
        
        # Skip if ledger entry already exists
        if self.ledger_entry:
            return self.ledger_entry
        
        try:
            # Determine service type based on booking items
            service_type = 'other'
            if self.booking_items.exists():
                # Use the first item's type as primary service type
                first_item = self.booking_items.first()
                if first_item.inventory_type in ['ticket', 'hotel', 'transport', 'umrah', 'package']:
                    service_type = first_item.inventory_type
            
            # Calculate amounts
            total_amount = Decimal(str(self.total_amount))
            paid_amount = Decimal(str(self.paid_payment or 0))
            balance_amount = total_amount - paid_amount
            
            # Prepare reference number
            reference_no = self.invoice_no or self.booking_number
            
            # Build narration based on booking type
            if self.booking_type == 'TICKET':
                # Get first adult passenger
                first_adult = self.person_details.filter(age_group='Adult').first()
                pax_name = f"{first_adult.first_name} {first_adult.last_name}".strip() if first_adult else "N/A"
                
                # Get travel date from trip_details
                first_ticket = self.ticket_details.first()
                if first_ticket and first_ticket.trip_details.exists():
                    first_trip = first_ticket.trip_details.first()
                    travel_date = first_trip.departure_date_time.strftime('%Y-%m-%d') if first_trip.departure_date_time else "N/A"
                else:
                    travel_date = "N/A"
                
                # Get ticket type (trip_type)
                ticket_type = first_ticket.trip_type if first_ticket and first_ticket.trip_type else "N/A"
                
                # Get PNR number
                pnr = first_ticket.pnr if first_ticket and first_ticket.pnr else "N/A"
                
                # Build narration: "PNR - PAX Name - Travel Date - Trip Type"
                narration = f"{pnr} - {pax_name} - {travel_date} - {ticket_type}"
                transaction_type = 'Group Ticket'
            else:
                # For non-ticket bookings, use default narration
                narration = f"Booking {self.booking_number} - {self.customer_name or 'N/A'}"
                transaction_type = 'booking_payment'
            
            # Create main ledger entry
            ledger_entry = LedgerEntry.objects.create(
                reference_no=reference_no,
                booking_no=self.booking_number,
                transaction_type=transaction_type,
                service_type=service_type,
                narration=narration,
                remarks=f"Total: {total_amount}, Paid: {paid_amount}, Balance: {balance_amount}",
                booking=self,
                organization=self.organization,
                branch=self.branch,
                agency=self.agency,
                created_by=self.user,
                metadata={
                    'booking_id': self.id,
                    'booking_number': self.booking_number,
                    'invoice_no': self.invoice_no,
                    'customer_name': self.customer_name,
                    'customer_contact': self.customer_contact,
                    'total_amount': str(total_amount),
                    'paid_amount': str(paid_amount),
                    'balance_amount': str(balance_amount),
                    'booking_status': self.status,
                    'organization': self.organization.name if self.organization else None,
                    'branch': self.branch.name if self.branch else None,
                    'agency': self.agency.name if self.agency else None,
                    'ledger_entries': []
                }
            )
            
            # Get or create accounts (simplified - you may need to adjust based on your account structure)
            # Debit: Receivable/Cash account (Asset increases)
            # Credit: Sales/Revenue account (Income increases)
            
            # Try to find appropriate accounts for this organization/branch/agency
            receivable_account = Account.objects.filter(
                organization=self.organization,
                account_type='RECEIVABLE'
            ).first()
            
            if not receivable_account:
                # Create a default receivable account if it doesn't exist
                receivable_account = Account.objects.create(
                    organization=self.organization,
                    branch=self.branch,
                    agency=self.agency,
                    name=f"Accounts Receivable - {self.agency.name if self.agency else 'Default'}",
                    account_type='RECEIVABLE'
                )
            
            sales_account = Account.objects.filter(
                organization=self.organization,
                account_type='SALES'
            ).first()
            
            if not sales_account:
                # Create a default sales account if it doesn't exist
                sales_account = Account.objects.create(
                    organization=self.organization,
                    branch=self.branch,
                    agency=self.agency,
                    name=f"Sales Revenue - {self.agency.name if self.agency else 'Default'}",
                    account_type='SALES'
                )
            
            # Create ledger lines (double-entry)
            # For a booking: Show as DEBIT from agent's perspective
            # Debit Receivable (agent pays), Credit Sales (company receives)
            
            # Debit Receivable (Agent's expense - shows in Debit column)
            debit_line = LedgerLine.objects.create(
                ledger_entry=ledger_entry,
                account=receivable_account,
                debit=total_amount,
                credit=Decimal('0'),
                balance_after=receivable_account.balance - total_amount,
                remarks="Booking cost - deducted from balance"
            )
            
            # Credit Sales (Company revenue)
            credit_line = LedgerLine.objects.create(
                ledger_entry=ledger_entry,
                account=sales_account,
                debit=Decimal('0'),
                credit=total_amount,
                balance_after=sales_account.balance + total_amount,
                remarks="Booking revenue"
            )
            
            # Update account balances
            receivable_account.balance -= total_amount
            receivable_account.save()
            
            sales_account.balance += total_amount
            sales_account.save()
            
            # Add ledger entries to metadata
            ledger_entry.metadata['ledger_entries'] = [
                {
                    'transaction_type': 'booking_payment',
                    'debit': str(total_amount),
                    'credit': 0,
                    'balance_after': str(receivable_account.balance),
                    'remarks': 'Booking created - receivable account'
                },
                {
                    'transaction_type': 'booking_payment',
                    'debit': 0,
                    'credit': str(total_amount),
                    'balance_after': str(sales_account.balance),
                    'remarks': 'Sales revenue recorded'
                }
            ]
            
            # If there's a paid amount, record it
            if paid_amount > 0:
                ledger_entry.metadata['ledger_entries'].append({
                    'transaction_type': 'payment_received',
                    'credit': str(paid_amount),
                    'debit': 0,
                    'remarks': 'Advance payment received'
                })
            
            # If there's a balance, record it
            if balance_amount > 0:
                ledger_entry.metadata['ledger_entries'].append({
                    'transaction_type': 'balance_due',
                    'debit': str(balance_amount),
                    'credit': 0,
                    'remarks': 'Remaining balance due'
                })
            
            ledger_entry.save()
            
            return ledger_entry
            
        except Exception as e:
            # Log error but don't fail the booking save
            print(f"Error creating ledger entry for booking {self.booking_number}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def delete_ledger_entry(self):
        """
        Delete the ledger entry associated with this booking and reverse account balances.
        Called when booking status changes from 'Approved' to any other status.
        """
        if not self.ledger_entry:
            return
        
        try:
            from ledger.models import LedgerLine, Account
            from decimal import Decimal
            
            ledger_entry = self.ledger_entry
            
            # Get all ledger lines for this entry
            ledger_lines = ledger_entry.lines.all()
            
            # Reverse account balances
            for line in ledger_lines:
                account = line.account
                # Reverse the debit/credit
                account.balance -= line.debit
                account.balance += line.credit
                account.save()
            
            # Delete all ledger lines
            ledger_lines.delete()
            
            # Delete the ledger entry
            ledger_entry.delete()
            
            # Clear the reference
            self.ledger_entry = None
            
            print(f"✅ Deleted ledger entry for booking {self.booking_number}")
            
        except Exception as e:
            # Log error but don't fail the booking save
            print(f"❌ Error deleting ledger entry for booking {self.booking_number}: {e}")
            import traceback
            traceback.print_exc()

    def save(self, *args, **kwargs):
        # Track status changes
        old_status = None
        status_changed_to_approved = False
        status_changed_from_approved = False
        
        if self.pk:
            try:
                old_instance = Booking.objects.get(pk=self.pk)
                old_status = old_instance.status
                
                # Status changed TO Approved
                if old_status != 'Approved' and self.status == 'Approved':
                    status_changed_to_approved = True
                
                # Status changed FROM Approved to something else
                if old_status == 'Approved' and self.status != 'Approved':
                    status_changed_from_approved = True
            except Booking.DoesNotExist:
                pass
        
        # Generate booking_number if not present
        if not self.booking_number:
            import secrets
            from datetime import datetime
            # Format: BK-YYYYMMDD-XXXX (e.g., BK-20251101-A3F2)
            date_str = datetime.now().strftime('%Y%m%d')
            random_str = secrets.token_hex(2).upper()
            candidate = f"BK-{date_str}-{random_str}"
            counter = 0
            unique_candidate = candidate
            while Booking.objects.filter(booking_number=unique_candidate).exists():
                counter += 1
                random_str = secrets.token_hex(2).upper()
                unique_candidate = f"BK-{date_str}-{random_str}"
            self.booking_number = unique_candidate
        
        # generate public_ref on first save if missing
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Auto-create ledger entry when status becomes 'Approved'
        if status_changed_to_approved and not self.ledger_entry:
            ledger_entry = self.create_ledger_entry()
            if ledger_entry:
                self.ledger_entry = ledger_entry
                super().save(update_fields=['ledger_entry'])
        
        # Delete ledger entry when status changes FROM Approved to something else
        if status_changed_from_approved and self.ledger_entry:
            self.delete_ledger_entry()
            super().save(update_fields=['ledger_entry'])
        
        # Recalculate amounts to ensure they're always correct
        if self.pk:
            from django.db.models import Sum
            from decimal import Decimal
            
            # Try new system first (booking_items), fallback to old (ticket_details)
            if self.booking_items.exists():
                # New system: Use booking_items
                self.total_ticket_amount = self.booking_items.filter(
                    inventory_type='ticket').aggregate(total=Sum('final_amount'))['total'] or Decimal('0')
                self.total_hotel_amount = self.booking_items.filter(
                    inventory_type='hotel').aggregate(total=Sum('final_amount'))['total'] or Decimal('0')
                self.total_transport_amount = self.booking_items.filter(
                    inventory_type='transport').aggregate(total=Sum('final_amount'))['total'] or Decimal('0')
                self.total_visa_amount = self.booking_items.filter(
                    inventory_type='visa').aggregate(total=Sum('final_amount'))['total'] or Decimal('0')
            else:
                # Old system: Calculate from ticket_details (source of truth)
                ticket_sum = Decimal('0')
                
                for ticket_detail in self.ticket_details.all():
                    # Count passengers by age group
                    adults = self.person_details.filter(age_group='Adult').count()
                    children = self.person_details.filter(age_group='Child').count()
                    infants = self.person_details.filter(age_group='Infant').count()
                    
                    # Calculate total from ticket prices
                    ticket_sum += (
                        Decimal(str(ticket_detail.adult_price or 0)) * adults +
                        Decimal(str(ticket_detail.child_price or 0)) * children +
                        Decimal(str(ticket_detail.infant_price or 0)) * infants
                    )
                
                self.total_ticket_amount = ticket_sum
            
            # Calculate total visa amount in PKR from person_details
            visa_sum_pkr = Decimal('0')
            visa_sum_sar = Decimal('0')
            
            for person in self.person_details.all():
                # Check if this person's visa is in PKR or SAR
                if person.is_visa_price_pkr:
                    # Visa is in PKR, use visa_rate_in_pkr directly
                    visa_pkr = Decimal(str(person.visa_rate_in_pkr or 0))
                    visa_sum_pkr += visa_pkr
                else:
                    # Visa is in SAR, use visa_rate_in_sar and convert to PKR
                    visa_sar = Decimal(str(person.visa_rate_in_sar or 0))
                    riyal_rate = Decimal(str(person.visa_riyal_rate or 50))
                    visa_sum_pkr += visa_sar * riyal_rate
                    visa_sum_sar += visa_sar
            
            self.total_visa_amount_pkr = float(visa_sum_pkr)
            self.total_visa_amount_sar = float(visa_sum_sar)
            self.total_visa_amount = float(visa_sum_pkr)  # Keep total_visa_amount as PKR for consistency
            
            # Calculate total amount in PKR (use PKR-converted values for all components)
            self.total_amount = (
                Decimal(str(self.total_ticket_amount_pkr or self.total_ticket_amount or 0)) +
                Decimal(str(self.total_hotel_amount_pkr or 0)) +
                Decimal(str(self.total_transport_amount_pkr or 0)) +
                Decimal(str(self.total_visa_amount_pkr or self.total_visa_amount or 0)) +
                Decimal(str(self.total_food_amount_pkr or 0)) +
                Decimal(str(self.total_ziyarat_amount_pkr or 0))
            )
            
            # Save the updated amounts
            super().save(update_fields=[
                'total_ticket_amount', 'total_hotel_amount', 
                'total_transport_amount', 'total_visa_amount', 
                'total_visa_amount_pkr', 'total_visa_amount_sar', 'total_amount'
            ])
        
        # Generate invoice_no after first save (when we have an ID)
        if not self.invoice_no:
            self.generate_invoice_no()
            super().save(update_fields=["invoice_no"])
        
        try:
            if not self.public_ref:
                # regenerate now that we have a PK/date
                self.generate_public_ref()
                super().save(update_fields=["public_ref"])
        except Exception:
            # Do not block normal booking saves if public_ref generation fails
            pass

        # voucher QR is provided via property (avoid DB migrations here)
        # No-op: voucher QR URL computed dynamically via `voucher_qr_url` property below
    
    def __str__(self):
        """Display booking number with agency name and status"""
        try:
            agency_name = self.agency.name if self.agency else "N/A"
        except:
            agency_name = "N/A"
        return f"{self.booking_number} - {agency_name} ({self.status})"

    @property
    def voucher_qr_url(self):
        """Public-facing voucher URL for QR code generation.

        Uses SITE_BASE_URL or FRONTEND_URL from settings if available, else falls back
        to http://localhost:8000. Returns None if public_ref is missing.
        """
        try:
            if not self.public_ref:
                return None
            from django.conf import settings as _settings
            site_base = getattr(_settings, 'SITE_BASE_URL', None) or getattr(_settings, 'FRONTEND_URL', None) or 'http://localhost:8000'
            return f"{site_base.rstrip('/')}/order-status/?ref={self.public_ref}"
        except Exception:
            return None

class BookingHotelDetails(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
    ]
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="hotel_details"
    )
    hotel = models.ForeignKey("tickets.Hotels", on_delete=models.PROTECT)
    check_in_date = models.DateField(blank=True, null=True)
    check_out_date = models.DateField(blank=True, null=True)
    number_of_nights = models.IntegerField(default=0)
    room_type = models.CharField(max_length=20, blank=True, null=True)
    price = models.FloatField(default=0)
    quantity = models.FloatField(default=0)
    total_price = models.FloatField(default=0)
    riyal_rate = models.FloatField(default=0)
    is_price_pkr= models.BooleanField(default=True)
    contact_person_name = models.CharField(max_length=255, blank=True, null=True)
    contact_person_number = models.CharField(max_length=20, blank=True, null=True)
    leg_no = models.PositiveIntegerField(default=1)  
    check_in_status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="inactive"
    )
    check_out_status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="inactive"
    )
    total_in_riyal_rate = models.FloatField(blank=True, null=True)
    total_in_pkr = models.FloatField(blank=True, null=True)
    hotel_brn = models.CharField(max_length=100, blank=True, null=True)
    hotel_voucher_number = models.CharField(max_length=100, blank=True, null=True)
    special_request = models.TextField(blank=True, null=True)  
    sharing_type = models.CharField(max_length=50, blank=True, null=True)
    self_hotel_name = models.CharField(max_length=255, blank=True, null=True)
    # mark if this particular hotel detail row is from an outsourced/external hotel
    outsourced_hotel = models.BooleanField(default=False)
    
    # Organization tracking
    inventory_owner_organization_id = models.IntegerField(null=True, blank=True)
    booking_organization_id = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        # Be defensive: related `hotel` object may be missing (stale FK).
        # Accessing `self.hotel` can raise DoesNotExist during admin rendering
        # if the related Hotels row was deleted. Fall back to hotel_id.
        try:
            hotel_name = self.hotel.name if hasattr(self.hotel, 'name') else str(self.hotel)
        except Exception:
            hotel_name = f"[missing hotel id={getattr(self, 'hotel_id', None)}]"
        
        try:
            booking_num = self.booking.booking_number if self.booking else "N/A"
        except:
            booking_num = "N/A"
        
        room_info = f" - {self.room_type}" if self.room_type else ""
        return f"{booking_num} - {hotel_name}{room_info}"


class HotelOutsourcing(models.Model):
    """Record for outsourced/external hotel bookings tied to a Booking.

    Created when a passenger's hotel is sourced externally. This model is soft-deleteable
    via `is_deleted` and holds a pointer to ledger entries created for payables.
    """
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='outsourcing_records')
    booking_hotel_detail = models.ForeignKey(
        BookingHotelDetails, on_delete=models.SET_NULL, null=True, blank=True, related_name='outsourcing'
    )
    hotel_name = models.CharField(max_length=255)
    source_company = models.CharField(max_length=255, blank=True, null=True)
    check_in_date = models.DateField(blank=True, null=True)
    check_out_date = models.DateField(blank=True, null=True)
    room_type = models.CharField(max_length=100, blank=True, null=True)
    room_no = models.CharField(max_length=50, blank=True, null=True)
    price = models.FloatField(default=0)  # price per night
    quantity = models.PositiveIntegerField(default=1)
    number_of_nights = models.IntegerField(default=1)
    currency = models.CharField(max_length=10, default='PKR')
    remarks = models.TextField(blank=True, null=True)
    is_paid = models.BooleanField(default=False)
    agent_notified = models.BooleanField(default=False)
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    # link to ledger entry created for this outsourcing (if any)
    ledger_entry_id = models.IntegerField(blank=True, null=True)

    class Meta:
        ordering = ['-id']
        # Prevent duplicate active outsourcing for same booking/hotel detail
        constraints = [
            models.UniqueConstraint(fields=['booking', 'booking_hotel_detail'], condition=models.Q(is_deleted=False), name='unique_active_outsource_per_hoteldetail')
        ]
    
    def __str__(self):
        """Display hotel outsourcing with booking number and hotel name"""
        try:
            booking_num = self.booking.booking_number if self.booking else "N/A"
        except:
            booking_num = "N/A"
        return f"{booking_num} - {self.hotel_name} ({self.number_of_nights} nights)"

    @property
    def outsource_cost(self):
        try:
            return float(self.price) * float(self.quantity) * int(self.number_of_nights)
        except Exception:
            return 0.0

    def soft_delete(self):
        self.is_deleted = True
        self.save()


class BookingTransportDetails(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="transport_details"
    )
    # transport_sector = models.ForeignKey(TransportSectorPrice, on_delete=models.PROTECT)
    shirka= models.ForeignKey(Shirka, on_delete=models.PROTECT, blank=True, null=True)
    vehicle_type = models.ForeignKey(
        "VehicleType", on_delete=models.SET_NULL, null=True, blank=True, related_name="transport_details"
    )
    big_sector_id = models.IntegerField(blank=True, null=True)  # Reference to BigSector if used
    
    # Pricing fields
    is_price_pkr = models.BooleanField(default=True)
    riyal_rate = models.FloatField(default=50)
    price_in_pkr = models.FloatField(default=0)       
    price_in_sar = models.FloatField(default=0) 
    
    voucher_no = models.CharField(max_length=255, blank=True, null=True)
    brn_no = models.CharField(max_length=255, blank=True, null=True)
    
    # Organization tracking
    inventory_owner_organization_id = models.IntegerField(null=True, blank=True)
    booking_organization_id = models.IntegerField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Calculate price_in_pkr and price_in_sar based on is_price_pkr flag
        # This ensures both values are always populated
        if self.is_price_pkr:
            # Price is in PKR, calculate SAR
            if self.price_in_pkr and self.riyal_rate:
                self.price_in_sar = self.price_in_pkr / self.riyal_rate
        else:
            # Price is in SAR, calculate PKR
            if self.price_in_sar and self.riyal_rate:
                self.price_in_pkr = self.price_in_sar * self.riyal_rate
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking} - {self.vehicle_type.vehicle_name if self.vehicle_type else 'No Vehicle'}"


class BookingTicketDetails(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="ticket_details"
    )
    ticket = models.ForeignKey("tickets.Ticket", on_delete=models.PROTECT)
    is_meal_included = models.BooleanField(default=False)
    is_refundable = models.BooleanField(default=False)
    pnr = models.CharField(max_length=100)
    child_price = models.FloatField(default=0)
    infant_price = models.FloatField(default=0)
    adult_price = models.FloatField(default=0)
    seats = models.IntegerField(default=0)
    weight = models.FloatField(default=0)
    pieces = models.IntegerField(default=0)
    is_umrah_seat = models.BooleanField(default=False)
    trip_type = models.CharField(max_length=50)
    departure_stay_type = models.CharField(max_length=50)
    return_stay_type = models.CharField(max_length=50)
    status = models.CharField(max_length=50, blank=True, null=True)
    # is_price_pkr= models.BooleanField(default=True)
    # riyal_rate = models.FloatField(default=0)
    
    # Organization tracking
    inventory_owner_organization_id = models.IntegerField(null=True, blank=True)
    booking_organization_id = models.IntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        """
        Override save to update Ticket counters (booked_tickets, confirmed_tickets, left_seats)
        when booking ticket details are created or updated.
        """
        from tickets.models import Ticket

        old = None
        if self.pk:
            try:
                old = BookingTicketDetails.objects.get(pk=self.pk)
            except BookingTicketDetails.DoesNotExist:
                old = None

        super().save(*args, **kwargs)

        try:
            ticket = Ticket.objects.get(pk=self.ticket_id)
        except Ticket.DoesNotExist:
            return

        # compute seat delta for booked_tickets
        new_seats = self.seats or 0
        old_seats = old.seats if old else 0
        delta = new_seats - old_seats

        if delta != 0:
            ticket.booked_tickets = max(0, ticket.booked_tickets + delta)
            ticket.left_seats = max(0, ticket.total_seats - ticket.booked_tickets)

        # handle confirmed status transition
        old_status = getattr(old, 'status', None)
        new_status = self.status
        if old_status != 'Confirmed' and new_status == 'Confirmed':
            # add to confirmed_tickets
            ticket.confirmed_tickets = ticket.confirmed_tickets + new_seats
        elif old_status == 'Confirmed' and new_status != 'Confirmed':
            # remove from confirmed_tickets
            ticket.confirmed_tickets = max(0, ticket.confirmed_tickets - old_seats)

        ticket.save()

    def delete(self, *args, **kwargs):
        """Adjust ticket counters when booking ticket detail is deleted."""
        from tickets.models import Ticket

        try:
            ticket = Ticket.objects.get(pk=self.ticket_id)
        except Ticket.DoesNotExist:
            super().delete(*args, **kwargs)
            return

        # subtract seats
        seats = self.seats or 0
        ticket.booked_tickets = max(0, ticket.booked_tickets - seats)
        ticket.left_seats = max(0, ticket.total_seats - ticket.booked_tickets)

        if self.status == 'Confirmed':
            ticket.confirmed_tickets = max(0, ticket.confirmed_tickets - seats)

        ticket.save()
        super().delete(*args, **kwargs)


class BookingTicketTicketTripDetails(models.Model):
    ticket = models.ForeignKey(
        BookingTicketDetails, on_delete=models.CASCADE, related_name="trip_details"
    )
    departure_date_time = models.DateTimeField()
    arrival_date_time = models.DateTimeField()
    departure_city = models.ForeignKey(
        City, on_delete=models.CASCADE, related_name="booking_departure_city"
    )
    arrival_city = models.ForeignKey(
        City, on_delete=models.CASCADE, related_name="booking_arrival_city"
    )
    trip_type = models.CharField(max_length=50)


class BookingTicketStopoverDetails(models.Model):
    ticket = models.ForeignKey(
        BookingTicketDetails, on_delete=models.CASCADE, related_name="stopover_details"
    )
    stopover_city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
    )
    stopover_duration = models.CharField(max_length=100)
    trip_type = models.CharField(max_length=50)


class BookingPersonDetail(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="person_details"
    )
    # Ticket selection for this passenger
    ticket = models.ForeignKey(
        "tickets.Ticket", on_delete=models.SET_NULL, blank=True, null=True, 
        related_name="passenger_bookings",
        help_text="Select ticket for this passenger"
    )
    age_group = models.CharField(max_length=20, blank=True, null=True)
    person_title = models.CharField(max_length=10, blank=True, null=True)
    first_name = models.CharField(max_length=30, blank=True, null=True)
    last_name = models.CharField(max_length=30, blank=True, null=True)
    passport_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    passpoet_issue_date = models.DateField(blank=True, null=True)
    passport_expiry_date = models.DateField(blank=True, null=True)
    passport_picture = models.ImageField(
        upload_to="media/passport_pictures", blank=True, null=True
    )
    country = models.CharField(max_length=50, blank=True, null=True)
    is_visa_included = models.BooleanField(default=False)
    visa_price = models.FloatField(default=0)
    is_family_head = models.BooleanField(default=False)
    family_number= models.IntegerField(default=0)
    shirka = models.ForeignKey(Shirka, on_delete=models.PROTECT, blank=True, null=True)
    visa_status = models.CharField(
        max_length=20, default="Pending"
    )  # e.g., Pending, Approved, Rejected
    ticket_status = models.CharField(
        max_length=20, default="Pending"
    )  # e.g., Pending, Confirmed, Cancelled
    hotel_status = models.CharField(
        max_length=20, default="Pending"
    ) # e.g., Pending, Checked In, Checked Out
    food_status = models.CharField(
        max_length=20, default="Pending"
    ) # e.g., Pending, Served
    ziyarat_status = models.CharField(
        max_length=20, default="Pending"
    ) # e.g., Pending, Completed
    transport_status = models.CharField(
        max_length=20, default="Pending"
    ) # e.g., Pending, Departed
    ticket_remarks = models.TextField(blank=True, null=True)
    visa_group_number = models.CharField(max_length=20, blank=True, null=True)
    visa_remarks = models.TextField(blank=True, null=True)  # visa remarks
    contact_number = models.CharField(max_length=20, blank=True, null=True)  # contact number
    this_pex_remarks = models.TextField(blank=True, null=True)  # this pex remarks
    ticket_price = models.FloatField(default=0)  # ticket price
    ticket_discount = models.FloatField(default=0)
    is_visa_price_pkr = models.BooleanField(default=True)  # True → PKR, False → SAR
    visa_rate_in_sar = models.FloatField(default=0, blank=True, null=True) # SAR rate if applicable
    visa_rate_in_pkr = models.FloatField(default=0, blank=True, null=True) # PKR rate if applicable
    visa_riyal_rate = models.FloatField(default=0, blank=True, null=True)  # Riyal exchange rate at booking time
    ticket_included = models.BooleanField(default=True)

class PassengerActivityStatus(models.Model):
    passenger = models.ForeignKey(BookingPersonDetail, on_delete=models.CASCADE, related_name='activity_status_records')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    activity = GenericForeignKey('content_type', 'object_id')
    status = models.CharField(max_length=20, default='Pending')

    class Meta:
        unique_together = ('passenger', 'content_type', 'object_id')
        verbose_name = "Passenger Activity Status"
        verbose_name_plural = "Passenger Activity Statuses"

    def __str__(self):
        return f"{self.passenger.first_name} - {self.activity} - {self.status}"
    # ticket_voucher_number = models.CharField(max_length=20, blank=True, null=True)
    # ticker_brn= models.CharField(max_length=20, blank=True, null=True)
    # food_voucher_number = models.CharField(max_length=20, blank=True, null=True)
    # food_brn = models.CharField(max_length=20, blank=True, null=True)
    # ziyarat_voucher_number = models.CharField(max_length=20, blank=True, null=True)
    # ziyarat_brn = models.CharField(max_length=20, blank=True, null=True)
    # transport_voucher_number = models.CharField(max_length=20, blank=True, null=True)
    # transport_brn = models.CharField(max_length=20, blank=True, null=True)

class BookingPersonContactDetails(models.Model):
    person = models.ForeignKey(
        BookingPersonDetail, on_delete=models.CASCADE, related_name="contact_details"
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

class BookingPersonZiyaratDetails(models.Model):
    person = models.ForeignKey(
        BookingPersonDetail, on_delete=models.CASCADE, related_name="ziyarat_details"
    )
    city = models.CharField(max_length=50) 
    total_pax = models.IntegerField(default=0)  
    per_pax_price = models.FloatField(default=0)  
    total_price = models.FloatField(default=0)  
    total_price_in_pkr = models.FloatField(default=0)  
    price_in_sar = models.FloatField(default=0) 
    date= models.DateField()
    price = models.FloatField(default=0)
    is_price_pkr= models.BooleanField(default=True)
    contact_person_name = models.CharField(max_length=100, blank=True, null=True)  
    contact_number = models.CharField(max_length=20, blank=True, null=True)  

    ziyarar_voucher_number = models.CharField(max_length=100, blank=True, null=True)  
    ziyarat_brn = models.CharField(max_length=100, blank=True, null=True)  

    is_price_pkr = models.BooleanField(default=True)  
    riyal_rate = models.FloatField(default=0)


class BookingPersonFoodDetails(models.Model):
    person = models.ForeignKey(
        BookingPersonDetail, on_delete=models.CASCADE, related_name="food_details"
    )
    food = models.CharField(max_length=50)
    price = models.FloatField(default=0)
    is_price_pkr= models.BooleanField(default=True)
    total_pax = models.IntegerField(default=0)  
    per_pax_price = models.FloatField(default=0)  
    total_price = models.FloatField(default=0)  
    total_price_in_pkr = models.FloatField(default=0)  
    price_in_sar = models.FloatField(default=0)  

    contact_person_name = models.CharField(max_length=100, blank=True, null=True)  
    contact_number = models.CharField(max_length=20, blank=True, null=True)  

    food_voucher_number = models.CharField(max_length=100, blank=True, null=True)  
    food_brn = models.CharField(max_length=100, blank=True, null=True)  

    riyal_rate = models.FloatField(default=0)


class Payment(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="payments"
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="payments"
    )
    agency = models.ForeignKey(
        Agency, on_delete=models.CASCADE, related_name="payments", blank=True, null=True
    )
    agent = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="payments", blank=True, null=True
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_payments",
        blank=True,
        null=True,
    )
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="payment_details",
        blank=True,
        null=True,
    )
    method = models.CharField(max_length=50)
    bank = models.ForeignKey(
        Bank, on_delete=models.CASCADE, related_name="payments", blank=True, null=True
    )
    # When payment is cash, record who deposited the cash and their CNIC
    cash_depositor_name = models.CharField(max_length=255, blank=True, null=True)
    cash_depositor_cnic = models.CharField(max_length=50, blank=True, null=True)
    # Agent bank account (optional) - bank account used by the agent for this payment
    agent_bank_account = models.ForeignKey(
        'BankAccount', on_delete=models.SET_NULL, related_name="agent_payments", blank=True, null=True
    )
    # Organization bank account (optional) - bank account of the organization receiving the payment
    organization_bank_account = models.ForeignKey(
        'BankAccount', on_delete=models.SET_NULL, related_name="organization_payments", blank=True, null=True
    )
    amount = models.FloatField(default=0)
    date = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20, default="Pending"
    )  # e.g., Pending, Completed, Failed
    image = models.ImageField(upload_to="media/payment_receipts", blank=True, null=True)
    transaction_number = models.CharField(max_length=100, blank=True, null=True)
    # KuickPay transaction/reference number (optional)
    kuickpay_trn = models.CharField(max_length=128, blank=True, null=True)
    # Public-mode flag indicates this payment was created by an unauthenticated/public flow
    public_mode = models.BooleanField(default=False)
    # store ledger entry id created when payment is approved (for later reversal)
    ledger_entry_id = models.IntegerField(blank=True, null=True)
    # payment_type distinguishes payments linked to a booking vs direct/company payments
    PAYMENT_TYPE_CHOICES = (
        ("booking", "Booking"),
        ("direct", "Direct"),
    )
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default="booking")

    def save(self, *args, **kwargs):
        """Ensure every Payment has a transaction_number.

        If not provided, generate one using timestamp + random hex to keep it short
        and reasonably unique. This runs for all create/update paths.
        """
        # detect status transition: Completed -> Rejected (we'll act after save)
        old_status = None
        try:
            if self.pk:
                old = Payment.objects.filter(pk=self.pk).only('status').first()
                if old:
                    old_status = old.status
        except Exception:
            old_status = None

        # Note: bank_name field removed — do not attempt to auto-populate it here.

        # Generate transaction_number if not provided. Format: TRN-YYYYMM-00001 (incrementing per month)
        if not self.transaction_number:
            # Only generate for new records (avoid changing existing transaction numbers on updates)
            if not self.pk:
                from django.db import transaction
                import re

                now = timezone.now()
                prefix = f"TRN-{now.strftime('%Y%m')}"

                # Use a dedicated counter row in the DB to atomically increment the per-month sequence.
                # This approach uses an INSERT ... ON DUPLICATE KEY UPDATE to safely increment the
                # counter even under high concurrency without complex locking.
                from django.db import connection
                try:
                    with connection.cursor() as cur:
                        # Try to insert a new counter row for this prefix (will fail if exists)
                        cur.execute(
                            "INSERT INTO booking_trnsequence (prefix, last_seq) VALUES (%s, 1) ON DUPLICATE KEY UPDATE last_seq = last_seq + 1",
                            [prefix],
                        )
                        # Read back the current counter value
                        cur.execute("SELECT last_seq FROM booking_trnsequence WHERE prefix = %s", [prefix])
                        row = cur.fetchone()
                        if row:
                            seq = int(row[0])
                        else:
                            seq = 1

                        self.transaction_number = f"{prefix}-{seq:05d}"
                except Exception:
                    # Final fallback: try select_for_update method, then timestamp+random
                    try:
                        with transaction.atomic():
                            last = (
                                Payment.objects.select_for_update()
                                .filter(transaction_number__startswith=prefix)
                                .order_by('-transaction_number')
                                .first()
                            )

                            seq = 1
                            if last and getattr(last, 'transaction_number', None):
                                m = re.search(r"(\d{5})$", last.transaction_number)
                                if m:
                                    try:
                                        seq = int(m.group(1)) + 1
                                    except Exception:
                                        seq = 1

                            self.transaction_number = f"{prefix}-{seq:05d}"
                    except Exception:
                        ts = timezone.now().strftime('%Y%m%d%H%M%S')
                        rand = secrets.token_hex(4).upper()
                        self.transaction_number = f"TRX{ts}{rand}"

        # perform the actual save first
        res = super().save(*args, **kwargs)

        # If status changed to Completed, create ledger entry for payment approval
        if old_status != 'Completed' and self.status == 'Completed' and not self.ledger_entry_id:
            try:
                from ledger.models import LedgerEntry, LedgerLine, Account
                from decimal import Decimal
                
                # Get organization
                org = self.booking.organization if self.booking else self.organization
                branch = self.booking.branch if self.booking else self.branch
                agency = self.booking.agency if self.booking else self.agency
                
                # Get or create accounts
                receivable_account = Account.objects.filter(
                    organization=org,
                    account_type='RECEIVABLE'
                ).first()
                
                if not receivable_account:
                    receivable_account = Account.objects.create(
                        organization=org,
                        branch=branch,
                        agency=agency,
                        name=f"Accounts Receivable - {agency.name if agency else 'Default'}",
                        account_type='RECEIVABLE'
                    )
                
                # Prepare narration
                if self.booking:
                    narration = f"Payment received for booking {self.booking.booking_number}"
                    reference_no = self.booking.booking_number
                else:
                    narration = f"Agent deposit - {self.method or 'Payment'}"
                    reference_no = self.transaction_number
                
                amount = Decimal(str(self.amount or 0))
                
                # Create ledger entry
                ledger_entry = LedgerEntry.objects.create(
                    reference_no=reference_no,
                    booking_no=self.booking.booking_number if self.booking else None,
                    transaction_type='deposit',
                    service_type='payment',
                    narration=narration,
                    remarks=f"Payment #{self.id} - {self.method or 'Payment'}",
                    organization=org,
                    branch=branch,
                    agency=agency,
                    created_by=self.created_by,
                    metadata={
                        'payment_id': self.id,
                        'transaction_number': self.transaction_number,
                        'method': self.method,
                        'amount': str(amount),
                    }
                )

                
                # Create ledger line - Credit to agent's account (increases balance)
                LedgerLine.objects.create(
                    ledger_entry=ledger_entry,
                    account=receivable_account,
                    debit=Decimal('0'),
                    credit=amount,
                    balance_after=receivable_account.balance + amount,
                    remarks="Deposit received"
                )
                
                # Update account balance
                receivable_account.balance += amount
                receivable_account.save()
                
                # Save ledger entry ID
                self.ledger_entry_id = ledger_entry.id
                super().save(update_fields=['ledger_entry_id'])
                
            except Exception as e:
                # Log the error instead of silently swallowing it
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to create ledger entry for payment {self.id}: {e}")

        # If a previously completed payment was changed to Rejected, attempt to reverse the
        # ledger entry that was created when it was approved, and adjust booking totals.
        try:
            if old_status == 'Completed' and self.status and self.status.lower().startswith('reject'):
                # call ledger helper to create reversal entry
                try:
                    from organization.ledger_utils import create_reversal_entry
                except Exception:
                    create_reversal_entry = None

                # Attempt reversal for the recorded ledger entry id. If the
                # payment didn't persist the ledger_entry_id for some reason
                # (we've seen cases where the ledger was created but the
                # payment.ledger_entry_id remained null), attempt to locate
                # a ledger entry by metadata.payment_id and reverse that.
                if self.ledger_entry_id:
                    try:
                        from ledger.models import LedgerEntry
                        entry = LedgerEntry.objects.get(id=self.ledger_entry_id)
                        entry.reverse(user=self.created_by, remarks=f"Payment #{self.id} rejected")
                    except Exception:
                        pass

                if not self.ledger_entry_id:
                    try:
                        # lazy import to avoid circulars
                        from ledger.models import LedgerEntry
                        # find the most recent non-reversed LedgerEntry that references this payment
                        src = LedgerEntry.objects.filter(metadata__payment_id=self.id, reversed=False).order_by('-created_at').first()
                        if src:
                            src.reverse(user=self.created_by, remarks=f"Payment #{self.id} rejected (fallback)")
                    except Exception:
                        # swallow any import/query errors
                        pass

                # clear stored ledger reference
                if self.ledger_entry_id:
                    try:
                        Payment.objects.filter(pk=self.pk).update(ledger_entry_id=None)
                        self.ledger_entry_id = None
                    except Exception:
                        pass

                # adjust booking totals (subtract this payment amount)
                try:
                    if self.booking:
                        from decimal import Decimal
                        b = self.booking
                        try:
                            prev = Decimal(str(b.total_payment_received or 0))
                        except Exception:
                            prev = Decimal('0')
                        try:
                            amt = Decimal(str(self.amount or 0))
                        except Exception:
                            amt = Decimal('0')

                        new_received = max(Decimal('0'), prev - amt)
                        b.total_payment_received = new_received
                        paid = float(new_received or 0)
                        total = float(b.total_amount or 0)
                        b.paid_payment = paid
                        b.pending_payment = max(0.0, total - paid)
                        if paid < total:
                            b.is_paid = False
                        b.save(update_fields=['total_payment_received', 'paid_payment', 'pending_payment', 'is_paid'])
                except Exception:
                    # swallow errors to avoid breaking payment save
                    pass

        except Exception:
            # swallow any errors during post-save handling
            pass

        return res
class Sector(models.Model):
    departure_city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name="departure_sectors",
        null=True,
        blank=True
    )
    arrival_city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name="arrival_sectors",
        null=True,
        blank=True
    )
    contact_name = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=20)
    SECTOR_TYPE_CHOICES = [
        ("AIRPORT PICKUP", "Airport Pickup"),
        ("AIRPORT DROP", "Airport Drop"),
        ("HOTEL TO HOTEL", "Hotel to Hotel"),
    ]
    sector_type = models.CharField(max_length=32, choices=SECTOR_TYPE_CHOICES, blank=True, null=True)
    # Convenience boolean flags (only one should be true based on sector_type)
    is_airport_pickup = models.BooleanField(default=False)
    is_airport_drop = models.BooleanField(default=False)
    is_hotel_to_hotel = models.BooleanField(default=False)
    
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="sectors"
    )
    class Meta:
        db_table = "small_sector"

    def __str__(self):
        return f"{self.departure_city or '---'} → {self.arrival_city or '---'}"
class BigSector(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="big_sectors"
    )
    small_sectors = models.ManyToManyField(Sector, related_name="big_sectors")

    class Meta:
        db_table = "big_sector"

    def __str__(self):
        return f"BigSector #{self.id} ({self.organization.name})"

class VehicleType(models.Model):
    vehicle_name = models.CharField(max_length=100)  
    small_sector = models.ForeignKey(
        Sector, on_delete=models.SET_NULL, related_name="vehicle_types", null=True, blank=True
    )
    big_sector = models.ForeignKey(
        BigSector, on_delete=models.SET_NULL, related_name="vehicle_types", null=True, blank=True
    )
    vehicle_type = models.CharField(max_length=100)  # simple varchar
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True)
    # New explicit per-person selling/purchase fields
    adult_selling_price = models.FloatField(default=0)
    adult_purchase_price = models.FloatField(default=0)
    child_selling_price = models.FloatField(default=0)
    child_purchase_price = models.FloatField(default=0)
    infant_selling_price = models.FloatField(default=0)
    infant_purchase_price = models.FloatField(default=0)
    note = models.TextField(null=True, blank=True)
    visa_type = models.CharField(max_length=100)  
    status = models.CharField(max_length=10, choices=[("active", "Active"), ("inactive", "Inactive")], default="active")
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="vehicle_types"
    )

    class Meta:
        db_table = "vehicle_type"

    def __str__(self):
        return self.vehicle_name
        
class BookingTransportSector(models.Model):
    transport_detail = models.ForeignKey(
        BookingTransportDetails, on_delete=models.CASCADE, related_name="sector_details"
    )
    sector_no = models.IntegerField(default=0)  # SECTOR NO
    small_sector_id = models.IntegerField(blank=True, null=True)  # SMALL SECTOR ID (reference only)
    sector_type = models.CharField(max_length=50, blank=True, null=True)  # AIRPORT PICKUP, HOTEL TO HOTEL, AIRPORT DROP
    is_airport_pickup = models.BooleanField(default=False)
    is_airport_drop = models.BooleanField(default=False)
    is_hotel_to_hotel = models.BooleanField(default=False)
    
    # Store actual city names (expanded from BigSector or SmallSector)
    departure_city = models.CharField(max_length=100, blank=True, null=True)
    arrival_city = models.CharField(max_length=100, blank=True, null=True)
    
    date = models.DateField(blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    contact_person_name = models.CharField(max_length=100, blank=True, null=True)
    voucher_no = models.CharField(max_length=100, blank=True, null=True)
    brn_no = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Sector {self.sector_no} - {self.transport_detail_id}"
class BankAccount(models.Model):
    STATUS_CHOICES = (
        ("active", "Active"),
        ("inactive", "Inactive"),
    )

    bank_name = models.CharField(max_length=255)
    account_title = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    iban = models.CharField(max_length=34, unique=True)

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="bank_accounts",blank=True, null=True
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="bank_accounts",blank=True, null=True
    )
    agency = models.ForeignKey(
        Agency, on_delete=models.CASCADE, related_name="bank_accounts",blank=True, null=True
    )

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # New fields: mark account as company-owned and who created it
    is_company_account = models.BooleanField(default=False)
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_bank_accounts')

    def __str__(self):
        return f"{self.bank_name} - {self.account_title}"
class OrganizationLink(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
    ]

    organization_id = models.IntegerField()  # ya ForeignKey to Organization agar table hai
    this_organization_request = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    main_organization_request = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    request_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Org {self.organization_id} ({self.this_organization_request}/{self.main_organization_request})"
class AllowedReseller(models.Model):
    inventory_owner_company = models.ForeignKey(
        OrganizationLink, on_delete=models.CASCADE, related_name="allowed_resellers"
    )

    # Single reseller company allowed to resell the owner's inventory
    reseller_company = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="reseller_links",
        null=True, blank=True
    )

    ALLOWED_CHOICES = [
        ("GROUP_TICKETS", "Group Tickets"),
        ("UMRAH_PACKAGES", "Umrah Packages"),
        ("HOTELS", "Hotels"),
    ]

    # Which inventory types the reseller is allowed to access. Stored as JSON list.
    allowed_types = models.JSONField(default=list)
    # Optional per-item permissions. Example: [{"type": "package", "id": 12}, {"type":"hotel","id":45}]
    allowed_items = models.JSONField(default=list, blank=True)

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
    ]
    requested_status_by_reseller = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="PENDING"
    )

    # Link to discount group (optional)
    discount_group = models.ForeignKey(
        "DiscountGroup", on_delete=models.SET_NULL, null=True, blank=True, related_name="allowed_resellers"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.inventory_owner_company} → Resellers"
class DiscountGroup(models.Model):
    name = models.CharField(max_length=255)
    # optional group_type to classify discount groups (e.g., "SENIOR", "STUDENT", "CORPORATE")
    group_type = models.CharField(max_length=100, blank=True, null=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="discount_groups")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
class Discount(models.Model):
    discount_group = models.ForeignKey(DiscountGroup, on_delete=models.CASCADE, related_name="discounts")
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="discounts")

    # kis cheez pe discount hai
    things = models.CharField(
        max_length=50,
        choices=[
            ("group_ticket", "Group Ticket"),
            ("umrah_package", "Umrah Package"),
            ("hotel", "Hotel"),
        ]
    )

    # ticket / package discount
    group_ticket_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    umrah_package_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, choices=[("PKR", "PKR"), ("SAR", "SAR")], default="PKR")

    # hotel discount
    room_type = models.CharField(
        max_length=50,
        choices=[
            ("quint", "Quint"),
            ("quad", "Quad"),
            ("triple", "Triple"),
            ("double", "Double"),
            ("sharing", "Sharing"),
            ("all", "All Types"),
        ],
        null=True, blank=True
    )
    per_night_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # store discounted hotels as a proper ManyToMany relation to tickets.Hotels
    discounted_hotels = models.ManyToManyField(
        'tickets.Hotels', related_name='discounts', blank=True
    )

    def __str__(self):
        return f"{self.discount_group.name} - {self.things}"
class Markup(models.Model):
    APPLIES_CHOICES = [
        ("group_ticket", "Group Ticket"),
        ("hotel", "Hotel"),
        ("umrah_package", "Umrah Package"),
    ]

    name = models.CharField(max_length=100)
    applies_to = models.CharField(max_length=20, choices=APPLIES_CHOICES)
    ticket_markup = models.FloatField(default=0, blank=True, null=True)
    hotel_per_night_markup = models.FloatField(default=0, blank=True, null=True)
    umrah_package_markup = models.FloatField(default=0, blank=True, null=True)

    # ab ye sirf organization ki ID store karega, koi relation nahi banega
    organization_id = models.IntegerField(default=0, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.applies_to})"


class BookingItem(models.Model):
    """
    Represents individual inventory items in a booking.
    Can be hotel, transport, package, visa, or other services.
    """
    INVENTORY_TYPE_CHOICES = [
        ('hotel', 'Hotel'),
        ('transport', 'Transport'),
        ('package', 'Package'),
        ('visa', 'Visa'),
        ('ticket', 'Ticket'),
        ('ziyarat', 'Ziyarat'),
        ('food', 'Food'),
        ('other', 'Other'),
    ]
    
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='booking_items'
    )
    inventory_type = models.CharField(max_length=20, choices=INVENTORY_TYPE_CHOICES)
    
    # Foreign keys to different inventory types (only one will be used per item)
    hotel = models.ForeignKey(
        'tickets.Hotels', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='booking_items'
    )
    transport = models.ForeignKey(
        'packages.TransportSectorPrice', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='booking_items'
    )
    package = models.ForeignKey(
        'packages.UmrahPackage', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='package_booking_items'
    )
    visa = models.ForeignKey(
        'packages.Visa', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='booking_items'
    )
    ticket = models.ForeignKey(
        'tickets.Ticket', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='booking_items'
    )
    
    # Item details
    item_name = models.CharField(max_length=255, help_text="Display name for the item")
    description = models.TextField(blank=True, null=True)
    
    # Pricing
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity = models.IntegerField(default=1)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Additional details stored as JSON for flexibility
    item_details = models.JSONField(
        default=dict, blank=True,
        help_text="Store type-specific details like room_type, check_in, vehicle_type, etc."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['id']
        verbose_name = "Booking Item"
        verbose_name_plural = "Booking Items"
    
    def save(self, *args, **kwargs):
        from decimal import Decimal
        
        # Auto-fill item_name from selected inventory if not provided
        if not self.item_name or self.item_name.strip() == '':
            if self.hotel:
                self.item_name = f"{self.hotel.name}"
            elif self.transport:
                self.item_name = f"{self.transport.name}"
            elif self.package:
                self.item_name = f"{self.package.title}"
            elif self.visa:
                self.item_name = f"{self.visa.get_visa_type_display()} Visa - {self.visa.get_country_display()}"
            elif self.ticket:
                airline_name = self.ticket.airline.name if self.ticket.airline else "Flight"
                self.item_name = f"{airline_name} Ticket"
            else:
                # Fallback for other inventory types
                self.item_name = f"{self.get_inventory_type_display()} Item"
        
        # Auto-fill unit_price from selected inventory if not already set
        if not self.unit_price or self.unit_price == 0:
            if self.hotel:
                # Try to get price from hotel prices (get the latest/first price)
                hotel_price = self.hotel.prices.first()
                if hotel_price:
                    self.unit_price = Decimal(str(hotel_price.price))
            elif self.transport:
                # Use adult price from transport
                self.unit_price = Decimal(str(self.transport.adault_price or 0))
            elif self.package:
                # Use package price (adult price or base price)
                price = getattr(self.package, 'adult_price', 0) or getattr(self.package, 'price_per_person', 0) or 0
                self.unit_price = Decimal(str(price))
            elif self.visa:
                # Use adult visa price
                price = self.visa.adult_price or self.visa.price or 0
                self.unit_price = Decimal(str(price))
            elif self.ticket:
                # Use adult fare from ticket
                self.unit_price = Decimal(str(self.ticket.adult_fare or 0))
        
        # Auto-calculate final amount - ensure all values are Decimal
        unit_price = Decimal(str(self.unit_price or 0))
        quantity = Decimal(str(self.quantity or 1))
        discount = Decimal(str(self.discount_amount or 0))
        self.final_amount = (unit_price * quantity) - discount
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.booking.booking_number} - {self.inventory_type}: {self.item_name}"


class BookingPax(models.Model):
    """
    Passenger (PAX) details for a booking.
    Links passengers to visa and other services.
    """
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='booking_pax'
    )
    
    # Link to existing BookingPersonDetail if needed
    person_detail = models.ForeignKey(
        'BookingPersonDetail', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='pax_records'
    )
    
    # PAX identification
    pax_id = models.CharField(max_length=50, unique=True, editable=False, blank=True)
    
    # Personal information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    passport_no = models.CharField(max_length=50, blank=True, null=True)
    passport_expiry = models.DateField(blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    
    # Visa assignment
    visa = models.ForeignKey(
        'packages.Visa', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_pax'
    )
    
    # PAX type
    PAX_TYPE_CHOICES = [
        ('adult', 'Adult'),
        ('child', 'Child'),
        ('infant', 'Infant'),
    ]
    pax_type = models.CharField(max_length=10, choices=PAX_TYPE_CHOICES, default='adult')
    
    # Contact details
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    
    # Additional details
    special_requests = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['id']
        verbose_name = "Booking PAX"
        verbose_name_plural = "Booking PAX"
    
    def save(self, *args, **kwargs):
        # Auto-generate PAX ID
        if not self.pax_id:
            import secrets
            from datetime import datetime
            # Format: PAX-YYYYMMDD-XXXX
            date_str = datetime.now().strftime('%Y%m%d')
            random_str = secrets.token_hex(2).upper()
            candidate = f"PAX-{date_str}-{random_str}"
            counter = 0
            unique_candidate = candidate
            while BookingPax.objects.filter(pax_id=unique_candidate).exists():
                counter += 1
                random_str = secrets.token_hex(2).upper()
                unique_candidate = f"PAX-{date_str}-{random_str}"
            self.pax_id = unique_candidate
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.pax_id} - {self.first_name} {self.last_name}"


class BookingStatusTimeline(models.Model):
    """
    Track status changes over time for a booking.
    Provides complete audit trail of booking lifecycle.
    """
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='status_timeline'
    )
    status = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='booking_status_changes', db_constraint=False
    )
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['timestamp']
        verbose_name = "Booking Status Timeline"
        verbose_name_plural = "Booking Status Timelines"
    
    def __str__(self):
        return f"{self.booking.booking_number} - {self.status} at {self.timestamp}"


class BookingPromotion(models.Model):
    """
    Link promotions/discounts to bookings.
    Tracks which promotions were applied and their impact.
    """
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='applied_promotions'
    )
    
    # Link to discount group if applicable
    discount_group = models.ForeignKey(
        DiscountGroup, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='booking_applications'
    )
    
    promotion_code = models.CharField(max_length=50, blank=True, null=True)
    promotion_name = models.CharField(max_length=255)
    discount_type = models.CharField(
        max_length=20,
        choices=[
            ('percentage', 'Percentage'),
            ('fixed', 'Fixed Amount'),
            ('per_item', 'Per Item'),
        ],
        default='percentage'
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # What the promotion applies to
    applies_to = models.CharField(
        max_length=50,
        choices=[
            ('total', 'Total Amount'),
            ('hotel', 'Hotel'),
            ('transport', 'Transport'),
            ('visa', 'Visa'),
            ('package', 'Package'),
        ],
        default='total'
    )
    
    is_active = models.BooleanField(default=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-applied_at']
        verbose_name = "Booking Promotion"
        verbose_name_plural = "Booking Promotions"
    
    def __str__(self):
        return f"{self.booking.booking_number} - {self.promotion_name}"


class BookingPayment(models.Model):
    """
    Individual payment records for a booking.
    Supports multiple payments, partial payments, and payment tracking.
    """
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='payment_records'
    )
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank', 'Bank Transfer'),
        ('card', 'Credit/Debit Card'),
        ('online', 'Online Payment'),
        ('cheque', 'Cheque'),
        ('other', 'Other'),
    ]
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    reference_no = models.CharField(max_length=100, blank=True, null=True)
    
    # Link to ledger if needed
    ledger_entry_id = models.IntegerField(blank=True, null=True)
    
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='payment_entries', db_constraint=False
    )
    
    class Meta:
        ordering = ['-payment_date']
        verbose_name = "Booking Payment"
        verbose_name_plural = "Booking Payments"
    
    def __str__(self):
        return f"{self.booking.booking_number} - {self.amount} ({self.payment_method})"



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
    status = models.CharField(max_length=20, default='Served') # e.g., Pending, Served, Cancelled
    
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
    status = models.CharField(max_length=20, default='Pending') # e.g., Pending, Started, Completed, Canceled
    
    def __str__(self):
        return f"{self.ziarat} - Booking {self.booking.booking_number}"