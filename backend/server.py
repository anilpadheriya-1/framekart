"""
FrameKart Backend — FastAPI + MongoDB + Cloudinary + Razorpay
"""
import os, math, json, hmac, hashlib, asyncio, random, string
from datetime import datetime, timedelta
from typing import Optional, List
from contextlib import asynccontextmanager

import httpx
import cloudinary
import cloudinary.uploader
import razorpay
import motor.motor_asyncio
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import (
    FastAPI, HTTPException, Depends, Request, Response,
    UploadFile, File, Form, status, Query
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv

load_dotenv()

# ─── Config ────────────────────────────────────────────────────────────────
MONGO_URI        = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME          = os.getenv("DB_NAME", "framekart")
JWT_SECRET       = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM    = "HS256"
ACCESS_TOKEN_EXP = 24        # hours
REFRESH_TOKEN_EXP = 7        # days
ALLOWED_ORIGINS  = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback")
RAZORPAY_KEY_ID  = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "placeholder")
CLOUDINARY_CLOUD = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_KEY   = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_SECRET= os.getenv("CLOUDINARY_API_SECRET", "")
SUBSCRIPTION_PRICE_INR = 9900   # paise

cloudinary.config(cloud_name=CLOUDINARY_CLOUD, api_key=CLOUDINARY_KEY, api_secret=CLOUDINARY_SECRET)

# ─── DB ────────────────────────────────────────────────────────────────────
client_motor = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client_motor[DB_NAME]

users_col       = db["users"]
gigs_col        = db["gigs"]
bookings_col    = db["bookings"]
messages_col    = db["messages"]
conversations_col = db["conversations"]
reviews_col     = db["reviews"]
cities_col      = db["cities"]
subscriptions_col = db["subscriptions"]
login_attempts_col = db["login_attempts"]

# ─── Security ──────────────────────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer  = HTTPBearer(auto_error=False)

CATEGORIES = {
    "Photography": ["Wedding", "Portrait", "Commercial", "Event", "Product", "Real Estate", "Fashion"],
    "Videography": ["Wedding", "Event", "Commercial", "Music Video", "Documentary", "Corporate"],
    "Video Editing": ["Wedding Film", "Reel/Shorts", "Commercial", "YouTube", "Color Grading"],
    "Drone": ["Aerial Photography", "Aerial Video", "Mapping/Survey", "Real Estate"],
    "Album Design": ["Wedding Album", "Portrait Album", "Commercial Lookbook", "Photo Book"],
}

INDIAN_CITIES = [
    "Mumbai","Delhi","Bengaluru","Hyderabad","Ahmedabad","Chennai","Kolkata","Pune","Jaipur","Surat",
    "Lucknow","Kanpur","Nagpur","Indore","Thane","Bhopal","Visakhapatnam","Vadodara","Patna","Ludhiana",
    "Agra","Nashik","Faridabad","Meerut","Rajkot","Varanasi","Srinagar","Aurangabad","Dhanbad","Amritsar",
    "Navi Mumbai","Allahabad","Ranchi","Howrah","Coimbatore","Jabalpur","Gwalior","Vijayawada","Jodhpur",
    "Madurai","Raipur","Kota","Guwahati","Chandigarh","Solapur","Hubli","Tiruchirappalli","Bareilly",
    "Mysore","Tiruppur","Gurgaon","Aligarh","Jalandhar","Bhubaneswar","Salem","Warangal","Guntur",
    "Bhiwandi","Saharanpur","Gorakhpur","Bikaner","Amravati","Noida","Jamshedpur","Bhilai","Cuttack",
    "Kochi","Dehradun","Kolhapur","Ajmer","Siliguri","Rajpur Sonarpur","Ulhasnagar","Jhansi","Nellore",
    "Mangalore","Erode","Belgaum","Gaya","Udaipur","Malegaon","Jalgaon","Akola","Ujjain","Loni",
]

# ─── Helpers ───────────────────────────────────────────────────────────────
def oid(v): return str(v)
def serialize(doc):
    if doc is None: return None
    doc["id"] = str(doc.pop("_id", ""))
    for k,v in doc.items():
        if isinstance(v, ObjectId): doc[k] = str(v)
        elif isinstance(v, datetime): doc[k] = v.isoformat()
    return doc

def make_token(data: dict, exp_hours: float) -> str:
    payload = {**data, "exp": datetime.utcnow() + timedelta(hours=exp_hours)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer), request: Request = None):
    token = None
    if creds: token = creds.credentials
    if not token and request:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        uid = payload.get("sub")
        if not uid: raise HTTPException(401, "Invalid token")
        user = await users_col.find_one({"_id": ObjectId(uid)})
        if not user: raise HTTPException(401, "User not found")
        return serialize(user)
    except JWTError:
        raise HTTPException(401, "Invalid token")

