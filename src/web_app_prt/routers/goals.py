from fastapi import APIRouter, HTTPException

from web_app_prt.schemas import Goal, GoalCreate

router = APIRouter(prefix="/goals", tags=["Goals"])

goals: list[Goal] = []
next_goal_id = 1


@router.get("", response_model=list[Goal])
def get_goals():
    return goals


@router.post("", response_model=Goal, status_code=201)
def create_goal(goal_data: GoalCreate):
    global next_goal_id

    goal = Goal(
        id=next_goal_id,
        name=goal_data.name,
        category=goal_data.category,
        target_pence=goal_data.target_pence,
    )

    goals.append(goal)
    next_goal_id += 1

    return goal

@router.get("/{goal_id}", response_model=Goal)
def get_goal(goal_id: int):
    for goal in goals:
        if goal.id == goal_id:
            return goal

    raise HTTPException(status_code=404, detail="Goal not found")