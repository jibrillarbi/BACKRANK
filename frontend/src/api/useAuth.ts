import { useMutation } from "@tanstack/react-query"
import { api, type LoginRequest, type RegisterRequest, type AuthResponse, type Strategy } from "./index"

export const useLogin = () => {
  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: (data) => api.login(data),
    onSuccess: (data) => {
      // Store user info in localStorage
      localStorage.setItem("uid", data.uid)
      localStorage.setItem("email", data.email)
      localStorage.setItem("username", data.username)
    },
  })
}

export const useRegister = () => {
  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: (data) => api.register(data),
    onSuccess: (data) => {
      // Store user info in localStorage
      localStorage.setItem("uid", data.uid)
      localStorage.setItem("email", data.email)
      localStorage.setItem("username", data.username)
    },
  })
}

export const useLogout = () => {
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // Clear user info from localStorage
      localStorage.removeItem("uid")
      localStorage.removeItem("email")
      localStorage.removeItem("username")
    },
  })
}

export const getCurrentUser = () => {
  const uid = localStorage.getItem("uid")
  const email = localStorage.getItem("email")
  const username = localStorage.getItem("username")

  return uid ? { uid, email, username } : null
}

export const useSaveStrategy = () => {
  return useMutation<any, Error, Strategy>({
    mutationFn: (data: Strategy) => api.saveStrategy(data),
  })
}

export const isLoggedIn = () => {
  return !!localStorage.getItem("uid")
}

export const useCheckSession = () => {
  return useMutation({
    mutationFn: () => api.getCurrentUser(),
  })
}
