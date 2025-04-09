
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Connection URI (defaulting to localhost if no env variable is set)
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/restaurantDB";

// Create a MongoClient with connection options
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Database and collections
let db;
const collections = {};

// Connect to MongoDB
async function connectToDatabase() {
  try {
    if (!db) {
      await client.connect();
      console.log('Connected to MongoDB at:', uri);
      db = client.db();
      
      // Initialize collections - make sure to use restaurantDB_items
      collections.menu = db.collection('restaurantDB_items');
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
async function closeConnection() {
  await client.close();
  console.log('MongoDB connection closed');
}

// Helper function to convert string IDs to ObjectId
function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (error) {
    console.error(`Invalid ObjectId: ${id}`);
    throw new Error(`Invalid ObjectId: ${id}`);
  }
}

module.exports = {
  connectToDatabase,
  closeConnection,
  collections,
  toObjectId,
  ObjectId
};
