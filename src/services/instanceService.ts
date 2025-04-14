
import { sha1 } from '@/lib/utils';
import { API_BASE, fetchWithApiKey } from './apiService';

interface InitialLoginResponse {
  userName: string;
  userEmail: string;
  apiKey: string;
  companyId: string;
}

interface CompleteLoginData {
  userPhone: string;
  companyId: string;
  password: string;
}

// Step 1: Initial login check with phone and company ID
export async function checkInitialLogin(phone: string, companyId: string): Promise<InitialLoginResponse> {
  try {
    const response = await fetch(`${API_BASE}/login/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userPhone: phone, 
        companyId 
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Invalid credentials');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Login check error:', error);
    throw error;
  }
}

// Step 2: Complete login with password
export async function completeLogin(loginData: CompleteLoginData): Promise<any> {
  try {
    const hashedPassword = sha1(loginData.password);
    
    const response = await fetch(`${API_BASE}/login/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userPhone: loginData.userPhone,
        companyId: loginData.companyId,
        password: hashedPassword
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }
    
    const data = await response.json();
    
    // Return both the user data and the JWT token
    return {
      user: data.userData,
      token: data.token
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
}

// Create a new instance
export async function createNewInstance(instanceData: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/instances/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(instanceData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create instance');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Instance creation error:', error);
    throw error;
  }
}
