import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if available
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Standardize error formatting and handle token expiry
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Auto-clear invalid/expired token if 401 occurs outside of login attempt
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    // Custom error object for clean UI handling
    const formattedError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected network error occurred.',
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };
    return Promise.reject(formattedError);
  }
);

export default axiosClient;
