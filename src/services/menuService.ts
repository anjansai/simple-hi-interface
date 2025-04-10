
// MenuItem interface defines the structure of a menu item from the database
export interface MenuItem {
  _id?: string;
  itemName: string;
  itemCode: string;
  MRP: number;
  Type: number;
  Variant: string;
  StarterType?: string;
  available?: boolean;
  description?: string;
  // For compatibility with existing code, we'll map these fields
  name?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
}

// Base URL for the API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Helper to map type codes to categories
export function getTypeCategory(type: number): string {
  switch (type) {
    case 222: return 'Starters';
    case 223: return 'Main Courses';
    case 224: return 'Desserts';
    case 225: return 'Beverages';
    case 226: return 'Specials';
    default: return 'Other';
  }
}

// Helper to map category names to type codes
export function getCategoryType(category: string): number {
  switch (category) {
    case 'Starters': return 222;
    case 'Main course': return 223;
    case 'Desserts': return 224;
    case 'Beverages': return 225;
    case 'Specials': return 226;
    default: return 0;
  }
}

// Get category prefix for item codes
export function getCategoryPrefix(category: string): string {
  switch (category) {
    case 'Starters': return 'SC';
    case 'Main course': return 'MC';
    case 'Desserts': return 'D';
    case 'Beverages': return 'B';
    case 'Specials': return 'S';
    default: return 'OT';
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
      Variant: item.Variant || '',
      description: item.description || '',
      // Map to compatibility fields for existing code
      name: item.itemName || '',
      category: item.Variant || getTypeCategory(item.Type),
      price: typeof item.MRP === 'number' ? item.MRP : parseFloat(item.MRP) || 0,
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

// Check if item name exists
export async function checkItemNameExists(name: string, excludeId?: string): Promise<boolean> {
  try {
    const items = await getAllMenuItems();
    return items.some(item => 
      item.itemName.toLowerCase() === name.toLowerCase() && 
      (!excludeId || item._id !== excludeId)
    );
  } catch (error) {
    console.error("Failed to check item name:", error);
    throw error;
  }
}

// Generate a unique item code for a category
export async function generateItemCode(category: string): Promise<string> {
  try {
    const prefix = getCategoryPrefix(category);
    const response = await fetch(`${API_BASE}/menu/generate-code/${prefix}`);
    
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

// Check if item code exists
export async function checkItemCodeExists(code: string): Promise<boolean> {
  try {
    const items = await getAllMenuItems();
    return items.some(item => item.itemCode === code);
  } catch (error) {
    console.error("Failed to check item code:", error);
    throw error;
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
