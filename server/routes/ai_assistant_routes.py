"""HTTP controllers for the AI chat assistant.

Route layer responsibilities:
  - Parse and validate the request.
  - Authenticate via JWT (user_id always from the token, never from the body).
  - Delegate to ConversationService (DB) and AiAssistantService (AI provider).
  - Return a consistent JSON response.

The route methods contain no AI logic and no raw ORM queries — those live
in their respective service classes.
"""

from flask import Blueprint, current_app, jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required

from errors import ApiError
from services.ai_assistant_service import AiAssistantService
from services.ai_study_action_service import AiStudyActionService
from services.conversation_service import ConversationService
from services.folder_service import FolderService
from validation import require_fields, require_json_object

assistant_bp = Blueprint("assistant", __name__)

# Module-level service instances (stateless — safe to share across requests)
_ai_service = AiAssistantService()
_conversation_service = ConversationService()
_folder_service = FolderService()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _resolve_folder(folder_id: str | None, user_id: str):
    """
    Verify a folder belongs to the authenticated user and return it.

    Returns None when folder_id is None (general / no-folder conversation).

    Raises ApiError(403) when the folder exists but belongs to a different user.
    Raises NotFoundError(404) when the folder does not exist at all.
    """
    if folder_id is None:
        return None
    return _folder_service.get_owned(folder_id, user_id)


# ---------------------------------------------------------------------------
# Conversation Collection  —  GET/POST /ai/conversations
# ---------------------------------------------------------------------------

class ConversationCollectionAPI(MethodView):
    """List conversations for the current user, or create a new one."""

    @jwt_required()
    def get(self):
        """
        GET /ai/conversations[?folder_id=<id>]

        Returns only conversations owned by the authenticated user.
        Optionally filter by folder_id.
        """
        user_id = get_jwt_identity()
        folder_id = request.args.get("folder_id") or None

        conversations = _conversation_service.list_for_user(user_id, folder_id)
        return jsonify({
            "conversations": [c.to_dict() for c in conversations]
        })

    @jwt_required()
    def post(self):
        """
        POST /ai/conversations
        Body (optional): { "folder_id": "..." }

        Creates a new conversation.  If folder_id is provided, ownership of
        that folder is verified before creating the conversation.
        """
        user_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}

        folder_id = data.get("folder_id") or None
        _resolve_folder(folder_id, user_id)  # raises 404/403 on bad folder

        conversation = _conversation_service.create(user_id, folder_id)
        return jsonify({"conversation": conversation.to_dict()}), 201


# ---------------------------------------------------------------------------
# Conversation — GET-OR-CREATE  —  POST /ai/conversations/get-or-create
# ---------------------------------------------------------------------------

class ConversationGetOrCreateAPI(MethodView):
    """
    Frontend shortcut: resume the active conversation for a folder (or create one).

    This keeps the frontend simple — it does not need to list conversations and
    pick the right one; it just calls this endpoint when the AI tab opens.
    """

    @jwt_required()
    def post(self):
        """
        POST /ai/conversations/get-or-create
        Body (optional): { "folder_id": "..." }
        """
        user_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}

        folder_id = data.get("folder_id") or None
        _resolve_folder(folder_id, user_id)  # raises 404/403 on bad folder

        conversation, created = _conversation_service.get_or_create_active(
            user_id, folder_id
        )
        status_code = 201 if created else 200
        return jsonify({"conversation": conversation.to_dict()}), status_code


# ---------------------------------------------------------------------------
# Conversation Item  —  DELETE /ai/conversations/<id>
# ---------------------------------------------------------------------------

class ConversationItemAPI(MethodView):
    """Operate on a single conversation owned by the authenticated user."""

    @jwt_required()
    def delete(self, conversation_id: str):
        """
        DELETE /ai/conversations/<conversation_id>

        Permanently deletes the conversation and all its messages (cascade).
        Returns 404/403 when the conversation is not owned by the caller.
        """
        user_id = get_jwt_identity()

        current_app.logger.info(
            "DELETE conversation: conversation_id=%s user_id=%s",
            conversation_id,
            user_id,
        )

        _conversation_service.delete(conversation_id, user_id)
        return jsonify({"message": "Conversation deleted successfully."})


# ---------------------------------------------------------------------------
# Messages Collection  —  GET/POST /ai/conversations/<id>/messages
# ---------------------------------------------------------------------------

