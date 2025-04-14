
const { collections, connectToDatabase } = require('./mongodb');

// Create a new instance
async function createNewInstance(instanceData) {
  try {
    const { db } = await connectToDatabase();
    
    // Generate API key (simplified for example)
    const apiKey = instanceData.companyName
      .replace(/\s+/g, '')
      .toLowerCase()
      .substring(0, 8) +
      '_' +
      Date.now().toString().substring(9, 13);
    
    // Create tenant record
    const tenant = {
      companyName: instanceData.companyName,
      companyId: instanceData.companyId,
      userPhone: instanceData.userPhone,
      userName: instanceData.userName,
      apiKey: apiKey,
      createdAt: new Date(),
      status: 'Active'
    };
    
    // Insert into tenants collection
    await collections.tenants.insertOne(tenant);
    
    // Insert into master users collection
    const masterUser = {
      userName: instanceData.userName,
      userEmail: instanceData.userEmail || '',
      userPhone: instanceData.userPhone,
      apiKey: apiKey,
      companyId: instanceData.companyId,
      profileImage: null,
      createdAt: new Date()
    };
    await collections.masterUsers.insertOne(masterUser);
    
    // Create new collections for this instance
    const apiKeyLower = apiKey.toLowerCase();
    const collectionNames = [
      `${apiKeyLower}_users`,
      `${apiKeyLower}_items`,
      `${apiKeyLower}_orders`,
      `${apiKeyLower}_settings`,
      `${apiKeyLower}_inventory`
    ];
    
    // Create all necessary collections for this instance
    for (const collectionName of collectionNames) {
      try {
        await db.createCollection(collectionName);
        
        // Store reference to the new collection
        collections[collectionName] = db.collection(collectionName);
      } catch (error) {
        console.error(`Error creating collection ${collectionName}:`, error);
        // Continue with other collections even if one fails
      }
    }
    
    // Add default admin user to the users collection
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    await usersCollection.insertOne({
      userName: instanceData.userName,
      userEmail: instanceData.userEmail || '',
      userPhone: instanceData.userPhone,
      userRole: 'Admin',
      password: instanceData.password,
      userCreatedDate: new Date(),
      userUpdatedDate: new Date(),
      lastUserLoggedIn: null,
      userStatus: 'Active',
      profileImage: null
    });
    
    // Add default settings
    const settingsCollection = collections[`${apiKeyLower}_settings`];
    
    // Add basic catalog settings
    await settingsCollection.insertOne({
      type: 'catalog',
      itemDelete: false,
      itemEdit: true,
      apiKey: apiKeyLower
    });
    
    // Add user roles
    await settingsCollection.insertOne({
      type: 'userRoles',
      roles: ['Admin', 'Manager', 'Staff'],
      apiKey: apiKeyLower
    });
    
    // Add user edit settings
    await settingsCollection.insertOne({
      type: 'userEdit',
      userEdit: true,
      userDelete: true,
      apiKey: apiKeyLower
    });
    
    return {
      success: true, 
      apiKey,
      message: 'Instance created successfully'
    };
  } catch (error) {
    console.error('Failed to create new instance:', error);
    throw error;
  }
}

module.exports = {
  createNewInstance
};
