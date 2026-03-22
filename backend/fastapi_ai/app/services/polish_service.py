def generate_polished_message(llm, original_text: str):
    system_prompt = (
        "You are a professional writing assistant. "
        "Rewrite the following message to be professional, clear, and minimalist. "
        "Maintain the user's intent but improve the grammar and tone. "
        "Keep it concise."
    )
    
    combined_prompt = f"{system_prompt}\n\nUser Message: {original_text}"
    response = llm.invoke(combined_prompt)
    return response.content