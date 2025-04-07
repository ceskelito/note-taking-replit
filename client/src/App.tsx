import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Settings from "@/pages/settings";
import { AuthProvider } from "./context/auth-context";
import { StorageProvider } from "./context/storage-context";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StorageProvider>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </StorageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
