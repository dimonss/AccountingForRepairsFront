import React, { useEffect, useState, useRef } from 'react';
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
  const effectRanRef = useRef(false);

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
    if (effectRanRef.current) {
      console.log('PWAInstaller useEffect already ran, skipping');
      return;
    }
    
    console.log('PWAInstaller useEffect running');
    effectRanRef.current = true;
    
    // Проверяем, установлено ли приложение
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = (window.navigator as Navigator & { standalone?: boolean }).standalone === true; // iOS Safari
      
      console.log('Installation check:', { isStandalone, isInApp });
      setIsInstalled(isStandalone || isInApp);
      
      // Показываем кнопку установки если приложение не установлено
      if (!isStandalone && !isInApp) {
        console.log('Setting showInstallPrompt to true');
        setShowInstallPrompt(true);
      }
    };

    checkIfInstalled();

    // Обработчик события beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired!');
      e.preventDefault();
      
      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPromptEvent);
      
      // Показываем кнопку установки
      setShowInstallPrompt(true);
    };

    // Обработчик события appinstalled
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Проверяем поддержку PWA
    console.log('PWA Support check:');
    console.log('- Service Worker:', 'serviceWorker' in navigator);
    console.log('- BeforeInstallPrompt:', 'BeforeInstallPromptEvent' in window);
    console.log('- Display mode standalone:', window.matchMedia('(display-mode: standalone)').matches);

    // Проверяем доступность иконок
    const checkIcons = async () => {
      try {
        const icon192 = await fetch('/repairs_accounting/icons/icon-192x192.png');
        const icon512 = await fetch('/repairs_accounting/icons/icon-512x512.png');
        console.log('Icons check:', { 
          icon192: icon192.ok ? 'OK' : 'FAIL', 
          icon512: icon512.ok ? 'OK' : 'FAIL' 
        });
      } catch (error) {
        console.log('Icons check failed:', error);
      }
    };
    
    checkIcons();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Если событие beforeinstallprompt не сработало в течение 3 секунд,
    // но приложение не установлено - показываем кнопку установки
    const fallbackTimer = setTimeout(() => {
      if (!isInstalled && !deferredPrompt) {
        console.log('Fallback: showing install prompt after timeout');
        setShowInstallPrompt(true);
      }
    }, 3000);

    // В dev режиме принудительно показываем кнопку установки для тестирования
    if (import.meta.env.DEV) {
      console.log('Dev mode: forcing install prompt for testing');
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
          console.log('Dev mode: install prompt shown');
        }
      }, 1000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []); // Убираем зависимости чтобы useEffect запускался только один раз

  const handleInstallClick = async () => {
    console.log('Install button clicked');
    console.log('Deferred prompt:', deferredPrompt);
    
    if (!deferredPrompt) {
      console.log('No deferred prompt available - showing manual install instructions');
      // Показываем инструкции по ручной установке
      alert('Для установки PWA:\n1. Нажмите на иконку установки в адресной строке\n2. Или выберите "Установить приложение" в меню браузера');
      return;
    }

    try {
      console.log('Prompting user for installation');
      // Открываем диалог установки PWA
      deferredPrompt.prompt();
      
      // Ждем ответа пользователя
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      
      // Очищаем состояние
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted by user');
      } else {
        console.log('PWA installation dismissed by user');
      }
    } catch (error) {
      console.error('Error during installation:', error);
      // В случае ошибки показываем инструкции
      alert('Ошибка установки. Попробуйте установить вручную:\n1. Нажмите на иконку установки в адресной строке\n2. Или выберите "Установить приложение" в меню браузера');
    }
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
