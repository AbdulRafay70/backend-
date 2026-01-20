from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = 'Delete the unused display_order_delivery_admin permission'

    def handle(self, *args, **options):
        try:
            # Find and delete the display_order_delivery_admin permission
            deleted_count = Permission.objects.filter(
                codename='display_order_delivery_admin'
            ).delete()[0]

            if deleted_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully deleted {deleted_count} display_order_delivery_admin permission(s)'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        'No display_order_delivery_admin permissions found to delete'
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error deleting permission: {str(e)}')
            )
