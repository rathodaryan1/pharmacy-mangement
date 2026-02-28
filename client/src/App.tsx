import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AppLayout } from "./components/layout";
import Dashboard from "./pages/dashboard";
import Products from "./pages/products";
import Orders from "./pages/orders";
import Sales from "./pages/sales";
import Customers from "./pages/customers";
import Payments from "./pages/payments";
import Settings from "./pages/settings";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard}/>
        <Route path="/products" component={Products}/>
        <Route path="/orders" component={Orders}/>
        <Route path="/sales" component={Sales}/>
        <Route path="/customers" component={Customers}/>
        <Route path="/payments" component={Payments}/>
        <Route path="/settings" component={Settings}/>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
