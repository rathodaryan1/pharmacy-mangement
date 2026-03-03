import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Mail, Phone, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiGet, apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersPlaced: number;
  totalSpend: number;
  lastOrderDate: string;
};

export default function Customers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: listData, isLoading } = useQuery({
    queryKey: ["customers", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      return apiGet<{ items: CustomerRow[]; total: number }>(`/api/customers?${params}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: { name: string; email: string; phone?: string }) => apiPost<CustomerRow>("/api/customers", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setAddOpen(false);
      setForm({ name: "", email: "", phone: "" });
      toast({ title: "Customer added" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const customersList = listData?.items ?? [];
  const total = listData?.total ?? 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database and loyalty.</p>
        </div>
        <Button className="bg-sidebar-background hover:bg-sidebar-background/90 text-white rounded-xl shadow-lg" onClick={() => setAddOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-container bg-gradient-to-br from-sidebar-background to-emerald-800 text-white border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <CardContent className="p-2 relative z-10">
            <p className="text-white/80 text-sm font-medium mb-1">Total Customers</p>
            <h3 className="text-4xl font-bold">{total}</h3>
            <p className="text-white/60 text-xs mt-2">From database</p>
          </CardContent>
        </Card>
        <Card className="card-container hover-elevate border-none">
          <CardContent className="p-2">
            <p className="text-muted-foreground text-sm font-medium mb-1">Active Customers</p>
            <h3 className="text-3xl font-bold text-foreground">{total}</h3>
            <p className="text-emerald-500 text-xs font-medium mt-2">With orders</p>
          </CardContent>
        </Card>
        <Card className="card-container hover-elevate border-none">
          <CardContent className="p-2">
            <p className="text-muted-foreground text-sm font-medium mb-1">Customer Retention</p>
            <h3 className="text-3xl font-bold text-foreground">—</h3>
            <p className="text-emerald-500 text-xs font-medium mt-2">—</p>
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8"><Skeleton className="h-8 w-full" /></td></tr>
              ) : (
                customersList.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {customer.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-foreground text-base">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1 mb-1"><Mail className="w-3 h-3"/> {customer.email}</div>
                      <div className="flex items-center gap-1"><Phone className="w-3 h-3"/> {customer.phone || "—"}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-center">
                      <span className="bg-secondary px-3 py-1 rounded-full">{customer.ordersPlaced}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">₹{customer.totalSpend?.toFixed(2) ?? "0.00"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{customer.lastOrderDate || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 hover:bg-secondary text-muted-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 ..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.email || createMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

