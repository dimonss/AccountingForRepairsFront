import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './PWAInstaller.css';

interface PWAInstallerProps {
  children: React.ReactNode;
}

// Тип для события beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstaller: React.FC<PWAInstallerProps> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Регистрация Service Worker с автоматическим обновлением
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: Error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    // Проверяем, установлено ли приложение
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    checkIfInstalled();

    // Обработчик события beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPromptEvent);
      
      // Показываем кнопку установки только если приложение не установлено
      if (!isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    // Обработчик события appinstalled
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleUpdateClick = () => {
    updateServiceWorker(true);
  };

  const handleDismissUpdate = () => {
    setNeedRefresh(false);
  };

  return (
    <>
      {children}
      
      {/* Уведомление об обновлении */}
      {needRefresh && (
        <div className="pwa-update-banner">
          <div className="pwa-update-content">
            <span>Доступно обновление приложения</span>
            <div className="pwa-update-buttons">
              <button onClick={handleUpdateClick} className="pwa-update-btn">
                Обновить
              </button>
              <button onClick={handleDismissUpdate} className="pwa-dismiss-btn">
                Позже
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка установки PWA */}
      {showInstallPrompt && !isInstalled && (
        <div className="pwa-install-banner">
          <div className="pwa-install-content">
            <div className="pwa-install-icon">📱</div>
            <div className="pwa-install-text">
              <h3>Установить приложение</h3>
              <p>Добавьте приложение на главный экран для быстрого доступа</p>
            </div>
            <div className="pwa-install-buttons">
              <button onClick={handleInstallClick} className="pwa-install-btn">
                Установить
              </button>
              <button 
                onClick={() => setShowInstallPrompt(false)} 
                className="pwa-dismiss-btn"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstaller;
