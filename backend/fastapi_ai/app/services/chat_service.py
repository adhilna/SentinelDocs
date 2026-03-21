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

def ask_question(query: str):
    # 2. Connect to ChromaDB
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
    retriever = db.as_retriever()

    # 3. Create the Prompt Template
    system_prompt = (
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer the question. "
        "If you don't know the answer, just say that you don't know. "
        "\n\n"
        "{context}"
    )
    
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{input}"),
        ]
    )

    # 4. Create the Chain
    # This replaces the old RetrievalQA
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    # 5. Execute
    response = rag_chain.invoke({"input": query})
    return response["answer"]