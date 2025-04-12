
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createUser, fetchUser, updateUser, UserFormData, UserUpdateData } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';
import { fetchUserRoles } from '@/services/userService';

// Form schema
const userFormSchema = z.object({
  userName: z.string().min(1, "Name is required"),
  userPhone: z.string().min(1, "Phone number is required"),
  userEmail: z.string().email("Invalid email").optional(),
  userRole: z.string().min(1, "Role is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

const CreateEditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState<UserFormData | UserUpdateData | null>(null);

  // Fetch user roles from settings
  const { data: userRoles = ['Admin', 'Manager', 'Cashier', 'Waiter'] } = useQuery({
    queryKey: ['userRoles'],
    queryFn: fetchUserRoles,
  });

  // Fetch user data if in edit mode
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id!),
    enabled: isEditMode,
  });

  // Initialize form with default values or user data if in edit mode
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      userName: '',
      userPhone: '',
      userEmail: '',
      userRole: 'Staff',
      password: '',
    },
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (isEditMode && userData) {
      form.reset({
        userName: userData.userName,
        userPhone: userData.userPhone,
        userEmail: userData.userEmail || '',
        userRole: userData.userRole || 'Staff',
        password: '', // Don't prefill password
      });
    }
  }, [userData, form, isEditMode]);

  // Form submission handler
  const onSubmit = (values: UserFormData) => {
    setFormValues(values);
    setIsConfirmDialogOpen(true);
  };

  // Handle confirmation dialog - create or update user
  const handleConfirm = async () => {
    if (!formValues) return;
    
    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        // Update existing user - only specific fields
        const updateData: UserUpdateData = {
          userName: formValues.userName,
          userEmail: formValues.userEmail,
          userRole: formValues.userRole,
        };
        
        await updateUser(id, updateData);
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user
        await createUser(formValues as UserFormData);
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }
      
      // Navigate back to staff page
      navigate('/staff');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <Button 
        variant="outline" 
        className="mb-6"
        onClick={() => navigate('/staff')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Staff
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit User' : 'Create New User'}</CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Update user information' 
              : 'Fill in the details to create a new user account'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoadingUser ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin opacity-70" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  name="userPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter phone number" 
                          {...field} 
                          disabled={isEditMode} 
                        />
                      </FormControl>
                      <FormDescription>
                        {isEditMode && "Phone number cannot be changed"}
                      </FormDescription>
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
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userRoles.map((role) => (
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
                
                {!isEditMode && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Update User' : 'Create User'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEditMode ? 'Update User' : 'Create New User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {isEditMode ? 'update' : 'create'} this user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateEditUser;
