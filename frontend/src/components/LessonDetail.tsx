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
  const { isAdmin, isLoggedIn } = useAuth(); // Use useAuth hook

  const [exerciseCode, setExerciseCode] = useState<string>(''); // Initialize with empty string
  const [exerciseOutput, setExerciseOutput] = useState<string>('Output will appear here.');
  const [exerciseError, setExerciseError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
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
        })
        .catch(error => {
          console.error("Error fetching lesson:", error);
          setError(error.message);
          setLoading(false);
        });
    }
  }, [id]);

  const handleEditClick = () => {
    navigate(`/lessons/${id}/edit`);
  };



  const handleRunExerciseCode = async () => {
    if (!isLoggedIn) {
      setExerciseError('You must be logged in to run code.');
      return;
    }

    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setExerciseError('Authentication token not found. Please log in.');
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
          console.log('Lesson marked as complete!');
          // Optionally, show a success message to the user
          // You might want to update the UI to reflect completion, e.g., a "Completed" badge
        }
      }

    } catch (err: any) {
      setExerciseError(err.message);
      setExerciseOutput('Error during execution.');
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