async def optional_user(creds: HTTPAuthorizationCredentials = Depends(bearer), request: Request = None):
    try: return await get_current_user(creds, request)
    except: return None

# ─── Rate limiting ──────────────────────────────────────────────────────────
MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

async def check_rate_limit(email: str):
    record = await login_attempts_col.find_one({"email": email})
    if record and record.get("locked_until") and datetime.utcnow() < record["locked_until"]:
        remaining = int((record["locked_until"] - datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(429, f"Too many attempts. Try again in {remaining} minutes.")

async def record_failed_attempt(email: str):
    record = await login_attempts_col.find_one({"email": email})
    attempts = (record.get("attempts", 0) if record else 0) + 1
    update = {"attempts": attempts, "last_attempt": datetime.utcnow()}
    if attempts >= MAX_ATTEMPTS:
        update["locked_until"] = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
    await login_attempts_col.update_one({"email": email}, {"$set": update}, upsert=True)

async def clear_attempts(email: str):
    await login_attempts_col.delete_one({"email": email})

# ─── Seed data ─────────────────────────────────────────────────────────────
DEMO_PROVIDERS = [
    {"name":"Arjun Mehta","email":"arjun@demo.com","city":"Mumbai","specialty":"Photography","bio":"10+ years of wedding & portrait photography. Shot 300+ weddings across India.","avatar":"https://res.cloudinary.com/dddgabu7o/image/upload/v1775148700/framekart/avatars/demo-arjun.jpg"},
    {"name":"Priya Sharma","email":"priya@demo.com","city":"Delhi","specialty":"Videography","bio":"Award-winning videographer. Cinematic wedding films that tell your story.","avatar":"https://res.cloudinary.com/dddgabu7o/image/upload/v1775148705/framekart/avatars/demo-priya.jpg"},
    {"name":"Ravi Kumar","email":"ravi@demo.com","city":"Bengaluru","specialty":"Drone","bio":"Licensed drone pilot with 5 years aerial photography experience. DGCA certified.","avatar":"https://res.cloudinary.com/dddgabu7o/image/upload/v1775148708/framekart/avatars/demo-ravi.jpg"},
    {"name":"Sneha Patel","email":"sneha@demo.com","city":"Ahmedabad","specialty":"Album Design","bio":"Creative album designer. Luxury wedding albums & photo books that last a lifetime.","avatar":"https://res.cloudinary.com/dddgabu7o/image/upload/v1775148712/framekart/avatars/demo-sneha.jpg"},
]

DEMO_GIGS = [
    {"title":"Professional Wedding Photography","category":"Photography","subcategory":"Wedding","description":"Complete wedding day coverage from getting ready to reception. Edited photos delivered in 4 weeks.","basic_price":25000,"standard_price":45000,"premium_price":75000,"basic_desc":"6 hours, 300 photos","standard_desc":"10 hours, 600 photos, 2 photographers","premium_desc":"Full day, 1000+ photos, 2 photographers, engagement shoot","tags":["wedding","photography","candid","traditional"],"location":"Mumbai"},
    {"title":"Cinematic Wedding Film","category":"Videography","subcategory":"Wedding","description":"4K cinematic wedding films that capture every emotion. Delivered in 8 weeks.","basic_price":35000,"standard_price":65000,"premium_price":110000,"basic_desc":"4 min highlight reel, 4K","standard_desc":"10 min film + highlights, 2 cameras","premium_desc":"Full day coverage + teaser + highlights + raw footage","tags":["wedding","video","cinematic","4k"],"location":"Delhi"},
    {"title":"Aerial Drone Photography","category":"Drone","subcategory":"Aerial Photography","description":"Stunning aerial shots for events, real estate, and commercial projects.","basic_price":8000,"standard_price":15000,"premium_price":28000,"basic_desc":"1 hour flight, 20 edited photos","standard_desc":"2 hours, 50 photos + 2 min video","premium_desc":"Full day, unlimited shots, 5 min video, RAW files","tags":["drone","aerial","outdoor","landscape"],"location":"Bengaluru"},
    {"title":"Luxury Wedding Album Design","category":"Album Design","subcategory":"Wedding Album","description":"Museum-quality album designs using premium templates. Print-ready files.","basic_price":5000,"standard_price":9000,"premium_price":15000,"basic_desc":"20 pages, 2 revisions","standard_desc":"40 pages, 5 revisions, 2 sizes","premium_desc":"60 pages, unlimited revisions, premium cover options","tags":["album","wedding","design","luxury"],"location":"Ahmedabad"},
    {"title":"Social Media Reels Editing","category":"Video Editing","subcategory":"Reel/Shorts","description":"Trending Instagram & YouTube Shorts editing with motion graphics and music sync.","basic_price":1500,"standard_price":3500,"premium_price":7000,"basic_desc":"30 sec reel, basic transitions","standard_desc":"60 sec reel, motion graphics, color grade","premium_desc":"3 reels, full graphics, sound design, 3 revisions","tags":["reel","instagram","editing","trending"],"location":"Delhi"},
    {"title":"Corporate Event Photography","category":"Photography","subcategory":"Event","description":"Professional corporate event coverage. Conference, product launches, team photos.","basic_price":12000,"standard_price":22000,"premium_price":40000,"basic_desc":"4 hours, 150 photos","standard_desc":"8 hours, 400 photos, 2 photographers","premium_desc":"Full event, headshots, venue shots, same-day delivery","tags":["corporate","event","conference","professional"],"location":"Bengaluru"},
]

async def seed_demo_data():
    if await users_col.count_documents({"email": "client@demo.com"}) > 0:
        return
    print("Seeding demo data...")
    provider_ids = []
    for p in DEMO_PROVIDERS:
        user = {
            "name": p["name"], "email": p["email"],
            "password": pwd_ctx.hash("demo123"),
            "role": "provider", "avatar": p.get("avatar"),
            "city": p["city"], "bio": p["bio"],
            "rating": round(random.uniform(4.2, 4.9), 1),
            "total_reviews": random.randint(15, 80),
            "subscription_active": True,
            "subscription_expires": datetime.utcnow() + timedelta(days=30),
            "created_at": datetime.utcnow(),
        }
        r = await users_col.insert_one(user)
        provider_ids.append(r.inserted_id)

    client = {
        "name": "Demo Client", "email": "client@demo.com",
        "password": pwd_ctx.hash("demo123"),
        "role": "client", "avatar": None,
        "city": "Mumbai", "bio": "Looking for the best visual professionals.",
        "rating": 0, "total_reviews": 0,
        "subscription_active": False, "created_at": datetime.utcnow(),
    }
    await users_col.insert_one(client)

    placeholder_images = [
        "https://res.cloudinary.com/dddgabu7o/image/upload/v1775121546/framekart/gigs/wedding-photography-1.jpg",
        "https://res.cloudinary.com/dddgabu7o/image/upload/v1775148672/framekart/gigs/videography-wedding-1.jpg",
        "https://res.cloudinary.com/dddgabu7o/image/upload/v1775148677/framekart/gigs/drone-aerial-1.jpg",
        "https://res.cloudinary.com/dddgabu7o/image/upload/v1775148681/framekart/gigs/album-design-1.jpg",
        "https://res.cloudinary.com/dddgabu7o/image/upload/v1775148688/framekart/gigs/video-editing-reels-1.jpg",
        "https://res.cloudinary.com/dddgabu7o/image/upload/v1775148692/framekart/gigs/corporate-event-photography-1.jpg",
    ]
    for i, g in enumerate(DEMO_GIGS):
        pid = provider_ids[i % len(provider_ids)]
        gig = {
            **g,
            "provider_id": pid,
            "images": [placeholder_images[i % len(placeholder_images)]],
            "rating": round(random.uniform(4.1, 4.9), 1),
            "total_reviews": random.randint(5, 40),
            "total_orders": random.randint(10, 100),
            "is_active": True,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(5, 90)),
        }
        await gigs_col.insert_one(gig)

    await cities_col.drop()
    await cities_col.insert_many([{"name": c} for c in INDIAN_CITIES])
    print("Seeding done.")

# ─── Lifespan ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed_demo_data()
    await users_col.create_index("email", unique=True)
    await gigs_col.create_index([("category",1),("subcategory",1)])
    await gigs_col.create_index([("title","text"),("tags","text")])
    yield

app = FastAPI(title="FrameKart API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models ────────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    name: str; email: EmailStr; password: str; role: str = "client"; city: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr; password: str

class GigIn(BaseModel):
    title: str; category: str; subcategory: str; description: str
    basic_price: int; standard_price: int; premium_price: int
    basic_desc: str; standard_desc: str; premium_desc: str
    tags: List[str] = []; location: str = ""

class BookingIn(BaseModel):
    gig_id: str; tier: str; event_date: str; message: str = ""

class MessageIn(BaseModel):
    conversation_id: str; content: str

class ReviewIn(BaseModel):
    gig_id: str; booking_id: str; rating: int; comment: str = ""

class ProfileUpdate(BaseModel):
    name: Optional[str]=None; city: Optional[str]=None; bio: Optional[str]=None

# ─── Auth Routes ────────────────────────────────────────────────────────────
@app.post("/api/auth/register")
async def register(body: RegisterIn, response: Response):
    if await users_col.find_one({"email": body.email}):
        raise HTTPException(400, "Email already registered")
    user = {
        "name": body.name, "email": body.email,
        "password": pwd_ctx.hash(body.password),
        "role": body.role if body.role in ("client","provider") else "client",
        "avatar": None, "city": body.city or "", "bio": "",
        "rating": 0.0, "total_reviews": 0,
        "subscription_active": False, "created_at": datetime.utcnow(),
    }
    r = await users_col.insert_one(user)
    uid = str(r.inserted_id)
    access = make_token({"sub": uid}, ACCESS_TOKEN_EXP)
    refresh = make_token({"sub": uid, "type": "refresh"}, REFRESH_TOKEN_EXP * 24)
    response.set_cookie("refresh_token", refresh, httponly=True, max_age=REFRESH_TOKEN_EXP*86400, samesite="lax")
    user["id"] = uid; user.pop("_id", None); user.pop("password", None)
    user["created_at"] = user["created_at"].isoformat()
    return {"access_token": access, "user": user}

@app.post("/api/auth/login")
async def login(body: LoginIn, response: Response):
    await check_rate_limit(body.email)
    user = await users_col.find_one({"email": body.email})
    if not user or not pwd_ctx.verify(body.password, user.get("password","")):
        await record_failed_attempt(body.email)
        raise HTTPException(401, "Invalid credentials")
    await clear_attempts(body.email)
    uid = str(user["_id"])
    access = make_token({"sub": uid}, ACCESS_TOKEN_EXP)
    refresh = make_token({"sub": uid, "type": "refresh"}, REFRESH_TOKEN_EXP * 24)
    response.set_cookie("refresh_token", refresh, httponly=True, max_age=REFRESH_TOKEN_EXP*86400, samesite="lax")
    user = serialize(user); user.pop("password", None)
    return {"access_token": access, "user": user}

@app.post("/api/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token: raise HTTPException(401, "No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh": raise HTTPException(401, "Invalid token type")
        uid = payload["sub"]
        user = await users_col.find_one({"_id": ObjectId(uid)})
        if not user: raise HTTPException(401, "User not found")
        access = make_token({"sub": uid}, ACCESS_TOKEN_EXP)
        return {"access_token": access}
    except JWTError:
        raise HTTPException(401, "Invalid refresh token")

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}

@app.get("/api/auth/google")
async def google_oauth_url():
    params = f"client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile"
    return {"url": f"https://accounts.google.com/o/oauth2/v2/auth?{params}"}

@app.post("/api/auth/google/callback")
async def google_callback(request: Request, response: Response):
    body = await request.json()
    code = body.get("code")
    if not code: raise HTTPException(400, "No code provided")
    async with httpx.AsyncClient() as hc:
        token_res = await hc.post("https://oauth2.googleapis.com/token", data={
            "code": code, "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI, "grant_type": "authorization_code"
        })
        tokens = token_res.json()
        if "error" in tokens: raise HTTPException(400, tokens["error"])
        userinfo_res = await hc.get("https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"})
        ginfo = userinfo_res.json()

    email = ginfo.get("email")
    user = await users_col.find_one({"email": email})
    if not user:
        new_user = {
            "name": ginfo.get("name",""), "email": email,
            "password": None, "role": "client",
            "avatar": ginfo.get("picture"), "city": "", "bio": "",
            "rating": 0.0, "total_reviews": 0,
            "subscription_active": False, "created_at": datetime.utcnow(),
            "google_id": ginfo.get("id"),
        }
        r = await users_col.insert_one(new_user)
        uid = str(r.inserted_id)
        user = {**new_user, "_id": r.inserted_id}
    else:
        uid = str(user["_id"])

    access = make_token({"sub": uid}, ACCESS_TOKEN_EXP)
    refresh = make_token({"sub": uid, "type": "refresh"}, REFRESH_TOKEN_EXP * 24)
    response.set_cookie("refresh_token", refresh, httponly=True, max_age=REFRESH_TOKEN_EXP*86400, samesite="lax")
    user = serialize(user); user.pop("password", None)
    return {"access_token": access, "user": user}

@app.get("/api/auth/me")
async def me(current_user=Depends(get_current_user)):
    current_user.pop("password", None)
    return current_user

# ─── Users / Profile ────────────────────────────────────────────────────────
@app.patch("/api/users/profile")
async def update_profile(body: ProfileUpdate, current_user=Depends(get_current_user)):
    upd = {k: v for k, v in body.dict().items() if v is not None}
    if upd:
        await users_col.update_one({"_id": ObjectId(current_user["id"])}, {"$set": upd})
    user = await users_col.find_one({"_id": ObjectId(current_user["id"])})
    user = serialize(user); user.pop("password", None)
    return user

@app.post("/api/users/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    data = await file.read()
    result = cloudinary.uploader.upload(data, folder="framekart/avatars", resource_type="image")
    await users_col.update_one({"_id": ObjectId(current_user["id"])}, {"$set": {"avatar": result["secure_url"]}})
    return {"avatar": result["secure_url"]}

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    try:
        user = await users_col.find_one({"_id": ObjectId(user_id)})
    except: raise HTTPException(404, "User not found")
    if not user: raise HTTPException(404, "User not found")
    user = serialize(user); user.pop("password", None)
    return user

# ─── Gigs ───────────────────────────────────────────────────────────────────
@app.get("/api/gigs")
async def list_gigs(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_rating: Optional[float] = None,
    sort: Optional[str] = "newest",
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 12,
):
    query: dict = {"is_active": True}
    if category: query["category"] = category
    if subcategory: query["subcategory"] = subcategory
    if location: query["location"] = {"$regex": location, "$options": "i"}
    if min_price: query["basic_price"] = {"$gte": min_price}
    if max_price: query.setdefault("basic_price", {})["$lte"] = max_price
    if min_rating: query["rating"] = {"$gte": min_rating}
    if search: query["$text"] = {"$search": search}

    sort_map = {
        "newest": [("created_at", -1)],
        "price_asc": [("basic_price", 1)],
        "price_desc": [("basic_price", -1)],
        "rating": [("rating", -1)],
        "popular": [("total_orders", -1)],
    }
    sort_order = sort_map.get(sort, sort_map["newest"])

    total = await gigs_col.count_documents(query)
    skip = (page - 1) * limit
    cursor = gigs_col.find(query).sort(sort_order).skip(skip).limit(limit)
    gigs = []
    async for g in cursor:
        g = serialize(g)
        provider = await users_col.find_one({"_id": ObjectId(g["provider_id"])})
        if provider:
            p = serialize(provider)
            g["provider"] = {"id": p["id"], "name": p["name"], "avatar": p["avatar"], "rating": p["rating"]}
        gigs.append(g)

    return {"gigs": gigs, "total": total, "pages": math.ceil(total / limit), "page": page}

@app.get("/api/gigs/{gig_id}")
async def get_gig(gig_id: str):
    try:
        gig = await gigs_col.find_one({"_id": ObjectId(gig_id)})
    except: raise HTTPException(404, "Gig not found")
    if not gig: raise HTTPException(404, "Gig not found")
    gig = serialize(gig)
    provider = await users_col.find_one({"_id": ObjectId(gig["provider_id"])})
    if provider:
        p = serialize(provider); p.pop("password", None)
        gig["provider"] = p

    reviews_cursor = reviews_col.find({"gig_id": gig_id}).sort("created_at", -1).limit(10)
    reviews = []
    async for r in reviews_cursor:
        r = serialize(r)
        client = await users_col.find_one({"_id": ObjectId(r["client_id"])})
        if client:
            c = serialize(client)
            r["client"] = {"id": c["id"], "name": c["name"], "avatar": c["avatar"]}
        reviews.append(r)
    gig["reviews"] = reviews
    return gig

@app.post("/api/gigs")
async def create_gig(body: GigIn, current_user=Depends(get_current_user)):
    if current_user["role"] != "provider":
        raise HTTPException(403, "Only providers can create gigs")
    if not current_user.get("subscription_active"):
        raise HTTPException(403, "Active subscription required")
    gig = {
        **body.dict(),
        "provider_id": ObjectId(current_user["id"]),
        "images": [], "rating": 0.0, "total_reviews": 0,
        "total_orders": 0, "is_active": True,
        "created_at": datetime.utcnow(),
    }
    r = await gigs_col.insert_one(gig)
    gig = await gigs_col.find_one({"_id": r.inserted_id})
    return serialize(gig)

@app.put("/api/gigs/{gig_id}")
async def update_gig(gig_id: str, body: GigIn, current_user=Depends(get_current_user)):
    try:
        gig = await gigs_col.find_one({"_id": ObjectId(gig_id)})
    except: raise HTTPException(404, "Gig not found")
    if not gig: raise HTTPException(404, "Gig not found")
    if str(gig["provider_id"]) != current_user["id"]:
        raise HTTPException(403, "Not your gig")
    await gigs_col.update_one({"_id": ObjectId(gig_id)}, {"$set": body.dict()})
    gig = await gigs_col.find_one({"_id": ObjectId(gig_id)})
    return serialize(gig)

@app.delete("/api/gigs/{gig_id}")
async def delete_gig(gig_id: str, current_user=Depends(get_current_user)):
    try:
        gig = await gigs_col.find_one({"_id": ObjectId(gig_id)})
    except: raise HTTPException(404, "Gig not found")
    if not gig: raise HTTPException(404, "Gig not found")
    if str(gig["provider_id"]) != current_user["id"]:
        raise HTTPException(403, "Not your gig")
    await gigs_col.update_one({"_id": ObjectId(gig_id)}, {"$set": {"is_active": False}})
    return {"message": "Gig deactivated"}

@app.post("/api/gigs/{gig_id}/images")
async def upload_gig_image(gig_id: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):
    gig = await gigs_col.find_one({"_id": ObjectId(gig_id)})
    if not gig: raise HTTPException(404, "Gig not found")
    if str(gig["provider_id"]) != current_user["id"]: raise HTTPException(403, "Not your gig")
    data = await file.read()
    result = cloudinary.uploader.upload(data, folder="framekart/gigs", resource_type="image")
    await gigs_col.update_one({"_id": ObjectId(gig_id)}, {"$push": {"images": result["secure_url"]}})
    return {"url": result["secure_url"]}

# ─── Bookings ───────────────────────────────────────────────────────────────
TIER_PRICE_MAP = {"basic": "basic_price", "standard": "standard_price", "premium": "premium_price"}

@app.post("/api/bookings")
async def create_booking(body: BookingIn, current_user=Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(403, "Only clients can book")
    try:
        gig = await gigs_col.find_one({"_id": ObjectId(body.gig_id)})
    except: raise HTTPException(404, "Gig not found")
    if not gig: raise HTTPException(404, "Gig not found")
    price_field = TIER_PRICE_MAP.get(body.tier)
    if not price_field: raise HTTPException(400, "Invalid tier")
    booking = {
        "gig_id": ObjectId(body.gig_id),
        "client_id": ObjectId(current_user["id"]),
        "provider_id": gig["provider_id"],
        "tier": body.tier,
        "price": gig[price_field],
        "event_date": body.event_date,
        "message": body.message,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    r = await bookings_col.insert_one(booking)
    booking = await bookings_col.find_one({"_id": r.inserted_id})
    return serialize(booking)

@app.get("/api/bookings")
async def list_bookings(current_user=Depends(get_current_user)):
    if current_user["role"] == "client":
        query = {"client_id": ObjectId(current_user["id"])}
    else:
        query = {"provider_id": ObjectId(current_user["id"])}
    cursor = bookings_col.find(query).sort("created_at", -1)
    bookings = []
    async for b in cursor:
        b = serialize(b)
        gig = await gigs_col.find_one({"_id": ObjectId(b["gig_id"])})
        if gig: b["gig"] = {"id": str(gig["_id"]), "title": gig["title"], "images": gig.get("images", [])}
        other_id = b["provider_id"] if current_user["role"] == "client" else b["client_id"]
        other = await users_col.find_one({"_id": ObjectId(other_id)})
        if other:
            o = serialize(other)
            b["other_user"] = {"id": o["id"], "name": o["name"], "avatar": o["avatar"]}
        bookings.append(b)
    return bookings

@app.patch("/api/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, request: Request, current_user=Depends(get_current_user)):
    body = await request.json()
    new_status = body.get("status")
    valid = {"accepted","rejected","completed","cancelled"}
    if new_status not in valid: raise HTTPException(400, "Invalid status")
    booking = await bookings_col.find_one({"_id": ObjectId(booking_id)})
    if not booking: raise HTTPException(404, "Booking not found")
    pid = str(booking["provider_id"]); cid = str(booking["client_id"])
    if current_user["id"] not in (pid, cid): raise HTTPException(403, "Not authorized")
    if new_status in ("accepted","rejected") and current_user["id"] != pid: raise HTTPException(403, "Only provider can accept/reject")
    if new_status in ("completed","cancelled") and current_user["id"] not in (pid, cid): raise HTTPException(403, "Not authorized")
    await bookings_col.update_one({"_id": ObjectId(booking_id)}, {"$set": {"status": new_status, "updated_at": datetime.utcnow()}})
    booking = await bookings_col.find_one({"_id": ObjectId(booking_id)})
    return serialize(booking)

# ─── Messages ───────────────────────────────────────────────────────────────
@app.get("/api/conversations")
async def list_conversations(current_user=Depends(get_current_user)):
    uid = ObjectId(current_user["id"])
    cursor = conversations_col.find({"participants": uid}).sort("updated_at", -1)
    convs = []
    async for c in cursor:
        c = serialize(c)
        other_id = next((p for p in c.get("participant_ids", []) if p != current_user["id"]), None)
        if not other_id:
            raw_parts = c.get("participants", [])
            other_id = next((str(p) for p in raw_parts if str(p) != current_user["id"]), None)
        if other_id:
            other = await users_col.find_one({"_id": ObjectId(other_id)})
            if other:
                o = serialize(other)
                c["other_user"] = {"id": o["id"], "name": o["name"], "avatar": o["avatar"]}
        convs.append(c)
    return convs

@app.post("/api/conversations")
async def get_or_create_conversation(request: Request, current_user=Depends(get_current_user)):
    body = await request.json()
    other_id = body.get("other_user_id")
    if not other_id: raise HTTPException(400, "other_user_id required")
    uid = ObjectId(current_user["id"]); oid_obj = ObjectId(other_id)
    conv = await conversations_col.find_one({"participants": {"$all": [uid, oid_obj]}})
    if not conv:
        conv = {
            "participants": [uid, oid_obj],
            "participant_ids": [current_user["id"], other_id],
            "last_message": "", "unread": {current_user["id"]: 0, other_id: 0},
            "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
        }
        r = await conversations_col.insert_one(conv)
        conv = await conversations_col.find_one({"_id": r.inserted_id})
    return serialize(conv)

@app.get("/api/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, current_user=Depends(get_current_user)):
    cursor = messages_col.find({"conversation_id": conv_id}).sort("created_at", 1)
    msgs = []
    async for m in cursor:
        msgs.append(serialize(m))
    await conversations_col.update_one(
        {"_id": ObjectId(conv_id)},
        {"$set": {f"unread.{current_user['id']}": 0}}
    )
    return msgs

@app.post("/api/messages")
async def send_message(body: MessageIn, current_user=Depends(get_current_user)):
    conv = await conversations_col.find_one({"_id": ObjectId(body.conversation_id)})
    if not conv: raise HTTPException(404, "Conversation not found")
    participants = [str(p) for p in conv.get("participants", [])]
    if current_user["id"] not in participants: raise HTTPException(403, "Not in conversation")
    msg = {
        "conversation_id": body.conversation_id,
        "sender_id": current_user["id"],
        "content": body.content,
        "created_at": datetime.utcnow(),
    }
    await messages_col.insert_one(msg)
    other_id = next((p for p in participants if p != current_user["id"]), None)
    upd = {"last_message": body.content, "updated_at": datetime.utcnow()}
    if other_id:
        unread_field = f"unread.{other_id}"
        await conversations_col.update_one(
            {"_id": ObjectId(body.conversation_id)},
            {"$set": upd, "$inc": {unread_field: 1}}
        )
    else:
        await conversations_col.update_one({"_id": ObjectId(body.conversation_id)}, {"$set": upd})
    return serialize(msg)

@app.get("/api/messages/unread-count")
async def unread_count(current_user=Depends(get_current_user)):
    uid = current_user["id"]
    cursor = conversations_col.find({"participants": ObjectId(uid)})
    total = 0
    async for c in cursor:
        total += c.get("unread", {}).get(uid, 0)
    return {"count": total}

# ─── Reviews ────────────────────────────────────────────────────────────────
@app.post("/api/reviews")
async def create_review(body: ReviewIn, current_user=Depends(get_current_user)):
    if current_user["role"] != "client": raise HTTPException(403, "Only clients can review")
    booking = await bookings_col.find_one({"_id": ObjectId(body.booking_id)})
    if not booking: raise HTTPException(404, "Booking not found")
    if str(booking["client_id"]) != current_user["id"]: raise HTTPException(403, "Not your booking")
    if booking["status"] != "completed": raise HTTPException(400, "Booking must be completed")
    existing = await reviews_col.find_one({"booking_id": body.booking_id})
    if existing: raise HTTPException(400, "Already reviewed")
    if not 1 <= body.rating <= 5: raise HTTPException(400, "Rating must be 1-5")
    review = {
        "gig_id": body.gig_id, "booking_id": body.booking_id,
        "client_id": current_user["id"], "rating": body.rating, "comment": body.comment,
        "created_at": datetime.utcnow(),
    }
    await reviews_col.insert_one(review)
    # update gig rating
    agg = await reviews_col.aggregate([
        {"$match": {"gig_id": body.gig_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    if agg:
        await gigs_col.update_one({"_id": ObjectId(body.gig_id)},
            {"$set": {"rating": round(agg[0]["avg"], 1), "total_reviews": agg[0]["count"]}})
    # update provider rating
    gig = await gigs_col.find_one({"_id": ObjectId(body.gig_id)})
    if gig:
        pid = str(gig["provider_id"])
        prov_agg = await reviews_col.aggregate([
            {"$match": {"gig_id": {"$in": [str(g["_id"]) async for g in gigs_col.find({"provider_id": gig["provider_id"]})]}}}
        ]).to_list(None)
        # simpler: just update gig rating
    return {"message": "Review submitted"}

# ─── Dashboard ──────────────────────────────────────────────────────────────
@app.get("/api/dashboard/stats")
async def dashboard_stats(current_user=Depends(get_current_user)):
    uid = ObjectId(current_user["id"])
    if current_user["role"] == "provider":
        total = await bookings_col.count_documents({"provider_id": uid})
        pending = await bookings_col.count_documents({"provider_id": uid, "status": "pending"})
        accepted = await bookings_col.count_documents({"provider_id": uid, "status": "accepted"})
        completed = await bookings_col.count_documents({"provider_id": uid, "status": "completed"})
        revenue_cursor = bookings_col.aggregate([
            {"$match": {"provider_id": uid, "status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$price"}}}
        ])
        revenue_data = await revenue_cursor.to_list(1)
        revenue = revenue_data[0]["total"] if revenue_data else 0
        active_gigs = await gigs_col.count_documents({"provider_id": uid, "is_active": True})
        return {"total_bookings": total, "pending": pending, "accepted": accepted,
                "completed": completed, "revenue": revenue, "active_gigs": active_gigs}
    else:
        total = await bookings_col.count_documents({"client_id": uid})
        pending = await bookings_col.count_documents({"client_id": uid, "status": "pending"})
        completed = await bookings_col.count_documents({"client_id": uid, "status": "completed"})
        spent_cursor = bookings_col.aggregate([
            {"$match": {"client_id": uid, "status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$price"}}}
        ])
        spent_data = await spent_cursor.to_list(1)
        spent = spent_data[0]["total"] if spent_data else 0
        return {"total_bookings": total, "pending": pending, "completed": completed, "spent": spent}

# ─── Categories & Cities ────────────────────────────────────────────────────
@app.get("/api/categories")
async def get_categories():
    return CATEGORIES

@app.get("/api/cities")
async def search_cities(q: str = Query("", min_length=0)):
    if not q:
        return INDIAN_CITIES[:20]
    filtered = [c for c in INDIAN_CITIES if q.lower() in c.lower()]
    return filtered[:20]

# ─── Subscription / Razorpay ────────────────────────────────────────────────
@app.post("/api/subscription/create-order")
async def create_subscription_order(current_user=Depends(get_current_user)):
    try:
        rz = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order = rz.order.create({
            "amount": SUBSCRIPTION_PRICE_INR,
            "currency": "INR",
            "notes": {"user_id": current_user["id"], "purpose": "provider_subscription"}
        })
        return {"order_id": order["id"], "amount": SUBSCRIPTION_PRICE_INR, "key": RAZORPAY_KEY_ID}
    except Exception:
        # dev/mock mode
        mock_order_id = "order_mock_" + "".join(random.choices(string.ascii_letters + string.digits, k=14))
        return {"order_id": mock_order_id, "amount": SUBSCRIPTION_PRICE_INR, "key": RAZORPAY_KEY_ID, "mock": True}

@app.post("/api/subscription/verify")
async def verify_subscription(request: Request, current_user=Depends(get_current_user)):
    body = await request.json()
    mock = body.get("mock", False)
    verified = False
    if mock:
        verified = True
    else:
        order_id = body.get("razorpay_order_id", "")
        payment_id = body.get("razorpay_payment_id", "")
        signature = body.get("razorpay_signature", "")
        msg = f"{order_id}|{payment_id}"
        expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()
        verified = hmac.compare_digest(expected, signature)
    if not verified:
        raise HTTPException(400, "Payment verification failed")
    expires = datetime.utcnow() + timedelta(days=30)
    await users_col.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"role": "provider", "subscription_active": True, "subscription_expires": expires}}
    )
    sub = {
        "user_id": current_user["id"],
        "order_id": body.get("razorpay_order_id", "mock"),
        "payment_id": body.get("razorpay_payment_id", "mock"),
        "amount": SUBSCRIPTION_PRICE_INR,
        "created_at": datetime.utcnow(),
        "expires_at": expires,
    }
    await subscriptions_col.insert_one(sub)
    user = await users_col.find_one({"_id": ObjectId(current_user["id"])})
    user = serialize(user); user.pop("password", None)
    return {"message": "Subscription activated", "user": user}

@app.get("/api/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


# ─── Analytics webhook (fire-and-forget to Supabase Edge Function) ──────────
import asyncio

ANALYTICS_URL = os.getenv("SUPABASE_ANALYTICS_URL",
    "https://bzabxhnovshznqqodvij.supabase.co/functions/v1/framekart-analytics")
ANALYTICS_SECRET = os.getenv("FRAMEKART_ANALYTICS_SECRET", "")

async def track(event: str, payload: dict):
    """Fire-and-forget analytics event to Supabase Edge Function."""
    try:
        headers = {"Content-Type": "application/json"}
        if ANALYTICS_SECRET:
            headers["X-FrameKart-Secret"] = ANALYTICS_SECRET
        async with httpx.AsyncClient(timeout=3.0) as hc:
            await hc.post(ANALYTICS_URL, json={
                "event": event,
                "payload": payload,
                "timestamp": datetime.utcnow().isoformat(),
            }, headers=headers)
    except Exception:
        pass  # never break the main app for analytics
