"""
Verify that user 52 has organization 11 correctly set
"""
import pymysql

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'root',
    'database': 'saerpk_local',
    'charset': 'utf8mb4'
}

print("\n" + "="*80)
print("VERIFICATION: User 52 Organization Status")
print("="*80)

try:
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Get user 52 info
    cursor.execute("SELECT id, username, email FROM auth_user WHERE id = 52")
    user = cursor.fetchone()
    
    if user:
        print(f"\n✅ User 52 found:")
        print(f"   Username: {user[1]}")
        print(f"   Email: {user[2]}")
        
        # Get organizations
        cursor.execute("""
            SELECT o.id, o.name, o.org_code
            FROM organization_organization o
            INNER JOIN organization_organization_user oou ON o.id = oou.organization_id
            WHERE oou.user_id = 52
        """)
        orgs = cursor.fetchall()
        
        print(f"\n📋 Organizations assigned to user 52:")
        if orgs:
            for org in orgs:
                code = org[2] if len(org) > 2 else 'N/A'
                status = "✅" if org[0] == 11 else "❌"
                print(f"   {status} ID: {org[0]}, Name: {org[1]}, Code: {code}")
            
            if len(orgs) == 1 and orgs[0][0] == 11:
                print("\n" + "="*80)
                print("✅ SUCCESS! User 52 is correctly assigned to ONLY organization 11")
                print("="*80)
                print("\n📝 Expected login response:")
                print('   organization_details: [{"id": 11, "name": "rafay"}]')
                print("\n📝 Expected localStorage after login:")
                print('   agentOrganization: {"ids":[11],"user_id":52,"agency_id":41,"branch_id":46}')
                print("\n🔔 NEXT STEPS:")
                print("   1. Open your browser")
                print("   2. Press F12 > Application > Local Storage")
                print("   3. Delete the 'agentOrganization' key (or clear all)")
                print("   4. Log out from the app")
                print("   5. Log in again with agent1@example.com")
                print("   6. Check localStorage - should show organization ID 11")
                print("="*80)
            else:
                print("\n⚠️  WARNING: User has multiple organizations or wrong organization!")
                
        else:
            print("   ❌ No organizations found!")
    else:
        print("\n❌ User 52 not found!")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
