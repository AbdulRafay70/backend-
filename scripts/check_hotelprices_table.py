import sqlite3
import sys

db = 'db.sqlite3'
try:
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info('tickets_hotelprices')")
    rows = cursor.fetchall()
    if not rows:
        print('NO_TABLE')
    else:
        for r in rows:
            print(r)
    conn.close()
except Exception as e:
    print('ERROR', e)
    sys.exit(1)
