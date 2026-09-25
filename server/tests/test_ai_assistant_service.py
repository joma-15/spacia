"""Unit tests for the AI assistant's selected-folder study context."""

import unittest

from services.ai_assistant_service import AiAssistantService


class AiAssistantServiceTestCase(unittest.TestCase):
    def test_selected_folder_cards_are_available_without_database_ids(self):
        messages = AiAssistantService().build_messages(
            user_message="Summarize this folder",
            history=[],
            folder_name="Biology",
            folder_card_count=1,
            folder_flashcards=[
                {
                    "id": "internal-card-id",
                    "question": "What is photosynthesis?",
                    "answer": "A process plants use to make glucose.",
                }
            ],
        )

        prompt = messages[0]["content"]
        self.assertIn("What is photosynthesis?", prompt)
        self.assertIn("make glucose", prompt)
        self.assertNotIn("internal-card-id", prompt)
        self.assertIn('treat every message in this conversation as referring to this folder', prompt)

    def test_prompt_requests_plain_text_without_markdown_decoration(self):
        prompt = AiAssistantService().build_messages(
            user_message="Help me study",
            history=[],
        )[0]["content"]

        self.assertIn("Avoid Markdown and decorative special characters", prompt)

    def test_prompt_includes_authenticated_username(self):
        prompt = AiAssistantService().build_messages(
            user_message="Hello",
            history=[],
            user_name="marcel",
        )[0]["content"]

        self.assertIn('currently authenticated student is "marcel"', prompt)


if __name__ == "__main__":
    unittest.main()
