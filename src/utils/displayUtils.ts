export const getDeviceTypeText = (deviceType: string): string => {
  switch (deviceType) {
    case 'autonomous_heater': return 'Автономный отопитель'
    case 'refrigerator': return 'Холодильник'
    case 'pump': return 'Насос'
    case 'blower': return 'Нагнетатель воздуха'
    case 'radio': return 'Рация'
    case 'monitor': return 'Монитор'
    case 'other': return 'Другое'
    default: return deviceType
  }
}

export const getBrandText = (brand: string): string => {
  switch (brand) {
    case 'webasto': return 'Webasto'
    case 'eberspacher': return 'Eberspacher'
    case 'planar': return 'Планар'
    case 'binar': return 'Бинар'
    case 'china': return 'Китай'
    case 'teplostar': return 'Теплостар'
    case 'sputnik': return 'Спутик'
    case 'other': return 'Другое'
    default: return brand
  }
}

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return 'ОЖИДАЕТ'
    case 'in_progress': return 'В РАБОТЕ'
    case 'waiting_parts': return 'ОЖИДАНИЕ ЗАПЧАСТЕЙ'
    case 'completed': return 'ЗАВЕРШЁН'
    case 'cancelled': return 'ОТМЕНЁН'
    default: return status.replace('_', ' ').toUpperCase()
  }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#f39c12'
    case 'in_progress': return '#3498db'
    case 'waiting_parts': return '#e74c3c'
    case 'completed': return '#27ae60'
    case 'cancelled': return '#95a5a6'
    default: return '#f39c12'
  }
}
