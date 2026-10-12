from pydantic import BaseModel

from GoalDash_Lite.schemas import Goal

XP_PER_CONTRIBUTION_DATE = 10
XP_PER_COMPLETED_GOAL = 50
XP_PER_LEVEL = 100


class ProgressionSummary(BaseModel):
    total_xp: int
    level: int
    xp_into_level: int
    xp_per_level: int
    xp_to_next_level: int
    contribution_dates: int
    completed_goals: int


def calculate_progression(goals: list[Goal]) -> ProgressionSummary:
    contribution_dates = {
        contribution.contributed_on
        for goal in goals
        for contribution in goal.contributions
    }

    completed_goals = sum(
        1
        for goal in goals
        if goal.contributed_pence >= goal.target_pence
    )

    total_xp = (
        len(contribution_dates) * XP_PER_CONTRIBUTION_DATE
        + completed_goals * XP_PER_COMPLETED_GOAL
    )

    level = total_xp // XP_PER_LEVEL + 1
    xp_into_level = total_xp % XP_PER_LEVEL

    return ProgressionSummary(
        total_xp=total_xp,
        level=level,
        xp_into_level=xp_into_level,
        xp_per_level=XP_PER_LEVEL,
        xp_to_next_level=XP_PER_LEVEL - xp_into_level,
        contribution_dates=len(contribution_dates),
        completed_goals=completed_goals,
    )