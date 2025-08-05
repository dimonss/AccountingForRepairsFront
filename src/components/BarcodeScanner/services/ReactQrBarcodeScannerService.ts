import React from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import type { IScannerService, IScanResult, IScannerError } from '../interfaces/IScannerService';
import { Result, BarcodeFormat } from '@zxing/library'; // Импортируем типы из zxing

// Интерфейс для результата от библиотеки react-qr-barcode-scanner
interface BarcodeScannerResult {
  getText?: () => string;
  getFormat?: () => string;
}

// Union type для всех возможных результатов сканирования
type ScanResultUnion = BarcodeScannerResult | string | Result;

export class ReactQrBarcodeScannerService implements IScannerService {
  private onResult?: (result: IScanResult) => void;
  private onError?: (error: IScannerError) => void;

  async startScanning(): Promise<void> {
    if (this.isSupported()) {
      try {
        // Запрашиваем доступ к камере с оптимальными настройками
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: 'environment', // Предпочитаем заднюю камеру
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        };

        await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Если не получилось с оптимальными настройками, пробуем базовые
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (basicErr) {
          this.handleScanError(basicErr);
        }
      }
    } else {
      this.handleScanError(new Error('Scanner not supported in this browser'));
    }
  }

  stopScanning(): void {
    // Останавливаем сканирование
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' &&
        !!navigator.mediaDevices &&
        !!navigator.mediaDevices.getUserMedia;
  }

  getSupportedFormats(): string[] {
    return ['QR_CODE', 'CODE_128', 'CODE_39', 'EAN_13', 'EAN_8', 'UPC_A', 'UPC_E'];
  }

  setCallbacks(onResult: (result: IScanResult) => void, onError: (error: IScannerError) => void): void {
    this.onResult = onResult;
    this.onError = onError;
  }

  private handleScanResult(result: ScanResultUnion | undefined): void {
    if (!result || !this.onResult) return;

    let text = '';
    let format = 'UNKNOWN';

    if (typeof result === 'string') {
      text = result;
      format = 'UNKNOWN';
    } else if (result instanceof Result) {
      // Result from @zxing/library
      text = result.getText() || '';
      const barcodeFormat = result.getBarcodeFormat();
      format = barcodeFormat ? BarcodeFormat[barcodeFormat] || 'UNKNOWN' : 'UNKNOWN';
    } else if ('getText' in result && typeof result.getText === 'function') {
      // BarcodeScannerResult
      text = result.getText() || '';
      if ('getFormat' in result && typeof result.getFormat === 'function') {
        format = result.getFormat() || 'UNKNOWN';
      }
    }

    const scanResult: IScanResult = {
      text,
      format,
      timestamp: new Date()
    };
    this.onResult(scanResult);
  }

  private handleScanError(error: unknown): void {
    if (!this.onError) return;

    if (this.isNotFoundException(error)) return;

    const scannerError: IScannerError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      isRecoverable: this.isRecoverableError(error)
    };
    this.onError(scannerError);
  }

  private isNotFoundException(error: unknown): boolean {
    if (error && typeof error === 'object' && 'name' in error) {
      const name = (error as { name: string }).name;
      if (name === 'NotFoundException' || name === 'NotFoundException2') {
        return true;
      }
    }
    
    if (typeof error === 'string') {
      return error.includes('NotFoundException') || 
             error.includes('No MultiFormat Readers were able to detect the code');
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message: string }).message;
      if (message.includes('No MultiFormat Readers were able to detect the code') || 
          message.includes('NotFoundException')) {
        return true;
      }
    }
    
    if (error && typeof error === 'object' && 'toString' in error) {
      const errorStr = error.toString();
      if (errorStr.includes('No MultiFormat Readers were able to detect the code') ||
          errorStr.includes('NotFoundException')) {
        return true;
      }
    }
    
    return false;
  }

  private getErrorCode(error: unknown): string {
    if (error && typeof error === 'object' && 'name' in error) return (error as { name: string }).name;
    return 'UNKNOWN_ERROR';
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message: string }).message;
      
      // Переводим типичные ошибки на русский язык
      if (message.includes('Permission denied')) return 'Доступ к камере запрещен';
      if (message.includes('NotFoundError')) return 'Камера не найдена';
      if (message.includes('NotAllowedError')) return 'Доступ к камере не разрешен';
      if (message.includes('NotReadableError')) return 'Камера заблокирована другим приложением';
      if (message.includes('OverconstrainedError')) return 'Камера не поддерживает требуемые параметры';
      
      return message;
    }
    
    return 'Неизвестная ошибка сканирования';
  }

  private isRecoverableError(error: unknown): boolean {
    const errorCode = this.getErrorCode(error);
    const recoverableErrors = [
      'NotReadableError', // Камера занята, может освободиться
      'OverconstrainedError', // Можно попробовать с другими параметрами
      'UNKNOWN_ERROR' // Неизвестные ошибки можно попробовать повторить
    ];
    
    const nonRecoverableErrors = [
      'NotFoundException', 
      'NotFoundException2',
      'NotAllowedError', // Пользователь запретил доступ
      'NotFoundError' // Нет камеры
    ];
    
    if (nonRecoverableErrors.includes(errorCode)) return false;
    if (recoverableErrors.includes(errorCode)) return true;
    
    // По умолчанию считаем ошибку восстановимой
    return true;
  }

  renderScanner(width: string, height: string): React.ReactElement {
    return React.createElement(BarcodeScannerComponent, {
      width,
      height,
      delay: 100,
      facingMode: 'environment',
      onUpdate: (err: unknown, result?: Result) => {
        if (result) {
          this.handleScanResult(result);
        } else if (err) {
          this.handleScanError(err);
        }
      },
      onError: (error: unknown) => {
        this.handleScanError(error);
      }
    });
  }
}