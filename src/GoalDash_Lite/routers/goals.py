from fastapi import APIRouter, HTTPException, Response

from GoalDash_Lite.schemas import Contribution, ContributionCreate, Goal, GoalCreate

router = APIRouter(prefix="/goals", tags=["Goals"])

goals: list[Goal] = []
next_goal_id = 1
next_contribution_id = 1


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
    deadline=goal_data.deadline,
    priority=goal_data.priority,
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

@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int):
    for index, goal in enumerate(goals):
        if goal.id == goal_id:
            goals.pop(index)
            return Response(status_code=204)

    raise HTTPException(status_code=404, detail="Goal not found")

@router.put("/{goal_id}", response_model=Goal)
def update_goal(goal_id: int, goal_data: GoalCreate):
    for index, goal in enumerate(goals):
        if goal.id == goal_id:
            updated_goal = Goal(
                contributions=goal.contributions,
                id=goal.id,
                name=goal_data.name,
                category=goal_data.category,
                target_pence=goal_data.target_pence,
                deadline=goal_data.deadline,
                priority=goal_data.priority,
                contributed_pence=goal.contributed_pence,
            )

            goals[index] = updated_goal
            return updated_goal

    raise HTTPException(status_code=404, detail="Goal not found")

@router.post("/{goal_id}/contributions", response_model=Goal, status_code=201)
def add_contribution(goal_id: int, contribution_data: ContributionCreate):
    global next_contribution_id

    goal = get_goal(goal_id)

    contribution = Contribution(
        id=next_contribution_id,
        amount_pence=contribution_data.amount_pence,
        contributed_on=contribution_data.contributed_on,
    )

    goal.contributions.append(contribution)
    goal.contributed_pence = sum(
        entry.amount_pence for entry in goal.contributions
    )
    next_contribution_id += 1

    return goal