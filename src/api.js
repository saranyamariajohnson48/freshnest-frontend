// Prefer environment-configured base URL; fallback to backend on port 3001
// In production, this should be set to your actual backend URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? "https://your-backend-api-url.vercel.app" : "http://localhost:3001");