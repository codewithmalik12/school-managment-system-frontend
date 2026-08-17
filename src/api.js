// Centralized backend API helpers

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const parseJsonResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
        try {
            data = await response.json();
        } catch (err) {
            throw new Error("Failed to parse JSON response from server.");
        }
    } else {
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch (e) {
            if (!response.ok) {
                throw new Error("Backend server is not running or unreachable on http://localhost:3000. Please start the backend server by running 'node server.js' in Smsbackend folder.");
            }
            throw new Error("Backend server did not return valid JSON. Please check server output.");
        }
    }

    if (!response.ok) {
        throw new Error(data?.message || `Server error (${response.status})`);
    }

    return data;
};

export const checkConnection = async () => {
    try {
        const response = await fetch(`${BASE_URL}/status`);
        return await parseJsonResponse(response);
    } catch (error) {
        console.error("Error connecting to backend:", error);
        throw error;
    }
};
