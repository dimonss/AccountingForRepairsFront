import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from './store/store'
import { logout } from './store/authSlice'
import ProtectedRoute from './components/ProtectedRoute'
import RepairsList from './components/RepairsList'
import RepairForm from './components/RepairForm'
import './App.css'

function App() {
  const [showForm, setShowForm] = useState(false)
  const { user } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()

  const handleLogout = () => {
    dispatch(logout())
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
              onClick={handleLogout}
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
    </ProtectedRoute>
  )
}

export default App
