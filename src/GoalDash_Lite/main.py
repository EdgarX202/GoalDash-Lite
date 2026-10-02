from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from GoalDash_Lite.routers import goals

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(goals.router)


@app.get("/")
def home():
    return {"message": "Finance app backend is running!"}