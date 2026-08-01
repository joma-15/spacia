"""Application-level exceptions exposed as consistent JSON API responses."""


class ApiError(Exception):
    """An expected client-facing error."""

    def __init__(self, message: str, status_code: int = 400, code: str = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class NotFoundError(ApiError):
    def __init__(self, resource: str):
        super().__init__(f"{resource} not found.", 404)
