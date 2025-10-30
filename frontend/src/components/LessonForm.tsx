import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../App'; // Import useAuth hook

interface LessonFormProps {
  lessonId?: string; // Optional prop for editing existing lessons
}

const LessonForm: React.FC<LessonFormProps> = () => {
  const { id } = useParams<{ id: string }>(); // Get id from URL for editing
  const isEditing = !!id; // Determine if we are in edit mode

  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [codeExample, setCodeExample] = useState<string>('');
  const [prefillCode, setPrefillCode] = useState<string>(''); // New state for prefill code
  const [testCode, setTestCode] = useState<string>(''); // New state for test code
  // const [error, setError] = useState<string | null>(null); // Replaced by global alert
  // const [success, setSuccess] = useState<string | null>(null); // Replaced by global alert
  const [loading, setLoading] = useState<boolean>(false); // Add loading state
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setGlobalAlert } = useAuth(); // Use useAuth hook

  useEffect(() => {
    if (isEditing && id) {
      setLoading(true); // Set loading to true when fetching
      const token = localStorage.getItem('access_access_token');
      const tokenType = localStorage.getItem('token_type');

      if (!token || !tokenType) {
        setGlobalAlert('You must be logged in to edit a lesson.', "danger");
        navigate('/login');
        setLoading(false);
        return;
      }

      fetch(`${import.meta.env.VITE_API_BASE_URL}/lessons/${id}`, {
        headers: {
          'Authorization': `${tokenType} ${token}`,
        },
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          setTitle(data.title);
          setContent(data.content);
          setCodeExample(data.code_example || '');
          setPrefillCode(data.prefill_code || ''); // Set prefill code
          setTestCode(data.test_code || ''); // Set test code
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching lesson for editing:", err);
          setGlobalAlert(`Error fetching lesson: ${err.message}`, "danger");
          setLoading(false);
        });
    }
  }, [id, isEditing, navigate, setGlobalAlert]); // Add setGlobalAlert to dependencies

  const validateTitle = (title: string) => {
    if (!title) return "Lesson title is required.";
    return null;
  };

  const validateContent = (content: string) => {
    if (!content) return "Lesson content is required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(null); // Replaced by global alert
    // setSuccess(null); // Replaced by global alert
    setTitleError(null);
    setContentError(null);

    const titleValidation = validateTitle(title);
    const contentValidation = validateContent(content);

    if (titleValidation) setTitleError(titleValidation);
    if (contentValidation) setContentError(contentValidation);

    if (titleValidation || contentValidation) {
      setGlobalAlert("Please correct the form errors.", "danger");
      return;
    }

    const token = localStorage.getItem('access_access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setGlobalAlert('You must be logged in to create/edit a lesson.', "danger");
      navigate('/login');
      return;
    }

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${import.meta.env.VITE_API_BASE_URL}/lessons/${id}` : `${import.meta.env.VITE_API_BASE_URL}/lessons/`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, code_example: codeExample, prefill_code: prefillCode, test_code: testCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${isEditing ? 'update' : 'create'} lesson`);
      }

      const lessonData = await response.json();
      setGlobalAlert(`Lesson "${lessonData.title}" ${isEditing ? 'updated' : 'created'} successfully!`, "success");
      if (!isEditing) {
        setTitle('');
        setContent('');
        setCodeExample('');
        setPrefillCode('');
        setTestCode('');
      }
      navigate(`/lessons/${lessonData.id}`);

    } catch (err: any) {
      setGlobalAlert(`Failed to ${isEditing ? 'update' : 'create'} lesson: ${err.message}`, "danger");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>{isEditing ? 'Edit Lesson' : 'Create New Lesson'}</h1>
      {/* Replaced by global alert */}
      {/* {error && <div className="alert alert-danger" role="alert">{error}</div>} */}
      {/* {success && <div className="alert alert-success" role="alert">{success}</div>} */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="lessonTitle" className="form-label">Lesson Title</label>
          <input
            type="text"
            className={`form-control ${titleError ? 'is-invalid' : ''}`}
            id="lessonTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          {titleError && <div className="invalid-feedback">{titleError}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="lessonContent" className="form-label">Lesson Content</label>
          <textarea
            className={`form-control ${contentError ? 'is-invalid' : ''}`}
            id="lessonContent"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
          {contentError && <div className="invalid-feedback">{contentError}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="codeExample" className="form-label">Code Example (Optional)</label>
          <div className="form-text text-muted mb-2">
            Provide a code snippet to illustrate a concept. This code is displayed to the user and is read-only.
          </div>
          <textarea
            className="form-control"
            id="codeExample"
            rows={5}
            value={codeExample}
            onChange={(e) => setCodeExample(e.target.value)}
            placeholder="print('Hello World')"
          ></textarea>
        </div>
        <div className="mb-3">
          <label htmlFor="prefillCode" className="form-label">Exercise Prefill Code (Optional)</label>
          <div className="form-text text-muted mb-2">
            This code will pre-populate the user's editor for the exercise. Use it to provide a starting point or instructions.
            <br />
            Example:
            <pre className="bg-light p-2 rounded"><code># How would you print "This course rocks"?</code></pre>
          </div>
          <textarea
            className="form-control"
            id="prefillCode"
            rows={5}
            value={prefillCode}
            onChange={(e) => setPrefillCode(e.target.value)}
            placeholder="# Write your solution here"
          ></textarea>
        </div>
        <div className="mb-3">
          <label htmlFor="testCode" className="form-label">Exercise Test Code (Optional)</label>
          <div className="form-text text-muted mb-2">
            Python code to test the user's solution. It should raise an `AssertionError` if the solution is incorrect.
            <ul>
              <li>User's printed output is available in the <code>user_printed_output</code> variable.</li>
              <li>To test return values, the user's code should assign the result to <code>_user_return_value_capture</code>. The test code can then access this as <code>user_return_value</code>.</li>
            </ul>
            Examples:
            <pre className="bg-light p-2 rounded"><code># Example for printed output:
expected_output = "This course rocks\n"
assert user_printed_output == expected_output, "Incorrect output!"</code></pre>
            <pre className="bg-light p-2 rounded"><code># Example for return value:
assert user_return_value == 42, "Incorrect return value!"</code></pre>
          </div>
          <textarea
            className="form-control"
            id="testCode"
            rows={5}
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            placeholder="# Write your test code here"
          ></textarea>
        </div>
        <button type="submit" className="btn btn-primary">{isEditing ? 'Update Lesson' : 'Create Lesson'}</button>
      </form>
    </div>
  );
};

export default LessonForm;
