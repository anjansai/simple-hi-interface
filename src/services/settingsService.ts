import { API_BASE, fetchWithApiKey, getCurrentApiKey } from './apiService';

export interface CatalogSettings {
  _id?: string;
  type: string;
  itemDelete: boolean;
  itemEdit: boolean;
}

// Fetch settings by type
export async function fetchSettings(type: string): Promise<CatalogSettings> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const response = await fetchWithApiKey(`${API_BASE}/settings/${type}`);
    
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
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    const settingsWithApiKey = {
      ...settings,
      apiKey // Include the API key to ensure it's saved to the correct collection
    };
    
    const response = await fetchWithApiKey(`${API_BASE}/settings/${settings.type}`, {
      method: 'PUT',
      body: JSON.stringify(settingsWithApiKey),
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