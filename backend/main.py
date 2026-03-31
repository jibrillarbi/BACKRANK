from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backtester.main_backtester import run_backtest
from pydantic import BaseModel
from supabase import create_client, Client
from typing import List, Optional
import os
from itsdangerous import URLSafeSerializer
from dotenv import load_dotenv
app = FastAPI()
load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#supabase setup 
url = os.getenv("SUPABASE_URL")
key= os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url,key)


SECRET_KEY= os.getenv("SECRET_KEY","default-secret")
serializer = URLSafeSerializer(SECRET_KEY)


def get_current_user(request: Request):
    cookie = request.cookies.get("session")
    if not cookie:
        return None
    try: 
        data = serializer.loads(cookie)
        return data.get("user_id")
    except Exception:
        return None

class StrategyIn(BaseModel):
    NAME: str
    ENTRY: str
    EXIT: str
    DIRECTION: str
    TIMEFRAME: str
    TICKER: str
    SIZE: str
    SL: str
    TP: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    fullName: str
    email: str
    password: str

class AuthResponse(BaseModel):
    user_id: str
    email: str
    fullName: Optional[str] = None
@app.get("/")
def home(request: Request, user_id: str = Depends(get_current_user)):
    return {"message": "Hello"}

@app.post("/run_back")
def get_strategy_evaluation(strategy: StrategyIn):
    results = run_backtest(strategy.model_dump())
    return results

@app.post("/register", response_model=AuthResponse)
def register(data: RegisterRequest):
    try:
        auth_res = supabase.auth.sign_up({"email": data.email, "password": data.password})
        if auth_res.user:
            return AuthResponse(
                user_id=auth_res.user.id,
                email=auth_res.user.email,
                fullName=data.fullName
            )
        raise HTTPException(status_code=400, detail="Registration failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration error: {str(e)}")

@app.post("/login", response_model=AuthResponse)
def login(data: LoginRequest):
    try:
        auth_res = supabase.auth.sign_in_with_password(
            {"email": data.email, "password": data.password}
        )
        if auth_res.session and auth_res.user:
            return AuthResponse(
                user_id=auth_res.user.id,
                email=auth_res.user.email
            )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/logout")
def logout():
    return {"message": "Logged out successfully"}