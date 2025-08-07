import React, { useState, useRef } from 'react';
import type { RepairPhoto } from '../store/api/repairsApi';
import { CameraCapture } from './CameraCapture';
import { generateUUID, compressImage, formatFileSize, getBase64Size } from '../utils/imageUtils';
import './PhotoUpload.css';

interface PhotoUploadProps {
  photos: RepairPhoto[];
  onPhotosChange: (photos: RepairPhoto[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos = [],
  onPhotosChange,
  maxPhotos = 3,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    if (disabled || photos.length >= maxPhotos) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    setIsUploading(true);
    
    const newPhotos: RepairPhoto[] = [];

    for (const file of filesToProcess) {
      if (file.type.startsWith('image/')) {
        try {
          // Читаем файл
          const originalDataURL = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                resolve(e.target.result as string);
              } else {
                reject(new Error('Failed to read file'));
              }
            };
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsDataURL(file);
          });

          const originalSize = getBase64Size(originalDataURL);
          console.log(`📁 Original file "${file.name}": ${formatFileSize(originalSize)}`);

          // Сжимаем если больше 1MB
          const compressedDataURL = originalSize > 1 * 1024 * 1024 
            ? await compressImage(file)
            : originalDataURL;

          const finalSize = getBase64Size(compressedDataURL);
          console.log(`✅ Processed file: ${formatFileSize(finalSize)}`);

          // Генерируем UUID имя файла
          const uuid = generateUUID();
          const fileExtension = file.name.split('.').pop() || 'jpg';
          const filename = `${uuid}.${fileExtension}`;

          newPhotos.push({
            url: compressedDataURL,
            filename: filename,
            uploaded_at: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to process file:', file.name, error);
        }
      }
    }

    onPhotosChange([...photos, ...newPhotos]);
    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    const updatedPhotos = photos.map((photo, i) => 
      i === index ? { ...photo, caption } : photo
    );
    onPhotosChange(updatedPhotos);
  };

  const handleOpenCamera = () => {
    setShowCamera(true);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const handleCameraCapture = (photo: RepairPhoto) => {
    onPhotosChange([...photos, photo]);
  };

  const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  const canAddMore = photos.length < maxPhotos && !disabled;

  return (
    <div className="photo-upload">
      <div className="photo-upload-header">
        <h3>Фотографии ({photos.length}/{maxPhotos})</h3>
        {canAddMore && (
          <div className="photo-actions">
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={isUploading}
              className="photo-upload-btn"
            >
              {isUploading ? '⏳ Загрузка...' : '📁 Выбрать файлы'}
            </button>
            {isCameraSupported() && (
              <button
                type="button"
                onClick={handleOpenCamera}
                disabled={isUploading}
                className="photo-camera-btn"
              >
                📷 Сделать фото
              </button>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {canAddMore && (
        <div
          className={`photo-dropzone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleButtonClick}
        >
          <div className="dropzone-content">
            {isUploading ? (
              <>
                <div className="spinner"></div>
                <p>Обработка фотографий...</p>
              </>
            ) : (
              <>
                <div className="dropzone-icon">📸</div>
                <p>Перетащите фотографии сюда или нажмите для выбора</p>
                <small>Поддерживаются JPG, PNG, GIF (макс. {maxPhotos - photos.length} фото)</small>
              </>
            )}
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="photos-grid">
          {photos.map((photo, index) => (
            <div key={index} className="photo-item">
              <div className="photo-preview">
                <img src={photo.url} alt={photo.filename} />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="photo-remove-btn"
                  disabled={disabled}
                >
                  ✕
                </button>
              </div>
              <div className="photo-info">
                <input
                  type="text"
                  placeholder="Описание фото..."
                  value={photo.caption || ''}
                  onChange={(e) => updatePhotoCaption(index, e.target.value)}
                  disabled={disabled}
                  className="photo-caption"
                />
                <small className="photo-filename">{photo.filename}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={handleCloseCamera}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}; 