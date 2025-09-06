import React, { useState, useEffect } from 'react';
import { useGetReportsSummaryQuery } from '../store/api/reportsApi';
import Modal from './Modal';
import './ReportsModal.css';
import type { DeviceTypeStats, BrandStats, MonthlyStats } from '../store/api/reportsApi';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'brands' | 'monthly' | 'financial'>('overview');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  const { data: reportsResponse, isLoading, error, refetch } = useGetReportsSummaryQuery(dateRange, {
    skip: !isOpen
  });

  // Очищаем кэш при закрытии модального окна
  useEffect(() => {
    if (!isOpen && reportsResponse) {
      // При закрытии модального окна сбрасываем данные
      // Это обеспечит свежие данные при следующем открытии
    }
  }, [isOpen, reportsResponse]);

  // Extract data from API response
  const reportsData = reportsResponse?.data;
  const stats = reportsData?.overview || {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    issued: 0,
    cancelled: 0,
    waitingParts: 0,
    completionRate: 0
  };
  const deviceTypeStats = reportsData?.devices || [];
  const brandStats = reportsData?.brands || [];
  const monthlyStats = reportsData?.monthly || [];
  const financialStats = reportsData?.financial || {
    totalRepairs: 0,
    completedRepairs: 0,
    totalEstimated: 0,
    totalActual: 0,
    averageEstimated: 0,
    averageActual: 0
  };

  const getDeviceTypeText = (deviceType: string): string => {
    const deviceTypeMap: { [key: string]: string } = {
      'autonomous_heater': 'Автономные отопители',
      'refrigerator': 'Холодильники',
      'pump': 'Насосы',
      'blower': 'Нагнетатели',
      'monitor': 'Мониторы',
      'radio': 'Рации',
      'other': 'Другое'
    };
    return deviceTypeMap[deviceType] || deviceType;
  };

  const getBrandText = (brand: string): string => {
    const brandMap: { [key: string]: string } = {
      'webasto': 'Webasto',
      'eberspacher': 'Eberspacher',
      'planar': 'Planar',
      'china': 'Китайские',
      'other': 'Другое'
    };
    return brandMap[brand] || brand;
  };



  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Отчеты">
        <div className="reports-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Отчеты">
        <div className="reports-error">
          <p>Ошибка загрузки данных: {JSON.stringify(error)}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📊 Отчеты по ремонтам">
      <div className="reports-modal">
        {/* Date Range Selector */}
        <div className="date-range-selector">
          <label>Период:</label>
          <select 
            value={dateRange} 
            onChange={(e) => {
              const newDateRange = e.target.value as 'week' | 'month' | 'quarter' | 'year';
              setDateRange(newDateRange);
              // Принудительно обновляем данные при изменении периода
              if (isOpen) {
                refetch();
              }
            }}
            className="date-range-select"
          >
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
            <option value="year">Год</option>
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="reports-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Обзор
          </button>
          <button 
            className={`tab-button ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            🔧 Устройства
          </button>
          <button 
            className={`tab-button ${activeTab === 'brands' ? 'active' : ''}`}
            onClick={() => setActiveTab('brands')}
          >
            🏷️ Бренды
          </button>
          <button 
            className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            📅 По месяцам
          </button>
          <button 
            className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            💰 Финансы
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card total">
                  <h3>Всего ремонтов</h3>
                  <div className="stat-number">{stats.total}</div>
                </div>
                <div className="stat-card pending">
                  <h3>В ожидании</h3>
                  <div className="stat-number">{stats.pending}</div>
                </div>
                <div className="stat-card in-progress">
                  <h3>В работе</h3>
                  <div className="stat-number">{stats.inProgress}</div>
                </div>
                <div className="stat-card completed">
                  <h3>Завершено</h3>
                  <div className="stat-number">{stats.completed}</div>
                </div>
                <div className="stat-card issued">
                  <h3>Выдано</h3>
                  <div className="stat-number">{stats.issued}</div>
                </div>
                <div className="stat-card waiting">
                  <h3>Ожидает детали</h3>
                  <div className="stat-number">{stats.waitingParts}</div>
                </div>
                <div className="stat-card cancelled">
                  <h3>Отменено</h3>
                  <div className="stat-number">{stats.cancelled}</div>
                </div>
              </div>
              
              <div className="completion-rate">
                <h3>Процент завершения</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="devices-tab">
              <h3>Статистика по типам устройств</h3>
              <div className="stats-list">
                {[...deviceTypeStats]
                  .sort((a: DeviceTypeStats, b: DeviceTypeStats) => b.count - a.count)
                  .map((item: DeviceTypeStats) => (
                    <div key={item.device_type} className="stat-item">
                      <span className="stat-label">{getDeviceTypeText(item.device_type)}</span>
                      <span className="stat-value">{item.count}</span>
                      <div className="stat-bar">
                        <div 
                          className="stat-bar-fill" 
                          style={{ width: `${(item.count / stats.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'brands' && (
            <div className="brands-tab">
              <h3>Статистика по брендам</h3>
              <div className="stats-list">
                {[...brandStats]
                  .sort((a: BrandStats, b: BrandStats) => b.count - a.count)
                  .map((item: BrandStats) => (
                    <div key={item.brand} className="stat-item">
                      <span className="stat-label">{getBrandText(item.brand)}</span>
                      <span className="stat-value">{item.count}</span>
                      <div className="stat-bar">
                        <div 
                          className="stat-bar-fill" 
                          style={{ width: `${(item.count / stats.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="monthly-tab">
              <h3>Статистика по месяцам</h3>
              <div className="monthly-chart">
                {[...monthlyStats]
                  .sort((a: MonthlyStats, b: MonthlyStats) => a.month.localeCompare(b.month))
                  .map((item: MonthlyStats) => {
                    const [year, monthNum] = item.month.split('-');
                    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
                    const maxCount = Math.max(...monthlyStats.map(m => m.count));
                    return (
                      <div key={item.month} className="monthly-bar">
                        <div className="monthly-label">{monthName}</div>
                        <div className="monthly-bar-container">
                          <div 
                            className="monthly-bar-fill" 
                            style={{ height: `${(item.count / maxCount) * 100}%` }}
                          ></div>
                        </div>
                        <div className="monthly-count">{item.count}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="financial-tab">
              <h3>Финансовая статистика</h3>
              <div className="financial-stats">
                <div className="financial-card">
                  <h4>Общая смета</h4>
                  <div className="financial-amount">{formatCurrency(financialStats.totalEstimated)}</div>
                </div>
                <div className="financial-card">
                  <h4>Фактические затраты</h4>
                  <div className="financial-amount">{formatCurrency(financialStats.totalActual)}</div>
                </div>
                <div className="financial-card">
                  <h4>Средняя смета</h4>
                  <div className="financial-amount">{formatCurrency(financialStats.averageEstimated)}</div>
                </div>
                <div className="financial-card">
                  <h4>Средние фактические затраты</h4>
                  <div className="financial-amount">{formatCurrency(financialStats.averageActual)}</div>
                </div>
              </div>
              
              <div className="financial-summary">
                <h4>Сводка</h4>
                <p>Всего ремонтов: <strong>{financialStats.totalRepairs}</strong></p>
                <p>Завершено: <strong>{financialStats.completedRepairs}</strong></p>
                <p>В работе: <strong>{stats.inProgress + stats.pending}</strong></p>
                <p>Ожидает детали: <strong>{stats.waitingParts}</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ReportsModal;
