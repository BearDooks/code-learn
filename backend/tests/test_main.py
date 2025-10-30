import pytest
import models
from httpx import AsyncClient
from main import app
from database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Use the fixtures from conftest.py
# from .conftest import client, session # This is implicitly handled by pytest

# Test root endpoint
@pytest.mark.asyncio
async def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from FastAPI backend!"}

# Test get lessons (empty initially)
@pytest.mark.asyncio
async def test_get_lessons_empty(client):
    response = client.get("/lessons/")
    assert response.status_code == 200
    assert response.json() == []

# Test signup (requires a test for the actual signup process)
# This will be more complex as it involves hashing passwords and database interaction
# For now, a placeholder
@pytest.mark.asyncio
async def test_signup_user(client, session):
    # Ensure the database is clean for this test
    session.query(models.User).delete()
    session.commit()

    user_data = {
        "email": "test@example.com",
        "password": "testpassword",
        "name": "Test User"
    }
    response = client.post("/signup/", json=user_data)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
    assert response.json()["name"] == "Test User"
    assert "id" in response.json()

    # Try to sign up with the same email
    response = client.post("/signup/", json=user_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

# Test login (requires a test for the actual login process)
@pytest.mark.asyncio
async def test_login_for_access_token(client, session):
    # First, sign up a user
    user_data = {
        "email": "login@example.com",
        "password": "loginpassword",
        "name": "Login User"
    }
    client.post("/signup/", json=user_data)

    # Then, try to log in
    form_data = {
        "username": "login@example.com",
        "password": "loginpassword"
    }
    response = client.post("/token", data=form_data)
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

    # Test with incorrect password
    form_data["password"] = "wrongpassword"
    response = client.post("/token", data=form_data)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

# Test get current user (requires authentication)
@pytest.mark.asyncio
async def test_read_users_me(client, session):
    # First, sign up and log in a user to get a token
    user_data = {
        "email": "me@example.com",
        "password": "mepassword",
        "name": "Me User"
    }
    client.post("/signup/", json=user_data)
    form_data = {
        "username": "me@example.com",
        "password": "mepassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    response = client.get("/users/me/", headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
    assert response.json()["name"] == "Me User"
    assert "id" in response.json()
    assert "lesson_completions" in response.json() # Check for eager loaded completions

# Test create lesson (requires admin user)
@pytest.mark.asyncio
async def test_create_lesson_admin(client, session):
    # First, sign up and log in an admin user
    admin_user_data = {
        "email": "admin@example.com",
        "password": "adminpassword",
        "name": "Admin User"
    }
    client.post("/signup/", json=admin_user_data)
    # Manually make user admin for testing purposes
    db_user = session.query(models.User).filter(models.User.email == "admin@example.com").first()
    db_user.is_admin = True
    session.add(db_user)
    session.commit()

    form_data = {
        "username": "admin@example.com",
        "password": "adminpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    lesson_data = {
        "title": "Test Lesson",
        "content": "This is a test lesson content.",
        "code_example": "print('hello')",
        "prefill_code": "print('world')",
        "test_code": "assert user_printed_output == 'world\n'"
    }
    response = client.post("/lessons/", json=lesson_data, headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert response.json()["title"] == "Test Lesson"
    assert "id" in response.json()

# Test create lesson (non-admin user should fail)
@pytest.mark.asyncio
async def test_create_lesson_non_admin_fails(client, session):
    # First, sign up and log in a non-admin user
    non_admin_user_data = {
        "email": "nonadmin@example.com",
        "password": "nonadminpassword",
        "name": "Non Admin User"
    }
    client.post("/signup/", json=non_admin_user_data)
    form_data = {
        "username": "nonadmin@example.com",
        "password": "nonadminpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    lesson_data = {
        "title": "Another Test Lesson",
        "content": "Content.",
        "code_example": "",
        "prefill_code": "",
        "test_code": ""
    }
    response = client.post("/lessons/", json=lesson_data, headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 403 # Forbidden
    assert response.json()["detail"] == "Not enough permissions"

# Test get lesson by ID
@pytest.mark.asyncio
async def test_get_lesson_by_id(client, session):
    # Create a lesson first (requires admin)
    admin_user_data = {
        "email": "admin2@example.com",
        "password": "adminpassword",
        "name": "Admin Two"
    }
    client.post("/signup/", json=admin_user_data)
    db_user = session.query(models.User).filter(models.User.email == "admin2@example.com").first()
    db_user.is_admin = True
    session.add(db_user)
    session.commit()
    form_data = {
        "username": "admin2@example.com",
        "password": "adminpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    lesson_data = {
        "title": "Fetchable Lesson",
        "content": "This lesson can be fetched.",
        "code_example": "",
        "prefill_code": "",
        "test_code": ""
    }
    create_response = client.post("/lessons/", json=lesson_data, headers={"Authorization": f"{token_type} {token}"})
    lesson_id = create_response.json()["id"]

    response = client.get(f"/lessons/{lesson_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Fetchable Lesson"
    assert response.json()["id"] == lesson_id

    response = client.get("/lessons/99999") # Non-existent ID
    assert response.status_code == 404
    assert response.json()["detail"] == "Lesson not found"

# Test update lesson (requires admin)
@pytest.mark.asyncio
async def test_update_lesson_admin(client, session):
    # Create a lesson first (requires admin)
    admin_user_data = {
        "email": "admin3@example.com",
        "password": "adminpassword",
        "name": "Admin Three"
    }
    client.post("/signup/", json=admin_user_data)
    db_user = session.query(models.User).filter(models.User.email == "admin3@example.com").first()
    db_user.is_admin = True
    session.add(db_user)
    session.commit()
    form_data = {
        "username": "admin3@example.com",
        "password": "adminpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    lesson_data = {
        "title": "Lesson to Update",
        "content": "Original content.",
        "code_example": "",
        "prefill_code": "",
        "test_code": ""
    }
    create_response = client.post("/lessons/", json=lesson_data, headers={"Authorization": f"{token_type} {token}"})
    lesson_id = create_response.json()["id"]

    updated_lesson_data = {
        "title": "Updated Lesson Title",
        "content": "New content.",
        "code_example": "updated code",
        "prefill_code": "updated prefill",
        "test_code": "updated test"
    }
    response = client.put(f"/lessons/{lesson_id}", json=updated_lesson_data, headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Lesson Title"
    assert response.json()["content"] == "New content."

# Test complete lesson
@pytest.mark.asyncio
async def test_complete_lesson(client, session):
    # Sign up a user
    user_data = {
        "email": "completer@example.com",
        "password": "completerpassword",
        "name": "Completer User"
    }
    client.post("/signup/", json=user_data)
    form_data = {
        "username": "completer@example.com",
        "password": "completerpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    # Create a lesson (as admin)
    admin_user_data = {
        "email": "admin4@example.com",
        "password": "adminpassword",
        "name": "Admin Four"
    }
    client.post("/signup/", json=admin_user_data)
    db_user = session.query(models.User).filter(models.User.email == "admin4@example.com").first()
    db_user.is_admin = True
    session.add(db_user)
    session.commit()
    admin_form_data = {
        "username": "admin4@example.com",
        "password": "adminpassword"
    }
    admin_token_response = client.post("/token", data=admin_form_data)
    admin_token = admin_token_response.json()["access_token"]
    admin_token_type = admin_token_response.json()["token_type"]

    lesson_data = {
        "title": "Completable Lesson",
        "content": "Complete me.",
        "code_example": "",
        "prefill_code": "",
        "test_code": ""
    }
    create_response = client.post("/lessons/", json=lesson_data, headers={"Authorization": f"{admin_token_type} {admin_token}"})
    lesson_id = create_response.json()["id"]

    # Mark lesson as complete
    response = client.post(f"/lessons/{lesson_id}/complete", headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert response.json()["user_id"] == session.query(models.User).filter(models.User.email == "completer@example.com").first().id
    assert response.json()["lesson_id"] == lesson_id

    # Try to complete again (should fail)
    response = client.post(f"/lessons/{lesson_id}/complete", headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Lesson already marked as completed by this user."

# Test get completed lessons
@pytest.mark.asyncio
async def test_get_completed_lessons(client, session):
    # Sign up a user
    user_data = {
        "email": "getter@example.com",
        "password": "getterpassword",
        "name": "Getter User"
    }
    client.post("/signup/", json=user_data)
    form_data = {
        "username": "getter@example.com",
        "password": "getterpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    # Create two lessons (as admin)
    admin_user_data = {
        "email": "admin5@example.com",
        "password": "adminpassword",
        "name": "Admin Five"
    }
    client.post("/signup/", json=admin_user_data)
    db_user = session.query(models.User).filter(models.User.email == "admin5@example.com").first()
    db_user.is_admin = True
    session.add(db_user)
    session.commit()
    admin_form_data = {
        "username": "admin5@example.com",
        "password": "adminpassword"
    }
    admin_token_response = client.post("/token", data=admin_form_data)
    admin_token = admin_token_response.json()["access_token"]
    admin_token_type = admin_token_response.json()["token_type"]

    lesson_data_1 = {"title": "Lesson One", "content": "Content 1", "code_example": "", "prefill_code": "", "test_code": ""}
    create_response_1 = client.post("/lessons/", json=lesson_data_1, headers={"Authorization": f"{admin_token_type} {admin_token}"})
    lesson_id_1 = create_response_1.json()["id"]

    lesson_data_2 = {"title": "Lesson Two", "content": "Content 2", "code_example": "", "prefill_code": "", "test_code": ""}
    create_response_2 = client.post("/lessons/", json=lesson_data_2, headers={"Authorization": f"{admin_token_type} {admin_token}"})
    lesson_id_2 = create_response_2.json()["id"]

    # Complete lesson 1
    client.post(f"/lessons/{lesson_id_1}/complete", headers={"Authorization": f"{token_type} {token}"})

    # Get completed lessons
    response = client.get("/users/me/lessons/completed", headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == lesson_id_1
    assert response.json()[0]["title"] == "Lesson One"

# Test code execution endpoint
@pytest.mark.asyncio
async def test_execute_code_print(client, session):
    # Sign up and log in a user
    user_data = {
        "email": "executor@example.com",
        "password": "executorpassword",
        "name": "Executor User"
    }
    client.post("/signup/", json=user_data)
    form_data = {
        "username": "executor@example.com",
        "password": "executorpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    code_request = {
        "code": "print('Hello')",
        "language": "python",
        "test_code": "assert user_printed_output == 'Hello\\n'"
    }
    response = client.post("/execute-code/", json=code_request, headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert response.json()["output"] == "Hello\n"    
    assert response.json()["status"] == "success"

@pytest.mark.asyncio
async def test_execute_code_return_value(client, session):
    # Sign up and log in a user
    user_data = {
        "email": "returner@example.com",
        "password": "returnerpassword",
        "name": "Returner User"
    }
    client.post("/signup/", json=user_data)
    form_data = {
        "username": "returner@example.com",
        "password": "returnerpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    code_request = {
        "code": "def add(a, b): return a + b\n_user_return_value_capture = add(1, 2)",
        "language": "python",
        "test_code": "assert user_return_value == 3"
    }
    response = client.post("/execute-code/", json=code_request, headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert response.json()["output"] == "" # No print output from user code
    assert response.json()["status"] == "success"

@pytest.mark.asyncio
async def test_execute_code_syntax_error(client, session):
    # Sign up and log in a user
    user_data = {
        "email": "syntax@example.com",
        "password": "syntaxpassword",
        "name": "Syntax User"
    }
    client.post("/signup/", json=user_data)
    form_data = {
        "username": "syntax@example.com",
        "password": "syntaxpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    code_request = {
        "code": "print('Hello'", # Missing parenthesis
        "language": "python",
        "test_code": ""
    }
    response = client.post("/execute-code/", json=code_request, headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert "An error occurred during user code execution: SyntaxError: '(' was never closed" in response.json()["error"]
    assert response.json()["status"] == "error"

@pytest.mark.asyncio
async def test_execute_code_test_fail(client, session):
    # Sign up and log in a user
    user_data = {
        "email": "testfail@example.com",
        "password": "testfailpassword",
        "name": "Test Fail User"
    }
    client.post("/signup/", json=user_data)
    form_data = {
        "username": "testfail@example.com",
        "password": "testfailpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    code_request = {
        "code": "print('Wrong')",
        "language": "python",
        "test_code": "assert user_printed_output == 'Correct\\n'"
    }
    response = client.post("/execute-code/", json=code_request, headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert "An error occurred during test code execution: AssertionError" in response.json()["error"]
    assert response.json()["status"] == "test_failed"

# Test uncomplete lesson
@pytest.mark.asyncio
async def test_uncomplete_lesson(client, session):
    # Sign up a user
    user_data = {
        "email": "uncompleter@example.com",
        "password": "uncompleterpassword",
        "name": "Uncompleter User"
    }
    client.post("/signup/", json=user_data)
    form_data = {
        "username": "uncompleter@example.com",
        "password": "uncompleterpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    # Create a lesson (as admin)
    admin_user_data = {
        "email": "admin_uncomplete@example.com",
        "password": "adminpassword",
        "name": "Admin Uncomplete"
    }
    client.post("/signup/", json=admin_user_data)
    db_user = session.query(models.User).filter(models.User.email == "admin_uncomplete@example.com").first()
    db_user.is_admin = True
    session.add(db_user)
    session.commit()
    admin_form_data = {
        "username": "admin_uncomplete@example.com",
        "password": "adminpassword"
    }
    admin_token_response = client.post("/token", data=admin_form_data)
    admin_token = admin_token_response.json()["access_token"]
    admin_token_type = admin_token_response.json()["token_type"]

    lesson_data = {
        "title": "Uncompletable Lesson",
        "content": "Uncomplete me.",
        "code_example": "",
        "prefill_code": "",
        "test_code": ""
    }
    create_response = client.post("/lessons/", json=lesson_data, headers={"Authorization": f"{admin_token_type} {admin_token}"})
    lesson_id = create_response.json()["id"]

    # Mark lesson as complete
    client.post(f"/lessons/{lesson_id}/complete", headers={"Authorization": f"{token_type} {token}"})

    # Verify it's completed
    completed_lessons_response = client.get("/users/me/lessons/completed", headers={"Authorization": f"{token_type} {token}"})
    assert completed_lessons_response.status_code == 200
    assert len(completed_lessons_response.json()) == 1

    # Uncomplete the lesson
    response = client.delete(f"/lessons/{lesson_id}/complete", headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Lesson marked as incomplete!"

    # Verify it's no longer completed
    completed_lessons_response = client.get("/users/me/lessons/completed", headers={"Authorization": f"{token_type} {token}"})
    assert completed_lessons_response.status_code == 200
    assert len(completed_lessons_response.json()) == 0

    # Test uncompleting a non-existent lesson
    response = client.delete("/lessons/99999/complete", headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Lesson not found"

    # Test uncompleting an already uncompleted lesson
    response = client.delete(f"/lessons/{lesson_id}/complete", headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Lesson not marked as completed by this user."

# Test reset all lesson progress
@pytest.mark.asyncio
async def test_reset_all_lesson_progress(client, session):
    # Sign up a user
    user_data = {
        "email": "resetter@example.com",
        "password": "resetterpassword",
        "name": "Resetter User"
    }
    client.post("/signup/", json=user_data)
    form_data = {
        "username": "resetter@example.com",
        "password": "resetterpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    # Create two lessons (as admin)
    admin_user_data = {
        "email": "admin_reset@example.com",
        "password": "adminpassword",
        "name": "Admin Reset"
    }
    client.post("/signup/", json=admin_user_data)
    db_user = session.query(models.User).filter(models.User.email == "admin_reset@example.com").first()
    db_user.is_admin = True
    session.add(db_user)
    session.commit()
    admin_form_data = {
        "username": "admin_reset@example.com",
        "password": "adminpassword"
    }
    admin_token_response = client.post("/token", data=admin_form_data)
    admin_token = admin_token_response.json()["access_token"]
    admin_token_type = admin_token_response.json()["token_type"]

    lesson_data_1 = {"title": "Reset Lesson One", "content": "Content 1", "code_example": "", "prefill_code": "", "test_code": ""}
    create_response_1 = client.post("/lessons/", json=lesson_data_1, headers={"Authorization": f"{admin_token_type} {admin_token}"})
    lesson_id_1 = create_response_1.json()["id"]

    lesson_data_2 = {"title": "Reset Lesson Two", "content": "Content 2", "code_example": "", "prefill_code": "", "test_code": ""}
    create_response_2 = client.post("/lessons/", json=lesson_data_2, headers={"Authorization": f"{admin_token_type} {admin_token}"})
    lesson_id_2 = create_response_2.json()["id"]

    # Complete both lessons
    client.post(f"/lessons/{lesson_id_1}/complete", headers={"Authorization": f"{token_type} {token}"})
    client.post(f"/lessons/{lesson_id_2}/complete", headers={"Authorization": f"{token_type} {token}"})

    # Verify they are completed
    completed_lessons_response = client.get("/users/me/lessons/completed", headers={"Authorization": f"{token_type} {token}"})
    assert completed_lessons_response.status_code == 200
    assert len(completed_lessons_response.json()) == 2

    # Reset all progress
    response = client.delete("/users/me/lessons/completed", headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "All lesson progress reset!"

    # Verify no lessons are completed
    completed_lessons_response = client.get("/users/me/lessons/completed", headers={"Authorization": f"{token_type} {token}"})
    assert completed_lessons_response.status_code == 200
    assert len(completed_lessons_response.json()) == 0

# Test delete user account
@pytest.mark.asyncio
async def test_delete_user_account(client, session):
    # Sign up a user
    user_data = {
        "email": "deleter@example.com",
        "password": "deleterpassword",
        "name": "Deleter User"
    }
    client.post("/signup/", json=user_data)
    form_data = {
        "username": "deleter@example.com",
        "password": "deleterpassword"
    }
    token_response = client.post("/token", data=form_data)
    token = token_response.json()["access_token"]
    token_type = token_response.json()["token_type"]

    # Create a lesson (as admin)
    admin_user_data = {
        "email": "admin_delete@example.com",
        "password": "adminpassword",
        "name": "Admin Delete"
    }
    client.post("/signup/", json=admin_user_data)
    db_user = session.query(models.User).filter(models.User.email == "admin_delete@example.com").first()
    db_user.is_admin = True
    session.add(db_user)
    session.commit()
    admin_form_data = {
        "username": "admin_delete@example.com",
        "password": "adminpassword"
    }
    admin_token_response = client.post("/token", data=admin_form_data)
    admin_token = admin_token_response.json()["access_token"]
    admin_token_type = admin_token_response.json()["token_type"]

    lesson_data = {
        "title": "Deletable Lesson",
        "content": "Delete me.",
        "code_example": "",
        "prefill_code": "",
        "test_code": ""
    }
    create_response = client.post("/lessons/", json=lesson_data, headers={"Authorization": f"{admin_token_type} {admin_token}"})
    lesson_id = create_response.json()["id"]

    # Complete the lesson
    client.post(f"/lessons/{lesson_id}/complete", headers={"Authorization": f"{token_type} {token}"})

    # Verify it's completed
    completed_lessons_response = client.get("/users/me/lessons/completed", headers={"Authorization": f"{token_type} {token}"})
    assert completed_lessons_response.status_code == 200
    assert len(completed_lessons_response.json()) == 1

    # Delete the user account
    response = client.delete("/users/me", headers={"Authorization": f"{token_type} {token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "User account deleted successfully!"

    # Verify user cannot log in anymore
    login_response = client.post("/token", data=form_data)
    assert login_response.status_code == 401

    # Verify user's lesson completions are gone (by trying to fetch them as admin, or directly from DB)
    # For simplicity, we'll try to fetch completed lessons as the deleted user, which should fail due to auth
    # A more thorough test would involve checking the database directly or trying to create a new user with the same email
    # For now, the 401 on login is a good indicator.

    # Verify user is actually deleted from DB
    db_user = session.query(models.User).filter(models.User.email == "deleter@example.com").first()
    assert db_user is None
