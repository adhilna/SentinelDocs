from pypdf import PdfReader
import io
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extracts all text from a PDF byte stream."""
    reader = PdfReader(io.BytesIO(file_content))
    text = ""
    for page in reader.pages:
        content = page.extract_text()
        if content:
            text += content + "\n"
    return text.strip()

def get_text_chunks(text: str, document_id: str):
    """Splits text into Document objects tagged with the document_id."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    
    # 1. Split the raw text into a list of strings
    raw_chunks = text_splitter.split_text(text)
    
    # 2. Convert those strings into LangChain Document objects with metadata
    docs = []
    for chunk in raw_chunks:
        new_doc = Document(
            page_content=chunk,
            metadata={"document_id": str(document_id)} # Force to String
        )
        docs.append(new_doc)
        
    return docs