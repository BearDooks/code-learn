# Project Overview: Interactive Coding Web Application

## Project Goal:
Develop an open-source web application to teach coding skills through interactive projects, similar to boot.dev.

## Core Features:
*   **Interactive Lessons:** Display coding lessons with explanations, code examples, and exercises.
*   **Code Editor:** An integrated, interactive code editor where users can write and run code directly in the browser.
*   **Automated Feedback/Testing:** System to evaluate user-submitted code against test cases and provide immediate feedback.
*   **User Authentication:** Allow users to create accounts, log in, and manage their profiles.
*   **Progress Tracking:** Track user progress through lessons and projects.
*   **Project-Based Learning:** Structure content around guided coding projects.

## Technology Stack:
*   **Frontend:** React (with TypeScript) for a dynamic and component-based user interface. UI library like Bootstrap or Material-UI for styling.
*   **Backend:** Python with FastAPI for building APIs.
*   **Database:** PostgreSQL for robust and scalable data storage.
*   **Code Execution Environment:** A secure, isolated environment (e.g., Docker containers) on the backend to run user-submitted code.

## High-Level Architecture:
*   **Client-Side (Frontend):** React application communicating with the backend API.
*   **Server-Side (Backend):** FastAPI application handling API requests, user authentication, database interactions, and orchestrating code execution.
*   **Database:** PostgreSQL instance storing user data, lesson content, progress, etc.
*   **Code Runner Service:** A separate service (potentially a microservice or a component within the FastAPI app) responsible for receiving user code, executing it in a sandbox, and returning results.

## Deployment Strategy:
*   **Docker Deployment:** The entire application (frontend, backend, database, and code runner) will be containerized using Docker for easy deployment and scalability.

## Initial Setup:
*   Set up a basic project structure with separate directories for frontend and backend.
*   Initialize a React project for the frontend (using Vite).
*   Initialize a FastAPI project for the backend.
*   Configure a basic database connection.

## Future Development Roadmap:
1.  **User Authentication:** Implement full user signup, login, and profile management with backend integration.
2.  **Lesson Features & Content:** Develop 2-3 complete, interactive lessons with explanations, code examples, and exercises that can run successfully.
3.  **Code Editor & Execution:** Enhance the code editor, integrate with the backend for secure code execution, and provide automated feedback/testing.
4.  **UI/UX Refinement:** Improve the overall visual design, responsiveness, and user experience of the application.

## Current Progress:
*   **Frontend Setup:** React with TypeScript, Bootstrap, React Router DOM.
*   **Backend Setup:** FastAPI with PostgreSQL, SQLAlchemy.
*   **User Authentication:** Fully implemented with signup, login, profile, and role-based access control (admin/non-admin).
*   **Lesson Management:** CRUD operations for lessons (create, read list, read detail, update) are implemented. Lessons can include `code_example`, `prefill_code` (for exercises), and `test_code` fields.
*   **Interactive Lesson Display:** Code examples are displayed using Monaco Editor in read-only mode. Lesson content supports Markdown rendering.
*   **Code Execution (Frontend Integration):):** Frontend code editors (main editor and lesson exercise editor) send user code and `test_code` to a backend endpoint. The backend executes the code and returns output, errors, and a status (success/error/test_failed).
*   **Code Execution (Backend - Direct Server Execution):** The backend currently executes Python code directly on the server. **WARNING: This is a severe security risk and is for development only. MUST be replaced with a secure, sandboxed environment (e.g., Docker) before deployment.**
*   **UI/UX Refinement:** Initial phase completed, including: sticky footer, improved layout, client-side form validation and feedback for signup, login, and lesson forms, loading indicators, error handling, card styling, and improved visual flow on lesson detail page.
*   **Next Immediate Focus:** Implement the actual sandboxed code execution environment on the backend using Docker to address security concerns.