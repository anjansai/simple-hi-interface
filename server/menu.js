const { collections, connectToDatabase, toObjectId } = require('./mongodb');

// Get all menu items
async function getAllMenuItems(apiKey) {
  try {
    await connectToDatabase();
    
    if (!apiKey) {
      throw new Error('API key is required to fetch menu items');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const menuCollection = collections[`${apiKeyLower}_items`];
    
    if (!menuCollection) {
      console.warn(`Menu collection for API key ${apiKey} not found. Returning empty array.`);
      return [];
    }
    
    return await menuCollection.find({}).toArray();
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    throw error;
  }
}

// Get menu items by category
async function getMenuItemsByCategory(category, apiKey) {
  try {
    await connectToDatabase();
    
    if (!apiKey) {
      throw new Error('API key is required to fetch menu items by category');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const menuCollection = collections[`${apiKeyLower}_items`];
    
    if (!menuCollection) {
      console.warn(`Menu collection for API key ${apiKey} not found. Returning empty array.`);
      return [];
    }
    
    return await menuCollection.find({ Category: category }).toArray();
  } catch (error) {
    console.error(`Failed to fetch menu items for category ${category}:`, error);
    throw error;
  }
}

// Check if item name exists
async function checkItemNameExists(name, excludeId, apiKey) {
  try {
    await connectToDatabase();
    
    if (!apiKey) {
      throw new Error('API key is required to check if item name exists');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const menuCollection = collections[`${apiKeyLower}_items`];
    
    if (!menuCollection) {
      return false; // If collection doesn't exist, name doesn't exist
    }
    
    const query = { itemName: name };
    
    // If we're excluding a specific item (for updates)
    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) };
    }
    
    const count = await menuCollection.countDocuments(query);
    return count > 0;
  } catch (error) {
    console.error(`Failed to check if item name exists: ${name}`, error);
    throw error;
  }
}

// Check if item code exists
async function checkItemCodeExists(code, excludeId, apiKey) {
  try {
    await connectToDatabase();
    
    if (!apiKey) {
      throw new Error('API key is required to check if item code exists');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const menuCollection = collections[`${apiKeyLower}_items`];
    
    if (!menuCollection) {
      return false; // If collection doesn't exist, code doesn't exist
    }
    
    const query = { itemCode: code };
    
    // If we're excluding a specific item (for updates)
    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) };
    }
    
    const count = await menuCollection.countDocuments(query);
    return count > 0;
  } catch (error) {
    console.error(`Failed to check if item code exists: ${code}`, error);
    throw error;
  }
}

// Add a menu item
async function addMenuItem(item, apiKey) {
  try {
    await connectToDatabase();
    
    if (!apiKey) {
      throw new Error('API key is required to add a menu item');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const menuCollection = collections[`${apiKeyLower}_items`];
    
    if (!menuCollection) {
      throw new Error(`Menu collection for API key ${apiKey} not found`);
    }
    
    // Add timestamps
    const now = new Date();
    const itemWithTimestamps = {
      ...item,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await menuCollection.insertOne(itemWithTimestamps);
    return { ...itemWithTimestamps, _id: result.insertedId };
  } catch (error) {
    console.error('Failed to add menu item:', error);
    throw error;
  }
}

// Update a menu item
async function updateMenuItem(id, updates, apiKey) {
  try {
    await connectToDatabase();
    
    if (!apiKey) {
      throw new Error('API key is required to update a menu item');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const menuCollection = collections[`${apiKeyLower}_items`];
    
    if (!menuCollection) {
      throw new Error(`Menu collection for API key ${apiKey} not found`);
    }
    
    // Add updated timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await menuCollection.updateOne(
      { _id: toObjectId(id) },
      { $set: updatesWithTimestamp }
    );
    
    return result;
  } catch (error) {
    console.error(`Failed to update menu item with id ${id}:`, error);
    throw error;
  }
}

// Delete a menu item
async function deleteMenuItem(id, apiKey) {
  try {
    await connectToDatabase();
    
    if (!apiKey) {
      throw new Error('API key is required to delete a menu item');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const menuCollection = collections[`${apiKeyLower}_items`];
    
    if (!menuCollection) {
      throw new Error(`Menu collection for API key ${apiKey} not found`);
    }
    
    const result = await menuCollection.deleteOne({ _id: toObjectId(id) });
    return result;
  } catch (error) {
    console.error(`Failed to delete menu item with id ${id}:`, error);
    throw error;
  }
}

module.exports = {
  getAllMenuItems,
  getMenuItemsByCategory,
  checkItemNameExists,
  checkItemCodeExists,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
};