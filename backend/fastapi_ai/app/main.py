from fastapi import FastAPI, Depends, HTTPException, Header
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def verify_token(authorization: str = Header(...)):
    try:
        scheme, token = authorization.split()

        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload

    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/secure")
def secure_route(user=Depends(verify_token)):
    return {"user": user}