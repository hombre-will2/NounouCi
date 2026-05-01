from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import logging
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Literal

import bcrypt
import jwt
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, validator

# -------------------- Setup --------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

# Object storage config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
APP_NAME = os.environ.get("APP_NAME", "nounou-connect-ci")
storage_key: Optional[str] = None


def init_storage() -> Optional[str]:
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_KEY:
        return None
    try:
        r = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        r.raise_for_status()
        storage_key = r.json()["storage_key"]
        return storage_key
    except Exception as e:
        logging.getLogger("nounou").error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Stockage non initialisé")
    r = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    r.raise_for_status()
    return r.json()


def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Stockage non initialisé")
    r = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60,
    )
    r.raise_for_status()
    return r.content, r.headers.get("Content-Type", "application/octet-stream")

app = FastAPI(title="Nounou Connect CI")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nounou")

# -------------------- Helpers --------------------
def normalize_phone(phone: str) -> str:
    """Normalize Ivorian phone to digits with optional + prefix."""
    p = re.sub(r"[\s\-]", "", phone.strip())
    if not re.match(r"^\+?\d{8,15}$", p):
        raise HTTPException(status_code=422, detail="Numéro de téléphone invalide")
    return p


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, phone: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "phone": phone,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/",
    )


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


def public_user(u: dict) -> dict:
    return {k: u[k] for k in ("id", "phone", "role", "first_name", "last_name", "created_at") if k in u}


# -------------------- Models --------------------
RoleType = Literal["nounou", "parent"]


class RegisterIn(BaseModel):
    phone: str
    password: str = Field(min_length=6)
    role: RoleType
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)


class LoginIn(BaseModel):
    phone: str
    password: str


class NannyProfileIn(BaseModel):
    age: int = Field(ge=18, le=80)
    experience_years: int = Field(ge=0, le=60)
    quartier: str
    city: str = "Abidjan"
    availability: str  # "Temps plein" | "Temps partiel" | "Garde de nuit" | etc.
    hourly_rate: int = Field(ge=0)  # FCFA
    bio: str = ""
    photo_url: Optional[str] = None
    languages: List[str] = []
    childcare_types: List[str] = []  # Bébé, Enfant, Aide aux devoirs


class ParentProfileIn(BaseModel):
    quartier: str
    city: str = "Abidjan"
    address: str = ""
    children_count: int = Field(ge=0, le=10)
    needs_description: str = ""
    schedule: str  # "Journée", "Soirée", "Nuit", "Week-end"
    care_type: str  # "Garde régulière", "Ponctuelle", "Sortie école"
    budget_max: int = Field(ge=0)
    photo_url: Optional[str] = None
    children_photos: List[str] = []


class MatchCreateIn(BaseModel):
    # Either nanny_id (parent initiates) OR parent_id (nounou initiates)
    nanny_id: Optional[str] = None
    parent_id: Optional[str] = None
    message: str = ""


class MatchUpdateIn(BaseModel):
    status: Literal["accepted", "declined"]


# -------------------- Auth Endpoints --------------------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    phone = normalize_phone(body.phone)
    existing = await db.users.find_one({"phone": phone})
    if existing:
        raise HTTPException(status_code=400, detail="Ce numéro est déjà inscrit")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "phone": phone,
        "password_hash": hash_password(body.password),
        "role": body.role,
        "first_name": body.first_name.strip(),
        "last_name": body.last_name.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, phone, body.role)
    set_auth_cookie(response, token)
    return {"user": public_user(doc), "token": token}


@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    phone = normalize_phone(body.phone)
    user = await db.users.find_one({"phone": phone}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Numéro ou mot de passe incorrect")
    token = create_access_token(user["id"], user["phone"], user["role"])
    set_auth_cookie(response, token)
    return {"user": public_user(user), "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": public_user(user)}


# -------------------- Nanny Profile --------------------
@api.put("/profile/nanny")
async def upsert_nanny_profile(body: NannyProfileIn, user: dict = Depends(get_current_user)):
    if user["role"] != "nounou":
        raise HTTPException(status_code=403, detail="Réservé aux nounous")
    doc = body.model_dump()
    doc["user_id"] = user["id"]
    doc["first_name"] = user["first_name"]
    doc["last_name"] = user["last_name"]
    doc["phone"] = user["phone"]
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.nanny_profiles.update_one({"user_id": user["id"]}, {"$set": doc}, upsert=True)
    return {"profile": doc}


@api.get("/profile/nanny/me")
async def get_my_nanny_profile(user: dict = Depends(get_current_user)):
    if user["role"] != "nounou":
        raise HTTPException(status_code=403, detail="Réservé aux nounous")
    profile = await db.nanny_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"profile": profile}


