from flask import Flask, render_template, request, redirect, session, flash
import sqlite3
import bcrypt

app = Flask(__name__)
app.secret_key = "secret123"

DATABASE = "users.db"


def init_db():
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        mobile TEXT NOT NULL,
        password BLOB NOT NULL
    )
    """)

    conn.commit()
    conn.close()


init_db()


@app.route("/")
def home():
    return redirect("/login")


@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        name = request.form["name"]
        username = request.form["username"]
        mobile = request.form["mobile"]
        password = request.form["password"]

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        )

        try:
            conn = sqlite3.connect(DATABASE)
            cur = conn.cursor()

            cur.execute("""
            INSERT INTO users(name, username, mobile, password)
            VALUES (?, ?, ?, ?)
            """, (name, username, mobile, hashed_password))

            conn.commit()
            conn.close()

            flash("Registration Successful!")
            return redirect("/login")

        except sqlite3.IntegrityError:
            flash("Username already exists!")

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        conn = sqlite3.connect(DATABASE)
        cur = conn.cursor()

        cur.execute(
            "SELECT * FROM users WHERE username=?",
            (username,)
        )

        user = cur.fetchone()
        conn.close()

        if user:
            stored_password = user[4]

            if bcrypt.checkpw(
                password.encode("utf-8"),
                stored_password
            ):
                session["user"] = user[1]
                return redirect("/dashboard")

        flash("Invalid Username or Password")

    return render_template("login.html")


@app.route("/dashboard")
def dashboard():

    if "user" not in session:
        return redirect("/login")

    return render_template(
        "dashboard.html",
        username=session["user"]
    )


@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect("/login")


if __name__ == "__main__":
    app.run(debug=True)