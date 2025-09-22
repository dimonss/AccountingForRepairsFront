import React from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import type { IScannerService, IScanResult, IScannerError } from '../interfaces/IScannerService';
import { Result, BarcodeFormat } from '@zxing/library'; // Импортируем типы из zxing
import { BarcodeStringFormat } from 'react-qr-barcode-scanner';
import { getDefaultCameraDeviceId } from '../../../utils/cameraPreferences';

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
        const defaultId = getDefaultCameraDeviceId();
        const constraints: MediaStreamConstraints = defaultId
          ? {
              video: {
                deviceId: { exact: defaultId },
                width: { ideal: 1920, min: 640 },
                height: { ideal: 1080, min: 480 },
                frameRate: { ideal: 30, min: 15 }
              }
            }
          : {
              video: {
                facingMode: 'environment',
                width: { ideal: 1920, min: 640 },
                height: { ideal: 1080, min: 480 },
                frameRate: { ideal: 30, min: 15 }
              }
            };

        await navigator.mediaDevices.getUserMedia(constraints);
      } catch (primaryErr) {
        try {
          await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 },
              frameRate: { ideal: 30, min: 15 }
            } 
          });
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
    let rawText = '';

    if (typeof result === 'string') {
      text = result;
      rawText = result;
      format = 'UNKNOWN';
    } else if (result instanceof Result) {
      // Result from @zxing/library
      rawText = result.getText() || '';
      text = this.cleanBarcodeText(rawText);
      const barcodeFormat = result.getBarcodeFormat();
      format = barcodeFormat ? BarcodeFormat[barcodeFormat] || 'UNKNOWN' : 'UNKNOWN';

      // Validate Code 128 format
      if (format === 'CODE_128') {
        this.validateCode128(text);
      }
    } else if ('getText' in result && typeof result.getText === 'function') {
      // BarcodeScannerResult
      rawText = result.getText() || '';
      text = this.cleanBarcodeText(rawText);
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

  private cleanBarcodeText(text: string): string {
    if (!text) return '';
    
    // Remove null characters and other control characters
    let cleaned = text.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Handle common Code 128 issues
    cleaned = cleaned.trim();
    
    // Additional Code 128 specific cleaning
    // Remove any non-printable characters that might cause issues
    cleaned = cleaned.replace(/[^\x20-\x7E]/g, '');
    
    return cleaned;
  }

  private validateCode128(text: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!text) {
      issues.push('Empty barcode text');
      return { isValid: false, issues };
    }
    
    // Code 128 should contain only printable ASCII characters
    if (!/^[\x20-\x7E]+$/.test(text)) {
      issues.push('Contains non-printable characters');
    }
    
    // Check for reasonable length (Code 128 can be 1-80 characters)
    if (text.length < 1) {
      issues.push('Too short');
    }
    if (text.length > 80) {
      issues.push('Too long (max 80 characters for Code 128)');
    }
    
    // Check for common scanning errors
    if (text.includes('')) {
      issues.push('Contains replacement characters (possible encoding issue)');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
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
             error.includes('NotFoundException2') ||
             error.includes('No MultiFormat Readers were able to detect the code');
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message: string }).message;
      if (message.includes('No MultiFormat Readers were able to detect the code') || 
          message.includes('NotFoundException') ||
          message.includes('NotFoundException2')) {
        return true;
      }
    }
    
    if (error && typeof error === 'object' && 'toString' in error) {
      const errorStr = error.toString();
      if (errorStr.includes('No MultiFormat Readers were able to detect the code') ||
          errorStr.includes('NotFoundException') ||
          errorStr.includes('NotFoundException2')) {
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
    const defaultId = getDefaultCameraDeviceId();
    
    const videoConstraints = defaultId ? ({ 
      deviceId: { exact: defaultId },
      width: { ideal: 1920, min: 640 },
      height: { ideal: 1080, min: 480 },
      frameRate: { ideal: 30, min: 15 }
    } as MediaTrackConstraints) : {
      width: { ideal: 1920, min: 640 },
      height: { ideal: 1080, min: 480 },
      frameRate: { ideal: 30, min: 15 }
    };
    
    const formats = [
      BarcodeStringFormat.CODE_128,
      BarcodeStringFormat.CODE_39,
      BarcodeStringFormat.EAN_13,
      BarcodeStringFormat.EAN_8,
      BarcodeStringFormat.UPC_A,
      BarcodeStringFormat.UPC_E,
      BarcodeStringFormat.QR_CODE
    ];
    
    return React.createElement(BarcodeScannerComponent, {
      width,
      height,
      delay: 100, // Balanced delay for Code 128 detection accuracy
      facingMode: defaultId ? undefined : 'environment',
      videoConstraints,
      formats,
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