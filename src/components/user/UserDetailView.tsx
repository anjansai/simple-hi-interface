
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Trash2 } from 'lucide-react';
import { UserData } from '@/pages/Staff';

interface UserDetailViewProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (user: UserData) => void;
  onDelete?: (user: UserData) => void;
}

const UserDetailView: React.FC<UserDetailViewProps> = ({
  user,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!user) return null;
  
  const formattedDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View detailed information about this user.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-24 h-24 mb-3">
              {user.profileImage ? (
                <AvatarImage src={user.profileImage} />
              ) : (
                <AvatarFallback className="text-xl">
                  {user.userName?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <h3 className="text-lg font-semibold">{user.userName}</h3>
            <p className="text-sm text-muted-foreground">{user.userRole}</p>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="text-sm font-medium">{user.userPhone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user.userEmail || 'N/A'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className={`text-sm font-medium inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  user.userStatus === 'Active' ? 'bg-green-100 text-green-800' : 
                  user.userStatus === 'Deleted' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.userStatus}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created Date</p>
                <p className="text-sm font-medium">{formattedDate(user.userCreatedDate)}</p>
              </div>
            </div>
            
            {user.userStatus === 'Deleted' && (
              <div>
                <p className="text-xs text-muted-foreground">Deleted Date</p>
                <p className="text-sm font-medium">{formattedDate(user.deletedDate)}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          <div className="flex gap-2">
            {onEdit && user.userStatus === 'Active' && (
              <Button 
                variant="outline" 
                onClick={() => onEdit(user)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            
            {onDelete && user.userStatus === 'Active' && (
              <Button 
                variant="destructive" 
                onClick={() => onDelete(user)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailView;
