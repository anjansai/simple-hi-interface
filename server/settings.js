
const { collections, connectToDatabase, toObjectId } = require('./mongodb');

// Get settings by type
async function getSettingsByType(type, apiKey) {
  try {
    await connectToDatabase();
    
    if (!apiKey) {
      // Return default settings if no API key
      return { type, itemDelete: false, itemEdit: true };
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const settingsCollection = collections[`${apiKeyLower}_settings`] || collections.settings;
    
    // Try to get settings from instance-specific collection
    const settings = await settingsCollection.findOne({ type, apiKey: apiKeyLower });
    
    if (settings) {
      return settings;
    }
    
    // Fallback to general settings
    const generalSettings = await collections.settings.findOne({ type });
    return generalSettings || { type, itemDelete: false, itemEdit: true };
  } catch (error) {
    console.error(`Failed to fetch settings for type ${type}:`, error);
    throw error;
  }
}

// Update settings
async function updateSettings(type, updates, apiKey) {
  try {
    await connectToDatabase();
    
    if (!apiKey) {
      throw new Error('API key is required to update settings');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const settingsCollection = collections[`${apiKeyLower}_settings`] || collections.settings;
    
    // Ensure we're storing the api key in the document
    const updatesWithApiKey = {
      ...updates,
      apiKey: apiKeyLower,
      type
    };
    
    const result = await settingsCollection.updateOne(
      { type, apiKey: apiKeyLower },
      { $set: updatesWithApiKey },
      { upsert: true }
    );
    
    return updatesWithApiKey;
  } catch (error) {
    console.error(`Failed to update settings for type ${type}:`, error);
    throw error;
  }
}

// Generate unique sequential item code
async function generateUniqueCode(apiKey) {
  try {
    await connectToDatabase();
    
    if (!apiKey) {
      throw new Error('API key is required to generate a unique code');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const menuCollection = collections[`${apiKeyLower}_items`] || collections.menu;
    
    // Find all items and sort by itemCode to find the highest code
    const items = await menuCollection.find({})
      .sort({ itemCode: -1 })
      .toArray();
    
    let nextNumber = 1001; // Start with default
    
    if (items.length > 0) {
      // Extract numbers from existing codes and find the highest
      const numbers = items.map(item => {
        if (!item.itemCode) return 0;
        
        const match = item.itemCode.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      });
      
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }
    
    return `${nextNumber}`;
  } catch (error) {
    console.error(`Failed to generate unique code:`, error);
    throw error;
  }
}

module.exports = {
  getSettingsByType,
  updateSettings,
  generateUniqueCode
};
