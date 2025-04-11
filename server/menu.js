
const { collections, connectToDatabase, toObjectId } = require('./mongodb');

// Get all menu items
async function getAllMenuItems() {
  try {
    await connectToDatabase();
    return await collections.menu.find({}).toArray();
  } catch (error) {
    console.error("Failed to fetch menu items:", error);
    throw error;
  }
}

// Get menu items by category
async function getMenuItemsByCategory(category) {
  try {
    await connectToDatabase();
    return await collections.menu.find({ Category: category }).toArray();
  } catch (error) {
    console.error(`Failed to fetch menu items for category ${category}:`, error);
    throw error;
  }
}

// Check if item name exists
async function checkItemNameExists(name, excludeId = null) {
  try {
    await connectToDatabase();
    const query = { itemName: { $regex: new RegExp(`^${name}$`, 'i') } };
    
    // If excluding an item by ID, add it to the query
    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) };
    }
    
    const count = await collections.menu.countDocuments(query);
    return count > 0;
  } catch (error) {
    console.error(`Failed to check if item name exists: ${name}`, error);
    throw error;
  }
}

// Check if item code exists
async function checkItemCodeExists(code, excludeId = null) {
  try {
    await connectToDatabase();
    const query = { itemCode: code };
    
    // If excluding an item by ID, add it to the query
    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) };
    }
    
    const count = await collections.menu.countDocuments(query);
    return count > 0;
  } catch (error) {
    console.error(`Failed to check if item code exists: ${code}`, error);
    throw error;
  }
}

// Add a new menu item
async function addMenuItem(item) {
  try {
    await connectToDatabase();
    const result = await collections.menu.insertOne(item);
    return { ...item, _id: result.insertedId };
  } catch (error) {
    console.error("Failed to add menu item:", error);
    throw error;
  }
}

// Update a menu item
async function updateMenuItem(id, updates) {
  try {
    await connectToDatabase();
    
    // Convert id to ObjectId
    const objectId = toObjectId(id);
    if (!objectId) {
      throw new Error("Invalid ID format");
    }
    
    // Check if the item exists
    const existingItem = await collections.menu.findOne({ _id: objectId });
    if (!existingItem) {
      throw new Error("Item not found");
    }
    
    console.log("Updating menu item with id:", id, "Updates:", JSON.stringify(updates));
    
    const result = await collections.menu.updateOne(
      { _id: objectId },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      throw new Error("Item not found");
    }
    
    return { 
      success: true, 
      matchedCount: result.matchedCount, 
      modifiedCount: result.modifiedCount,
      message: "Menu item updated successfully" 
    };
  } catch (error) {
    console.error(`Failed to update menu item with id ${id}:`, error);
    throw error;
  }
}

// Delete a menu item
async function deleteMenuItem(id) {
  try {
    await connectToDatabase();
    const result = await collections.menu.deleteOne({ _id: toObjectId(id) });
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
