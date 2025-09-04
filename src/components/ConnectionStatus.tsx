import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import './ConnectionStatus.css';

const ConnectionStatus: React.FC = () => {
  const { isOnline, connectionQuality } = useSelector((state: RootState) => state.connection);

  const getStatusIcon = () => {
    if (!isOnline) {
      return '🔴'; // Red circle for offline
    }
    
    switch (connectionQuality) {
      case 'good':
        return '🟢'; // Green circle for good connection
      case 'poor':
        return '🟡'; // Yellow circle for poor connection
      default:
        return '🟢'; // Default to green when online
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Оффлайн';
    }
    
    switch (connectionQuality) {
      case 'good':
        return 'Онлайн';
      case 'poor':
        return 'Медленное соединение';
      default:
        return 'Онлайн';
    }
  };

  const getStatusClass = () => {
    if (!isOnline) {
      return 'connection-status offline';
    }
    
    switch (connectionQuality) {
      case 'good':
        return 'connection-status online good';
      case 'poor':
        return 'connection-status online poor';
      default:
        return 'connection-status online';
    }
  };

  return (
    <div className={getStatusClass()} title={getStatusText()}>
      <span className="connection-icon">{getStatusIcon()}</span>
      <span className="connection-text">{getStatusText()}</span>
    </div>
  );
};

export default ConnectionStatus;
