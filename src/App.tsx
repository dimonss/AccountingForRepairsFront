import { useState } from 'react'
import RepairsList from './components/RepairsList'
import RepairForm from './components/RepairForm'
import './App.css'

function App() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="App">
      <header className="app-header">
        <h1>Accounting for Repairs</h1>
        <button 
          className="add-repair-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Repair'}
        </button>
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
  )
}

export default App