@api.delete("/profile/nanny/me")
async def delete_my_nanny_profile(user: dict = Depends(get_current_user)):
    if user["role"] != "nounou":
        raise HTTPException(status_code=403, detail="Réservé aux nounous")
    await db.nanny_profiles.delete_one({"user_id": user["id"]})
    return {"ok": True}


# -------------------- Parent Profile --------------------
@api.put("/profile/parent")
async def upsert_parent_profile(body: ParentProfileIn, user: dict = Depends(get_current_user)):
    if user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Réservé aux particuliers")
    doc = body.model_dump()
    doc["user_id"] = user["id"]
    doc["first_name"] = user["first_name"]
    doc["last_name"] = user["last_name"]
    doc["phone"] = user["phone"]
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.parent_profiles.update_one({"user_id": user["id"]}, {"$set": doc}, upsert=True)
    return {"profile": doc}


@api.get("/profile/parent/me")
async def get_my_parent_profile(user: dict = Depends(get_current_user)):
    if user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Réservé aux particuliers")
    profile = await db.parent_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"profile": profile}


@api.delete("/profile/parent/me")
async def delete_my_parent_profile(user: dict = Depends(get_current_user)):
    if user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Réservé aux particuliers")
    await db.parent_profiles.delete_one({"user_id": user["id"]})
    return {"ok": True}


# -------------------- Search Nannies --------------------
@api.get("/nannies")
async def list_nannies(
    quartier: Optional[str] = None,
    availability: Optional[str] = None,
    min_experience: Optional[int] = Query(None, ge=0),
    max_rate: Optional[int] = Query(None, ge=0),
    care_type: Optional[str] = None,
    search: Optional[str] = None,
):
    q: dict = {}
    if quartier and quartier != "all":
        q["quartier"] = quartier
    if availability and availability != "all":
        q["availability"] = availability
    if min_experience is not None:
        q["experience_years"] = {"$gte": min_experience}
    if max_rate is not None:
        q["hourly_rate"] = {"$lte": max_rate}
    if care_type and care_type != "all":
        q["childcare_types"] = care_type
    if search:
        regex = {"$regex": search, "$options": "i"}
        q["$or"] = [{"first_name": regex}, {"last_name": regex}, {"bio": regex}]
    cursor = db.nanny_profiles.find(q, {"_id": 0, "phone": 0}).sort("updated_at", -1)
    nannies = await cursor.to_list(200)
    return {"nannies": nannies}


