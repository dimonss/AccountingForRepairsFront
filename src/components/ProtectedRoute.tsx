import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import LoginForm from './LoginForm';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'manager' | 'employee';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // If not authenticated, show login form
  if (!isAuthenticated || !user) {
    return <LoginForm />;
  }

  // If role is required and user doesn't have it, show access denied
  if (requiredRole) {
    const roleHierarchy = { admin: 3, manager: 2, employee: 1 };
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return (
        <div className="access-denied">
          <div className="access-denied-card">
            <h2>🚫 Доступ Запрещён</h2>
            <p>У вас нет разрешения на доступ к этому ресурсу.</p>
            <p>Требуемая роль: <strong>{requiredRole}</strong></p>
            <p>Ваша роль: <strong>{user.role}</strong></p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 