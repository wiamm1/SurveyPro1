from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 🔐 الإعدادات المتطابقة مع نظام الـ Docker الحقيقي
POSTGRES_USER = "survey_admin"     # 👈 هادي هي اللي بدلي بالظبط!
POSTGRES_PASSWORD = "survey123"   
POSTGRES_DB = "surveypro_db"      
POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5435"

# 🔌 كود الاتصال بـ pg8000
SQLALCHEMY_DATABASE_URL = (
    f"postgresql+pg8000://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()