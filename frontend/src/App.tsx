import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import './App.css';
import LessonsList from './components/LessonsList';
import LessonDetail from './components/LessonDetail';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Home from './components/Home';
import LessonForm from './components/LessonForm';
import UserManagement from './components/UserManagement';
import LessonManagement from './components/LessonManagement';
import AdminDashboard from './components/AdminDashboard'; // Import AdminDashboard

interface Lesson {
  id: number;
  title: string;
  content: string;
  code_example: string | null;
  prefill_code: string | null;
  test_code: string | null;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setIsAdmin: (admin: boolean) => void;
  globalMessage: string | null;
  globalMessageType: 'success' | 'danger' | 'info' | 'warning';
  setGlobalAlert: (message: string, type: 'success' | 'danger' | 'info' | 'warning') => void;
  isLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  allLessons: Lesson[]; // Add allLessons to context
  setAllLessons: (lessons: Lesson[]) => void; // Add setAllLessons to context
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
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [globalMessageType, setGlobalMessageType] = useState<'success' | 'danger' | 'info' | 'warning'>('info');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]); // State to hold all lessons

  const setGlobalAlert = React.useCallback((message: string, type: 'success' | 'danger' | 'info' | 'warning') => {
    setGlobalMessage(message);
    setGlobalMessageType(type);
    setTimeout(() => setGlobalMessage(null), 5000); // Hide after 5 seconds
  }, [setGlobalMessage, setGlobalMessageType]);

  const setGlobalLoading = React.useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const fetchUserStatus = async () => {
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (token && tokenType) {
      try {
        const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/users/me/', {
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
    }
    else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    fetchUserStatus();

    const fetchAllLessons = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/lessons/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Lesson[] = await response.json();
        setAllLessons(data);
      } catch (err) {
        console.error("Error fetching all lessons in App.tsx:", err);
      }
    };

    fetchAllLessons();

    const handleStorageChange = () => {
      fetchUserStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, setIsLoggedIn, setIsAdmin, globalMessage, globalMessageType, setGlobalAlert, isLoading, setGlobalLoading, allLessons, setAllLessons }}>
      <Router>
        <div className="d-flex flex-column min-vh-100"> {/* Added flexbox for sticky footer */}
          <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
              <Link className="navbar-brand fw-bold text-primary" to="/">CodeLearn</Link>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/">Home</NavLink>
                  </li>
                  {isLoggedIn && (
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/lessons">Lessons</NavLink>
                    </li>
                  )}
                  {isLoggedIn && isAdmin && (
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/admin">Admin Dashboard</NavLink>
                    </li>
                  )}
                </ul>
                <ul className="navbar-nav">
                  {!isLoggedIn && (
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/login">Login</NavLink>
                    </li>
                  )}
                  {!isLoggedIn && (
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/signup">Sign Up</NavLink>
                    </li>
                  )}
                  {isLoggedIn && (
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/profile">Profile</NavLink>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </nav>

          {globalMessage && (
            <div className={`alert alert-${globalMessageType} alert-dismissible fade show`} role="alert">
              {globalMessage}
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setGlobalMessage(null)}></button>
            </div>
          )}

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
              
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
              <Route path="/admin/lessons" element={<ProtectedRoute adminOnly><LessonManagement /></ProtectedRoute>} />

              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Routes>
          </div>

          {isLoading && (
            <div className="d-flex justify-content-center align-items-center" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

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
