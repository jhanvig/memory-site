# create_chinu.py
import sqlite3

DB = "database.db"
USERNAME_TO_COPY = "viji"   # source user
NEW_USERNAME = "chinu"      # new user to create

conn = sqlite3.connect(DB)
cur = conn.cursor()

cur.execute("SELECT password_hash FROM users WHERE username = ?", (USERNAME_TO_COPY,))
row = cur.fetchone()

if not row:
    print(f"Source user '{USERNAME_TO_COPY}' not found. Aborting.")
else:
    viji_hash = row[0]
    try:
        cur.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (NEW_USERNAME, viji_hash)
        )
        conn.commit()
        print(f"User '{NEW_USERNAME}' created successfully (password copied from {USERNAME_TO_COPY}).")
    except Exception as e:
        print("Insert error:", e)

conn.close()