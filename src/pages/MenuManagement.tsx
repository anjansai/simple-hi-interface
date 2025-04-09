
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useToast } from '@/components/ui/use-toast';
import { getAllMenuItems, MenuItem, deleteMenuItem } from '@/services/menuService';

// Menu categories
const menuCategories = [
  'All Items',
  'Starters',
  'Main Courses',
  'Desserts', 
  'Beverages',
  'Specials'
];

const MenuManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch menu items using React Query
  const { 
    data: menuItems = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['menuItems'],
    queryFn: getAllMenuItems,
    onError: (err: any) => {
      console.error("Error fetching menu items:", err);
      toast({
        title: "Error loading menu items",
        description: "Could not connect to the database. Please ensure your server is running.",
        variant: "destructive",
      });
    }
  });

  // Delete menu item mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: "Menu item deleted",
        description: "The menu item has been successfully removed",
      });
    },
    onError: (err) => {
      toast({
        title: "Error deleting menu item",
        description: "There was a problem deleting the menu item",
        variant: "destructive",
      });
      console.error("Delete error:", err);
    }
  });

  // Handle delete menu item
  const handleDeleteItem = (id: string) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      deleteMutation.mutate(id);
    }
  };
  
  // Filter items based on active category and search term
  const filteredItems = React.useMemo(() => {
    return (menuItems as MenuItem[]).filter(item => 
      (activeCategory === 'All Items' || item.category === activeCategory) &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [menuItems, activeCategory, searchTerm]);

  if (error) {
    console.error("Error in MenuManagement component:", error);
  }

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
      
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <p>Loading menu items...</p>
        </div>
      ) : error ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">There was an error loading the menu items. Please make sure your server is running.</p>
        </div>
      ) : (
        <Tabs defaultValue="All Items" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-4 overflow-auto">
            {menuCategories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {menuCategories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <Card key={item._id} className="overflow-hidden">
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img
                          src={item.imageUrl || "https://placehold.co/200x150"}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/200x150";
                          }}
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
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => handleDeleteItem(item._id || '')}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 border rounded-lg">
                    <p className="text-muted-foreground">No items found in this category. Try adjusting your search or filter.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default MenuManagement;
