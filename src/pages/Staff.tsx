
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { FileDown, Pencil, RotateCcw, Trash2, User, Users, X } from 'lucide-react';
import { 
  fetchStaffSettings, 
  fetchUserRoles, 
  fetchUsers, 
  deleteUser,
  permanentlyDeleteUser,
  exportUsersToCSV,
  reEnableUser
} from '@/services/userService';
import { Skeleton } from '@/components/ui/skeleton';
import UserDetailView from '@/components/user/UserDetailView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from '@/components/ui/use-toast';

export interface UserData {
  _id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userRole: string;
  userCreatedDate: string;
  userStatus: string;
  deletedDate?: string;
  profileImage?: string;
}

const formSchema = z.object({
  userName: z.string().min(1, "Name is required"),
  userEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  userRole: z.string().min(1, "Role is required"),
});

const Staff = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReEnableDialogOpen, setIsReEnableDialogOpen] = useState(false);
  const [isPermDeleteDialogOpen, setIsPermDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [userToReEnable, setUserToReEnable] = useState<UserData | null>(null);
  const [userToPermDelete, setUserToPermDelete] = useState<UserData | null>(null);
  const [statusTab, setStatusTab] = useState<string>('Active');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: '',
      userEmail: '',
      userRole: '',
    },
  });

  // Fetch users with pagination
  const { data, isLoading: usersLoading, refetch: refetchUsers, error: usersError } = useQuery({
    queryKey: ['users', selectedRole, statusTab, currentPage, pageSize],
    queryFn: () => fetchUsers(selectedRole, {
      page: currentPage,
      pageSize: pageSize,
      status: statusTab as 'Active' | 'Deleted' | 'Others'
    }),
  });

  const users = data?.users || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  };

  // Fetch user roles for filter
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles'],
    queryFn: fetchUserRoles,
  });

  // Fetch staff settings to determine edit/delete permissions
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['staffSettings'],
    queryFn: () => fetchStaffSettings(),
  });

  // Log any fetch errors
  React.useEffect(() => {
    if (usersError) {
      console.error("Error fetching users:", usersError);
    }
  }, [usersError]);

  React.useEffect(() => {
    if (userToReEnable) {
      form.reset({
        userName: userToReEnable.userName,
        userEmail: userToReEnable.userEmail || '',
        userRole: userToReEnable.userRole,
      });
    }
  }, [userToReEnable, form]);

  const canEdit = settings?.userEdit ?? false;
  const canDelete = settings?.userDelete ?? false;

  const handleCreateUser = () => {
    navigate('/staff/create-user');
  };

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setIsDetailViewOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    navigate(`/staff/edit-user/${user._id}`);
  };

  const handleDeleteRequest = (user: UserData) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete._id);
      refetchUsers();
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "User Deleted",
        description: "User has been deactivated successfully.",
      });
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleReEnableRequest = (user: UserData) => {
    setUserToReEnable(user);
    setIsReEnableDialogOpen(true);
  };

  const handlePermDeleteRequest = (user: UserData) => {
    setUserToPermDelete(user);
    setIsPermDeleteDialogOpen(true);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!userToPermDelete) return;
    
    try {
      await permanentlyDeleteUser(userToPermDelete._id);
      refetchUsers();
      setUserToPermDelete(null);
      setIsPermDeleteDialogOpen(false);
      
      toast({
        title: "User Deleted Permanently",
        description: "User has been permanently removed from the system.",
      });
    } catch (error) {
      console.error("Failed to permanently delete user:", error);
      toast({
        title: "Error",
        description: "Failed to permanently delete user",
        variant: "destructive",
      });
    }
  };

  const handleReEnableSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userToReEnable) return;
    
    try {
      await reEnableUser(userToReEnable._id, {
        ...values,
        profileImage: userToReEnable.profileImage
      });
      
      refetchUsers();
      setUserToReEnable(null);
      setIsReEnableDialogOpen(false);
      
      toast({
        title: "User Re-enabled",
        description: "User has been re-enabled successfully.",
      });
    } catch (error) {
      console.error("Failed to re-enable user:", error);
      toast({
        title: "Error",
        description: "Failed to re-enable user",
        variant: "destructive",
      });
    }
  };

  const handleExportCsv = async () => {
    try {
      const csvData = await exportUsersToCSV(statusTab);
      
      // Create a Blob and download the CSV
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-${statusTab.toLowerCase()}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Exported",
        description: "User data has been exported to CSV successfully.",
      });
    } catch (error) {
      console.error("Failed to export CSV:", error);
      toast({
        title: "Error",
        description: "Failed to export data to CSV",
        variant: "destructive",
      });
    }
  };

  // Make sure we have valid roles array, never empty string items
  const validRoles = roles.filter(role => role && typeof role === 'string');

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage your restaurant staff</p>
        </div>
        <Button onClick={handleCreateUser}>Create User</Button>
      </div>

      <Separator />

      <Card>
        <CardHeader className="space-y-0 pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User List
              </CardTitle>
              <CardDescription>View and manage all users</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0 pt-4">
          <div className="px-6 pb-4">
            <Tabs value={statusTab} onValueChange={setStatusTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="Active">Active Users</TabsTrigger>
                <TabsTrigger value="Deleted">Deleted Users</TabsTrigger>
                <TabsTrigger value="Others">Other Status</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="px-6 pb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by role:</span>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-roles">All Roles</SelectItem>
                  {validRoles.map((role: string) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page size:</span>
              <Select value={pageSize.toString()} onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1); // Reset to first page when changing page size
              }}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="35">35</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <User className="h-12 w-12 text-muted-foreground opacity-50" />
                      <div className="text-muted-foreground">No users found</div>
                      {statusTab === 'Active' && (
                        <Button onClick={handleCreateUser} variant="outline" size="sm">
                          Create User
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: UserData) => (
                  <TableRow key={user._id}>
                    <TableCell 
                      className="font-medium hover:text-primary cursor-pointer" 
                      onClick={() => handleViewUser(user)}
                    >
                      {user.userName}
                    </TableCell>
                    <TableCell
                      className="hover:text-primary cursor-pointer"
                      onClick={() => handleViewUser(user)}
                    >
                      {user.userPhone}
                    </TableCell>
                    <TableCell
                      className="hover:text-primary cursor-pointer"
                      onClick={() => handleViewUser(user)}
                    >
                      {user.userEmail || "-"}
                    </TableCell>
                    <TableCell>{user.userRole}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.userStatus === 'Active' ? 'bg-green-100 text-green-800' : 
                        user.userStatus === 'Deleted' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.userStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {statusTab === 'Active' && canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditUser(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {statusTab === 'Active' && canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteRequest(user)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        {statusTab === 'Deleted' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleReEnableRequest(user)}
                            >
                              <RotateCcw className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handlePermDeleteRequest(user)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        <CardFooter className="flex items-center justify-between p-6">
          <div className="text-sm text-muted-foreground">
            {pagination.total > 0 ? (
              <>Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} users</>
            ) : (
              <>No users found</>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1 || users.length === 0}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.total > 0 ? pagination.page : 0} of {pagination.totalPages || 1}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= pagination.totalPages || users.length === 0}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserDetailView 
              user={selectedUser} 
              onEdit={() => {
                setIsDetailViewOpen(false);
                handleEditUser(selectedUser);
              }}
              onDelete={() => {
                setIsDetailViewOpen(false);
                handleDeleteRequest(selectedUser);
              }}
              canEdit={canEdit && selectedUser.userStatus === 'Active'}
              canDelete={canDelete && selectedUser.userStatus === 'Active'}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will deactivate the user account. The user will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Re-enable User Dialog */}
      <Dialog open={isReEnableDialogOpen} onOpenChange={setIsReEnableDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Re-enable User</DialogTitle>
            <DialogDescription>
              Update information and re-enable this user account.
            </DialogDescription>
          </DialogHeader>
          
          {userToReEnable && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleReEnableSubmit)} className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="w-20 h-20 mb-4">
                    {userToReEnable.profileImage ? (
                      <AvatarImage src={userToReEnable.profileImage} />
                    ) : (
                      <AvatarFallback>
                        {userToReEnable.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="text-sm text-muted-foreground">
                    Phone: {userToReEnable.userPhone}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="userEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter email address" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="userRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {validRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setUserToReEnable(null);
                      setIsReEnableDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Re-enable User</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={isPermDeleteDialogOpen} onOpenChange={setIsPermDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Permanently Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="text-destructive font-bold mb-2">⚠️ This action cannot be undone! ⚠️</div>
              <p>You are about to permanently delete this user from the system. All data associated with this user will be completely removed.</p>
              <p className="mt-2">Are you absolutely sure you want to proceed with permanent deletion?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToPermDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Staff;
