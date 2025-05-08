const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // Add this import for JWT
const { connectToDatabase, closeConnection, ObjectId } = require('./mongodb');
const menuRoutes = require('./menu');
const settingsRoutes = require('./settings');
const userRoutes = require('./users');
const instanceRoutes = require('./instances');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// JWT Secret Key - ideally should be in environment variables for production
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to extract API key from headers
app.use((req, res, next) => {
  req.apiKey = req.headers['x-api-key'] || process.env.CURRENT_API_KEY || 'defaultApiKey';
  next();
});

// Connect to MongoDB when the server starts
connectToDatabase()
  .then(() => {
    console.log('Database connection established');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Menu Routes
app.get('/api/menu', async (req, res) => {
  try {
    const apiKey = req.apiKey;
    console.log(`Fetching menu items with API key: ${apiKey}`);
    const menuItems = await menuRoutes.getAllMenuItems(apiKey);
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

app.get('/api/menu/category/:category', async (req, res) => {
  try {
    const apiKey = req.apiKey;
    const menuItems = await menuRoutes.getMenuItemsByCategory(req.params.category, apiKey);
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({ error: 'Failed to fetch menu items by category' });
  }
});

app.get('/api/menu/check-name', async (req, res) => {
  try {
    const { name, excludeId } = req.query;
    const apiKey = req.apiKey;
    const nameExists = await menuRoutes.checkItemNameExists(name, excludeId, apiKey);
    res.json({ exists: nameExists });
  } catch (error) {
    console.error('Error checking item name:', error);
    res.status(500).json({ error: 'Failed to check item name' });
  }
});

app.get('/api/menu/check-code', async (req, res) => {
  try {
    const { code, excludeId } = req.query;
    const apiKey = req.apiKey;
    const codeExists = await menuRoutes.checkItemCodeExists(code, excludeId, apiKey);
    res.json({ exists: codeExists });
  } catch (error) {
    console.error('Error checking item code:', error);
    res.status(500).json({ error: 'Failed to check item code' });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const apiKey = req.apiKey || req.body.apiKey;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    // Check if item name already exists
    const nameExists = await menuRoutes.checkItemNameExists(req.body.itemName, null, apiKey);
    if (nameExists) {
      return res.status(400).json({ error: 'An item with this name already exists' });
    }
    
    // Validate MRP is a valid number
    if (req.body.MRP === undefined || req.body.MRP === null || isNaN(parseFloat(req.body.MRP)) || parseFloat(req.body.MRP) <= 0) {
      return res.status(400).json({ error: 'Price must be a valid number greater than 0' });
    }
    
    const newItem = await menuRoutes.addMenuItem(req.body, apiKey);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const apiKey = req.apiKey || req.body.apiKey;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    // Check if updated name already exists (excluding this item)
    if (req.body.itemName) {
      const nameExists = await menuRoutes.checkItemNameExists(
        req.body.itemName, 
        req.params.id,
        apiKey
      );
      
      if (nameExists) {
        return res.status(400).json({ 
          error: 'An item with this name already exists' 
        });
      }
    }
    
    // Validate MRP is a valid number
    if (req.body.MRP !== undefined && (isNaN(parseFloat(req.body.MRP)) || parseFloat(req.body.MRP) <= 0)) {
      return res.status(400).json({ error: 'Price must be a valid number greater than 0' });
    }
    
    try {
      const result = await menuRoutes.updateMenuItem(req.params.id, req.body, apiKey);
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      res.json({ 
        success: true, 
        message: 'Menu item updated successfully',
        ...result 
      });
    } catch (error) {
      console.error('Error in update operation:', error);
      return res.status(500).json({ error: error.message || 'Failed to update menu item' });
    }
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    const apiKey = req.apiKey;
    const result = await menuRoutes.deleteMenuItem(req.params.id, apiKey);
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Generate unique item code - new sequential approach
app.get('/api/settings/generate-code', async (req, res) => {
  try {
    const apiKey = req.apiKey;
    const code = await settingsRoutes.generateUniqueCode(apiKey);
    res.json({ code });
  } catch (error) {
    console.error('Error generating unique code:', error);
    res.status(500).json({ error: 'Failed to generate unique code' });
  }
});

// Settings Routes
app.get('/api/settings/:type', async (req, res) => {
  try {
    const apiKey = req.apiKey;
    const settings = await settingsRoutes.getSettingsByType(req.params.type, apiKey);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings/:type', async (req, res) => {
  try {
    const apiKey = req.apiKey || req.body.apiKey;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    const settings = await settingsRoutes.updateSettings(req.params.type, req.body, apiKey);
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Instance Creation Route
app.post('/api/instances/create', async (req, res) => {
  try {
    const instanceData = req.body;
    const newInstance = await instanceRoutes.createNewInstance(instanceData);
    res.status(201).json(newInstance);
  } catch (error) {
    console.error('Error creating new instance:', error);
    res.status(500).json({ error: error.message || 'Failed to create new instance' });
  }
});

// Auth Routes
app.post('/api/auth/check-login', async (req, res) => {
  try {
    const { phone, companyId } = req.body;
    const user = await userRoutes.checkInitialLogin(phone, companyId);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error checking login:', error);
    res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const loginData = req.body;
    const result = await userRoutes.completeLogin(loginData);
    
    // Generate a simple token for session management
    const token = crypto.randomBytes(32).toString('hex');
    
    res.json({ 
      success: true, 
      token,
      user: {
        userName: result.userName,
        userEmail: result.userEmail,
        userRole: result.userRole,
        userPhone: result.userPhone,
        apiKey: result.apiKey,
        companyId: result.companyId,
        profileImage: result.profileImage
      }
    });
  } catch (error) {
    console.error('Error completing login:', error);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

// Users routes
app.post('/api/login/check', async (req, res) => {
  try {
    const { userPhone, companyId } = req.body;
    
    if (!userPhone || !companyId) {
      return res.status(400).json({ error: 'Phone number and company ID are required' });
    }
    
    const userData = await userRoutes.checkInitialLogin(userPhone, companyId);
    res.json(userData);
  } catch (error) {
    console.error('Login check error:', error);
    res.status(401).json({ error: error.message });
  }
});

app.post('/api/login/complete', async (req, res) => {
  try {
    const { userPhone, companyId, password } = req.body;
    
    if (!userPhone || !companyId || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const userData = await userRoutes.completeLogin({ userPhone, companyId, password });
    
    // Create a more secure JWT token for production use
    const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
    const token = jwt.sign(
      { 
        userPhone: userData.userPhone, 
        apiKey: userData.apiKey,
        companyId: userData.companyId,
        role: userData.userRole
      }, 
      JWT_SECRET, // Using more secure secret key from environment
      { 
        expiresIn: '24h',
        algorithm: 'HS256' // Specify algorithm
      }
    );
    
    res.json({ 
      token,
      userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { role, status = 'Active', page = 1, pageSize = 10 } = req.query;
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    let result;
    
    if (status && (status === 'Active' || status === 'Deleted' || status === 'Others')) {
      // Get users with pagination and status filter
      result = await userRoutes.getAllUsers(apiKey, status, parseInt(page), parseInt(pageSize));
    } else {
      // Legacy endpoint behavior - get users by role
      const users = await userRoutes.getUsers(role, apiKey);
      result = { 
        users,
        pagination: {
          total: users.length,
          page: 1,
          pageSize: users.length,
          totalPages: 1
        }
      };
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    const user = await userRoutes.getUserById(req.params.id, apiKey);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { userName, userPhone, userEmail, userRole, password, profileImage, companyId } = req.body;
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    if (!userName || !userPhone || !userRole) {
      return res.status(400).json({ error: 'Name, phone, and role are required' });
    }
    
    // Check for deleted user first
    const deletedUser = await userRoutes.findDeletedUser(userPhone, apiKey);
    if (deletedUser) {
      return res.status(200).json({ 
        isDeleted: true, 
        deletedUser
      });
    }
    
    const result = await userRoutes.createUser({
      userName,
      userPhone,
      userEmail,
      userRole,
      password,
      profileImage,
      companyId: companyId || apiKey.toLowerCase() // Use apiKey as companyId if not provided
    }, apiKey);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    const result = await userRoutes.updateUser(req.params.id, req.body, apiKey);
    
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    const result = await userRoutes.deactivateUser(req.params.id, apiKey);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoints for re-enabling deleted users
app.post('/api/users/:id/re-enable', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    const result = await userRoutes.reEnableUser(req.params.id, req.body, apiKey);
    res.json({ success: true, message: 'User re-enabled successfully' });
  } catch (error) {
    console.error('Re-enable user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoints for permanently deleting users
app.delete('/api/users/:id/permanent', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    const result = await userRoutes.permanentlyDeleteUser(req.params.id, apiKey);
    res.json({ success: true, message: 'User permanently deleted' });
  } catch (error) {
    console.error('Permanent delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export CSV endpoint for users
app.get('/api/users/export/csv', async (req, res) => {
  try {
    const { status = 'Active' } = req.query;
    const apiKey = req.headers['x-api-key'];
    const userPhone = req.query.userPhone; // For non-admin users to export only their data
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    // Find the user making the request
    const { db } = await connectToDatabase();
    const apiKeyLower = apiKey.toLowerCase();
    const usersCollection = await userRoutes.getUserCollection(apiKey);
    
    // Get current user's role from the master users collection
    const masterUser = await collections.masterUsers.findOne({ userPhone, apiKey });
    const currentUser = await usersCollection.findOne({ userPhone });
    const userRole = currentUser?.userRole || '';
    
    let users;
    // For Admin and Manager, get all users; otherwise, get only the current user
    if (userRole === 'Admin' || userRole === 'Manager') {
      // Get all users without pagination for export
      const result = await userRoutes.getAllUsers(apiKey, status, 1, 1000);
      users = result.users;
    } else if (userPhone) {
      // For other roles, only export their own data
      const user = await usersCollection.findOne({ userPhone });
      users = user ? [user] : [];
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Convert users to CSV format
    let csvContent = 'Name,Phone Number,Email,Role,User Status,Created Date,Deleted Date,Re-enabled Date\n';
    
    users.forEach(user => {
      const name = user.userName || 'N/A';
      const phone = user.userPhone || 'N/A';
      const email = user.userEmail || 'N/A';
      const role = user.userRole || 'N/A';
      const status = user.userStatus || 'N/A';
      const createdDate = user.userCreatedDate ? new Date(user.userCreatedDate).toLocaleDateString() : 'N/A';
      const deletedDate = user.deletedDate ? new Date(user.deletedDate).toLocaleDateString() : 'N/A';
      const reEnabledDate = user.reEnabledDate ? new Date(user.reEnabledDate).toLocaleDateString() : 'N/A';
      
      csvContent += `${name},${phone},${email},${role},${status},${createdDate},${deletedDate},${reEnabledDate}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-${status.toLowerCase()}-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});
