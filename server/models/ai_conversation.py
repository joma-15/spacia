"""Database models for the persistent AI chat system."""

import uuid

from sqlalchemy.sql import func

from extensions import db


class AiConversation(db.Model):
    """
    Represents a single AI chat conversation belonging to one user.

    A conversation may optionally be scoped to a specific folder so the AI
    can provide folder-specific context.  When no folder is selected the
    conversation is considered a general-purpose chat.

    Relationships
    -------------
    user    → users.id        (cascade delete: deleting a user removes all their conversations)
    folder  → folders.id      (SET NULL on delete: deleting a folder keeps the conversation)
    messages → AiMessage[]    (cascade delete: deleting a conversation removes all its messages)
    """

    __tablename__ = "ai_conversations"

    id = db.Column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # nullable — a conversation without a folder_id is a "general" conversation
    folder_id = db.Column(
        db.String(36),
        db.ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    title = db.Column(db.String(200), nullable=False, default="New Conversation")

    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    updated_at = db.Column(
        db.DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # --- relationships ---
    messages = db.relationship(
        "AiMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="AiMessage.created_at",
        lazy="dynamic",
    )

    # Composite index: the most common query is
    # "all conversations for this user in this folder"
    __table_args__ = (
        db.Index("ix_ai_conversations_user_folder", "user_id", "folder_id"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "folderId": self.folder_id,
            "title": self.title,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class AiMessage(db.Model):
    """
    A single turn (user, assistant, or system) inside an AiConversation.

    Ordering is determined by `created_at`; the auto-increment surrogate `id`
    is kept as a UUID for consistency with the rest of the project.
    """

    __tablename__ = "ai_messages"

    id = db.Column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    conversation_id = db.Column(
        db.String(36),
        db.ForeignKey("ai_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # "user" | "assistant" | "system"
    role = db.Column(
        db.Enum("user", "assistant", "system"),
        nullable=False,
    )

    content = db.Column(db.Text, nullable=False)

    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    # --- relationships ---
    conversation = db.relationship("AiConversation", back_populates="messages")

    # Index used when loading ordered history for a conversation
    __table_args__ = (
        db.Index("ix_ai_messages_conversation_created", "conversation_id", "created_at"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "conversationId": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
