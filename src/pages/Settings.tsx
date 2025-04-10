
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { fetchSettings, updateSettings } from '@/services/settingsService';
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

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [catalogSettings, setCatalogSettings] = useState({
    itemDelete: false,
    itemEdit: true
  });
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingSettingChange, setPendingSettingChange] = useState<{
    field: 'itemDelete' | 'itemEdit';
    value: boolean;
  } | null>(null);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', 'catalog'],
    queryFn: () => fetchSettings('catalog'),
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (settings) {
      setCatalogSettings({
        itemDelete: settings.itemDelete ?? false,
        itemEdit: settings.itemEdit ?? true
      });
    }
  }, [settings]);

  // Mutation to update settings
  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully",
      });
      setPendingSettingChange(null);
    },
    onError: (err) => {
      toast({
        title: "Error updating settings",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      console.error("Settings update error:", err);
      
      // Revert UI state on error
      if (pendingSettingChange) {
        setCatalogSettings(prev => ({
          ...prev,
          [pendingSettingChange.field]: !pendingSettingChange.value
        }));
      }
      setPendingSettingChange(null);
    },
  });

  // Handle toggle change request
  const handleToggleChangeRequest = (field: 'itemDelete' | 'itemEdit', value: boolean) => {
    setPendingSettingChange({ field, value });
    setConfirmDialogOpen(true);
  };
  
  // Confirm setting change
  const confirmSettingChange = () => {
    if (pendingSettingChange) {
      const { field, value } = pendingSettingChange;
      const updatedSettings = {
        ...catalogSettings,
        [field]: value
      };
      
      setCatalogSettings(updatedSettings);
      updateSettingsMutation.mutate({
        type: 'catalog',
        ...updatedSettings
      });
      setConfirmDialogOpen(false);
    }
  };
  
  // Cancel setting change
  const cancelSettingChange = () => {
    setPendingSettingChange(null);
    setConfirmDialogOpen(false);
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
                onCheckedChange={(checked) => handleToggleChangeRequest('itemDelete', checked)}
                disabled={isLoading || updateSettingsMutation.isPending}
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
                onCheckedChange={(checked) => handleToggleChangeRequest('itemEdit', checked)}
                disabled={isLoading || updateSettingsMutation.isPending}
              />
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
              {pendingSettingChange?.field === 'itemDelete' ? (
                pendingSettingChange?.value 
                  ? "Are you sure you want to enable item deletion? This will allow users to permanently remove menu items."
                  : "Are you sure you want to disable item deletion? Users will no longer be able to delete menu items."
              ) : (
                pendingSettingChange?.value
                  ? "Are you sure you want to enable item editing? This will allow users to modify menu items."
                  : "Are you sure you want to disable item editing? Users will no longer be able to edit menu items."
              )}
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
