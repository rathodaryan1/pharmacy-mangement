import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Mail, Phone, MoreHorizontal } from "lucide-react";
import { customersList } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Customers() {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database and loyalty.</p>
        </div>
        <Button className="bg-sidebar-background hover:bg-sidebar-background/90 text-white rounded-xl shadow-lg">
          <UserPlus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-container bg-gradient-to-br from-sidebar-background to-emerald-800 text-white border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <CardContent className="p-2 relative z-10">
            <p className="text-white/80 text-sm font-medium mb-1">Total Customers</p>
            <h3 className="text-4xl font-bold">2,405</h3>
            <p className="text-white/60 text-xs mt-2">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="card-container hover-elevate border-none">
          <CardContent className="p-2">
            <p className="text-muted-foreground text-sm font-medium mb-1">Active Customers</p>
            <h3 className="text-3xl font-bold text-foreground">1,842</h3>
            <p className="text-emerald-500 text-xs font-medium mt-2">+5.2% from last month</p>
          </CardContent>
        </Card>
        <Card className="card-container hover-elevate border-none">
          <CardContent className="p-2">
            <p className="text-muted-foreground text-sm font-medium mb-1">Customer Retention</p>
            <h3 className="text-3xl font-bold text-foreground">78.5%</h3>
            <p className="text-emerald-500 text-xs font-medium mt-2">+1.2% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-container p-0 overflow-hidden border-none">
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-white/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers..." 
              className="pl-10 bg-background border-border/50 rounded-xl"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background">
              <tr>
                <th className="px-6 py-4 font-medium">Customer Details</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Total Orders</th>
                <th className="px-6 py-4 font-medium">Total Spend</th>
                <th className="px-6 py-4 font-medium">Last Order</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-white">
              {customersList.map((customer) => (
                <tr key={customer.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground text-base">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1"><Mail className="w-3 h-3"/> {customer.email}</div>
                    <div className="flex items-center gap-1"><Phone className="w-3 h-3"/> {customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-center">
                    <span className="bg-secondary px-3 py-1 rounded-full">{customer.ordersPlaced}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">${customer.totalSpend.toFixed(2)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{customer.lastOrderDate}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 hover:bg-secondary text-muted-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
