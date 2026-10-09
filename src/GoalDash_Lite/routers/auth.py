import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from GoalDash_Lite import auth_repository
from GoalDash_Lite.auth_dependencies import (
    SESSION_COOKIE_NAME,
    get_current_user,
    require_trusted_origin,
)
from GoalDash_Lite.auth_schemas import (
    UserLogin,
    UserPublic,
    UserRegister,
    UserUpdate,
)
from GoalDash_Lite.sessions import (
    SESSION_DURATION_SECONDS,
    create_session,
    delete_session,
)

COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"

router = APIRouter(
    prefix="/auth",
    tags=["Accounts"],
    dependencies=[Depends(require_trusted_origin)],
)


@router.post("/register", response_model=UserPublic, status_code=201)
def register_user(user_data: UserRegister):
    try:
        return auth_repository.create_user(user_data)
    except auth_repository.EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        ) from None


@router.post("/login", response_model=UserPublic)
def login_user(
    credentials: UserLogin,
    request: Request,
    response: Response,
):
    user = auth_repository.authenticate_user(
        str(credentials.email),
        credentials.password,
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )

    token = create_session(user.id)
    delete_session(request.cookies.get(SESSION_COOKIE_NAME))

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_DURATION_SECONDS,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"

    return user


@router.get("/me", response_model=UserPublic)
def read_current_user(
    response: Response,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    response.headers["Cache-Control"] = "no-store"
    return user

@router.patch("/me", response_model=UserPublic)
def update_current_user(
    data: UserUpdate,
    response: Response,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    updated_user = auth_repository.update_user_profile(user.id, data)

    if updated_user is None:
        raise HTTPException(
            status_code=401,
            detail="Please sign in",
        )

    response.headers["Cache-Control"] = "no-store"

    return updated_user

@router.post("/logout", status_code=204)
def logout_user(request: Request):
    delete_session(request.cookies.get(SESSION_COOKIE_NAME))

    response = Response(status_code=204)
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        secure=COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )
    response.headers["Cache-Control"] = "no-store"

    return response