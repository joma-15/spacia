from flask import Flask
from flask_cors import CORS

#import the blueprints 
from routes.pdf_routes import flashcards_bp

app = Flask(__name__)
CORS(app)

#register routes 
app.register_blueprint(flashcards_bp)

@app.route("/")
def home():
    return {"message": "Spacia Backend Running"}

if __name__ == "__main__":
    app.run(debug=True)