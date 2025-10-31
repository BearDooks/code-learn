# Interactive Coding Web Application

## Project Goal
Develop an open-source web application to teach coding skills through interactive projects, similar to boot.dev.

## Core Features
*   **Interactive Lessons:** Display coding lessons with explanations, code examples, and exercises.
*   **Automated Feedback/Testing:** System to evaluate user-submitted code against test cases and provide immediate feedback.
*   **User Authentication:** Allow users to create accounts, log in, and manage their profiles.
*   **Progress Tracking:** Track user progress through lessons and projects.
*   **Project-Based Learning:** Structure content around guided coding projects.
*   **Admin Account Creation:** Automatically create an admin user on startup if configured.
*   **Conditional Lesson Population:** Option to automatically populate the database with initial lessons.

## Technology Stack
*   **Frontend:** React (with TypeScript) with Bootstrap CSS.
*   **Backend:** Python with FastAPI.
*   **Database:** PostgreSQL.
*   **Code Execution Environment:** Isolated environment for user-submitted code.

## High-Level Architecture
*   **Client-Side (Frontend):** React application communicating with the backend API.
*   **Server-Side (Backend):** FastAPI application handling API requests, user authentication, database interactions, and orchestrating code execution.
*   **Database:** PostgreSQL instance storing user data, lesson content, progress, etc.
*   **Code Runner Service:** A separate service responsible for receiving user code, executing it in a sandbox, and returning results.

## Getting Started

### Prerequisites
*   [Docker](https://www.docker.com/get-started) (includes Docker Compose)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/code-learn.git
cd code-learn
```

### 2. Create and Configure the `.env` File
Create a file named `.env` in the root directory of the project (where `docker-compose.yml` is located). This file will store environment variables for your application.

Here's an example `.env` file. **Replace placeholder values with your desired settings.**

```env
# --- Project URL (for CORS and Frontend API Base) ---
# The base URL where your project will be accessed (e.g., http://localhost:3000 or http://192.168.86.20:3000)
PROJECT_URL=http://localhost:3000

# --- Database Configuration ---
POSTGRES_DB=code_learn_db
POSTGRES_USER=user
POSTGRES_PASSWORD=password

# --- Admin User Configuration (Optional) ---
# If these are set, an admin user will be created on backend startup if one doesn't exist.
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=adminpassword

# --- Initial Lessons Configuration (Optional) ---
# Set to 'true' to populate the database with example lessons on backend startup.
# Ensure this is set before the first time you run the backend with an empty database.
RUN_CREATE_LESSONS=true

# --- Backend Configuration ---
# The URL where the code executor service is expected to be running.
CODE_EXECUTOR_URL=http://code_executor:5000
# Comma-separated list of allowed origins for CORS. This will be constructed from PROJECT_URL and other defaults.
ALLOWED_ORIGINS=${PROJECT_URL},${PROJECT_URL}:3000,http://localhost:5173,http://127.0.0.1:5173

# --- Frontend Configuration ---
# The external URL for the backend API that the frontend will communicate with.
# Example: http://localhost:8000 or http://192.168.86.20:8000
BACKEND_EXTERNAL_URL=http://localhost:8000
```

### 3. Build and Run with Docker Compose
Navigate to the root directory of your project and run:

```bash
docker-compose build
docker-compose up -d
```

*   `docker-compose build`: Builds the Docker images for your services.
*   `docker-compose up -d`: Starts the services in detached mode.

### Admin Account Creation
If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in your `.env` file, the backend will attempt to create an admin user with these credentials during its startup. This user will have `is_admin=True`, allowing access to administrative features.

### Populating Initial Lessons
If `RUN_CREATE_LESSONS=true` is set in your `.env` file, the backend will run the `create_lessons.py` script during its startup. This script will populate your database with a set of introductory programming lessons. The script is idempotent, meaning it will only add lessons that don't already exist, so it's safe to run multiple times.

### Accessing the Application
*   **Frontend:** `http://localhost:3000` (or the IP address of your Docker host if accessing remotely, e.g., `http://192.168.86.20:3000`)
*   **Backend API:** `http://localhost:8000` (for direct API access/testing)

## Future Development Roadmap
1.  **Lesson Features & Content:** Develop 2-3 complete, interactive lessons with explanations, code examples, and exercises that can run successfully.
2.  **Code Editor & Execution:** Enhance the code editor, integrate with the backend for secure code execution, and provide automated feedback/testing.
3.  **UI/UX Refinement:** Improve the overall visual design, responsiveness, and user experience of the application.

## License
(Consider adding a license here, e.g., MIT, Apache 2.0, etc.)
