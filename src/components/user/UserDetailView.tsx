
import React from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserData } from '@/pages/Staff';
import { formatDate } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';

interface UserDetailViewProps {
  user: UserData;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

const UserDetailView: React.FC<UserDetailViewProps> = ({
  user,
  onEdit,
  onDelete,
  canEdit,
  canDelete
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
          <p className="mt-1">{user.userName}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
          <p className="mt-1">{user.userPhone}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
        <p className="mt-1">{user.userEmail || "Not provided"}</p>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
          <p className="mt-1">{user.userRole}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          <p className="mt-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              user.userStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.userStatus}
            </span>
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Created Date</h3>
        <p className="mt-1">{formatDate(user.userCreatedDate)}</p>
      </div>

      <Separator />

      <div className="flex justify-end gap-2">
        {canEdit && (
          <Button 
            variant="outline" 
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit User
          </Button>
        )}
        {canDelete && (
          <Button 
            variant="destructive" 
            onClick={onDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete User
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserDetailView;
