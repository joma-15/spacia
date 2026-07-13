"""Application factory and development entry point."""

from flask import Flask, jsonify
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import RequestEntityTooLarge

from config import Config
from errors import ApiError
from extensions import cors, db


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    cors.init_app(app)

    # Import models before routes so SQLAlchemy has a complete metadata registry.
    from models.flashcard import Flashcard  # noqa: F401
    from models.folders import Folder  # noqa: F401
    from models.schedules import Schedule  # noqa: F401
    from models.users import User  # noqa: F401
    from routes.flashcard_routes import flashcards_bp
    from routes.folder_routes import folders_bp
    from routes.schedule_routes import schedules_bp

    app.register_blueprint(flashcards_bp)
    app.register_blueprint(folders_bp)
    app.register_blueprint(schedules_bp)

    @app.get("/")
    def health_check():
        return jsonify({"message": "Spacia Backend Running"})

    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        return jsonify({"success": False, "error": error.message}), error.status_code

    @app.errorhandler(ValueError)
    def handle_value_error(error: ValueError):
        return jsonify({"success": False, "error": str(error)}), 400

    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error: SQLAlchemyError):
        db.session.rollback()
        app.logger.exception("Database operation failed")
        return jsonify({"success": False, "error": "A database error occurred."}), 500

    @app.errorhandler(RequestEntityTooLarge)
    def handle_upload_too_large(error: RequestEntityTooLarge):
        return jsonify({"success": False, "error": "The textbook must be 20 MB or smaller."}), 413

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
