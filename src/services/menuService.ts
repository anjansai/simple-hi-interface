
import { ObjectId } from 'mongodb';
import { connectToDatabase, collections } from '@/lib/mongodb';

export interface MenuItem {
  _id?: string | ObjectId;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  available: boolean;
}

// Get all menu items
export async function getAllMenuItems() {
  try {
    await connectToDatabase();
    return await collections.menu.find({}).toArray();
  } catch (error) {
    console.error("Failed to fetch menu items:", error);
    throw error;
  }
}

// Get menu items by category
export async function getMenuItemsByCategory(category: string) {
  try {
    await connectToDatabase();
    return await collections.menu.find({ category }).toArray();
  } catch (error) {
    console.error(`Failed to fetch menu items for category ${category}:`, error);
    throw error;
  }
}

// Add a new menu item
export async function addMenuItem(item: MenuItem) {
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
export async function updateMenuItem(id: string, updates: Partial<MenuItem>) {
  try {
    await connectToDatabase();
    const result = await collections.menu.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return result;
  } catch (error) {
    console.error(`Failed to update menu item with id ${id}:`, error);
    throw error;
  }
}

// Delete a menu item
export async function deleteMenuItem(id: string) {
  try {
    await connectToDatabase();
    const result = await collections.menu.deleteOne({ _id: new ObjectId(id) });
    return result;
  } catch (error) {
    console.error(`Failed to delete menu item with id ${id}:`, error);
    throw error;
  }
}
