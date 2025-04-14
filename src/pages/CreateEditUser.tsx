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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { createUser, fetchUser, updateUser, UserFormData, UserUpdateData, reEnableUser } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';
import { fetchUserRoles } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

const userFormSchema = z.object({
  userName: z.string().min(1, "Name is required"),
  userPhone: z.string().min(1, "Phone number is required"),
  userEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  userRole: z.string().min(1, "Role is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
  profileImage: z.any().optional(),
});

const CreateEditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isReEnableDialogOpen, setIsReEnableDialogOpen] = useState(false);
  const [deletedUser, setDeletedUser] = useState<any>(null);
  const [formValues, setFormValues] = useState<UserFormData | UserUpdateData | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: userRoles = ['Admin', 'Manager', 'Cashier', 'Waiter'] } = useQuery({
    queryKey: ['userRoles'],
    queryFn: fetchUserRoles,
  });

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id!),
    enabled: isEditMode,
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      userName: '',
      userPhone: '',
      userEmail: '',
      userRole: 'Staff',
      password: '',
      profileImage: null,
    },
  });

  useEffect(() => {
    if (isEditMode && userData) {
      form.reset({
        userName: userData.userName,
        userPhone: userData.userPhone,
        userEmail: userData.userEmail || '',
        userRole: userData.userRole || 'Staff',
        password: '', // Don't prefill password
        profileImage: userData.profileImage || null,
      });
      
      if (userData.profileImage) {
        setProfileImage(userData.profileImage);
      }
    }
  }, [userData, form, isEditMode]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImageFile(null);
    form.setValue('profileImage', null);
  };

  const onSubmit = async (values: UserFormData) => {
    // Add the profile image to form values
    const submissionValues = {
      ...values,
      profileImage: profileImage,
    };
    
    setFormValues(submissionValues);
    
    // If this is a new user, check if it was previously deleted
    if (!isEditMode) {
      try {
        const result = await createUser(submissionValues);
        
        // If the user was previously deleted, show re-enable dialog
        if (result.isDeleted && result.deletedUser) {
          setDeletedUser(result.deletedUser);
          setIsReEnableDialogOpen(true);
          return;
        }
        
        // Otherwise, show the normal confirmation dialog
        setIsConfirmDialogOpen(true);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to check user status",
          variant: "destructive",
        });
      }
    } else {
      // For edit mode, just show the confirmation dialog
      setIsConfirmDialogOpen(true);
    }
  };

  const handleConfirm = async () => {
    if (!formValues) return;
    
    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        const updateData: UserUpdateData = {
          userName: formValues.userName,
          userEmail: formValues.userEmail,
          userRole: formValues.userRole,
          profileImage: formValues.profileImage,
        };
        
        await updateUser(id, updateData);
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        await createUser(formValues as UserFormData);
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }
      
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

  const handleReEnableUser = async () => {
    if (!deletedUser || !formValues) return;
    
    setIsSubmitting(true);
    try {
      const updateData: UserUpdateData = {
        userName: formValues.userName,
        userEmail: formValues.userEmail,
        userRole: formValues.userRole,
        profileImage: formValues.profileImage,
      };
      
      await reEnableUser(deletedUser._id, updateData);
      
      toast({
        title: "Success",
        description: "User has been re-enabled successfully",
      });
      
      navigate('/staff');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to re-enable user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsReEnableDialogOpen(false);
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
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <Avatar className="w-24 h-24">
                      {profileImage ? (
                        <AvatarImage src={profileImage} />
                      ) : (
                        <AvatarFallback className="text-xl">
                          {form.watch('userName')
                            ? form.watch('userName').substring(0, 2).toUpperCase()
                            : 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {profileImage && (
                      <Button 
                        type="button"
                        variant="destructive" 
                        size="icon" 
                        className="absolute -top-2 -right-2 rounded-full h-6 w-6 p-1"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <label htmlFor="profile-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80">
                        <Upload className="h-4 w-4" />
                        <span>{profileImage ? 'Change photo' : 'Upload photo'}</span>
                      </div>
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
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
                        value={field.value}
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
      
      {/* Regular Confirmation Dialog */}
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

      {/* Re-enable User Dialog */}
      <Dialog open={isReEnableDialogOpen} onOpenChange={setIsReEnableDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Re-enable Deleted User</DialogTitle>
            <DialogDescription>
              This user was previously deleted. Do you want to re-enable their account?
            </DialogDescription>
          </DialogHeader>

          {deletedUser && (
            <div className="py-4">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="w-16 h-16 mb-2">
                  {deletedUser.profileImage ? (
                    <AvatarImage src={deletedUser.profileImage} />
                  ) : (
                    <AvatarFallback>
                      {deletedUser.userName?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h3 className="font-medium text-center">{deletedUser.userName}</h3>
                <p className="text-sm text-muted-foreground">{deletedUser.userPhone}</p>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Previous Role</Label>
                    <p className="text-sm font-medium">{deletedUser.userRole}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">New Role</Label>
                    <p className="text-sm font-medium">{formValues?.userRole}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Previous Email</Label>
                  <p className="text-sm font-medium">{deletedUser.userEmail || 'N/A'}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">New Email</Label>
                  <p className="text-sm font-medium">{formValues?.userEmail || 'N/A'}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Deleted Date</Label>
                  <p className="text-sm font-medium">
                    {deletedUser.deletedDate 
                      ? new Date(deletedUser.deletedDate).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReEnableDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReEnableUser}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Re-enable User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateEditUser;
