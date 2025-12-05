import axios from 'axios'

// Thanks to Vite proxy, baseURL can remain blank
const client = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default client
