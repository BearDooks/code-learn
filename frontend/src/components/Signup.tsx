import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // Import useAuth hook

const Signup: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>(''); // New state for name
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setGlobalAlert, setGlobalLoading } = useAuth(); // Use useAuth hook

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
    setGlobalLoading(true); // Show global loading indicator
    // Clear local errors, global errors will be handled by setGlobalAlert
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
      setGlobalAlert("Please correct the form errors.", "danger");
      setGlobalLoading(false); // Hide loading on form errors
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }), // Include name in the body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to register');
      }

      setGlobalAlert('Registration successful! Please log in.', "success"); // Use global alert
      setTimeout(() => {
        navigate('/login'); // Redirect after a short delay
      }, 2000); // 2 seconds delay

    } catch (err: any) {
      setGlobalAlert(`Registration failed: ${err.message}`, "danger"); // Use global alert
    } finally {
      setGlobalLoading(false); // Hide global loading indicator
    }
  };

  return (
    <div>
      <h1>Sign Up</h1>
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
          <label htmlFor="nameInput" className="form-label">Name</label> {/* New input field */}
          <input
            type="text"
            className="form-control"
            id="nameInput"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
