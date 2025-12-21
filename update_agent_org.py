"""
Update agent's organization access to only organization 11 (rafay)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import get_user_model
from organization.models import Organization, Agent

User = get_user_model()

def update_agent_organization():
    """Update the logged-in agent to have access only to organization 11"""
    
    print("\n" + "="*80)
    print("UPDATING AGENT ORGANIZATION ACCESS")
    print("="*80)
    
    # Find the agent with user_id 52 (from localStorage)
    try:
        user = User.objects.get(id=52)
        print(f"\n✓ Found user: {user.username} (ID: {user.id})")
    except User.DoesNotExist:
        print("\n✗ User with ID 52 not found. Let me find the current logged-in agent...")
        # Try to find by email or username
        user = User.objects.filter(email__icontains='agent').first()
        if not user:
            user = User.objects.filter(is_staff=False).first()
        
        if user:
            print(f"✓ Found user: {user.username} (ID: {user.id})")
        else:
            print("✗ No agent user found!")
            return
    
    # Get organization 11 (rafay)
    try:
        rafay_org = Organization.objects.get(id=11)
        print(f"✓ Found organization: {rafay_org.name} (ID: {rafay_org.id})")
    except Organization.DoesNotExist:
        print("\n✗ Organization 11 (rafay) not found!")
        print("Available organizations:")
        for org in Organization.objects.all()[:10]:
            print(f"  - ID: {org.id}, Name: {org.name}")
        return
    
    # Find or create the Agent record
    try:
        agent = Agent.objects.get(user=user)
        print(f"✓ Found agent record for user {user.username}")
    except Agent.DoesNotExist:
        print(f"⚠ No agent record found, creating one...")
        agent = Agent.objects.create(
            user=user,
            organization=rafay_org
        )
        print(f"✓ Created agent record")
    
    # Update the agent's organization to only organization 11
    old_org = agent.organization
    agent.organization = rafay_org
    agent.save()
    
    print(f"\n✓ Updated agent organization:")
    print(f"  - Old organization: {old_org.name if old_org else 'None'} (ID: {old_org.id if old_org else 'None'})")
    print(f"  - New organization: {rafay_org.name} (ID: {rafay_org.id})")
    
    # Also update any AgentOrganization many-to-many relationships if they exist
    try:
        # Clear all existing organization associations
        if hasattr(agent, 'organizations'):
            agent.organizations.clear()
            agent.organizations.add(rafay_org)
            print(f"✓ Updated many-to-many organizations to only include org 11")
    except Exception as e:
        print(f"⚠ No many-to-many organizations field: {e}")
    
    print("\n" + "="*80)
    print("UPDATE COMPLETE")
    print("="*80)
    print("\nNext steps:")
    print("1. Clear your browser's localStorage")
    print("2. Log out and log back in")
    print("3. The agent should now only have access to organization 11 (rafay)")
    print("="*80)

if __name__ == '__main__':
    update_agent_organization()
