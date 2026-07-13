"""Text extraction and chunking for supported study documents."""

import re
from pathlib import Path

import fitz
from docx import Document


class DocumentTextExtractor:
    """Converts a PDF or DOCX file into chunks suitable for an LLM prompt."""

    NOISE_PATTERNS = ("Property of STI", "student.feedback@sti.edu")

    def extract_chunks(self, file_path: str, max_chars: int = 1500) -> list[str]:
        """Read a supported file, normalize its text, then split it for the LLM prompt."""
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Source document does not exist: {path}")

        text = self._extract_text(path)
        return self._chunk(self._clean(text), max_chars)

    def _extract_text(self, path: Path) -> str:
        """Use the parser that matches the extension; unsupported input fails early."""
        if path.suffix.lower() == ".pdf":
            with fitz.open(path) as document:
                return "\n".join(page.get_text("text") for page in document)
        if path.suffix.lower() == ".docx":
            document = Document(path)
            return "\n".join(paragraph.text for paragraph in document.paragraphs if paragraph.text.strip())
        raise ValueError("Unsupported file format. Use PDF or DOCX.")

    def _clean(self, text: str) -> str:
        """Remove repeated whitespace and known document boilerplate before generation."""
        cleaned = re.sub(r"\s+", " ", text)
        for pattern in self.NOISE_PATTERNS:
            cleaned = cleaned.replace(pattern, "")
        return cleaned.strip()

    @staticmethod
    def _chunk(text: str, max_chars: int) -> list[str]:
        """Prefer sentence boundaries so chunks remain readable while limiting prompt size."""
        sentences = re.split(r"(?<=[.!?]) +", text)
        chunks: list[str] = []
        current_chunk = ""

        for sentence in sentences:
            if len(current_chunk) + len(sentence) + 1 > max_chars and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = ""
            current_chunk += f"{sentence} "

        if current_chunk:
            chunks.append(current_chunk.strip())
        return chunks
