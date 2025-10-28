const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Get JWT token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Common fetch wrapper with auth
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}/api/v1/settings${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
};

// Profile API functions
export const profileAPI = {
  get: () => apiRequest('/profile'),
  update: (data: { name: string; email: string; timezone?: string; language?: string }) =>
    apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Password API functions
export const passwordAPI = {
  change: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    apiRequest('/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Notifications API functions
export const notificationsAPI = {
  get: () => apiRequest('/notifications'),
  update: (data: { 
    emailNotifications: boolean; 
    orderAlerts: boolean; 
    systemUpdates: boolean; 
    marketingEmails: boolean; 
  }) =>
    apiRequest('/notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// System API functions
export const systemAPI = {
  get: () => apiRequest('/system'),
  update: (data: { 
    dataRetention: string; 
    backupFrequency: string; 
    apiAccess: boolean; 
  }) =>
    apiRequest('/system', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};