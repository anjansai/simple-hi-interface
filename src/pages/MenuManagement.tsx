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
  checkItemNameExists 
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
  PaginationLink, 
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

// Menu categories - matching database Variant field values
const menuCategories = [
  'All Items',
  'Starters',
  'Main course',
  'Desserts', 
  'Beverages',
  'Specials'
];

const MenuManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch menu items using React Query
  const { 
    data: menuItems = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['menuItems'],
    queryFn: getAllMenuItems,
  });

  // Fetch catalog settings
  const { data: catalogSettings } = useQuery({
    queryKey: ['settings', 'catalog'],
    queryFn: () => fetchSettings('catalog'),
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

  // Add menu item mutation
  const addMutation = useMutation({
    mutationFn: addMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: "Menu item added",
        description: "The new menu item has been successfully added",
      });
      setIsAddModalOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: "Failed to validate item name",
        variant: "destructive",
      });
    }
  });

  // Update menu item mutation
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
    },
    onError: (err: any) => {
      toast({
        title: "Error updating menu item",
        description: err.message || "There was a problem updating the menu item",
        variant: "destructive",
      });
    }
  });

  // Handle delete menu item
  const handleDeleteItem = (id: string) => {
    setDeleteItemId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteItemId) {
      deleteMutation.mutate(deleteItemId);
    }
  };
  
  // Handle add new item
  const handleAddItem = async (data: MenuItem) => {
    // Check if item name already exists
    try {
      const nameExists = await checkItemNameExists(data.itemName);
      if (nameExists) {
        toast({
          title: "Duplicate Item Name",
          description: "An item with this name already exists",
          variant: "destructive",
        });
        return;
      }
      
      addMutation.mutate(data);
    } catch (error) {
      console.error("Error checking item name:", error);
      toast({
        title: "Error",
        description: "Failed to validate item name",
        variant: "destructive",
      });
    }
  };

  // Handle edit item
  const handleEditItem = async (data: MenuItem) => {
    if (!selectedItem?._id) return;
    
    try {
      // Check if updated name already exists (excluding this item)
      const nameExists = await checkItemNameExists(data.itemName, selectedItem._id);
      if (nameExists) {
        toast({
          title: "Duplicate Item Name",
          description: "An item with this name already exists",
          variant: "destructive",
        });
        return;
      }
      
      updateMutation.mutate({ 
        id: selectedItem._id, 
        data: {
          ...data,
          // Keep the original itemCode and Type/Variant
          itemCode: selectedItem.itemCode,
          Type: selectedItem.Type,
          Variant: selectedItem.Variant
        }
      });
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  // Open item detail modal
  const openItemDetail = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (item: MenuItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  // Filter items based on active category and search term with null/undefined checks
  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(menuItems)) return [];
    
    return menuItems.filter(item => {
      // First ensure that properties exist to prevent errors
      if (!item) return false;
      
      // Check if the category matches or if we're showing all items
      const categoryMatch = activeCategory === 'All Items' || 
                           item.Variant === activeCategory;
      
      // Safely check if the search term matches name or description
      const itemName = item.itemName || '';
      const itemCode = item.itemCode || '';
      
      const searchTermMatch = !searchTerm || 
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        itemCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      return categoryMatch && searchTermMatch;
    });
  }, [menuItems, activeCategory, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // If total pages are less than max to show, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the start or end
      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('ellipsis');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      
      // Always include last page
      pages.push(totalPages);
    }
    
    return pages;
  };

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
        <Button className="w-full sm:w-auto" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>
      
      {/* Search and filter controls */}
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
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="9">9</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
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
      
      {/* Pagination controls - top */}
      {filteredItems.length > itemsPerPage && (
        <Pagination>
          <PaginationContent>
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
            
            {generatePageNumbers().map((page, index) => 
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <span className="px-4">...</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page as number);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            
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
              {viewMode === 'grid' ? (
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
                            <TableCell>{item.Variant}</TableCell>
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
        </Tabs>
      )}
      
      {/* Modals and dialogs */}
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
    </div>
  );
};

export default MenuManagement;
