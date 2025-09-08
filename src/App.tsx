import {useState} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import type {RootState} from './store'
import {logout} from './store'
import {useLogoutMutation} from './store/api/authApi'
import ProtectedRoute from './components/ProtectedRoute'
import RepairsList from './components/RepairsList'
import RepairModal from './components/RepairModal'
import ReportsModal from './components/ReportsModal'
import Modal from './components/Modal'
import DebugModal from './components/DebugModal'
import PWAInstaller from './components/PWAInstaller'
import ConnectionStatus from './components/ConnectionStatus'
import OfflineNotification from './components/OfflineNotification'
import {useConnectionStatus} from './hooks/useConnectionStatus'
import './App.css'

function App() {
    const [showRepairModal, setShowRepairModal] = useState(false)
    const [showReportsModal, setShowReportsModal] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [showDebugModal, setShowDebugModal] = useState(false)
    const {user, refreshToken} = useSelector((state: RootState) => state.auth)
    const {isOnline} = useConnectionStatus()
    const dispatch = useDispatch()
    const [logoutMutation] = useLogoutMutation()

    // Debug modal trigger logic
    const handleDebugClick = () => {
        setShowDebugModal(true)
    }

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
                await logoutMutation({refreshToken}).unwrap()
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
            <PWAInstaller>
                <OfflineNotification/>
                <div className="App">
                    <header className="app-header">
                        <div className="header-left">
                            <h1>🔧 Система Ремонтов</h1>
                            <span
                                className="user-welcome"
                                onClick={handleDebugClick}
                            >
              Добро пожаловать, <strong>{user?.full_name}</strong> ({user?.role})
            </span>
                        </div>
                        <div className="header-actions">
                            <ConnectionStatus/>
                            <button
                                className="add-repair-btn"
                                onClick={() => setShowRepairModal(true)}
                                disabled={!isOnline}
                            >
                                Добавить Ремонт
                            </button>
                            <button
                                className="reports-btn"
                                onClick={() => setShowReportsModal(true)}
                                disabled={!isOnline}
                            >
                                📊 Отчеты
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
                        <div className="repairs-section">
                            <RepairsList/>
                        </div>
                    </main>
                </div>

                {/* Repair Modal for creating new repairs */}
                <RepairModal
                    isOpen={showRepairModal}
                    onSuccess={() => setShowRepairModal(false)}
                    onCancel={() => setShowRepairModal(false)}
                />

                {/* Reports Modal */}
                <ReportsModal
                    isOpen={showReportsModal}
                    onClose={() => setShowReportsModal(false)}
                />

                {/* Debug Modal */}
                <DebugModal
                    isOpen={showDebugModal}
                    onClose={() => setShowDebugModal(false)}
                />

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
            </PWAInstaller>
        </ProtectedRoute>
    )
}

export default App
