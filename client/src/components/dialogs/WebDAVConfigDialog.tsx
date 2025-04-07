import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useStorage } from "@/lib/hooks/useStorage";
import { WebDAVConfig, webdavConfigSchema } from "@shared/schema";

interface WebDAVConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type WebDAVFormValues = z.infer<typeof webdavConfigSchema>;

const WebDAVConfigDialog = ({ open, onOpenChange }: WebDAVConfigDialogProps) => {
  const { toast } = useToast();
  const { updateWebDAVConfig, webdavConfig } = useStorage();
  
  const form = useForm<WebDAVFormValues>({
    resolver: zodResolver(webdavConfigSchema),
    defaultValues: {
      endpoint: webdavConfig?.endpoint || "",
      username: webdavConfig?.username || "",
      password: webdavConfig?.password || "",
      enabled: webdavConfig?.enabled || false,
    },
  });
  
  const onSubmit = async (data: WebDAVFormValues) => {
    try {
      await updateWebDAVConfig(data);
      onOpenChange(false);
      toast({
        title: "WebDAV configuration updated",
        description: data.enabled 
          ? "Your notes will now sync with WebDAV" 
          : "WebDAV synchronization is disabled",
      });
    } catch (error) {
      toast({
        title: "Failed to update WebDAV configuration",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>WebDAV Configuration</DialogTitle>
          <DialogDescription>
            Configure a WebDAV endpoint to sync your notes across devices
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WebDAV Endpoint URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://webdav.example.com/remote.php/dav/files/username/" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="webdav_username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password (optional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Enable WebDAV Sync</FormLabel>
                    <FormDescription>
                      Automatically sync your notes with this WebDAV server
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button type="submit">Save Configuration</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WebDAVConfigDialog;
