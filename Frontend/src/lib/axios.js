import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.MODE === "development"? "http://localhost:5001":import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
});

export default api;