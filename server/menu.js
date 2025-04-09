
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
    return await collections.menu.find({ category }).toArray();
  } catch (error) {
    console.error(`Failed to fetch menu items for category ${category}:`, error);
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
    const result = await collections.menu.updateOne(
      { _id: toObjectId(id) },
      { $set: updates }
    );
    return result;
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
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
};
