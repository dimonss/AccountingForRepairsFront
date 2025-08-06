// API Configuration
export const API_CONFIG = {
  // Environment variable examples:
  // Development: VITE_API_BASE_URL=http://localhost:3001
  // Production (same domain): VITE_API_BASE_URL=
  // Production (subpath): VITE_API_BASE_URL=/repairs_accounting
  // Production (different domain): VITE_API_BASE_URL=https://api.example.com
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  endpoints: {
    auth: '/auth',
    repairs: '/repairs'
  }
} as const;

// Helper functions to get full URLs
export const getAuthApiUrl = () => `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth}`;
export const getRepairsApiUrl = () => `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.repairs}`;

// Helper function to get full photo URL
export const getPhotoUrl = (relativePath: string): string => {
  // If it's already a full URL (data: or http:) or empty, return as is
  if (!relativePath || relativePath.startsWith('data:') || relativePath.startsWith('http')) {
    return relativePath;
  }
  
  // If relativePath starts with /, remove it to avoid double slashes
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  return `${API_CONFIG.baseUrl}/${cleanPath}`;
}; 