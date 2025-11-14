from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organization", "0005_agency_logo"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrganizationLink",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ("link_organization_request", models.CharField(choices=[('PENDING', 'Pending'), ('ACCEPTED', 'Accepted'), ('REJECTED', 'Rejected')], default='PENDING', max_length=20)),
                ("main_organization_request", models.CharField(choices=[('PENDING', 'Pending'), ('ACCEPTED', 'Accepted'), ('REJECTED', 'Rejected')], default='PENDING', max_length=20)),
                ("request_status", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("link_organization", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='linked_with', to='organization.organization')),
                ("main_organization", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='main_links', to='organization.organization')),
            ],
            options={
                'db_table': 'organization_links',
            },
        ),
    ]
