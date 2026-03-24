import { aiApi } from './axiosConfig';

export const aiService = {
    // 1. Magic Polish
    polishMessage: async (message: string) => {
        const response = await aiApi.post('/polish', { message });
        return response.data; // Expects { polished_content: "..." }
    },

    // 2. RAG Chat (Ask about Resume/Docs)
    askQuestion: async (question: string, documentId: string | number) => {
        // Ensure we are sending a plain object
        const payload = {
            question: question,
            document_id: String(documentId) // Ensure it's a string to match Pydantic
        };

        console.log("React is sending this payload:", payload);

        try {
            const response = await aiApi.post('/ask', payload);
            return response.data;
        } catch (error: any) {
            // THIS LOG WILL TELL US EVERYTHING:
            console.error("FastAPI Error Detail:", error.response?.data?.detail);
            throw error;
        }
    },

    // 3. PDF Upload
    uploadPDF: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await aiApi.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};