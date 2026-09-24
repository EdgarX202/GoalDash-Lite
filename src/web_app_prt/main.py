from fastapi import FastAPI

from web_app_prt.routers import goals

app = FastAPI()

app.include_router(goals.router)


@app.get("/")
def home():
    return {"message": "Finance app backend is running!"}