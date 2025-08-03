import React, { useEffect, useRef } from 'react'
import Modal from '../Modal'
import './BarcodeScanner.css'
import { useScannerState } from './hooks/useScannerState'
import { ScannerInstructions } from './components/ScannerInstructions'
import { ScannerError } from './components/ScannerError'
import { ScannerViewport } from './components/ScannerViewport'
import { ReactQrBarcodeScannerService } from './services/ReactQrBarcodeScannerService'
import type { IScannerService } from './interfaces/IScannerService'

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (result: string) => void
  scannerService?: IScannerService
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  scannerService = new ReactQrBarcodeScannerService()
}) => {
  const {
    state,
    startScanning,
    stopScanning,
    handleScanResult,
    handleScanError,
    clearError,
    reset
  } = useScannerState()

  const scannerServiceRef = useRef<IScannerService>(scannerService)

  useEffect(() => {
    if (isOpen) {
      startScanning()
      scannerServiceRef.current.setCallbacks(handleScanResult, handleScanError)
    } else {
      stopScanning()
      reset()
    }
  }, [isOpen, startScanning, stopScanning, handleScanResult, handleScanError, reset])

  useEffect(() => {
    if (state.scanStatus === 'found' && state.lastResult) {
      onScan(state.lastResult.text)
      // Небольшая задержка чтобы пользователь увидел успех
      setTimeout(() => {
        onClose()
      }, 500)
    }
  }, [state.scanStatus, state.lastResult, onScan, onClose])

  const handleClose = () => {
    stopScanning()
    reset()
    onClose()
  }

  const handleRetry = () => {
    clearError()
    startScanning()
  }

  const isSupported = scannerServiceRef.current.isSupported()

  if (!isSupported) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Сканирование Штрихкода">
        <div className="scanner-not-supported">
          <p>📱 Сканирование штрихкодов не поддерживается в вашем браузере</p>
          <p>Попробуйте использовать современный браузер с поддержкой камеры</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Сканирование Штрихкода">
      <div className="barcode-scanner-content">
        {state.error ? (
          <ScannerError
            error={state.error}
            onRetry={handleRetry}
            onCancel={handleClose}
          />
        ) : (
          <div className="scanner-container">
            <ScannerInstructions scanStatus={state.scanStatus} />
            
            <ScannerViewport
              scannerService={scannerServiceRef.current}
              isScanning={state.isScanning}
            />

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