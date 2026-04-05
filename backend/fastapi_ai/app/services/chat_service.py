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
    model="gemini-3-flash-preview",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.2
)
# 1. Update signature: doc_id: str = None makes it optional
def ask_question(query: str, doc_id: str = None):
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)

    # 🎯 STEP 1: Fallback Logic
    # If no doc_id is provided, we target the public landing page data
    target_id = doc_id if doc_id else "website_guide"

    # 2. Search ChromaDB with the filter
    docs_with_scores = db.similarity_search_with_score(
        query,
        k=4,
        filter={'document_id': str(target_id)}
    )

    # 3. Calculate Trust Score (Distance based)
    if docs_with_scores:
        avg_distance = sum(score for doc, score in docs_with_scores) / len(docs_with_scores)
        # Scale: Closer to 0 is better. (1.5 is a safe threshold for Gemini embeddings)
        real_trust = max(0, min(100, int((1.5 - avg_distance) * 100)))
    else:
        real_trust = 0

    # 🎯 STEP 2: Persona Logic
    # We change the "System Prompt" based on whether it's a public enquiry or a private audit
    if target_id == "website_guide":
        system_role = (
            "You are the SentinelDocs AI Assistant. Your goal is to help visitors understand "
            "our SaaS platform. Explain our features (Auditing, RAG, Magic Polish), "
            "our registration process, and how developers can use our API.\n\n"
            "Be professional, helpful, and concise. Use the following context to answer:\n"
            "{context}"
        )
    else:
        system_role = (
            "You are an expert Document Auditor. Use the retrieved context to answer "
            "the user's question about their specific document strictly. "
            "If the answer isn't in the context, say you don't know.\n\n"
            "Context: {context}"
        )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_role),
        ("human", "{input}"),
    ])

    # 4. Chain Execution
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    
    docs_only = [doc for doc, score in docs_with_scores]
    response = question_answer_chain.invoke({
        "input": query, 
        "context": docs_only
    })

    # 5. Extract Sources (Optional for the Chat Bubble, but good for the Dashboard)
    sources = []
    for doc, score in docs_with_scores:
        sources.append({
            "page": doc.metadata.get("page", "N/A"),
            "content": doc.page_content[:150] + "...",
            "score": round(score, 3)
        })

    return {
        "answer": response,
        "sources": sources,
        "real_trust": real_trust
    }