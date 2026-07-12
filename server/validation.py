"""Small request-validation helpers shared by API controllers."""

from typing import Any

from errors import ApiError


def require_json_object(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ApiError("Request body must be a JSON object.")
    return payload


def require_fields(payload: dict[str, Any], *field_names: str) -> None:
    missing_fields = [field for field in field_names if payload.get(field) is None]
    if missing_fields:
        fields = ", ".join(missing_fields)
        raise ApiError(f"Missing required field(s): {fields}.")
