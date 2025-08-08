import { useState, useMemo, useEffect } from 'react'
import { useGetRepairsQuery, useDeleteRepairMutation, useUpdateRepairStatusMutation } from '../store/api/repairsApi'
import type { Repair, RepairPhoto, SearchParams } from '../store/api/repairsApi'
import Modal from './Modal'
import RepairModal from './RepairModal'
import { BarcodeScanner } from './BarcodeScanner'
import { PhotoGallery } from './PhotoGallery'

const RepairsList = () => {
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState<string>('')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('repairsCurrentPage')
    return saved ? parseInt(saved, 10) : 1
  })
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('repairsPageSize')
    return saved ? parseInt(saved, 10) : 25
  })
  
  // Debounce search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchFilter(searchFilter)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchFilter])
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchFilter, statusFilter])
  
  // Save page size to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('repairsPageSize', pageSize.toString())
  }, [pageSize])
  
  // Save current page to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('repairsCurrentPage', currentPage.toString())
  }, [currentPage])
  
  // Search params for API
  const searchParams: SearchParams = useMemo(() => ({
    search: debouncedSearchFilter.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page: currentPage,
    limit: pageSize,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  }), [debouncedSearchFilter, statusFilter, currentPage, pageSize])
  
  const { data: repairsResponse, error, isLoading } = useGetRepairsQuery(searchParams)
  const [deleteRepair] = useDeleteRepairMutation()
  const [updateRepairStatus] = useUpdateRepairStatusMutation()
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [repairToDelete, setRepairToDelete] = useState<Repair | null>(null)
  
  // Edit form state
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null)
  
  // Photo gallery state
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState<RepairPhoto[]>([])
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)

  // Get repairs array from response
  const repairs = repairsResponse?.data || []
  const pagination = repairsResponse?.pagination

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
    setShowRepairModal(true)
  }

  const handleEditSuccess = () => {
    setShowRepairModal(false)
    setRepairToEdit(null)
  }

  const handleEditCancel = () => {
    setShowRepairModal(false)
    setRepairToEdit(null)
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1)
    }
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
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Имя, телефон, email, серийный номер, номер ремонта..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="search-input"
            />
            <button
              type="button"
              onClick={handleOpenScanner}
              className="scanner-btn"
              title="Сканировать штрихкод"
            >
              📷
            </button>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="in_progress">В работе</option>
            <option value="waiting_parts">Ожидание запчастей</option>
            <option value="completed">Завершен</option>
            <option value="cancelled">Отменен</option>
          </select>
          
          {(statusFilter !== 'all' || searchFilter) && (
            <button onClick={handleClearFilters} className="clear-filters-btn">
              Очистить фильтры
            </button>
          )}
        </div>
        
        <div className="repairs-stats">
          <span>Всего: {pagination?.totalWithoutFilters || pagination?.total || 0}</span>
          {(statusFilter !== 'all' || searchFilter) && pagination?.total !== pagination?.totalWithoutFilters && (
            <span>Найдено: {pagination?.total || 0}</span>
          )}
          {pagination && pagination.totalPages > 1 && (
            <span>Страница {pagination.page} из {pagination.totalPages}</span>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="loading-indicator">
          <p>Загрузка ремонтов...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>Ошибка загрузки ремонтов: {(error as { data?: { error?: string } })?.data?.error || 'Неизвестная ошибка'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {repairs.length === 0 ? (
            <div className="no-repairs">
              {searchFilter || statusFilter !== 'all' ? (
                <p>По заданным фильтрам ничего не найдено. Попробуйте изменить критерии поиска.</p>
              ) : (
                <p>Ремонты не найдены. Добавьте первый ремонт!</p>
              )}
            </div>
          ) : (
            <div className="repairs-grid">
              {repairs.map((repair: Repair) => (
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

      {/* Pagination Component */}
      {!isLoading && !error && repairs.length > 0 && pagination && pagination.totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Показано {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total} записей
            </span>
            <div className="page-size-selector">
              <label htmlFor="pageSize">Записей на странице:</label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          
          <div className="pagination-controls">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="pagination-btn prev-btn"
            >
              ← Предыдущая
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`pagination-btn page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage === pagination.totalPages}
              className="pagination-btn next-btn"
            >
              Следующая →
            </button>
          </div>
        </div>
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
        <RepairModal 
          repair={repairToEdit}
          isOpen={showRepairModal}
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