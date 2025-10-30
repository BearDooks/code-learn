import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // Import useAuth hook

interface UserProfile {
  email: string;
  name: string | null; // Add name
  is_admin: boolean;
  lesson_completions: any[]; // Assuming this will be an array of completion objects
}

const Profile: React.FC = () => {
  const { isLoggedIn, setGlobalAlert, setIsLoggedIn, setIsAdmin, setGlobalLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const handleResetAllProgress = async () => {
    if (!window.confirm("Are you sure you want to reset all your lesson progress? This action cannot be undone.")) {
      return;
    }

    setGlobalLoading(true); // Show global loading indicator
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setGlobalAlert('Authentication token not found. Please log in.', "danger");
      setGlobalLoading(false); // Hide loading on auth error
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/users/me/lessons/completed', {
        method: 'DELETE',
        headers: {
          'Authorization': `${tokenType} ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reset all lesson progress');
      }

      setGlobalAlert('All lesson progress reset successfully!', "success");
      window.location.reload();

    } catch (err: any) {
      setGlobalAlert(`Error resetting progress: ${err.message}`, "danger");
    } finally {
      setGlobalLoading(false); // Hide global loading indicator
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setGlobalLoading(true); // Show global loading indicator
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setGlobalAlert('Authentication token not found. Please log in.', "danger");
      setGlobalLoading(false); // Hide loading on auth error
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/users/me', {
        method: 'DELETE',
        headers: {
          'Authorization': `${tokenType} ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete account');
      }

      setGlobalAlert('Account deleted successfully. Redirecting...', "success");
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      setIsLoggedIn(false);
      setIsAdmin(false);
      navigate('/');

    } catch (err: any) {
      setGlobalAlert(`Error deleting account: ${err.message}`, "danger");
    } finally {
      setGlobalLoading(false); // Hide global loading indicator
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      const fetchProfile = async () => {
        setLoading(true);
        setGlobalLoading(true); // Show global loading indicator for profile fetch
        const token = localStorage.getItem('access_token');
        const tokenType = localStorage.getItem('token_type');

        if (!token || !tokenType) {
          setGlobalAlert('Authentication token not found. Please log in.', "danger");
          setLoading(false);
          setGlobalLoading(false); // Hide loading on auth error
          return;
        }

        try {
          const response = await fetch('http://localhost:8000/users/me/', {
            headers: {
              'Authorization': `${tokenType} ${token}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch profile');
          }

          const data: UserProfile = await response.json();
          setUserProfile(data);
        } catch (err: any) {
          setGlobalAlert(`Error fetching profile: ${err.message}`, "danger");
        } finally {
          setLoading(false);
          setGlobalLoading(false); // Hide global loading indicator
        }
      };
      fetchProfile();
    }
  }, [isLoggedIn, setGlobalAlert, setIsLoggedIn, setIsAdmin, navigate, setGlobalLoading]); // Add setGlobalLoading to dependencies

  if (!isLoggedIn) {
    return <div className="alert alert-warning mt-4">Please log in to view your profile.</div>;
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

  if (!userProfile) {
    return <div className="alert alert-info mt-4">No profile data available.</div>;
  }

  const completedLessonsCount = userProfile.lesson_completions ? userProfile.lesson_completions.length : 0;

  return (
    <div className="container mt-4">
      <h1>User Profile</h1>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Welcome, {userProfile.name || userProfile.email}!</h5> {/* Display name or email */}
          <p className="card-text"><strong>Email:</strong> {userProfile.email}</p>
          <p className="card-text"><strong>Role:</strong> {userProfile.is_admin ? 'Admin' : 'User'}</p>
          <p className="card-text"><strong>Lessons Completed:</strong> {completedLessonsCount}</p>
          <button className="btn btn-danger mt-3 me-2" onClick={handleResetAllProgress}>Reset All Lesson Progress</button>
          <button className="btn btn-danger mt-3" onClick={handleDeleteAccount}>Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
