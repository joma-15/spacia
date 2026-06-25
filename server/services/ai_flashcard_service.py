from groq import Groq
from dotenv import load_dotenv
from services.pdf_service import process_file
from models.flashcard import Flashcard
from extensions import db
import json
import os

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

MODEL = "llama-3.1-8b-instant"


# ----------------------------
# PDF Processing
# ----------------------------
def get_pdf_chunks(file_path: str):
    return process_file(file_path)


# ----------------------------
# AI Generation
# ----------------------------
def generate_ai_flashcards(chunks: str):
    prompt = f"""
You are a flashcard generator.

Generate exactly 100 flashcards in VALID JSON format.

Each flashcard must contain:
- question: clue-based description (NOT direct question)
- answer: short correct term
- status: "review"

Return ONLY a raw JSON array. 
No markdown, no code fences, no explanation. Just the JSON array.

CONTENT:
{chunks}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


# ----------------------------
# JSON Parsing
# ----------------------------
# flashcard_service.py
def parse_flashcards(raw_response: str):
    try:
        # Strip markdown code fences if present
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]  # get content between fences
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]          # remove the "json" language tag
            cleaned = cleaned.strip()

        return json.loads(cleaned)

    except json.JSONDecodeError as e:
        print("Raw AI response:", raw_response)  # 👈 see exactly what Groq returned
        raise ValueError(f"AI returned invalid JSON: {e}")

# ----------------------------
# Database Saving
# ----------------------------
def save_flashcards(cards: list, folder_id: str):
    try:
        objects = []

        for card in cards:
            flashcard = Flashcard(
                question=card["question"],
                answer=card["answer"],
                status=card.get("status", "review"),
                folder_id=folder_id
            )
            objects.append(flashcard)

        db.session.add_all(objects)
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        raise RuntimeError(f"Database error: {str(e)}")


# ----------------------------
# DB Fetch
# ----------------------------
def get_flashcards_by_folder(folder_id: str):
    try:
        return Flashcard.query.filter_by(folder_id=folder_id).all()

    except Exception as e:
        print("Fetch error:", e)
        return []


# ----------------------------
# MAIN PIPELINE
# ----------------------------
def generate_flashcards(folder_id : str,file_path: str):
    try:
        chunks = get_pdf_chunks(file_path)

        raw_response = generate_ai_flashcards(chunks)

        cards = parse_flashcards(raw_response)

        save_flashcards(cards, folder_id)

        return get_flashcards_by_folder(folder_id)

    except Exception as e:
        print("Flashcard generation failed:", e)
        return None
    
