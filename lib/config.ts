// This file provides a single source of truth for the backend API URL.
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  import.meta.env.VITE_API_URL || 
  "https://hogicar-backend.onrender.com";
