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
    <div className="container mt-5">
      <div className="p-5 mb-4 bg-light rounded-3 shadow-sm">
        <div className="container-fluid py-5 text-center">
          <h1 className="display-4 fw-bold text-primary">CodeLearn: Your Self-Hosted Python Journey</h1>
          <p className="fs-5 mt-3">
            Dive into interactive Python lessons with CodeLearn, an open-source and self-hostable web application designed to make learning Python engaging and effective.
          </p>
          <p className="fs-5">
            Inspired by the excellent work at <a href="https://www.boot.dev" target="_blank" rel="noopener noreferrer" className="text-decoration-none text-info fw-bold">boot.dev</a>, CodeLearn provides a structured path to master Python programming, right from your own server.
          </p>
          <hr className="my-4" />
          <p className="lead">
            Start coding, solve challenges, and track your progress. No setup headaches, just pure learning.
          </p>
          <a href="/lessons" className="btn btn-primary btn-lg mt-3">Start Learning Python Now!</a>
        </div>
      </div>

      {message && message !== "Hello from FastAPI backend!" && ( // Display backend message if it's not the default
        <div className="alert alert-info text-center mt-4">
          Backend Status: {message}
        </div>
      )}
      {error && <div className="alert alert-danger text-center mt-4">Error: {error}</div>}

      <div className="row mt-5 text-center">
        <div className="col-md-4">
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title text-primary">Interactive Lessons</h5>
              <p className="card-text">Engage with hands-on coding exercises and immediate feedback.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title text-primary">Self-Hostable</h5>
              <p className="card-text">Own your learning platform. Deploy it anywhere you like.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title text-primary">Open Source</h5>
              <p className="card-text">Contribute, customize, and learn from the community.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );};

export default Home;
