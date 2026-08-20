"""Small request-validation helpers shared by API controllers."""

from typing import Any

from errors import ApiError


def require_json_object(payload: Any) -> dict[str, Any]:
    """
    Checks if the data sent to our API is a valid JSON dictionary.
    If the client sends something else (like text or a list), we stop early
    and raise an error message telling them it must be a JSON object.
    """
    if not isinstance(payload, dict):
        raise ApiError("Request body must be a JSON object.")
    return payload


def require_fields(payload: dict[str, Any], *field_names: str) -> None:
    """
    Verifies that all required fields are present and not empty in the request data.
    For example: if creating a card requires 'question' and 'answer', this checks both.
    If any fields are missing, it raises an error listing the missing field names.
    """
    missing_fields = [field for field in field_names if payload.get(field) is None]
    if missing_fields:
        fields = ", ".join(missing_fields)
        raise ApiError(f"Missing required field(s): {fields}.")
