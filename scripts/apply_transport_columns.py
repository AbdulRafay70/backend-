import pymysql
import sys

DB_HOST = '127.0.0.1'
DB_PORT = 3306
DB_USER = 'root'
DB_PASS = 'root'
DB_NAME = 'saerpk_local'

TABLES = [
    ('packages_umrahpackagetransportdetails', 'transport_selling_price'),
    ('packages_umrahpackagetransportdetails', 'transport_purchase_price'),
    ('packages_customumrahpackagetransportdetails', 'transport_selling_price'),
    ('packages_customumrahpackagetransportdetails', 'transport_purchase_price'),
]

ALTER_TEMPLATE = "ALTER TABLE `{table}` ADD COLUMN `{column}` DOUBLE DEFAULT 0"

def column_exists(conn, table, column):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s AND COLUMN_NAME=%s",
            (DB_NAME, table, column)
        )
        r = cur.fetchone()
        return (r and r.get('cnt', 0) > 0)


def apply_changes():
    conn = None
    try:
        conn = pymysql.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, database=DB_NAME, charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
        print(f"Connected to {DB_NAME} on {DB_HOST}:{DB_PORT} as {DB_USER}")
        with conn.cursor() as cur:
            for table, column in TABLES:
                print(f"Checking {table}.{column}...")
                if column_exists(conn, table, column):
                    print(f"  - already exists, skipping")
                    continue
                sql = ALTER_TEMPLATE.format(table=table, column=column)
                try:
                    print(f"  - executing: {sql}")
                    cur.execute(sql)
                    conn.commit()
                    print(f"  - added {column} to {table}")
                except Exception as e:
                    print(f"  - failed to ALTER TABLE {table}: {e}")
        print("Done.")
    except Exception as e:
        print("ERROR connecting or executing SQL:", e)
        sys.exit(2)
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    apply_changes()
