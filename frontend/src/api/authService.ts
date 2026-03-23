import { authApi } from './axiosConfig';
import { AxiosError } from 'axios';

// 1. Define the interface to match your Django Serializer
export interface RegisterData {
    username: string;
    email: string;
    password: string;
    password_confirm: string; // Required for our custom Django validation
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export const authService = {
    // 2. Registration Logic
    register: async (userData: RegisterData) => {
        try {
            // Updated path to match Django urls.py
            const response = await authApi.post('/api/register/', userData);
            return response.data;
        } catch (err: unknown) {
            const axiosError = err as AxiosError;
            // Throw the specific Django error (e.g., "Passwords do not match")
            throw axiosError.response?.data || "Registration failed";
        }
    },

    // 3. Login Logic with Token Management
    login: async (credentials: LoginCredentials) => {
        try {
            const response = await authApi.post('/api/login/', credentials);

            // If success, Django returns { access: "...", refresh: "..." }
            if (response.data.access) {
                localStorage.setItem('accessToken', response.data.access);
                localStorage.setItem('refreshToken', response.data.refresh);
            }

            return response.data;
        } catch (err: unknown) {
            const axiosError = err as AxiosError;
            throw axiosError.response?.data || "Login failed";
        }
    },

    // 4. Helper to clear tokens
    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },

    // 5. Get Current User Profile
    getCurrentUser: async () => {
        try {
            // This calls your /api/me/ GET route
            const response = await authApi.get('/api/me/');
            return response.data;
        } catch (err: unknown) {
            const axiosError = err as AxiosError;
            throw axiosError.response?.data || "Failed to fetch profile";
        }
    },

    // 6. Update Profile (Handles Text + Avatar)
    updateProfile: async (profileData: {
        email?: string,
        organization?: string,
        role?: string,
        avatar?: File | null
    }) => {
        try {
            // We use FormData to handle the file upload
            const formData = new FormData();

            if (profileData.email) formData.append('email', profileData.email);
            if (profileData.organization) formData.append('organization', profileData.organization);
            if (profileData.role) formData.append('role', profileData.role);

            // Only append avatar if a new file was actually selected
            if (profileData.avatar) {
                formData.append('avatar', profileData.avatar);
            }

            // PATCH request to /api/me/
            // Axios automatically sets 'Content-Type': 'multipart/form-data' 
            // when it detects a FormData object.
            const response = await authApi.patch('/api/me/', formData);
            return response.data;
        } catch (err: unknown) {
            const axiosError = err as AxiosError;
            throw axiosError.response?.data || "Update failed";
        }
    },
};