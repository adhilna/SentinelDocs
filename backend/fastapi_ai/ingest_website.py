import os
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

# 🎯 Import your existing config to ensure 100% compatibility
from app.services.vector_service import embeddings, CHROMA_PATH

load_dotenv()

# Path to your brochure/info file
TXT_FILE_PATH = os.path.join(os.path.dirname(__file__), "website_info.txt")

def ingest_site_info():
    if not os.path.exists(TXT_FILE_PATH):
        print(f"❌ Error: {TXT_FILE_PATH} not found!")
        return

    # 1. Load the text file
    with open(TXT_FILE_PATH, "r") as f:
        content = f.read()

    # 2. Split into chunks (Optimal for Gemini embeddings)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=100)
    chunks = text_splitter.split_text(content)

    # 3. Create Documents with the 'website_guide' metadata
    documents = [
        Document(
            page_content=chunk, 
            metadata={"document_id": "website_guide"}
        ) 
        for chunk in chunks
    ]

    # 4. Connect to your existing ChromaDB
    db = Chroma(
        persist_directory=CHROMA_PATH, 
        embedding_function=embeddings
    )

    # 5. Clean up old "website_guide" data to avoid duplicates
    print("Refreshing website guide data...")
    try:
        # Note: If your version of langchain_chroma uses a different delete syntax:
        db.delete(where={"document_id": "website_guide"})
    except Exception as e:
        print(f"Note: Could not delete old data (might be empty): {e}")

    # 6. Add the new documents
    db.add_documents(documents)
    print(f"✅ Successfully ingested {len(documents)} chunks into 'website_guide' using Gemini!")

if __name__ == "__main__":
    ingest_site_info()