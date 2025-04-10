
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MenuItem } from '@/services/menuService';

interface ItemDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  open,
  onOpenChange,
  item
}) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item.itemName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {item.imageUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
              <img
                src={item.imageUrl || "https://placehold.co/400x300"}
                alt={item.itemName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/400x300";
                }}
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Item Code</p>
              <p>{item.itemCode}</p>
            </div>
            
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Price</p>
              <p>₹{typeof item.MRP === 'number' ? item.MRP.toFixed(2) : '0.00'}</p>
            </div>
            
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Category</p>
              <p>{item.Category}</p>
            </div>
            
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Type Code</p>
              <p>{item.Type}</p>
            </div>
          </div>
          
          {item.description && (
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Description</p>
              <p className="mt-1">{item.description}</p>
            </div>
          )}
          
          {item.StarterType && (
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Starter Type</p>
              <p>{item.StarterType}</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailModal;
