import sqlite3

DB = 'C:/Users/HP/Desktop/PFE/isimm-platform/services/candidature_service/db.sqlite3'
conn = sqlite3.connect(DB)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'candidature_app_%' ORDER BY name")
print([r[0] for r in cur.fetchall()])
conn.close()
