from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import subprocess
import os
import tempfile
import asyncio

app = FastAPI()

class CodeExecutionRequest(BaseModel):
    code: str
    timeout: int = 5 # seconds

class CodeExecutionResult(BaseModel):
    stdout: str
    stderr: str
    returncode: int
    error: str = None

@app.post("/execute", response_model=CodeExecutionResult)
async def execute_code(request: CodeExecutionRequest):
    """
    Executes Python code in a sandboxed environment.
    """
    # Create a temporary file to store the user's code
    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py") as temp_file:
        temp_file.write(request.code)
        temp_file_path = temp_file.name

    try:
        # Execute the Python code using subprocess
        # We use asyncio.create_subprocess_exec for non-blocking execution
        process = await asyncio.create_subprocess_exec(
            "python",
            temp_file_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            # Precautionary measures:
            # - limit memory (ulimit -v) - not directly supported by subprocess, needs preexec_fn or external tool
            # - limit CPU time (ulimit -t) - not directly supported by subprocess
            # - run as a less privileged user (already handled by Dockerfile)
            # - prevent network access (needs Docker network configuration)
        )

        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=request.timeout)
            stdout = stdout.decode("utf-8")
            stderr = stderr.decode("utf-8")
            return_code = process.returncode
            error_message = None
        except asyncio.TimeoutError:
            process.kill()
            stdout, stderr = await process.communicate()
            stdout = stdout.decode("utf-8")
            stderr = stderr.decode("utf-8")
            return_code = -1 # Indicate timeout
            error_message = f"Execution timed out after {request.timeout} seconds."
        except Exception as e:
            stdout = ""
            stderr = ""
            return_code = -1
            error_message = str(e)

    finally:
        # Clean up the temporary file
        os.remove(temp_file_path)

    return CodeExecutionResult(
        stdout=stdout,
        stderr=stderr,
        returncode=return_code,
        error=error_message
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
