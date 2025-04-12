
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
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
import { createNewInstance, InstanceData } from '@/services/instanceService';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define schema for form validation
const setupSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  userName: z.string().min(1, "User name is required"),
  userEmail: z.string().email("Invalid email address").min(1, "User email is required"),
  userPhone: z.string().min(10, "Valid phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SetupFormData = z.infer<typeof setupSchema>;

const SetupNew: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      companyName: '',
      companyEmail: '',
      userName: '',
      userEmail: '',
      userPhone: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: SetupFormData) => {
    setIsSubmitting(true);
    try {
      // Create instance data object with required fields
      const instanceData: InstanceData = {
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        userName: data.userName,
        userEmail: data.userEmail,
        userPhone: data.userPhone,
        password: data.password,
      };
      
      const response = await createNewInstance(instanceData);
      
      toast({
        title: "Setup successful",
        description: "Your instance has been created successfully",
      });
      
      // Store authentication data
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.user));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Setup failed:', error);
      toast({
        title: "Setup failed",
        description: error.message || "Failed to create instance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-2xl space-y-8 bg-white p-8 shadow-md rounded-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create New Instance</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new instance to start managing your business
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Company Information</h2>
              
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter company name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Email (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter company email" type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Admin User Information</h2>
              
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
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Email*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter user email" type="email" />
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
                      <Input {...field} placeholder="Enter phone number" type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter password" type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="sm:flex-1"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="sm:flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Instance
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SetupNew;
