from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    code_example = Column(Text, nullable=True)
    prefill_code = Column(Text, nullable=True)
    test_code = Column(Text, nullable=True)

    # Relationship to UserLessonCompletion
    completions = relationship("UserLessonCompletion", back_populates="lesson")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True) # Add this line
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    # Relationship to UserLessonCompletion
    lesson_completions = relationship("UserLessonCompletion", back_populates="user", cascade="all, delete-orphan")

class UserLessonCompletion(Base):
    __tablename__ = "user_lesson_completions"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), primary_key=True)
    status = Column(String, default="started") # e.g., "started", "attempted", "completed"
    last_attempted_code = Column(Text, nullable=True) # Stores the last code submitted, regardless of correctness
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True) # Only set on completion
    notes = Column(Text, nullable=True)  # New field for user notes
    bookmarked = Column(Boolean, default=False)  # New field for bookmarking

    # Relationships to User and Lesson
    user = relationship("User", back_populates="lesson_completions")
    lesson = relationship("Lesson", back_populates="completions")
