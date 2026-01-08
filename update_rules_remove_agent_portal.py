"""
Update rules to remove agent_portal references and update page assignments.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Rule

print("=" * 80)
print("UPDATING RULES - REMOVING AGENT_PORTAL")
print("=" * 80)

# Find all rules with agent_portal
rules_with_agent_portal = Rule.objects.filter(pages_to_display__contains='agent_portal')
print(f"\nFound {rules_with_agent_portal.count()} rules with 'agent_portal'")

updated_count = 0
for rule in rules_with_agent_portal:
    print(f"\n📝 Updating: {rule.title}")
    print(f"   Old pages: {rule.pages_to_display}")
    
    # Remove agent_portal from the list
    new_pages = [page for page in rule.pages_to_display if page != 'agent_portal']
    
    # If no pages left, add dashboard as default
    if not new_pages:
        new_pages = ['dashboard']
        print(f"   ⚠️  No pages left, adding 'dashboard' as default")
    
    rule.pages_to_display = new_pages
    rule.save()
    updated_count += 1
    
    print(f"   New pages: {rule.pages_to_display}")

print("\n" + "=" * 80)
print(f"✅ Updated {updated_count} rules")
print("=" * 80)

# Show summary
print("\n📊 RULES BY PAGE:")
print("=" * 80)

pages = ['dashboard', 'booking_page', 'hotel_page', 'visa_page', 'payment_page', 'transport_page']
for page in pages:
    count = Rule.objects.filter(pages_to_display__contains=page, is_active=True).count()
    print(f"{page}: {count} rules")

print("\n" + "=" * 80)
print("🎉 DONE!")
print("=" * 80)
