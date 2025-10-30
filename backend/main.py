from datetime import timedelta

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware # Added this import
from sqlalchemy.orm import Session

import models, schemas, auth
from database import get_db, engine, SessionLocal
from typing import List

app = FastAPI()

origins = [
    "http://localhost:5173",  # Frontend URL
    "http://127.0.0.1:5173",  # Frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
def on_startup():
    models.Base.metadata.create_all(bind=engine)

@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI backend!"}

@app.get("/lessons/")
async def get_lessons(db: Session = Depends(get_db)):
    lessons = db.query(models.Lesson).all()
    return lessons

@app.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@app.post("/signup/", response_model=schemas.User)
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(user.password.encode('utf-8')) > 72:
        raise HTTPException(status_code=400, detail="Password cannot be longer than 72 characters")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, is_admin=False) # Default to non-admin
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/lessons/", response_model=schemas.Lesson)
async def create_lesson(lesson: schemas.LessonCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)): # Protected by admin user
    db_lesson = models.Lesson(title=lesson.title, content=lesson.content, code_example=lesson.code_example, prefill_code=lesson.prefill_code, test_code=lesson.test_code)
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    return db_lesson

@app.put("/lessons/{lesson_id}", response_model=schemas.Lesson)
async def update_lesson(lesson_id: int, lesson: schemas.LessonCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if db_lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    db_lesson.title = lesson.title
    db_lesson.content = lesson.content
    db_lesson.code_example = lesson.code_example
    db_lesson.prefill_code = lesson.prefill_code
    db_lesson.test_code = lesson.test_code
    db.commit()
    db.refresh(db_lesson)
    return db_lesson

@app.post("/lessons/{lesson_id}/complete", response_model=schemas.UserLessonCompletion)
async def complete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if lesson exists
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Check if already completed
    completion = db.query(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == current_user.id,
        models.UserLessonCompletion.lesson_id == lesson_id
    ).first()

    if completion:
        raise HTTPException(status_code=400, detail="Lesson already marked as completed by this user.")

    # Create new completion record
    db_completion = models.UserLessonCompletion(user_id=current_user.id, lesson_id=lesson_id)
    db.add(db_completion)
    db.commit()
    db.refresh(db_completion)
    return db_completion

@app.get("/users/me/lessons/completed", response_model=List[schemas.Lesson])
async def get_completed_lessons_for_current_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    completed_lessons = db.query(models.Lesson).join(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == current_user.id
    ).all()
    return completed_lessons

import subprocess
import sys
from io import StringIO
from contextlib import redirect_stdout, redirect_stderr
# ... (rest of your imports and app setup)

@app.post("/execute-code/", response_model=schemas.CodeExecutionResult)
async def execute_code(request: schemas.CodeExecutionRequest, current_user: models.User = Depends(auth.get_current_user)):
    # WARNING: Executing arbitrary user code directly on the server is a major security risk.
    # This implementation is for development purposes only and MUST be replaced with a secure,
    # sandboxed execution environment (e.g., Docker) before deployment to any production or publicly accessible environment.

    if request.language != "python":
        raise HTTPException(status_code=400, detail="Only Python execution is supported for now.")

    user_output = StringIO()
    user_error = StringIO()
    test_output = StringIO()
    test_error = StringIO()
    overall_status = "success"

    # Create a dictionary to hold the execution scope (globals and locals)
    execution_scope = {}
    # Initialize a variable to capture the user's "return" value
    execution_scope['_user_return_value_capture'] = None

    # Execute user code once
    try:
        with redirect_stdout(user_output), redirect_stderr(user_error):
            exec(request.code, execution_scope, execution_scope)
        # After execution, if the user assigned to _user_return_value_capture, make it available
        if '_user_return_value_capture' in execution_scope:
            execution_scope['user_return_value'] = execution_scope['_user_return_value_capture']
        else:
            execution_scope['user_return_value'] = None # Explicitly set to None if not assigned
    except Exception as e:
        user_error.write(f"An error occurred during user code execution: {e}\n")
        overall_status = "error"

    # If test code is provided and user code executed without error, execute it
    if request.test_code and overall_status == "success":
        try:
            with redirect_stdout(test_output), redirect_stderr(test_error):
                execution_scope['user_printed_output'] = user_output.getvalue()
                # Execute test code in the same scope as user code
                exec(request.test_code, execution_scope, execution_scope)
        except Exception as e:
            test_error.write(f"An error occurred during test code execution: {e}\n")
            overall_status = "test_failed"
    elif request.test_code and overall_status != "success":
        test_error.write("Test code not executed due to errors in user code.\n")

    final_output = user_output.getvalue() + test_output.getvalue()
    final_error = user_error.getvalue() + test_error.getvalue()

    if final_error and overall_status == "success": # If there was an error but not from test_code
        overall_status = "error"
    elif overall_status == "test_failed":
        pass # Status already set
    elif final_error:
        overall_status = "error"

    # Add a success message if everything passed
    if overall_status == "success" and not final_error:
        test_output.write("\n--- Test Passed! ---\n")
        final_output += "\n--- Test Passed! ---\n" # Update final_output with the success message

    return schemas.CodeExecutionResult(output=final_output, error=final_error or None, status=overall_status)