from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.database import SessionLocal
from app import models
from app.core.bootstrap import bootstrap_schema, seed_default_admin

# Import des routers
from app.routers import auth, admin, surveys, users

# Création automatique des tables
models.Base.metadata.create_all(bind=engine)


def bootstrap_database() -> None:
    db = SessionLocal()
    try:
        bootstrap_schema(db)
        seed_default_admin(db)
    finally:
        db.close()

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

# Inclusion des routes
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(surveys.router)
app.include_router(users.router)


@app.on_event("startup")
def on_startup() -> None:
    bootstrap_database()

@app.get("/")
def read_root():
    return {"message": "Welcome to SurveyPro API"}