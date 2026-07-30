"""Application factory and development entry point."""

from flask import Flask, jsonify
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import RequestEntityTooLarge

from config import Config
from errors import ApiError
from extensions import cors, db


def create_app(test_config: dict | None = None) -> Flask:
    """
    This function is our "Application Factory". 
    Instead of starting the web server immediately when the file loads, this function 
    sets up the application configuration, connects the database, registers our webpage 
    routes (blueprints), and defines how to handle errors. 
    Using a factory function makes testing much easier because we can spin up temporary 
    app instances with different test settings.
    """
    app = Flask(__name__)
    
    # Load default configurations (like database URLs and secret keys)
    app.config.from_object(Config)
    
    # If we passed in custom testing configuration, apply it now to override defaults
    if test_config:
        app.config.update(test_config)

    # Connect the database (SQLAlchemy) and cross-origin resource sharing (CORS) to this app.
    # CORS allows our React Native app (running on a different port/device) to talk to this backend.
    db.init_app(app)
    cors.init_app(app)

    # We import database models here before we register the blueprints/routes.
    # This tells the database tool (SQLAlchemy) what tables exist so it can map them properly.
    from models.flashcard import Flashcard  # noqa: F401
    from models.folders import Folder  # noqa: F401
    from models.schedules import Schedule  # noqa: F401
    from models.users import User  # noqa: F401
    from routes.flashcard_routes import flashcards_bp
    from routes.folder_routes import folders_bp
    from routes.schedule_routes import schedules_bp
    from routes.auth_routes import auth_bp

    # Register blueprints. Blueprints are just groups of routes.
    # For example, all /flashcards/... routes are grouped inside flashcards_bp.
    app.register_blueprint(flashcards_bp)
    app.register_blueprint(folders_bp)
    app.register_blueprint(schedules_bp)
    app.register_blueprint(auth_bp)

    @app.get("/")
    def health_check():
        """
        Simple health check endpoint. 
        If the app is running and healthy, going to '/' will return a friendly message.
        """
        return jsonify({"message": "Spacia Backend Running"})

    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        """
        Handles expected application errors (like custom ApiError).
        If something goes wrong that we predicted, we send back a JSON response
        with a friendly message and a specific status code (e.g. 404 Not Found).
        """
        return jsonify({"success": False, "error": error.message}), error.status_code

    @app.errorhandler(ValueError)
    def handle_value_error(error: ValueError):
        """
        Handles invalid inputs or actions (ValueErrors).
        If the user sends bad data, we return a 400 Bad Request status code
        along with the reason.
        """
        return jsonify({"success": False, "error": str(error)}), 400

    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error: SQLAlchemyError):
        """
        Handles database failures.
        If a database operation crashes halfway through, we must run db.session.rollback()
        to undo any half-finished changes. This keeps the database clean and correct.
        Then we return a generic 500 error to keep database details secure from users.
        """
        db.session.rollback()
        app.logger.exception("Database operation failed")
        return jsonify({"success": False, "error": "A database error occurred."}), 500

    @app.errorhandler(RequestEntityTooLarge)
    def handle_upload_too_large(error: RequestEntityTooLarge):
        """
        Handles files that are too big.
        If a user attempts to upload a PDF/textbook larger than our set limit (20 MB),
        Flask automatically triggers this handler and sends back a helpful error message.
        """
        return jsonify({"success": False, "error": "The textbook must be 20 MB or smaller."}), 413

    return app


# Create the actual web application instance
app = create_app()


# This block checks if we ran this file directly from the command line.
# If yes, start the Flask local server on port 5000, listening for requests from any IP.
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
