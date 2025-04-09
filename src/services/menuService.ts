
// MenuItem interface defines the structure of a menu item
export interface MenuItem {
  _id?: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl?: string;
  available: boolean;
}

// Base URL for the API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

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
    return Array.isArray(data) ? data : [];
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
