"""Database operations for AI conversations and messages.

This service is the single source of truth for all conversation persistence.
It handles security (ownership checks), ordering, and transaction management.
Routes delegate here rather than touching the ORM directly.
"""

from extensions import db
from errors import ApiError, NotFoundError
from models.ai_conversation import AiConversation, AiMessage

# Maximum messages returned to the client when loading a conversation.
# The AI history limit is handled separately in AiAssistantService.
CLIENT_MESSAGE_LIMIT = 100


class ConversationService:
    """
    Coordinates all database access for AI conversations and messages.

    Security guarantee
    ------------------
    Every method that accepts a `conversation_id` from an untrusted source
    (i.e. from a client request) also requires the authenticated `user_id`
    from the JWT.  The conversation is only returned / mutated when both IDs
    match — a malicious user cannot access another user's data by guessing IDs.
    """

    # ------------------------------------------------------------------
    # Conversation — read
    # ------------------------------------------------------------------

    def list_for_user(
        self, user_id: str, folder_id: str | None = None
    ) -> list[AiConversation]:
        """
        Return all conversations owned by `user_id`, optionally filtered by folder.

        The query is always scoped to `user_id` — another user's conversations
        are never visible regardless of the `folder_id` parameter.
        """
        query = AiConversation.query.filter_by(user_id=user_id)
        if folder_id is not None:
            query = query.filter_by(folder_id=folder_id)
        return query.order_by(AiConversation.updated_at.desc()).all()

    def get_owned(self, conversation_id: str, user_id: str) -> AiConversation:
        """
        Fetch a conversation only when it belongs to the authenticated user.

        Raises
        ------
        NotFoundError  — conversation does not exist (404)
        ApiError       — conversation exists but belongs to a different user (403)
        """
        conversation = db.session.get(AiConversation, conversation_id)
        if conversation is None:
            raise NotFoundError("Conversation")
        if conversation.user_id != user_id:
            # Return 403, not 404, so the caller knows the resource exists
            # but they are not authorised.  Do NOT leak the real owner's ID.
            raise ApiError("You do not have access to this conversation.", 403)
        return conversation

    def get_or_create_active(
        self, user_id: str, folder_id: str | None
    ) -> tuple[AiConversation, bool]:
        """
        Return the most recent conversation for this user/folder pair.

        If no conversation exists yet, create a fresh one.

        Returns
        -------
        (conversation, created)
            `created` is True when a new conversation was inserted.
        """
        existing = (
            AiConversation.query.filter_by(user_id=user_id, folder_id=folder_id)
            .order_by(AiConversation.updated_at.desc())
            .first()
        )
        if existing:
            return existing, False

        return self._create(user_id, folder_id), True

    # ------------------------------------------------------------------
    # Conversation — write
    # ------------------------------------------------------------------

    def create(self, user_id: str, folder_id: str | None) -> AiConversation:
        """Always create a brand-new conversation (used by the "New Chat" button)."""
        return self._create(user_id, folder_id)

    def delete(self, conversation_id: str, user_id: str) -> None:
        """Delete a conversation after verifying ownership."""
        conversation = self.get_owned(conversation_id, user_id)
        db.session.delete(conversation)
        db.session.commit()

    # ------------------------------------------------------------------
    # Messages — read
    # ------------------------------------------------------------------

    def get_messages(
        self, conversation_id: str, limit: int = CLIENT_MESSAGE_LIMIT
    ) -> list[AiMessage]:
        """
        Return up to `limit` most recent messages for a conversation, in
        chronological order (oldest first — correct for chat display).

        Callers must already have verified ownership of the conversation
        before calling this method.
        """
        return (
            AiMessage.query.filter_by(conversation_id=conversation_id)
            .order_by(AiMessage.created_at.asc())
            .limit(limit)
            .all()
        )

    def get_messages_for_ai(
        self, conversation_id: str, limit: int = 20
    ) -> list[dict]:
        """
        Return the last `limit` messages formatted as dicts ready for the AI provider.

        Only "user" and "assistant" roles are included — system messages are
        injected by AiAssistantService and must not be duplicated here.
        """
        messages = (
            AiMessage.query.filter(
                AiMessage.conversation_id == conversation_id,
                AiMessage.role.in_(["user", "assistant"]),
            )
            .order_by(AiMessage.created_at.asc())
            .limit(limit)
            .all()
        )
        return [{"role": m.role, "content": m.content} for m in messages]

    # ------------------------------------------------------------------
    # Messages — write
    # ------------------------------------------------------------------

    def add_message(
        self, conversation_id: str, role: str, content: str
    ) -> AiMessage:
        """
        Append a single message to a conversation.

        Commits immediately — use `add_message_pair` when saving both the
        user message and the AI response atomically.
        """
        message = AiMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
        )
        db.session.add(message)
        db.session.commit()
        return message

    def add_message_pair(
        self,
        conversation_id: str,
        user_content: str,
        assistant_content: str,
    ) -> tuple[AiMessage, AiMessage]:
        """
        Save the user's message and the AI response in a single transaction.

        Using a single commit means either both messages are persisted or
        neither — the conversation history is never left in a half-written state.

        Also touches `updated_at` on the parent conversation so that
        `list_for_user` returns the most recently active conversation first.
        """
        user_msg = AiMessage(
            conversation_id=conversation_id,
            role="user",
            content=user_content,
        )
        ai_msg = AiMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_content,
        )

        # Bump the conversation's updated_at so ordering reflects activity
        conversation = db.session.get(AiConversation, conversation_id)
        if conversation:
            from sqlalchemy.sql import func as sa_func
            conversation.updated_at = sa_func.now()

        db.session.add(user_msg)
        db.session.add(ai_msg)
        db.session.commit()

        return user_msg, ai_msg

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _create(self, user_id: str, folder_id: str | None) -> AiConversation:
        conversation = AiConversation(
            user_id=user_id,
            folder_id=folder_id,
        )
        db.session.add(conversation)
        db.session.commit()
        return conversation
