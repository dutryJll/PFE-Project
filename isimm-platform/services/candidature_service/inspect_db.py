#!/usr/bin/env python
import sqlite3
import os

db_path = 'db.sqlite3'

if not os.path.exists(db_path):
    print(f"Database {db_path} does not exist!")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("=" * 60)
print("TABLES IN DATABASE")
print("=" * 60)
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cur.fetchall()
for row in tables:
    print(f"  {row[0]}")

print("\n" + "=" * 60)
print("MIGRATION HISTORY FOR candidature_app")
print("=" * 60)
try:
    cur.execute("SELECT app, name FROM django_migrations WHERE app='candidature_app' ORDER BY name")
    migrations = cur.fetchall()
    for app, name in migrations:
        print(f"  [X] {name}")
except Exception as e:
    print(f"  Query failed: {e}")

print("\n" + "=" * 60)
print("TABLE EXISTENCE CHECK")
print("=" * 60)
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='candidature_app_candidature'")
exists = cur.fetchone()
print(f"  candidature_app_candidature: {'EXISTS' if exists else 'MISSING'}")

conn.close()
