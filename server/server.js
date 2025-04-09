
const express = require('express');
const cors = require('cors');
const { connectToDatabase, closeConnection } = require('./mongodb');
const menuRoutes = require('./menu');

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

app.post('/api/menu', async (req, res) => {
  try {
    const newItem = await menuRoutes.addMenuItem(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const result = await menuRoutes.updateMenuItem(req.params.id, req.body);
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ success: true, message: 'Menu item updated' });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});
