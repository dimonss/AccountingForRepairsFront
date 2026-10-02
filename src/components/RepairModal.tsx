import {useState, useEffect} from 'react'
import {useSelector} from 'react-redux'
import {useCreateRepairMutation, useUpdateRepairMutation, useUploadRepairPhotosMutation, useGetNextRepairNumberMutation} from '../store/api/repairsApi'
import type {Repair, RepairPhoto} from '../store/api/repairsApi'
import type {RootState} from '../store'
import Modal from './Modal'
import {BarcodeScanner} from './BarcodeScanner'
import {PhotoUpload} from './PhotoUpload'
import {printBarcode} from '../utils/barcodePrint'
import './RepairModal.css'

interface RepairModalProps {
    repair?: Repair // undefined for create, defined for edit or copy
    isEditMode?: boolean // explicitly specify if this is edit mode
    isOpen: boolean
    onSuccess: () => void
    onCancel: () => void
}

const RepairModal = ({repair, isEditMode: explicitEditMode, isOpen, onSuccess, onCancel}: RepairModalProps) => {
    const [createRepair, {isLoading: isCreating}] = useCreateRepairMutation()
    const [updateRepair, {isLoading: isUpdating}] = useUpdateRepairMutation()
    const [uploadPhotos] = useUploadRepairPhotosMutation()
    const [getNextRepairNumber, {isLoading: isFetchingNextNumber}] = useGetNextRepairNumberMutation()
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
    const [scanningField, setScanningField] = useState<'serial_number' | 'repair_number' | null>(null)
    const { isOnline } = useSelector((state: RootState) => state.connection)

    const isEditMode = explicitEditMode ?? !!repair?.id
    const isLoading = isCreating || isUpdating

    // Function to convert text to lowercase for consistent storage
    const toLowerCase = (text: string | undefined): string => {
        if (!text) return '';
        return text.toLowerCase();
    }

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

    // Pre-populate form with existing repair data for edit mode or copied data for create mode
    useEffect(() => {
        if (repair) {
            if (isEditMode && repair.id) {
                // Edit mode - include all data including photos
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
            } else {
                // Create mode with copied data - exclude photos and reset some fields
                const repairData = repair as Repair
                setFormData({
                    device_type: repairData.device_type || '',
                    brand: repairData.brand || '',
                    model: repairData.model || '',
                    serial_number: repairData.serial_number || '',
                    repair_number: repairData.repair_number || '',
                    client_name: repairData.client_name || '',
                    client_phone: repairData.client_phone || '',
                    client_email: repairData.client_email || '',
                    issue_description: repairData.issue_description || '',
                    repair_status: 'pending', // Always start with pending for new repairs
                    estimated_cost: repairData.estimated_cost || 0,
                    actual_cost: 0, // Reset actual cost for new repairs
                    notes: repairData.notes || '',
                    photos: [] // No photos for copied repairs
                })
            }
        } else {
            // Reset form for create mode without copied data
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
        let finalValue: any = value;
        if (name === 'estimated_cost' || name === 'actual_cost') {
            finalValue = parseFloat(value) || 0;
        } else if (name === 'client_phone') {
            finalValue = value.replace(/[^0-9+]/g, '');
        }
        setFormData(prev => ({
            ...prev,
            [name]: finalValue
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

    const handleAutoFillRepairNumber = async () => {
        try {
            const result = await getNextRepairNumber().unwrap()
            if (result.success && result.data && result.data.repair_number) {
                setFormData(prev => ({
                    ...prev,
                    repair_number: result.data!.repair_number
                }))
            }
        } catch (error) {
            console.error('Failed to get next repair number:', error)
            alert('Не удалось получить следующий номер ремонта. Пожалуйста, попробуйте еще раз.')
        }
    }

    const handlePhotosChange = (photos: RepairPhoto[]) => {
        setFormData(prev => ({
            ...prev,
            photos
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Block submission if offline (both for new repairs and editing existing ones)
        if (!isOnline) {
            const message = isEditMode 
                ? 'Редактирование ремонтов недоступно в оффлайн режиме. Пожалуйста, проверьте подключение к интернету.'
                : 'Добавление новых ремонтов недоступно в оффлайн режиме. Пожалуйста, проверьте подключение к интернету.'
            alert(message)
            return
        }

        try {
            const {photos, ...repairData} = formData

            // Convert client_name to lowercase and remove spaces from client_phone for consistent storage
            const normalizedRepairData = {
                ...repairData,
                client_name: toLowerCase(repairData.client_name),
                client_phone: repairData.client_phone ? repairData.client_phone.replace(/[\s\u200B-\u200D\uFEFF\u202A-\u202E]/g, '') : ''
            }

            if (isEditMode && repair?.id) {
                // Update existing repair
                await updateRepair({
                    id: repair.id,
                    repair: normalizedRepairData
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
                const result = await createRepair(normalizedRepairData).unwrap()

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
                <h2>{isEditMode ? 'Редактировать ремонт' : (repair && !repair.id ? 'Добавить ремонт (скопировано)' : 'Добавить новый ремонт')}</h2>
                
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
                                    <span className="btn-icon">📷</span>
                                    <span className="btn-text-mobile">Сканировать</span>
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
                                    <span className="btn-icon">📷</span>
                                    <span className="btn-text-mobile">Сканировать</span>
                                </button>
                                <button
                                    type="button"
                                    className="barcode-print-btn"
                                    onClick={() => printBarcode(formData.repair_number || '')}
                                    disabled={!formData.repair_number || formData.repair_number.trim() === ''}
                                    title="Печать штрихкода"
                                >
                                    <span className="btn-icon">🖨️</span>
                                    <span className="btn-text-mobile">Распечатать</span>
                                </button>
                                {!isEditMode && (
                                    <button
                                        type="button"
                                        className="auto-fill-btn"
                                        onClick={handleAutoFillRepairNumber}
                                        disabled={!isOnline || isFetchingNextNumber}
                                        title="Автоматически заполнить следующий номер ремонта"
                                    >
                                        <span className="btn-icon">{isFetchingNextNumber ? '⏳' : '🔢'}</span>
                                        <span className="btn-text-mobile">Сгенерировать</span>
                                    </button>
                                )}
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
                                onKeyDown={(e) => {
                                    if (e.key === ' ' || e.code === 'Space' || e.key === '.') {
                                        e.preventDefault();
                                    }
                                }}
                                onBeforeInput={(e: React.FormEvent<HTMLInputElement>) => {
                                    const inputEvent = e.nativeEvent as InputEvent;
                                    // Block spaces, macOS double-space dot replacement, and any non-phone character
                                    if (inputEvent.data && (!/^[0-9+]+$/.test(inputEvent.data) || /\s|\./.test(inputEvent.data))) {
                                        e.preventDefault();
                                        return;
                                    }
                                    if (inputEvent.inputType === 'insertReplacementText') {
                                        e.preventDefault();
                                        return;
                                    }
                                }}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const text = e.clipboardData.getData('text');
                                    const cleaned = text.replace(/[^0-9+]/g, '');
                                    const target = e.currentTarget;
                                    const start = target.selectionStart ?? 0;
                                    const end = target.selectionEnd ?? 0;
                                    const currentVal = formData.client_phone || '';
                                    const newVal = currentVal.slice(0, start) + cleaned + currentVal.slice(end);
                                    setFormData(prev => ({
                                        ...prev,
                                        client_phone: newVal
                                    }));
                                    requestAnimationFrame(() => {
                                        target.setSelectionRange(start + cleaned.length, start + cleaned.length);
                                    });
                                }}
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
                                    <option value="issued">Выдан</option>
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
                                repairId={repair?.id}
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
                            disabled={isLoading || !isOnline}
                            title={!isOnline ? (isEditMode ? "Редактирование ремонтов недоступно в оффлайн режиме" : "Добавление новых ремонтов недоступно в оффлайн режиме") : ""}
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