@api.get("/nannies/{nanny_id}")
async def get_nanny(nanny_id: str, user: dict = Depends(get_current_user)):
    profile = await db.nanny_profiles.find_one({"user_id": nanny_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Nounou introuvable")
    # Hide phone unless requester has accepted match or is the nanny herself
    if user["id"] != nanny_id:
        match = await db.matches.find_one({
            "parent_id": user["id"],
            "nanny_id": nanny_id,
            "status": "accepted",
        })
        if not match:
            profile.pop("phone", None)
    return {"nanny": profile}


# -------------------- Search Parents (for nounous) --------------------
@api.get("/parents")
async def list_parents(
    user: dict = Depends(get_current_user),
    city: Optional[str] = None,
    quartier: Optional[str] = None,
    care_type: Optional[str] = None,
    schedule: Optional[str] = None,
    min_budget: Optional[int] = Query(None, ge=0),
    search: Optional[str] = None,
):
    if user["role"] != "nounou":
        raise HTTPException(status_code=403, detail="Réservé aux nounous")
    q: dict = {}
    if city and city != "all":
        q["city"] = city
    if quartier and quartier != "all":
        q["quartier"] = quartier
    if care_type and care_type != "all":
        q["care_type"] = care_type
    if schedule and schedule != "all":
        q["schedule"] = schedule
    if min_budget is not None:
        q["budget_max"] = {"$gte": min_budget}
    if search:
        regex = {"$regex": search, "$options": "i"}
        q["$or"] = [{"first_name": regex}, {"last_name": regex}, {"needs_description": regex}]
    cursor = db.parent_profiles.find(q, {"_id": 0, "phone": 0, "address": 0}).sort("updated_at", -1)
    parents = await cursor.to_list(200)
    return {"parents": parents}


@api.get("/parents/{parent_id}")
async def get_parent(parent_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "nounou" and user["id"] != parent_id:
        raise HTTPException(status_code=403, detail="Réservé aux nounous")
    profile = await db.parent_profiles.find_one({"user_id": parent_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Particulier introuvable")
    if user["id"] != parent_id:
        match = await db.matches.find_one({
            "parent_id": parent_id,
            "nanny_id": user["id"],
            "status": "accepted",
        })
        if not match:
            profile.pop("phone", None)
            profile.pop("address", None)
    return {"parent": profile}


# -------------------- Matches --------------------
async def create_notification(user_id: str, message: str, link: str = ""):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "message": message,
        "link": link,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notifications.insert_one(doc)


@api.post("/matches")
async def create_match(body: MatchCreateIn, user: dict = Depends(get_current_user)):
    if user["role"] == "parent":
        if not body.nanny_id:
            raise HTTPException(status_code=422, detail="nanny_id requis")
        nanny = await db.users.find_one({"id": body.nanny_id, "role": "nounou"}, {"_id": 0})
        if not nanny:
            raise HTTPException(status_code=404, detail="Nounou introuvable")
        existing = await db.matches.find_one({
            "parent_id": user["id"], "nanny_id": body.nanny_id,
            "status": {"$in": ["pending", "accepted"]},
        })
        if existing:
            raise HTTPException(status_code=400, detail="Vous avez déjà une demande en cours avec cette nounou")
        match = {
            "id": str(uuid.uuid4()),
            "parent_id": user["id"],
            "parent_name": f"{user['first_name']} {user['last_name']}",
            "parent_phone": user["phone"],
            "nanny_id": body.nanny_id,
            "nanny_name": f"{nanny['first_name']} {nanny['last_name']}",
            "nanny_phone": nanny.get("phone"),
            "initiated_by": "parent",
            "message": body.message,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.matches.insert_one(match)
        await create_notification(
            body.nanny_id,
            f"{user['first_name']} {user['last_name']} souhaite vous contacter.",
            "/matches",
        )
        match.pop("_id", None)
        return {"match": match}

    # Nounou initie une demande vers un particulier
    if user["role"] == "nounou":
        if not body.parent_id:
            raise HTTPException(status_code=422, detail="parent_id requis")
        parent = await db.users.find_one({"id": body.parent_id, "role": "parent"}, {"_id": 0})
        if not parent:
            raise HTTPException(status_code=404, detail="Particulier introuvable")
        existing = await db.matches.find_one({
            "parent_id": body.parent_id, "nanny_id": user["id"],
            "status": {"$in": ["pending", "accepted"]},
        })
        if existing:
            raise HTTPException(status_code=400, detail="Vous avez déjà une demande en cours avec ce particulier")
        match = {
            "id": str(uuid.uuid4()),
            "parent_id": body.parent_id,
            "parent_name": f"{parent['first_name']} {parent['last_name']}",
            "parent_phone": parent.get("phone"),
            "nanny_id": user["id"],
            "nanny_name": f"{user['first_name']} {user['last_name']}",
            "nanny_phone": user["phone"],
            "initiated_by": "nounou",
            "message": body.message,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.matches.insert_one(match)
        await create_notification(
            body.parent_id,
            f"La nounou {user['first_name']} {user['last_name']} souhaite vous contacter.",
            "/matches",
        )
        match.pop("_id", None)
        return {"match": match}

    raise HTTPException(status_code=403, detail="Action non autorisée")


@api.get("/matches")
async def list_my_matches(user: dict = Depends(get_current_user)):
    if user["role"] == "parent":
        q = {"parent_id": user["id"]}
    else:
        q = {"nanny_id": user["id"]}
    cursor = db.matches.find(q, {"_id": 0}).sort("updated_at", -1)
    matches = await cursor.to_list(200)
    # Enrich with photos
    nanny_ids = {m["nanny_id"] for m in matches}
    parent_ids = {m["parent_id"] for m in matches}
    nanny_photos = {}
    parent_photos = {}
    if nanny_ids:
        async for n in db.nanny_profiles.find({"user_id": {"$in": list(nanny_ids)}}, {"_id": 0, "user_id": 1, "photo_url": 1}):
            nanny_photos[n["user_id"]] = n.get("photo_url")
    if parent_ids:
        async for p in db.parent_profiles.find({"user_id": {"$in": list(parent_ids)}}, {"_id": 0, "user_id": 1, "photo_url": 1}):
            parent_photos[p["user_id"]] = p.get("photo_url")
    for m in matches:
        m["nanny_photo_url"] = nanny_photos.get(m["nanny_id"])
        m["parent_photo_url"] = parent_photos.get(m["parent_id"])
    return {"matches": matches}


@api.put("/matches/{match_id}")
async def update_match(match_id: str, body: MatchUpdateIn, user: dict = Depends(get_current_user)):
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    initiated_by = match.get("initiated_by", "parent")
    # The recipient (the one who didn't initiate) can accept/decline
    if initiated_by == "parent":
        # nounou is the recipient
        if user["role"] != "nounou" or match["nanny_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Action non autorisée")
        notify_user_id = match["parent_id"]
    else:
        # parent is the recipient
        if user["role"] != "parent" or match["parent_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Action non autorisée")
        notify_user_id = match["nanny_id"]

    new_status = body.status
    await db.matches.update_one(
        {"id": match_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    msg = "acceptée" if new_status == "accepted" else "déclinée"
    await create_notification(
        notify_user_id,
        f"{user['first_name']} {user['last_name']} a {msg} votre demande.",
        "/matches",
    )
    match["status"] = new_status
    return {"match": match}


@api.delete("/matches/{match_id}")
async def delete_match(match_id: str, user: dict = Depends(get_current_user)):
    match = await db.matches.find_one({"id": match_id})
    if not match:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    if match["parent_id"] != user["id"] and match["nanny_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Action non autorisée")
    await db.matches.delete_one({"id": match_id})
    return {"ok": True}


# -------------------- Notifications --------------------
@api.get("/notifications")
async def list_notifications(user: dict = Depends(get_current_user)):
    cursor = db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    notifs = await cursor.to_list(100)
    unread = sum(1 for n in notifs if not n["read"])
    return {"notifications": notifs, "unread": unread}


@api.put("/notifications/{notif_id}/read")
async def mark_notif_read(notif_id: str, user: dict = Depends(get_current_user)):
    res = await db.notifications.update_one(
        {"id": notif_id, "user_id": user["id"]}, {"$set": {"read": True}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    return {"ok": True}


@api.put("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# -------------------- Stats / Public --------------------
@api.get("/stats")
async def stats():
    n_nannies = await db.nanny_profiles.count_documents({})
    n_parents = await db.parent_profiles.count_documents({})
    n_matches = await db.matches.count_documents({"status": "accepted"})
    return {"nannies": n_nannies, "parents": n_parents, "matches": n_matches}


@api.get("/")
async def root():
    return {"message": "Nounou Connect CI API"}


# -------------------- Startup --------------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("phone", unique=True)
    await db.users.create_index("role")
    await db.nanny_profiles.create_index("user_id", unique=True)
    await db.nanny_profiles.create_index("quartier")
    await db.parent_profiles.create_index("user_id", unique=True)
    await db.parent_profiles.create_index("city")
    await db.matches.create_index([("parent_id", 1), ("nanny_id", 1)])
    await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await db.files.create_index("storage_path")
    try:
        if init_storage():
            logger.info("Storage initialized")
        else:
            logger.warning("Storage NOT initialized (missing EMERGENT_LLM_KEY)")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    logger.info("Indexes ready")


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)

# Build CORS allow list. With allow_credentials=True we cannot use wildcard.
frontend_url = os.environ.get("FRONTEND_URL", "")
cors_origins_env = os.environ.get("CORS_ORIGINS", "")
explicit_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip() and o.strip() != "*"]
allow_origins = list({*explicit_origins, frontend_url, "http://localhost:3000"} - {""})
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins or ["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.preview\.emergentagent\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
