import sqlite3

from GoalDash_Lite.auth_schemas import UserPublic, UserRegister
from GoalDash_Lite.database import get_connection
from GoalDash_Lite.security import hash_password, verify_password

DUMMY_PASSWORD_HASH = hash_password("dummy password used for verification")

class EmailAlreadyRegisteredError(Exception):
    pass


def create_user(data: UserRegister) -> UserPublic:
    email = str(data.email).lower()
    password_hash = hash_password(data.password)

    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO users (display_name, email, password_hash)
                VALUES (?, ?, ?)
                """,
                (data.display_name, email, password_hash),
            )

            return UserPublic(
                id=cursor.lastrowid,
                display_name=data.display_name,
                email=email,
            )
    except sqlite3.IntegrityError as error:
        if error.sqlite_errorname == "SQLITE_CONSTRAINT_UNIQUE":
            raise EmailAlreadyRegisteredError() from error
        raise

def authenticate_user(email: str, password: str) -> UserPublic | None:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, display_name, email, password_hash
            FROM users
            WHERE email = ?
            """,
            (email.lower(),),
        ).fetchone()

    stored_hash = (
        row["password_hash"] if row is not None else DUMMY_PASSWORD_HASH
    )
    password_matches = verify_password(password, stored_hash)

    if row is None or not password_matches:
        return None

    return UserPublic(
        id=row["id"],
        display_name=row["display_name"],
        email=row["email"],
    )