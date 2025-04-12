
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
import { checkInitialLogin, completeLogin } from '@/services/instanceService';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// First step validation schema
const initialLoginSchema = z.object({
  userPhone: z.string().min(1, "Phone number is required"),
  companyId: z.string().min(1, "Company ID is required"),
});

// Second step validation schema
const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type InitialLoginData = z.infer<typeof initialLoginSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

const Login: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialLoginData | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Initial form (phone and company ID)
  const initialForm = useForm<InitialLoginData>({
    resolver: zodResolver(initialLoginSchema),
    defaultValues: {
      userPhone: '',
      companyId: '',
    },
  });
  
  // Password form (second step)
  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
    },
  });
  
  // Handle initial login check
  const handleInitialLogin = async (data: InitialLoginData) => {
    setIsLoading(true);
    try {
      await checkInitialLogin(data.userPhone, data.companyId);
      setInitialData(data);
      setStep(2);
    } catch (error: any) {
      console.error('Login check failed:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please check your phone number and company ID.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle password submission
  const handlePasswordSubmit = async (data: PasswordData) => {
    if (!initialData) return;
    
    setIsLoading(true);
    try {
      const loginData = {
        userPhone: initialData.userPhone,
        companyId: initialData.companyId,
        password: data.password,
      };
      
      const response = await completeLogin(loginData);
      
      // Store auth token or user data in local storage or context
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.user));
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid password. Please try again.",
        variant: "destructive",
      });
      // If password is wrong, let's go back to first step
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-md rounded-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to Anjan Sai's Application</h1>
          <p className="text-muted-foreground mt-2">
            {step === 1 
              ? "Please enter your credentials to log in" 
              : "Please enter your password to continue"}
          </p>
        </div>
        
        {step === 1 ? (
          <Form {...initialForm}>
            <form onSubmit={initialForm.handleSubmit(handleInitialLogin)} className="space-y-4">
              <FormField
                control={initialForm.control}
                name="userPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your phone number" type="tel" />
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
                      <Input {...field} placeholder="Enter company ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Next
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto" 
                    onClick={() => navigate('/setup-new')}
                  >
                    Create a new instance
                  </Button>
                </p>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your password" type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log In
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default Login;
