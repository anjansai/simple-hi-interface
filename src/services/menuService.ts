
// MenuItem interface defines the structure of a menu item
export interface MenuItem {
  _id?: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  available: boolean;
}

// Base URL for the API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Get all menu items
export async function getAllMenuItems() {
  try {
    const response = await fetch(`${API_BASE}/menu`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch menu items:", error);
    throw error;
  }
}

// Get menu items by category
export async function getMenuItemsByCategory(category: string) {
  try {
    const response = await fetch(`${API_BASE}/menu/category/${category}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch menu items for category ${category}:`, error);
    throw error;
  }
}

// Add a new menu item
export async function addMenuItem(item: MenuItem) {
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
export async function updateMenuItem(id: string, updates: Partial<MenuItem>) {
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
export async function deleteMenuItem(id: string) {
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
