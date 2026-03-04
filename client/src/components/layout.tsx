import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Users, CreditCard, Settings, LogOut, Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Sales", href: "/sales", icon: TrendingUp },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Custom CSS properties to style the Sidebar component without passing className directly to it
  const sidebarStyle = {
    "--sidebar-background": "160 84% 16%", // Deep Emerald
    "--sidebar-foreground": "0 0% 100%",
    "--sidebar-border": "160 84% 12%",
    "--sidebar-accent": "160 84% 20%",
    "--sidebar-accent-foreground": "0 0% 100%",
    "--sidebar-primary": "84 81% 44%", // Lime green
    "--sidebar-primary-foreground": "0 0% 100%",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r-0 shadow-xl z-20">
          <SidebarContent className="flex flex-col h-full bg-[hsl(var(--sidebar-background))] text-sidebar-foreground">
            
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-primary-foreground font-bold text-xl">+</span>
              </div>
              <span className="font-bold text-xl tracking-tight">PharmaPro</span>
            </div>

            <SidebarGroup className="flex-1 px-4">
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {navigation.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className={`
                            h-12 px-4 rounded-xl transition-all duration-200
                            ${isActive 
                              ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20' 
                              : 'hover:bg-white/10 text-sidebar-foreground/80 hover:text-white'}
                          `}
                        >
                          <Link href={item.href} className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="p-4">
              <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-12" onClick={logout}>
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
            
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 w-full min-w-0">
          <header className="h-16 sm:h-20 bg-background/90 backdrop-blur-md sticky top-0 z-10 border-b border-border/60 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-4">
              <SidebarTrigger className="bg-card shadow-sm border border-border rounded-xl hover:bg-muted" />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search anything..." 
                  className="pl-10 w-40 sm:w-72 lg:w-80 bg-card border-border rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary soft-shadow"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Button size="icon" variant="ghost" className="rounded-full bg-card shadow-sm border border-border relative hover:bg-muted">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>
              <div className="hidden sm:block h-10 w-px bg-border/50 mx-2"></div>
              <div className="flex items-center gap-2 sm:gap-3 cursor-pointer p-1 pr-2 sm:pr-4 rounded-full bg-card shadow-sm border border-border hover:bg-muted transition-colors">
                <Avatar className="h-9 w-9 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-sm">
                  <p className="font-semibold text-foreground leading-none mb-1">{user?.name ?? "User"}</p>
                  <p className="text-muted-foreground text-xs leading-none">{user?.role ?? "Staff"}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
