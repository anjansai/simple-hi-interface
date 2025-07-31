const { connectToDatabase, collections, toObjectId } = require('./mongodb');
const crypto = require('crypto');

// Helper function to get user collection based on API key with case-insensitive support
async function getUserCollection(apiKey) {
  try {
    await connectToDatabase();
    const apiKeyLower = apiKey.toLowerCase();
    
    // Try both collection name patterns for backward compatibility
    const possibleCollectionNames = [
      `${apiKeyLower}_users`,
      `restaurantDB_users`,
      `restaurantdb_users`
    ];
    
    const { db } = await connectToDatabase();
    
    for (const collectionName of possibleCollectionNames) {
      try {
        const collection = db.collection(collectionName);
        // Test if collection exists by trying to count documents
        await collection.countDocuments({}, { limit: 1 });
        return collection;
      } catch (error) {
        // Collection doesn't exist, try next one
        continue;
      }
    }
    
    // If none exist, create the standard one
    const standardCollectionName = `${apiKeyLower}_users`;
    return db.collection(standardCollectionName);
  } catch (error) {
    console.error('Error getting user collection:', error);
    throw error;
  }
}

// Get users by role
async function getUsers(role, apiKey) {
  try {
    const usersCollection = await getUserCollection(apiKey);
    const query = role ? { userRole: role, isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    const users = await usersCollection.find(query).toArray();
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

// Get all users with pagination and filtering
async function getAllUsers(apiKey, status = 'Active', page = 1, pageSize = 10) {
  try {
    const usersCollection = await getUserCollection(apiKey);
    const skip = (page - 1) * pageSize;
    
    let query = {};
    
    switch (status) {
      case 'Active':
        query = { isDeleted: { $ne: true } };
        break;
      case 'Deleted':
        query = { isDeleted: true };
        break;
      case 'Others':
        // Add any other status filtering logic here
        query = {};
        break;
      default:
        query = { isDeleted: { $ne: true } };
    }
    
    const total = await usersCollection.countDocuments(query);
    const users = await usersCollection
      .find(query)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdDate: -1 })
      .toArray();
    
    return {
      users: users.map(user => ({
        _id: user._id,
        name: user.userName,
        userName: user.userName,
        userPhone: user.userPhone,
        userEmail: user.userEmail,
        userRole: user.userRole,
        status: user.isDeleted ? 'Deleted' : 'Active',
        createdDate: user.createdDate,
        deletedDate: user.deletedDate,
        reEnabledDate: user.reEnabledDate,
        profileImage: user.profileImage,
        userCreatedDate: user.createdDate,
        userStatus: user.isDeleted ? 'Deleted' : 'Active'
      })),
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

// Get user by ID
async function getUserById(id, apiKey) {
  try {
    const usersCollection = await getUserCollection(apiKey);
    const user = await usersCollection.findOne({ _id: toObjectId(id) });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

// Create new user
async function createUser(userData, apiKey) {
  try {
    const usersCollection = await getUserCollection(apiKey);
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ 
      userPhone: userData.userPhone,
      isDeleted: { $ne: true }
    });
    
    if (existingUser) {
      throw new Error('User with this phone number already exists');
    }
    
    // Hash password
    const hashedPassword = crypto.createHash('sha1').update(userData.password).digest('hex');
    
    const newUser = {
      userName: userData.userName,
      userPhone: userData.userPhone,
      userEmail: userData.userEmail || '',
      userRole: userData.userRole,
      password: hashedPassword,
      profileImage: userData.profileImage || '',
      createdDate: new Date().toISOString(),
      isDeleted: false,
      // Don't store companyId in user records
      apiKey: apiKey // Store API key instead of companyId
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    // Also update masterUsers collection
    await collections.masterUsers.updateOne(
      { userPhone: userData.userPhone, apiKey: apiKey },
      {
        $set: {
          userName: userData.userName,
          userEmail: userData.userEmail || '',
          userRole: userData.userRole,
          profileImage: userData.profileImage || '',
          updatedDate: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    
    return { 
      _id: result.insertedId,
      message: 'User created successfully'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Update user
async function updateUser(id, updateData, apiKey) {
  try {
    const usersCollection = await getUserCollection(apiKey);
    
    const updateFields = {
      userName: updateData.userName,
      userEmail: updateData.userEmail || '',
      userRole: updateData.userRole,
      profileImage: updateData.profileImage || '',
      updatedDate: new Date().toISOString()
    };
    
    const result = await usersCollection.updateOne(
      { _id: toObjectId(id) },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
    
    // Also update masterUsers collection
    const user = await usersCollection.findOne({ _id: toObjectId(id) });
    if (user) {
      await collections.masterUsers.updateOne(
        { userPhone: user.userPhone, apiKey: apiKey },
        {
          $set: {
            userName: updateData.userName,
            userEmail: updateData.userEmail || '',
            userRole: updateData.userRole,
            profileImage: updateData.profileImage || '',
            updatedDate: new Date().toISOString()
          }
        }
      );
    }
    
    return { message: 'User updated successfully' };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Deactivate user (soft delete)
async function deactivateUser(id, apiKey) {
  try {
    const usersCollection = await getUserCollection(apiKey);
    
    const result = await usersCollection.updateOne(
      { _id: toObjectId(id) },
      { 
        $set: { 
          isDeleted: true,
          deletedDate: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
    
    return { message: 'User deactivated successfully' };
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
}

// Find deleted user
async function findDeletedUser(userPhone, apiKey) {
  try {
    const usersCollection = await getUserCollection(apiKey);
    const deletedUser = await usersCollection.findOne({
      userPhone: userPhone,
      isDeleted: true
    });
    return deletedUser;
  } catch (error) {
    console.error('Error finding deleted user:', error);
    return null;
  }
}

// Re-enable user
async function reEnableUser(id, updateData, apiKey) {
  try {
    const usersCollection = await getUserCollection(apiKey);
    
    const updateFields = {
      userName: updateData.userName,
      userEmail: updateData.userEmail || '',
      userRole: updateData.userRole,
      profileImage: updateData.profileImage || '',
      isDeleted: false,
      reEnabledDate: new Date().toISOString(),
      $unset: { deletedDate: 1 }
    };
    
    const result = await usersCollection.updateOne(
      { _id: toObjectId(id) },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
    
    // Also update masterUsers collection
    const user = await usersCollection.findOne({ _id: toObjectId(id) });
    if (user) {
      await collections.masterUsers.updateOne(
        { userPhone: user.userPhone, apiKey: apiKey },
        {
          $set: {
            userName: updateData.userName,
            userEmail: updateData.userEmail || '',
            userRole: updateData.userRole,
            profileImage: updateData.profileImage || '',
            updatedDate: new Date().toISOString()
          }
        }
      );
    }
    
    return { message: 'User re-enabled successfully' };
  } catch (error) {
    console.error('Error re-enabling user:', error);
    throw error;
  }
}

// Permanently delete user
async function permanentlyDeleteUser(id, apiKey) {
  try {
    const usersCollection = await getUserCollection(apiKey);
    
    const user = await usersCollection.findOne({ _id: toObjectId(id) });
    if (!user) {
      throw new Error('User not found');
    }
    
    await usersCollection.deleteOne({ _id: toObjectId(id) });
    
    // Also remove from masterUsers collection
    await collections.masterUsers.deleteOne({
      userPhone: user.userPhone,
      apiKey: apiKey
    });
    
    return { message: 'User permanently deleted' };
  } catch (error) {
    console.error('Error permanently deleting user:', error);
    throw error;
  }
}

// Get user roles
async function getUserRoles() {
  return ['Admin', 'Manager', 'Cashier', 'Waiter', 'Staff'];
}

// Add user role
async function addUserRole(role) {
  // This would typically add to a roles collection
  // For now, return success as roles are hardcoded
  return { message: 'Role added successfully' };
}

// Get staff settings
async function getStaffSettings(apiKey) {
  try {
    await connectToDatabase();
    const settings = await collections.settings.findOne({ 
      type: 'user',
      apiKey: apiKey 
    });
    
    return settings || {
      allowEdit: true,
      allowDelete: true,
      allowExport: true
    };
  } catch (error) {
    console.error('Error getting staff settings:', error);
    return {
      allowEdit: true,
      allowDelete: true,
      allowExport: true
    };
  }
}

// Update staff settings
async function updateStaffSettings(settings, apiKey) {
  try {
    await connectToDatabase();
    
    const result = await collections.settings.updateOne(
      { type: 'user', apiKey: apiKey },
      { 
        $set: {
          ...settings,
          type: 'user',
          apiKey: apiKey,
          updatedDate: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    
    return { message: 'Settings updated successfully' };
  } catch (error) {
    console.error('Error updating staff settings:', error);
    throw error;
  }
}

// Check initial login
async function checkInitialLogin(userPhone, companyId) {
  try {
    await connectToDatabase();
    
    // Find in master users collection
    const masterUser = await collections.masterUsers.findOne({
      userPhone: userPhone,
      companyId: companyId
    });
    
    if (!masterUser) {
      throw new Error('User not found in master database');
    }
    
    return {
      userName: masterUser.userName,
      userEmail: masterUser.userEmail,
      apiKey: masterUser.apiKey,
      companyId: masterUser.companyId
    };
  } catch (error) {
    console.error('Error checking initial login:', error);
    throw error;
  }
}

// Complete login
async function completeLogin(userPhone, companyId, password) {
  try {
    await connectToDatabase();
    
    // Get API key from master users
    const masterUser = await collections.masterUsers.findOne({
      userPhone: userPhone,
      companyId: companyId
    });
    
    if (!masterUser) {
      throw new Error('User not found in master database');
    }
    
    // Check password in instance users collection
    const usersCollection = await getUserCollection(masterUser.apiKey);
    const user = await usersCollection.findOne({
      userPhone: userPhone,
      password: password,
      isDeleted: { $ne: true }
    });
    
    if (!user) {
      throw new Error('Invalid credentials or user not found in instance database');
    }
    
    return {
      userName: user.userName,
      userEmail: user.userEmail,
      userRole: user.userRole,
      userPhone: user.userPhone,
      apiKey: masterUser.apiKey,
      companyId: masterUser.companyId,
      profileImage: user.profileImage
    };
  } catch (error) {
    console.error('Error completing login:', error);
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
  getAllUsers,
  getUserCollection
};