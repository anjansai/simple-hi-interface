
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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Grid,
  List,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllMenuItems, 
  MenuItem, 
  deleteMenuItem, 
  updateMenuItem,
  addMenuItem, 
  checkItemNameExists,
  checkItemCodeExists,
  generateItemCode,
  exportToCSV,
} from '@/services/menuService';
import { fetchSettings } from '@/services/settingsService';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem,  
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import ItemFormModal from '@/components/menu/ItemFormModal';
import ItemDetailModal from '@/components/menu/ItemDetailModal';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const menuCategories = [
  'All Items',
  'Starters',
  'Main course',
  'Desserts', 
  'Beverages',
  'Specials',
  'Others'
];

const MenuManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isPendingAddDialogOpen, setIsPendingAddDialogOpen] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState<MenuItem | null>(null);
  const [pendingAddData, setPendingAddData] = useState<MenuItem | null>(null);
  
  const { 
    data: menuItems = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['menuItems'],
    queryFn: getAllMenuItems,
  });

  const { data: catalogSettings } = useQuery({
    queryKey: ['settings', 'catalog'],
    queryFn: () => fetchSettings('catalog'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: "Menu item deleted",
        description: "The menu item has been successfully removed",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Error deleting menu item",
        description: "There was a problem deleting the menu item",
        variant: "destructive",
      });
      console.error("Delete error:", err);
      setIsDeleteDialogOpen(false);
    }
  });

  const addMutation = useMutation({
    mutationFn: addMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: "Menu item added",
        description: "The new menu item has been successfully added",
      });
      setIsAddModalOpen(false);
      setIsPendingAddDialogOpen(false);
      setPendingAddData(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: "Failed to add menu item",
        variant: "destructive",
      });
      setIsPendingAddDialogOpen(false);
      setPendingAddData(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<MenuItem> }) => 
      updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: "Menu item updated",
        description: "The menu item has been successfully updated",
      });
      setIsEditModalOpen(false);
      setIsUpdateDialogOpen(false);
      setPendingUpdateData(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error updating menu item",
        description: err.message || "There was a problem updating the menu item",
        variant: "destructive",
      });
      setIsUpdateDialogOpen(false);
      setPendingUpdateData(null);
    }
  });

  const handleDeleteItem = (id: string) => {
    setDeleteItemId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteItemId) {
      deleteMutation.mutate(deleteItemId);
    }
  };
  
  const handleAddItem = async (data: MenuItem) => {
    try {
      // First, check if the name exists
      const nameExists = await checkItemNameExists(data.itemName);
      if (nameExists) {
        toast({
          title: "Duplicate Item Name",
          description: "An item with this name already exists",
          variant: "destructive",
        });
        return;
      }

      // Then set the pending data and show the confirmation dialog
      setPendingAddData(data);
      setIsPendingAddDialogOpen(true);
    } catch (error) {
      console.error("Error checking item name:", error);
      toast({
        title: "Error",
        description: "Failed to validate item name",
        variant: "destructive",
      });
    }
  };

  const confirmAdd = async () => {
    if (!pendingAddData) return;
    
    try {
      // Check if the code already exists - if it does, generate a new one
      const codeExists = await checkItemCodeExists(pendingAddData.itemCode);
      
      if (codeExists) {
        // Generate a new code
        const newCode = await generateItemCode();
        pendingAddData.itemCode = newCode;
      }
      
      addMutation.mutate(pendingAddData);
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add the item",
        variant: "destructive",
      });
      setIsPendingAddDialogOpen(false);
      setPendingAddData(null);
    }
  };

  const handleEditItem = async (data: MenuItem) => {
    if (!selectedItem?._id) return;
    
    try {
      const nameExists = await checkItemNameExists(data.itemName, selectedItem._id);
      if (nameExists) {
        toast({
          title: "Duplicate Item Name",
          description: "An item with this name already exists",
          variant: "destructive",
        });
        return;
      }
      
      setPendingUpdateData({
        ...data,
        _id: selectedItem._id
      });
      setIsUpdateDialogOpen(true);
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const confirmUpdate = () => {
    if (pendingUpdateData && selectedItem?._id) {
      updateMutation.mutate({ 
        id: selectedItem._id, 
        data: pendingUpdateData
      });
    }
  };

  const cancelUpdate = () => {
    setIsUpdateDialogOpen(false);
    setPendingUpdateData(null);
  };

  const cancelAdd = () => {
    setIsPendingAddDialogOpen(false);
    setPendingAddData(null);
  };

  const openItemDetail = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleExportCsv = () => {
    try {
      exportToCSV(filteredItems);
      toast({
        title: "Export successful",
        description: "Menu items have been exported to CSV",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was a problem exporting the menu items",
        variant: "destructive",
      });
    }
  };

  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(menuItems)) return [];
    
    return menuItems.filter(item => {
      if (!item) return false;
      
      const categoryMatch = activeCategory === 'All Items' || 
                           item.Category === activeCategory;
      
      const itemName = item.itemName || '';
      const itemCode = item.itemCode || '';
      
      const searchTermMatch = !searchTerm || 
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        itemCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      return categoryMatch && searchTermMatch;
    });
  }, [menuItems, activeCategory, searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    console.error("Error in MenuManagement component:", error);
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">Add, edit and manage your menu items</p>
        </div>
        <div className="flex gap-2">
          <Button className="w-full sm:w-auto" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
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
        
        <div className="flex gap-2 items-center">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="35">35</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
          
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}
            className="ml-2"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      <div className="flex-grow overflow-hidden flex flex-col">
        <Tabs 
          defaultValue="All Items" 
          value={activeCategory} 
          onValueChange={setActiveCategory}
          className="flex-grow flex flex-col"
        >
          <TabsList className="mb-4 overflow-auto">
            {menuCategories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex-grow overflow-auto">
            {menuCategories.map((category) => (
              <TabsContent 
                key={category} 
                value={category} 
                className="space-y-4 h-full overflow-auto"
              >
                {isLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <p>Loading menu items...</p>
                  </div>
                ) : error ? (
                  <div className="text-center p-8 border rounded-lg">
                    <p className="text-muted-foreground">There was an error loading the menu items. Please make sure your server is running.</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((item) => (
                        <Card 
                          key={item._id} 
                          className="overflow-hidden cursor-pointer"
                          onClick={() => openItemDetail(item)}
                        >
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            <img
                              src={item.imageUrl || "https://placehold.co/200x150"}
                              alt={item.itemName || "Menu Item"}
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
                                <h3 className="font-semibold">{item.itemName || "Untitled Item"}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {item.itemCode} {item.StarterType ? `- ${item.StarterType}` : ""}
                                </p>
                              </div>
                              <div className="font-medium">
                                ₹{typeof item.MRP === 'number' ? item.MRP.toFixed(2) : '0.00'}
                              </div>
                            </div>
                            {(catalogSettings?.itemEdit || catalogSettings?.itemDelete) && (
                              <div className="mt-4 flex gap-2">
                                {catalogSettings?.itemEdit && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(item);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                  </Button>
                                )}
                                {catalogSettings?.itemDelete && (
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      item._id && handleDeleteItem(item._id);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                  </Button>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center p-8 border rounded-lg">
                        <p className="text-muted-foreground">No items found in this category. Try adjusting your search or filter.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          {(catalogSettings?.itemEdit || catalogSettings?.itemDelete) && (
                            <TableHead className="text-right">Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedItems.length > 0 ? (
                          paginatedItems.map((item) => (
                            <TableRow 
                              key={item._id}
                              className="cursor-pointer"
                              onClick={() => openItemDetail(item)}
                            >
                              <TableCell className="font-medium">{item.itemName}</TableCell>
                              <TableCell>{item.itemCode}</TableCell>
                              <TableCell>{item.Category}</TableCell>
                              <TableCell>₹{typeof item.MRP === 'number' ? item.MRP.toFixed(2) : '0.00'}</TableCell>
                              {(catalogSettings?.itemEdit || catalogSettings?.itemDelete) && (
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {catalogSettings?.itemEdit && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditModal(item);
                                        }}
                                      >
                                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                      </Button>
                                    )}
                                    {catalogSettings?.itemDelete && (
                                      <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          item._id && handleDeleteItem(item._id);
                                        }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell 
                              colSpan={(catalogSettings?.itemEdit || catalogSettings?.itemDelete) ? 5 : 4}
                              className="h-24 text-center"
                            >
                              No items found in this category. Try adjusting your search or filter.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      {filteredItems.length > itemsPerPage && (
        <Pagination className="mt-4">
          <PaginationContent className="justify-start">
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    handlePageChange(currentPage - 1);
                  }
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) {
                    handlePageChange(currentPage + 1);
                  }
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      <ItemFormModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddItem}
        title="Add New Item"
        isLoading={addMutation.isPending}
      />
      
      <ItemFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        item={selectedItem || undefined}
        onSubmit={handleEditItem}
        title="Edit Item"
        isEdit={true}
        isLoading={updateMutation.isPending}
      />
      
      <ItemDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        item={selectedItem}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the menu item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this menu item? This will modify the item details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelUpdate}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate}>Update</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isPendingAddDialogOpen} onOpenChange={setIsPendingAddDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Add Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add this new menu item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelAdd}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAdd}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuManagement;
