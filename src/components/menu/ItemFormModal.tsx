
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
import { Loader2, RefreshCw, Upload, XCircle } from 'lucide-react';
import { MenuItem, generateItemCode, uploadImage } from '@/services/menuService';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define validation schema for the form
const formSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  itemCode: z.string().min(1, "Item code is required"),
  MRP: z.number({
    required_error: "Price is required",
    invalid_type_error: "Price must be a number"
  }).positive("Price must be greater than 0"),
  Category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  Type: z.number(),
  imageUrl: z.string().optional(),
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(item?.imageUrl || null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: item?.itemName || '',
      itemCode: item?.itemCode || '',
      MRP: item?.MRP || undefined,
      Category: item?.Category || '',
      description: item?.description || '',
      Type: item?.Type || 0,
      imageUrl: item?.imageUrl || '',
    },
    mode: "onChange"
  });
  
  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (open && item) {
      form.reset({
        itemName: item.itemName || '',
        itemCode: item.itemCode || '',
        MRP: item.MRP !== undefined ? item.MRP : undefined,
        Category: item.Category || '',
        description: item.description || '',
        Type: item.Type || 0,
        imageUrl: item.imageUrl || '',
      });
      setSelectedCategory(item.Category || '');
      setImagePreview(item.imageUrl || null);
    } else if (open && !item) {
      form.reset({
        itemName: '',
        itemCode: '',
        MRP: undefined,
        Category: '',
        description: '',
        Type: 0,
        imageUrl: '',
      });
      setSelectedCategory('');
      setImagePreview(null);
    }
  }, [open, item, form]);

  const handleCategoryChange = async (value: string) => {
    setSelectedCategory(value);
    form.setValue('Category', value);
    form.trigger('Category');
    
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
        form.trigger('itemCode');
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
      form.trigger('itemCode');
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
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUploadingImage(true);
      const imageUrl = await uploadImage(file);
      
      form.setValue('imageUrl', imageUrl);
      form.trigger('imageUrl');
      setImagePreview(imageUrl);
      
      toast({
        title: "Image uploaded",
        description: "Image has been successfully uploaded",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };
  
  const removeImage = () => {
    form.setValue('imageUrl', '');
    form.trigger('imageUrl');
    setImagePreview(null);
  };

  const handleSubmit = async (data: FormValues) => {
    try {
      // Validate MRP is a proper number and greater than 0
      if (data.MRP === undefined || isNaN(data.MRP) || data.MRP <= 0) {
        toast({
          title: "Invalid price",
          description: "Please enter a valid price greater than 0",
          variant: "destructive",
        });
        return;
      }
      
      // Ensure we have all required fields with proper types
      const itemData: MenuItem = {
        itemName: data.itemName,
        itemCode: data.itemCode,
        MRP: data.MRP, // MRP is now validated properly
        Type: data.Type,
        Category: data.Category,
        description: data.description || '',
        imageUrl: data.imageUrl || ''
      };
      await onSubmit(itemData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-auto pr-4 max-h-[60vh] min-h-[200px]">
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
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={isNaN(field.value) ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                        placeholder="Enter price"
                        required
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

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Image</FormLabel>
                    <div className="space-y-2">
                      {imagePreview ? (
                        <div className="relative aspect-video w-full overflow-hidden bg-muted rounded-md">
                          <img
                            src={imagePreview}
                            alt="Item preview"
                            className="h-full w-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1"
                            onClick={removeImage}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6">
                          <label className="flex flex-col items-center justify-center cursor-pointer">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="mt-2 text-sm text-gray-500">
                              {uploadingImage ? 'Uploading...' : 'Upload image'}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </label>
                        </div>
                      )}
                      <FormControl>
                        <input
                          type="hidden"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>
        
        <DialogFooter className="mt-4 pt-2 border-t flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            disabled={
              isLoading || 
              !form.formState.isValid || 
              uploadingImage || 
              form.getValues('MRP') === undefined || 
              isNaN(form.getValues('MRP')) ||
              form.getValues('MRP') <= 0
            }
            onClick={form.handleSubmit(handleSubmit)}
          >
            {(isLoading || uploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemFormModal;
