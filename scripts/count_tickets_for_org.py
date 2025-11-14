#!/usr/bin/env python3
"""
Simple helper to inspect local sqlite DB files and count ticket rows for an organization.

Usage (PowerShell):
  python .\scripts\count_tickets_for_org.py --org 11

The script looks for common sqlite files in the repository root and attempts to
find tables with "ticket" in their name. For each candidate table it checks
which organization-like columns exist and runs a count query.
"""
import argparse
import os
import sqlite3
import sys


def find_sqlite_files(root):
    candidates = [
        os.path.join(root, "db.sqlite3"),
        os.path.join(root, "local_db.sqlite3"),
        os.path.join(root, "db_new.sqlite3"),
    ]
    return [p for p in candidates if os.path.exists(p)]


def get_tables(conn):
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    return [row[0] for row in cur.fetchall()]


def get_columns(conn, table):
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info('{table}')")
    return [row[1] for row in cur.fetchall()]


def count_for_org(conn, table, org_id):
    cols = get_columns(conn, table)
    # candidate org-like columns
    org_cols = [c for c in cols if c in (
        'organization', 'organization_id', 'inventory_owner_organization_id',
        'owner_organization_id', 'inventory_owner_company', 'company_id'
    )]

    if not org_cols:
        return None, cols

    where_clauses = " OR ".join([f"{c} = ?" for c in org_cols])
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT COUNT(*) FROM '{table}' WHERE {where_clauses}", tuple([org_id] * len(org_cols)))
        count = cur.fetchone()[0]
    except Exception as e:
        return f"ERROR: {e}", cols

    # also fetch a few sample rows
    try:
        cur.execute(f"SELECT * FROM '{table}' WHERE {where_clauses} LIMIT 5", tuple([org_id] * len(org_cols)))
        samples = cur.fetchall()
    except Exception:
        samples = []

    return count, cols, samples


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--org", type=int, default=11, help="Organization id to count tickets for")
    parser.add_argument("--root", default=os.getcwd(), help="Repository root to scan for sqlite files")
    args = parser.parse_args()

    sqlite_files = find_sqlite_files(args.root)
    if not sqlite_files:
        print("No sqlite files found in repo root. Looked for db.sqlite3, local_db.sqlite3, db_new.sqlite3")
        sys.exit(1)

    print(f"Found sqlite files: {sqlite_files}")

    for path in sqlite_files:
        print("\n-- DB:", path)
        try:
            conn = sqlite3.connect(path)
        except Exception as e:
            print("Failed to open:", e)
            continue

        tables = get_tables(conn)
        ticket_tables = [t for t in tables if "ticket" in t.lower()]
        if not ticket_tables:
            print("No ticket-like tables found. Available tables:", tables)
            conn.close()
            continue

        for table in ticket_tables:
            print(f"\nTable: {table}")
            info = count_for_org(conn, table, args.org)
            if info is None:
                print("Could not determine columns for table")
                continue

            if isinstance(info[0], str) and info[0].startswith("ERROR"):
                print(info[0])
                print("Columns:", info[1])
                continue

            count, cols, samples = info
            print("Columns:", cols)
            print(f"Count of rows matching org {args.org}: {count}")
            if samples:
                print("Sample rows (truncated):")
                for s in samples:
                    print(s)

        conn.close()


if __name__ == "__main__":
    main()
