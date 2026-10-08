from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    display_name: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=15, max_length=128)

    @field_validator("display_name")
    @classmethod
    def clean_display_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Display name cannot be blank")

        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserPublic(BaseModel):
    id: int
    display_name: str
    email: EmailStr