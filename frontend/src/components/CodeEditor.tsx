import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useAuth } from '../App'; // Import useAuth hook

interface CodeEditorProps {
  lessonId: number;
  prefillCode: string;
  testCode: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ lessonId, prefillCode, testCode }) => {
  const [code, setCode] = useState<string>(prefillCode || '# Write your code here');
  const [output, setOutput] = useState<string>('Your code output will appear here.');
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();

  function handleEditorChange(value: string | undefined) {
    setCode(value || '');
  }

  const handleRunCode = async () => {
    if (!isLoggedIn) {
      setError('You must be logged in to run code.');
      return;
    }

    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setError('Authentication token not found. Please log in.');
      return;
    }

    setError(null);
    setOutput('Running code...');

    try {
      const executeResponse = await fetch('http://localhost:8000/execute-code/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${token}`,
        },
        body: JSON.stringify({ code: code, language: "python", test_code: testCode }), // Include testCode
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json();
        throw new Error(errorData.detail || 'Failed to execute code');
      }

      const result = await executeResponse.json();
      setOutput(result.output);
      if (result.error) {
        setError(result.error);
      }

      // Check if the code execution was successful (passed tests)
      if (result.status === "success") {
        // Call the complete lesson endpoint
        const completeLessonResponse = await fetch(`http://localhost:8000/lessons/${lessonId}/complete`, {
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
        }
      }

    } catch (err: any) {
      setError(err.message);
      setOutput('Error during execution.');
    }
  };

  return (
    <div>
      <h1>Code Editor</h1>
      <div style={{ height: '400px', border: '1px solid #ccc' }}>
        <Editor
          height="100%"
          language="python"
          defaultValue="// some comment"
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 16,
          }}
        />
      </div>
      <button className="btn btn-primary mt-3" onClick={handleRunCode}>Run Code</button>
      {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
      <div className="mt-3 p-3 border rounded bg-dark text-white">
        <h3>Output:</h3>
        <pre>{output}</pre>
      </div>
    </div>
  );
};

export default CodeEditor;
