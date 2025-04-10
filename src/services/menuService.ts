
export interface MenuItem {
  _id?: string;
  itemName: string;
  itemCode: string;
  MRP: number;
  Type: number;
  Category: string;
  StarterType?: string;
  available?: boolean;
  // For compatibility with existing code, we'll map these fields
  name?: string;
  category?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
}

// Base URL for the API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Helper to map type codes to categories
export function getTypeCategory(type: number): string {
  switch (type) {
    case 222: return 'Starters';
    case 223: return 'Main course';
    case 224: return 'Desserts';
    case 225: return 'Beverages';
    case 226: return 'Specials';
    case 227: return 'Others';
    default: return 'Others';
  }
}

// Helper to map categories to type codes
export function getCategoryType(category: string): number {
  switch (category) {
    case 'Starters': return 222;
    case 'Main course': return 223;
    case 'Desserts': return 224;
    case 'Beverages': return 225;
    case 'Specials': return 226;
    case 'Others': return 227;
    default: return 227;
  }
}

// Generate a unique item code (sequential numbering only)
export async function generateItemCode(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/settings/generate-code`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.code;
  } catch (error) {
    console.error("Failed to generate item code:", error);
    throw error;
  }
}

// Check if an item name already exists
export async function checkItemNameExists(name: string, excludeId?: string): Promise<boolean> {
  try {
    const url = new URL(`${API_BASE}/menu/check-name`);
    url.searchParams.append('name', name);
    if (excludeId) url.searchParams.append('excludeId', excludeId);
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Failed to check if item name exists:", error);
    throw error;
  }
}

// Get all menu items
export async function getAllMenuItems(): Promise<MenuItem[]> {
  try {
    console.log("Fetching menu items from:", `${API_BASE}/menu`);
    const response = await fetch(`${API_BASE}/menu`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Menu items received:", data);
    
    // Ensure we have proper data and normalize fields
    const validatedData = Array.isArray(data) ? data.map(item => ({
      ...item,
      // Keep original fields
      itemName: item.itemName || '',
      itemCode: item.itemCode || '',
      MRP: typeof item.MRP === 'number' ? item.MRP : parseFloat(item.MRP) || 0,
      Type: item.Type,
      Category: item.Category || '',
      description: item.description || '',
      // Map to compatibility fields for existing code
      name: item.itemName || '',
      category: item.Category || getTypeCategory(item.Type),
      price: typeof item.MRP === 'number' ? item.MRP : parseFloat(item.MRP) || 0
    })) : [];
    
    return validatedData;
  } catch (error) {
    console.error("Failed to fetch menu items:", error);
    return []; // Return empty array instead of throwing
  }
}

// Get menu items by category
export async function getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
  try {
    const response = await fetch(`${API_BASE}/menu/category/${category}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Failed to fetch menu items for category ${category}:`, error);
    return []; // Return empty array instead of throwing
  }
}

// Add a new menu item
export async function addMenuItem(item: MenuItem): Promise<MenuItem> {
  try {
    const response = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to add menu item:", error);
    throw error;
  }
}

// Update a menu item
export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update menu item with id ${id}:`, error);
    throw error;
  }
}

// Delete a menu item
export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to delete menu item with id ${id}:`, error);
    throw error;
  }
}
