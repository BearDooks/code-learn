import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

interface Lesson {
  id: number;
  title: string;
  content: string;
  code_example: string | null;
  prefill_code: string | null;
  test_code: string | null;
}

const LessonManagement: React.FC = () => {
  const { isLoggedIn, isAdmin, setGlobalAlert, setGlobalLoading } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchLessons = async () => {
    setLoading(true);
    setGlobalLoading(true);
    setError(null);
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setGlobalAlert('Authentication token not found. Please log in.', "danger");
      setLoading(false);
      setGlobalLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lessons/`, {
        headers: {
          'Authorization': `${tokenType} ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch lessons');
      }

      const data: Lesson[] = await response.json();
      setLessons(data);
    } catch (err: any) {
      setGlobalAlert(`Error fetching lessons: ${err.message}`, "danger");
      setError(err.message);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchLessons();
    } else if (!isAdmin) {
      setGlobalAlert('You do not have administrative privileges to view this page.', "danger");
      navigate('/'); // Redirect non-admins
    } else if (!isLoggedIn) {
      setGlobalAlert('Please log in to view this page.', "warning");
      navigate('/login');
    }
  }, [isLoggedIn, isAdmin, navigate, setGlobalAlert, setGlobalLoading]);

  const handleDeleteLesson = async (lessonId: number) => {
    if (!window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    setGlobalLoading(true);
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setGlobalAlert('Authentication token not found. Please log in.', "danger");
      setGlobalLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `${tokenType} ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete lesson');
      }

      setGlobalAlert('Lesson deleted successfully!', "success");
      fetchLessons(); // Refresh the list
    } catch (err: any) {
      setGlobalAlert(`Error deleting lesson: ${err.message}`, "danger");
    } finally {
      setGlobalLoading(false);
    }
  };

  if (!isLoggedIn || !isAdmin) {
    return null; // Redirect handled in useEffect
  }

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
    <div className="container mt-4">
      <h1>Lesson Management</h1>
      <Link to="/lessons/new" className="btn btn-success mb-3">Create New Lesson</Link>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {lessons.length > 0 ? (
            lessons.map(lesson => (
              <tr key={lesson.id}>
                <td>{lesson.id}</td>
                <td>{lesson.title}</td>
                <td>
                  <Link to={`/lessons/${lesson.id}/edit`} className="btn btn-sm btn-info me-2">Edit</Link>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteLesson(lesson.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="text-center">No lessons available. Click "Create New Lesson" to add some.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LessonManagement;
