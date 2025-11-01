from datetime import timedelta

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware # Added this import
from sqlalchemy.orm import Session
from sqlalchemy import func

import models, schemas, auth
from database import get_db, engine, SessionLocal
from typing import List, Optional # Import Optional
import httpx # Import httpx for making HTTP requests
import os # Import os to read environment variables
from dotenv import load_dotenv # Import load_dotenv
from black import format_str, FileMode, NothingChanged # Import black for code formatting
import subprocess # Add subprocess import
import tempfile # Add tempfile import
import asyncio # Add asyncio import

CODE_EXECUTOR_URL = os.getenv("CODE_EXECUTOR_URL") # Define CODE_EXECUTOR_URL here

app = FastAPI()

# Read allowed origins from environment variable
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

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

    # Create admin user if not exists
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    print(f"Debug: ADMIN_EMAIL = {admin_email}")
    print(f"Debug: ADMIN_PASSWORD = {admin_password}")

    if admin_email and admin_password:
        db = SessionLocal()
        try:
            existing_admin = db.query(models.User).filter(models.User.email == admin_email).first()
            if not existing_admin:
                hashed_password = auth.get_password_hash(admin_password)
                admin_user = models.User(
                    email=admin_email,
                    hashed_password=hashed_password,
                    is_admin=True,
                    name="Admin"
                )
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
                print(f"Admin user {admin_email} created successfully!")
            else:
                print(f"Admin user {admin_email} already exists.")
        except Exception as e:
            print(f"Error creating admin user: {e}")
        finally:
            db.close()

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
    db_user = models.User(email=user.email, hashed_password=hashed_password, is_admin=False, name=user.name) # Add name=user.name
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

@app.put("/lessons/{lesson_id}/completion", response_model=schemas.UserLessonCompletion)
async def update_lesson_completion(
    lesson_id: int,
    completion_data: schemas.UserLessonCompletionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if lesson exists
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Find existing completion record
    completion = db.query(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == current_user.id,
        models.UserLessonCompletion.lesson_id == lesson_id
    ).first()

    if completion:
        # Update existing completion record
        completion.status = completion_data.status
        completion.last_attempted_code = completion_data.last_attempted_code
        completion.notes = completion_data.notes  # Update notes
        completion.bookmarked = completion_data.bookmarked  # Update bookmarked
        if completion_data.status == "completed" and not completion.completed_at:
            completion.completed_at = func.now()
        elif completion_data.status != "completed":
            completion.completed_at = None # Clear completed_at if status is not completed
    else:
        # Create new completion record
        completion = models.UserLessonCompletion(
            user_id=current_user.id,
            lesson_id=lesson_id,
            status=completion_data.status,
            last_attempted_code=completion_data.last_attempted_code,
            notes=completion_data.notes,  # Set notes
            bookmarked=completion_data.bookmarked,  # Set bookmarked
        )
        if completion_data.status == "completed":
            completion.completed_at = func.now()
        db.add(completion)

    db.commit()
    db.refresh(completion)

    return completion

@app.post("/lessons/{lesson_id}/start", response_model=schemas.UserLessonCompletion)
async def start_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if lesson exists
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Find existing completion record
    completion = db.query(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == current_user.id,
        models.UserLessonCompletion.lesson_id == lesson_id
    ).first()

    if not completion:
        # Create new completion record with status 'started'
        completion = models.UserLessonCompletion(
            user_id=current_user.id,
            lesson_id=lesson_id,
            status="started"
        )
        db.add(completion)
        db.commit()
        db.refresh(completion)
    
    return completion

@app.delete("/lessons/{lesson_id}/complete")
async def uncomplete_lesson(
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

    if not completion:
        raise HTTPException(status_code=400, detail="Lesson not marked as completed by this user.")

    db.delete(completion)
    db.commit()
    return {"message": "Lesson marked as incomplete!"}

@app.get("/users/me/lessons/{lesson_id}/code", response_model=Optional[schemas.UserLessonCompletion])
async def get_user_lesson_completion(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    completion = db.query(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == current_user.id,
        models.UserLessonCompletion.lesson_id == lesson_id
    ).first()
    return completion

@app.get("/users/me/lessons/completed", response_model=List[schemas.Lesson])
async def get_completed_lessons_for_current_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    completed_lessons = db.query(models.Lesson).join(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == current_user.id,
        models.UserLessonCompletion.status == "success"
    ).all()
    return completed_lessons

@app.get("/users/me/lesson-completions", response_model=List[schemas.UserLessonCompletion])
async def get_all_user_lesson_completions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    all_completions = db.query(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == current_user.id
    ).all()
    return all_completions

@app.delete("/users/me/lessons/completed")
async def reset_all_lesson_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db.query(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == current_user.id
    ).delete()
    db.commit()
    return {"message": "All lesson progress reset!"}

@app.delete("/users/me")
async def delete_user_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Delete associated lesson completions first
    db.query(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == current_user.id
    ).delete()
    
    # Then delete the user
    db.delete(current_user)
    db.commit()
    return {"message": "User account deleted successfully!"}

    db_user = session.query(models.User).filter(models.User.email == "deleter@example.com").first()
    assert db_user is None

@app.get("/users/", response_model=List[schemas.User])
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user) # Admin protected
):
    users = db.query(models.User).all()
    return users

@app.get("/users/{user_id}", response_model=schemas.User)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user) # Admin protected
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user) # Admin protected
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}")
async def delete_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user) # Admin protected
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete associated lesson completions first
    db.query(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == user_id
    ).delete()
    
    # Then delete the user
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully!"}

