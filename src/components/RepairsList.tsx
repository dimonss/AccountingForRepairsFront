import { useState } from 'react'
import { useGetRepairsQuery, useDeleteRepairMutation, useUpdateRepairStatusMutation } from '../store/api/repairsApi'
import type { Repair } from '../store/api/repairsApi'
import Modal from './Modal'

const RepairsList = () => {
  const { data: repairsResponse, error, isLoading } = useGetRepairsQuery()
  const [deleteRepair] = useDeleteRepairMutation()
  const [updateRepairStatus] = useUpdateRepairStatusMutation()
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [repairToDelete, setRepairToDelete] = useState<Repair | null>(null)

  const repairs = repairsResponse?.data || []

  const handleDeleteClick = (repair: Repair) => {
    setRepairToDelete(repair)
    setShowDeleteModal(true)
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

  if (isLoading) return <div className="loading">Загрузка ремонтов...</div>
  if (error) return <div className="error">Ошибка загрузки ремонтов</div>

  return (
    <div className="repairs-list">
      <h2>Список Ремонтов</h2>
      {repairs.length === 0 ? (
        <p className="no-repairs">Ремонты не найдены. Добавьте первый ремонт!</p>
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
                <p><strong>Проблема:</strong> {repair.issue_description}</p>
                {repair.estimated_cost && <p><strong>Предварительная стоимость:</strong> {repair.estimated_cost}₽</p>}
                {repair.actual_cost && <p><strong>Фактическая стоимость:</strong> {repair.actual_cost}₽</p>}
                {repair.notes && <p><strong>Заметки:</strong> {repair.notes}</p>}
                <p><strong>Создано:</strong> {new Date(repair.created_at || '').toLocaleDateString('ru-RU')}</p>
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
    </div>
  )
}

export default RepairsList 