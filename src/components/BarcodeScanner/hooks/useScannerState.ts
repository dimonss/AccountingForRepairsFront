import { useState, useCallback } from 'react'
import type { IScanResult, IScannerError } from '../interfaces/IScannerService'

export type ScanStatus = 'idle' | 'searching' | 'found' | 'error'

export interface ScannerState {
  isScanning: boolean
  scanStatus: ScanStatus
  error: IScannerError | null
  lastResult: IScanResult | null
}

export const useScannerState = () => {
  const [state, setState] = useState<ScannerState>({
    isScanning: false,
    scanStatus: 'idle',
    error: null,
    lastResult: null
  })

  const startScanning = useCallback(() => {
    setState(prev => ({
      ...prev,
      isScanning: true,
      scanStatus: 'searching',
      error: null,
      lastResult: null
    }))
  }, [])

  const stopScanning = useCallback(() => {
    setState(prev => ({
      ...prev,
      isScanning: false,
      scanStatus: 'idle'
    }))
  }, [])

  const handleScanResult = useCallback((result: IScanResult) => {
    setState(prev => ({
      ...prev,
      scanStatus: 'found',
      lastResult: result
    }))
  }, [])

  const handleScanError = useCallback((error: IScannerError) => {
    setState(prev => ({
      ...prev,
      scanStatus: 'error',
      error
    }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      scanStatus: 'searching'
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isScanning: false,
      scanStatus: 'idle',
      error: null,
      lastResult: null
    })
  }, [])

  return {
    state,
    startScanning,
    stopScanning,
    handleScanResult,
    handleScanError,
    clearError,
    reset
  }
} 