import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import LessonsList from './components/LessonsList';
import LessonDetail from './components/LessonDetail';
import CodeEditor from './components/CodeEditor';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Home from './components/Home';
import LessonForm from './components/LessonForm';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setIsAdmin: (admin: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isLoggedIn, isAdmin } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const fetchUserStatus = async () => {
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (token && tokenType) {
      try {
        const response = await fetch('http://localhost:8000/users/me/', {
          method: 'GET',
          headers: {
            'Authorization': `${tokenType} ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setIsLoggedIn(true);
          setIsAdmin(userData.is_admin);
        } else {
          // Token might be expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('token_type');
          setIsLoggedIn(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error fetching user status:", error);
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    fetchUserStatus();

    const handleStorageChange = () => {
      fetchUserStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, setIsLoggedIn, setIsAdmin }}>
      <Router>
        <div className="d-flex flex-column min-vh-100"> {/* Added flexbox for sticky footer */}
          <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
              <Link className="navbar-brand" to="/">CodeLearn</Link>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <Link className="nav-link" to="/">Home</Link>
                  </li>
                  {isLoggedIn && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/lessons">Lessons</Link>
                    </li>
                  )}
                  {isLoggedIn && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/editor">Code Editor</Link>
                    </li>
                  )}
                  {isLoggedIn && isAdmin && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/lessons/new">Create Lesson</Link>
                    </li>
                  )}
                </ul>
                <ul className="navbar-nav">
                  {!isLoggedIn && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/login">Login</Link>
                    </li>
                  )}
                  {!isLoggedIn && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/signup">Sign Up</Link>
                    </li>
                  )}
                  {isLoggedIn && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/profile">Profile</Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </nav>

          <div className="flex-grow-1 container mt-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route path="/lessons" element={<ProtectedRoute><LessonsList /></ProtectedRoute>} />
              <Route path="/lessons/:id" element={<ProtectedRoute><LessonDetail /></ProtectedRoute>} />
              <Route path="/lessons/new" element={<ProtectedRoute adminOnly><LessonForm /></ProtectedRoute>} />
              <Route path="/lessons/:id/edit" element={<ProtectedRoute adminOnly><LessonForm /></ProtectedRoute>} />
              <Route path="/editor" element={<ProtectedRoute><CodeEditor /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Routes>
          </div>

          <footer className="bg-light text-center text-lg-start mt-auto py-3">
            <div className="text-center p-3">
              &copy; {new Date().getFullYear()} CodeLearn. All rights reserved.
            </div>
          </footer>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
