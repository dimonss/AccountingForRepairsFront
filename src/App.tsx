import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from './store/store'
import { logout } from './store/authSlice'
import { useLogoutMutation } from './store/api/authApi'
import ProtectedRoute from './components/ProtectedRoute'
import RepairsList from './components/RepairsList'
import RepairForm from './components/RepairForm'
import Modal from './components/Modal'
import './App.css'

function App() {
  const [showForm, setShowForm] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { user, refreshToken } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const [logoutMutation] = useLogoutMutation()

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleCancelLogout = () => {
    setShowLogoutModal(false)
  }

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false)
    try {
      // Call logout API to revoke refresh token
      if (refreshToken) {
        await logoutMutation({ refreshToken }).unwrap()
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear local state regardless of API call result
      dispatch(logout())
    }
  }

  return (
    <ProtectedRoute>
      <div className="App">
        <header className="app-header">
          <div className="header-left">
            <h1>🔧 Система Ремонтов</h1>
            <span className="user-welcome">
              Добро пожаловать, <strong>{user?.full_name}</strong> ({user?.role})
            </span>
          </div>
          <div className="header-actions">
            <button 
              className="add-repair-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Отмена' : 'Добавить Ремонт'}
            </button>
            <button 
              className="logout-btn"
              onClick={handleLogoutClick}
            >
              🚪 Выход
            </button>

          </div>
        </header>
        <main className="app-main">
          {showForm && (
            <div className="form-section">
              <RepairForm onSuccess={() => setShowForm(false)} />
            </div>
          )}
          <div className="repairs-section">
            <RepairsList />
          </div>
        </main>
      </div>
      <Modal
        isOpen={showLogoutModal}
        onClose={handleCancelLogout}
        title="Подтверждение выхода"
      >
        <div className="logout-confirmation">
          <p>Вы уверены, что хотите выйти из системы?</p>

          <div className="modal-actions">
            <button 
              className="cancel-btn"
              onClick={handleCancelLogout}
            >
              Отмена
            </button>
            <button 
              className="confirm-logout-btn"
              onClick={handleConfirmLogout}
            >
              Выйти
            </button>
          </div>
        </div>
      </Modal>
    </ProtectedRoute>
  )
}

export default App
