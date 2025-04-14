
const crypto = require('crypto');
const { collections, connectToDatabase, toObjectId } = require('./mongodb');

// SHA-1 hash function for passwords
function sha1(data) {
  return crypto.createHash('sha1').update(data).digest('hex');
}

// Get all users with optional role filter
async function getUsers(role, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    if (!usersCollection) {
      throw new Error(`Users collection for API key ${apiKey} not found`);
    }
    
    const query = role ? { userRole: role, userStatus: { $ne: 'Deleted' } } : { userStatus: { $ne: 'Deleted' } };
    
    return await usersCollection.find(query).toArray();
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}

// Get user by ID
async function getUserById(id, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    if (!usersCollection) {
      throw new Error(`Users collection for API key ${apiKey} not found`);
    }
    
    return await usersCollection.findOne({ _id: toObjectId(id), userStatus: { $ne: 'Deleted' } });
  } catch (error) {
    console.error(`Failed to fetch user with id ${id}:`, error);
    throw error;
  }
}

// Check if phone number exists
async function checkPhoneExists(phone, excludeId = null, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    if (!usersCollection) {
      return false; // If collection doesn't exist yet, phone doesn't exist
    }
    
    const query = { userPhone: phone, userStatus: { $ne: 'Deleted' } };
    
    // If excluding a specific user (for updates)
    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) };
    }
    
    const count = await usersCollection.countDocuments(query);
    
    // Also check master users collection
    const masterCount = await collections.masterUsers.countDocuments({ userPhone: phone });
    
    return count > 0 || masterCount > 0;
  } catch (error) {
    console.error(`Failed to check if phone exists: ${phone}`, error);
    throw error;
  }
}

// Find deleted user by phone number
async function findDeletedUser(phone, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    if (!usersCollection) {
      return null;
    }
    
    return await usersCollection.findOne({ userPhone: phone, userStatus: 'Deleted' });
  } catch (error) {
    console.error(`Failed to find deleted user: ${phone}`, error);
    throw error;
  }
}

// Create a new user
async function createUser(userData, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    if (!usersCollection) {
      throw new Error(`Users collection for API key ${apiKey} not found`);
    }
    
    // Check if this user was previously deleted
    const deletedUser = await findDeletedUser(userData.userPhone, apiKey);
    if (deletedUser) {
      return { 
        isDeleted: true, 
        deletedUser 
      };
    }
    
    // Check if phone already exists
    const phoneExists = await checkPhoneExists(userData.userPhone, null, apiKey);
    if (phoneExists) {
      throw new Error('A user with this phone number already exists');
    }
    
    // Prepare user data
    const now = new Date();
    const newUser = {
      userName: userData.userName,
      userEmail: userData.userEmail || '',
      userPhone: userData.userPhone,
      userRole: userData.userRole,
      password: userData.password, // Should already be hashed before reaching here
      userCreatedDate: now,
      userUpdatedDate: now,
      lastUserLoggedIn: null,
      userStatus: 'Active',
      profileImage: userData.profileImage || null
    };
    
    // Insert into users collection
    const result = await usersCollection.insertOne(newUser);
    
    // Also insert into master users collection
    await collections.masterUsers.insertOne({
      userName: userData.userName,
      userEmail: userData.userEmail || '',
      userPhone: userData.userPhone,
      apiKey: apiKey,
      companyId: userData.companyId || apiKeyLower,  // Use apiKey as companyId if not provided
    });
    
    return { ...newUser, _id: result.insertedId };
  } catch (error) {
    console.error("Failed to create user:", error);
    throw error;
  }
}

// Update a user
async function updateUser(id, updates, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    if (!usersCollection) {
      throw new Error(`Users collection for API key ${apiKey} not found`);
    }
    
    const userToUpdate = await usersCollection.findOne({ _id: toObjectId(id) });
    if (!userToUpdate) {
      return null;
    }
    
    // Update user document
    const updateData = {
      ...updates,
      userUpdatedDate: new Date()
    };
    
    const result = await usersCollection.updateOne(
      { _id: toObjectId(id) },
      { $set: updateData }
    );
    
    // Update in master users collection as well
    const masterUpdateData = {
      userName: updates.userName,
      userEmail: updates.userEmail || ''
    };
    
    await collections.masterUsers.updateOne(
      { userPhone: userToUpdate.userPhone, apiKey },
      { $set: masterUpdateData }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error(`Failed to update user with id ${id}:`, error);
    throw error;
  }
}

