from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import subprocess
import os
import tempfile
import asyncio
from typing import Optional # Import Optional

app = FastAPI()

class CodeExecutionRequest(BaseModel):
    user_code: str
    test_code: Optional[str] = None
    timeout: int = 5 # seconds
    language: str = "python" # Add language field with default

class CodeExecutionResult(BaseModel):
    stdout: str
    stderr: str
    returncode: int
    error: Optional[str] = None

@app.post("/execute", response_model=CodeExecutionResult)
async def execute_code(request: CodeExecutionRequest):
    """
    Executes Python code in a sandboxed environment.
    """
    user_stdout = ""
    user_stderr = ""
    user_returncode = 0
    user_error_message = None
    linter_output = "" # Initialize linter output

    # --- Run Linter (Flake8) ---
    if request.language == "python": # Only lint Python code
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py") as user_code_file:
            user_code_file.write(request.user_code)
            user_code_path = user_code_file.name

        try:
            # Run Flake8
            linter_process = await asyncio.create_subprocess_exec(
                "flake8",
                "--ignore=E501,W292,W391", # Ignore common style issues like line length, no newline at end of file
                user_code_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            linter_stdout_bytes, linter_stderr_bytes = await linter_process.communicate()
            linter_output = linter_stdout_bytes.decode("utf-8") + linter_stderr_bytes.decode("utf-8")
        except FileNotFoundError:
            linter_output = "Linter (flake8) not found. Please ensure it is installed in the execution environment."
        except Exception as e:
            linter_output = f"Error running linter: {e}"
        finally:
            os.remove(user_code_path) # Clean up the temporary file

    # --- Execute User Code ---
    # Re-create user_code_file for execution if it was removed by linter
    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py") as user_code_file:
        user_code_file.write(request.user_code)
        user_code_path = user_code_file.name

    try:
        user_process = await asyncio.create_subprocess_exec(
            "python",
            user_code_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        try:
            user_stdout_bytes, user_stderr_bytes = await asyncio.wait_for(user_process.communicate(), timeout=request.timeout)
            user_stdout = user_stdout_bytes.decode("utf-8")
            user_stderr = user_stderr_bytes.decode("utf-8")
            user_returncode = user_process.returncode
        except asyncio.TimeoutError:
            user_process.kill()
            user_stdout_bytes, user_stderr_bytes = await user_process.communicate()
            user_stdout = user_stdout_bytes.decode("utf-8")
            user_stderr = user_stderr_bytes.decode("utf-8")
            user_returncode = -1
            user_error_message = f"User code execution timed out after {request.timeout} seconds."
        except Exception as e:
            user_error_message = str(e)
    finally:
        os.remove(user_code_path)

    # If user code had an error, return immediately
    if user_returncode != 0 or user_stderr or user_error_message:
        return CodeExecutionResult(
            stdout=user_stdout,
            stderr=user_stderr,
            returncode=user_returncode,
            error=user_error_message or user_stderr,
            linter_output=linter_output # Include linter output
        )

    # --- Execute Test Code (if provided) ---
    if request.test_code:
        test_stdout = ""
        test_stderr = ""
        test_returncode = 0
        test_error_message = None

        # Prepare test code with user_printed_output injected
        # We escape the user_stdout to ensure it's a valid string literal in Python
        escaped_user_stdout = user_stdout.replace('\\', '\\\\').replace('"', '\"').replace('\n', '\\n')
        injected_test_code = f"user_printed_output = {repr(user_stdout)}\n{request.test_code}"

        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py") as test_code_file:
            test_code_file.write(injected_test_code)
            test_code_path = test_code_file.name

        try:
            test_process = await asyncio.create_subprocess_exec(
                "python",
                test_code_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            try:
                test_stdout_bytes, test_stderr_bytes = await asyncio.wait_for(test_process.communicate(), timeout=request.timeout)
                test_stdout = test_stdout_bytes.decode("utf-8")
                test_stderr = test_stderr_bytes.decode("utf-8")
                test_returncode = test_process.returncode
            except asyncio.TimeoutError:
                test_process.kill()
                test_stdout_bytes, test_stderr_bytes = await test_process.communicate()
                test_stdout = test_stdout_bytes.decode("utf-8")
                test_stderr = test_stderr_bytes.decode("utf-8")
                test_returncode = -1
                test_error_message = f"Test code execution timed out after {request.timeout} seconds."
            except Exception as e:
                test_error_message = str(e)
        finally:
            os.remove(test_code_path)




        # Check for assertion errors in test output
        if "AssertionError" in test_stdout or "AssertionError" in test_stderr:
            test_returncode = 1 # Indicate failure due to assertion

        # If test code has an error, that takes precedence
        if test_returncode != 0 or test_stderr or test_error_message:
            return CodeExecutionResult(
                stdout=user_stdout + test_stdout, # Show user output and any test output
                stderr=test_stderr,
                returncode=test_returncode,
                error=test_error_message or test_stderr,
                linter_output=linter_output # Include linter output
            )
        else:
            # Test code ran successfully
            return CodeExecutionResult(
                stdout=user_stdout + test_stdout,
                stderr="",
                returncode=0,
                error=None,
                linter_output=linter_output # Include linter output
            )

    # If no test code, just return user code execution result
    return CodeExecutionResult(
        stdout=user_stdout,
        stderr=user_stderr,
        returncode=user_returncode,
        error=user_error_message or user_stderr,
        linter_output=linter_output # Include linter output
    )
