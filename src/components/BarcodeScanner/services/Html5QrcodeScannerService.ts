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
    // В html5-qrcode вызов startScanning() напрямую инициализирует видео
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.isRunning && this.html5QrCode) {
      this.stopScanning();
      await new Promise(r => setTimeout(r, 200));
    }

    try {
      this.html5QrCode = new Html5Qrcode(this.containerId, {
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

      await this.html5QrCode.start(
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

      this.isRunning = true;
    } catch (err) {
      this.dispatchError(err);
    }
  }

  stopScanning(): void {
    if (!this.isRunning || !this.html5QrCode) return;
    
    // Сохраняем ссылку на текущий инстанс и сразу очищаем переменные состояния,
    // чтобы предотвратить конфликты при быстром открытии/закрытии сканера.
    const currentScanner = this.html5QrCode;
    this.html5QrCode = null;
    this.isRunning = false;

    try {
      currentScanner.stop()
        .catch(() => {})
        .finally(() => {
          try {
            currentScanner.clear();
          } catch {}
        });
    } catch {
       // Catch sync errors
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
