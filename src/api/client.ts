import axios from 'axios';

// The base URL for the backend API, driven by environment variables.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
  (config) => {
    // Integrate with Supabase session or other auth mechanisms
    const token = localStorage.getItem('supabase-auth-token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific status codes consistently (e.g., 401 Unauthorized -> redirect)
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - Handle logout/redirect here');
    }
    return Promise.reject(error);
  }
);
