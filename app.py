from flask import Flask, render_template, request, redirect, session, url_for, flash
from werkzeug.security import check_password_hash
import sqlite3
import os

app = Flask(__name__)
app.secret_key = "change-this-later"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        print("\n--- LOGIN ATTEMPT ---")
        print("Username input:", username)
        print("Password input:", password)

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        print("DB user row:", user)

        if user:
            print("Stored hash:", user["password_hash"])
            print("Password matches?",
                  check_password_hash(user["password_hash"], password))

        if user and check_password_hash(user["password_hash"], password):
            print("LOGIN SUCCESS")
            session["user"] = username
            return redirect(url_for("dashboard"))
        else:
            print("LOGIN FAILED")
            flash("Wrong username or password", "error")
            return redirect(url_for("login"))

    return render_template("login.html")


@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login"))

    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE username = ?",
        (session["user"],)
    ).fetchone()

    if not user:
        return "User not found", 404

    theme = user["theme_color"] if user["theme_color"] else "#ffddee"
    playlist = user["playlist_id"]
    drive_link = user["gdrive_link"]   # 👈 from your columns
    note = user["message"]

    # 🔍 DEBUG PRINT
    print("LOGGED IN USER:", user["username"])
    print("DRIVE LINK FROM DB:", drive_link)

    return render_template(
        "dashboard.html",
        username=user["username"],
        theme_color=theme,
        playlist_id=playlist,
        drive_link=drive_link,
        note=note
    )



@app.route("/memories/<username>")
def memories(username):
    if "user" not in session:
        return redirect(url_for("login"))

    if session["user"] != username:
        return "Not allowed", 403

    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE username = ?",
        (username,)
    ).fetchone()

    if not user:
        return "User not found", 404

    theme = user["theme_color"] if user["theme_color"] else "#ffddee"

    photos_list = []
    if user["photos"]:
        photos_list = [p.strip() for p in user["photos"].split(",")]

    return render_template(
        "memory.html",
        user=user,
        photos=photos_list,
        username=username,
        theme_color=theme
    )




@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(debug=True)
