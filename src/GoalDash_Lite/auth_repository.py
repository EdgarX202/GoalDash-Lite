import sqlite3

from GoalDash_Lite.auth_schemas import UserPublic, UserRegister
from GoalDash_Lite.database import get_connection
from GoalDash_Lite.security import hash_password


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