
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { fetchSettings, updateSettings } from '@/services/settingsService';
import { fetchUserRoles, addUserRole, updateStaffSettings, fetchStaffSettings } from '@/services/userService';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { toast: toastUI } = useToast();
  const queryClient = useQueryClient();
  const [catalogSettings, setCatalogSettings] = useState({
    itemDelete: false,
    itemEdit: true
  });
  const [staffSettings, setStaffSettings] = useState({
    userEdit: true,
    userDelete: true
  });
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingSettingChange, setPendingSettingChange] = useState<{
    type: 'catalog' | 'staff';
    field: string;
    value: boolean;
  } | null>(null);

  // Fetch current settings
  const { data: catalogSettingsData, isLoading: catalogSettingsLoading } = useQuery({
    queryKey: ['settings', 'catalog'],
    queryFn: () => fetchSettings('catalog'),
  });

  // Fetch staff settings
  const { data: staffSettingsData, isLoading: staffSettingsLoading } = useQuery({
    queryKey: ['settings', 'userEdit'],
    queryFn: fetchStaffSettings,
  });

  // Fetch user roles
  const { data: userRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles'],
    queryFn: fetchUserRoles,
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (catalogSettingsData) {
      setCatalogSettings({
        itemDelete: catalogSettingsData.itemDelete ?? false,
        itemEdit: catalogSettingsData.itemEdit ?? true
      });
    }
  }, [catalogSettingsData]);

  useEffect(() => {
    if (staffSettingsData) {
      setStaffSettings({
        userEdit: staffSettingsData.userEdit ?? true,
        userDelete: staffSettingsData.userDelete ?? true
      });
    }
  }, [staffSettingsData]);

  // Mutation to update catalog settings
  const updateCatalogSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'catalog'] });
      toastUI({
        title: "Settings updated",
        description: "Your catalog settings have been saved",
      });
      setPendingSettingChange(null);
    },
    onError: (err) => {
      toastUI({
        title: "Error updating settings",
        description: "Failed to update catalog settings",
        variant: "destructive",
      });
      console.error("Settings update error:", err);
      
      // Revert UI state on error
      if (pendingSettingChange?.type === 'catalog') {
        setCatalogSettings(prev => ({
          ...prev,
          [pendingSettingChange.field]: !pendingSettingChange.value
        }));
      }
      setPendingSettingChange(null);
    },
  });

  // Mutation to update staff settings
  const updateStaffSettingsMutation = useMutation({
    mutationFn: updateStaffSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'userEdit'] });
      toastUI({
        title: "Settings updated",
        description: "Your staff settings have been saved",
      });
      setPendingSettingChange(null);
    },
    onError: (err) => {
      toastUI({
        title: "Error updating settings",
        description: "Failed to update staff settings",
        variant: "destructive",
      });
      console.error("Staff settings update error:", err);
      
      // Revert UI state on error
      if (pendingSettingChange?.type === 'staff') {
        setStaffSettings(prev => ({
          ...prev,
          [pendingSettingChange.field]: !pendingSettingChange.value
        }));
      }
      setPendingSettingChange(null);
    },
  });

  // Handle toggle change request
  const handleToggleChangeRequest = (type: 'catalog' | 'staff', field: string, value: boolean) => {
    setPendingSettingChange({ type, field, value });
    setConfirmDialogOpen(true);
  };
  
  // Confirm setting change
  const confirmSettingChange = () => {
    if (pendingSettingChange) {
      const { type, field, value } = pendingSettingChange;
      
      if (type === 'catalog') {
        const updatedSettings = {
          ...catalogSettings,
          [field]: value
        };
        
        setCatalogSettings(updatedSettings);
        updateCatalogSettingsMutation.mutate({
          type: 'catalog',
          ...updatedSettings
        });
      } else if (type === 'staff') {
        const updatedSettings = {
          ...staffSettings,
          [field]: value
        };
        
        setStaffSettings(updatedSettings);
        updateStaffSettingsMutation.mutate(updatedSettings);
      }
      
      setConfirmDialogOpen(false);
    }
  };
  
  // Cancel setting change
  const cancelSettingChange = () => {
    setPendingSettingChange(null);
    setConfirmDialogOpen(false);
  };

  // Role form schema
  const roleFormSchema = z.object({
    role: z.string().min(1, { message: "Role name is required" })
      .refine(roleName => !userRoles.includes(roleName), {
        message: "This role already exists"
      })
  });

  // Role form
  const roleForm = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      role: '',
    },
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: addUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      toast.success("Role added successfully");
      roleForm.reset();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add role");
    },
  });

  // Handle role submission
  const onRoleSubmit = (values: z.infer<typeof roleFormSchema>) => {
    addRoleMutation.mutate(values.role);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your application settings here.</p>
      </div>

      <Separator />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Catalog Management</CardTitle>
            <CardDescription>
              Controls for the menu management page functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Items</p>
                <p className="text-sm text-muted-foreground">
                  Allow item deletion in the menu management page
                </p>
              </div>
              <Switch 
                checked={catalogSettings.itemDelete}
                onCheckedChange={(checked) => handleToggleChangeRequest('catalog', 'itemDelete', checked)}
                disabled={catalogSettingsLoading || updateCatalogSettingsMutation.isPending}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Edit Items</p>
                <p className="text-sm text-muted-foreground">
                  Allow item editing in the menu management page
                </p>
              </div>
              <Switch 
                checked={catalogSettings.itemEdit}
                onCheckedChange={(checked) => handleToggleChangeRequest('catalog', 'itemEdit', checked)}
                disabled={catalogSettingsLoading || updateCatalogSettingsMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Controls for the staff management page functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Edit Users</p>
                <p className="text-sm text-muted-foreground">
                  Allow user editing in the staff management page
                </p>
              </div>
              <Switch 
                checked={staffSettings.userEdit}
                onCheckedChange={(checked) => handleToggleChangeRequest('staff', 'userEdit', checked)}
                disabled={staffSettingsLoading || updateStaffSettingsMutation.isPending}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Users</p>
                <p className="text-sm text-muted-foreground">
                  Allow user deletion in the staff management page
                </p>
              </div>
              <Switch 
                checked={staffSettings.userDelete}
                onCheckedChange={(checked) => handleToggleChangeRequest('staff', 'userDelete', checked)}
                disabled={staffSettingsLoading || updateStaffSettingsMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>
              Configure user roles for the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4">
              <p className="font-medium mb-2">Current Roles</p>
              <div className="flex flex-wrap gap-2">
                {rolesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading roles...</p>
                ) : userRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No roles defined yet</p>
                ) : (
                  userRoles.map(role => (
                    <Badge key={role} variant="secondary" className="text-sm py-1 px-2">
                      {role}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="font-medium mb-2">Add New Role</p>
              <Form {...roleForm}>
                <form onSubmit={roleForm.handleSubmit(onRoleSubmit)} className="flex items-center gap-2">
                  <div className="flex-1">
                    <FormField
                      control={roleForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Enter role name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={addRoleMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Settings Change</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSettingChange?.type === 'catalog' && pendingSettingChange?.field === 'itemDelete' ? (
                pendingSettingChange?.value 
                  ? "Are you sure you want to enable item deletion? This will allow users to permanently remove menu items."
                  : "Are you sure you want to disable item deletion? Users will no longer be able to delete menu items."
              ) : pendingSettingChange?.type === 'catalog' && pendingSettingChange?.field === 'itemEdit' ? (
                pendingSettingChange?.value
                  ? "Are you sure you want to enable item editing? This will allow users to modify menu items."
                  : "Are you sure you want to disable item editing? Users will no longer be able to edit menu items."
              ) : pendingSettingChange?.type === 'staff' && pendingSettingChange?.field === 'userEdit' ? (
                pendingSettingChange?.value
                  ? "Are you sure you want to enable user editing? This will allow administrators to modify user details."
                  : "Are you sure you want to disable user editing? Administrators will no longer be able to edit user details."
              ) : pendingSettingChange?.type === 'staff' && pendingSettingChange?.field === 'userDelete' ? (
                pendingSettingChange?.value
                  ? "Are you sure you want to enable user deletion? This will allow administrators to deactivate user accounts."
                  : "Are you sure you want to disable user deletion? Administrators will no longer be able to deactivate user accounts."
              ) : "Are you sure you want to update this setting?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelSettingChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSettingChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
