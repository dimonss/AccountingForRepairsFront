// API Configuration
export const API_CONFIG = {
  // Environment variable examples:
  // Development: VITE_API_BASE_URL=http://localhost:3001/api
  // Production (same domain): VITE_API_BASE_URL=/api
  // Production (different domain): VITE_API_BASE_URL=https://api.example.com/api
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  endpoints: {
    auth: '/auth',
    repairs: '/repairs'
  }
} as const;

// Helper functions to get full URLs
export const getAuthApiUrl = () => `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth}`;
export const getRepairsApiUrl = () => `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.repairs}`; 