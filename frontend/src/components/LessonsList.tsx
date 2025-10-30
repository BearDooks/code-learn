import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App'; // Import useAuth hook

interface Lesson {
  id: number;
  title: string;
}

const LessonsList: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set()); // New state for completed lesson IDs
  const { isLoggedIn } = useAuth(); // Use useAuth hook

  useEffect(() => {
    const fetchLessonsAndCompletions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all lessons
        const lessonsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lessons/`);
        if (!lessonsResponse.ok) {
          throw new Error(`HTTP error! status: ${lessonsResponse.status}`);
        }
        const lessonsData: Lesson[] = await lessonsResponse.json();
        setLessons(lessonsData);

        // Fetch completed lessons if logged in
        if (isLoggedIn) {
          const token = localStorage.getItem('access_token');
          const tokenType = localStorage.getItem('token_type');

          if (token && tokenType) {
            const completedResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/lessons/completed`, {
              headers: {
                'Authorization': `${tokenType} ${token}`,
              },
            });

            if (completedResponse.ok) {
              const completedData: Lesson[] = await completedResponse.json();
              const ids = new Set(completedData.map(lesson => lesson.id));
              setCompletedLessonIds(ids);
            } else {
              console.error('Failed to fetch completed lessons:', completedResponse.statusText);
              // Optionally, handle error for fetching completed lessons
            }
          }
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonsAndCompletions();
  }, [isLoggedIn]); // Re-run when login status changes

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger mt-4">Error: {error}</div>;
  }

  return (
    <div>
      <h1>Lessons</h1>
      <div className="list-group">
        {lessons.length > 0 ? (
          lessons.map(lesson => {
            const isCompleted = completedLessonIds.has(lesson.id);
            return (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.id}`}
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${isCompleted ? 'list-group-item-success' : ''}`}
              >
                {lesson.title}
                {isCompleted && <span className="badge bg-success rounded-pill">Completed</span>}
              </Link>
            );
          })
        ) : (
          <p className="mt-3">No lessons available. Please add some lessons to the database.</p>
        )}
      </div>
    </div>
  );
};

export default LessonsList;
