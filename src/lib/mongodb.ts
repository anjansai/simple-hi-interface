
import { MongoClient, ServerApiVersion } from 'mongodb';

// Connection URI (defaulting to localhost if no env variable is set)
const uri = import.meta.env.VITE_MONGODB_URI || "mongodb://localhost:27017/restaurantDB";

// Create a MongoClient with connection options
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Database and collections
let db: any;
export const collections: { [key: string]: any } = {};

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    if (!db) {
      await client.connect();
      console.log('Connected to MongoDB at:', uri);
      db = client.db();
      
      // Initialize collections
      collections.menu = db.collection('menu');
      collections.orders = db.collection('orders');
      collections.tables = db.collection('tables');
      collections.staff = db.collection('staff');
      
      console.log('Collections initialized:', Object.keys(collections).join(', '));
    }
    return { db, collections };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Close connection when app shuts down
export async function closeConnection() {
  await client.close();
  console.log('MongoDB connection closed');
}

// Example function to get all items from a collection
export async function getAll(collectionName: string) {
  await connectToDatabase();
  return collections[collectionName].find({}).toArray();
}

// Example function to get item by ID
export async function getById(collectionName: string, id: string) {
  await connectToDatabase();
  return collections[collectionName].findOne({ _id: id });
}

// Example function to insert a document
export async function insertOne(collectionName: string, document: any) {
  await connectToDatabase();
  return collections[collectionName].insertOne(document);
}

// Example function to update a document
export async function updateOne(collectionName: string, id: string, update: any) {
  await connectToDatabase();
  return collections[collectionName].updateOne({ _id: id }, { $set: update });
}

// Example function to delete a document
export async function deleteOne(collectionName: string, id: string) {
  await connectToDatabase();
  return collections[collectionName].deleteOne({ _id: id });
}
