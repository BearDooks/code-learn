import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // Import useAuth hook

interface UserProfile {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setIsLoggedIn, setIsAdmin } = useAuth(); // Use useAuth hook

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');

      if (!token || !tokenType) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        navigate('/login'); // Redirect to login if no token
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/users/me/', {
          method: 'GET',
          headers: {
            'Authorization': `${tokenType} ${token}`,
          },
        });

        if (!response.ok) {
          // If token is invalid or expired, clear it and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('token_type');
          setIsLoggedIn(false);
          setIsAdmin(false);
          navigate('/login');
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: UserProfile = await response.json();
        setUser(data);
        setIsLoggedIn(true);
        setIsAdmin(data.is_admin);
        setLoading(false);

      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    };

    fetchProfile();
  }, [navigate, setIsLoggedIn, setIsAdmin]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate('/login');
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>No user data found. Please log in.</div>;
  }

  return (
    <div className="p-3">
      <h1>User Profile</h1>
      <div className="card shadow-sm mt-4">
        <div className="card-body">
          <h5 className="card-title">Email: {user.email}</h5>
          <p className="card-text">User ID: {user.id}</p>
          <p className="card-text">Status: {user.is_active ? 'Active' : 'Inactive'}</p>
          <p className="card-text">Admin: {user.is_admin ? 'Yes' : 'No'}</p>
        </div>
      </div>
      <button className="btn btn-danger mt-3" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Profile;
