from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: str
    target_pence: int = Field(gt=0)


class Goal(GoalCreate):
    id: int
    contributed_pence: int = Field(default=0, ge=0)