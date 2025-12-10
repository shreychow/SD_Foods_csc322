import axios from 'axios'

const client = axios.create({
  baseURL: '/api',  // This will be proxied to http://localhost:5000
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor for auth
client.interceptors.request.use(
  (config) => {
    const customer = localStorage.getItem('customer');
    if (customer) {
      const user = JSON.parse(customer);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customer');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;


// import axios from 'axios'

// // Thanks to Vite proxy, baseURL can remain blank
// const client = axios.create({
//   baseURL: '',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// })

// export default client
