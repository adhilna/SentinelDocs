import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

load_dotenv()

# 1. Setup the Embedding Model (The "Translator" to numbers)
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-2-preview", # High-performance 2026 model
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# 2. Setup the Database path
CHROMA_PATH = "chroma_db"

def save_to_vector_store(chunks: list, filename: str, document_id: str):
    """
    Receives a list of Document objects (already stamped with ID) 
    and saves them to ChromaDB.
    """
    try:
        if not chunks:
            print("DEBUG: No chunks provided to save_to_vector_store")
            return False

        # 🎯 CRITICAL: Just pass 'chunks' directly. 
        # Do NOT wrap them in 'docs = [Document(...)]' again.
        db = Chroma.from_documents(
            documents=chunks, 
            embedding=embeddings, 
            persist_directory=CHROMA_PATH
        )
        
        # This helps your 2015 Mac finish the file write
        print(f"DEBUG: Successfully saved {len(chunks)} chunks for ID: {document_id}")
        return True
        
    except Exception as e:
        print(f"VECTOR STORE ERROR: {str(e)}")
        return False