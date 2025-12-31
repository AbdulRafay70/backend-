"""
Update USER ID 52 to organization 11 (ORG-0006)
"""
import pymysql

# Database connection settings
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'root',
    'database': 'saerpk_local',
    'charset': 'utf8mb4'
}

def update_user_52():
    print("\n" + "="*80)
    print("UPDATING USER 52 TO ORGANIZATION 11 (ORG-0006)")
    print("="*80)
    
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Get organization 11
        cursor.execute("SELECT id, name, org_code FROM organization_organization WHERE id = 11")
        org_row = cursor.fetchone()
        
        if org_row:
            org_id = org_row[0]
            print(f"\n✓ Organization 11:")
            print(f"  - ID: {org_row[0]}")
            print(f"  - Name: {org_row[1]}")
            print(f"  - Code: {org_row[2] if len(org_row) > 2 else 'N/A'}")
        else:
            print("\n✗ Organization 11 not found!")
            cursor.close()
            conn.close()
            return
        
        # Get user 52
        cursor.execute("SELECT id, username, email FROM auth_user WHERE id = 52")
        user_row = cursor.fetchone()
        
        if user_row:
            user_id = user_row[0]
            print(f"\n✓ User 52:")
            print(f"  - ID: {user_id}")
            print(f"  - Username: {user_row[1]}")
            print(f"  - Email: {user_row[2]}")
        else:
            print("\n✗ User 52 not found!")
            cursor.close()
            conn.close()
            return
        
        # Show current organizations
        cursor.execute("""
            SELECT o.id, o.name, o.org_code 
            FROM organization_organization o
            INNER JOIN organization_organization_user oou ON o.id = oou.organization_id
            WHERE oou.user_id = %s
        """, (user_id,))
        current_orgs = cursor.fetchall()
        
        print(f"\nCurrent organizations for user {user_id}:")
        if current_orgs:
            for org in current_orgs:
                code = org[2] if len(org) > 2 else 'N/A'
                print(f"  - ID: {org[0]}, Name: {org[1]}, Code: {code}")
        else:
            print("  - None")
        
        # Clear existing organizations
        cursor.execute("DELETE FROM organization_organization_user WHERE user_id = %s", (user_id,))
        deleted = cursor.rowcount
        print(f"\n✓ Cleared {deleted} organization(s)")
        
        # Add organization 11
        cursor.execute("""
            INSERT INTO organization_organization_user (user_id, organization_id)
            VALUES (%s, %s)
        """, (user_id, org_id))
        print(f"✓ Added organization {org_id}")
        
        # Commit changes
        conn.commit()
        
        # Verify
        cursor.execute("""
            SELECT o.id, o.name, o.org_code 
            FROM organization_organization o
            INNER JOIN organization_organization_user oou ON o.id = oou.organization_id
            WHERE oou.user_id = %s
        """, (user_id,))
        new_orgs = cursor.fetchall()
        
        print(f"\n✓ VERIFIED - User {user_id} now has {len(new_orgs)} organization(s):")
        for org in new_orgs:
            code = org[2] if len(org) > 2 else 'N/A'
            print(f"  - ID: {org[0]}, Name: {org[1]}, Code: {code}")
        
        print("\n" + "="*80)
        print("✅ UPDATE SUCCESSFUL!")
        print("="*80)
        print(f"\nExpected agentOrganization after login:")
        print(f'  {{"ids":[{org_id}],"user_id":{user_id},"agency_id":41,"branch_id":46}}')
        print("\n🔔 IMPORTANT NEXT STEPS:")
        print("1. Log out from the application")
        print("2. Clear browser localStorage (press F12 > Application > Local Storage > Clear)")
        print("3. Log in again")
        print("4. Check localStorage - should show organization ID 11")
        print("="*80 + "\n")
        
        cursor.close()
        conn.close()
        
    except pymysql.Error as e:
        print(f"\n✗ Database error: {e}")
    except Exception as e:
        print(f"\n✗ Error: {e}")

if __name__ == '__main__':
    update_user_52()
