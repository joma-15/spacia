from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from dotenv import load_dotenv
from urllib.parse import quote_plus
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# =========================
# DATABASE CONFIG (FIXED)
# =========================

db_user = os.getenv("DB_USER")
db_password = quote_plus(os.getenv("DB_PASSWORD", ""))  # FIX for @, :, etc.
db_host = os.getenv("DB_HOST", "localhost")
db_name = os.getenv("DB_NAME")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{db_user}:{db_password}"
    f"@{db_host}/{db_name}"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize DB
db = SQLAlchemy(app)

# =========================
# ROUTES
# =========================

from routes.pdf_routes import flashcards_bp
app.register_blueprint(flashcards_bp)

@app.route("/")
def home():
    return {"message": "Spacia Backend Running"}

# =========================
# TEST CONNECTION
# =========================

if __name__ == "__main__":
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))
            print("✅ Connected to MySQL successfully!")
        except Exception as e:
            print("❌ Database Error:", e)

    app.run(host="0.0.0.0", port=5000, debug=True)