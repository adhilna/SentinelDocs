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

def save_to_vector_store(chunks: list, filename: str):
    """Turns text chunks into vectors and saves them to disk."""
    
    # Wrap chunks in LangChain "Document" objects with metadata
    docs = [
        Document(page_content=chunk, metadata={"source": filename}) 
        for chunk in chunks
    ]
    
    # Initialize and save to ChromaDB
    db = Chroma.from_documents(
        docs, 
        embeddings, 
        persist_directory=CHROMA_PATH
    )
    return True