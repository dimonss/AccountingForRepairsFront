import { useState } from 'react'
import BarcodeScannerComponent from 'react-qr-barcode-scanner'
import Modal from './Modal'

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (result: string) => void
}

const BarcodeScanner = ({ isOpen, onClose, onScan }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(true)
  const [error, setError] = useState<string>('')
  const [scanStatus, setScanStatus] = useState<'searching' | 'found' | 'error'>('searching')

  const handleScan = (result: string) => {
    if (result) {
      setScanStatus('found')
      setIsScanning(false)
      onScan(result)
      // Небольшая задержка чтобы пользователь увидел успех
      setTimeout(() => {
        onClose()
      }, 500)
    }
  }

  const handleError = (error: unknown) => {
    // Игнорируем NotFoundException - это нормально когда код не найден в кадре
    if (error && typeof error === 'object' && 'name' in error) {
      const errorName = (error as { name: string }).name;
      if (errorName === 'NotFoundException' || errorName === 'NotFoundException2') {
        // Это нормальная ошибка сканирования - код не найден в текущем кадре
        return;
      }
    }
    
    // Проверяем строковые ошибки
    if (typeof error === 'string' && error.includes('NotFoundException')) {
      return;
    }
    
    console.error('Barcode scanner error:', error);
    setError('Ошибка доступа к камере. Проверьте разрешения.');
  }

  const handleClose = () => {
    setIsScanning(false)
    setError('')
    onClose()
  }

  const handleRetry = () => {
    setError('')
    setIsScanning(true)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Сканирование Штрихкода"
    >
      <div className="barcode-scanner-content">
        {error ? (
          <div className="scanner-error">
            <div className="error-icon">📷</div>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button 
                className="retry-btn"
                onClick={handleRetry}
              >
                Повторить
              </button>
              <button 
                className="cancel-btn"
                onClick={handleClose}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="scanner-container">
            <div className="scanner-instructions">
              <p>📱 Наведите камеру на штрихкод или QR-код</p>
              <p>🎯 Убедитесь, что код полностью в кадре</p>
              <div className="scan-status">
                {scanStatus === 'searching' && (
                  <span className="status-searching">🔍 Поиск кода...</span>
                )}
                {scanStatus === 'found' && (
                  <span className="status-found">✅ Код найден!</span>
                )}
              </div>
            </div>
            
            <div className="scanner-viewport">
              {isScanning && (
                <BarcodeScannerComponent
                  width="100%"
                  height="300px"
                  //todo fix any
                  onUpdate={(err: unknown, result: any) => {
                    if (result && result.getText) {
                      handleScan(result.getText())
                    } else if (err) {
                      // Только логируем, но не показываем ошибку пользователю
                      // NotFoundException - это нормально при поиске кода
                      if (err && typeof err === 'object' && 'name' in err) {
                        const errorName = (err as { name: string }).name;
                        if (errorName !== 'NotFoundException' && errorName !== 'NotFoundException2') {
                          handleError(err);
                        }
                      } else if (typeof err === 'string' && !err.includes('NotFoundException')) {
                        handleError(err);
                      }
                    }
                  }}
                  onError={handleError}
                />
              )}
              
              {/* Overlay с рамкой для наведения */}
              <div className="scanner-overlay">
                <div className="scanner-frame"></div>
              </div>
            </div>

            <div className="scanner-actions">
              <button 
                className="cancel-scan-btn"
                onClick={handleClose}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default BarcodeScanner 