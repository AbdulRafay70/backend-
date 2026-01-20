"""
Django management command to delete all permissions and groups from the database.
Usage: python manage.py delete_permissions_groups
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from users.models import GroupExtension, PermissionExtension


class Command(BaseCommand):
    help = 'Delete all permissions and groups from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion without prompting',
        )

    def handle(self, *args, **options):
        # Count existing records
        group_count = Group.objects.count()
        permission_count = Permission.objects.count()
        group_ext_count = GroupExtension.objects.count()
        perm_ext_count = PermissionExtension.objects.count()

        self.stdout.write(self.style.WARNING(
            f'\n⚠️  WARNING: This will delete ALL permissions and groups from the database!\n'
        ))
        self.stdout.write(f'  • Groups: {group_count}')
        self.stdout.write(f'  • Group Extensions: {group_ext_count}')
        self.stdout.write(f'  • Permissions: {permission_count}')
        self.stdout.write(f'  • Permission Extensions: {perm_ext_count}\n')

        # Ask for confirmation unless --confirm flag is used
        if not options['confirm']:
            confirm = input('Are you sure you want to proceed? Type "yes" to continue: ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR('❌ Operation cancelled.'))
                return

        try:
            # Delete GroupExtensions first (foreign key to Group)
            self.stdout.write('Deleting GroupExtensions...')
            deleted_group_ext = GroupExtension.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(
                f'✅ Deleted {deleted_group_ext[0]} GroupExtension records'
            ))

            # Delete Groups (this will also remove user-group relationships)
            self.stdout.write('Deleting Groups...')
            deleted_groups = Group.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(
                f'✅ Deleted {deleted_groups[0]} Group records'
            ))

            # Delete PermissionExtensions first (foreign key to Permission)
            self.stdout.write('Deleting PermissionExtensions...')
            deleted_perm_ext = PermissionExtension.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(
                f'✅ Deleted {deleted_perm_ext[0]} PermissionExtension records'
            ))

            # Delete Permissions
            self.stdout.write('Deleting Permissions...')
            deleted_perms = Permission.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(
                f'✅ Deleted {deleted_perms[0]} Permission records'
            ))

            self.stdout.write(self.style.SUCCESS(
                '\n✅ Successfully deleted all permissions and groups from the database!'
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'\n❌ Error occurred: {str(e)}'
            ))
            raise
