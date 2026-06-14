import fitz  # PyMuPDF
from docx import Document
import os
import re


# =========================
# 1. CLEAN TEXT
# =========================
def clean_text(text):
    # remove extra spaces/newlines
    text = re.sub(r'\s+', ' ', text)

    # remove common PDF noise
    noise_patterns = [
        "Property of STI",
        "student.feedback@sti.edu",
    ]

    for pattern in noise_patterns:
        text = text.replace(pattern, "")

    return text.strip()


# =========================
# 2. SMART CHUNKING
# =========================
def smart_chunk(text, max_chars=1500):
    sentences = re.split(r'(?<=[.!?]) +', text)

    chunks = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) < max_chars:
            current += sentence + " "
        else:
            chunks.append(current.strip())
            current = sentence + " "

    if current:
        chunks.append(current.strip())

    return chunks


# =========================
# 3. PDF EXTRACTION (BETTER)
# =========================
def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""

    for page in doc:
        page_text = page.get_text("text")
        if page_text:
            text += page_text + "\n"

    return clean_text(text)


# =========================
# 4. DOCX EXTRACTION
# =========================
def extract_text_from_docx(file_path):
    doc = Document(file_path)

    text = [
        p.text
        for p in doc.paragraphs
        if p.text.strip()
    ]

    return clean_text("\n".join(text))


# =========================
# 5. UNIVERSAL CONVERTER
# =========================
def convert_file_to_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)

    elif ext == ".docx":
        return extract_text_from_docx(file_path)

    else:
        raise ValueError("Unsupported file format")


# =========================
# 6. FULL PIPELINE
# =========================
def process_file(file_path):
    text = convert_file_to_text(file_path)
    chunks = smart_chunk(text, 1500)
    return chunks


# =========================
# 7. TEST RUN
# =========================
# if __name__ == "__main__":
#     # file_path = r"D:\download\tite.pdf"

    # print("TOTAL CHUNKS:", len(chunks))
    # print("\nFIRST CHUNK:\n")
    # print(chunks[0])

    # for chunk in enumerate(chunks):
    #     print(f"\n--- CHUNK {chunk} ---\n")
    #     print(chunk)