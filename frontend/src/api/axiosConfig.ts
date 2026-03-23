import axios from 'axios';

//Instance for FastAPI (AI Services)
export const aiApi = axios.create({
    baseURL: 'http://localhost:8001',
    headers: { 'Content-Type': 'application/json' }
});

//Instance for Django (Auth/User Services)
export const authApi = axios.create({
    baseURL: 'http://localhost:8000',
});

// 🛡️ The "Security Guard" Interceptor
authApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            // Attach the token to the Authorization header
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 🔄 Optional: Handle 401 (Expired Token) automatically
authApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("Session expired. Redirecting to login...");
            // localStorage.removeItem('accessToken');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);