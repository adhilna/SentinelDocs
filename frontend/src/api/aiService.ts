import { aiApi } from "./axiosConfig";
import { AxiosError } from "axios";

/* ================= TYPES ================= */

type PolishResponse = {
    polished_content: string;
};

type AskResponse = {
    answer: string;
    confidence_score: number;
    sources: {
        page: number;
        paragraph: string;
        relevance: number;
    }[];
    execution_time?: number;
    trace_id?: string;
};

interface AskResponse2 {
    answer: string;
    confidence?: number;
}

type UploadResponse = {
    filename?: string;
    message?: string;
};

type ErrorResponse = {
    detail?: string;
    message?: string;
};

/* ================= SERVICE ================= */

export const aiService = {
    // 1. Magic Polish
    polishMessage: async (message: string): Promise<PolishResponse> => {
        const response = await aiApi.post<PolishResponse>("/polish", {
            message,
        });
        return response.data;
    },

    sendEnquiry: async (question: string): Promise<AskResponse2> => {
        const response = await aiApi.post<AskResponse2>("/enquiry", {
            question,
        });
        return response.data;
    },

    // 2. RAG Chat (Ask about Resume/Docs)
    askQuestion: async (
        question: string,
        documentId: string | number
    ): Promise<AskResponse> => {
        const payload = {
            question,
            document_id: String(documentId),
        };

        console.log("React is sending this payload:", payload);

        try {
            const response = await aiApi.post<AskResponse>("/ask", payload);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                const errData = error.response?.data as ErrorResponse | undefined;

                console.error(
                    "FastAPI Error Detail:",
                    errData?.detail || errData?.message
                );
            }

            throw error; // rethrow (important)
        }
    },

    // 3. PDF Upload
    uploadPDF: async (file: File): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await aiApi.post<UploadResponse>(
            "/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    },


};