from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth  # استيراد موديل الـ auth

app = FastAPI(title="SurveyPro API", version="2.0")

# 🔒 إعدادات الـ CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔗 ربط مسارات التحقق بالتطبيق
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API de SurveyPro !"}