import React, { useEffect, useState } from 'react';

const Home: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/') // Assuming backend runs on port 8000
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setMessage(data.message);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching from backend:', err);
        setError('Failed to connect to backend.');
        setLoading(false);
      });
  }, []);

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
      <h1>Home Page</h1>
      <p>{message}</p>
      <p>Welcome to the interactive coding web application!</p>
      <p>Navigate through the lessons or try out the code editor.</p>
    </div>
  );
};

export default Home;
