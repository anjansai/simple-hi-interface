
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithApiKey, API_BASE } from "@/services/apiService";

interface UserData {
  userName: string;
  userEmail?: string;
  userPhone: string;
  userRole?: string;
  apiKey?: string;
  companyId?: string;
  profileImage?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userData: UserData | null;
  apiKey: string | null;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userData: null,
  apiKey: null,
  login: () => {},
  logout: () => {},
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is authenticated on load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (token && storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        setIsAuthenticated(true);
        setUserData(parsedData);
        setApiKey(parsedData.apiKey?.toLowerCase() || null);
        
        // Refresh user data on initial load to get latest role
        refreshUserData();
      } catch (error) {
        console.error('Failed to parse user data:', error);
        // If parsing fails, clear localStorage and set as unauthenticated
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setIsAuthenticated(false);
        setUserData(null);
        setApiKey(null);
      }
    }
  }, []);

  const login = (token: string, userData: UserData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUserData(userData);
    setApiKey(userData.apiKey?.toLowerCase() || null);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    setUserData(null);
    setApiKey(null);
    navigate('/login');
  };

  // New function to refresh user data from server
  const refreshUserData = async () => {
    if (!isAuthenticated || !userData || !userData.userPhone || !apiKey) {
      return;
    }

    try {
      // Fetch latest user data using phone number and API key
      const response = await fetchWithApiKey(`${API_BASE}/users/refresh-data`, {
        method: 'POST',
        body: JSON.stringify({
          userPhone: userData.userPhone
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to refresh user data');
      }

      const freshUserData = await response.json();
      
      // Update local storage and state with fresh data
      if (freshUserData) {
        const updatedUserData = {
          ...userData,
          ...freshUserData,
        };
        
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userData,
        apiKey,
        login,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
