from fastapi import FastAPI, Depends, HTTPException, Header, File, UploadFile
from app.services.pdf_service import extract_text_from_pdf, get_text_chunks
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from app.services.vector_service import save_to_vector_store
from app.services.chat_service import ask_question

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

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user=Depends(verify_token)  # 🛡️ Protected by your Django JWT
):
    # 1. Check file type
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        # 2. Read the file into memory
        content = await file.read()

        # 3. Extract text using our service
        extracted_text = extract_text_from_pdf(content)

        # 4. Create the chunks
        chunks = get_text_chunks(extracted_text)

        save_to_vector_store(chunks, file.filename)

        # 5. Return professional metadata
        return {
            "filename": file.filename,
            "status": "processed",
            "total_chunks": len(chunks),
            "preview": extracted_text[:500] + "...",
            "total_characters": len(extracted_text),
            "user_id": user.get("user_id") # Proving we know who uploaded it
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/ask")
async def chat_with_docs(
    payload: dict,  # Expecting {"question": "..."}
    user=Depends(verify_token)
):
    question = payload.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    try:
        answer = ask_question(question)
        return {
            "question": question,
            "answer": answer,
            "sourced_from": "Sentinel Vector Store"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))