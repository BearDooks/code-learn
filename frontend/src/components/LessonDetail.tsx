import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react'; // Import Monaco Editor
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import { useAuth } from '../App'; // Import useAuth hook

interface Lesson {
  id: number;
  title: string;
  content: string;
  code_example: string | null;
  prefill_code: string | null;
  test_code: string | null;
}

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAdmin, isLoggedIn, setGlobalLoading } = useAuth(); // Use useAuth hook

  const [exerciseCode, setExerciseCode] = useState<string>(''); // Initialize with empty string
  const [exerciseOutput, setExerciseOutput] = useState<string>('Output will appear here.');
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [showCompletionAlert, setShowCompletionAlert] = useState<boolean>(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setGlobalLoading(true); // Show global loading indicator
      fetch(`http://localhost:8000/lessons/${id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data: Lesson) => {
          setLesson(data);
          setExerciseCode(data.prefill_code || '# Write your solution here'); // Set prefill code
          setLoading(false);

          if (isLoggedIn && data.id) {
            const token = localStorage.getItem('access_token');
            const tokenType = localStorage.getItem('token_type');

            if (token && tokenType) {
              fetch(`http://localhost:8000/users/me/lessons/completed`, {
                headers: {
                  'Authorization': `${tokenType} ${token}`,
                },
              })
              .then(response => response.json())
              .then((completedLessons: Lesson[]) => {
                const completed = completedLessons.some(cl => cl.id === data.id);
                setIsLessonCompleted(completed);
              })
              .catch(err => console.error("Error fetching completed lessons:", err));
            }
          }
        })
        .catch(error => {
          console.error("Error fetching lesson:", error);
          setError(error.message);
          setLoading(false);
        })
        .finally(() => {
          setGlobalLoading(false); // Hide global loading indicator
        });
    }
  }, [id, isLoggedIn, setGlobalLoading]); // Add setGlobalLoading to dependencies

  const handleEditClick = () => {
    navigate(`/lessons/${id}/edit`);
  };



  const handleRunExerciseCode = async () => {
    if (!isLoggedIn) {
      setExerciseError('You must be logged in to run code.');
      return;
    }

    setGlobalLoading(true); // Show global loading indicator
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setExerciseError('Authentication token not found. Please log in.');
      setGlobalLoading(false); // Hide loading on auth error
      return;
    }

    setExerciseError(null);
    setExerciseOutput('Running exercise code...');

    try {
      const response = await fetch('http://localhost:8000/execute-code/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${token}`,
        },
        body: JSON.stringify({ 
          code: exerciseCode, 
          language: "python",
          test_code: lesson?.test_code // Send test code if available
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to execute code');
      }

      const result = await response.json();
      setExerciseOutput(result.output);
      if (result.error) {
        setExerciseError(result.error);
      }

      // Check if the code execution was successful (passed tests)
      if (result.status === "success" && lesson?.id) {
        // Call the complete lesson endpoint
        const completeLessonResponse = await fetch(`http://localhost:8000/lessons/${lesson.id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${tokenType} ${token}`,
          },
        });

        if (!completeLessonResponse.ok) {
          const errorData = await completeLessonResponse.json();
          console.error('Failed to mark lesson as complete:', errorData.detail || 'Unknown error');
          // Optionally, show an error to the user that completion failed
        } else {
          setShowCompletionAlert(true);
          setTimeout(() => setShowCompletionAlert(false), 5000); // Hide alert after 5 seconds
        }
      }

    } catch (err: any) {
      setExerciseError(err.message);
      setExerciseOutput('Error during execution.');
    } finally {
      setGlobalLoading(false); // Hide global loading indicator
    }
  };

  const handleResetLessonProgress = async () => {
    if (!isLoggedIn || !lesson?.id) {
      setExerciseError('You must be logged in to reset progress.');
      return;
    }

    setGlobalLoading(true); // Show global loading indicator
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setExerciseError('Authentication token not found. Please log in.');
      setGlobalLoading(false); // Hide loading on auth error
      return;
    }

    setExerciseError(null);

    try {
      const response = await fetch(`http://localhost:8000/lessons/${lesson.id}/complete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `${tokenType} ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reset lesson progress');
      }

      // Optionally, show a success message or update UI
      alert('Lesson progress reset!');
      setShowCompletionAlert(false); // Hide completion alert if it was showing
      setIsLessonCompleted(false); // Hide the reset button

    } catch (err: any) {
      setExerciseError(err.message);
    } finally {
      setGlobalLoading(false); // Hide global loading indicator
    }
  };

  if (loading) {
    return <div>Loading lesson...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!lesson) {
    return <div>Lesson not found.</div>;
  };

  return (
    <div>
      <h1>{lesson.title}</h1>
      {isAdmin && (
        <button className="btn btn-secondary btn-sm mb-3" onClick={handleEditClick}>
          Edit Lesson
        </button>
      )}
      {isLessonCompleted && (
        <button className="btn btn-warning btn-sm mb-3 ms-2" onClick={handleResetLessonProgress}>
          Reset Lesson Progress
        </button>
      )}
      <ReactMarkdown>{lesson.content}</ReactMarkdown>

      {lesson.code_example && (
        <div className="mt-4 mb-5 p-3 border rounded bg-light shadow-sm">
          <h3>Code Example</h3>
          <div style={{ height: '200px', border: '1px solid #ccc' }}>
            <Editor
              height="100%"
              language="python"
              value={lesson.code_example}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />
          </div>
        </div>
      )}

      <hr className="my-5" /> {/* Visual separator */}

      {showCompletionAlert && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          That's correct! Marking lesson as complete!
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setShowCompletionAlert(false)}></button>
        </div>
      )}

      <div className="mt-4 p-3 border rounded bg-light shadow-sm">
        <h3>Your Code Exercise</h3>
        <div style={{ height: '200px', border: '1px solid #ccc' }}>
          <Editor
            height="100%"
            language="python"
            value={exerciseCode}
            onChange={(value) => setExerciseCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </div>
        <button className="btn btn-primary mt-3" onClick={handleRunExerciseCode}>Run Exercise Code</button>
        {exerciseError && <div className="alert alert-danger mt-3" role="alert">{exerciseError}</div>}
        <div className={`mt-3 p-3 border rounded ${exerciseOutput.includes("Tests passed") ? 'bg-success text-white' : 'bg-dark text-white'}`}>
          <h4>Output:</h4>
          <pre>{exerciseOutput}</pre>
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
