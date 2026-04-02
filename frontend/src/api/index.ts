import client from "./client"

export interface Strategy {
  NAME: string
  ENTRY: string
  EXIT: string
  DIRECTION: string
  TIMEFRAME: string
  TICKER: string
  SIZE: string
  SL: string
  TP: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

export interface AuthResponse {
  user_id: string
  email: string
  fullName?: string
}

export const api = {
  getRoot: () => client.get("/").then(res => res.data),
  getCurrentUser: () => client.get("/me").then(res => res.data),
  runBacktest: (strategy: Strategy) => 
    client.post("/run_back", strategy).then(res => res.data),
  
  // Auth endpoints
  login: (data: LoginRequest) =>
    client.post("/login", data).then(res => res.data) as Promise<AuthResponse>,
  register: (data: RegisterRequest) =>
    client.post("/register", data).then(res => res.data) as Promise<AuthResponse>,
  logout: () =>
    client.post("/logout").then(res => res.data),
}