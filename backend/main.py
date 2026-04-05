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
        return data.get("uid")
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
class Strategy(BaseModel):
    name: str
    entry_rule: str
    exit_rule: str
    is_published: bool
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class AuthResponse(BaseModel):
    uid: str
    email: str
    username: str
@app.get("/")
def home(request: Request, user_id: str = Depends(get_current_user)):
    return {"message": "Hello"}

@app.get("/me")
def get_current_user_info(user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"uid": user_id, "authenticated": True}

@app.post("/create_strategy")
def save_strategy(strategy: Strategy, user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        
        existing = supabase.table("strategy").select("*").eq("uid", user_id).eq("entry_rule", strategy.entry_rule).eq("exit_rule", strategy.exit_rule).execute()
        
        if existing.data:
            existing_strategy = existing.data[0]
            return {
                "message": f"Strategy is already saved as: {existing_strategy['name']}",
                "strategy": existing_strategy
            }
        
        strategy_data = strategy.model_dump()
        strategy_data["uid"] = user_id
        res = supabase.table("strategy").insert(strategy_data).execute()

        strategy_id = res.data[0]["id"]
        supabase.table("saved_strategies").insert({
            "uid": user_id,
            "sid": strategy_id
        }).execute()

        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error Saving strategy: {str(e)}")
@app.get("/strategies")
def get_saved_strategies(user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        res = supabase.table("saved_strategies") \
            .select("*, strategy(*)") \
            .eq("uid", user_id) \
            .execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching saved strategies: {str(e)}")

@app.post("/run_back")
def get_strategy_evaluation(strategy: StrategyIn):
    results = run_backtest(strategy.model_dump())
    return results

@app.post("/register")
def register(data: RegisterRequest):
    try:
        existing_user = supabase.table("user").select("*").eq("email", data.email).execute()
        if existing_user.data:
            raise HTTPException(status_code=400, detail="Email already exists")
        

        new_user = supabase.table("user").insert({
            "username": data.username,
            "email": data.email,
            "password": data.password
        }).execute()
        
        if new_user.data:
            user = new_user.data[0]
            session_data = {"uid": user["uid"]}
            session_token = serializer.dumps(session_data)
            
            response = JSONResponse(
                content=AuthResponse(
                    uid=user["uid"],
                    email=user["email"],
                    username=user["username"]
                ).model_dump()
            )
            response.set_cookie(
                key="session",
                value=session_token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=86400
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

        user_res = supabase.table("user").select("*").eq("email", email).execute()
        
        if not user_res.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = user_res.data[0]
        
        if user["password"] != password:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        session_data = {"uid": user["uid"]}
        session_token = serializer.dumps(session_data)
        
        response = JSONResponse(
            content=AuthResponse(
                uid=user["uid"],
                email=user["email"],
                username=user["username"]
            ).model_dump()
        )
        response.set_cookie(
            key="session",
            value=session_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=86400
        )
        return response
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