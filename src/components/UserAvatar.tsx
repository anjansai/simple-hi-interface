
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Key, Mail, Phone, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  userName: string;
  userEmail?: string;
  userPhone: string;
  userRole?: string;
  apiKey?: string;
  companyId?: string;
  profileImage?: string;
}

const UserAvatar: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);
  
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    
    // Navigate to login page
    navigate('/login');
  };
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (!userData) return null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer">
          <Avatar>
            {userData.profileImage ? (
              <AvatarImage src={userData.profileImage} alt={userData.userName} />
            ) : (
              <AvatarFallback>{getInitials(userData.userName)}</AvatarFallback>
            )}
          </Avatar>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>{userData.userName || 'User'}</span>
          </DropdownMenuItem>
          {userData.userEmail && (
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              <span>{userData.userEmail}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>
            <Phone className="mr-2 h-4 w-4" />
            <span>{userData.userPhone}</span>
          </DropdownMenuItem>
          {userData.apiKey && (
            <DropdownMenuItem>
              <Key className="mr-2 h-4 w-4" />
              <span>API Key: {userData.apiKey}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatar;
