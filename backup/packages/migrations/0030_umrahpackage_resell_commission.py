from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0029_umrahpackagetransportdetails_transport_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='umrahpackage',
            name='reselling_allowed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='area_agent_commission_adult',
            field=models.FloatField(blank=True, null=True, default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='area_agent_commission_child',
            field=models.FloatField(blank=True, null=True, default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='area_agent_commission_infant',
            field=models.FloatField(blank=True, null=True, default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='branch_commission_adult',
            field=models.FloatField(blank=True, null=True, default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='branch_commission_child',
            field=models.FloatField(blank=True, null=True, default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='branch_commission_infant',
            field=models.FloatField(blank=True, null=True, default=0),
        ),
    ]
