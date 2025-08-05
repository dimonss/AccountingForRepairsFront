import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { RepairPhoto } from '../store/api/repairsApi';
import './CameraCapture.css';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photo: RepairPhoto) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Камера не поддерживается в вашем браузере');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Останавливаем предыдущий поток если есть
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      let errorMessage = 'Не удалось получить доступ к камере';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Камера не найдена';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Камера заблокирована другим приложением';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

  const handleClose = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      checkCameras();
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isOpen, startCamera]);

  // Cleanup портала при размонтировании
  useEffect(() => {
    return () => {
      const container = document.getElementById('camera-portal-root');
      if (container && !container.hasChildNodes()) {
        document.body.removeChild(container);
      }
    };
  }, []);

  // Обработка клавиши Escape для закрытия
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const checkCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
    }
  };

  // const stopCamera = () => {
  //   if (streamRef.current) {
  //     streamRef.current.getTracks().forEach(track => track.stop());
  //     streamRef.current = null;
  //   }
  //   if (videoRef.current) {
  //     videoRef.current.srcObject = null;
  //   }
  // };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Устанавливаем размер canvas равный размеру видео
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Рисуем кадр из видео на canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Конвертируем в base64
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    
    // Генерируем имя файла
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `camera-${timestamp}.jpg`;

    const photo: RepairPhoto = {
      url: dataURL,
      filename: filename,
      caption: '',
      uploaded_at: new Date().toISOString()
    };

    onCapture(photo);
    onClose();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Закрываем только при клике на overlay, не на modal
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Создаем или находим контейнер для портала
  const getPortalContainer = () => {
    let container = document.getElementById('camera-portal-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'camera-portal-root';
      document.body.appendChild(container);
    }
    return container;
  };

  if (!isOpen) return null;

  const cameraContent = (
    <div className="camera-capture-overlay" onClick={handleOverlayClick}>
      <div className="camera-capture-modal" role="dialog" aria-modal="true" aria-labelledby="camera-title">
        <div className="camera-content">
          {error ? (
            <div className="camera-error">
              <div className="error-icon">📷</div>
              <p>{error}</p>
              <div className="error-actions">
                <button onClick={startCamera} className="retry-btn">
                  Повторить
                </button>
                <button onClick={handleClose} className="cancel-btn">
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="camera-viewport">
                {isLoading && (
                  <div className="camera-loading">
                    <div className="loading-spinner"></div>
                    <p>Подключение к камере...</p>
                  </div>
                )}
                
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                  style={{ display: isLoading ? 'none' : 'block' }}
                />
                
                {/* Рамка для кадрирования */}
                <div className="camera-frame">
                  <div className="frame-corner frame-tl"></div>
                  <div className="frame-corner frame-tr"></div>
                  <div className="frame-corner frame-bl"></div>
                  <div className="frame-corner frame-br"></div>
                </div>
              </div>

              <div className="camera-controls">
                  <button
                    className={`camera-capture-btn camera-second-btn ${hasMultipleCameras ? "" : "disabled"}`}
                    onClick={switchCamera}
                    disabled={isLoading || hasMultipleCameras}
                  >
                    🔄
                  </button>

                <button
                  className="camera-capture-btn"
                  onClick={capturePhoto}
                  disabled={isLoading}
                >
                  <div className="capture-circle"/>
                </button>
                
                <button
                  className="camera-capture-btn camera-second-btn"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  X
                </button>
              </div>
            </>
          )}
        </div>

        {/* Скрытый canvas для захвата кадра */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );

  // Рендерим через портал в body
  return createPortal(cameraContent, getPortalContainer());
}; 