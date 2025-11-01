import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App'; // Import useAuth hook

interface Lesson {
  id: number;
  title: string;
}

interface UserLessonCompletion {
  lesson_id: number;
  status: string;
}

const LessonsList: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonCompletionStatuses, setLessonCompletionStatuses] = useState<Map<number, string>>(new Map()); // Map lesson ID to its status
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

        // Fetch all user lesson completions if logged in
        if (isLoggedIn) {
          const token = localStorage.getItem('access_token');
          const tokenType = localStorage.getItem('token_type');

          if (token && tokenType) {
            const allCompletionsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/lesson-completions`, {
              headers: {
                'Authorization': `${tokenType} ${token}`,
              },
            });

            if (allCompletionsResponse.ok) {
              const allCompletionsData: UserLessonCompletion[] = await allCompletionsResponse.json();
              const statusesMap = new Map<number, string>();
              allCompletionsData.forEach(completion => {
                statusesMap.set(completion.lesson_id, completion.status);
              });
              setLessonCompletionStatuses(statusesMap);
            } else {
              console.error('Failed to fetch all lesson completions:', allCompletionsResponse.statusText);
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
            const completionStatus = lessonCompletionStatuses.get(lesson.id);
            const isCompleted = completionStatus === "completed";
            const isInProgress = completionStatus === "attempted" || completionStatus === "started";
            
            let badge = null;
            let listItemClass = "";

            if (isCompleted) {
              badge = <span className="badge bg-success rounded-pill">Completed</span>;
              listItemClass = "list-group-item-success";
            } else if (isInProgress) {
              badge = <span className="badge bg-info rounded-pill">In Progress</span>;
              listItemClass = "list-group-item-info";
            }

            return (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.id}`}
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${listItemClass}`}
              >
                {lesson.title}
                {badge}
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
