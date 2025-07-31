import { useState } from 'react';
import { useGetSessionsQuery, useRevokeSessionMutation, useLogoutAllMutation } from '../store/api/authApi';
import Modal from './Modal';

const SessionsManager = () => {
  const { data: sessionsResponse, isLoading, error } = useGetSessionsQuery();
  const [revokeSession] = useRevokeSessionMutation();
  const [logoutAll] = useLogoutAllMutation();
  
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<number | null>(null);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);

  const sessions = sessionsResponse?.data || [];

  const handleRevokeClick = (sessionId: number) => {
    setSessionToRevoke(sessionId);
    setShowRevokeModal(true);
  };

  const handleConfirmRevoke = async () => {
    if (!sessionToRevoke) return;
    
    try {
      await revokeSession(sessionToRevoke).unwrap();
      setShowRevokeModal(false);
      setSessionToRevoke(null);
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const handleCancelRevoke = () => {
    setShowRevokeModal(false);
    setSessionToRevoke(null);
  };

  const handleLogoutAllClick = () => {
    setShowLogoutAllModal(true);
  };

  const handleConfirmLogoutAll = async () => {
    try {
      await logoutAll().unwrap();
      setShowLogoutAllModal(false);
    } catch (error) {
      console.error('Failed to logout from all devices:', error);
    }
  };

  const handleCancelLogoutAll = () => {
    setShowLogoutAllModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatUserAgent = (userAgent: string) => {
    if (!userAgent) return 'Неизвестно';
    
    // Simple user agent parsing
    if (userAgent.includes('Chrome')) return '🌐 Chrome';
    if (userAgent.includes('Firefox')) return '🦊 Firefox';
    if (userAgent.includes('Safari')) return '🧭 Safari';
    if (userAgent.includes('Edge')) return '📘 Edge';
    
    return '🌐 Браузер';
  };

  if (isLoading) return <div className="loading">Загрузка сессий...</div>;
  if (error) return <div className="error">Ошибка загрузки сессий</div>;

  return (
    <div className="sessions-manager">
      <div className="sessions-header">
        <h2>Активные Сессии</h2>
        <p>Управляйте устройствами, на которых вы вошли в систему</p>
        {sessions.length > 1 && (
          <button 
            className="logout-all-btn"
            onClick={handleLogoutAllClick}
          >
            Выйти со всех устройств
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="no-sessions">Активные сессии не найдены</p>
      ) : (
        <div className="sessions-list">
          {sessions.map((session) => (
            <div key={session.id} className="session-card">
              <div className="session-info">
                <div className="session-device">
                  <span className="device-icon">{formatUserAgent(session.user_agent)}</span>
                  <div className="device-details">
                    <p><strong>IP адрес:</strong> {session.ip_address || 'Неизвестно'}</p>
                    <p><strong>Создана:</strong> {formatDate(session.created_at)}</p>
                    <p><strong>Последняя активность:</strong> {formatDate(session.last_used_at)}</p>
                  </div>
                </div>
              </div>
              
              <div className="session-actions">
                <button 
                  className="revoke-session-btn"
                  onClick={() => handleRevokeClick(session.id)}
                >
                  Отозвать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revoke Session Modal */}
      <Modal 
        isOpen={showRevokeModal} 
        onClose={handleCancelRevoke}
        title="Подтверждение отзыва сессии"
      >
        <div className="revoke-confirmation">
          <p>Вы уверены, что хотите отозвать эту сессию?</p>
          <p>Пользователь будет выйден из системы на этом устройстве.</p>
          
          <div className="modal-actions">
            <button 
              className="cancel-btn"
              onClick={handleCancelRevoke}
            >
              Отмена
            </button>
            <button 
              className="confirm-revoke-btn"
              onClick={handleConfirmRevoke}
            >
              Отозвать
            </button>
          </div>
        </div>
      </Modal>

      {/* Logout All Modal */}
      <Modal 
        isOpen={showLogoutAllModal} 
        onClose={handleCancelLogoutAll}
        title="Подтверждение выхода со всех устройств"
      >
        <div className="logout-all-confirmation">
          <p>Вы уверены, что хотите выйти со всех устройств?</p>
          <p>Все активные сессии будут завершены, и вам потребуется войти заново на всех устройствах.</p>
          
          <div className="modal-actions">
            <button 
              className="cancel-btn"
              onClick={handleCancelLogoutAll}
            >
              Отмена
            </button>
            <button 
              className="confirm-logout-all-btn"
              onClick={handleConfirmLogoutAll}
            >
              Выйти со всех
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SessionsManager; 