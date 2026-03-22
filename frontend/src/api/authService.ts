import { authApi } from './axiosConfig';

export interface RegisterData {
    username: string;
    email: string;
    password?: string; // Optional if using OAuth, but usually required
    full_name?: string;
}

export const authService = {
    // 2. Use the Interface instead of 'any'
    register: async (userData: RegisterData) => {
        const response = await authApi.post('/api/register/', userData);
        return response.data;
    },

    // You can do the same for login
    login: async (credentials: Record<string, string>) => {
        const response = await authApi.post('/api/login/', credentials);
        return response.data;
    }
};