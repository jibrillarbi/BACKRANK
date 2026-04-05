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
class Postr(BaseModel):
    sid: str
    body: str

class Strategy(BaseModel):
    name: str
    entry_rule: str
    exit_rule: str
    is_published: bool = False


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
                "strategy_id": existing_strategy['id'],
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

        return {
            "strategy_id": strategy_id
        }
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

@app.post("/deployment")
def add_config(strat: StrategyIn, user_id: str = Depends(get_current_user)):
    if not user_id: 
        raise HTTPException(status_code=401,detail="Not logged in! ")
    try:
        s=Strategy(name = strat.NAME, entry_rule=strat.ENTRY, exit_rule=strat.EXIT)
        existing = save_strategy(s,user_id)
        id=existing["strategy_id"]

        dep_data = strat.model_dump()
        sl = None if str(dep_data["SL"]) == 'None' else dep_data["SL"]
        tp = None if str(dep_data["TP"]) == 'None' else dep_data["TP"]
        query = (
            supabase.table("deployment")
            .select("*")
            .eq("uid", user_id)
            .eq("sid", id)
            .eq("asset", dep_data["TICKER"])
            .eq("timeframe", dep_data["TIMEFRAME"])
            .eq("direction", dep_data["DIRECTION"])
            .eq("sizing", dep_data["SIZE"])
        )
        query = query.is_("sl", "null") if sl is None else query.eq("sl", sl)
        query = query.is_("tp", "null") if tp is None else query.eq("tp", tp)

        if query.execute().data:
            return {"message": "This exact deployment already exists. Please modify the parameters."}

        res =  supabase.table("deployment").insert({
            "uid": user_id,
            "sid": id,
            "asset": dep_data["TICKER"],
            "timeframe": dep_data["TIMEFRAME"],
            "sl": sl,
            "tp": tp,
            "direction": dep_data["DIRECTION"],
            "sizing": dep_data["SIZE"]
        }).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error saving deployment {str(e)}")
    
@app.get("/deployment")
def get_dep_strat(strat_id: str, user_id: str = Depends(get_current_user)):
    if not user_id: 
        raise HTTPException(status_code=401,detail="Not logged in! ")
    
    try:

        res = supabase.table("deployment").select("*").eq("sid", strat_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error Posting {str(e)}")
    
@app.post("/posts")
def add_post(data: Postr, user_id: str = Depends(get_current_user)):
    if not user_id: 
        raise HTTPException(status_code=401,detail="Not logged in! ")
    try:
        
        existing = supabase.table("strategy").select("*").eq("is_published", True).eq("id",data.sid).execute()
        
        if existing.data:
            supabase.table("strategy").update({"is_published": True}).eq("id", data.sid).execute()
            return {
                "message": f"Post for this strategy already made. Please edit or delete"
            }
        
        post_data = data.model_dump()
        res =  supabase.table("posts").insert({
            "uid": user_id,
            "sid": post_data["sid"],
            "body": post_data["body"]
        }).execute()
        
        supabase.table("strategy").update({"is_published": True}).eq("id", post_data["sid"]).execute()

        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error Posting {str(e)}")
    

@app.get("/posts")
def get_posts():
    try:
        res = supabase.table("posts") \
            .select("id, body, user(username, uid), strategy(name), likes, comments, created_at") \
            .execute()
        
        
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching posts: {str(e)}")
