from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    allow_origins=["http://localhost:5173"],
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
    print(request)
    cookie = request.cookies.get("session")
    if not cookie:
        print("no cookie set") 
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

@app.get("/me")
def get_current_user_info(user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user_id": user_id, "authenticated": True}

@app.post("/run_back")
def get_strategy_evaluation(strategy: StrategyIn):
    results = run_backtest(strategy.model_dump())
    return results

@app.post("/register")
def register(data: RegisterRequest):
    try:
        auth_res = supabase.auth.sign_up({"email": data.email, "password": data.password})
        if auth_res.user:
            session_data = {"user_id": auth_res.user.id}
            session_token = serializer.dumps(session_data)
            
            response = JSONResponse(
                content=AuthResponse(
                    user_id=auth_res.user.id,
                    email=auth_res.user.email,
                    fullName=data.fullName
                ).model_dump()
            )
            response.set_cookie(
                key="session",
                value=session_token,
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite="lax",
                max_age=86400  # 24 hours
            )
            return response
        raise HTTPException(status_code=400, detail="Registration failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration error: {str(e)}")

@app.get("/login")
def login(email: str, password: str):
    try:
        auth_res = supabase.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
        if auth_res.session and auth_res.user:
            session_data = {"user_id": auth_res.user.id}
            session_token = serializer.dumps(session_data)
            print("Supabase good") 
            
            response = JSONResponse(
                content=AuthResponse(
                    user_id=auth_res.user.id,
                    email=auth_res.user.email
                ).model_dump()
            )
            response.set_cookie(
                key="session",
                value=session_token,
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite="lax",
                max_age=86400  # 24 hours
            )
            return response
        raise HTTPException(status_code=401, detail="Invalid email or password")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@app.get("/logout")
def logout():
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(
        key="session",
        path="/",
        httponly=True,
        secure=False,
        samesite="lax"
    )
    return response