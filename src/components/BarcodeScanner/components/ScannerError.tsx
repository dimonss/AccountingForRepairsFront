import React from 'react'
import type { IScannerError } from '../interfaces/IScannerService'

interface ScannerErrorProps {
  error: IScannerError
  onRetry: () => void
  onCancel: () => void
}

export const ScannerError: React.FC<ScannerErrorProps> = ({ error, onRetry, onCancel }) => {
  return (
    <div className="scanner-error">
      <div className="error-icon">📷</div>
      <p className="error-message">{error.message}</p>
      <div className="error-actions">
        {error.isRecoverable && (
          <button 
            className="retry-btn"
            onClick={onRetry}
          >
            Повторить
          </button>
        )}
        <button 
          className="cancel-btn"
          onClick={onCancel}
        >
          Отмена
        </button>
      </div>
    </div>
  )
} 