from flask import Flask
from config import Config
from extensions import db, cors
from sqlalchemy import text

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # init extensions
    db.init_app(app)
    cors.init_app(app)

    # Import models so SQLAlchemy registers tables
    from models.users import User
    from models.folders import Folder
    from models.flashcard import Flashcard


    # register routes
    from routes.flashcard_routes import flashcards_bp
    app.register_blueprint(flashcards_bp)

    from routes.folder_routes import folders_bp
    app.register_blueprint(folders_bp)

    @app.route("/")
    def home():
        return {"message": "Spacia Backend Running"}

    # test DB connection
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))
            print("✅ Connected to MySQL successfully!")
        except Exception as e:
            print("❌ Database Error:", e)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)