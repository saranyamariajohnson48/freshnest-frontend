// Prefer environment-configured base URL; fallback to backend on port 5001
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";