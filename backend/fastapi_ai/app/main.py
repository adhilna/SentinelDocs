from fastapi import FastAPI, Depends, HTTPException, Header, File, UploadFile, Form
from app.services.pdf_service import extract_text_from_pdf, get_text_chunks
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from app.services.vector_service import save_to_vector_store
from app.services.chat_service import ask_question, llm
from app.services.polish_service import generate_polished_message
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
from langchain_chroma import Chroma
from app.services.vector_service import embeddings, CHROMA_PATH

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"], # Your Vite/React URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    doc_id: str = Form(...),
    user=Depends(verify_token)  # 🛡️ Protected by your Django JWT
):
    # 1. Check file type
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        content = await file.read()
        extracted_text = extract_text_from_pdf(content)

        # 4. Create the chunks
        chunks = get_text_chunks(extracted_text, document_id=doc_id)

        save_to_vector_store(chunks, file.filename, document_id=doc_id)

        # 5. Return professional metadata
        return {
            "filename": file.filename,
            "document_id": doc_id,
            "status": "processed",
            "total_chunks": len(chunks),
            "preview": extracted_text[:500] + "...",
            "total_characters": len(extracted_text),
            "user_id": user.get("user_id") # Proving we know who uploaded it
        }
    except Exception as e:
        if "invalid pdf header" in str(e).lower():
            raise HTTPException(status_code=400, detail="The file sent was not a valid PDF (received HTML instead).")
        raise HTTPException(status_code=500, detail=str(e))

class QuestionRequest(BaseModel):
    question: str
    document_id: str

@app.post("/ask")
async def chat_with_docs(
    request: QuestionRequest,
    user=Depends(verify_token)
):
    start_time = time.time()

    question = request.question
    doc_id = request.document_id

    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    try:
        # Pass the doc_id to your RAG logic to filter the search
        result = ask_question(question, doc_id=doc_id)

        end_time = time.time() # 👈 End timer
        latency = int((end_time - start_time) * 1000)

        return {
            "question": question,
            "answer": result["answer"],
            "document_id": doc_id,
            "sources": result["sources"],
            "confidence_score": result["real_trust"],
            "execution_time": latency,
            "trace_id": f"tr_{int(time.time())}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# FastAPI main.py
@app.delete("/api/vector-delete/{doc_id}")
async def delete_vector_data(doc_id: str, user=Depends(verify_token)):
    try:
        # 1. Connect to your existing ChromaDB
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        
        # 2. Delete chunks where document_id matches
        # This matches the 'document_id' you sent during upload!
        db.delete(where={"document_id": doc_id})
        
        print(f"CLEANUP: Deleted vectors for doc_id {doc_id}")
        return {"status": "success", "message": f"Vectors for {doc_id} wiped"}
    except Exception as e:
        print(f"CLEANUP ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class PolishRequest(BaseModel):
    message: str

@app.post("/polish")
async def polish(request: PolishRequest):
    if not request.message:
        return {"error": "Message is empty"}
    
    polished_text = generate_polished_message(llm, request.message)
    return {"polished_content": polished_text}