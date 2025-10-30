# Project Overview: Interactive Coding Web Application

## Project Goal:
Develop an open-source web application to teach coding skills through interactive projects, similar to boot.dev.

## Core Features:
*   **Interactive Lessons:** Display coding lessons with explanations, code examples, and exercises.
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
*   **Code Execution (Frontend Integration):** Frontend code editors (main editor and lesson exercise editor) send user code and `test_code` to a backend endpoint. The backend executes the code and returns output, errors, and a status (success/error/test_failed).
*   **Code Execution (Backend - Direct Server Execution):** The backend currently executes Python code directly on the server. **WARNING: This is a severe security risk and is for development only. MUST be replaced with a secure, sandboxed environment (e.g., Docker) before deployment.**
*   **Removed Code Playground:** The standalone `/editor` code playground section has been removed from the application.
*   **User Progress Management:**
    *   Users can mark individual lessons as incomplete.
    *   Users can reset all their lesson progress from their profile.
    *   Users can delete their account from their profile, which also removes all associated lesson completions.
    *   Visual feedback (Bootstrap alert) is provided upon successful lesson completion, with improved message and placement.
*   **Admin User Management:**
    *   Admin users can view a list of all users in the system.
    *   Admin users can edit user details (email, name, active status, admin status) via a modal.
    *   Admin users can delete user accounts.
*   **Create Lesson Page Enhancements:** The wording and layout of descriptions for code examples, prefill code, and test code input fields have been improved for better readability and clarity.
*   **UI/UX Refinement:**
    *   **Active Navigation Links:** Navigation links now visually indicate the active page.
    *   **Branding/Logo:** A simple text-based logo with styling has been added to the navbar.
    *   **Global Alert System:** Implemented for consistent user feedback across `Login`, `Signup`, `Profile`, and `LessonForm` components.
    *   **Global Loading Indicator:** Implemented for consistent loading feedback across `Login`, `Signup`, `Profile`, and `LessonDetail` components.
    *   **Lesson Detail Page Loading Fix:** Resolved an issue where the loading spinner would persist indefinitely on the Lesson Detail page.
*   **Initial Lessons:** 10 new introductory lessons have been created and added to the database, covering fundamental programming concepts (printing, variables, arithmetic, strings, input, conditionals, loops, functions, return values).
*   **Next Immediate Focus:** Implement the actual sandboxed code execution environment on the backend using Docker to address security concerns.