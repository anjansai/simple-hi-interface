
const crypto = require('crypto');
const { collections, connectToDatabase } = require('./mongodb');

// SHA-1 hash function for passwords
function sha1(data) {
  return crypto.createHash('sha1').update(data).digest('hex');
}

// Generate a unique API key
function generateApiKey() {
  const timestamp = new Date().getTime().toString();
  const random = Math.random().toString();
  return crypto.createHash('sha256').update(timestamp + random).digest('hex').substring(0, 16);
}

// Generate a company ID based on company name
async function generateCompanyId(companyName) {
  try {
    await connectToDatabase();
    
    // Extract first 2 characters from company name, convert to uppercase
    const prefix = companyName.substring(0, 2).toUpperCase();
    
    // Find highest existing company ID with this prefix
    const regex = new RegExp(`^${prefix}\\d{5}$`);
    const existingIds = await collections.tenants.find(
      { companyId: { $regex: regex } }
    ).toArray();
    
    let highestCounter = 10000; // Start at 10001
    
    if (existingIds.length > 0) {
      // Extract counter numbers and find highest
      const counters = existingIds.map(tenant => {
        const match = tenant.companyId.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      });
      
      highestCounter = Math.max(...counters);
    }
    
    // Increment counter for new ID
    const newCounter = highestCounter + 1;
    const paddedCounter = newCounter.toString().padStart(5, '0');
    
    return `${prefix}${paddedCounter}`;
  } catch (error) {
    console.error('Failed to generate company ID:', error);
    throw error;
  }
}

// Create a new instance with all required collections
async function createNewInstance(instanceData) {
  try {
    await connectToDatabase();
    
    // Check if phone already exists
    const phoneExists = await collections.masterUsers.findOne({ userPhone: instanceData.userPhone });
    if (phoneExists) {
      throw new Error('A user with this phone number already exists');
    }
    
    // Generate API key and company ID
    const apiKey = generateApiKey();
    const companyId = await generateCompanyId(instanceData.companyName);
    
    // Create tenant record
    const tenant = {
      companyName: instanceData.companyName,
      companyEmail: instanceData.companyEmail || '',
      userName: instanceData.userName,
      userEmail: instanceData.userEmail,
      userPhone: instanceData.userPhone,
      password: instanceData.password, // Should already be hashed
      apiKey,
      companyId,
      subscription: 'Free',
      createdDate: new Date(),
      status: 'Active'
    };
    
    const result = await collections.tenants.insertOne(tenant);
    
    // Create required collections for the instance
    await Promise.all([
      // Create users collection and add admin user
      db.createCollection(`${apiKey}_users`),
      db.createCollection(`${apiKey}_items`),
      db.createCollection(`${apiKey}_orders`),
      db.createCollection(`${apiKey}_settings`),
      db.createCollection(`${apiKey}_inventory`)
    ]);
    
    // Add collections to the collections object
    collections[`${apiKey}_users`] = db.collection(`${apiKey}_users`);
    collections[`${apiKey}_items`] = db.collection(`${apiKey}_items`);
    collections[`${apiKey}_orders`] = db.collection(`${apiKey}_orders`);
    collections[`${apiKey}_settings`] = db.collection(`${apiKey}_settings`);
    collections[`${apiKey}_inventory`] = db.collection(`${apiKey}_inventory`);
    
    // Add admin user to users collection
    const adminUser = {
      userName: instanceData.userName,
      userEmail: instanceData.userEmail,
      userPhone: instanceData.userPhone,
      userRole: 'Admin',
      password: instanceData.password, // Should already be hashed
      userCreatedDate: new Date(),
      userUpdatedDate: new Date(),
      lastUserLoggedIn: null,
      userStatus: 'Active'
    };
    
    await collections[`${apiKey}_users`].insertOne(adminUser);
    
    // Add user to master users collection
    await collections.masterUsers.insertOne({
      userName: instanceData.userName,
      userEmail: instanceData.userEmail,
      userPhone: instanceData.userPhone,
      apiKey,
      companyId
    });
    
    // Return instance details
    return {
      companyName: instanceData.companyName,
      companyId,
      apiKey,
      userName: instanceData.userName,
      userEmail: instanceData.userEmail
    };
  } catch (error) {
    console.error('Failed to create new instance:', error);
    throw error;
  }
}

module.exports = {
  createNewInstance,
  generateApiKey,
  generateCompanyId
};
