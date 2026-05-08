import { useMutation, useQuery } from "@tanstack/react-query"
import { api, type LoginRequest, type RegisterRequest, type AuthResponse, type Strategy, type SavedStrategy, type SaveStrategyResponse } from "./index"

export const storeCurrentUser = (data: AuthResponse) => {
  localStorage.setItem("uid", data.uid)
  localStorage.setItem("email", data.email)
  localStorage.setItem("username", data.username)
}

export const clearCurrentUser = () => {
  localStorage.removeItem("uid")
  localStorage.removeItem("email")
  localStorage.removeItem("username")
}

export const useLogin = () => {
  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: (data) => api.login(data),
    onSuccess: (data) => {
      storeCurrentUser(data)
    },
  })
}

export const useRegister = () => {
  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: (data) => api.register(data),
    onSuccess: (data) => {
      storeCurrentUser(data)
    },
  })
}

export const useLogout = () => {
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      clearCurrentUser()
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
  return useMutation<SaveStrategyResponse, Error, Strategy>({
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

export const useGetStrategies = () => {
  return useQuery<SavedStrategy[]>({
    queryKey: ['strategies'],
    queryFn: () => api.getStrategies(),
    enabled: isLoggedIn(),
  })
}
