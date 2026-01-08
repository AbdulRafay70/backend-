import os
import sys
import django

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()


from organization.models import Agency, Branch, AgencyProfile, AgencyFiles, AgencyContact
from django.contrib.auth.models import User
from users.models import UserProfile

def delete_all_agencies_branches_agents():
    """Delete all agencies, branches, and agents from the database"""
    
    print("Starting deletion process...")
    
    # Delete all agencies (this will cascade to related AgencyFiles and AgencyContact)
    agency_count = Agency.objects.count()
    print(f"Deleting {agency_count} agencies...")
    Agency.objects.all().delete()
    print(f"✓ Deleted {agency_count} agencies")
    
    # Delete all branches
    branch_count = Branch.objects.count()
    print(f"Deleting {branch_count} branches...")
    Branch.objects.all().delete()
    print(f"✓ Deleted {branch_count} branches")
    
    # Delete all agency profiles
    agency_profile_count = AgencyProfile.objects.count()
    print(f"Deleting {agency_profile_count} agency profiles...")
    AgencyProfile.objects.all().delete()
    print(f"✓ Deleted {agency_profile_count} agency profiles")
    
    # Delete all agent users (users with type='agent' or type='subagent')
    agent_users = User.objects.filter(profile__type__in=['agent', 'subagent'])
    agent_count = agent_users.count()
    print(f"Deleting {agent_count} agent/subagent users...")
    agent_users.delete()
    print(f"✓ Deleted {agent_count} agent/subagent users")
    
    print("\n" + "="*50)
    print("✓ All agencies, branches, and agents deleted successfully!")
    print("="*50)

if __name__ == '__main__':
    delete_all_agencies_branches_agents()
