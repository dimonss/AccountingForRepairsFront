// API Configuration
export const API_CONFIG = {
  // Environment variable examples:
  // Development: VITE_API_BASE_URL=http://localhost:3001
  // Production (same domain): VITE_API_BASE_URL=
  // Production (subpath): VITE_API_BASE_URL=/repairs_accounting/api
  // Production (different domain): VITE_API_BASE_URL=https://api.example.com
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  endpoints: {
    auth: '/auth',
    repairs: '/repairs',
    reports: '/reports'
  }
} as const;

// Helper functions to get full URLs
export const getAuthApiUrl = () => `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth}`;
export const getRepairsApiUrl = () => `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.repairs}`; 
export const getReportsApiUrl = () => `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.reports}`;