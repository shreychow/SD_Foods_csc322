// src/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 120000, // 2 minutes (was probably 10000 = 10 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if needed
client.interceptors.request.use(
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

// Add response interceptor for better error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - AI is taking too long to respond');
    }
    return Promise.reject(error);
  }
);

export default client;