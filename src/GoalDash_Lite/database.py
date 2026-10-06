import sqlite3
from contextlib import contextmanager
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATABASE_PATH = PROJECT_ROOT / "data" / "goaldash.db"


@contextmanager
def get_connection():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")

    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialise_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                target_pence INTEGER NOT NULL CHECK (target_pence > 0),
                deadline TEXT,
                priority TEXT NOT NULL DEFAULT 'Moderate'
                    CHECK (priority IN ('High', 'Moderate', 'Low'))
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS contributions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER NOT NULL,
                amount_pence INTEGER NOT NULL CHECK (amount_pence > 0),
                contributed_on TEXT NOT NULL,
                FOREIGN KEY (goal_id)
                    REFERENCES goals(id)
                    ON DELETE CASCADE
            )
        """)


if __name__ == "__main__":
    initialise_database()
    print(f"Database ready: {DATABASE_PATH}")