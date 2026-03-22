import axios from 'axios';

// Create an instance for FastAPI (AI Services)
export const aiApi = axios.create({
    baseURL: 'http://localhost:8001',
    headers: { 'Content-Type': 'application/json' }
});

// Create an instance for Django (Auth/User Services)
export const authApi = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Content-Type': 'application/json' }
});