
import React, { useState } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { checkInitialLogin, completeLogin } from '@/services/instanceService';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialLoginSchema = z.object({
  userPhone: z.string().min(1, "Phone number is required"),
  companyId: z.string().min(1, "Company ID is required"),
});

type InitialLoginData = z.infer<typeof initialLoginSchema>;

const Login: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialLoginData | null>(null);
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyId, setCompanyId] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await checkInitialLogin(phone, companyId);
      setInitialData({ userPhone: phone, companyId });
      setPassword(''); // Ensure password is reset
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData) return;
    
    setIsLoading(true);
    try {
      const response = await completeLogin({
        userPhone: initialData.userPhone,
        companyId: initialData.companyId,
        password
      });
      
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.user));
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid password. Please try again.",
        variant: "destructive",
      });
      setPassword(''); // Clear password on error
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
          <form onSubmit={handleInitialLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="Enter company ID"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Next
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                autoFocus
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
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
        )}
      </div>
    </div>
  );
};

export default Login;
