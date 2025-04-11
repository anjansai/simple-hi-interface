
import { sha1 } from '@/lib/utils';

// Base URL for the API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export interface UserFormData {
  userName: string;
  userPhone: string;
  userEmail?: string;
  userRole: string;
  password: string;
}

export interface UserUpdateData {
  userName: string;
  userEmail?: string;
  userRole: string;
}

// Fetch all users with optional role filter
export async function fetchUsers(role?: string): Promise<any[]> {
  try {
    let url = `${API_BASE}/users`;
    if (role) {
      url += `?role=${encodeURIComponent(role)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

// Fetch a specific user by ID
export async function fetchUser(id: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/users/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`Failed to fetch user with id ${id}:`, error);
    throw error;
  }
}

// Create a new user
export async function createUser(userData: UserFormData): Promise<any> {
  try {
    // Hash password before sending
    const data = {
      ...userData,
      password: sha1(userData.password)
    };
    
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create user');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Failed to create user:', error);
    throw error;
  }
}

// Update an existing user
export async function updateUser(id: string, userData: UserUpdateData): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`Failed to update user with id ${id}:`, error);
    throw error;
  }
}

// Delete (deactivate) a user
export async function deleteUser(id: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`Failed to delete user with id ${id}:`, error);
    throw error;
  }
}

// Fetch user roles
export async function fetchUserRoles(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/settings/userRoles`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user roles');
    }
    
    const data = await response.json();
    return data.roles || [];
  } catch (error: any) {
    console.error('Failed to fetch user roles:', error);
    // Return default roles if failed
    return ['Admin', 'Manager', 'Staff'];
  }
}

// Fetch staff settings
export async function fetchStaffSettings(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/settings/userEdit`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch staff settings');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Failed to fetch staff settings:', error);
    // Return default settings if failed
    return {
      userEdit: true,
      userDelete: true
    };
  }
}

// Update staff settings
export async function updateStaffSettings(settings: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/settings/userEdit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update settings');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    throw error;
  }
}

// Add a new role
export async function addUserRole(role: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/settings/userRoles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add role');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Failed to add role:', error);
    throw error;
  }
}
