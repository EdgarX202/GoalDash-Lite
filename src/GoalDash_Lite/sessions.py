import hashlib
import secrets
from time import time

from GoalDash_Lite.auth_schemas import UserPublic
from GoalDash_Lite.database import get_connection

SESSION_DURATION_SECONDS = 60 * 60 * 24  # 24 hours


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = int(time()) + SESSION_DURATION_SECONDS

    with get_connection() as connection:
        connection.execute(
            "DELETE FROM sessions WHERE expires_at <= ?",
            (int(time()),),
        )

        connection.execute(
            """
            INSERT INTO sessions (token_hash, user_id, expires_at)
            VALUES (?, ?, ?)
            """,
            (_hash_token(token), user_id, expires_at),
        )

    return token


def get_session_user(token: str | None) -> UserPublic | None:
    if not token:
        return None

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT users.id, users.display_name, users.email
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ?
                AND sessions.expires_at > ?
            """,
            (_hash_token(token), int(time())),
        ).fetchone()

    if row is None:
        return None

    return UserPublic(**dict(row))


def delete_session(token: str | None) -> None:
    if not token:
        return

    with get_connection() as connection:
        connection.execute(
            "DELETE FROM sessions WHERE token_hash = ?",
            (_hash_token(token),),
        )