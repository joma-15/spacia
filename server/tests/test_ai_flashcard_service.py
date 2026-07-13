import unittest
from unittest.mock import MagicMock, patch
from services.ai_flashcard_service import AiFlashcardService


class TestAiFlashcardService(unittest.TestCase):
    def setUp(self):
        self.flashcard_service = MagicMock()
        self.document_extractor = MagicMock()
        self.client = MagicMock()
        self.service = AiFlashcardService(
            flashcard_service=self.flashcard_service,
            document_extractor=self.document_extractor,
            client=self.client,
        )

    def test_parse_cards_valid_standard_json(self):
        raw_response = """
        {
          "flashcards": [
            {
              "question": "What is force?",
              "answer": "Mass times acceleration",
              "status": "review"
            }
          ]
        }
        """
        cards = self.service._parse_cards(raw_response)
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0]["question"], "What is force?")
        self.assertEqual(cards[0]["answer"], "Mass times acceleration")
        self.assertEqual(cards[0]["status"], "review")

    def test_parse_cards_key_normalization(self):
        raw_response = """
        {
          "flashcards": [
            {
              "clue": "What is velocity?",
              "short_answer": "Displacement over time",
              "status": "review"
            },
            {
              "front": "What is speed?",
              "back": "Distance over time"
            }
          ]
        }
        """
        cards = self.service._parse_cards(raw_response)
        self.assertEqual(len(cards), 2)
        
        self.assertEqual(cards[0]["question"], "What is velocity?")
        self.assertEqual(cards[0]["answer"], "Displacement over time")
        
        self.assertEqual(cards[1]["question"], "What is speed?")
        self.assertEqual(cards[1]["answer"], "Distance over time")
        self.assertEqual(cards[1]["status"], "review")

    def test_parse_cards_invalid_json(self):
        raw_response = "{ invalid json }"
        with self.assertRaises(ValueError) as context:
            self.service._parse_cards(raw_response)
        self.assertIn("invalid JSON", str(context.exception))

    def test_parse_cards_missing_keys(self):
        raw_response = """
        {
          "flashcards": [
            {
              "clue": "Only clue, no answer"
            }
          ]
        }
        """
        with self.assertRaises(ValueError) as context:
            self.service._parse_cards(raw_response)
        self.assertIn("requires a question and answer", str(context.exception))
