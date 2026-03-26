import os
import hashlib
import httpx
from fastapi import Header, HTTPException, status, Depends
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
DJANGO_INTERNAL_URL = "http://localhost:8000/api/documents/keys/verify_key_internal/"

# --- 1. JWT Logic (Moved from main.py) ---
async def verify_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Token")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (JWTError, ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Invalid token")

# --- 2. API Key Logic ---
async def validate_api_key(x_api_key: str = Header(None)):
    if not x_api_key:
        return None

    incoming_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(DJANGO_INTERNAL_URL, json={"key_hash": incoming_hash})
            if response.status_code == 200 and response.json().get("valid"):
                return response.json()
        except Exception:
            return None
    return None

# --- 3. The Universal Guard ---
async def get_current_user_universal(
    authorization: str = Header(None),
    x_api_key: str = Header(None)
):
    # Try JWT first
    if authorization:
        try:
            user = await verify_token(authorization)
            return user
        except HTTPException:
            pass

    # Try API Key second
    if x_api_key:
        user = await validate_api_key(x_api_key)
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required (Valid JWT or X-API-Key)"
    )