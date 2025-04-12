
import { sha1 } from '@/lib/utils';

// Base URL for the API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export interface InstanceData {
  companyName: string;
  companyEmail?: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  password: string;
}

export interface UserLoginData {
  userPhone: string;
  companyId: string;
  password: string;
}

// Create a new instance
export async function createNewInstance(data: InstanceData): Promise<any> {
  try {
    // Hash password before sending
    const hashedData = {
      ...data,
      password: sha1(data.password)
    };
    
    const response = await fetch(`${API_BASE}/instances/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hashedData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create instance');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Failed to create instance:', error);
    throw error;
  }
}

// Step 1: Initial login check
export async function checkInitialLogin(phone: string, companyId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/auth/check-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, companyId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Invalid credentials');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Login check failed:', error);
    throw error;
  }
}

// Complete login with password
export async function completeLogin(loginData: UserLoginData): Promise<any> {
  try {
    // Hash password before sending
    const data = {
      ...loginData,
      password: sha1(loginData.password)
    };
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed. Please check your credentials.');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Login failed:', error);
    throw error;
  }
}
