from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response

from GoalDash_Lite import repository
from GoalDash_Lite.auth_dependencies import (
    get_current_user,
    require_trusted_origin,
)
from GoalDash_Lite.auth_schemas import UserPublic
from GoalDash_Lite.goal_access import require_goal_access
from GoalDash_Lite.schemas import ContributionCreate, Goal, GoalCreate

router = APIRouter(
    prefix="/goals",
    tags=["Goals"],
    dependencies=[
        Depends(require_goal_access),
        Depends(require_trusted_origin),
    ],
)


@router.get("", response_model=list[Goal])
def get_goals(
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    return repository.list_goals(user.id)


@router.post("", response_model=Goal, status_code=201)
def create_goal(
    goal_data: GoalCreate,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    return repository.insert_goal(goal_data, user.id)


@router.get("/{goal_id}", response_model=Goal)
def get_goal(goal_id: int):
    try:
        return repository.find_goal(goal_id)
    except repository.GoalNotFoundError:
        raise HTTPException(
            status_code=404, detail="Goal not found"
        ) from None


@router.put("/{goal_id}", response_model=Goal)
def update_goal(goal_id: int, goal_data: GoalCreate):
    try:
        return repository.replace_goal(goal_id, goal_data)
    except repository.GoalNotFoundError:
        raise HTTPException(
            status_code=404, detail="Goal not found"
        ) from None


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int):
    try:
        repository.remove_goal(goal_id)
    except repository.GoalNotFoundError:
        raise HTTPException(
            status_code=404, detail="Goal not found"
        ) from None

    return Response(status_code=204)


@router.post(
    "/{goal_id}/contributions",
    response_model=Goal,
    status_code=201,
)
def add_contribution(
    goal_id: int,
    contribution_data: ContributionCreate,
):
    try:
        return repository.insert_contribution(
            goal_id, contribution_data
        )
    except repository.GoalNotFoundError:
        raise HTTPException(
            status_code=404, detail="Goal not found"
        ) from None

@router.put(
    "/{goal_id}/contributions/{contribution_id}",
    response_model=Goal,
)
def update_contribution(
    goal_id: int,
    contribution_id: int,
    contribution_data: ContributionCreate,
):
    try:
        return repository.replace_contribution(
            goal_id,
            contribution_id,
            contribution_data,
        )
    except repository.ContributionNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Contribution not found for this goal",
        ) from None


@router.delete(
    "/{goal_id}/contributions/{contribution_id}",
    response_model=Goal,
)
def delete_contribution(
    goal_id: int,
    contribution_id: int,
):
    try:
        return repository.remove_contribution(
            goal_id,
            contribution_id,
        )
    except repository.ContributionNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Contribution not found for this goal",
        ) from None