// Deactivate a user (soft delete)
async function deactivateUser(id, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    if (!usersCollection) {
      throw new Error(`Users collection for API key ${apiKey} not found`);
    }
    
    const userToDelete = await usersCollection.findOne({ _id: toObjectId(id) });
    if (!userToDelete) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // Update user status to Deleted and add deletion date
    const result = await usersCollection.updateOne(
      { _id: toObjectId(id) },
      { 
        $set: { 
          userStatus: 'Deleted', 
          userUpdatedDate: new Date(),
          deletedDate: new Date()
        } 
      }
    );
    
    // Remove from masterUsers collection
    await collections.masterUsers.deleteOne({ 
      userPhone: userToDelete.userPhone, 
      apiKey: apiKey 
    });
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error(`Failed to deactivate user with id ${id}:`, error);
    throw error;
  }
}

// Re-enable a deleted user
async function reEnableUser(id, updates, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    if (!usersCollection) {
      throw new Error(`Users collection for API key ${apiKey} not found`);
    }
    
    // Update user document to re-enable
    const updateData = {
      ...updates,
      userStatus: 'Active',
      userUpdatedDate: new Date(),
      deletedDate: null
    };
    
    const userToUpdate = await usersCollection.findOne({ _id: toObjectId(id) });
    if (!userToUpdate) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const result = await usersCollection.updateOne(
      { _id: toObjectId(id) },
      { $set: updateData }
    );
    
    // Add back to masterUsers collection
    await collections.masterUsers.insertOne({
      userName: updates.userName,
      userEmail: updates.userEmail || '',
      userPhone: userToUpdate.userPhone,
      apiKey: apiKey,
      companyId: updates.companyId || apiKeyLower
    });
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error(`Failed to re-enable user with id ${id}:`, error);
    throw error;
  }
}

// Permanently delete a user
async function permanentlyDeleteUser(id, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    if (!usersCollection) {
      throw new Error(`Users collection for API key ${apiKey} not found`);
    }
    
    const userToDelete = await usersCollection.findOne({ _id: toObjectId(id) });
    if (!userToDelete) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // Delete from users collection
    const result = await usersCollection.deleteOne({ _id: toObjectId(id) });
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error(`Failed to permanently delete user with id ${id}:`, error);
    throw error;
  }
}

// Get user roles
async function getUserRoles(apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      return ['Admin', 'Manager', 'Staff']; // Default roles if no API key
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const settingsCollection = collections[`${apiKeyLower}_settings`] || collections.settings;
    
    // Try to get settings from instance-specific collection
    const settings = await settingsCollection.findOne({ type: 'userRoles', apiKey: apiKeyLower });
    
    if (settings?.roles?.length > 0) {
      return settings.roles;
    }
    
    // Fallback to general settings
    const generalSettings = await collections.settings.findOne({ type: 'userRoles' });
    return generalSettings?.roles || ['Admin', 'Manager', 'Staff'];
  } catch (error) {
    console.error('Failed to fetch user roles:', error);
    return ['Admin', 'Manager', 'Staff']; // Default fallback
  }
}

// Add a user role
async function addUserRole(role, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const settingsCollection = collections[`${apiKeyLower}_settings`] || collections.settings;
    
    // Get current roles or create new
    const currentSettings = await settingsCollection.findOne({ type: 'userRoles' });
    const roles = currentSettings?.roles || ['Admin', 'Manager', 'Staff'];
    
    // Check if role already exists
    if (roles.includes(role)) {
      throw new Error('This role already exists');
    }
    
    // Add new role
    roles.push(role);
    
    // Update or insert settings
    const result = await settingsCollection.updateOne(
      { type: 'userRoles' },
      { $set: { type: 'userRoles', roles, apiKey: apiKeyLower } },
      { upsert: true }
    );
    
    return { roles };
  } catch (error) {
    console.error(`Failed to add user role: ${role}`, error);
    throw error;
  }
}

// Get staff settings
async function getStaffSettings(apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      return { type: 'userEdit', userEdit: true, userDelete: true }; // Default settings if no API key
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const settingsCollection = collections[`${apiKeyLower}_settings`] || collections.settings;
    
    // Try to get settings from instance-specific collection
    const settings = await settingsCollection.findOne({ type: 'userEdit', apiKey: apiKeyLower });
    
    if (settings) {
      return settings;
    }
    
    // Fallback to general settings
    const generalSettings = await collections.settings.findOne({ type: 'userEdit' });
    return generalSettings || { type: 'userEdit', userEdit: true, userDelete: true };
  } catch (error) {
    console.error('Failed to fetch staff settings:', error);
    return { type: 'userEdit', userEdit: true, userDelete: true }; // Default fallback
  }
}

