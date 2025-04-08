
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  TabsList,
  TabsTrigger,
  Tabs,
  TabsContent,
} from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Mock data for menu items
const mockMenuCategories = [
  'All Items',
  'Starters',
  'Main Courses',
  'Desserts', 
  'Beverages',
  'Specials'
];

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  available: boolean;
}

const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Burger',
    category: 'Main Courses',
    price: 12.99,
    description: 'Beef patty with lettuce, tomato, and special sauce',
    imageUrl: 'https://placehold.co/200x150',
    available: true,
  },
  {
    id: '2',
    name: 'Caesar Salad',
    category: 'Starters',
    price: 8.99,
    description: 'Romaine lettuce with Caesar dressing and croutons',
    imageUrl: 'https://placehold.co/200x150',
    available: true,
  },
  {
    id: '3',
    name: 'Chocolate Cake',
    category: 'Desserts',
    price: 6.99,
    description: 'Rich chocolate cake with ganache',
    imageUrl: 'https://placehold.co/200x150',
    available: true,
  },
  {
    id: '4',
    name: 'Iced Tea',
    category: 'Beverages',
    price: 3.99,
    description: 'Refreshing cold tea with lemon',
    imageUrl: 'https://placehold.co/200x150',
    available: true,
  },
  {
    id: '5',
    name: 'Seafood Pasta',
    category: 'Specials',
    price: 18.99,
    description: 'Fresh seafood with pasta in tomato sauce',
    imageUrl: 'https://placehold.co/200x150',
    available: true,
  }
];

const MenuManagement: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredItems = mockMenuItems.filter(item => 
    (activeCategory === 'All Items' || item.category === activeCategory) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">Add, edit and manage your menu items</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>
      
      <Tabs defaultValue="All Items" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-4 overflow-auto">
          {mockMenuCategories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {mockMenuCategories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                      <div className="font-medium">${item.price.toFixed(2)}</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredItems.length === 0 && (
              <div className="text-center p-8 border rounded-lg">
                <p className="text-muted-foreground">No items found. Try adjusting your search or filter.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MenuManagement;
