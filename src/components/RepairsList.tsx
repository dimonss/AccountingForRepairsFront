import { useState, useMemo } from 'react'
import { useGetRepairsQuery, useDeleteRepairMutation, useUpdateRepairStatusMutation } from '../store/api/repairsApi'
import type { Repair, RepairPhoto } from '../store/api/repairsApi'
import Modal from './Modal'
import RepairEditForm from './RepairEditForm'
import { BarcodeScanner } from './BarcodeScanner'
import { PhotoGallery } from './PhotoGallery'

const RepairsList = () => {
  const { data: repairsResponse, error, isLoading } = useGetRepairsQuery()
  const [deleteRepair] = useDeleteRepairMutation()
  const [updateRepairStatus] = useUpdateRepairStatusMutation()
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [repairToDelete, setRepairToDelete] = useState<Repair | null>(null)
  
  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false)
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null)
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  
  // Photo gallery state
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState<RepairPhoto[]>([])
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)

  // Memoize repairs array to prevent recreating on each render
  const repairs = useMemo(() => {
    return repairsResponse?.data || []
  }, [repairsResponse?.data])

  // Filtered repairs using useMemo for performance
  const filteredRepairs = useMemo(() => {
    return repairs.filter((repair: Repair) => {
      // Status filter
      const statusMatch = statusFilter === 'all' || repair.repair_status === statusFilter
      
      // Search filter (client name, phone, email, serial number, repair number)
      const searchTerm = searchFilter.toLowerCase().trim()
      const searchMatch = !searchTerm || 
        repair.client_name.toLowerCase().includes(searchTerm) ||
        repair.client_phone.toLowerCase().includes(searchTerm) ||
        (repair.client_email && repair.client_email.toLowerCase().includes(searchTerm)) ||
        (repair.serial_number && repair.serial_number.toLowerCase().includes(searchTerm)) ||
        (repair.repair_number && repair.repair_number.toLowerCase().includes(searchTerm))
      
      return statusMatch && searchMatch
    })
  }, [repairs, statusFilter, searchFilter])

  const handleClearFilters = () => {
    setStatusFilter('all')
    setSearchFilter('')
  }

  const handleBarcodeScanned = (scannedCode: string) => {
    setSearchFilter(scannedCode)
    setShowBarcodeScanner(false)
  }

  const handlePhotoClick = (photos: RepairPhoto[], initialIndex: number) => {
    setGalleryPhotos(photos)
    setGalleryInitialIndex(initialIndex)
    setShowPhotoGallery(true)
  }

  const handleClosePhotoGallery = () => {
    setShowPhotoGallery(false)
    setGalleryPhotos([])
    setGalleryInitialIndex(0)
  }

  const handleOpenScanner = () => {
    setShowBarcodeScanner(true)
  }

  const handleCloseScanner = () => {
    setShowBarcodeScanner(false)
  }

  const handleDeleteClick = (repair: Repair) => {
    setRepairToDelete(repair)
    setShowDeleteModal(true)
  }

  const handleEditClick = (repair: Repair) => {
    setRepairToEdit(repair)
    setShowEditForm(true)
  }

  const handleEditSuccess = () => {
    setShowEditForm(false)
    setRepairToEdit(null)
  }

  const handleEditCancel = () => {
    setShowEditForm(false)
    setRepairToEdit(null)
  }

  const handleConfirmDelete = async () => {
    if (!repairToDelete) return
    
    try {
      await deleteRepair(repairToDelete.id!).unwrap()
      setShowDeleteModal(false)
      setRepairToDelete(null)
    } catch (error) {
      console.error('Failed to delete repair:', error)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setRepairToDelete(null)
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateRepairStatus({ id, status: newStatus }).unwrap()
    } catch (error) {
      console.error('Failed to update repair status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f39c12'
      case 'in_progress': return '#3498db'
      case 'waiting_parts': return '#e74c3c'
      case 'completed': return '#27ae60'
      case 'cancelled': return '#95a5a6'
      default: return '#f39c12'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'ОЖИДАЕТ'
      case 'in_progress': return 'В РАБОТЕ'
      case 'waiting_parts': return 'ОЖИДАНИЕ ЗАПЧАСТЕЙ'
      case 'completed': return 'ЗАВЕРШЁН'
      case 'cancelled': return 'ОТМЕНЁН'
      default: return status.replace('_', ' ').toUpperCase()
    }
  }

  return (
    <div className="repairs-list">
      <div className="repairs-header">
        <h2>Список Ремонтов</h2>
        <div className="repairs-stats">
          <span>Всего: {repairs.length}</span>
          {(statusFilter !== 'all' || searchFilter) && (
            <span>Найдено: {filteredRepairs.length}</span>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <div className="filters-panel">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="status-filter">Статус:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все статусы</option>
              <option value="pending">Ожидает</option>
              <option value="in_progress">В работе</option>
              <option value="waiting_parts">Ожидание запчастей</option>
              <option value="completed">Завершён</option>
              <option value="cancelled">Отменён</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search-filter">Поиск:</label>
            <div className="search-input-container">
              <input
                id="search-filter"
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Имя, телефон, email, серийный номер, номер ремонта..."
                className="filter-input"
              />
              <button
                type="button"
                onClick={handleOpenScanner}
                className="barcode-scan-btn"
                title="Сканировать штрих-код"
              >
                📷
              </button>
            </div>
          </div>

          {(statusFilter !== 'all' || searchFilter) && (
            <button 
              onClick={handleClearFilters}
              className="clear-filters-btn"
              title="Очистить фильтры"
            >
              ✕ Очистить
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="loading">Загрузка ремонтов...</div>}
      {error && <div className="error">Ошибка загрузки ремонтов</div>}
      
      {!isLoading && !error && (
        <>
          {filteredRepairs.length === 0 ? (
            <div className="no-repairs">
              {repairs.length === 0 ? (
                <p>Ремонты не найдены. Добавьте первый ремонт!</p>
              ) : (
                <p>По заданным фильтрам ничего не найдено. Попробуйте изменить критерии поиска.</p>
              )}
            </div>
          ) : (
            <div className="repairs-grid">
              {filteredRepairs.map((repair: Repair) => (
                <div key={repair.id} className="repair-card">
                  <div className="repair-header">
                    <h3>{repair.device_type} - {repair.brand} {repair.model}</h3>
                    <div 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(repair.repair_status) }}
                    >
                      {getStatusText(repair.repair_status)}
                    </div>
                  </div>
                  
                  <div className="repair-details">
                    <p><strong>Клиент:</strong> {repair.client_name}</p>
                    <p><strong>Телефон:</strong> {repair.client_phone}</p>
                    {repair.client_email && <p><strong>Email:</strong> {repair.client_email}</p>}
                    {repair.serial_number && <p><strong>Серийный номер:</strong> {repair.serial_number}</p>}
                    {repair.repair_number && <p><strong>Номер ремонта:</strong> {repair.repair_number}</p>}
                    <p><strong>Проблема:</strong> {repair.issue_description}</p>
                    {repair.estimated_cost && <p><strong>Предварительная стоимость:</strong> {repair.estimated_cost}₽</p>}
                    {repair.actual_cost && <p><strong>Фактическая стоимость:</strong> {repair.actual_cost}₽</p>}
                    {repair.notes && <p><strong>Заметки:</strong> {repair.notes}</p>}
                    <p><strong>Создано:</strong> {new Date(repair.created_at || '').toLocaleDateString('ru-RU')}</p>
                    
                    {repair.photos && repair.photos.length > 0 && (
                      <div className="repair-photos">
                        <p><strong>Фотографии ({repair.photos.length}):</strong></p>
                        <div className="photos-preview">
                          {repair.photos.slice(0, 3).map((photo, index) => (
                            <div 
                              key={index} 
                              className="photo-thumbnail"
                              onClick={() => handlePhotoClick(repair.photos!, index)}
                            >
                              <img 
                                src={photo.url} 
                                alt={photo.caption || photo.filename}
                                title={photo.caption || photo.filename}
                              />
                            </div>
                          ))}
                          {repair.photos.length > 3 && (
                            <div 
                              className="more-photos"
                              onClick={() => handlePhotoClick(repair.photos!, 3)}
                            >
                              +{repair.photos.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="repair-actions">
                    <select 
                      value={repair.repair_status} 
                      onChange={(e) => handleStatusChange(repair.id!, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Ожидает</option>
                      <option value="in_progress">В работе</option>
                      <option value="waiting_parts">Ожидание запчастей</option>
                      <option value="completed">Завершён</option>
                      <option value="cancelled">Отменён</option>
                    </select>
                    <button 
                      onClick={() => handleEditClick(repair)}
                      className="edit-btn"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(repair)}
                      className="delete-btn"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal 
        isOpen={showDeleteModal} 
        onClose={handleCancelDelete}
        title="Подтверждение удаления"
      >
        {repairToDelete && (
          <div className="delete-confirmation">
            <p>
              Вы уверены, что хотите удалить запись о ремонте?
            </p>
            <div className="repair-summary">
              <p><strong>Устройство:</strong> {repairToDelete.device_type} - {repairToDelete.brand} {repairToDelete.model}</p>
              <p><strong>Клиент:</strong> {repairToDelete.client_name}</p>
              <p><strong>Проблема:</strong> {repairToDelete.issue_description}</p>
              <p><strong>Статус:</strong> {getStatusText(repairToDelete.repair_status)}</p>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={handleCancelDelete}
              >
                Отмена
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={handleConfirmDelete}
              >
                Удалить
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Form */}
      {repairToEdit && (
        <RepairEditForm 
          repair={repairToEdit}
          isOpen={showEditForm}
          onSuccess={handleEditSuccess} 
          onCancel={handleEditCancel} 
        />
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={handleCloseScanner}
        onScan={handleBarcodeScanned}
      />

      {/* Photo Gallery */}
      <PhotoGallery
        photos={galleryPhotos}
        isOpen={showPhotoGallery}
        onClose={handleClosePhotoGallery}
        initialIndex={galleryInitialIndex}
      />
    </div>
  )
}

export default RepairsList 