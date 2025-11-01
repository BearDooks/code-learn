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
  const { isAdmin, isLoggedIn, setGlobalLoading, allLessons, user, setGlobalAlert } = useAuth(); // Use useAuth hook and get allLessons and user, and setGlobalAlert

  const [exerciseCode, setExerciseCode] = useState<string>(''); // Initialize with empty string
  const [exerciseOutput, setExerciseOutput] = useState<string>('Output will appear here.');
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [linterFeedback, setLinterFeedback] = useState<string | null>(null); // New state for linter feedback
  const [showCompletionAlert, setShowCompletionAlert] = useState<boolean>(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);
  const [userNotes, setUserNotes] = useState<string>(''); // New state for user notes
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false); // New state for bookmark

  useEffect(() => {
    setGlobalLoading(true); // Show global loading indicator at the very beginning

    const fetchLessonDetails = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lessons/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Lesson = await response.json();
        setLesson(data);
        setExerciseCode(data.prefill_code || ''); // Set prefill code, default to empty string
        setLoading(false);

        if (isLoggedIn && data.id && user) {
          const token = localStorage.getItem('access_token');
          const tokenType = localStorage.getItem('token_type');

          if (token && tokenType) {
            // Fetch user's completion status and last attempted code
            fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/lessons/${id}/code`, {
              headers: {
                'Authorization': `${tokenType} ${token}`,
              },
            })
            .then(response => response.json())
            .then(async (completionData: any) => { // Use any for now, will define schema later
              if (completionData) {
                setIsLessonCompleted(completionData.status === "completed");
                if (completionData.last_attempted_code) {
                  setExerciseCode(completionData.last_attempted_code);
                }
                setUserNotes(completionData.notes || ''); // Set user notes
                setIsBookmarked(completionData.bookmarked || false); // Set bookmark status
              } else {
                // If no completion record exists, send 'started' status
                try {
                  await fetch(`${import.meta.env.VITE_API_BASE_URL}/lessons/${id}/start`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `${tokenType} ${token}`,
                    },
                    body: JSON.stringify({ user_id: user.id, lesson_id: data.id }),
                  });
                } catch (err) {
                  console.error("Error sending started status:", err);
                }
              }
            })
            .catch(err => console.error("Error fetching user lesson completion:", err));
          }
        }
      } catch (error: any) {
        console.error("Error fetching lesson:", error);
        setError(error.message);
        setLoading(false);
      } finally {
        setGlobalLoading(false); // Hide global loading indicator after all fetches are done
      }
    };

    fetchLessonDetails();

  }, [id, isLoggedIn, setGlobalLoading, user]); // Add user to dependencies

  const handleEditClick = () => {
    navigate(`/lessons/${id}/edit`);
  };

  const currentLessonIndex = allLessons.findIndex(lesson => lesson.id === Number(id));
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const handlePreviousLesson = () => {
    if (previousLesson) {
      navigate(`/lessons/${previousLesson.id}`);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      navigate(`/lessons/${nextLesson.id}`);
    }
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/execute-code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${token}`,
        },
        body: JSON.stringify({ 
          lesson_id: lesson?.id, // Include lesson_id
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
      setLinterFeedback(result.linter_output || null); // Set linter feedback
      if (result.error) {
        setExerciseError(result.error);
      } else {
        setExerciseError(null); // Clear exercise error if no error
      }

              // Check if the code execution was successful (passed tests)
            if (result.status === "success" && lesson?.id && user) {
              // Call the complete lesson endpoint
              const completeLessonResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lessons/${lesson.id}/completion`, {
                method: 'PUT', // Changed to PUT
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `${tokenType} ${token}`,
                },
                body: JSON.stringify({
                  user_id: user.id,
                  lesson_id: lesson.id,
                  last_attempted_code: exerciseCode,
                  status: "completed", // Set status to completed
                  notes: userNotes, // Include notes
                  bookmarked: isBookmarked, // Include bookmark status
                }),
              });
        if (!completeLessonResponse.ok) {
          const errorData = await completeLessonResponse.json();
          console.error('Failed to mark lesson as complete:', errorData.detail || 'Unknown error');
          // Optionally, show an error to the user that completion failed
        } else {
          setShowCompletionAlert(true);
          setIsLessonCompleted(true); // Mark lesson as completed
          setTimeout(() => setShowCompletionAlert(false), 5000); // Hide alert after 5 seconds

          // Re-fetch completion data to update notes and bookmark status
          const token = localStorage.getItem('access_token');
          const tokenType = localStorage.getItem('token_type');
          if (token && tokenType) {
            fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/lessons/${lesson.id}/code`, {
              headers: {
                'Authorization': `${tokenType} ${token}`,
              },
            })
            .then(response => response.json())
            .then((updatedCompletionData: any) => {
              if (updatedCompletionData) {
                setUserNotes(updatedCompletionData.notes || '');
                setIsBookmarked(updatedCompletionData.bookmarked || false);
              }
            })
            .catch(err => console.error("Error re-fetching user lesson completion after update:", err));
          }
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lessons/${lesson.id}/completion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${token}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          lesson_id: lesson.id,
          last_attempted_code: lesson.prefill_code || '# Write your solution here',
          status: "started",
          notes: userNotes,
          bookmarked: isBookmarked,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reset lesson progress');
      }

      // Optionally, show a success message or update UI
      setGlobalAlert('Lesson progress reset!', 'success'); // Use global alert
      setShowCompletionAlert(false); // Hide completion alert if it was showing
      setIsLessonCompleted(false); // Hide the reset button
      setExerciseCode(lesson.prefill_code || ''); // Reset code in editor, default to empty string

    } catch (err: any) {
      setExerciseError(err.message);
    } finally {
      setGlobalLoading(false); // Hide global loading indicator
    }
  };

  const handleSaveNotes = async () => {
    if (!isLoggedIn || !lesson?.id || !user) return;

    setGlobalLoading(true);
    setExerciseError(null); // Clear any previous exercise error
    setLinterFeedback(null); // Clear any previous linter feedback
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setExerciseError('Authentication token not found. Please log in.');
      setGlobalLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lessons/${lesson.id}/completion`, {
        method: 'PUT', // Use PUT for updating
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          lesson_id: lesson.id,
          status: isLessonCompleted ? "completed" : "started", // Maintain current completion status
          last_attempted_code: exerciseCode, // Maintain current code
          notes: userNotes, // Send updated notes
          bookmarked: isBookmarked, // Maintain current bookmark status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save notes');
      }
      setGlobalAlert('Notes saved successfully!', 'success'); // Use global alert
    } catch (err: any) {
      console.error("Error saving notes:", err);
      setGlobalAlert(`Error saving notes: ${err.message}`, 'danger'); // Use global alert
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!isLoggedIn || !lesson?.id || !user) return;

    setGlobalLoading(true);
    setExerciseError(null); // Clear any previous exercise error
    setLinterFeedback(null); // Clear any previous linter feedback
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setExerciseError('Authentication token not found. Please log in.');
      setGlobalLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lessons/${lesson.id}/completion`, {
        method: 'PUT', // Use PUT for updating
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          lesson_id: lesson.id,
          status: isLessonCompleted ? "completed" : "started", // Maintain current completion status
          last_attempted_code: exerciseCode, // Maintain current code
          notes: userNotes, // Maintain current notes
          bookmarked: !isBookmarked, // Toggle bookmark status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to toggle bookmark');
      }
      setIsBookmarked(!isBookmarked); // Update local state on success
      setGlobalAlert(`Lesson ${!isBookmarked ? 'bookmarked' : 'unbookmarked'} successfully!`, 'success'); // Use global alert
    } catch (err: any) {
      console.error("Error toggling bookmark:", err);
      setGlobalAlert(`Error toggling bookmark: ${err.message}`, 'danger'); // Use global alert
    } finally {
      setGlobalLoading(false);
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

      {isLoggedIn && (
        <div className="mt-4 p-3 border rounded bg-light shadow-sm">
          <h3>Your Notes</h3>
          <textarea
            className="form-control mb-3"
            rows={5}
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Write your personal notes about this lesson here..."
          ></textarea>
          <button className="btn btn-primary me-2" onClick={handleSaveNotes}>Save Notes</button>
          <button
            className={`btn ${isBookmarked ? 'btn-warning' : 'btn-outline-warning'}`}
            onClick={handleToggleBookmark}
          >
            {isBookmarked ? 'Bookmarked' : 'Bookmark Lesson'}
          </button>
        </div>
      )}

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
        <button className="btn btn-secondary mt-3 ms-2" onClick={() => setExerciseCode(lesson?.prefill_code || '')}>Reset Code</button>
        {exerciseError && <div className="alert alert-danger mt-3" role="alert">{exerciseError}</div>}
        {linterFeedback && ( // Display linter feedback
          <div className="alert alert-warning mt-3" role="alert">
            <h4>Linter Feedback:</h4>
            <pre>{linterFeedback}</pre>
          </div>
        )}
        <div className={`mt-3 p-3 border rounded ${exerciseOutput.includes("Tests passed") ? 'bg-success text-white' : 'bg-dark text-white'}`}>
          <h4>Output:</h4>
          <pre>{exerciseOutput}</pre>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        {previousLesson && (
          <button className="btn btn-secondary" onClick={handlePreviousLesson}>
            &larr; {previousLesson.title}
          </button>
        )}
        {nextLesson && (
          <button className="btn btn-primary ms-auto" onClick={handleNextLesson}>
            {nextLesson.title} &rarr;
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonDetail;
