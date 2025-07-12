import axios from 'axios';

// API base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? `${window.location.origin}` : 'http://localhost:3001');

console.log('🔍 API_BASE_URL configured as:', API_BASE_URL);

// Axios instance for authenticated requests
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios instance for non-authenticated requests
const nonAuthApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to authApi to include the token in every request
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

nonAuthApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Utility functions for GET requests
export const get = async (url: string, authenticated = true) => {
  try {
    const response = await (authenticated
      ? authApi.get(url)
      : nonAuthApi.get(url));
    return response;
  } catch (error) {
    console.error('GET request error:', error);
    throw error;
  }
};

// Utility functions for POST requests
export const post = async (url: string, data: any, authenticated = true) => {
  try {
    const response = await (authenticated
      ? authApi.post(url, data)
      : nonAuthApi.post(url, data));
    return response;
  } catch (error) {
    console.error('POST request error:', error);
    throw error;
  }
};

// Utility functions for DELETE requests
export const del = async (url: string, authenticated = true) => {
  try {
    const response = await (authenticated
      ? authApi.delete(url)
      : nonAuthApi.delete(url));
    return response;
  } catch (error) {
    console.error('DELETE request error:', error);
    throw error;
  }
};

// Utility functions for PUT requests
export const put = async (url: string, data: any, authenticated = true) => {
  try {
    const response = await (authenticated
      ? authApi.put(url, data)
      : nonAuthApi.put(url, data));
    return response;
  } catch (error) {
    console.error('PUT request error:', error);
    throw error;
  }
};

// Export the configured axios instances
export { authApi, nonAuthApi };
export { API_BASE_URL }; 