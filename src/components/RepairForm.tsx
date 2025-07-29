import { useState } from 'react'
import { useCreateRepairMutation } from '../store/api/repairsApi'
import type { Repair } from '../store/api/repairsApi'

interface RepairFormProps {
  onSuccess: () => void
}

const RepairForm = ({ onSuccess }: RepairFormProps) => {
  const [createRepair, { isLoading }] = useCreateRepairMutation()
  
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
    notes: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_cost' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createRepair(formData).unwrap()
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
        notes: ''
      })
    } catch (error) {
      console.error('Failed to create repair:', error)
    }
  }

  return (
    <div className="repair-form">
      <h2>Add New Repair</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="device_type">Device Type *</label>
            <select
              id="device_type"
              name="device_type"
              value={formData.device_type}
              onChange={handleChange}
              required
            >
              <option value="">Select device type</option>
              <option value="smartphone">Smartphone</option>
              <option value="tablet">Tablet</option>
              <option value="laptop">Laptop</option>
              <option value="desktop">Desktop</option>
              <option value="printer">Printer</option>
              <option value="monitor">Monitor</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="brand">Brand *</label>
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
            <label htmlFor="model">Model *</label>
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
            <label htmlFor="serial_number">Serial Number</label>
            <input
              type="text"
              id="serial_number"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="client_name">Client Name *</label>
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
            <label htmlFor="client_phone">Client Phone *</label>
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
            <label htmlFor="client_email">Client Email</label>
            <input
              type="email"
              id="client_email"
              name="client_email"
              value={formData.client_email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="estimated_cost">Estimated Cost ($)</label>
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
          <label htmlFor="issue_description">Issue Description *</label>
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
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? 'Creating...' : 'Create Repair'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RepairForm 