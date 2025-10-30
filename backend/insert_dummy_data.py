from database import Base, SessionLocal, engine
from models import Lesson

def create_tables():
    Base.metadata.create_all(bind=engine)

def insert_dummy_lessons():
    db = SessionLocal()
    try:
        # Check if lessons already exist to prevent duplicates on re-run
        if db.query(Lesson).count() == 0:
            lesson1 = Lesson(title="Introduction to Python", content="This lesson covers the basics of Python programming.")
            lesson2 = Lesson(title="Variables and Data Types in Python", content="Learn about different data types and how to use variables.")
            lesson3 = Lesson(title="Control Flow in Python", content="Understand conditional statements and loops.")

            db.add_all([lesson1, lesson2, lesson3])
            db.commit()
            print("Dummy lessons inserted successfully!")
        else:
            print("Lessons already exist in the database. Skipping insertion.")
    except Exception as e:
        db.rollback()
        print(f"Error inserting dummy lessons: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Attempting to create tables...")
    create_tables()
    print("Tables created (if they didn't exist).")
    print("Attempting to insert dummy lessons...")
    insert_dummy_lessons()