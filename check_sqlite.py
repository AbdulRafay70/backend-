 import sqlite3
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="organization_links"')
result = cursor.fetchone()
print('Table exists:', bool(result))
if result:
    cursor.execute('SELECT COUNT(*) FROM organization_links')
    print('Rows:', cursor.fetchone()[0])
    cursor.execute('SELECT id, main_organization_id, link_organization_id, main_organization_request, link_organization_request, request_status FROM organization_links')
    rows = cursor.fetchall()
    for row in rows:
        print(row)
conn.close()