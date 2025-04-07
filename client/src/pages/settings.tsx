import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Download, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { useStorage } from '@/context/storage-context';
import { useStorageHook } from '@/hooks/use-storage';
import { useLocalDb } from '@/lib/db';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// WebDAV form schema
const webdavSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  username: z.string().optional(),
  password: z.string().optional(),
});

type WebDAVFormValues = z.infer<typeof webdavSchema>;

// Font preferences schema
const fontPreferencesSchema = z.object({
  fontFamily: z.enum(['Inter', 'Merriweather', 'JetBrains Mono']),
  fontSize: z.enum(['small', 'medium', 'large']),
});

type FontPreferencesValues = z.infer<typeof fontPreferencesSchema>;

export default function Settings() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user, logout } = useAuth();
  const { storageType, webdavConfig } = useStorage();
  const { setStorageType, configureWebdav } = useStorageHook();
  const localDb = useLocalDb();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // WebDAV form
  const webdavForm = useForm<WebDAVFormValues>({
    resolver: zodResolver(webdavSchema),
    defaultValues: {
      url: webdavConfig?.url || '',
      username: webdavConfig?.username || '',
      password: webdavConfig?.password || '',
    },
  });
  
  // Font preferences form
  const fontPreferencesForm = useForm<FontPreferencesValues>({
    resolver: zodResolver(fontPreferencesSchema),
    defaultValues: {
      fontFamily: 'Inter',
      fontSize: 'medium',
    },
  });

  // Handle WebDAV form submission
  const onWebDAVSubmit = async (data: WebDAVFormValues) => {
    setIsConfiguring(true);
    try {
      const success = await configureWebdav(data.url, data.username, data.password);
      if (success) {
        toast({
          title: 'WebDAV Configured',
          description: 'Your WebDAV settings have been saved successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to configure WebDAV',
        variant: 'destructive',
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  // Handle font preferences form submission
  const onFontPreferencesSubmit = (data: FontPreferencesValues) => {
    // In a real application, you would save these preferences to user settings
    toast({
      title: 'Preferences Saved',
      description: 'Your font preferences have been updated',
    });
  };

  // Handle storage type change
  const handleStorageTypeChange = async (type: 'local' | 'supabase' | 'webdav') => {
    try {
      await setStorageType(type);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change storage type',
        variant: 'destructive',
      });
    }
  };

  // Export all data
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await localDb.exportData();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'notecraft_export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: 'Export Successful',
        description: 'Your data has been exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Import data
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      await localDb.importData(data);
      
      toast({
        title: 'Import Successful',
        description: 'Your data has been imported successfully',
      });
      
      // Reset the file input
      event.target.value = '';
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import data',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-light">
      <div className="container max-w-4xl py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setLocation('/')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Notes
          </Button>
          
          {isAuthenticated && (
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Settings</CardTitle>
            <CardDescription>
              Manage your account and application preferences
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="storage">Storage</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Appearance</h3>
                  
                  <Form {...fontPreferencesForm}>
                    <form onSubmit={fontPreferencesForm.handleSubmit(onFontPreferencesSubmit)} className="space-y-4">
                      <FormField
                        control={fontPreferencesForm.control}
                        name="fontFamily"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Font</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Inter">Inter (Sans-serif)</SelectItem>
                                <SelectItem value="Merriweather">Merriweather (Serif)</SelectItem>
                                <SelectItem value="JetBrains Mono">JetBrains Mono (Monospace)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This will be the default font for new notes
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={fontPreferencesForm.control}
                        name="fontSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Size</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="small" />
                                  </FormControl>
                                  <FormLabel className="text-sm">Small</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="medium" />
                                  </FormControl>
                                  <FormLabel className="text-md">Medium</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="large" />
                                  </FormControl>
                                  <FormLabel className="text-lg">Large</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit">Save Preferences</Button>
                    </form>
                  </Form>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Data Management</h3>
                  
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label>Export All Data</Label>
                        <p className="text-sm text-gray-500">Download all your notes and settings</p>
                      </div>
                      <Button 
                        onClick={handleExportData} 
                        disabled={isExporting}
                        variant="outline"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {isExporting ? 'Exporting...' : 'Export'}
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Label>Import Data</Label>
                        <p className="text-sm text-gray-500">Restore from a backup file</p>
                      </div>
                      <div className="flex items-center">
                        <Input
                          id="import-file"
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                          disabled={isImporting}
                        />
                        <Button 
                          onClick={() => document.getElementById('import-file')?.click()} 
                          disabled={isImporting}
                          variant="outline"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {isImporting ? 'Importing...' : 'Import'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="storage" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Storage Options</h3>
                  
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label>Local Storage</Label>
                        <p className="text-sm text-gray-500">Store notes on this device only</p>
                      </div>
                      <Switch 
                        checked={storageType === 'local'} 
                        onCheckedChange={() => handleStorageTypeChange('local')}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Label>Supabase Cloud</Label>
                        <p className="text-sm text-gray-500">Store notes in the cloud (requires account)</p>
                      </div>
                      <Switch 
                        checked={storageType === 'supabase'} 
                        onCheckedChange={() => handleStorageTypeChange('supabase')}
                        disabled={!isAuthenticated}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Label>WebDAV</Label>
                        <p className="text-sm text-gray-500">Connect to your own WebDAV server</p>
                      </div>
                      <Switch 
                        checked={storageType === 'webdav'} 
                        onCheckedChange={() => handleStorageTypeChange('webdav')}
                        disabled={!webdavConfig}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">WebDAV Configuration</h3>
                  
                  <Form {...webdavForm}>
                    <form onSubmit={webdavForm.handleSubmit(onWebDAVSubmit)} className="space-y-4">
                      <FormField
                        control={webdavForm.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WebDAV URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/webdav/" {...field} />
                            </FormControl>
                            <FormDescription>
                              The full URL to your WebDAV server
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={webdavForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Username" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={webdavForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password (Optional)</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Password" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isConfiguring}>
                        {isConfiguring ? 'Testing Connection...' : 'Save WebDAV Settings'}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
              
              <TabsContent value="account" className="space-y-6">
                {isAuthenticated ? (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Account Information</h3>
                    
                    <div className="grid gap-4">
                      <div>
                        <Label>Username</Label>
                        <p className="text-gray-700">{user?.username}</p>
                      </div>
                      
                      <div>
                        <Label>Email</Label>
                        <p className="text-gray-700">{user?.email}</p>
                      </div>
                      
                      <div className="pt-4">
                        <Button variant="destructive">Delete Account</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Alert>
                      <AlertTitle>Not signed in</AlertTitle>
                      <AlertDescription>
                        You need to sign in to access account settings.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="mt-4">
                      <Button onClick={() => setLocation('/login')}>Sign In</Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setLocation('/')}>Cancel</Button>
            <Button onClick={() => setLocation('/')}>Done</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
