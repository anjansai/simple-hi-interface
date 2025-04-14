
import { useAuth } from "@/contexts/AuthContext";

// Base URL for the API
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Function to get the current API key from local storage
export const getCurrentApiKey = (): string | null => {
  try {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    
    const parsed = JSON.parse(userData);
    return parsed.apiKey?.toLowerCase() || null;
  } catch (error) {
    console.error('Error getting current API key:', error);
    return null;
  }
};

// Helper hook to get the authenticated user's API key
export const useCurrentApiKey = () => {
  const { apiKey } = useAuth();
  return apiKey;
};

// Custom fetch function that adds the API key as a header
export const fetchWithApiKey = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const apiKey = getCurrentApiKey();
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(apiKey ? { 'X-API-Key': apiKey } : {})
  };
  
  return fetch(url, {
    ...options,
    headers
  });
};
