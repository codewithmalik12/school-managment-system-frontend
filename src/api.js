// This file centralizes all backend API calls

// Since we setup the Vite proxy in vite.config.js, we can just use '/api'
// as our requests will be proxied to http://localhost:3000
const BASE_URL = 'https://school-managment-system-backend-production.up.railway.app/api';

export const checkConnection = async () => {
    try {
        const response = await fetch(`${BASE_URL}/status`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error connecting to backend:", error);
        throw error;
    }
};
