from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routers import auth, admin

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SurveyPro API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SurveyPro API"}