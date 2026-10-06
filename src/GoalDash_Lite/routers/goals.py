from fastapi import APIRouter, HTTPException, Response

from GoalDash_Lite import repository
from GoalDash_Lite.schemas import ContributionCreate, Goal, GoalCreate

router = APIRouter(prefix="/goals", tags=["Goals"])


@router.get("", response_model=list[Goal])
def get_goals():
    return repository.list_goals()


@router.post("", response_model=Goal, status_code=201)
def create_goal(goal_data: GoalCreate):
    return repository.insert_goal(goal_data)


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