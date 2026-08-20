import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise RuntimeError("GROQ_API_KEY was not loaded")

print("GROQ_API_KEY loaded:", bool(api_key))

client = Groq(api_key=api_key)

models = client.models.list()

for model in models.data:
    print(model.id)
