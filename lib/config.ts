// This file provides a single source of truth for the backend API URL.
export const API_BASE_URL = (() => {
  try {
    return import.meta.env.VITE_API_BASE_URL || 
           import.meta.env.VITE_API_URL || 
           ""; // Default to relative path for better SEO and proxy compatibility
  } catch (e) {
    return "";
  }
})();

export const PUBLIC_BASE_URL = (() => {
  try {
    return import.meta.env.VITE_PUBLIC_BASE_URL || 
           "https://www.hogicar.com";
  } catch (e) {
    return "https://www.hogicar.com";
  }
})();
