import { API_BASE, fetchWithApiKey, getCurrentApiKey } from './apiService';

export interface MenuItem {
  _id?: string;
  itemName: string;
  itemCode: string;
  Category: string;
  imageUrl?: string;
  image?: string;
  description?: string;
  MRP: number;
  sellingPrice?: number;
  isAvailable?: boolean;
  isVeg?: boolean;
  discount?: number;
  StarterType?: string;
  Type?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Fetch all menu items
export async function getAllMenuItems(): Promise<MenuItem[]> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/menu`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    throw error;
  }
}

// Fetch menu items by category
export async function fetchMenuItemsByCategory(category: string): Promise<MenuItem[]> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/menu/category/${encodeURIComponent(category)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch menu items for category ${category}:`, error);
    throw error;
  }
}

// Check if an item name already exists (for validation)
export async function checkItemNameExists(name: string, excludeId?: string): Promise<boolean> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    let url = `${API_BASE}/menu/check-name?name=${encodeURIComponent(name)}`;
    if (excludeId) {
      url += `&excludeId=${excludeId}`;
    }
    
    const response = await fetchWithApiKey(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error(`Failed to check if item name exists: ${name}`, error);
    throw error;
  }
}

// Check if an item code already exists (for validation)
export async function checkItemCodeExists(code: string, excludeId?: string): Promise<boolean> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    let url = `${API_BASE}/menu/check-code?code=${encodeURIComponent(code)}`;
    if (excludeId) {
      url += `&excludeId=${excludeId}`;
    }
    
    const response = await fetchWithApiKey(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error(`Failed to check if item code exists: ${code}`, error);
    throw error;
  }
}

// Add a new menu item
export async function addMenuItem(item: MenuItem): Promise<MenuItem> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    // Validate MRP is a valid number
    if (item.MRP === undefined || item.MRP === null || isNaN(Number(item.MRP)) || Number(item.MRP) <= 0) {
      throw new Error('Price must be a valid number greater than 0');
    }

    const response = await fetchWithApiKey(`${API_BASE}/menu`, {
      method: 'POST',
      body: JSON.stringify({...item, apiKey}),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to add menu item`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to add menu item:', error);
    throw error;
  }
}

// Update a menu item
export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    // Remove _id from updates to avoid immutable field error
    delete updates._id;
    
    // Validate MRP is a valid number if it's being updated
    if (updates.MRP !== undefined && (isNaN(Number(updates.MRP)) || Number(updates.MRP) <= 0)) {
      throw new Error('Price must be a valid number greater than 0');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify({...updates, apiKey}),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to update menu item');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to update menu item with id ${id}:`, error);
    throw error;
  }
}

// Delete a menu item
export async function deleteMenuItem(id: string): Promise<void> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/menu/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
  } catch (error) {
    console.error(`Failed to delete menu item with id ${id}:`, error);
    throw error;
  }
}

// Generate a unique menu item code (alias for generateUniqueCode for backward compatibility)
export async function generateItemCode(): Promise<string> {
  return generateUniqueCode();
}

// Generate a unique menu item code
export async function generateUniqueCode(): Promise<string> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/settings/generate-code`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    return data.code;
  } catch (error) {
    console.error('Failed to generate unique code:', error);
    throw error;
  }
}

// Upload an image for a menu item
export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // For a simple mock, we'll just return a data URL
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setTimeout(() => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      }, 500); // Simulate network delay
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}

// Export menu items to CSV
export async function exportToCSV(items: MenuItem[]): Promise<void> {
  try {
    if (!items || items.length === 0) {
      throw new Error("No items to export");
    }

    // Create CSV header row
    const headers = ["Item Name", "Item Code", "Category", "Price", "Description"];
    
    // Create CSV rows from items
    const rows = items.map(item => [
      `"${item.itemName || ''}"`,
      `"${item.itemCode || ''}"`,
      `"${item.Category || ''}"`,
      `"${typeof item.MRP === 'number' ? item.MRP.toFixed(2) : '0.00'}"`,
      `"${item.description || ''}"`
    ]);
    
    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `menu-items-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Failed to export to CSV:", error);
    throw error;
  }
}