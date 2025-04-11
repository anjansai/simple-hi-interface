
// Menu service for fetching and managing menu items

export interface MenuItem {
  _id?: string;
  itemName: string;
  itemCode: string;
  Category: string;
  image?: string;
  description?: string;
  MRP: number;
  sellingPrice?: number;
  isAvailable?: boolean;
  isVeg?: boolean;
  discount?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Base URL for the API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Fetch all menu items
export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const response = await fetch(`${API_BASE}/menu`);
    
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
    const response = await fetch(`${API_BASE}/menu/category/${encodeURIComponent(category)}`);
    
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
    let url = `${API_BASE}/menu/check-name?name=${encodeURIComponent(name)}`;
    if (excludeId) {
      url += `&excludeId=${excludeId}`;
    }
    
    const response = await fetch(url);
    
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
    let url = `${API_BASE}/menu/check-code?code=${encodeURIComponent(code)}`;
    if (excludeId) {
      url += `&excludeId=${excludeId}`;
    }
    
    const response = await fetch(url);
    
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
    // Validate MRP is a valid number
    if (item.MRP === undefined || item.MRP === null || isNaN(Number(item.MRP)) || Number(item.MRP) <= 0) {
      throw new Error('Price must be a valid number greater than 0');
    }

    const response = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
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
    // Remove _id from updates to avoid immutable field error
    delete updates._id;
    
    // Validate MRP is a valid number if it's being updated
    if (updates.MRP !== undefined && (isNaN(Number(updates.MRP)) || Number(updates.MRP) <= 0)) {
      throw new Error('Price must be a valid number greater than 0');
    }
    
    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
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
    const response = await fetch(`${API_BASE}/menu/${id}`, {
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

// Generate a unique menu item code
export async function generateUniqueCode(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/settings/generate-code`);
    
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
