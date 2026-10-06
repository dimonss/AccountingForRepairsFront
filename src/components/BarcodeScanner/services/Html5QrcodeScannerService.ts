import React from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, type Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import type { IScannerService, IScanResult, IScannerError } from '../interfaces/IScannerService';
import { getDefaultCameraDeviceId } from '../../../utils/cameraPreferences';

/**
 * Сервис сканирования на базе html5-qrcode.
 * В отличие от Quagga2 (который часто "галлюцинирует" или читает Code 128 с ошибками из-за
 * отсутствия строгих проверок контрольной суммы), html5-qrcode использует порт ZXing:
 * он надёжен и читает только валидные коды, поддерживая все типы.
 */
export class Html5QrcodeScannerService implements IScannerService {
  private onResult?: (result: IScanResult) => void;
  private onError?: (error: IScannerError) => void;
  private isRunning = false;
  private html5QrCode: Html5Qrcode | null = null;
  private readonly containerId = 'html5-qrcode-scanner-container';

  private isStarting = false;
  private shouldStop = false;

  // ── IScannerService ──────────────────────────────────────────────

  isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia
    );
  }

  getSupportedFormats(): string[] {
    return ['CODE_128', 'CODE_39', 'EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'QR_CODE'];
  }

  setCallbacks(
    onResult: (result: IScanResult) => void,
    onError: (error: IScannerError) => void
  ): void {
    this.onResult = onResult;
    this.onError = onError;
  }

  async startScanning(): Promise<void> {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Сбрасываем флаг отмены перед стартом
    this.shouldStop = false;

    // Если уже идёт сканирование или запуск, ничего повторно не запускаем
    if (this.isRunning || this.isStarting) {
      return;
    }

    this.isStarting = true;

    try {
      const qrCodeInstance = new Html5Qrcode(this.containerId, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ]
      });
      this.html5QrCode = qrCodeInstance;

      const defaultDeviceId = getDefaultCameraDeviceId();

      // Обязательно помещаем выбор камеры внутрь videoConstraints, 
      // иначе html5-qrcode затрет выбор камеры при использовании width/height
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      };

      if (defaultDeviceId) {
        videoConstraints.deviceId = { exact: defaultDeviceId };
      } else {
        videoConstraints.facingMode = 'environment';
      }

      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        aspectRatio: 1.7777778,
        videoConstraints
      };

      // Первый аргумент для обратной совместимости API
      const cameraConfig = defaultDeviceId
        ? defaultDeviceId
        : { facingMode: 'environment' };

      await qrCodeInstance.start(
        cameraConfig,
        config,
        (decodedText, decodedResult) => {
          this.handleDetected(decodedText, decodedResult.result.format?.formatName || 'UNKNOWN');
        },
        (_errorMessage) => {
          // html5-qrcode генерирует ошибку для КАЖДОГО кадра, где нет штрихкода.
          // Это нормальное поведение, мы их просто игнорируем.
        }
      );

      this.isStarting = false;

      // Если пока запускалась камера, пользователь уже нажал «Закрыть» / «Отмена»
      if (this.shouldStop || this.html5QrCode !== qrCodeInstance) {
        this.stopScannerInstance(qrCodeInstance);
        return;
      }

      this.isRunning = true;
    } catch (err) {
      this.isStarting = false;
      this.stopDomMediaStreams();
      if (!this.shouldStop) {
        this.dispatchError(err);
      }
    }
  }

  stopScanning(): void {
    this.shouldStop = true;
    this.isStarting = false;
    this.isRunning = false;

    // Принудительно глушим все MediaStreamTrack в DOM контейнере
    this.stopDomMediaStreams();

    if (!this.html5QrCode) return;
    
    const currentScanner = this.html5QrCode;
    this.html5QrCode = null;

    this.stopScannerInstance(currentScanner);
  }

  private stopScannerInstance(scanner: Html5Qrcode): void {
    try {
      // Html5Qrcode.isScanning доступен в html5-qrcode
      const isScanning = (scanner as unknown as { isScanning?: boolean }).isScanning ?? true;
      if (isScanning) {
        scanner.stop()
          .catch(() => {})
          .finally(() => {
            try {
              scanner.clear();
            } catch {}
            this.stopDomMediaStreams();
          });
      } else {
        try {
          scanner.clear();
        } catch {}
        this.stopDomMediaStreams();
      }
    } catch {
      this.stopDomMediaStreams();
    }
  }

  /**
   * Гарантированно глушит все открытые видео-потоки и треки камеры,
   * привязанные к контейнеру сканера или глобально захваченные <video> элементами.
   */
  private stopDomMediaStreams(): void {
    try {
      const container = document.getElementById(this.containerId);
      if (!container) return;

      const videoElements = container.querySelectorAll('video');
      videoElements.forEach((video) => {
        if (video.srcObject && video.srcObject instanceof MediaStream) {
          video.srcObject.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
          video.srcObject = null;
        }
      });
    } catch {
      // Игнорируем ошибки при очистке потоков
    }
  }

  renderScanner(width: string, height: string): React.ReactElement {
    this.injectContainerStyles();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.startScanning());
    });

    return React.createElement('div', {
      id: this.containerId,
      style: {
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
        borderRadius: '8px',
      },
    });
  }

  // ── Внутренние методы ────────────────────────────────────────────

  private injectContainerStyles(): void {
    const styleId = 'html5-qrcode-scanner-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #${this.containerId} video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      #qr-shaded-region {
         border-radius: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  private handleDetected = (text: string, formatId: string) => {
    if (!text) return;

    const format = formatId.toUpperCase();

    this.onResult?.({
      text,
      format,
      timestamp: new Date(),
    });
  };

  private dispatchError(error: unknown): void {
    if (!this.onError) return;

    const message = this.resolveErrorMessage(error);
    this.onError({
      code: 'HTML5_QRCODE_ERROR',
      message,
      isRecoverable: true,
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      const msg = (error as { message: string }).message;
      if (msg.includes('Permission denied') || msg.includes('NotAllowedError'))
        return 'Доступ к камере запрещен';
      if (msg.includes('NotFoundError')) return 'Камера не найдена';
      if (msg.includes('NotReadableError'))
        return 'Камера заблокирована другим приложением';
      return msg;
    }
    return 'Ошибка инициализации сканера';
  }

  // private isMobileDevice(): boolean {
  //   return (
  //     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  //       navigator.userAgent
  //     ) || window.innerWidth <= 768
  //   );
  // }
}
