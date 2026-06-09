from groq import Groq
from dotenv import load_dotenv
from services.pdf_service import process_file
import os

load_dotenv()

chunks = process_file(r"D:\download\burat.pdf")

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

def generate_flashcards():
    chat_completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": f"""
You are a flashcard generator.

Generate exactly 10 flashcards in VALID JSON format.

TASK:
Create clue-based flashcards where the QUESTION is a hint or description,
and the student must GUESS the correct term or answer.

RULES:
- Each flashcard must contain:
  - "question": a descriptive clue, scenario, or definition (do NOT directly ask "what is X")
  - "answer": ONLY the correct term (single word or short phrase)
- DO NOT include explanations in the answer
- DO NOT make the question too obvious
- DO NOT include the answer inside the question
- Keep answers short and precise (e.g., "Star Topology", "Manila", "Mitochondria")
- DO NOT add any extra text before or after JSON

EXAMPLE:
Question: In this type of topology, all computers are connected to a single central hub.
Answer: Star Topology

OUTPUT FORMAT:
[
  {{
    "question": "string",
    "answer": "string"
  }}
]

CONTENT:
{chunks}
"""
            }
        ]
    )

    response = chat_completion.choices[0].message.content

    print(response)
    return response


# generate_flashcards()