
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { checkInitialLogin, completeLogin } from '@/services/instanceService';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

// Form schema for initial login (phone + company ID)
const initialFormSchema = z.object({
  userPhone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  companyId: z.string().min(1, { message: "Company ID is required" }),
});

// Form schema for password step
const passwordFormSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

type InitialFormValues = z.infer<typeof initialFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [loginStep, setLoginStep] = useState<'initial' | 'password'>('initial');
  const [userData, setUserData] = useState<{ userPhone: string; companyId: string }>({ 
    userPhone: '', 
    companyId: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Form for initial login step
  const initialForm = useForm<InitialFormValues>({
    resolver: zodResolver(initialFormSchema),
    defaultValues: {
      userPhone: '',
      companyId: '',
    },
  });

  // Form for password step
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: '',
    },
  });

  // Initial login check mutation
  const initialLoginMutation = useMutation({
    mutationFn: (data: { userPhone: string; companyId: string }) => 
      checkInitialLogin(data.userPhone, data.companyId),
    onSuccess: (_, variables) => {
      toast.success("User found! Please enter your password.");
      setUserData(variables);
      setLoginStep('password');
    },
    onError: (error: any) => {
      toast.error(error.message || "Invalid credentials. Please try again.");
    }
  });

  // Complete login mutation
  const completeLoginMutation = useMutation({
    mutationFn: (data: { userPhone: string; companyId: string; password: string }) => 
      completeLogin(data),
    onSuccess: (data) => {
      toast.success("Login successful! Redirecting to dashboard...");
      
      // Store user data in local storage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => navigate('/'), 1000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Login failed. Please check your password and try again.");
    }
  });

  const onInitialSubmit = (values: InitialFormValues) => {
    initialLoginMutation.mutate(values);
  };

  const onPasswordSubmit = (values: PasswordFormValues) => {
    completeLoginMutation.mutate({
      ...userData,
      password: values.password
    });
  };

  const handleBackToInitial = () => {
    setLoginStep('initial');
    passwordForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Anjan Sai's Application</CardTitle>
          <CardDescription>
            {loginStep === 'initial' 
              ? "Enter your phone number and company ID to login" 
              : "Enter your password to complete login"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginStep === 'initial' ? (
            <Form {...initialForm}>
              <form onSubmit={initialForm.handleSubmit(onInitialSubmit)} className="space-y-4">
                <FormField
                  control={initialForm.control}
                  name="userPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={initialForm.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={initialLoginMutation.isPending}
                >
                  {initialLoginMutation.isPending ? "Checking..." : "Continue"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="bg-muted p-3 rounded-md mb-4">
                  <p className="text-sm font-medium">Phone: {userData.userPhone}</p>
                  <p className="text-sm font-medium">Company ID: {userData.companyId}</p>
                </div>
                
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter your password" 
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

                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleBackToInitial}
                    disabled={completeLoginMutation.isPending}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={completeLoginMutation.isPending}
                  >
                    {completeLoginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {loginStep === 'initial' && (
            <p className="text-sm text-muted-foreground">
              Don't have an account? <a href="/setup-new" className="text-primary hover:underline">Create Instance</a>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
