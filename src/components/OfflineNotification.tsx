import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import './OfflineNotification.css';

const OfflineNotification: React.FC = () => {
  const { isOnline } = useSelector((state: RootState) => state.connection);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    // Show notification when connection status changes
    if (!isOnline) {
      setNotificationMessage('Соединение с интернетом потеряно. Некоторые функции могут быть недоступны.');
      setShowNotification(true);
    } else {
      setNotificationMessage('Соединение с интернетом восстановлено.');
      setShowNotification(true);
    }

    // Auto-hide notification after 4 seconds
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [isOnline]);

  if (!showNotification) {
    return null;
  }

  return (
    <div className={`offline-notification ${isOnline ? 'online' : 'offline'}`}>
      <div className="notification-content">
        <span className="notification-icon">
          {isOnline ? '🟢' : '🔴'}
        </span>
        <span className="notification-text">{notificationMessage}</span>
        <button 
          className="notification-close"
          onClick={() => setShowNotification(false)}
          aria-label="Закрыть уведомление"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default OfflineNotification;