@app.get("/users/me/lessons/bookmarked", response_model=List[schemas.Lesson])
async def get_bookmarked_lessons_for_current_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    bookmarked_lessons = db.query(models.Lesson).join(models.UserLessonCompletion).filter(
        models.UserLessonCompletion.user_id == current_user.id,
        models.UserLessonCompletion.bookmarked == True
    ).all()
    return bookmarked_lessons

@app.post("/format-code/", response_model=str)
async def format_code(request: Request, current_user: models.User = Depends(auth.get_current_user)):
    code = await request.body()
    code_str = code.decode("utf-8")
    
    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py") as temp_file:
        temp_file.write(code_str)
        temp_file_path = temp_file.name

    try:
        # Run black as a subprocess on the temporary file
        process = await asyncio.create_subprocess_exec(
            "black",
            temp_file_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()

        if process.returncode == 0: # Black ran successfully (no changes or changes made)
            # Read the formatted code from the temporary file
            with open(temp_file_path, "r") as f:
                formatted_code = f.read()
            return formatted_code
        elif process.returncode == 1: # Black made changes
            with open(temp_file_path, "r") as f:
                formatted_code = f.read()
            return formatted_code
        else: # Black encountered an error
            raise HTTPException(status_code=400, detail=f"Black formatting error: {stderr.decode('utf-8')}")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Black formatter not found. Please ensure it is installed.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error formatting code: {e}")
    finally:
        os.remove(temp_file_path) # Clean up the temporary file

@app.post("/execute-code/", response_model=schemas.CodeExecutionResult)
async def execute_code(request: schemas.CodeExecutionRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if request.language != "python":
        raise HTTPException(status_code=400, detail="Only Python execution is supported for now.")

    if not CODE_EXECUTOR_URL:
        raise HTTPException(status_code=500, detail="CODE_EXECUTOR_URL environment variable is not set.")

    # Combine user code and test code for execution in the executor service
    code_to_execute = request.code
    if request.test_code:
        # A simple way to combine: run user code, then test code
        # In a real scenario, you might want more sophisticated test integration
        code_to_execute += f"\n\n# --- Test Code ---\n{request.test_code}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{CODE_EXECUTOR_URL}/execute",
                json={
                    "user_code": request.code,
                    "test_code": request.test_code,
                    "timeout": 10 # Example timeout, can be configurable
                }
            )
            response.raise_for_status() # Raise an exception for bad status codes
            executor_result = response.json()

            # Map the executor's result to your schema
            status_str = "error" # Default to error
            if executor_result["returncode"] == 0 and not executor_result["stderr"] and not executor_result["error"]:
                if "Tests passed" in executor_result["stdout"]:
                    status_str = "success"
                else:
                    status_str = "attempted" # Code ran, but tests didn't explicitly pass
            elif executor_result["returncode"] == 1 and ("AssertionError" in executor_result["stdout"] or "AssertionError" in executor_result["stderr"]):
                status_str = "attempted" # Code ran, but tests failed due to assertion



            # Update or create UserLessonCompletion with last attempted code and status
            completion = db.query(models.UserLessonCompletion).filter(
                models.UserLessonCompletion.user_id == current_user.id,
                models.UserLessonCompletion.lesson_id == request.lesson_id
            ).first()

            if completion:
                completion.last_attempted_code = request.code
                completion.status = status_str
                if status_str == "success":
                    completion.completed_at = func.now()

            else:
                completion = models.UserLessonCompletion(
                    user_id=current_user.id,
                    lesson_id=request.lesson_id,
                    last_attempted_code=request.code,
                    status=status_str,
                    notes=None,
                    bookmarked=False
                )
                if status_str == "success":
                    completion.completed_at = func.now()
                db.add(completion)

            db.commit()
            db.refresh(completion)


            return schemas.CodeExecutionResult(
                output=executor_result["stdout"],
                error=executor_result["stderr"] or executor_result["error"],
                status=status_str
            )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Code executor service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Code executor returned an error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")