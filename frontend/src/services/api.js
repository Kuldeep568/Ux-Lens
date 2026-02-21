import axios from 'axios'

// Read from .env — Vite exposes VITE_* vars via import.meta.env
// Development: VITE_API_BASE_URL=/api  (proxied by vite.config.js to localhost:5000)
// Production:  VITE_API_BASE_URL=https://your-backend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_BASE_URL
const TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT)

const api = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT_MS,
})

export const submitReview = (url) => api.post('/review', { url })
export const getReviews = () => api.get('/reviews')
export const getReview = (id) => api.get(`/reviews/${id}`)
export const deleteReview = (id) => api.delete(`/reviews/${id}`)
export const getStatus = () => api.get('/status')

export default api
