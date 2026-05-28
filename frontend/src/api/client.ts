import axios from "axios"

const DEFAULT_API_BASE_URL = "http://localhost:8000"
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  DEFAULT_API_BASE_URL
).replace(/\/+$/, "")

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // Send cookies with requests
})


client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const detail = error.response.data?.detail || error.response.data?.error || error.response.statusText
      console.error('API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.response.config?.url,
      })
      const customError = new Error(detail)
      return Promise.reject(customError)
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response from server', {
        message: error.message,
        url: error.request.url,
      })
    } else {
      // Error in request setup
      console.error('Request Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default client
