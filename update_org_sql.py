"""
Direct SQL update for organization 11
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

def update_organization_sql():
    print("\n" + "="*80)
    print("UPDATING ORGANIZATION USING SQL")
    print("="*80)
    
    try:
        # Connect to database
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # First, check organization 11
        cursor.execute("SELECT id, name, org_code FROM organization_organization WHERE id = 11")
        org_row = cursor.fetchone()
        
        if org_row:
            print(f"\n✓ Organization 11 found:")
            print(f"  - ID: {org_row[0]}")
            print(f"  - Name: {org_row[1]}")
            print(f"  - Code: {org_row[2] if len(org_row) > 2 else 'N/A'}")
        else:
            print("\n✗ Organization 11 not found!")
            cursor.execute("SELECT id, name, org_code FROM organization_organization WHERE org_code = 'ORG-0006'")
            org_row = cursor.fetchone()
            if org_row:
                print(f"✓ Found ORG-0006 with ID: {org_row[0]}")
            else:
                print("✗ ORG-0006 not found either!")
                cursor.close()
                conn.close()
                return
        
        org_id = org_row[0]
        
        # Find user by email
        cursor.execute("SELECT id, username, email FROM auth_user WHERE email = 'abdulrafay@gmail.com'")
        user_row = cursor.fetchone()
        
        if user_row:
            user_id = user_row[0]
            print(f"\n✓ User found:")
            print(f"  - ID: {user_id}")
            print(f"  - Username: {user_row[1]}")
            print(f"  - Email: {user_row[2]}")
        else:
            print("\n✗ User 'abdulrafay@gmail.com' not found!")
            print("Trying user ID 52...")
            cursor.execute("SELECT id, username, email FROM auth_user WHERE id = 52")
            user_row = cursor.fetchone()
            if user_row:
                user_id = user_row[0]
                print(f"✓ Found: {user_row[1]} ({user_row[2]})")
            else:
                print("✗ User 52 not found!")
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
                print(f"  - ID: {org[0]}, Name: {org[1]}, Code: {org[2] if len(org) > 2 else 'N/A'}")
        else:
            print("  - None")
        
        # Clear existing organizations
        cursor.execute("DELETE FROM organization_organization_user WHERE user_id = %s", (user_id,))
        print(f"\n✓ Cleared existing organizations")
        
        # Add organization 11
        cursor.execute("""
            INSERT INTO organization_organization_user (user_id, organization_id)
            VALUES (%s, %s)
        """, (user_id, org_id))
        print(f"✓ Added organization {org_id}")
        
        # Note: Agent table doesn't exist in this database
        # The organization assignment via organization_organization_user is sufficient
        
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
        
        print(f"\n✓ Verification - User now has {len(new_orgs)} organization(s):")
        for org in new_orgs:
            print(f"  - ID: {org[0]}, Name: {org[1]}, Code: {org[2] if len(org) > 2 else 'N/A'}")
        
        print("\n" + "="*80)
        print("UPDATE COMPLETE!")
        print("="*80)
        print(f"\nExpected localStorage after login:")
        print(f'  agentOrg: {{"ids":[{org_id}],"user_id":{user_id},...}}')
        print("\nNext steps:")
        print("1. Log out and clear localStorage")
        print("2. Log in again")
        print("3. Verify agentOrg shows organization ID", org_id)
        print("="*80 + "\n")
        
        cursor.close()
        conn.close()
        
    except pymysql.Error as e:
        print(f"\n✗ Database error: {e}")
    except Exception as e:
        print(f"\n✗ Error: {e}")

if __name__ == '__main__':
    update_organization_sql()
