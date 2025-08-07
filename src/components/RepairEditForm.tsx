import { useState, useEffect } from 'react'
import { useUpdateRepairMutation, useUploadRepairPhotosMutation } from '../store/api/repairsApi'
import type { Repair, RepairPhoto } from '../store/api/repairsApi'
import Modal from './Modal'
import { BarcodeScanner } from './BarcodeScanner'
import { PhotoUpload } from './PhotoUpload'

interface RepairEditFormProps {
  repair: Repair
  isOpen: boolean
  onSuccess: () => void
  onCancel: () => void
}

const RepairEditForm = ({ repair, isOpen, onSuccess, onCancel }: RepairEditFormProps) => {
  const [updateRepair, { isLoading }] = useUpdateRepairMutation()
  const [uploadPhotos] = useUploadRepairPhotosMutation()
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  
  const [formData, setFormData] = useState<Partial<Repair>>({
    device_type: '',
    brand: '',
    model: '',
    serial_number: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    issue_description: '',
    repair_status: 'pending',
    estimated_cost: 0,
    actual_cost: 0,
    notes: '',
    photos: []
  })

  // Pre-populate form with existing repair data
  useEffect(() => {
    if (repair) {
      setFormData({
        device_type: repair.device_type || '',
        brand: repair.brand || '',
        model: repair.model || '',
        serial_number: repair.serial_number || '',
        client_name: repair.client_name || '',
        client_phone: repair.client_phone || '',
        client_email: repair.client_email || '',
        issue_description: repair.issue_description || '',
        repair_status: repair.repair_status || 'pending',
        estimated_cost: repair.estimated_cost || 0,
        actual_cost: repair.actual_cost || 0,
        notes: repair.notes || '',
        photos: repair.photos || []
      })
    }
  }, [repair])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_cost' || name === 'actual_cost' 
        ? parseFloat(value) || 0 
        : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!repair.id) return
    
    try {
      // Update repair without photos first
      const { photos, ...repairData } = formData
      await updateRepair({ 
        id: repair.id, 
        repair: repairData 
      }).unwrap()
      
      // Handle photos separately - upload new ones
      if (photos && photos.length > 0) {
        const newPhotos = photos.filter(photo => !photo.id || photo.url.startsWith('data:'))
        if (newPhotos.length > 0) {
          try {
            await uploadPhotos({ repairId: repair.id, photos: newPhotos }).unwrap()
          } catch (photoError) {
            console.error('Failed to upload new photos:', photoError)
          }
        }
      }
      
      onSuccess()
    } catch (error) {
      console.error('Failed to update repair:', error)
    }
  }

  const handleBarcodeScanned = (scannedCode: string) => {
    setFormData(prev => ({
      ...prev,
      serial_number: scannedCode
    }))
    setShowBarcodeScanner(false)
  }

  const handlePhotosChange = (photos: RepairPhoto[]) => {
    setFormData(prev => ({
      ...prev,
      photos
    }))
  }

  const handleOpenScanner = () => {
    setShowBarcodeScanner(true)
  }

  const handleCloseScanner = () => {
    setShowBarcodeScanner(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={`Редактировать Ремонт #${repair.id}`}
    >
      <div className="repair-edit-modal-content">
        {/* Scrollable form content */}
        <div className="repair-edit-scrollable">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Основная информация об устройстве - первая строка */}
              <div className="form-group">
                <label htmlFor="device_type">Тип Устройства *</label>
                <select
                  id="device_type"
                  name="device_type"
                  value={formData.device_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите тип устройства</option>
                  <option value="smartphone">Смартфон</option>
                  <option value="tablet">Планшет</option>
                  <option value="laptop">Ноутбук</option>
                  <option value="desktop">Настольный ПК</option>
                  <option value="printer">Принтер</option>
                  <option value="monitor">Монитор</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="brand">Бренд *</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="model">Модель *</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Вторая строка - дополнительная информация и статус */}
              <div className="form-group">
                <label htmlFor="serial_number">Серийный Номер</label>
                <div className="input-with-scanner">
                  <input
                    type="text"
                    id="serial_number"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleChange}
                    placeholder="Введите или отсканируйте серийный номер"
                  />
                  <button
                    type="button"
                    className="scanner-btn"
                    onClick={handleOpenScanner}
                    title="Сканировать штрихкод"
                  >
                    📷
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="repair_status">Статус Ремонта</label>
                <select
                  id="repair_status"
                  name="repair_status"
                  value={formData.repair_status}
                  onChange={handleChange}
                >
                  <option value="pending">Ожидает</option>
                  <option value="in_progress">В работе</option>
                  <option value="waiting_parts">Ожидание запчастей</option>
                  <option value="completed">Завершён</option>
                  <option value="cancelled">Отменён</option>
                </select>
              </div>

              <div className="form-group">
                {/* Пустое место для симметрии */}
              </div>

              {/* Третья строка - информация о клиенте */}
              <div className="form-group">
                <label htmlFor="client_name">Имя Клиента *</label>
                <input
                  type="text"
                  id="client_name"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="client_phone">Телефон Клиента *</label>
                <input
                  type="tel"
                  id="client_phone"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="client_email">Email Клиента</label>
                <input
                  type="email"
                  id="client_email"
                  name="client_email"
                  value={formData.client_email}
                  onChange={handleChange}
                />
              </div>

              {/* Четвертая строка - стоимость */}
              <div className="form-group">
                <label htmlFor="estimated_cost">Предварительная Стоимость (₽)</label>
                <input
                  type="number"
                  id="estimated_cost"
                  name="estimated_cost"
                  value={formData.estimated_cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="actual_cost">Фактическая Стоимость (₽)</label>
                <input
                  type="number"
                  id="actual_cost"
                  name="actual_cost"
                  value={formData.actual_cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                {/* Пустое место */}
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="issue_description">Описание Проблемы *</label>
              <textarea
                id="issue_description"
                name="issue_description"
                value={formData.issue_description}
                onChange={handleChange}
                required
                rows={3}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Дополнительные Заметки</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="form-group full-width">
              <PhotoUpload
                photos={formData.photos || []}
                onPhotosChange={handlePhotosChange}
                maxPhotos={5}
                disabled={isLoading}
                repairId={repair.id}
              />
            </div>
          </form>
        </div>

        {/* Fixed footer with action buttons */}
        <div className="repair-edit-footer">
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onCancel}
              className="cancel-btn"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="submit-btn"
              onClick={handleSubmit}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить Изменения'}
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={handleCloseScanner}
        onScan={handleBarcodeScanned}
      />
    </Modal>
  )
}

export default RepairEditForm 