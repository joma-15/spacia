"""Text extraction and chunking for supported study documents."""

import re
from pathlib import Path

import fitz
from docx import Document


class DocumentTextExtractor:
    """
    This class is responsible for reading PDF or Word documents (.docx),
    extracting the raw text from them, cleaning up garbage text, and
    splitting the text into smaller, readable pieces (chunks).
    We split it into pieces because AI models (LLMs) can only read a certain
    amount of text at one time.
    """

    # Noise patterns are common header/footer boilerplate text that we want to
    # ignore so they do not get mixed into our study questions.
    NOISE_PATTERNS = ("Property of STI", "student.feedback@sti.edu")

    def extract_chunks(self, file_path: str, max_chars: int = 1500) -> list[str]:
        """
        Takes a file path (where the PDF/Word doc is saved) and:
        1. Checks if the file exists.
        2. Pulls all raw text out of the file.
        3. Cleans up repeated spaces and unwanted noise/headers.
        4. Cuts the cleaned text into chunks of about 1500 characters each.

        Returns a list of clean text chunks.
        """
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Source document does not exist: {path}")

        # Extract raw text from the file
        text = self._extract_text(path)
        # Clean it (remove extra spaces and headers) and split it into chunks
        return self._chunk(self._clean(text), max_chars)

    def _extract_text(self, path: Path) -> str:
        """
        Looks at the file extension (like .pdf or .docx) and runs the right
        tool to extract text. If it is an unsupported format, it stops and
        throws an error.
        """
        # If the file is a PDF
        if path.suffix.lower() == ".pdf":
            # Open the PDF using PyMuPDF (fitz)
            with fitz.open(path) as document:
                # Read each page and join them with newlines
                return "\n".join(page.get_text("text") for page in document)

        # If the file is a Word document
        if path.suffix.lower() == ".docx":
            # Open using python-docx
            document = Document(path)
            # Read each paragraph, skip empty ones, and join them with newlines
            return "\n".join(
                paragraph.text
                for paragraph in document.paragraphs
                if paragraph.text.strip()
            )

        raise ValueError("Unsupported file format. Use PDF or DOCX.")

    def _clean(self, text: str) -> str:
        """
        Cleans the extracted text to make it easy for the AI to read.
        1. Replaces tabs, newlines, and multiple spaces with a single space.
        2. Removes any template/boilerplate strings like copyright notices.
        """
        # Replace any sequence of whitespace characters (spaces, newlines, tabs) with a single space
        cleaned = re.sub(r"\s+", " ", text)

        # Remove any known spam/boilerplate text
        for pattern in self.NOISE_PATTERNS:
            cleaned = cleaned.replace(pattern, "")

        return cleaned.strip()

    @staticmethod
    def _chunk(text: str, max_chars: int) -> list[str]:
        """
        Splits a single huge block of text into smaller blocks (chunks)
        without cutting a sentence in half.

        For example: If the limit is 1500 characters, we add sentences one-by-one
        until adding the next one would exceed 1500 characters. Then we start a
        new chunk.
        """
        # Split text into a list of sentences using regular expressions.
        # This matches spaces that come right after a period, exclamation point, or question mark.
        sentences = re.split(r"(?<=[.!?]) +", text)
        chunks: list[str] = []
        current_chunk = ""

        for sentence in sentences:
            # If adding this sentence would make our current chunk too big,
            # save the current chunk and start a fresh one.
            if len(current_chunk) + len(sentence) + 1 > max_chars and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = ""

            # Add the sentence to our current chunk followed by a space
            current_chunk += f"{sentence} "

        # Don't forget to save the very last chunk!
        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks
