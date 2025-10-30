from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Lesson

# Database connection details - ensure this matches database.py
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:Tor69pens@localhost/codelearn_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def clear_all_lessons():
    db = SessionLocal()
    try:
        num_deleted = db.query(Lesson).delete()
        db.commit()
        print(f"Successfully deleted {num_deleted} lessons.")
    except Exception as e:
        db.rollback()
        print(f"Error clearing lessons: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Attempting to clear all lessons...")
    clear_all_lessons()
