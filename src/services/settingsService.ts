
// Settings service for fetching and updating application settings

export interface CatalogSettings {
  _id?: string;
  type: string;
  itemDelete: boolean;
  itemEdit: boolean;
}

// Base URL for the API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Fetch settings by type
export async function fetchSettings(type: string): Promise<CatalogSettings> {
  try {
    const response = await fetch(`${API_BASE}/settings/${type}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch settings for type ${type}:`, error);
    // Return default settings if not found
    return {
      type,
      itemDelete: false,
      itemEdit: true
    };
  }
}

// Update settings
export async function updateSettings(settings: CatalogSettings): Promise<CatalogSettings> {
  try {
    const response = await fetch(`${API_BASE}/settings/${settings.type}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
}
