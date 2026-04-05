import client from "./client"

export interface Strategy {
  name: string
  entry_rule: string
  exit_rule: string
  is_published: boolean
}

export interface SavedStrategy {
  sid: number
  uid: string
  strategy: Strategy
}

export interface SaveStrategyResponse {
  message?: string
  strategy?: Strategy
}

export interface StrategyBacktest {
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
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  uid: string
  email: string
  username: string
}

export const api = {
  getRoot: () => client.get("/").then(res => res.data),
  getCurrentUser: () => client.get("/me").then(res => res.data),
  runBacktest: (strategy: StrategyBacktest) => 
    client.post("/run_back", strategy).then(res => res.data),
  
  // Auth endpoints
  login: (data: LoginRequest) =>
    client.get("/login", { params: data }).then(res => res.data) as Promise<AuthResponse>,
  register: (data: RegisterRequest) =>
    client.post("/register", data).then(res => res.data) as Promise<AuthResponse>,
  logout: () =>
    client.get("/logout").then(res => res.data),
  
  // Strategy endpoints
  saveStrategy: (strategy: Strategy) =>
    client.post("/create_strategy", strategy).then(res => res.data) as Promise<SaveStrategyResponse>,
  getStrategies: () =>
    client.get("/strategies").then(res => res.data) as Promise<SavedStrategy[]>,
  
  // Posts endpoints
  addPost: (sid: string, body: string) =>
    client.post("/posts", { sid, body }).then(res => res.data),
  getPosts: () =>
    client.get("/posts").then(res => res.data),
  
  // Deployment endpoints
  deployStrategy: (config: StrategyBacktest) =>
    client.post("/deployment", config).then(res => res.data),
  getDeployments: (strategyId: string) =>
    client.get("/deployment", { params: { strat_id: strategyId } }).then(res => res.data),
}