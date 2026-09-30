import { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useGetRepairsQuery, useDeleteRepairMutation, useUpdateRepairStatusMutation } from '../store/api/repairsApi'
import type { Repair, RepairPhoto, SearchParams } from '../store/api/repairsApi'
import type { RootState } from '../store'
import Modal from './Modal'
import RepairModal from './RepairModal'
import { BarcodeScanner } from './BarcodeScanner'
import { PhotoGallery } from './PhotoGallery'
import { getDeviceTypeText, getBrandText, getStatusText, getStatusColor } from '../utils/displayUtils'

// Function to capitalize first letter of each word for display
const capitalizeWords = (text: string): string => {
  if (!text) return '';
  return text.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

const RepairsList = () => {
  // Connection status
  const { isOnline } = useSelector((state: RootState) => state.connection)

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
      setDebouncedSearchFilter(searchFilter.toLowerCase())
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

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const { data: repairsResponse, error, isLoading } = useGetRepairsQuery(searchParams, {
    // Don't skip queries, let RTK Query handle caching automatically
    // RTK Query will return cached data if available when offline
  })
  const [deleteRepair] = useDeleteRepairMutation()
  const [updateRepairStatus] = useUpdateRepairStatusMutation()

  // State to store last successful data for offline fallback
  const [lastSuccessfulData, setLastSuccessfulData] = useState<typeof repairsResponse | null>(null)

  // Check if we're showing cached data

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [repairToDelete, setRepairToDelete] = useState<Repair | null>(null)

  // Edit form state
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [repairToEdit, setRepairToEdit] = useState<Repair | null>(null)

  // Photo gallery state
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState<RepairPhoto[]>([])
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)

  // Save successful data for offline fallback
  useEffect(() => {
    if (repairsResponse && !error && isOnline) {
      setLastSuccessfulData(repairsResponse)
    }
  }, [repairsResponse, error, isOnline])

  // Determine which data to show
  const finalRepairsResponse = useMemo(() => {
    // If we have fresh data, use it
    if (repairsResponse && !error) {
      return repairsResponse
    }

    // If we're offline and have cached data, use it
    if (!isOnline && lastSuccessfulData) {
      return lastSuccessfulData
    }

    return repairsResponse
  }, [repairsResponse, error, isOnline, lastSuccessfulData])

  // Get repairs array from response
  const repairs = finalRepairsResponse?.data || []
  const pagination = finalRepairsResponse?.pagination

  const handleClearFilters = () => {
    setStatusFilter('all')
    setSearchFilter('')
  }

  const handleGoBack = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleBarcodeScanned = (scannedCode: string) => {
    setSearchFilter(scannedCode.replace(/[\s\u200B-\u200D\uFEFF\u202A-\u202E]/g, ''))
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

  const handleCopyClick = (repair: Repair) => {
    // Create a copy of the repair data excluding dates and photos
    const copiedRepair: Partial<Repair> = {
      device_type: repair.device_type,
      brand: repair.brand,
      model: repair.model,
      serial_number: repair.serial_number,
      repair_number: repair.repair_number,
      client_name: repair.client_name,
      client_phone: repair.client_phone,
      client_email: repair.client_email,
      issue_description: repair.issue_description,
      repair_status: 'pending', // Reset to pending for new repair
      estimated_cost: repair.estimated_cost,
      actual_cost: 0, // Reset actual cost
      notes: repair.notes,
      // Exclude: id, created_at, updated_at, created_by, photos
    }
    setRepairToEdit(copiedRepair as Repair)
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

  // Handler for clicking on field values to populate search
  const handleFieldClick = (value: string) => {
    if (value && isOnline) {
      setSearchFilter(value.replace(/[\s\u200B-\u200D\uFEFF\u202A-\u202E]/g, ''))
    }
  }

  // Handler for search filter input change (removes all spaces & invisible characters upon input)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[\s\u200B-\u200D\uFEFF\u202A-\u202E]/g, '')
    setSearchFilter(cleaned)
  }

  return (
    <div className="repairs-list">
      <div className="repairs-header">
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder={isOnline ? "Имя, телефон, номер ремонта, серийный номер, email..." : "Поиск недоступен в оффлайн режиме"}
              value={searchFilter}
              onChange={handleSearchChange}
              className="search-input"
              disabled={!isOnline}
              title={!isOnline ? "Поиск недоступен в оффлайн режиме" : ""}
            />
            <button
              type="button"
              onClick={handleOpenScanner}
              className="barcode-scan-btn"
              title={!isOnline ? "Сканирование недоступно в оффлайн режиме" : "Сканировать штрихкод"}
              disabled={!isOnline}
            >
              <span className="btn-icon">📷</span>
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
            disabled={!isOnline}
            title={!isOnline ? "Фильтры недоступны в оффлайн режиме" : ""}
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="in_progress">В работе</option>
            <option value="waiting_parts">Ожидание запчастей</option>
            <option value="completed">Завершен</option>
            <option value="issued">Выдан</option>
            <option value="cancelled">Отменен</option>
          </select>

          {(statusFilter !== 'all' || searchFilter) && (
            <button
              onClick={handleClearFilters}
              className="clear-filters-btn"
              disabled={!isOnline}
              title={!isOnline ? "Очистка фильтров недоступна в оффлайн режиме" : ""}
            >
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
          {currentPage > 1 && (
            <button
              onClick={handleGoBack}
              className="go-back-btn"
              title="Вернуться на предыдущую страницу"
            >
              ← Назад
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && (
        <>
          {repairs.length === 0 ? (
            <div className="no-repairs">
              {!isOnline ? (
                <p>Нет подключения к интернету. Данные из кэша недоступны.</p>
              ) : searchFilter || statusFilter !== 'all' ? (
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
                    <h3>{getDeviceTypeText(repair.device_type)} - {getBrandText(repair.brand)} {repair.model}</h3>
                    <div
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(repair.repair_status) }}
                    >
                      {getStatusText(repair.repair_status)}
                    </div>
                  </div>

                  <div className="repair-details">
                    <p><strong>Клиент:</strong> <span className="clickable-field" onClick={() => handleFieldClick(repair.client_name)} title="Нажмите для поиска">{capitalizeWords(repair.client_name)}</span></p>
                    <p><strong>Телефон:</strong> <span className="clickable-field" onClick={() => handleFieldClick(repair.client_phone)} title="Нажмите для поиска">{repair.client_phone}</span></p>
                    {repair.client_email && <p><strong>Email:</strong> <span className="clickable-field" onClick={() => handleFieldClick(repair.client_email!)} title="Нажмите для поиска">{repair.client_email}</span></p>}
                    {repair.serial_number && <p><strong>Серийный номер:</strong> <span className="clickable-field" onClick={() => handleFieldClick(repair.serial_number!)} title="Нажмите для поиска">{repair.serial_number}</span></p>}
                    {repair.repair_number && <p><strong>Номер ремонта:</strong> <span className="clickable-field" onClick={() => handleFieldClick(repair.repair_number!)} title="Нажмите для поиска">{repair.repair_number}</span></p>}
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
                      disabled={!isOnline}
                    >
                      <option value="pending">Ожидает</option>
                      <option value="in_progress">В работе</option>
                      <option value="waiting_parts">Ожидание запчастей</option>
                      <option value="completed">Завершён</option>
                      <option value="issued">Выдан</option>
                      <option value="cancelled">Отменён</option>
                    </select>
                    <button
                      onClick={() => handleCopyClick(repair)}
                      className="copy-btn"
                      disabled={!isOnline}
                      title={!isOnline ? "Копирование недоступно в оффлайн режиме" : "Скопировать ремонт"}
                    >
                      📋 Копировать
                    </button>
                    <button
                      onClick={() => handleEditClick(repair)}
                      className="edit-btn"
                      disabled={!isOnline}
                      title={!isOnline ? "Редактирование недоступно в оффлайн режиме" : ""}
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteClick(repair)}
                      className="delete-btn"
                      disabled={!isOnline}
                      title={!isOnline ? "Удаление недоступно в оффлайн режиме" : ""}
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
              <p><strong>Устройство:</strong> {getDeviceTypeText(repairToDelete.device_type)} - {getBrandText(repairToDelete.brand)} {repairToDelete.model}</p>
              <p><strong>Клиент:</strong> {capitalizeWords(repairToDelete.client_name)}</p>
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
          isEditMode={!!repairToEdit.id}
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