class MessageCollectionAPI(MethodView):
    """Read or send messages within a single conversation."""

    @jwt_required()
    def get(self, conversation_id: str):
        """
        GET /ai/conversations/<conversation_id>/messages

        Returns the message history for a conversation.
        Ownership is verified before returning any data.
        """
        user_id = get_jwt_identity()

        # Security: verify the conversation belongs to this user
        _conversation_service.get_owned(conversation_id, user_id)

        messages = _conversation_service.get_messages(conversation_id)
        return jsonify({
            "messages": [m.to_dict() for m in messages]
        })

    @jwt_required()
    def post(self, conversation_id: str):
        """
        POST /ai/conversations/<conversation_id>/messages
        Body: { "content": "..." }

        Full send-message flow:
          1. Authenticate user from JWT.
          2. Verify conversation ownership.
          3. Validate request body.
          4. Load message history from DB.
          5. Load folder context (if conversation is folder-scoped).
          6. Build AI message list (system + history + new user message).
          7. Call AI provider.
          8. Persist user message + AI response atomically.
          9. Return the AI response.

        This endpoint is the core of the AI system.  All AI logic lives in
        AiAssistantService; all DB logic lives in ConversationService.
        """
        user_id = get_jwt_identity()

        # 1 — parse & validate request
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, "content")
        user_content: str = data["content"].strip()

        if not user_content:
            raise ApiError("Message content cannot be empty.", 400)

        # 2 — security: verify this conversation belongs to the caller
        conversation = _conversation_service.get_owned(conversation_id, user_id)

        # 3 — load previous messages for conversation memory
        history = _conversation_service.get_messages_for_ai(conversation_id)

        # 4 — load folder context (if applicable) — also verifies folder ownership
        folder = None
        if conversation.folder_id:
            try:
                folder = _folder_service.get_owned(conversation.folder_id, user_id)
            except Exception:
                # Folder was deleted or access was revoked.
                # The conversation continues without folder context rather than failing.
                current_app.logger.warning(
                    "Could not load folder %s for conversation %s — continuing without context.",
                    conversation.folder_id,
                    conversation_id,
                )

        folder_name = folder.subject if folder else None
        folder_card_count = len(folder.flashcards) if folder else 0

        # 5 — build the AI message list
        messages = _ai_service.build_messages(
            user_message=user_content,
            history=history,
            folder_name=folder_name,
            folder_card_count=folder_card_count,
        )

        # 6 — call the AI provider
        try:
            action_service = AiStudyActionService(_ai_service.generate_flashcards)
            ai_response, actions = _ai_service.generate_response_with_tools(
                messages=messages,
                tools=action_service.tool_definitions(),
                execute_tool=lambda name, arguments: action_service.execute(
                    name,
                    arguments,
                    user_id,
                    conversation.folder_id,
                ),
            )
        except RuntimeError as exc:
            # Configuration error (missing API key etc.)
            current_app.logger.error("AI configuration error: %s", exc)
            raise ApiError("AI service is not configured correctly.", 500)
        except ValueError as exc:
            # Empty or malformed AI response
            current_app.logger.error("AI returned an invalid response: %s", exc)
            raise ApiError("The AI service returned an unexpected response.", 502)
        except Exception as exc:
            # Groq network errors, rate limits, etc.
            current_app.logger.exception(
                "AI provider error for conversation %s: %s", conversation_id, exc
            )
            raise ApiError(
                "The AI service is temporarily unavailable. Please try again.", 503
            )

        # 7 — persist both messages atomically
        _, ai_msg = _conversation_service.add_message_pair(
            conversation_id=conversation_id,
            user_content=user_content,
            assistant_content=ai_response,
        )

        current_app.logger.info(
            "Message saved: conversation_id=%s user_id=%s",
            conversation_id,
            user_id,
        )

        return jsonify({"message": ai_msg.to_dict(), "actions": actions}), 201


# ---------------------------------------------------------------------------
# URL registration
# ---------------------------------------------------------------------------

assistant_bp.add_url_rule(
    "/ai/conversations",
    view_func=ConversationCollectionAPI.as_view("conversation_collection"),
)
assistant_bp.add_url_rule(
    "/ai/conversations/get-or-create",
    view_func=ConversationGetOrCreateAPI.as_view("conversation_get_or_create"),
)
assistant_bp.add_url_rule(
    "/ai/conversations/<string:conversation_id>",
    view_func=ConversationItemAPI.as_view("conversation_item"),
)
assistant_bp.add_url_rule(
    "/ai/conversations/<string:conversation_id>/messages",
    view_func=MessageCollectionAPI.as_view("message_collection"),
)
