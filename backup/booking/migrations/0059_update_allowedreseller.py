from django.db import migrations, models
import django.db.models.deletion


def forwards_copy_m2m(apps, schema_editor):
	# Copy entries from the old M2M join table into individual AllowedReseller rows
	# so that each previous reseller becomes a separate AllowedReseller record.
	connection = schema_editor.connection
	with connection.cursor() as cursor:
		cursor.execute(
			"""
			SELECT ar.id, ar.inventory_owner_company_id, ar.allowed, ar.requested_status_by_reseller,
				   ar.commission_group_id, ar.markup_group_id, ar.created_at, ar.updated_at,
				   r.organization_id
			FROM booking_allowedreseller ar
			JOIN booking_allowedreseller_reseller_companies r ON ar.id = r.allowedreseller_id
			"""
		)
		rows = cursor.fetchall()

		if not rows:
			return

		insert_sql = (
			"""
			INSERT INTO booking_allowedreseller
			(inventory_owner_company_id, reseller_company_id, allowed, requested_status_by_reseller,
			 commission_group_id, markup_group_id, created_at, updated_at)
			VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
			"""
		)

		for (
			orig_id,
			inventory_owner_company,
			allowed,
			requested_status_by_reseller,
			commission_group_id,
			markup_group_id,
			created_at,
			updated_at,
			org_id,
		) in rows:
			cursor.execute(
				insert_sql,
				[
					inventory_owner_company,
					org_id,
					allowed,
					requested_status_by_reseller,
					commission_group_id,
					markup_group_id,
					created_at,
					updated_at,
				],
			)


class Migration(migrations.Migration):

	dependencies = [
		("booking", "0058_alter_bank_account_title_alter_bank_name_and_more"),
	]

	operations = [
		# Add reseller_company FK (so we can populate it from the M2M table)
		migrations.AddField(
			model_name="allowedreseller",
			name="reseller_company",
			field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="reseller_links", to="organization.organization"),
		),
		# Add discount_group FK
		migrations.AddField(
			model_name="allowedreseller",
			name="discount_group",
			field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="allowed_resellers", to="booking.discountgroup"),
		),

		# Data migration: copy existing M2M entries into individual AllowedReseller rows
		migrations.RunPython(code=forwards_copy_m2m, reverse_code=migrations.RunPython.noop),

		# Remove M2M field reseller_companies (after data copy)
		migrations.RemoveField(
			model_name="allowedreseller",
			name="reseller_companies",
		),
		# Remove old commission/markup integer fields
		migrations.RemoveField(
			model_name="allowedreseller",
			name="commission_group_id",
		),
		migrations.RemoveField(
			model_name="allowedreseller",
			name="markup_group_id",
		),
		# Rename allowed -> allowed_types
		migrations.RenameField(
			model_name="allowedreseller",
			old_name="allowed",
			new_name="allowed_types",
		),
	]

