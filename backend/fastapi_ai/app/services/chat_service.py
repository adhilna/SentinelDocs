import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma

# UPDATED 2026 IMPORTS
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

from langchain_core.prompts import ChatPromptTemplate
from app.services.vector_service import embeddings, CHROMA_PATH

load_dotenv()

# 1. Setup the LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# Updated function signature to accept doc_id
def ask_question(query: str, doc_id: str):
    # 2. Connect to ChromaDB
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)

    # 🎯 NEW: Use similarity_search_with_score to get the 'Distance'
    # This returns a list of (Document, Score) tuples
    docs_with_scores = db.similarity_search_with_score(
        query, 
        k=4, 
        filter={'document_id': str(doc_id)}
    )

    # 3. Calculate a real Trust Score based on Vector Distance
    if docs_with_scores:
        # Chroma distance: 0.0 is perfect, 1.0+ is very different
        avg_distance = sum(score for doc, score in docs_with_scores) / len(docs_with_scores)
        
        # Logic: Convert distance to a 0-100 scale
        # If distance is 0.2, trust is 80%. If distance is 0.7, trust is 30%.
        real_trust = max(0, min(100, int((1.75 - avg_distance) * 100)))
    else:
        real_trust = 0

    # 4. Create the Prompt & Chain (Keep your existing system_prompt)
    system_prompt = (
        "You are an expert Document Auditor. "
        "Use the retrieved context to answer the question...\n\n"
        "Context: {context}"
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    # 5. Execute using the documents we already found
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    
    # We pass the docs we manually retrieved above into the chain
    docs_only = [doc for doc, score in docs_with_scores]
    response = question_answer_chain.invoke({
        "input": query, 
        "context": docs_only
    })

    # 6. Extract Metadata for UI
    sources = []
    for doc, score in docs_with_scores:
        sources.append({
            "page": doc.metadata.get("page", 1),
            "paragraph": doc.page_content[:200] + "...",
            "relevance": round((1 - score), 2) # Individual relevance for each chunk
        })

    return {
        "answer": response, # Note: stuff_chain returns a string directly
        "sources": sources,
        "real_trust": real_trust
    }