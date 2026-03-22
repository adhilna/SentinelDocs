import { aiApi } from './axiosConfig';

export const aiService = {
    // 1. Magic Polish
    polishMessage: async (message: string) => {
        const response = await aiApi.post('/polish', { message });
        return response.data; // Expects { polished_content: "..." }
    },

    // 2. RAG Chat (Ask about Resume/Docs)
    askQuestion: async (question: string) => {
        const response = await aiApi.post('/ask', { question });
        return response.data;
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