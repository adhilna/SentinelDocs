from pypdf import PdfReader
import io
from langchain_text_splitters import RecursiveCharacterTextSplitter

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extracts all text from a PDF byte stream."""
    reader = PdfReader(io.BytesIO(file_content))
    text = ""
    for page in reader.pages:
        content = page.extract_text()
        if content:
            text += content + "\n"
    return text.strip()

def get_text_chunks(text: str):
    """Splits text into smaller, overlapping pieces for the AI."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks