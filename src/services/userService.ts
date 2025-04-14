
import { sha1 } from '@/lib/utils';
import { API_BASE, fetchWithApiKey, getCurrentApiKey } from './apiService';

export interface UserFormData {
  userName: string;
  userPhone: string;
  userEmail?: string;
  userRole: string;
  password?: string;
  profileImage?: string | null;
}

export interface UserUpdateData {
  userName: string;
  userEmail?: string;
  userRole: string;
  profileImage?: string | null;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  status: 'Active' | 'Deleted' | 'Others' | 'all-status';
}

// Fetch all users with optional role filter and pagination
export async function fetchUsers(
  role?: string, 
  pagination?: PaginationParams
): Promise<{users: any[], pagination: any}> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    let url = `${API_BASE}/users`;
    const params = new URLSearchParams();
    
    // Add filters
    if (role && role !== 'all-roles') {
      params.append('role', role);
    }
    
    if (pagination) {
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());
      
      if (pagination.status && pagination.status !== 'all-status') {
        params.append('status', pagination.status);
      }
    }
    
    // Add params to URL if any exist
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    const response = await fetchWithApiKey(url);
    
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

// Export users to CSV
export async function exportUsersToCSV(status: string = 'Active'): Promise<string> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const url = `${API_BASE}/users/export/csv?status=${encodeURIComponent(status)}`;
    
    const response = await fetchWithApiKey(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to export users: ${errorText}`);
    }
    
    return await response.text();
  } catch (error: any) {
    console.error('Failed to export users:', error);
    throw error;
  }
}

// Fetch a specific user by ID
export async function fetchUser(id: string): Promise<any> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/users/${id}`);
    
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

// Adding getUserById as an alias for fetchUser to fix the import issue
export const getUserById = fetchUser;

// Create a new user
export async function createUser(userData: UserFormData): Promise<any> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    // Hash password before sending if it exists
    const data = {
      ...userData,
      password: userData.password ? sha1(userData.password) : undefined,
      apiKey, // Add the current API key to ensure it's saved to the right collection
      companyId: apiKey.toLowerCase() // Use apiKey as companyId
    };
    
    const response = await fetchWithApiKey(`${API_BASE}/users`, {
      method: 'POST',
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

// Re-enable a previously deleted user
export async function reEnableUser(id: string, userData: UserUpdateData): Promise<any> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const data = {
      ...userData,
      apiKey,
      companyId: apiKey.toLowerCase()
    };
    
    const response = await fetchWithApiKey(`${API_BASE}/users/${id}/re-enable`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to re-enable user');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`Failed to re-enable user with id ${id}:`, error);
    throw error;
  }
}

// Permanently delete a user
export async function permanentlyDeleteUser(id: string): Promise<any> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/users/${id}/permanent`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to permanently delete user');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`Failed to permanently delete user with id ${id}:`, error);
    throw error;
  }
}

// Update an existing user
export async function updateUser(id: string, userData: UserUpdateData): Promise<any> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({...userData, apiKey}),
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
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/users/${id}`, {
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
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      console.warn('No API key found. Using default roles.');
      return ['Admin', 'Manager', 'Staff'];
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/settings/userRoles`);
    
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
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/settings/userEdit`);
    
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
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/settings/userEdit`, {
      method: 'PUT',
      body: JSON.stringify({...settings, apiKey}),
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
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/settings/userRoles`, {
      method: 'POST',
      body: JSON.stringify({ role, apiKey }),
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
