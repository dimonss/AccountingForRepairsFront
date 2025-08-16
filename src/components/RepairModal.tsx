import {useState, useEffect} from 'react'
import {useCreateRepairMutation, useUpdateRepairMutation, useUploadRepairPhotosMutation} from '../store/api/repairsApi'
import type {Repair, RepairPhoto} from '../store/api/repairsApi'
import Modal from './Modal'
import {BarcodeScanner} from './BarcodeScanner'
import {PhotoUpload} from './PhotoUpload'
import './RepairModal.css'

interface RepairModalProps {
    repair?: Repair // undefined for create, defined for edit
    isOpen: boolean
    onSuccess: () => void
    onCancel: () => void
}

const RepairModal = ({repair, isOpen, onSuccess, onCancel}: RepairModalProps) => {
    const [createRepair, {isLoading: isCreating}] = useCreateRepairMutation()
    const [updateRepair, {isLoading: isUpdating}] = useUpdateRepairMutation()
    const [uploadPhotos] = useUploadRepairPhotosMutation()
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
    const [scanningField, setScanningField] = useState<'serial_number' | 'repair_number' | null>(null)

    const isEditMode = !!repair
    const isLoading = isCreating || isUpdating

    const [formData, setFormData] = useState<Partial<Repair>>({
        device_type: '',
        brand: '',
        model: '',
        serial_number: '',
        repair_number: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        issue_description: '',
        repair_status: 'pending',
        estimated_cost: 0,
        actual_cost: 0,
        notes: '',
        photos: []
    })

    // Pre-populate form with existing repair data for edit mode
    useEffect(() => {
        if (repair && isEditMode) {
            setFormData({
                device_type: repair.device_type || '',
                brand: repair.brand || '',
                model: repair.model || '',
                serial_number: repair.serial_number || '',
                repair_number: repair.repair_number || '',
                client_name: repair.client_name || '',
                client_phone: repair.client_phone || '',
                client_email: repair.client_email || '',
                issue_description: repair.issue_description || '',
                repair_status: repair.repair_status || 'pending',
                estimated_cost: repair.estimated_cost || 0,
                actual_cost: repair.actual_cost || 0,
                notes: repair.notes || '',
                photos: repair.photos || []
            })
        } else if (!isEditMode) {
            // Reset form for create mode
            setFormData({
                device_type: '',
                brand: '',
                model: '',
                serial_number: '',
                repair_number: '',
                client_name: '',
                client_phone: '',
                client_email: '',
                issue_description: '',
                repair_status: 'pending',
                estimated_cost: 0,
                actual_cost: 0,
                notes: '',
                photos: []
            })
        }
    }, [repair, isEditMode])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value} = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'estimated_cost' || name === 'actual_cost'
                ? parseFloat(value) || 0
                : value
        }))
    }

    const handleBarcodeScanned = (scannedCode: string) => {
        if (scanningField) {
            setFormData(prev => ({
                ...prev,
                [scanningField]: scannedCode
            }))
        }
        setShowBarcodeScanner(false)
        setScanningField(null)
    }

    const handleOpenScanner = (field: 'serial_number' | 'repair_number') => {
        setScanningField(field)
        setShowBarcodeScanner(true)
    }

    const handleCloseScanner = () => {
        setShowBarcodeScanner(false)
        setScanningField(null)
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
            const {photos, ...repairData} = formData

            if (isEditMode && repair?.id) {
                // Update existing repair
                await updateRepair({
                    id: repair.id,
                    repair: repairData
                }).unwrap()

                // Handle photos separately - upload new ones
                if (photos && photos.length > 0) {
                    const newPhotos = photos.filter(photo => !photo.id || photo.url.startsWith('data:'))
                    if (newPhotos.length > 0) {
                        try {
                            await uploadPhotos({repairId: repair.id, photos: newPhotos}).unwrap()
                        } catch (photoError) {
                            console.error('Failed to upload new photos:', photoError)
                        }
                    }
                }
            } else {
                // Create new repair
                const result = await createRepair(repairData).unwrap()

                // Upload photos if any exist and repair was created successfully
                if (photos && photos.length > 0 && result.data?.id) {
                    try {
                        await uploadPhotos({repairId: result.data.id, photos}).unwrap()
                    } catch (photoError) {
                        console.error('Failed to upload photos:', photoError)
                        // Don't fail the whole operation if photo upload fails
                    }
                }
            }

            onSuccess()
        } catch (error) {
            console.error(`Failed to ${isEditMode ? 'update' : 'create'} repair:`, error)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onCancel}>
            <div className="repair-modal">
                <h2>{isEditMode ? 'Редактировать ремонт' : 'Добавить новый ремонт'}</h2>
                
                <form onSubmit={handleSubmit} className="repair-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="device_type">Тип устройства *</label>
                            <select
                                id="device_type"
                                name="device_type"
                                value={formData.device_type}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Выберите тип устройства</option>
                                <option value="autonomous_heater">Автономный отопитель</option>
                                <option value="refrigerator">Холодильник</option>
                                <option value="pump">Насос</option>
                                <option value="radio">Рация</option>
                                <option value="monitor">Монитор</option>
                                <option value="other">Другое</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="brand">Бренд *</label>
                            <select
                                id="brand"
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Выберите бренд</option>
                                <option value="webasto">Webasto</option>
                                <option value="eberspacher">Eberspacher</option>
                                <option value="planar">Планар</option>
                                <option value="china">Китай</option>
                                <option value="teplostar">Теплостар</option>
                                <option value="sputnik">Спутник</option>
                                <option value="binar">Бинар</option>
                                <option value="other">Другое</option>
                            </select>
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
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="serial_number">Серийный номер</label>
                            <div className="input-with-scanner">
                                <input
                                    type="text"
                                    id="serial_number"
                                    name="serial_number"
                                    value={formData.serial_number}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="barcode-scan-btn"
                                    onClick={() => handleOpenScanner('serial_number')}
                                >
                                    📷
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="repair_number">Номер ремонта</label>
                            <div className="input-with-scanner">
                                <input
                                    type="text"
                                    id="repair_number"
                                    name="repair_number"
                                    value={formData.repair_number}
                                    onChange={handleChange}
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    title="Номер ремонта должен содержать 6 цифр"
                                />
                                <button
                                    type="button"
                                    className="barcode-scan-btn"
                                    onClick={() => handleOpenScanner('repair_number')}
                                >
                                    📷
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="client_name">Имя клиента *</label>
                            <input
                                type="text"
                                id="client_name"
                                name="client_name"
                                value={formData.client_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="client_phone">Телефон клиента *</label>
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
                            <label htmlFor="client_email">Email клиента</label>
                            <input
                                type="email"
                                id="client_email"
                                name="client_email"
                                value={formData.client_email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="estimated_cost">Предварительная стоимость</label>
                            <input
                                type="number"
                                id="estimated_cost"
                                name="estimated_cost"
                                value={formData.estimated_cost}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div className="form-row single">
                        <div className="form-group">
                            <label htmlFor="issue_description">Описание проблемы *</label>
                            <textarea
                                id="issue_description"
                                name="issue_description"
                                value={formData.issue_description}
                                onChange={handleChange}
                                required
                                rows={3}
                            />
                        </div>
                    </div>

                    {isEditMode && (
                        <div className="form-row double">
                            <div className="form-group">
                                <label htmlFor="repair_status">Статус ремонта</label>
                                <select
                                    id="repair_status"
                                    name="repair_status"
                                    value={formData.repair_status}
                                    onChange={handleChange}
                                >
                                    <option value="pending">Ожидает</option>
                                    <option value="in_progress">В работе</option>
                                    <option value="waiting_parts">Ожидание запчастей</option>
                                    <option value="completed">Завершен</option>
                                    <option value="cancelled">Отменен</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="actual_cost">Фактическая стоимость</label>
                                <input
                                    type="number"
                                    id="actual_cost"
                                    name="actual_cost"
                                    value={formData.actual_cost}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-row single">
                        <div className="form-group">
                            <label htmlFor="notes">Примечания</label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="form-row single">
                        <div className="form-group">
                            <label>Фотографии</label>
                            <PhotoUpload
                                photos={formData.photos || []}
                                onPhotosChange={handlePhotosChange}
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-secondary"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Создать')}
                        </button>
                    </div>
                </form>

                {showBarcodeScanner && (
                    <BarcodeScanner
                        isOpen={showBarcodeScanner}
                        onScan={handleBarcodeScanned}
                        onClose={handleCloseScanner}
                    />
                )}
            </div>
        </Modal>
    )
}

export default RepairModal 