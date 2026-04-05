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

authApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 (Unauthorized) and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark this request so we don't loop forever

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                // 1. Call Django to get a fresh Access Token
                const res = await axios.post('http://localhost:8000/api/token/refresh/', {
                    refresh: refreshToken,
                });

                if (res.status === 200) {
                    const newAccessToken = res.data.access;

                    // 2. Save the new token
                    localStorage.setItem('accessToken', newAccessToken);

                    // 3. Update the failed request with the new token and RETRY it
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return authApi(originalRequest);
                }
            } catch (refreshError) {
                // If the Refresh Token is ALSO expired, then the user MUST log in again
                console.error("Refresh token expired. Logging out...");
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

aiApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');

        // Only attach if token exists. 
        // If it's a public endpoint (like /enquiry), the backend won't look for this header anyway.
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Add this so AI requests also refresh the token if they fail
aiApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Use the SAME refresh logic as authApi
                const refreshToken = localStorage.getItem('refreshToken');
                const res = await axios.post('http://localhost:8000/api/token/refresh/', {
                    refresh: refreshToken,
                });

                const newAccessToken = res.data.access;
                localStorage.setItem('accessToken', newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return aiApi(originalRequest); // Retry AI request
            } catch (err) {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);