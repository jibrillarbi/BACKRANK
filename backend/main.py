from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backtester.main_backtester import run_backtest
from backtester.data_manager import DataManager
from pydantic import BaseModel, field_validator
from supabase import create_client, Client
from typing import List, Optional
import os
import datetime
import hashlib
import hmac
import secrets
from itsdangerous import URLSafeSerializer
from dotenv import load_dotenv

app = FastAPI()
load_dotenv()


data_manager = DataManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


url = os.getenv("SUPABASE_URL")
key= os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url,key)


SECRET_KEY= os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
serializer = URLSafeSerializer(SECRET_KEY)


def get_current_user(request: Request):
    cookie = request.cookies.get("session")
    if not cookie:
        return None
    try: 
        data = serializer.loads(cookie)
        return data.get("uid")
    except Exception:
        return None

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"pbkdf2_sha256${salt}${digest.hex()}"

def verify_password(password: str, stored_password: str) -> bool:
    if stored_password.startswith("pbkdf2_sha256$"):
        try:
            _, salt, expected = stored_password.split("$", 2)
            digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
            return hmac.compare_digest(digest.hex(), expected)
        except ValueError:
            return False
    return hmac.compare_digest(stored_password, password)



def normalized_backtest_score(data: "Backtestr") -> float:
    score = data.score if data.score is not None else data.deployment_score
    if score is None:
        raise HTTPException(status_code=400, detail="Backtest score is required")
    return score

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

    @field_validator("NAME", "ENTRY", "EXIT", "DIRECTION", "TIMEFRAME", "TICKER", "SIZE", "SL", "TP")
    @classmethod
    def strip_string_fields(cls, value: str) -> str:
        if value is None:
            raise ValueError("Field is required")
        value = str(value).strip()
        if value == "":
            raise ValueError("Field cannot be empty")
        return value

    @field_validator("DIRECTION")
    @classmethod
    def validate_direction(cls, value: str) -> str:
        direction = value.upper()
        if direction not in {"LONG", "SHORT"}:
            raise ValueError("Direction must be LONG or SHORT")
        return direction

    @field_validator("TIMEFRAME")
    @classmethod
    def validate_timeframe(cls, value: str) -> str:
        timeframe = value.lower()
        if timeframe not in {"1m", "5m", "15m", "1h", "1d"}:
            raise ValueError("Timeframe must be one of: 1m, 5m, 15m, 1h, 1d")
        return timeframe

    @field_validator("TICKER")
    @classmethod
    def validate_ticker(cls, value: str) -> str:
        ticker = value.upper()
        if ticker not in {"AAPL", "MSFT", "NVDA", "TSLA", "SPY"}:
            raise ValueError("Ticker must be one of: AAPL, MSFT, NVDA, TSLA, SPY")
        return ticker

    @field_validator("SIZE")
    @classmethod
    def validate_size(cls, value: str) -> str:
        size = float(value)
        if size <= 0 or size > 100:
            raise ValueError("Position size must be greater than 0 and no more than 100")
        return value

    @field_validator("SL", "TP")
    @classmethod
    def validate_optional_percent(cls, value: str) -> str:
        if value.lower() == "none":
            return "None"
        pct = float(value)
        if pct <= 0 or pct > 100:
            raise ValueError("SL/TP percentages must be greater than 0 and no more than 100")
        return value
class Postr(BaseModel):
    did: str
    body: str

class Strategy(BaseModel):
    name: str
    entry_rule: str
    exit_rule: str
    is_published: bool = False

class CommentIn(BaseModel):
    uid: str
    pid: str
    body: str

class LikeIn(BaseModel):
    pid: str

class Backtestr(BaseModel): 
    trp: float  
    sr: float   
    maxdd: float
    wr: float  
    tt: float  
    fc: float
    score: Optional[float] = None
    deployment_score: Optional[float] = None

class DeploymentPayload(BaseModel):
    strategy: StrategyIn
    backtest: Backtestr

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    username: str

class AuthResponse(BaseModel):
    uid: str
    email: str
    username: str

