import React, { useState, useEffect, useRef, useCallback } from 'react'
import Modal from './Modal'
import { getDefaultCameraDeviceId, setDefaultCameraDeviceId, clearDefaultCameraDeviceId } from '../utils/cameraPreferences'

interface CameraInfo {
  deviceId: string
  label: string
  kind: string
}

interface DebugInfo {
  userAgent: string
  screenResolution: string
  viewportSize: string
  localStorage: Record<string, string>
  sessionStorage: Record<string, string>
  cookies: string
  timestamp: string
}

const DebugModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [cameras, setCameras] = useState<CameraInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoadingCameras, setIsLoadingCameras] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [defaultCameraId, setDefaultCameraId] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadDebugInfo()
      loadCameras()
      setDefaultCameraId(getDefaultCameraDeviceId())
    } else {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = useCallback(async () => {
    if (!selectedCamera || !videoRef.current) return

    try {
      // Stop previous stream if exists
      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedCamera } }
      })
      
      streamRef.current = stream
      videoRef.current.srcObject = stream
      setIsCameraActive(true)
    } catch (error) {
      console.error('Error starting camera:', error)
      setIsCameraActive(false)
    }
  }, [selectedCamera])

  useEffect(() => {
    if (selectedCamera && isOpen) {
      startCamera()
    }
  }, [selectedCamera, isOpen, startCamera])

  const loadDebugInfo = () => {
    const info: DebugInfo = {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      localStorage: Object.fromEntries(
        Object.keys(localStorage).map(key => [key, localStorage.getItem(key) || ''])
      ),
      sessionStorage: Object.fromEntries(
        Object.keys(sessionStorage).map(key => [key, sessionStorage.getItem(key) || ''])
      ),
      cookies: document.cookie,
      timestamp: new Date().toISOString()
    }
    setDebugInfo(info)
  }

  const loadCameras = async () => {
    setIsLoadingCameras(true)
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Камера ${device.deviceId.slice(0, 8)}...`,
          kind: device.kind
        }))
      setCameras(videoDevices)
      const storedDefault = getDefaultCameraDeviceId()
      if (storedDefault && videoDevices.some(v => v.deviceId === storedDefault)) {
        setSelectedCamera(storedDefault)
      } else if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId)
      }
    } catch (error) {
      console.error('Error loading cameras:', error)
    } finally {
      setIsLoadingCameras(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      ;(videoRef.current as HTMLVideoElement).srcObject = null
    }
    setIsCameraActive(false)
  }

  const testCamera = async () => {
    if (!selectedCamera) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedCamera } }
      })
      
      // Stop the stream after a short delay to test
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop())
      }, 2000)
      
      alert('Камера работает! Поток будет остановлен через 2 секунды.')
    } catch (error) {
      alert(`Ошибка тестирования камеры: ${error}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Скопировано в буфер обмена!')
  }

  const clearStorage = (type: 'local' | 'session') => {
    if (type === 'local') {
      localStorage.clear()
    } else {
      sessionStorage.clear()
    }
    loadDebugInfo()
    alert(`${type === 'local' ? 'LocalStorage' : 'SessionStorage'} очищен!`)
  }

  const handleSetDefaultCamera = () => {
    if (!selectedCamera) return
    setDefaultCameraDeviceId(selectedCamera)
    setDefaultCameraId(selectedCamera)
    loadDebugInfo()
    alert('Камера по умолчанию сохранена')
  }

  const handleClearDefaultCamera = () => {
    clearDefaultCameraDeviceId()
    setDefaultCameraId(null)
    loadDebugInfo()
    alert('Камера по умолчанию сброшена')
  }

  const defaultCameraLabel = () => {
    if (!defaultCameraId) return '—'
    const match = cameras.find(c => c.deviceId === defaultCameraId)
    return match ? match.label : `${defaultCameraId.slice(0, 8)}...`
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔧 Отладочная панель">
      <div className="debug-panel">
        <div className="debug-section">
          <h3>📹 Камеры</h3>
          {isLoadingCameras ? (
            <p>Загрузка камер...</p>
          ) : cameras.length === 0 ? (
            <p>Камеры не найдены</p>
          ) : (
            <div className="camera-section">
              <div className="camera-controls">
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="camera-select"
                >
                  {cameras.map(camera => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label}
                    </option>
                  ))}
                </select>
                <button onClick={testCamera} className="test-camera-btn">
                  Тестировать камеру
                </button>
                <button onClick={handleSetDefaultCamera} className="test-camera-btn">
                  Установить по умолчанию
                </button>
                <button onClick={handleClearDefaultCamera} className="test-camera-btn" disabled={!defaultCameraId}>
                  Сбросить по умолчанию
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                Текущая камера по умолчанию: <strong>{defaultCameraLabel()}</strong>
              </div>
              
              <div className="camera-preview">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                />
                {!isCameraActive && (
                  <div className="camera-placeholder">
                    <p>Предварительный просмотр камеры</p>
                    <p>Выберите камеру для просмотра</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {debugInfo && (
          <>
            <div className="debug-section">
              <h3>🌐 Браузер</h3>
              <div className="debug-info">
                <p><strong>User Agent:</strong> {debugInfo.userAgent}</p>
                <p><strong>Разрешение экрана:</strong> {debugInfo.screenResolution}</p>
                <p><strong>Размер viewport:</strong> {debugInfo.viewportSize}</p>
                <p><strong>Время:</strong> {debugInfo.timestamp}</p>
              </div>
            </div>

            <div className="debug-section">
              <h3>💾 LocalStorage</h3>
              <div className="storage-controls">
                <button onClick={() => clearStorage('local')} className="clear-storage-btn">
                  Очистить LocalStorage
                </button>
                <button onClick={() => copyToClipboard(JSON.stringify(debugInfo.localStorage, null, 2))} className="copy-btn">
                  Копировать
                </button>
              </div>
              <pre className="debug-data">{JSON.stringify(debugInfo.localStorage, null, 2)}</pre>
            </div>

            <div className="debug-section">
              <h3>🔒 SessionStorage</h3>
              <div className="storage-controls">
                <button onClick={() => clearStorage('session')} className="clear-storage-btn">
                  Очистить SessionStorage
                </button>
                <button onClick={() => copyToClipboard(JSON.stringify(debugInfo.sessionStorage, null, 2))} className="copy-btn">
                  Копировать
                </button>
              </div>
              <pre className="debug-data">{JSON.stringify(debugInfo.sessionStorage, null, 2)}</pre>
            </div>

            <div className="debug-section">
              <h3>🍪 Cookies</h3>
              <button onClick={() => copyToClipboard(debugInfo.cookies)} className="copy-btn">
                Копировать
              </button>
              <pre className="debug-data">{debugInfo.cookies || 'Нет cookies'}</pre>
            </div>
          </>
        )}

        <div className="debug-actions">
          <button onClick={loadDebugInfo} className="refresh-btn">
            🔄 Обновить данные
          </button>
          <button onClick={onClose} className="close-btn">
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DebugModal 