import { authApi } from "./axiosConfig";

export const documentService = {
    upload: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        // Django expects 'file' based on our previous model discussion

        const response = await authApi.post("/api/documents/upload/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    getDocuments: async () => {
        const response = await authApi.get("/api/documents/");
        return response.data;
    },

    deleteDocument: async (docId: string | number) => {
        const response = await authApi.delete(`/api/documents/${docId}/`);
        return response.data;
    },

    updateScore: async (docId: string, score: number) => {
        // Hits the new Django PATCH endpoint
        const response = await authApi.patch(`/api/documents/${docId}/score/`, { score });
        return response.data;
    }
};