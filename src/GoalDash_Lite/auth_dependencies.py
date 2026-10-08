from fastapi import HTTPException, Request

from GoalDash_Lite.auth_schemas import UserPublic
from GoalDash_Lite.sessions import get_session_user

SESSION_COOKIE_NAME = "goaldash_session"

TRUSTED_ORIGINS = {
    "http://localhost:5173",
    "http://localhost:8000",
}


def require_trusted_origin(request: Request) -> None:
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("origin")

        if origin not in TRUSTED_ORIGINS:
            raise HTTPException(
                status_code=403,
                detail="Request origin is not allowed",
            )


def get_current_user(request: Request) -> UserPublic:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    user = get_session_user(token)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Please sign in",
        )

    return user