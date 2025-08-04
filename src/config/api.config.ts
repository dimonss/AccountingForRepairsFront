// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  endpoints: {
    auth: '/auth',
    repairs: '/repairs'
  }
} as const;

// Helper functions to get full URLs
export const getAuthApiUrl = () => `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth}`;
export const getRepairsApiUrl = () => `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.repairs}`; 