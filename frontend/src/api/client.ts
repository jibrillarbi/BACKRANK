import axios from "axios"

const client = axios.create({
  baseURL: "http://localhost:8000",
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