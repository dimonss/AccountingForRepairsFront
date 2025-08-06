import { useState } from 'react'
import { useCreateRepairMutation, useUploadRepairPhotosMutation } from '../store/api/repairsApi'
import type { Repair, RepairPhoto } from '../store/api/repairsApi'
import { BarcodeScanner } from './BarcodeScanner'
import { PhotoUpload } from './PhotoUpload'

interface RepairFormProps {
  onSuccess: () => void
}

const RepairForm = ({ onSuccess }: RepairFormProps) => {
  const [createRepair, { isLoading }] = useCreateRepairMutation()
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
    estimated_cost: 0,
    notes: '',
    photos: []
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_cost' ? parseFloat(value) || 0 : value
    }))
  }

  const handleBarcodeScanned = (scannedCode: string) => {
    setFormData(prev => ({
      ...prev,
      serial_number: scannedCode
    }))
    setShowBarcodeScanner(false)
  }

  const handleOpenScanner = () => {
    setShowBarcodeScanner(true)
  }

  const handleCloseScanner = () => {
    setShowBarcodeScanner(false)
  }

  const handlePhotosChange = (photos: RepairPhoto[]) => {
    setFormData(prev => ({
      ...prev,
      photos
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Create repair without photos first
      const { photos, ...repairData } = formData
      const result = await createRepair(repairData).unwrap()
      
      // Upload photos if any exist and repair was created successfully
      if (photos && photos.length > 0 && result.data?.id) {
        try {
          await uploadPhotos({ repairId: result.data.id, photos }).unwrap()
        } catch (photoError) {
          console.error('Failed to upload photos:', photoError)
          // Don't fail the whole operation if photo upload fails
        }
      }
      
      onSuccess()
      // Reset form
      setFormData({
        device_type: '',
        brand: '',
        model: '',
        serial_number: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        issue_description: '',
        estimated_cost: 0,
        notes: '',
        photos: []
      })
    } catch (error) {
      console.error('Failed to create repair:', error)
    }
  }

  return (
    <div className="repair-form">
      <h2>Добавить Новый Ремонт</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
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

          <div className="form-group">
            <label htmlFor="estimated_cost">Предварительная Стоимость (₽)</label>
            <input
              type="number"
              id="estimated_cost"
              name="estimated_cost"
              value={formData.estimated_cost}
              onChange={handleChange}
              step="0.01"
              min="0"
            />
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
            rows={4}
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
            maxPhotos={8}
            disabled={isLoading}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? 'Создание...' : 'Создать Ремонт'}
          </button>
        </div>
      </form>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={handleCloseScanner}
        onScan={handleBarcodeScanned}
      />
    </div>
  )
}

export default RepairForm 