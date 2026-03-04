import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="mt-1 text-muted-foreground">Manage your customer database and loyalty.</p>
        </div>
        <Button
          className="rounded-xl border border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          onClick={() => setAddOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="card-container relative overflow-hidden border-none bg-gradient-to-br from-sidebar-background to-emerald-800 text-white">
          <div className="absolute -mr-10 -mt-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          <CardContent className="relative z-10 p-2">
            <p className="mb-1 text-sm font-medium text-white/80">Total Customers</p>
            <h3 className="text-4xl font-bold">{total}</h3>
            <p className="mt-2 text-xs text-white/60">From database</p>
          </CardContent>
        </Card>
        <Card className="card-container hover-elevate border-none">
          <CardContent className="p-2">
            <p className="mb-1 text-sm font-medium text-muted-foreground">Active Customers</p>
            <h3 className="text-3xl font-bold text-foreground">{total}</h3>
            <p className="mt-2 text-xs font-medium text-emerald-500">With orders</p>
          </CardContent>
        </Card>
        <Card className="card-container hover-elevate border-none">
          <CardContent className="p-2">
            <p className="mb-1 text-sm font-medium text-muted-foreground">Customer Retention</p>
            <h3 className="text-3xl font-bold text-foreground">--</h3>
            <p className="mt-2 text-xs font-medium text-emerald-500">--</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-container overflow-hidden border-none p-0">
        <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 p-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="rounded-xl border-border/50 bg-background pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="font-medium">Customer Details</TableHead>
              <TableHead className="font-medium">Contact</TableHead>
              <TableHead className="font-medium">Total Orders</TableHead>
              <TableHead className="font-medium">Total Spend</TableHead>
              <TableHead className="font-medium">Last Order</TableHead>
              <TableHead className="text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8"><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ) : (
              customersList.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 font-bold text-primary">
                          {customer.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-base font-semibold text-foreground">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> {customer.email}</div>
                    <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone || "--"}</div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <span className="rounded-full bg-secondary px-3 py-1">{customer.ordersPlaced}</span>
                  </TableCell>
                  <TableCell className="font-bold text-primary">Rs {customer.totalSpend?.toFixed(2) ?? "0.00"}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.lastOrderDate || "--"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