// Update staff settings
async function updateStaffSettings(updates, apiKey) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const settingsCollection = collections[`${apiKeyLower}_settings`] || collections.settings;
    
    const result = await settingsCollection.updateOne(
      { type: 'userEdit' },
      { $set: { ...updates, type: 'userEdit', apiKey: apiKeyLower } },
      { upsert: true }
    );
    
    return { type: 'userEdit', ...updates, apiKey: apiKeyLower };
  } catch (error) {
    console.error('Failed to update staff settings:', error);
    throw error;
  }
}

// Get all users including deleted ones with pagination
async function getAllUsers(apiKey, status = 'Active', page = 1, pageSize = 10) {
  try {
    await connectToDatabase();
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = collections[`${apiKeyLower}_users`];
    
    if (!usersCollection) {
      throw new Error(`Users collection for API key ${apiKey} not found`);
    }
    
    // Build query based on status
    let query = {};
    if (status === 'Active') {
      query = { userStatus: 'Active' };
    } else if (status === 'Deleted') {
      query = { userStatus: 'Deleted' };
    } else if (status === 'Others') {
      query = { userStatus: { $nin: ['Active', 'Deleted'] } };
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Get total count for pagination
    const total = await usersCollection.countDocuments(query);
    
    // Get paginated results
    const users = await usersCollection.find(query)
      .sort({ userCreatedDate: -1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .toArray();
    
    return { 
      users,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}

// Initial login check (Step 1)
async function checkInitialLogin(phone, companyId) {
  try {
    await connectToDatabase();
    
    // Find user in masterUsers collection
    const user = await collections.masterUsers.findOne({ userPhone: phone, companyId });
    
    if (!user) {
      throw new Error('Invalid phone number or company ID');
    }
    
    // Check if tenant/company exists and is active
    const tenant = await collections.tenants.findOne({ 
      companyId: user.companyId 
    });
    
    if (!tenant) {
      throw new Error('Invalid company account');
    }
    
    return { 
      userName: user.userName,
      userEmail: user.userEmail,
      apiKey: user.apiKey,
      companyId: user.companyId
    };
  } catch (error) {
    console.error('Login check failed:', error);
    throw error;
  }
}

// Complete login with password (Step 2)
async function completeLogin(loginData) {
  try {
    await connectToDatabase();
    
    // Find user in masterUsers collection again
    const masterUser = await collections.masterUsers.findOne({ 
      userPhone: loginData.userPhone, 
      companyId: loginData.companyId 
    });
    
    if (!masterUser) {
      throw new Error('Invalid credentials');
    }
    
    console.log('Found master user:', masterUser);
    console.log('User collection would be:', `${masterUser.apiKey.toLowerCase()}_users`);
    
    // Try to find the collection - handle both lower and uppercase collection names
    let usersCollection;
    const apiKeyLower = masterUser.apiKey.toLowerCase();
    
    // Check if the collection exists with lowercase name
    if (collections[`${apiKeyLower}_users`]) {
      usersCollection = collections[`${apiKeyLower}_users`];
    } else if (collections[`${masterUser.apiKey}_users`]) {
      // Try with original casing
      usersCollection = collections[`${masterUser.apiKey}_users`];
    } else {
      // Try to get a reference to the collection if it exists
      const { db } = await connectToDatabase();
      usersCollection = db.collection(`${apiKeyLower}_users`);
      collections[`${apiKeyLower}_users`] = usersCollection;
      
      // Check if the collection exists
      const collInfo = await db.listCollections({ name: `${apiKeyLower}_users` }).toArray();
      if (collInfo.length === 0) {
        throw new Error(`User collection ${apiKeyLower}_users not found`);
      }
    }
    
    if (!usersCollection) {
      throw new Error('User collection not found');
    }
    
    // Find user by phone
    const user = await usersCollection.findOne({ userPhone: loginData.userPhone });
    
    if (!user) {
      throw new Error('User not found in instance database');
    }
    
    console.log('Found user in instance database');
    
    // Check password
    if (user.password !== loginData.password) {
      throw new Error('Invalid password');
    }
    
    // Check if user is active
    if (user.userStatus !== 'Active') {
      throw new Error(`This account is ${user.userStatus.toLowerCase()}. Please contact your administrator.`);
    }
    
    // Update last login
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastUserLoggedIn: new Date() } }
    );
    
    return {
      userName: user.userName,
      userEmail: user.userEmail,
      userRole: user.userRole,
      userPhone: user.userPhone,
      apiKey: masterUser.apiKey.toLowerCase(),
      companyId: masterUser.companyId,
      profileImage: user.profileImage || masterUser.profileImage
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  getUserRoles,
  addUserRole,
  getStaffSettings,
  updateStaffSettings,
  checkInitialLogin,
  completeLogin,
  findDeletedUser,
  reEnableUser,
  permanentlyDeleteUser,
  getAllUsers
};
