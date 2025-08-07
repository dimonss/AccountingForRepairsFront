import React from 'react';
import Modal from './Modal';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Удалить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
        <div className="confirm-modal-header">
          <h3>{title}</h3>
        </div>
        
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        
        <div className="confirm-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="confirm-modal-btn cancel"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="confirm-modal-btn confirm"
          >
            {isLoading ? '⏳ Удаление...' : confirmText}
          </button>
        </div>
    </Modal>
  );
}; 