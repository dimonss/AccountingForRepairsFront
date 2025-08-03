import React from 'react'
import type { IScannerService } from '../interfaces/IScannerService'

interface ScannerViewportProps {
  scannerService: IScannerService
  isScanning: boolean
  width?: string
  height?: string
}

export const ScannerViewport: React.FC<ScannerViewportProps> = ({ 
  scannerService, 
  isScanning, 
  width = "100%", 
  height = "300px" 
}) => {
  return (
    <div className="scanner-viewport">
      {isScanning && (
        <div className="scanner-component">
          {scannerService.renderScanner(width, height)}
        </div>
      )}
      
      {/* Overlay с рамкой для наведения */}
      <div className="scanner-overlay">
        <div className="scanner-frame"></div>
      </div>
    </div>
  )
} 