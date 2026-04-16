import React from 'react';
import Quagga from '@ericblade/quagga2';
import type { IScannerService, IScanResult, IScannerError } from '../interfaces/IScannerService';
import { getDefaultCameraDeviceId } from '../../../utils/cameraPreferences';

/**
 * Сервис сканирования на базе @ericblade/quagga2.
 *
 * Проблема NaN в Quagga2:
 * checkImageConstraints() вызывается при каждом кадре. Если в момент
 * первого вызова видео ещё не стартовало, getWidth()/getHeight() = 0
 * → calculatePatchSize получает imgSize {x:0, y:0}
 * → _computeDivisors([0]) = [] → common=[] → patchSize.x = undefined → NaN.
 *
 * Решение: перехватываем ошибку в onProcessed и игнорируем "Image dimensions"
 * пока видео не готово (они не fatal — поток продолжает работать).
 */
export class QuaggaScannerService implements IScannerService {
  private onResult?: (result: IScanResult) => void;
  private onError?: (error: IScannerError) => void;
  private isRunning = false;
  private readonly containerId = 'quagga-scanner-container';

  // ── IScannerService ──────────────────────────────────────────────

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
    // Реальный запуск — в initQuagga() после монтирования контейнера.
  }

  stopScanning(): void {
    if (!this.isRunning) return;
    try {
      Quagga.offDetected(this.handleDetected);
      Quagga.offProcessed(this.handleProcessed);
      Quagga.stop();
    } catch {
      // Игнорируем ошибки при остановке
    }
    this.isRunning = false;
  }

  renderScanner(width: string, height: string): React.ReactElement {
    this.injectContainerStyles();

    // Два rAF: первый — после paint, второй — после следующего layout.
    // Гарантирует что контейнер в DOM перед init.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.initQuagga());
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
    const styleId = 'quagga-scanner-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    // Quagga вставляет <video> и <canvas> с абсолютными пиксельными
    // размерами равными разрешению камеры — ограничиваем их контейнером.
    style.textContent = `
      #${this.containerId} { display: block; }
      #${this.containerId} video,
      #${this.containerId} canvas {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      #${this.containerId} canvas.drawingBuffer {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  private async initQuagga(): Promise<void> {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.isRunning) {
      this.stopScanning();
      await new Promise(r => setTimeout(r, 150));
    }

    const defaultDeviceId = getDefaultCameraDeviceId();

    // Передаём constraints без width/height — браузер сам выберет
    // нативное разрешение камеры (всегда корректное целое число).
    // Явные числа иногда трактуются как exact-constraints и фейлятся;
    // {ideal} объекты приводят к NaN до получения первого кадра.
    const constraints: MediaTrackConstraints = defaultDeviceId
      ? { deviceId: { exact: defaultDeviceId } }
      : { facingMode: 'environment' };

    try {
      await new Promise<void>((resolve, reject) => {
        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              target: container,
              constraints,
            },
            locator: {
              patchSize: 'medium',
              // halfSample: false гарантирует что полное разрешение
              // передаётся в calculatePatchSize без деления пополам.
              halfSample: false,
            },
            // numOfWorkers: 0 — однопоточный режим (WebWorker не используется).
            // Наиболее предсказуемое поведение; исключает race-conditions
            // между worker-потоком и основным потоком при старте.
            numOfWorkers: 0,
            frequency: 10,
            decoder: {
              readers: [
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
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Перехватываем "Image dimensions" ошибку в onProcessed.
      // Она возникает только в первые кадры пока видео прогревается,
      // и не является фатальной — поток продолжает работу.
      Quagga.onProcessed(this.handleProcessed);
      Quagga.onDetected(this.handleDetected);
      Quagga.start();
      this.isRunning = true;
    } catch (err) {
      this.dispatchError(err);
    }
  }

  /**
   * Обработчик каждого обработанного кадра.
   * Нужен чтобы перехватить и подавить ошибку "Image dimensions"
   * которую Quagga бросает в первые кадры (videoWidth ещё не готов).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleProcessed = (_result: any) => {
    // Намеренно пустой — сам факт наличия обработчика заставляет Quagga
    // не propagation'ить ошибки checkImageConstraints наружу.
    // Quagga внутри оборачивает processFrame в try/catch и вызывает
    // onProcessed; без этого обработчика ошибка всплывает как unhandled.
  };

  private handleDetected = (data: {
    codeResult: { code: string | null; format: string };
  }) => {
    const raw = data?.codeResult?.code;
    if (!raw) return;

    const text = this.cleanText(raw);
    if (!text) return;

    const format = (data.codeResult.format || 'CODE_128').toUpperCase();

    this.onResult?.({
      text,
      format,
      timestamp: new Date(),
    });
  };

  private cleanText(raw: string): string {
    if (!raw) return '';
    // Сохраняем все печатаемые ASCII: буквы, цифры, точки и пр.
    return raw.replace(/[^\x20-\x7E]/g, '').trim();
  }

  private dispatchError(error: unknown): void {
    if (!this.onError) return;
    this.onError({
      code: 'QUAGGA_ERROR',
      message: this.resolveErrorMessage(error),
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
      // Ошибки размеров изображения — временные, не показываем пользователю
      if (msg.includes('Image dimensions')) return '';
      return msg;
    }
    return 'Ошибка инициализации сканера';
  }
}
