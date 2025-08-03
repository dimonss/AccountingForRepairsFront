import type { ReactElement } from 'react'

export interface IScannerService {
  startScanning(): Promise<void>
  stopScanning(): void
  isSupported(): boolean
  getSupportedFormats(): string[]
  setCallbacks(onResult: (result: IScanResult) => void, onError: (error: IScannerError) => void): void
  renderScanner(width: string, height: string): ReactElement
}

export interface IScanResult {
  text: string
  format: string
  timestamp: Date
}

export interface IScannerError {
  code: string
  message: string
  isRecoverable: boolean
} 