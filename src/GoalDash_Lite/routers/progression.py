from typing import Annotated

from fastapi import APIRouter, Depends, Response

from GoalDash_Lite.auth_dependencies import get_current_user
from GoalDash_Lite.auth_schemas import UserPublic
from GoalDash_Lite.progression import (
    ProgressionSummary,
    calculate_progression,
)
from GoalDash_Lite.repository import list_goals

router = APIRouter(
    prefix="/progression",
    tags=["Progression"],
)


@router.get("", response_model=ProgressionSummary)
def get_progression(
    response: Response,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    response.headers["Cache-Control"] = "no-store"

    goals = list_goals(user.id)
    return calculate_progression(goals)