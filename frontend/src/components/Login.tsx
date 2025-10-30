import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // Import useAuth hook

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setIsLoggedIn, setIsAdmin, setGlobalAlert, setGlobalLoading } = useAuth(); // Use useAuth hook

  const validateEmail = (email: string) => {
    if (!email) return "Email is required.";
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) return "Invalid email format.";
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true); // Show global loading indicator
    // Clear local errors, global errors will be handled by setGlobalAlert
    setEmailError(null);
    setPasswordError(null);

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (emailValidation) setEmailError(emailValidation);
    if (passwordValidation) setPasswordError(passwordValidation);

    if (emailValidation || passwordValidation) {
      setGlobalAlert("Please correct the form errors.", "danger");
      setGlobalLoading(false); // Hide loading on form errors
      return;
    }

    const form_data = new URLSearchParams();
    form_data.append("username", email);
    form_data.append("password", password);

    try {
      const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form_data.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to login');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_type', data.token_type);

      // Fetch user details to get admin status
      const userResponse = await fetch('http://localhost:8000/users/me/', {
        method: 'GET',
        headers: {
          'Authorization': `${data.token_type} ${data.access_token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setIsLoggedIn(true);
        setIsAdmin(userData.is_admin);
        setGlobalAlert(`Welcome back, ${userData.name || userData.email}!`, "success");
      } else {
        // Fallback if user details can't be fetched
        setIsLoggedIn(true);
        setIsAdmin(false);
        setGlobalAlert("Logged in, but could not fetch user details.", "warning");
      }

      navigate('/profile'); // Redirect to profile page or dashboard

    } catch (err: any) {
      setGlobalAlert(`Login failed: ${err.message}`, "danger");
    } finally {
      setGlobalLoading(false); // Hide global loading indicator
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="emailInput" className="form-label">Email address</label>
          <input
            type="email"
            className={`form-control ${emailError ? 'is-invalid' : ''}`}
            id="emailInput"
            aria-describedby="emailHelp"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {emailError && <div className="invalid-feedback">{emailError}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="passwordInput" className="form-label">Password</label>
          <input
            type="password"
            className={`form-control ${passwordError ? 'is-invalid' : ''}`}
            id="passwordInput"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {passwordError && <div className="invalid-feedback">{passwordError}</div>}
        </div>
        <button type="submit" className="btn btn-primary">Submit</button>
      </form>
    </div>
  );
};

export default Login;
