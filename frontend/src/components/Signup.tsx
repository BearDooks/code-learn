import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    if (!email) return "Email is required.";
    if (!/^[\w-.]{1,}@([\w-]+\.)+[\w-]{2,4}$/.test(email)) return "Invalid email format.";
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters long.";
    if (password.length > 72) return "Password cannot be longer than 72 characters.";
    return null;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) return "Confirm password is required.";
    if (confirmPassword !== password) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validateConfirmPassword(confirmPassword, password);

    if (emailValidation) setEmailError(emailValidation);
    if (passwordValidation) setPasswordError(passwordValidation);
    if (confirmPasswordValidation) setConfirmPasswordError(confirmPasswordValidation);

    if (emailValidation || passwordValidation || confirmPasswordValidation) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to register');
      }

      alert('Registration successful! Please log in.');
      navigate('/login');

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Sign Up</h1>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
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
        <div className="mb-3">
          <label htmlFor="confirmPasswordInput" className="form-label">Confirm Password</label>
          <input
            type="password"
            className={`form-control ${confirmPasswordError ? 'is-invalid' : ''}`}
            id="confirmPasswordInput"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {confirmPasswordError && <div className="invalid-feedback">{confirmPasswordError}</div>}
        </div>
        <button type="submit" className="btn btn-primary">Sign Up</button>
      </form>
    </div>
  );
};

export default Signup;
