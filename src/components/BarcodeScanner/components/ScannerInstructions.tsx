import React from 'react'
import type { ScanStatus } from '../hooks/useScannerState'

interface ScannerInstructionsProps {
  scanStatus: ScanStatus
}

export const ScannerInstructions: React.FC<ScannerInstructionsProps> = ({ scanStatus }) => {
  const getStatusText = () => {
    switch (scanStatus) {
      case 'searching':
        return '🔍 Поиск кода...'
      case 'found':
        return '✅ Код найден!'
      case 'error':
        return '❌ Ошибка сканирования'
      default:
        return ''
    }
  }

  const getStatusClassName = () => {
    switch (scanStatus) {
      case 'searching':
        return 'status-searching'
      case 'found':
        return 'status-found'
      case 'error':
        return 'status-error'
      default:
        return ''
    }
  }

  return (
    <div className="scanner-instructions">
      <p>📱 Наведите камеру на штрихкод или QR-код</p>
      <p>🎯 Убедитесь, что код полностью в кадре</p>
      {scanStatus !== 'idle' && (
        <div className="scan-status">
          <span className={getStatusClassName()}>
            {getStatusText()}
          </span>
        </div>
      )}
    </div>
  )
} 