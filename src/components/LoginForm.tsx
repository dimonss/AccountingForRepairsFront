import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../store/api/authApi';
import { setCredentials } from '../store/authSlice';
import './LoginForm.css';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const result = await login({ username, password }).unwrap();
      
      if (result.success) {
        dispatch(setCredentials(result.data));
        onSuccess?.();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔒 Repairs System</h1>
          <p>Sign in to access the repair management system</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username or email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>🔐 Secure access to confidential repair data</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 