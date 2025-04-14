
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserAvatar = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Extract initials from user name
  const getInitials = () => {
    if (!userData || !userData.userName) return 'U';
    
    const nameParts = userData.userName.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer border-2 border-primary/10 h-9 w-9">
          {userData?.profileImage ? (
            <AvatarImage 
              src={userData.profileImage} 
              alt={userData.userName || "User"} 
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="bg-primary-foreground text-primary">
              {getInitials()}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData?.userName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData?.userEmail || userData?.userPhone || ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <div className="mb-1 font-semibold">API Key</div>
          <div className="font-mono bg-muted p-1 rounded text-xs overflow-x-auto">
            {userData?.apiKey || 'Not available'}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium">{userData?.userRole || 'User'}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{userData?.userPhone || 'N/A'}</span>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatar;
