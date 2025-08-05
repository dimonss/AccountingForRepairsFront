import React, { useState, useEffect, useCallback } from 'react';
import type { RepairPhoto } from '../store/api/repairsApi';
import Modal from './Modal';
import './PhotoGallery.css';

interface PhotoGalleryProps {
  photos: RepairPhoto[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  isOpen,
  onClose,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext(); 
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, onClose]);

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Галерея фотографий">
      <div className="photo-gallery">
        <div className="gallery-main">
          <div className="main-photo">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || currentPhoto.filename}
            />
            
            {photos.length > 1 && (
              <>
                <button
                  className="nav-btn nav-prev"
                  onClick={goToPrevious}
                  disabled={photos.length <= 1}
                >
                  ❮
                </button>
                <button
                  className="nav-btn nav-next"
                  onClick={goToNext}
                  disabled={photos.length <= 1}
                >
                  ❯
                </button>
              </>
            )}
          </div>

          <div className="photo-info">
            <div className="photo-counter">
              {currentIndex + 1} из {photos.length}
            </div>
            {currentPhoto.caption && (
              <div className="photo-caption">
                {currentPhoto.caption}
              </div>
            )}
            <div className="photo-filename">
              {currentPhoto.filename}
            </div>
            {currentPhoto.uploaded_at && (
              <div className="photo-date">
                Загружено: {new Date(currentPhoto.uploaded_at).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>
        </div>

        {photos.length > 1 && (
          <div className="gallery-thumbnails">
            {photos.map((photo, index) => (
              <div
                key={index}
                className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToIndex(index)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || photo.filename}
                  title={photo.caption || photo.filename}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}; 