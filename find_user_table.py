import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='root', database='saerpk_local')
cursor = conn.cursor()
cursor.execute("SHOW TABLES LIKE '%user%'")
tables = cursor.fetchall()
print('Tables with "user" in name:')
for t in tables:
    print(f'  - {t[0]}')
    
print('\nTables with "custom" in name:')
cursor.execute("SHOW TABLES LIKE '%custom%'")
tables = cursor.fetchall()
for t in tables:
    print(f'  - {t[0]}')

print('\nAll tables starting with "auth":')
cursor.execute("SHOW TABLES LIKE 'auth%'")
tables = cursor.fetchall()
for t in tables:
    print(f'  - {t[0]}')

print('\nAll tables with "agent" in name:')
cursor.execute("SHOW TABLES LIKE '%agent%'")
tables = cursor.fetchall()
for t in tables:
    print(f'  - {t[0]}')

print('\nAll organization tables:')
cursor.execute("SHOW TABLES LIKE 'organization_%'")
tables = cursor.fetchall()
for t in tables:
    print(f'  - {t[0]}')

cursor.close()
conn.close()
