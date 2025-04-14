
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

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
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userData: null,
  apiKey: null,
  login: () => {},
  logout: () => {},
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

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userData,
        apiKey,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
