import React from 'react';
import Quagga from '@ericblade/quagga2';
import type { IScannerService, IScanResult, IScannerError } from '../interfaces/IScannerService';
import { getDefaultCameraDeviceId } from '../../../utils/cameraPreferences';

/**
 * Сервис сканирования на базе @ericblade/quagga2.
 * Quagga2 специализируется на 1D штрихкодах (Code 128, EAN и пр.) и
 * показывает значительно лучший результат детекции реальных этикеток,
 * чем ZXing/react-qr-barcode-scanner.
 */
export class QuaggaScannerService implements IScannerService {
  private onResult?: (result: IScanResult) => void;
  private onError?: (error: IScannerError) => void;
  private isRunning = false;
  private containerId = 'quagga-scanner-container';

  // --- IScannerService ---

  isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia
    );
  }

  getSupportedFormats(): string[] {
    return ['CODE_128', 'CODE_39', 'EAN_13', 'EAN_8', 'UPC_A', 'UPC_E'];
  }

  setCallbacks(
    onResult: (result: IScanResult) => void,
    onError: (error: IScannerError) => void
  ): void {
    this.onResult = onResult;
    this.onError = onError;
  }

  async startScanning(): Promise<void> {
    // Quagga инициализируется после того, как DOM-элемент появился.
    // Реальная инициализация происходит в initQuagga(), которая вызывается
    // из renderScanner() при монтировании компонента.
  }

  stopScanning(): void {
    if (this.isRunning) {
      try {
        Quagga.offDetected(this.handleDetected);
        Quagga.stop();
      } catch {
        // Игнорируем ошибки при остановке
      }
      this.isRunning = false;
    }
  }

  /**
   * Рендерим div-контейнер; Quagga2 сам вставит в него <video> и <canvas>.
   * Инициализацию откладываем через setTimeout, чтобы DOM успел отрисоваться.
   */
  renderScanner(width: string, height: string): React.ReactElement {
    // Запускаем Quagga с небольшой задержкой, давая React время вставить
    // контейнер в DOM.
    setTimeout(() => this.initQuagga(), 100);

    return React.createElement('div', {
      id: this.containerId,
      style: {
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
      },
    });
  }

  // --- Внутренние методы ---

  private async initQuagga(): Promise<void> {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Если уже запущен — перезапустим
    if (this.isRunning) {
      this.stopScanning();
      await new Promise(r => setTimeout(r, 200));
    }

    const defaultDeviceId = getDefaultCameraDeviceId();
    const isMobile = this.isMobileDevice();

    const constraints: MediaTrackConstraints = defaultDeviceId
      ? { deviceId: { exact: defaultDeviceId } }
      : {
          facingMode: 'environment',
          width: { ideal: isMobile ? 1920 : 1280 },
          height: { ideal: isMobile ? 1080 : 720 },
        };

    try {
      await new Promise<void>((resolve, reject) => {
        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              target: container,
              constraints,
              area: {
                // Нацеливаем детектор на центральные 60% кадра, где
                // пользователь держит штрихкод.
                top: '20%',
                right: '10%',
                bottom: '20%',
                left: '10%',
              },
            },
            locator: {
              patchSize: 'medium', // 'x-large' замедляет, 'small' теряет плотные коды
              halfSample: true,
            },
            numOfWorkers: typeof navigator !== 'undefined' &&
              navigator.hardwareConcurrency
              ? Math.min(navigator.hardwareConcurrency, 4)
              : 2,
            frequency: isMobile ? 10 : 15, // кадров в секунду для декодирования
            decoder: {
              readers: [
                // Code 128 первым — он самый приоритетный
                'code_128_reader',
                'code_39_reader',
                'ean_reader',
                'ean_8_reader',
                'upc_reader',
                'upc_e_reader',
              ],
            },
            locate: true,
          },
          err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });

      Quagga.onDetected(this.handleDetected);
      Quagga.start();
      this.isRunning = true;
    } catch (err) {
      this.dispatchError(err);
    }
  }

  /**
   * Callback Quagga при обнаружении штрихкода.
   * Используем стрелочную функцию, чтобы `this` был доступен при передаче
   * в Quagga.offDetected().
   */
  private handleDetected = (data: { codeResult: { code: string | null; format: string } }) => {
    const raw = data?.codeResult?.code;
    if (!raw) return;

    // Дополнительная валидация: Quagga иногда возвращает ложные срабатывания.
    // Принимаем только результаты, прошедшие базовую проверку.
    const text = this.cleanText(raw);
    if (!text) return;

    const format = (data.codeResult.format || 'CODE_128').toUpperCase();

    const scanResult: IScanResult = {
      text,
      format,
      timestamp: new Date(),
    };

    if (this.onResult) {
      this.onResult(scanResult);
    }
  };

  /**
   * Очищаем текст от мусорных символов, сохраняя точки и буквенно-цифровые
   * символы, которые встречаются в реальных Code 128 (например, "9011401C..0913766550").
   */
  private cleanText(raw: string): string {
    if (!raw) return '';
    // Оставляем все печатаемые ASCII символы (0x20–0x7E)
    return raw.replace(/[^\x20-\x7E]/g, '').trim();
  }

  private dispatchError(error: unknown): void {
    if (!this.onError) return;

    const message = this.resolveErrorMessage(error);
    const scannerError: IScannerError = {
      code: 'QUAGGA_ERROR',
      message,
      isRecoverable: true,
    };
    this.onError(scannerError);
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

  private isMobileDevice(): boolean {
    const ua = navigator.userAgent;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      window.innerWidth <= 768
    );
  }
}
