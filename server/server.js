
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { connectToDatabase, closeConnection, ObjectId } = require('./mongodb');
const menuRoutes = require('./menu');
const settingsRoutes = require('./settings');
const userRoutes = require('./users');
const instanceRoutes = require('./instances');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
    const menuItems = await menuRoutes.getAllMenuItems();
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

app.get('/api/menu/category/:category', async (req, res) => {
  try {
    const menuItems = await menuRoutes.getMenuItemsByCategory(req.params.category);
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({ error: 'Failed to fetch menu items by category' });
  }
});

app.get('/api/menu/check-name', async (req, res) => {
  try {
    const { name, excludeId } = req.query;
    const nameExists = await menuRoutes.checkItemNameExists(name, excludeId);
    res.json({ exists: nameExists });
  } catch (error) {
    console.error('Error checking item name:', error);
    res.status(500).json({ error: 'Failed to check item name' });
  }
});

// Add the missing endpoint for checking item code
app.get('/api/menu/check-code', async (req, res) => {
  try {
    const { code, excludeId } = req.query;
    const codeExists = await menuRoutes.checkItemCodeExists(code, excludeId);
    res.json({ exists: codeExists });
  } catch (error) {
    console.error('Error checking item code:', error);
    res.status(500).json({ error: 'Failed to check item code' });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    // Check if item name already exists
    const nameExists = await menuRoutes.checkItemNameExists(req.body.itemName);
    if (nameExists) {
      return res.status(400).json({ error: 'An item with this name already exists' });
    }
    
    // Validate MRP is a valid number
    if (req.body.MRP === undefined || req.body.MRP === null || isNaN(parseFloat(req.body.MRP)) || parseFloat(req.body.MRP) <= 0) {
      return res.status(400).json({ error: 'Price must be a valid number greater than 0' });
    }
    
    const newItem = await menuRoutes.addMenuItem(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    // Check if updated name already exists (excluding this item)
    if (req.body.itemName) {
      const nameExists = await menuRoutes.checkItemNameExists(
        req.body.itemName, 
        req.params.id
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
      const result = await menuRoutes.updateMenuItem(req.params.id, req.body);
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
    const result = await menuRoutes.deleteMenuItem(req.params.id);
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
    const code = await settingsRoutes.generateUniqueCode();
    res.json({ code });
  } catch (error) {
    console.error('Error generating unique code:', error);
    res.status(500).json({ error: 'Failed to generate unique code' });
  }
});

// Settings Routes
app.get('/api/settings/:type', async (req, res) => {
  try {
    const settings = await settingsRoutes.getSettingsByType(req.params.type);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings/:type', async (req, res) => {
  try {
    const settings = await settingsRoutes.updateSettings(req.params.type, req.body);
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
        apiKey: result.apiKey,
        companyId: result.companyId
      }
    });
  } catch (error) {
    console.error('Error completing login:', error);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

// User Management Routes
app.get('/api/users', async (req, res) => {
  try {
    const { role } = req.query;
    const users = await userRoutes.getUsers(role);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await userRoutes.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    const newUser = await userRoutes.createUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const result = await userRoutes.updateUser(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await userRoutes.deactivateUser(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: error.message || 'Failed to deactivate user' });
  }
});

// User Role Settings
app.get('/api/settings/userRoles', async (req, res) => {
  try {
    const roles = await userRoutes.getUserRoles();
    res.json({ roles });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ error: 'Failed to fetch user roles' });
  }
});

app.post('/api/settings/userRoles', async (req, res) => {
  try {
    const { role } = req.body;
    const result = await userRoutes.addUserRole(role);
    res.json({ success: true, roles: result.roles });
  } catch (error) {
    console.error('Error adding user role:', error);
    res.status(500).json({ error: error.message || 'Failed to add user role' });
  }
});

// Staff Settings
app.get('/api/settings/userEdit', async (req, res) => {
  try {
    const settings = await userRoutes.getStaffSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching staff settings:', error);
    res.status(500).json({ error: 'Failed to fetch staff settings' });
  }
});

app.put('/api/settings/userEdit', async (req, res) => {
  try {
    const settings = await userRoutes.updateStaffSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error updating staff settings:', error);
    res.status(500).json({ error: 'Failed to update staff settings' });
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
