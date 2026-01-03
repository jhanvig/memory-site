# create_nawt.py
import sqlite3
from werkzeug.security import generate_password_hash

DB = "database.db"
USERNAME = "nawt"
PASSWORD = "prettyboi"

conn = sqlite3.connect(DB)
cur = conn.cursor()

password_hash = generate_password_hash(PASSWORD)

try:
    cur.execute(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        (USERNAME, password_hash)
    )
    conn.commit()
    print(f"User '{USERNAME}' created successfully.")
except Exception as e:
    print("Insert error:", e)

conn.close()
