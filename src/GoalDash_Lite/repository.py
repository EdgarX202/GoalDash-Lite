from GoalDash_Lite.database import get_connection
from GoalDash_Lite.schemas import Contribution, ContributionCreate, Goal, GoalCreate


class GoalNotFoundError(Exception):
    pass


def _read_goal(connection, goal_id: int) -> Goal:
    row = connection.execute(
        "SELECT * FROM goals WHERE id = ?",
        (goal_id,),
    ).fetchone()

    if row is None:
        raise GoalNotFoundError()

    contribution_rows = connection.execute(
        """
        SELECT id, amount_pence, contributed_on
        FROM contributions
        WHERE goal_id = ?
        ORDER BY contributed_on DESC, id DESC
        """,
        (goal_id,),
    ).fetchall()

    contributions = [
        Contribution(**dict(item)) for item in contribution_rows
    ]

    return Goal(
        **dict(row),
        contributions=contributions,
        contributed_pence=sum(
            item.amount_pence for item in contributions
        ),
    )


def list_goals() -> list[Goal]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id FROM goals ORDER BY id DESC"
        ).fetchall()

        return [_read_goal(connection, row["id"]) for row in rows]


def find_goal(goal_id: int) -> Goal:
    with get_connection() as connection:
        return _read_goal(connection, goal_id)


def insert_goal(data: GoalCreate) -> Goal:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO goals
                (name, category, target_pence, deadline, priority)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                data.name,
                data.category,
                data.target_pence,
                data.deadline.isoformat() if data.deadline else None,
                data.priority,
            ),
        )

        return _read_goal(connection, cursor.lastrowid)


def replace_goal(goal_id: int, data: GoalCreate) -> Goal:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE goals
            SET name = ?, category = ?, target_pence = ?,
                deadline = ?, priority = ?
            WHERE id = ?
            """,
            (
                data.name,
                data.category,
                data.target_pence,
                data.deadline.isoformat() if data.deadline else None,
                data.priority,
                goal_id,
            ),
        )

        if cursor.rowcount == 0:
            raise GoalNotFoundError()

        return _read_goal(connection, goal_id)


def remove_goal(goal_id: int) -> None:
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM goals WHERE id = ?",
            (goal_id,),
        )

        if cursor.rowcount == 0:
            raise GoalNotFoundError()


def insert_contribution(
    goal_id: int,
    data: ContributionCreate,
) -> Goal:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO contributions
                (goal_id, amount_pence, contributed_on)
            SELECT id, ?, ?
            FROM goals
            WHERE id = ?
            """,
            (
                data.amount_pence,
                data.contributed_on.isoformat(),
                goal_id,
            ),
        )

        if cursor.rowcount == 0:
            raise GoalNotFoundError()

        return _read_goal(connection, goal_id)