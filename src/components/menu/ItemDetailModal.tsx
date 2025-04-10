
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
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
  item,
}) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item.itemName || 'Item Details'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="aspect-video w-full overflow-hidden bg-muted rounded-md">
            <img
              src={item.imageUrl || "https://placehold.co/600x400"}
              alt={item.itemName || "Menu Item"}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/600x400";
              }}
            />
          </div>
          
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item Code:</span>
              <span className="font-medium">{item.itemCode}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{item.Category}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium">₹{typeof item.MRP === 'number' ? item.MRP.toFixed(2) : '0.00'}</span>
            </div>
            
            {item.StarterType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Starter Type:</span>
                <span className="font-medium">{item.StarterType}</span>
              </div>
            )}
            
            {item.description && (
              <div>
                <span className="text-muted-foreground block mb-1">Description:</span>
                <p className="text-sm">{item.description}</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailModal;
