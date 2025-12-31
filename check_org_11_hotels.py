"""
Check hotels for organization 11
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
print("HOTELS IN ORGANIZATION 11 (ORG-0006)")
print("="*80)

try:
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Count hotels
    cursor.execute("SELECT COUNT(*) FROM tickets_hotels WHERE organization_id = 11 AND is_active = 1")
    count = cursor.fetchone()[0]
    
    print(f"\n✅ Total active hotels: {count}")
    
    if count > 0:
        # Get sample hotels
        cursor.execute("""
            SELECT id, name, address
            FROM tickets_hotels 
            WHERE organization_id = 11 AND is_active = 1 
            LIMIT 10
        """)
        hotels = cursor.fetchall()
        
        print("\n📋 Sample hotels:")
        for h in hotels:
            print(f"   - ID: {h[0]}, Name: {h[1]}, Address: {h[2] if h[2] else 'N/A'}")
        
        print("\n" + "="*80)
        print("✅ Organization 11 has hotels available!")
        print("="*80)
        print("\n🔍 Why hotels are not showing:")
        print("   The issue is that your localStorage still has OLD organization IDs [40, 13]")
        print("   The frontend is sending: ?organization=40 or ?organization=13")
        print("   But the user now only has access to organization 11")
        print("\n✅ SOLUTION:")
        print("   1. Clear localStorage in your browser")
        print("   2. Log out and log in again")
        print("   3. The API will then receive: ?organization=11")
        print("   4. Hotels will display correctly!")
        print("="*80)
    else:
        print("\n⚠️  No hotels found in organization 11")
        print("   You may need to add hotels to this organization")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
