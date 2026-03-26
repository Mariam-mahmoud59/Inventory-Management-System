import axios from 'axios';
import { supabase } from '@/lib/supabase';

// The base URL for the backend API, driven by environment variables.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
  async (config) => {
    // Integrate with Supabase session using the shared client
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle specific status codes consistently (e.g., 401 Unauthorized -> clear token)
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - Cleared local cache and redirecting to login');
      await supabase.auth.signOut();
      // Forcefully refresh and mount the router at the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
