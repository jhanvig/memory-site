import sqlite3
from werkzeug.security import generate_password_hash

conn = sqlite3.connect("database.db")
c = conn.cursor()

c.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    gdrive_link TEXT,
    photos TEXT,
    message TEXT
)
""")

username = "rhea"
password = "test123"

c.execute("INSERT OR IGNORE INTO users (username, password_hash, gdrive_link, photos, message) VALUES (?, ?, ?, ?, ?)", (
    username,
    generate_password_hash(password),
    "https://drive.google.com/example",
    "photo1.jpg,photo2.jpg",
    "Your special memories here ❤️"
))

conn.commit()
conn.close()

print("Database created & example user added.")
