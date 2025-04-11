
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Eye, EyeOff, Save, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { createUser, fetchUser, fetchUserRoles, updateUser } from '@/services/userService';

// Schema for user creation
const createUserSchema = z.object({
  userName: z.string().min(1, { message: "User name is required" }),
  userPhone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  userEmail: z.string().email({ message: "Invalid email format" }).optional().or(z.literal('')),
  userRole: z.string().min(1, { message: "Role is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Schema for user editing (no password field)
const editUserSchema = z.object({
  userName: z.string().min(1, { message: "User name is required" }),
  userEmail: z.string().email({ message: "Invalid email format" }).optional().or(z.literal('')),
  userRole: z.string().min(1, { message: "Role is required" }),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

const CreateEditUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  // Fetch user roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles'],
    queryFn: fetchUserRoles,
  });

  // Fetch user data for edit mode
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id!),
    enabled: isEditMode,
  });
  
  // Form setup based on mode
  const form = useForm<CreateUserFormValues | EditUserFormValues>({
    resolver: zodResolver(isEditMode ? editUserSchema : createUserSchema),
    defaultValues: isEditMode
      ? {
          userName: '',
          userEmail: '',
          userRole: '',
        }
      : {
          userName: '',
          userPhone: '',
          userEmail: '',
          userRole: '',
          password: '',
        },
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (isEditMode && userData) {
      form.reset({
        userName: userData.userName,
        userEmail: userData.userEmail || '',
        userRole: userData.userRole,
      });
    }
  }, [userData, form, isEditMode]);

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created successfully!");
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/staff');
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create user.");
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: { id: string; update: EditUserFormValues }) => 
      updateUser(data.id, data.update),
    onSuccess: () => {
      toast.success("User updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      navigate('/staff');
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user.");
    },
  });

  const onSubmit = (values: CreateUserFormValues | EditUserFormValues) => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    const values = form.getValues();
    
    if (isEditMode) {
      updateUserMutation.mutate({ 
        id: id!, 
        update: values as EditUserFormValues 
      });
    } else {
      createUserMutation.mutate(values as CreateUserFormValues);
    }
    
    setIsConfirmDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit User" : "Create User"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode 
              ? "Update user information" 
              : "Add a new user to the system"}
          </p>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
          <CardDescription>
            Enter the required information to {isEditMode ? "update" : "create"} a user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(userLoading && isEditMode) ? (
            <div className="flex justify-center py-8">
              <p>Loading user data...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!isEditMode && (
                  <FormField
                    control={form.control}
                    name="userPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="userEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEditMode ? "Email" : "Email (Optional)"}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@example.com" {...field} />
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
                      <FormLabel>Role *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={rolesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role: string) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!isEditMode && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Enter password" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {isEditMode && userData && (
                  <div className="bg-muted p-3 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Phone Number:</span>
                      <span className="text-sm">{userData.userPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <span className="text-sm">{userData.userStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm">{new Date(userData.userCreatedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/staff')}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex items-center gap-2"
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {isEditMode ? "Update User" : "Create User"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEditMode ? "Update User" : "Create User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {isEditMode ? "update" : "create"} this user with the provided information?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {isEditMode ? "Update" : "Create"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateEditUser;
