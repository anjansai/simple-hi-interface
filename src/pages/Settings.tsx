
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { fetchSettings, updateSettings } from '@/services/settingsService';

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [catalogSettings, setCatalogSettings] = useState({
    itemDelete: false,
    itemEdit: true
  });

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
    },
    onError: (err) => {
      toast({
        title: "Error updating settings",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      console.error("Settings update error:", err);
    },
  });

  // Handle toggle changes
  const handleToggleChange = (field: 'itemDelete' | 'itemEdit', value: boolean) => {
    const updatedSettings = {
      ...catalogSettings,
      [field]: value
    };
    
    setCatalogSettings(updatedSettings);
    updateSettingsMutation.mutate({
      type: 'catalog',
      ...updatedSettings
    });
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
                onCheckedChange={(checked) => handleToggleChange('itemDelete', checked)}
                disabled={isLoading}
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
                onCheckedChange={(checked) => handleToggleChange('itemEdit', checked)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
