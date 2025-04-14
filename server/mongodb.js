
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
      
      // Initialize collections
      collections.menu = db.collection('restaurantDB_items');
      collections.orders = db.collection('orders');
      collections.tables = db.collection('tables');
      collections.staff = db.collection('staff');
      collections.settings = db.collection('restaurantDB_settings');
      collections.tenants = db.collection('tenants');
      collections.masterUsers = db.collection('masterUsers');
      
      console.log('Core collections initialized:', Object.keys(collections).join(', '));
      
      // Try to initialize existing instance collections
      try {
        const tenants = await collections.tenants.find().toArray();
        console.log(`Found ${tenants.length} tenants, initializing their collections...`);
        
        for (const tenant of tenants) {
          const apiKey = tenant.apiKey.toLowerCase();
          const collectionPrefixes = ['_users', '_items', '_orders', '_settings', '_inventory'];
          
          for (const prefix of collectionPrefixes) {
            const collectionName = `${apiKey}${prefix}`;
            collections[collectionName] = db.collection(collectionName);
          }
        }
      } catch (err) {
        console.error('Error initializing tenant collections:', err);
      }
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
  ObjectId,
  db: () => db
};
