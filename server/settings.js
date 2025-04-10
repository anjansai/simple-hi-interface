
const { collections, connectToDatabase, toObjectId } = require('./mongodb');

// Get settings by type
async function getSettingsByType(type) {
  try {
    await connectToDatabase();
    const settings = await collections.settings.findOne({ type });
    return settings || { type, itemDelete: false, itemEdit: true };
  } catch (error) {
    console.error(`Failed to fetch settings for type ${type}:`, error);
    throw error;
  }
}

// Update settings
async function updateSettings(type, updates) {
  try {
    await connectToDatabase();
    const result = await collections.settings.updateOne(
      { type },
      { $set: updates },
      { upsert: true }
    );
    return { ...updates, type };
  } catch (error) {
    console.error(`Failed to update settings for type ${type}:`, error);
    throw error;
  }
}

// Generate unique sequential item code
async function generateUniqueCode() {
  try {
    await connectToDatabase();
    
    // Find all items and sort by itemCode to find the highest code
    const items = await collections.menu.find({})
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
