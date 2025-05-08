
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
  reEnableUser,
  UserUpdateData
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
import { useAuth } from '@/contexts/AuthContext';

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
  const { userData } = useAuth();
  const isAdminOrManager = userData?.userRole === 'Admin' || userData?.userRole === 'Manager';

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

  // Filter users based on role for non-admin/manager users
  const filteredUsers = isAdminOrManager 
    ? users 
    : users.filter(user => user.userPhone === userData?.userPhone);

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
  
  // Only admin or manager can actually edit or delete regardless of settings
  const canUserEditDelete = isAdminOrManager && (canEdit || canDelete);

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
      // The values object has all required fields, preserving profileImage from the original user
      const updateData: UserUpdateData = {
        userName: values.userName,
        userEmail: values.userEmail || '',
        userRole: values.userRole,
        profileImage: userToReEnable.profileImage || ''
      };
      
      await reEnableUser(userToReEnable._id, updateData);
      
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
        {isAdminOrManager && (
          <Button onClick={handleCreateUser}>Create User</Button>
        )}
      </div>

      <Separator />

      <Card>
        <CardHeader className="space-y-0 pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {isAdminOrManager ? 'User List' : 'My Profile'}
              </CardTitle>
              <CardDescription>
                {isAdminOrManager ? 'View and manage all users' : 'View your user details'}
              </CardDescription>
            </div>
            {isAdminOrManager && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCsv}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0 pt-4">
          {isAdminOrManager && (
            <div className="px-6 pb-4">
              <Tabs value={statusTab} onValueChange={setStatusTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="Active">Active Users</TabsTrigger>
                  <TabsTrigger value="Deleted">Deleted Users</TabsTrigger>
                  <TabsTrigger value="Others">Other Status</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {isAdminOrManager && (
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
          )}

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
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <User className="h-12 w-12 text-muted-foreground opacity-50" />
                      <div className="text-muted-foreground">No users found</div>
                      {isAdminOrManager && statusTab === 'Active' && (
                        <Button onClick={handleCreateUser} variant="outline" size="sm">
                          Create User
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: UserData) => (
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
                        {statusTab === 'Active' && canEdit && isAdminOrManager && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditUser(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {statusTab === 'Active' && canDelete && isAdminOrManager && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteRequest(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {statusTab === 'Deleted' && isAdminOrManager && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleReEnableRequest(user)}
                              title="Re-enable User"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handlePermDeleteRequest(user)}
                              title="Delete Permanently"
                            >
                              <Trash2 className="h-4 w-4" />
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
          
          {isAdminOrManager && filteredUsers.length > 0 && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {pagination.totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextPage}
                disabled={currentPage >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Regular Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? They will be marked as inactive and removed from the active users list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Re-enable User Dialog */}
      <Dialog open={isReEnableDialogOpen} onOpenChange={setIsReEnableDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Re-enable Deleted User</DialogTitle>
            <DialogDescription>
              Update user information and re-enable their account.
            </DialogDescription>
          </DialogHeader>

          {userToReEnable && (
            <div className="py-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleReEnableSubmit)} className="space-y-4">
                  <div className="flex flex-col items-center mb-4">
                    <Avatar className="w-16 h-16 mb-2">
                      {userToReEnable.profileImage ? (
                        <AvatarImage src={userToReEnable.profileImage} />
                      ) : (
                        <AvatarFallback>
                          {userToReEnable.userName?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <h3 className="font-medium text-center">{userToReEnable.userName}</h3>
                    <p className="text-sm text-muted-foreground">{userToReEnable.userPhone}</p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} value={field.value || ''} />
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
                            {validRoles.map((role: string) => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Deleted Date</Label>
                    <p className="text-sm font-medium">
                      {userToReEnable.deletedDate 
                        ? new Date(userToReEnable.deletedDate).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                  
                  <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => setIsReEnableDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Re-enable User
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog */}
      <AlertDialog open={isPermDeleteDialogOpen} onOpenChange={setIsPermDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permanently Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-destructive">WARNING: This action cannot be undone.</strong> This user's data will be permanently deleted from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPermanentDelete} className="bg-destructive text-destructive-foreground">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* User Detail View */}
      <UserDetailView 
        user={selectedUser} 
        isOpen={isDetailViewOpen} 
        onClose={() => setIsDetailViewOpen(false)} 
        onEdit={isAdminOrManager && canEdit ? handleEditUser : undefined}
        onDelete={isAdminOrManager && canDelete ? handleDeleteRequest : undefined}
      />
    </div>
  );
};

export default Staff;
