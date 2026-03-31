import { useMutation } from "@tanstack/react-query"
import { api, type LoginRequest, type RegisterRequest, type AuthResponse } from "./index"

export const useLogin = () => {
  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: (data) => api.login(data),
    onSuccess: (data) => {
      // Store user info in localStorage
      localStorage.setItem("user_id", data.user_id)
      localStorage.setItem("email", data.email)
      if (data.fullName) {
        localStorage.setItem("fullName", data.fullName)
      }
    },
  })
}

export const useRegister = () => {
  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: (data) => api.register(data),
    onSuccess: (data) => {
      // Store user info in localStorage
      localStorage.setItem("user_id", data.user_id)
      localStorage.setItem("email", data.email)
      if (data.fullName) {
        localStorage.setItem("fullName", data.fullName)
      }
    },
  })
}

export const useLogout = () => {
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // Clear user info from localStorage
      localStorage.removeItem("user_id")
      localStorage.removeItem("email")
      localStorage.removeItem("fullName")
    },
  })
}

export const getCurrentUser = () => {
  const user_id = localStorage.getItem("user_id")
  const email = localStorage.getItem("email")
  const fullName = localStorage.getItem("fullName")

  return user_id ? { user_id, email, fullName } : null
}

export const isLoggedIn = () => {
  return !!localStorage.getItem("user_id")
}
