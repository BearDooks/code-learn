from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None # Add name to UserBase

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    lesson_completions: List["UserLessonCompletion"] = [] # Forward reference

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

class LessonCreate(BaseModel):
    title: str
    content: str
    code_example: Optional[str] = None
    prefill_code: Optional[str] = None
    test_code: Optional[str] = None

class Lesson(BaseModel):
    id: int
    title: str
    content: str
    code_example: Optional[str] = None
    prefill_code: Optional[str] = None
    test_code: Optional[str] = None
    completions: List["UserLessonCompletion"] = [] # Forward reference

    class Config:
        orm_mode = True

class CodeExecutionRequest(BaseModel):
    code: str
    language: str = "python" # Default to python
    test_code: Optional[str] = None

class CodeExecutionResult(BaseModel):
    output: str
    error: Optional[str] = None
    status: str = "success"

# New schemas for UserLessonCompletion
class UserLessonCompletionBase(BaseModel):
    user_id: int
    lesson_id: int

class UserLessonCompletionCreate(UserLessonCompletionBase):
    pass

class UserLessonCompletion(UserLessonCompletionBase):
    completed_at: datetime

    class Config:
        orm_mode = True

# Update forward references
User.update_forward_refs()
Lesson.update_forward_refs()
