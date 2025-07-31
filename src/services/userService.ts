
import { API_BASE, getCurrentApiKey, fetchWithApiKey } from './apiService';

// Types
export interface UserFormData {
  name: string;
  userName?: string;
  userPhone: string;
  userEmail?: string;
  userRole: string;
  password: string;
  profileImage?: string;
}

export interface UserUpdateData {
  name?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  userRole?: string;
  password?: string;
  profileImage?: string;
}

export interface User {
  _id: string;
  name: string;
  userName?: string;
  userPhone: string;
  userEmail?: string;
  userRole: string;
  status: string;
  createdDate: string;
  deletedDate?: string;
  reEnabledDate?: string;
  profileImage?: string;
  isDeleted?: boolean;
  deletedUser?: any;
  userCreatedDate?: string;
  userStatus?: string;
}

export interface UserData {
  _id: string;
  name: string;
  userName?: string;
  userPhone: string;
  userEmail?: string;
  userRole: string;
  status: string;
  createdDate?: string;
  deletedDate?: string;
  reEnabledDate?: string;
  profileImage?: string;
  isDeleted?: boolean;
  deletedUser?: any;
  userCreatedDate?: string;
  userStatus?: string;
}

export interface FetchUsersResponse {
  users: UserData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pageSize: number;
    totalPages: number;
  };
}

// Export users to CSV with status filter
export async function exportUsersToCSV(status: string = 'Active'): Promise<string> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    // Get current user data
    const userData = localStorage.getItem('userData');
    if (!userData) {
      throw new Error('No user data found. Please log in again.');
    }
    
    const parsedData = JSON.parse(userData);
    const userPhone = parsedData.userPhone;
    
    const url = `${API_BASE}/users/export/csv?status=${encodeURIComponent(status)}&userPhone=${encodeURIComponent(userPhone)}`;
    
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

// Fetch user roles
export async function fetchUserRoles(): Promise<string[]> {
  try {
    const response = await fetchWithApiKey(`${API_BASE}/users/roles`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user roles');
    }
    
    const data = await response.json();
    return data.roles || [];
  } catch (error: any) {
    console.error('Failed to fetch user roles:', error);
    throw error;
  }
}

// Add a new user role
export async function addUserRole(role: string): Promise<void> {
  try {
    const response = await fetchWithApiKey(`${API_BASE}/users/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add user role: ${errorText}`);
    }
  } catch (error: any) {
    console.error('Failed to add user role:', error);
    throw error;
  }
}

// Fetch staff settings
export async function fetchStaffSettings(): Promise<{ userEdit: boolean; userDelete: boolean }> {
  try {
    const response = await fetchWithApiKey(`${API_BASE}/users/settings`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch staff settings');
    }
    
    const data = await response.json();
    return data.settings || { userEdit: true, userDelete: true };
  } catch (error: any) {
    console.error('Failed to fetch staff settings:', error);
    throw error;
  }
}

// Update staff settings
export async function updateStaffSettings(settings: { userEdit: boolean; userDelete: boolean }): Promise<void> {
  try {
    const response = await fetchWithApiKey(`${API_BASE}/users/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update staff settings: ${errorText}`);
    }
  } catch (error: any) {
    console.error('Failed to update staff settings:', error);
    throw error;
  }
}

// Fetch users
export async function fetchUsers(
  role?: string, 
  options?: { 
    page: number; 
    pageSize: number; 
    status: 'Active' | 'Deleted' | 'Others' 
  }
): Promise<FetchUsersResponse> {
  try {
    let url = `${API_BASE}/users`;
    const params = new URLSearchParams();
    
    if (role) {
      params.append('role', role);
    }
    if (options) {
      params.append('page', options.page.toString());
      params.append('pageSize', options.pageSize.toString());
      params.append('status', options.status);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetchWithApiKey(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const data = await response.json();
    return {
      users: data.users || [],
      pagination: data.pagination
    };
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

// Fetch single user
export async function fetchUser(userId: string): Promise<User> {
  try {
    const response = await fetchWithApiKey(`${API_BASE}/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    
    const data = await response.json();
    return data.user;
  } catch (error: any) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

// Create user
export async function createUser(userData: UserFormData): Promise<User> {
  try {
    const response = await fetchWithApiKey(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create user: ${errorText}`);
    }
    
    const data = await response.json();
    return data.user;
  } catch (error: any) {
    console.error('Failed to create user:', error);
    throw error;
  }
}

// Update user
export async function updateUser(userId: string, userData: UserUpdateData): Promise<User> {
  try {
    const response = await fetchWithApiKey(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update user: ${errorText}`);
    }
    
    const data = await response.json();
    return data.user;
  } catch (error: any) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

// Delete user (soft delete)
export async function deleteUser(userId: string): Promise<void> {
  try {
    const response = await fetchWithApiKey(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete user: ${errorText}`);
    }
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}

// Permanently delete user
export async function permanentlyDeleteUser(userId: string): Promise<void> {
  try {
    const response = await fetchWithApiKey(`${API_BASE}/users/${userId}/permanent`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to permanently delete user: ${errorText}`);
    }
  } catch (error: any) {
    console.error('Failed to permanently delete user:', error);
    throw error;
  }
}

// Re-enable deleted user
export async function reEnableUser(userId: string, userData: UserUpdateData): Promise<User> {
  try {
    const response = await fetchWithApiKey(`${API_BASE}/users/${userId}/re-enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to re-enable user: ${errorText}`);
    }
    
    const data = await response.json();
    return data.user;
  } catch (error: any) {
    console.error('Failed to re-enable user:', error);
    throw error;
  }
}
