from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response

from GoalDash_Lite.auth_dependencies import get_current_user
from GoalDash_Lite.auth_schemas import UserPublic
from GoalDash_Lite.database import get_connection


def require_goal_access(
    request: Request,
    response: Response,
    user: Annotated[UserPublic, Depends(get_current_user)],
) -> None:
    response.headers["Cache-Control"] = "no-store"

    goal_id = request.path_params.get("goal_id")

    # Listing and creating goals don't have an ID in the URL.
    # Those endpoints use the signed-in user's ID directly.
    if goal_id is None:
        return

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id FROM goals
            WHERE id = ? AND user_id = ?
            """,
            (goal_id, user.id),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Goal not found",
        )