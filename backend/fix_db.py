from sqlalchemy import text
from app.database import SessionLocal

db = SessionLocal()
try:
    db.execute(text('ALTER TABLE sections ADD COLUMN description TEXT;'))
    db.commit()
    print('Column added!')
except Exception as e:
    db.rollback()
    print(f'Error: {e}')
finally:
    db.close()
