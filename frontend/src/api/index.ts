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

export interface BacktestMetrics {
  trp: number  
  sr: number   
  maxdd: number 
  wr: number    
  tt: number    
  fc: number 
  score: number
  deployment_score?: number
}

export interface DeploymentPayload {
  strategy: StrategyBacktest
  backtest: BacktestMetrics
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

export interface UpdateProfileRequest {
  username: string
}

export interface StrategyRank {
  rank: number
  name: string
  author: string
  userId: string
  bestReturn: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
  asset: string
  timeframe: string
  votes: number
  clones: number
}

export interface UserRank {
  rank: number
  username: string
  userId: string
  score: number
  deploymentId: string
  strategyId: string
  strategyName: string
  asset: string
  timeframe: string
  direction: string
  return: number
  sharpe: number
  winRate: number
  maxDrawdown: number
  totalTrades: number
}

export interface PublicStrategy {
  id: string
  name: string
  author: string
  description: string
  asset: string
  timeframe: string
  direction: string
  return: number
  winRate: number
  sharpeRatio: number
  trades: number
  likes: number
  comments: number
}

export interface UserStrategy {
  id: string
  name: string
  backtestRuns: number
  bestRunAsset?: string
  bestRunTimeframe?: string
  returnPct: number
  winRate: number
  backtested: boolean
}

export interface FeedItem {
  id: string
  author: string
  avatar: string
  strategyTitle: string
  asset: string
  timeframe: string
  returnPct: number
  votes: number
  comments: number
  timestamp: string
}

export const api = {
  getRoot: () => client.get("/").then(res => res.data),
  getCurrentUser: () => client.get("/me").then(res => res.data),
  runBacktest: (strategy: StrategyBacktest) => 
    client.post("/run_back", strategy).then(res => res.data),
  
  // Data endpoints
  initializeData: () =>
    client.post("/initialize-data").then(res => res.data),
  fetchData: (ticker: string, timeframe: string) =>
    client.get("/fetch-data", { params: { ticker, timeframe } }).then(res => res.data),
  getDataStats: () =>
    client.get("/data-stats").then(res => res.data),
  refreshData: (ticker: string, timeframe: string) =>
    client.post("/refresh-data", null, { params: { ticker, timeframe } }).then(res => res.data),
  
  // Auth endpoints
  login: (data: LoginRequest) =>
    client.post("/login", data).then(res => res.data) as Promise<AuthResponse>,
  register: (data: RegisterRequest) =>
    client.post("/register", data).then(res => res.data) as Promise<AuthResponse>,
  logout: () =>
    client.get("/logout").then(res => res.data),
  updateProfile: (data: UpdateProfileRequest) =>
    client.patch("/me", data).then(res => res.data) as Promise<AuthResponse>,
  
  // Strategy endpoints
  saveStrategy: (strategy: Strategy) =>
    client.post("/create_strategy", strategy).then(res => res.data) as Promise<SaveStrategyResponse>,
  getStrategies: () =>
    client.get("/strategies").then(res => res.data) as Promise<SavedStrategy[]>,
  
  // Posts endpoints
  addPost: (did: string, body: string) =>
    client.post("/posts", { did, body }).then(res => res.data),
  getPosts: () =>
    client.get("/posts").then(res => res.data),
  getStrategyPosts: (strategyId: string) =>
    client.get("/strategy_posts", { params: { strat_id: strategyId } }).then(res => res.data),
  deletePost: (postId: string | number) =>
    client.delete(`/posts/${postId}`).then(res => res.data),
  getProfilePosts: (username: string) =>
    client.get(`/profile_posts/${username}`).then(res => res.data),
  
  // Deployment endpoints
  deployStrategy: (payload: DeploymentPayload) =>
    client.post("/save_deployment", payload).then(res => res.data),
  getDeployments: (strategyId: string) =>
    client.get("/strat_dep", { params: { strat_id: strategyId } }).then(res => res.data),
  getAllDeployments: () =>
    client.get("/all_deployments").then(res => res.data),
  
  // Platform endpoints
  getStrategyLeaderboard: (limit: number = 10, timeframe: string = "all") =>
    client.get("/leaderboard/strategies", { params: { limit, timeframe } }).then(res => res.data) as Promise<StrategyRank[]>,
  getUserLeaderboard: (limit: number = 10) =>
    client.get("/leaderboard/users", { params: { limit } }).then(res => res.data) as Promise<UserRank[]>,
  getPublicStrategies: (limit: number = 20, offset: number = 0) =>
    client.get("/public-strategies", { params: { limit, offset } }).then(res => res.data) as Promise<PublicStrategy[]>,
  
  // Dashboard endpoints
  getUserStrategies: () =>
    client.get("/user-strategies").then(res => res.data) as Promise<UserStrategy[]>,
  getCommunityFeed: (limit: number = 20, offset: number = 0) =>
    client.get("/community-feed", { params: { limit, offset } }).then(res => res.data) as Promise<FeedItem[]>,
  
  // Comment endpoints
  createComment: (uid: string, pid: string, body: string) =>
    client.post("/comment", { uid, pid, body }).then(res => res.data),
  
  // Like endpoints
  toggleLike: (pid: string) =>
    client.post("/like", { pid }).then(res => res.data),
}
