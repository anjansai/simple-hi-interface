
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image as ImageIcon } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{item.itemName || 'Item Details'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(80vh-120px)]">
          <div className="space-y-4 pr-4">
            <div className="aspect-video w-full overflow-hidden bg-muted rounded-md">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.itemName || "Menu Item"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/600x400";
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-300" />
                  <span className="ml-2 text-gray-400">No image available</span>
                </div>
              )}
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
        </ScrollArea>
        
        <DialogFooter className="sticky bottom-0 pt-2 bg-background">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailModal;
