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
// import axios from 'axios'

// const client = axios.create({
//   baseURL: '/api',  // This will be proxied to http://localhost:5000
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   timeout: 10000,
// })

// // Request interceptor for auth
// client.interceptors.request.use(
//   (config) => {
//     const customer = localStorage.getItem('customer');
//     if (customer) {
//       const user = JSON.parse(customer);
//       if (user.token) {
//         config.headers.Authorization = `Bearer ${user.token}`;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor for errors
// client.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('customer');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export default client;

