from fastapi import APIRouter, HTTPException

from GoalDash_Lite import auth_repository
from GoalDash_Lite.auth_schemas import UserPublic, UserRegister

router = APIRouter(prefix="/auth", tags=["Accounts"])


@router.post("/register", response_model=UserPublic, status_code=201)
def register_user(user_data: UserRegister):
    try:
        return auth_repository.create_user(user_data)
    except auth_repository.EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        ) from None