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
      setError('Пожалуйста, введите имя пользователя и пароль');
      return;
    }

    try {
      const result = await login({ username, password }).unwrap();
      
      if (result.success && result.data) {
        dispatch(setCredentials({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          user: result.data.user
        }));
        onSuccess?.();
      } else {
        setError(result.error || 'Ошибка входа');
      }
    } catch (err: unknown) {
      let errorMessage = 'Ошибка входа. Попробуйте снова.';
      
      if (err && typeof err === 'object' && 'data' in err) {
        const errorData = (err as { data: unknown }).data;
        if (errorData && typeof errorData === 'object' && 'error' in errorData) {
          const error = (errorData as { error?: string }).error;
          if (error) {
            errorMessage = error;
          }
        }
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔒 Система Ремонтов</h1>
          <p>Войдите в систему управления ремонтами</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Имя пользователя или Email</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя или email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="login-footer">
          <p>🔐 Безопасный доступ к конфиденциальным данным ремонтов</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 