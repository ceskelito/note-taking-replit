import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/lib/hooks/useFolders";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  color: z.string().optional(),
});

type CreateFolderFormValues = z.infer<typeof createFolderSchema>;

const CreateFolderDialog = ({ open, onOpenChange }: CreateFolderDialogProps) => {
  const { toast } = useToast();
  const { createFolder } = useFolders();
  
  const form = useForm<CreateFolderFormValues>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: "",
      color: "",
    },
  });
  
  const onSubmit = async (data: CreateFolderFormValues) => {
    try {
      await createFolder({
        name: data.name,
        color: data.color || null,
      });
      
      form.reset();
      onOpenChange(false);
      
      toast({
        title: "Folder created",
        description: `Folder "${data.name}" has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Failed to create folder",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your notes
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Folder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Color</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      className="flex flex-wrap gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="" id="no-color" className="sr-only" />
                        <Label 
                          htmlFor="no-color" 
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100"
                        >
                          {field.value === "" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yellow" id="color-yellow" className="sr-only" />
                        <Label 
                          htmlFor="color-yellow" 
                          className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center cursor-pointer hover:opacity-90"
                        >
                          {field.value === "yellow" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-900" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="blue" id="color-blue" className="sr-only" />
                        <Label 
                          htmlFor="color-blue" 
                          className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center cursor-pointer hover:opacity-90"
                        >
                          {field.value === "blue" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-900" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="green" id="color-green" className="sr-only" />
                        <Label 
                          htmlFor="color-green" 
                          className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center cursor-pointer hover:opacity-90"
                        >
                          {field.value === "green" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-900" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="purple" id="color-purple" className="sr-only" />
                        <Label 
                          htmlFor="color-purple" 
                          className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center cursor-pointer hover:opacity-90"
                        >
                          {field.value === "purple" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-900" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pink" id="color-pink" className="sr-only" />
                        <Label 
                          htmlFor="color-pink" 
                          className="w-8 h-8 rounded-full bg-pink-400 flex items-center justify-center cursor-pointer hover:opacity-90"
                        >
                          {field.value === "pink" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-900" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button type="submit">Create Folder</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;