# Data management endpoints
@app.post("/initialize-data")
def initialize_all_market_data():
    """Initialize and store all market data for all tickers and timeframes"""
    try:
        print("Starting data initialization...")
        results = data_manager.initialize_all_data(period="1y")
        return {
            "status": "success",
            "message": "Market data initialization started",
            "results": results
        }
    except Exception as e:
        print(f"Error initializing data: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

@app.post("/refresh-data")
def refresh_market_data(ticker: str = "AAPL", timeframe: str = "1d"):
    """Refresh market data for specific tickerand timeframe"""
    try:
        success = data_manager.refresh_data(ticker, timeframe)
        return {
            "status": "success" if success else "error",
            "ticker": ticker,
            "timeframe": timeframe,
            "message": f"Data refresh {'successful' if success else 'failed'}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

@app.get("/fetch-data")
def fetch_market_data(ticker: str = "AAPL", timeframe: str = "1d", start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get market data for a specific ticker and timeframe"""
    try:
        data = data_manager.get_data_for_backtest(ticker, timeframe, start_date, end_date)
        if data is None:
            raise HTTPException(status_code=404, detail=f"No data found for {ticker} {timeframe}")
        
        return {
            "ticker": ticker,
            "timeframe": timeframe,
            "rows": len(data),
            "data": data.head(100).to_dict(orient="records")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching data: {str(e)}")

@app.get("/data-stats")
def get_data_stats():
    """Get statistics about stored market data"""
    try:
        stats = data_manager.get_storage_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

@app.get("/")
def home(request: Request, user_id: str = Depends(get_current_user)):
    return {"message": "Hello"}

@app.get("/me")
def get_current_user_info(user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_res = supabase.table("user").select("uid, email, username").eq("uid", user_id).limit(1).execute()
    user = user_res.data[0] if user_res.data else {}
    return {
        "uid": user_id,
        "email": user.get("email", ""),
        "username": user.get("username", ""),
        "authenticated": True
    }

@app.patch("/me")
def update_current_user(data: UpdateProfileRequest, user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    username = data.username.strip()
    if len(username) < 2:
        raise HTTPException(status_code=400, detail="Username must be at least 2 characters")
    if len(username) > 40:
        raise HTTPException(status_code=400, detail="Username must be 40 characters or less")

    existing = supabase.table("user").select("uid").eq("username", username).neq("uid", user_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Username is already taken")

    res = supabase.table("user").update({"username": username}).eq("uid", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to update profile")

    user = res.data[0]
    return {
        "uid": user.get("uid", user_id),
        "email": user.get("email", ""),
        "username": user.get("username", username)
    }

@app.post("/create_strategy")
def save_strategy(strategy: Strategy, user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        print(f"Saving strategy for user {user_id}: {strategy.name}")
        
        existing = supabase.table("strategy").select("*").eq("uid", user_id).eq("entry_rule", strategy.entry_rule).eq("exit_rule", strategy.exit_rule).execute()
        
        if existing.data:
            existing_strategy = existing.data[0]
            print(f"Strategy already exists: {existing_strategy['name']}")
            return {
                "message": f"Strategy is already saved as: {existing_strategy['name']}",
                "strategy_id": existing_strategy['id'],
                "strategy": existing_strategy,
                "duplicate": True
            }
        
        strategy_data = strategy.model_dump()
        strategy_data["uid"] = user_id
        print(f"Inserting strategy: {strategy_data}")
        res = supabase.table("strategy").insert(strategy_data).execute()
        
        if not res.data:
            raise Exception("Failed to insert strategy")

        strategy_id = res.data[0]["id"]
        print(f"Strategy inserted with id: {strategy_id}")
        
        saved_strat = supabase.table("saved_strategies").insert({
            "uid": user_id,
            "sid": strategy_id
        }).execute()
        print(f"Saved to saved_strategies: {saved_strat.data}")

        return {
            "strategy_id": strategy_id,
            "name": strategy.name,
            "success": True
        }
    except Exception as e:
        print(f"Error Saving strategy: {str(e)}")
        import traceback
        traceback.print_exc()
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
    try:
        return run_backtest(strategy.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Backtest failed: {str(e)}")

@app.post("/register")
def register(data: RegisterRequest):
    try:
        print(f"Attempting to register user: {data.email}")
        existing_user = supabase.table("user").select("*").eq("email", data.email).execute()
        if existing_user.data:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        print(f"Creating new user in database")
        new_user = supabase.table("user").insert({
            "username": data.username,
            "email": data.email,
            "password": hash_password(data.password)
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
                secure=COOKIE_SECURE,
                samesite="lax",
                max_age=86400
            )
            return response
        raise HTTPException(status_code=400, detail="Registration failed")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Registration error: {str(e)}")

@app.post("/login")
def login_post(data: LoginRequest):
    return authenticate_user(data.email, data.password)

@app.get("/login")
def login(email: str, password: str):
    return authenticate_user(email, password)

def authenticate_user(email: str, password: str):
    try:

        user_res = supabase.table("user").select("*").eq("email", email).execute()
        
        if not user_res.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = user_res.data[0]
        
        stored_password = user.get("password", "")
        if not verify_password(password, stored_password):
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
            secure=COOKIE_SECURE,
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
        secure=COOKIE_SECURE,
        samesite="lax"
    )
    return response

@app.post("/deployment")
def add_config(payload: DeploymentPayload, user_id: str = Depends(get_current_user)):
    if not user_id: 
        raise HTTPException(status_code=401,detail="Not logged in! ")
    try:
        strat = payload.strategy
        bt = payload.backtest
        
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

        deployment_score = normalized_backtest_score(bt)

        res =  supabase.table("deployment").insert({
            "uid": user_id,
            "sid": id,
            "asset": dep_data["TICKER"],
            "timeframe": dep_data["TIMEFRAME"],
            "sl": sl,
            "tp": tp,
            "direction": dep_data["DIRECTION"],
            "sizing": dep_data["SIZE"],
            "score": deployment_score,
            "is_published": False
        }).execute()
        
        deployment_id = res.data[0]["id"]

        try:
            backtest_result = add_backtest_result(bt, deployment_id)
        except Exception:
            supabase.table("deployment").delete().eq("id", deployment_id).eq("uid", user_id).execute()
            raise
        
        return {
            **res.data[0],
            "backtest_data": [backtest_result],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error saving deployment {str(e)}")
def add_backtest_result(data: Backtestr, dep_id: str):
    res = supabase.table("backtest_data").insert({
        "did": dep_id,
        "total_return_pct": data.trp,
        "sharpe_ratio": data.sr,
        "max_dd": data.maxdd,
        "win_rate": data.wr,
        "total_trades": data.tt,
        "final_capital": data.fc,
    }).execute()

    if not res.data:
        raise Exception("Failed to insert backtest data")

    return res.data[0]






@app.post("/save_deployment")
def save_deployment(payload: DeploymentPayload, user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    deployment = add_config(payload, user_id)
    if deployment.get("message"):
        return deployment
    return {
        "message": "Deployment saved successfully",
        "deployment_id": deployment.get("id"),
        "score": deployment.get("score"),
        "backtest_data": deployment.get("backtest_data", [])
    }


@app.get("/strat_dep")
def get_dep_strat(strat_id: str, user_id: str = Depends(get_current_user)):
    if not user_id: 
        raise HTTPException(status_code=401,detail="Not logged in! ")
    
    try:
        res = supabase.table("deployment").select("*, backtest_data(*)").eq("sid", strat_id).eq("uid", user_id).execute()
        return res.data
    except HTTPException:
        raise
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error Posting {str(e)}")


@app.get("/all_deployments")
def get_all_deployments(user_id: str = Depends(get_current_user)):
    if not user_id: 
        raise HTTPException(status_code=401,detail="Not logged in! ")
    
    try:
        res = supabase.table("deployment").select("*, backtest_data(*), strategy(name)").eq("uid", user_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching deployments: {str(e)}")

@app.post("/posts")
def add_post(data: Postr, user_id: str = Depends(get_current_user)):
    if not user_id: 
        raise HTTPException(status_code=401,detail="Not logged in! ")
    try:
        
        deployment = supabase.table("deployment").select("id, uid").eq("id", data.did).eq("uid", user_id).limit(1).execute()
        if not deployment.data:
            raise HTTPException(status_code=404, detail="Deployment not found")

        existing_post = supabase.table("posts").select("id").eq("did", data.did).eq("uid", user_id).limit(1).execute()
        if existing_post.data:
            return {
                "message": "Post for this deployment already made. Please edit or delete",
                "post_id": existing_post.data[0]["id"]
            }
        
        post_data = data.model_dump()
        res =  supabase.table("posts").insert({
            "uid": user_id,
            "did": post_data["did"],
            "body": post_data["body"]
        }).execute()
        
        supabase.table("deployment").update({"is_published": True}).eq("id", post_data["did"]).execute()

        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error Posting {str(e)}")
    

@app.get("/posts")
def get_posts():
    try:
        res = supabase.table("posts") \
            .select("id, body, created_at, likes, comments, user(username), deployment(asset, timeframe, direction, strategy(name), backtest_data(total_return_pct, win_rate, sharpe_ratio, max_dd))") \
            .execute()
        
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching posts: {str(e)}")

@app.get("/strategy_posts")
def get_strategy_posts(strat_id: str, user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        deployments = supabase.table("deployment") \
            .select("id") \
            .eq("sid", strat_id) \
            .eq("uid", user_id) \
            .execute()

        deployment_ids = [deployment["id"] for deployment in deployments.data or []]
        if not deployment_ids:
            return []

        posts = supabase.table("posts") \
            .select("id, did, body, likes, comments, created_at, deployment(id, asset, timeframe, direction, score, strategy(name), backtest_data(total_return_pct, sharpe_ratio, win_rate, max_dd, total_trades, final_capital))") \
            .in_("did", deployment_ids) \
            .order("created_at", desc=True) \
            .execute()

        return posts.data or []
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching strategy posts: {str(e)}")

@app.delete("/posts/{post_id}")
def delete_post(post_id: str, user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        post_res = supabase.table("posts") \
            .select("id, uid, did") \
            .eq("id", post_id) \
            .limit(1) \
            .execute()

        if not post_res.data:
            raise HTTPException(status_code=404, detail="Post not found")

        post = post_res.data[0]
        if post.get("uid") != user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own posts")

        deployment_id = post.get("did")
        supabase.table("comments").delete().eq("pid", post_id).execute()
        supabase.table("likes").delete().eq("pid", post_id).execute()
        supabase.table("posts").delete().eq("id", post_id).execute()

        remaining_posts = supabase.table("posts") \
            .select("id") \
            .eq("did", deployment_id) \
            .execute()
        if not remaining_posts.data:
            supabase.table("deployment").update({"is_published": False}).eq("id", deployment_id).execute()

        return {"message": "Post deleted successfully", "post_id": post_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting post: {str(e)}")

# Leaderboard endpoints

@app.get("/leaderboard/strategies")
def get_strategy_leaderboard(limit: int = 10):
    """Get top performing strategies based on the deployment score."""
    try:
        res = supabase.table("posts") \
            .select("*, deployment(id, sid, score, strategy(id, name), backtest_data(total_return_pct, sharpe_ratio, win_rate)), user(username)") \
            .execute()
        
        strategy_scores = {}
        
        for post in res.data or []:
            deployment = post.get("deployment", {})
            if not deployment or not isinstance(deployment, dict):
                continue
            
            strategy = deployment.get("strategy", {})
            if not strategy:
                continue
            
            strategy_id = strategy.get("id", "")
            strategy_name = strategy.get("name", "Unnamed")
            
            backtest_list = deployment.get("backtest_data", [])
            if not backtest_list or not isinstance(backtest_list, list):
                continue
                
            backtest = backtest_list[0] if backtest_list else {}
            score = float(deployment.get("score", 0) or 0)
            
            if strategy_id not in strategy_scores or score > strategy_scores[strategy_id]["score"]:
                strategy_scores[strategy_id] = {
                    "name": strategy_name,
                    "score": score,
                    "return": float(backtest.get("total_return_pct", 0) or 0),
                    "sharpe": float(backtest.get("sharpe_ratio", 0) or 0),
                    "win_rate": float(backtest.get("win_rate", 0) or 0),
                    "post_id": post.get("id", "")
                }
        
        sorted_strategies = sorted(
            strategy_scores.items(),
            key=lambda x: x[1]["score"],
            reverse=True
        )[:limit]
        
        strategies = []
        for idx, (strat_id, data) in enumerate(sorted_strategies, 1):
            strategies.append({
                "rank": idx,
                "id": strat_id,
                "name": data["name"],
                "score": round(data["score"], 2),
                "return": round(data["return"], 2),
                "sharpe": round(data["sharpe"], 2),
                "winRate": round(data["win_rate"], 2),
                "postId": data["post_id"]
            })
        
        return strategies
    except Exception as e:
        print(f"Error fetching strategy leaderboard: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

@app.get("/leaderboard/users")
def get_user_leaderboard(limit: int = 10):
    """Get top users by their highest published deployment score."""
    try:

        res = supabase.table("deployment") \
            .select("id, uid, sid, asset, timeframe, direction, score, is_published, user(uid, username), strategy(id, name), backtest_data(total_return_pct, sharpe_ratio, win_rate, max_dd, total_trades)") \
            .eq("is_published", True) \
            .execute()
        
        best_by_user = {}
        
        for deployment in res.data or []:
            score = float(deployment.get("score", 0) or 0)
            user_id = deployment.get("uid", "")
            if not user_id:
                continue
            
            user = deployment.get("user", {}) if isinstance(deployment.get("user"), dict) else {}
            strategy = deployment.get("strategy", {}) if isinstance(deployment.get("strategy"), dict) else {}
            backtest_list = deployment.get("backtest_data", [])
            backtest = backtest_list[0] if isinstance(backtest_list, list) and backtest_list else {}
            
            if user_id not in best_by_user or score > best_by_user[user_id]["score"]:
                best_by_user[user_id] = {
                    "userId": user_id,
                    "username": user.get("username", "Unknown"),
                    "score": score,
                    "deploymentId": deployment.get("id", ""),
                    "strategyId": deployment.get("sid", ""),
                    "strategyName": strategy.get("name", "Unnamed"),
                    "asset": deployment.get("asset", ""),
                    "timeframe": deployment.get("timeframe", ""),
                    "direction": deployment.get("direction", ""),
                    "return": float(backtest.get("total_return_pct", 0) or 0),
                    "sharpe": float(backtest.get("sharpe_ratio", 0) or 0),
                    "winRate": float(backtest.get("win_rate", 0) or 0),
                    "maxDrawdown": float(backtest.get("max_dd", 0) or 0),
                    "totalTrades": int(backtest.get("total_trades", 0) or 0),
                }
        
        sorted_users = sorted(
            best_by_user.values(),
            key=lambda user: user["score"],
            reverse=True
        )[:limit]
        
        return [
            {
                "rank": idx,
                "userId": data["userId"],
                "username": data["username"],
                "score": round(data["score"], 2),
                "deploymentId": data["deploymentId"],
                "strategyId": data["strategyId"],
                "strategyName": data["strategyName"],
                "asset": data["asset"],
                "timeframe": data["timeframe"],
                "direction": data["direction"],
                "return": round(data["return"], 2),
                "sharpe": round(data["sharpe"], 2),
                "winRate": round(data["winRate"], 2),
                "maxDrawdown": round(data["maxDrawdown"], 2),
                "totalTrades": data["totalTrades"],
            }
            for idx, data in enumerate(sorted_users, 1)
        ]
    except Exception as e:
        print(f"Error fetching user leaderboard: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

@app.get("/public-strategies")
def get_public_strategies(limit: int = 20, offset: int = 0):
    """Get published strategies for explore page"""
    try:
        res = supabase.table("deployment") \
            .select("*, backtest_data(*), user(username), strategy(name)") \
            .eq("is_published", True) \
            .range(offset, offset + limit - 1) \
            .execute()
        
        strategies = []
        for dep in res.data or []:
            backtest = dep.get("backtest_data", [{}])[0] if dep.get("backtest_data") else {}
            user = dep.get("user", {})
            strategies.append({
                "id": dep.get("id", ""),
                "name": dep.get("strategy", {}).get("name", "Unnamed") if dep.get("strategy") else "Unnamed",
                "author": user.get("username", "Unknown") if user else "Unknown",
                "description": "Strategy description",
                "asset": dep.get("asset", ""),
                "timeframe": dep.get("timeframe", ""),
                "direction": dep.get("direction", "LONG"),
                "return": float(backtest.get("total_return_pct", 0) or 0),
                "winRate": float(backtest.get("win_rate", 0) or 0),
                "sharpeRatio": float(backtest.get("sharpe_ratio", 0) or 0),
                "trades": int(backtest.get("total_trades", 0) or 0),
                "likes": 0,
                "comments": 0
            })
        return strategies
    except Exception as e:
        print(f"Error fetching public strategies: {str(e)}")
        return []

@app.get("/user-strategies")
def get_user_strategies(uid: str = Depends(get_current_user)):
    """Get user's own strategies with their backtest metrics"""
    if not uid:
        return []
    
    try:
        res = supabase.table("deployment") \
            .select("*, backtest_data(*), strategy(name)") \
            .eq("uid", uid) \
            .execute()
        
        strategies = []
        strategy_map = {}
        
        for dep in res.data or []:
            strategy_id = dep.get("sid", "")
            strategy_name = dep.get("strategy", {}).get("name", "Unnamed") if dep.get("strategy") else "Unnamed"
            backtest = dep.get("backtest_data", [{}])[0] if dep.get("backtest_data") else {}
            
            if strategy_id not in strategy_map:
                strategy_map[strategy_id] = {
                    "id": dep.get("id", ""),
                    "name": strategy_name,
                    "backtestCount": 0,
                    "bestReturn": 0,
                    "winRate": 0,
                    "bestAsset": None,
                    "bestTimeframe": None,
                    "backtested": False
                }
            
            if backtest and backtest.get("id"):
                strategy_map[strategy_id]["backtestCount"] += 1
                ret = float(backtest.get("total_return_pct", 0) or 0)
                if ret > strategy_map[strategy_id]["bestReturn"]:
                    strategy_map[strategy_id]["bestReturn"] = ret
                    strategy_map[strategy_id]["bestAsset"] = dep.get("asset", "")
                    strategy_map[strategy_id]["bestTimeframe"] = dep.get("timeframe", "")
                    strategy_map[strategy_id]["winRate"] = float(backtest.get("win_rate", 0) or 0)
                    strategy_map[strategy_id]["backtested"] = True
        
        for strat in strategy_map.values():
            strategies.append({
                "id": strat["id"],
                "name": strat["name"],
                "backtestRuns": strat["backtestCount"],
                "bestRunAsset": strat["bestAsset"],
                "bestRunTimeframe": strat["bestTimeframe"],
                "returnPct": strat["bestReturn"],
                "winRate": strat["winRate"],
                "backtested": strat["backtested"]
            })
        
        return strategies
    except Exception as e:
        print(f"Error fetching user strategies: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

@app.get("/community-feed")
def get_community_feed(limit: int = 20, offset: int = 0):
    """Get community feed with recent strategy posts"""
    try:
        res = supabase.table("posts") \
            .select("*, user(username), deployment(asset, timeframe, backtest_data(*))") \
            .range(offset, offset + limit - 1) \
            .order("created_at", desc=True) \
            .execute()
        
        feed = []
        avatars = ["📰", "👤", "👨‍💼", "🧙", "💼", "🎯", "📊", "🚀", "💡", "⚡"]
        
        for idx, post in enumerate(res.data or []):
            user = post.get("user", {})
            deployment = post.get("deployment", {})
            backtest = deployment.get("backtest_data", [{}])[0] if deployment.get("backtest_data") else {}
            
            feed.append({
                "id": post.get("id", ""),
                "author": user.get("username", "Anonymous") if user else "Anonymous",
                "avatar": avatars[idx % len(avatars)],
                "strategyTitle": "Strategy",
                "asset": deployment.get("asset", ""),
                "timeframe": deployment.get("timeframe", ""),
                "returnPct": float(backtest.get("total_return_pct", 0) or 0),
                "votes": post.get("likes", 0),
                "comments": post.get("comments", 0),
                "timestamp": "Recently"
            })
        
        return feed
    except Exception as e:
        print(f"Error fetching community feed: {str(e)}")
        return []

@app.get("/post/{post_id}")
def get_post(post_id: str):
    """Get a single post with full details comments and deployment data"""
    try:
        res = supabase.table("posts") \
            .select("*, user(username), deployment(*, strategy(*), backtest_data(*))") \
            .eq("id", post_id) \
            .limit(1) \
            .execute()
        
        if not res.data or len(res.data) == 0:
            return {"error": "Post not found"}
        
        post = res.data[0]
        user = post.get("user", {})
        deployment = post.get("deployment", {}) if post.get("deployment") else {}
        strategy = deployment.get("strategy", {}) if isinstance(deployment, dict) else {}
        backtest = deployment.get("backtest_data", [{}])[0] if deployment.get("backtest_data") else {}
        
        comments_res = supabase.table("comments") \
            .select("*, user(username)") \
            .eq("pid", post_id) \
            .order("created_at", desc=False) \
            .execute()
        
        comments = []
        for comment in comments_res.data or []:
            comment_user = comment.get("user", {})
            comments.append({
                "id": comment.get("id", ""),
                "author": comment_user.get("username", "Anonymous") if comment_user else "Anonymous",
                "body": comment.get("body", ""),
                "createdAt": comment.get("created_at", "")
            })
        
        return {
            "id": post.get("id", ""),
            "author_uid": post.get("uid", ""),
            "author": user.get("username", "Anonymous") if user else "Anonymous",
            "timestamp": post.get("created_at", "Recently"),
            "strategyTitle": strategy.get("name", "Strategy") if strategy else "Strategy",
            "asset": deployment.get("asset", "") if deployment else "",
            "timeframe": deployment.get("timeframe", "") if deployment else "",
            "returnPct": float(backtest.get("total_return_pct", 0) or 0) if backtest else 0,
            "score": float(deployment.get("score", 0) or 0) if deployment else 0,
            "votes": post.get("likes", 0),
            "comments": len(comments),
            "body": post.get("body", ""),
            "commentsList": comments,
            "deployment": {
                "id": deployment.get("id", ""),
                "asset": deployment.get("asset", ""),
                "timeframe": deployment.get("timeframe", ""),
                "direction": deployment.get("direction", "LONG"),
                "sizing": deployment.get("sizing", ""),
                "sl": deployment.get("sl", ""),
                "tp": deployment.get("tp", ""),
                "score": float(deployment.get("score", 0) or 0) if deployment else 0,
            },
            "strategy": {
                "name": strategy.get("name", "") if strategy else "",
                "entry_rule": strategy.get("entry_rule", "") if strategy else "",
                "exit_rule": strategy.get("exit_rule", "") if strategy else "",
            },
            "backtest": {
                "total_return_pct": float(backtest.get("total_return_pct", 0) or 0) if backtest else 0,
                "sharpe_ratio": float(backtest.get("sharpe_ratio", 0) or 0) if backtest else 0,
                "max_dd": float(backtest.get("max_dd", 0) or 0) if backtest else 0,
                "win_rate": float(backtest.get("win_rate", 0) or 0) if backtest else 0,
                "total_trades": int(backtest.get("total_trades", 0) or 0) if backtest else 0,
                "final_capital": float(backtest.get("final_capital", 0) or 0) if backtest else 0,
            }
        }
    except Exception as e:
        print(f"Error fetching post: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.get("/profile_posts/{username}")
def get_profile_posts(username: str):
    try:
        user_res = supabase.table("user") \
            .select("uid, username, email") \
            .ilike("username", username) \
            .limit(1) \
            .execute()

        if not user_res.data:
            return {"profile": None, "posts": []}

        profile_user = user_res.data[0]
        posts_res = supabase.table("posts") \
            .select("id, did, body, likes, comments, created_at, deployment(id, asset, timeframe, direction, score, strategy(name), backtest_data(total_return_pct, sharpe_ratio, win_rate, max_dd, total_trades, final_capital))") \
            .eq("uid", profile_user["uid"]) \
            .order("created_at", desc=True) \
            .execute()

        return {
            "profile": {
                "uid": profile_user.get("uid", ""),
                "username": profile_user.get("username", username),
                "email": profile_user.get("email", "")
            },
            "posts": posts_res.data or []
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching profile posts: {str(e)}")

@app.post("/comment")
def create_comment(comment_data: CommentIn, uid_from_cookie: str = Depends(get_current_user)):
    """Create a new comment on a post"""
    if not uid_from_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        res = supabase.table("comments").insert({
            "uid": uid_from_cookie,
            "pid": comment_data.pid,
            "body": comment_data.body,
            "created_at": datetime.datetime.now().isoformat()
        }).execute()
        
        if res.data:
            comment = res.data[0]
            user_res = supabase.table("user").select("username").eq("uid", uid_from_cookie).limit(1).execute()
            username = user_res.data[0].get("username", "Anonymous") if user_res.data else "Anonymous"
            
            return {
                "id": comment.get("id", ""),
                "author": username,
                "body": comment.get("body", ""),
                "createdAt": comment.get("created_at", "")
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to create comment")
    except Exception as e:
        print(f"Error creating comment: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/like")
def toggle_like(like_data: LikeIn, uid: str = Depends(get_current_user)):
    """Toggle like on a post, adds if not liked, removes if already liked"""
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        print(f"Toggle like for user {uid} on post {like_data.pid}")
        
        existing_like = supabase.table("likes") \
            .select("id") \
            .eq("uid", uid) \
            .eq("pid", like_data.pid) \
            .execute()
        
        print(f"Existing likes: {existing_like.data}")
        
        if existing_like.data and len(existing_like.data) > 0:
            print("User already liked, removing like")
            like_id = existing_like.data[0].get("id")
            supabase.table("likes").delete().eq("id", like_id).execute()
            
            post = supabase.table("posts").select("likes").eq("id", like_data.pid).limit(1).execute()
            if post.data:
                current_likes = post.data[0].get("likes", 0)
                new_likes = max(0, current_likes - 1)
                supabase.table("posts").update({"likes": new_likes}).eq("id", like_data.pid).execute()
                print(f"Decremented likes from {current_likes} to {new_likes}")
                return {"liked": False, "likes": new_likes}
            
            return {"liked": False, "likes": 0}
        else:
            print("Adding new like")
            supabase.table("likes").insert({
                "uid": uid,
                "pid": like_data.pid
            }).execute()
            
            post = supabase.table("posts").select("likes").eq("id", like_data.pid).limit(1).execute()
            if post.data:
                current_likes = post.data[0].get("likes", 0)
                new_likes = current_likes + 1
                supabase.table("posts").update({"likes": new_likes}).eq("id", like_data.pid).execute()
                print(f"Incremented likes from {current_likes} to {new_likes}")
                return {"liked": True, "likes": new_likes}
            
            return {"liked": True, "likes": 1}
    except Exception as e:
        print(f"Error toggling like: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/post/{post_id}/liked")
def check_if_liked(post_id: str, uid: str = Depends(get_current_user)):
    """Check if current user has liked this post"""
    if not uid:
        return {"liked": False}
    
    try:
        existing_like = supabase.table("likes") \
            .select("id") \
            .eq("uid", uid) \
            .eq("pid", post_id) \
            .execute()
        
        is_liked = len(existing_like.data or []) > 0
        print(f"User {uid} like status for post {post_id}: {is_liked}")
        return {"liked": is_liked}
    except Exception as e:
        print(f"Error checking like status: {str(e)}")
        return {"liked": False}
