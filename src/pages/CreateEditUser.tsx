
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { createUser, getUserById, updateUser, UserFormData, UserUpdateData } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '@/services/settingsService';

// Define validation schema
const createUserSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  userPhone: z.string().min(10, "Valid phone number is required"),
  userEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  userRole: z.string().min(1, "Role is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const updateUserSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  userEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  userRole: z.string().min(1, "Role is required"),
});

const CreateEditUser = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState<UserFormData | null>(null);

  // Fetch user roles from settings
  const { data: roleSettings } = useQuery({
    queryKey: ['settings', 'userRoles'],
    queryFn: () => fetchSettings('userRoles'),
  });

  const userRoles = roleSettings?.roles || ['Admin', 'Manager', 'Cashier', 'Waiter'];

  // Fetch user data if in edit mode
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserById(id!),
    enabled: isEditMode,
  });

  // Configure form with the appropriate schema based on mode
  const form = useForm<UserFormData>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: {
      userName: '',
      userPhone: '',
      userEmail: '',
      userRole: '',
      password: '',
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (isEditMode && userData) {
      form.reset({
        userName: userData.userName || '',
        userPhone: userData.userPhone || '',
        userEmail: userData.userEmail || '',
        userRole: userData.userRole || '',
        password: '', // Don't populate password in edit mode
      });
    }
  }, [userData, form, isEditMode]);

  const onSubmit = (data: UserFormData) => {
    if (isEditMode) {
      // Only include fields that are editable in edit mode
      const updateData: UserUpdateData = {
        userName: data.userName,
        userEmail: data.userEmail || '',
        userRole: data.userRole,
      };
      setFormValues(updateData);
    } else {
      setFormValues(data);
    }
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!formValues) return;
    
    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        const updateData = formValues as UserUpdateData;
        await updateUser(id, updateData);
        toast({
          title: "User updated",
          description: "User has been successfully updated",
        });
      } else {
        const createData = formValues as UserFormData;
        await createUser(createData);
        toast({
          title: "User created",
          description: "New user has been successfully created",
        });
      }
      navigate('/staff');
    } catch (error: any) {
      console.error("Error saving user:", error);
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/staff')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit User' : 'Create New User'}</h1>
      </div>

      {isLoadingUser && isEditMode ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Name*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter user name" />
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
                  <FormLabel>Phone Number*</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter phone number" 
                      disabled={isEditMode} 
                      type="tel"
                    />
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
                  <FormLabel>Email Address (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter email address" type="email" />
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
                  <FormLabel>Role*</FormLabel>
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
                      {userRoles.map((role) => (
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
                    <FormLabel>Password*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter password" 
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/staff')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </Form>
      )}

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {isEditMode ? 'Update' : 'Creation'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {isEditMode ? 'update' : 'create'} this user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Yes, {isEditMode ? 'Update' : 'Create'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateEditUser;
