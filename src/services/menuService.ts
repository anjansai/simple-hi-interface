
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

// Generate a unique item code (sequential numbering)
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

// Check if an item code already exists
export async function checkItemCodeExists(code: string, excludeId?: string): Promise<boolean> {
  try {
    const url = new URL(`${API_BASE}/menu/check-code`);
    url.searchParams.append('code', code);
    if (excludeId) url.searchParams.append('excludeId', excludeId);
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      if (response.status === 404) {
        console.warn("checkItemCodeExists endpoint not found, assuming code doesn't exist");
        return false;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Failed to check if item code exists:", error);
    return false;
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
      if (response.status === 404) {
        console.warn("checkItemNameExists endpoint not found, assuming name doesn't exist");
        return false;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Failed to check if item name exists:", error);
    return false;
  }
}

// Export menu items to CSV
export function exportToCSV(items: MenuItem[]): void {
  // Define CSV headers
  const headers = [
    'Item Name',
    'Item Code',
    'Category',
    'Price',
    'Type',
    'Description',
    'Starter Type',
    'Available',
    'Image URL'
  ];
  
  // Convert items to CSV rows
  const rows = items.map(item => [
    item.itemName || '',
    item.itemCode || '',
    item.Category || '',
    item.MRP ? item.MRP.toString() : '0',
    item.Type ? item.Type.toString() : '0',
    item.description || '',
    item.StarterType || '',
    item.available !== undefined ? item.available.toString() : 'true',
    item.imageUrl || ''
  ]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape commas and quotes in cell values
      const cellValue = String(cell).replace(/"/g, '""');
      return `"${cellValue}"`;
    }).join(','))
  ].join('\n');
  
  // Create a Blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  
  link.setAttribute('href', url);
  link.setAttribute('download', `menu-items-${date}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
      imageUrl: item.imageUrl || '',
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
    const response = await fetch(`${API_BASE}/menu/category/${encodeURIComponent(category)}`);
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
    console.log("Adding menu item:", JSON.stringify(item));
    const response = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      let errorMessage = "Failed to add menu item";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use the default error message
      }
      throw new Error(errorMessage);
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
    console.log("Updating menu item:", id, "with data:", JSON.stringify(updates));
    
    // Clean up the updates object
    const cleanUpdates: Partial<MenuItem> = { ...updates };
    if (cleanUpdates.MRP === null || isNaN(cleanUpdates.MRP as number)) {
      cleanUpdates.MRP = 0;
    }
    
    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanUpdates),
    });
    
    // Handle response
    if (!response.ok) {
      let errorMessage = "Failed to update menu item";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use the default error message
      }
      throw new Error(errorMessage);
    }
    
    // Parse the JSON response
    const result = await response.json();
    return { 
      success: true,
      ...result
    };
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

// Upload an image and get URL
export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTimeout(() => {
          resolve(reader.result as string);
        }, 500);
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload image:", error);
      reject(error);
    }
  });
}
