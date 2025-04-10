
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw } from 'lucide-react';
import { MenuItem, generateItemCode } from '@/services/menuService';
import { useToast } from '@/hooks/use-toast';

// Define validation schema for the form
const formSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  itemCode: z.string(),
  MRP: z.number().min(0, "Price must be 0 or greater"),
  Category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  Type: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

interface ItemFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MenuItem) => Promise<void>;
  item?: MenuItem;
  title: string;
  isEdit?: boolean;
  isLoading?: boolean;
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  item,
  title,
  isEdit = false,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(item?.Category || '');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: item?.itemName || '',
      itemCode: item?.itemCode || '',
      MRP: item?.MRP || undefined,
      Category: item?.Category || '',
      description: item?.description || '',
      Type: item?.Type || 0,
    },
    mode: "onChange"
  });
  
  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (open && item) {
      form.reset({
        itemName: item.itemName || '',
        itemCode: item.itemCode || '',
        MRP: item.MRP || undefined,
        Category: item.Category || '',
        description: item.description || '',
        Type: item.Type || 0,
      });
      setSelectedCategory(item.Category || '');
    } else if (open && !item) {
      form.reset({
        itemName: '',
        itemCode: '',
        MRP: undefined,
        Category: '',
        description: '',
        Type: 0,
      });
      setSelectedCategory('');
    }
  }, [open, item, form]);

  const handleCategoryChange = async (value: string) => {
    setSelectedCategory(value);
    form.setValue('Category', value);
    
    // Set a default type based on category (can be modified as needed)
    let typeValue = 0;
    switch(value) {
      case 'Starters': typeValue = 222; break;
      case 'Main course': typeValue = 223; break;
      case 'Desserts': typeValue = 224; break;
      case 'Beverages': typeValue = 225; break;
      case 'Specials': typeValue = 226; break;
      case 'Others': typeValue = 227; break;
      default: typeValue = 0;
    }
    form.setValue('Type', typeValue);
    
    if (!isEdit) {
      try {
        setIsGeneratingCode(true);
        const code = await generateItemCode();
        form.setValue('itemCode', code);
      } catch (error) {
        toast({
          title: "Error generating code",
          description: "Failed to generate a unique item code",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingCode(false);
      }
    }
  };

  const handleRegenerateCode = async () => {
    try {
      setIsGeneratingCode(true);
      const code = await generateItemCode();
      form.setValue('itemCode', code);
    } catch (error) {
      toast({
        title: "Error regenerating code",
        description: "Failed to generate a unique item code",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSubmit = async (data: FormValues) => {
    try {
      const itemData: MenuItem = {
        ...data,
        MRP: data.MRP || 0
      };
      await onSubmit(itemData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter item name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="Category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select
                      onValueChange={handleCategoryChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Starters">Starters</SelectItem>
                        <SelectItem value="Main course">Main Course</SelectItem>
                        <SelectItem value="Desserts">Desserts</SelectItem>
                        <SelectItem value="Beverages">Beverages</SelectItem>
                        <SelectItem value="Specials">Specials</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="itemCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Code</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} disabled placeholder="Auto-generated" />
                      </FormControl>
                      {!isEdit && (
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="outline"
                          onClick={handleRegenerateCode}
                          disabled={isGeneratingCode}
                        >
                          {isGeneratingCode ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="MRP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)*</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={field.value === undefined ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                      placeholder="Enter price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter item description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ItemFormModal;
