
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Pencil, Trash2, User, Users } from 'lucide-react';
import { fetchStaffSettings, fetchUserRoles, fetchUsers } from '@/services/userService';
import { Skeleton } from '@/components/ui/skeleton';
import UserDetailView from '@/components/user/UserDetailView';

export interface UserData {
  _id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userRole: string;
  userCreatedDate: string;
  userStatus: string;
}

const Staff = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users', selectedRole],
    queryFn: () => fetchUsers(selectedRole),
  });

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
    // Deletion handled in the userService.ts
    // resetState after delete
    setUserToDelete(null);
    setIsDeleteDialogOpen(false);
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
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User List
              </CardTitle>
              <CardDescription>View and manage all users</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by role:</span>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  {roles.map((role: string) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                      <Button onClick={handleCreateUser} variant="outline" size="sm">
                        Create User
                      </Button>
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
                        user.userStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.userStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditUser(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteRequest(user)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
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
              canEdit={canEdit}
              canDelete={canDelete}
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
    </div>
  );
};

export default Staff;
