from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction

from .models import Organization, Branch, Agency, Employee


def create_org_for_user(instance: User):
    """Create Organization/Branch/Agency/Employee for given User if they have none.

    This helper is callable from admin actions and scripts. It returns the
    created Organization or None if no creation was needed or failed.
    """
    # avoid creating org if this user is already linked to one (safety)
    if instance.organizations.exists():
        return None

    def _truncate(val: str, maxlen: int):
        if not val:
            return ""
        return val if len(val) <= maxlen else val[: maxlen]

    try:
        with transaction.atomic():
            org_name = instance.email or (instance.get_full_name() or instance.username)
            org_name = _truncate(org_name, 30)
            org = Organization.objects.create(
                name=org_name,
                email=instance.email or "",
                phone_number=getattr(instance, "phone_number", None) or "",
            )
            org.user.add(instance)
            branch_name = f"{org.name} - Default Branch"
            branch_name = _truncate(branch_name, 30)
            branch = Branch.objects.create(
                organization=org,
                name=branch_name,
                contact_number=getattr(instance, "phone_number", None) or "",
                email=instance.email or "",
            )
            branch.user.add(instance)
            agency_name = f"{org.name} - Default Agency"
            agency_name = _truncate(agency_name, 30)
            agency = Agency.objects.create(
                branch=branch,
                name=agency_name,
                phone_number=getattr(instance, "phone_number", None) or "",
                email=instance.email or "",
            )
            agency.user.add(instance)

            full_name = instance.get_full_name() or instance.username
            first_name = full_name.split(" ")[0]
            last_name = " ".join(full_name.split(" ")[1:]) if len(full_name.split(" ")) > 1 else ""

            # Choose a unique email for Employee.email to avoid unique constraint
            if instance.email and not Employee.objects.filter(email=instance.email).exists():
                emp_email = instance.email
            else:
                # build a synthetic unique email using org id
                emp_email = f"{instance.username}.org{org.id}@local"

            # Create Employee only if one doesn't already exist for this user
            from .models import Employee as _Employee
            if not _Employee.objects.filter(user=instance).exists():
                _Employee.objects.create(
                    user=instance,
                    first_name=first_name,
                    last_name=last_name,
                    email=emp_email,
                    phone_number=getattr(instance, "phone_number", None) or "",
                    agency=agency,
                )

            return org
    except Exception:
        # Log the exception to stdout for easier debugging in admin/shell
        import traceback
        traceback.print_exc()
        return None



@receiver(post_save, sender=User)
def create_organization_for_new_user(sender, instance: User, created: bool, **kwargs):
    # only act when a user is newly created
    if not created:
        return

    create_org_for_user(instance)
