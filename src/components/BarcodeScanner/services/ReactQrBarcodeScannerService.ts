import React from 'react'
import BarcodeScannerComponent from 'react-qr-barcode-scanner'
import type { IScannerService, IScanResult, IScannerError } from '../interfaces/IScannerService'

// Интерфейс для результата от библиотеки react-qr-barcode-scanner
interface BarcodeScannerResult {
  getText?: () => string
  getFormat?: () => string
  text?: string
  format?: string
}

export class ReactQrBarcodeScannerService implements IScannerService {
  private onResult?: (result: IScanResult) => void
  private onError?: (error: IScannerError) => void

  async startScanning(): Promise<void> {
  }

  stopScanning(): void {
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 
           !!navigator.mediaDevices && 
           !!navigator.mediaDevices.getUserMedia
  }

  getSupportedFormats(): string[] {
    return ['QR_CODE', 'CODE_128', 'CODE_39', 'EAN_13', 'EAN_8', 'UPC_A', 'UPC_E']
  }

  setCallbacks(onResult: (result: IScanResult) => void, onError: (error: IScannerError) => void): void {
    this.onResult = onResult
    this.onError = onError
  }

  private handleScanResult(result: BarcodeScannerResult | string): void {
    if (!result || !this.onResult) return

    const scanResult: IScanResult = {
      text: typeof result === 'string' ? result : (result.getText ? result.getText() : result.text || ''),
      format: typeof result === 'string' ? 'UNKNOWN' : (result.getFormat ? result.getFormat() : result.format || 'UNKNOWN'),
      timestamp: new Date()
    }

    this.onResult(scanResult)
  }

  private handleScanError(error: unknown): void {
    if (!this.onError) return

    // Игнорируем NotFoundException - это нормально когда код не найден в кадре
    if (this.isNotFoundException(error)) {
      return
    }

    const scannerError: IScannerError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      isRecoverable: this.isRecoverableError(error)
    }

    this.onError(scannerError)
  }

  private isNotFoundException(error: unknown): boolean {
    if (error && typeof error === 'object' && 'name' in error) {
      const errorName = (error as { name: string }).name
      return errorName === 'NotFoundException' || errorName === 'NotFoundException2'
    }
    
    if (typeof error === 'string') {
      return error.includes('NotFoundException')
    }
    
    return false
  }

  private getErrorCode(error: unknown): string {
    if (error && typeof error === 'object' && 'name' in error) {
      return (error as { name: string }).name
    }
    return 'UNKNOWN_ERROR'
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message
    }
    
    return 'Неизвестная ошибка сканирования'
  }

  private isRecoverableError(error: unknown): boolean {
    const errorCode = this.getErrorCode(error)
    return !['NotFoundException', 'NotFoundException2'].includes(errorCode)
  }

  renderScanner(width: string, height: string): React.ReactElement {
    return React.createElement(BarcodeScannerComponent, {
      width,
      height,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onUpdate: (err: unknown, result: any) => {
        if (result) {
          this.handleScanResult(result)
        } else if (err) {
          this.handleScanError(err)
        }
      },
      onError: this.handleScanError.bind(this)
    })
  }
} 