import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Users, CreditCard, Settings, LogOut, Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

            {/* Bottom Upgrade Card */}
            <div className="p-4 mt-auto">
              <div className="bg-white/10 rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/40 transition-all duration-500"></div>
                <h4 className="font-semibold text-white mb-1">Upgrade to Pro</h4>
                <p className="text-sm text-white/70 mb-4">Get access to all advanced features and analytics.</p>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 border-0">
                  Upgrade Now
                </Button>
              </div>
            </div>

            <div className="p-4">
              <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-12">
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
            
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 w-full min-w-0">
          <header className="h-20 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/50 flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="bg-white shadow-sm border border-border/50 rounded-xl hover:bg-gray-50" />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search anything..." 
                  className="pl-10 w-80 bg-white border-border/50 rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary soft-shadow"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button size="icon" variant="ghost" className="rounded-full bg-white shadow-sm border border-border/50 relative hover:bg-gray-50">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>
              <div className="h-10 w-px bg-border/50 mx-2"></div>
              <div className="flex items-center gap-3 cursor-pointer p-1 pr-4 rounded-full bg-white shadow-sm border border-border/50 hover:bg-gray-50 transition-colors">
                <Avatar className="h-9 w-9 border border-primary/20">
                  <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-sm">
                  <p className="font-semibold text-foreground leading-none mb-1">Dr. Smith</p>
                  <p className="text-muted-foreground text-xs leading-none">Admin</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
