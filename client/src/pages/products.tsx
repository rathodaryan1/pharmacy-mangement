import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, MoreHorizontal, Edit, Trash2, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const categories = ["All", "Antibiotics", "Pain Relievers", "Blood Pressure", "Antacids", "Vitamins", "First Aid", "Uncategorized"];

type ProductRow = {
  id: string;
  name: string;
  category: string;
  batchNumber: string;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string;
  status: string;
};

type MedicineMasterItem = {
  id: string;
  name: string;
};

export default function Products() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    batchNumber: "",
    stock: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    expiryDate: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["products", page, search, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (selectedCategory && selectedCategory !== "All") params.set("category", selectedCategory);
      return apiGet<{ items: ProductRow[]; total: number; totalPages: number }>(`/api/products?${params}`);
    },
  });

  const { data: categoryMeta } = useQuery({
    queryKey: ["products", "category-meta"],
    queryFn: () => apiGet<{ counts: Record<string, number> }>("/api/products/meta/categories"),
  });

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ["/api/dashboard/kpis"],
    queryFn: () => apiGet<{ products: { title: string; value: string; trend: string; isPositive: boolean }[] }>("/api/dashboard/kpis"),
  });

  const { data: medicineMasterSearchData, isFetching: medicineMasterSearching } = useQuery({
    queryKey: ["medicine-master", "products-search", search],
    queryFn: () => apiGet<MedicineMasterItem[]>(`/api/medicine-master/search?q=${encodeURIComponent(search.trim())}`),
    enabled: search.trim().length >= 2,
    staleTime: 60_000,
  });

  const { data: medicineMasterAddData, isFetching: medicineMasterAddLoading } = useQuery({
    queryKey: ["medicine-master", "products-add", form.name, addOpen],
    queryFn: () => apiGet<MedicineMasterItem[]>(`/api/medicine-master/search?q=${encodeURIComponent(form.name.trim())}`),
    enabled: addOpen && form.name.trim().length >= 2,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost<ProductRow>("/api/products", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kpis"] });
      setAddOpen(false);
      resetForm();
      toast({ title: "Product added" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => apiPut<ProductRow>(`/api/products/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kpis"] });
      setEditingId(null);
      resetForm();
      toast({ title: "Product updated" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kpis"] });
      toast({ title: "Product deleted" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function resetForm() {
    setForm({ name: "", batchNumber: "", stock: 0, purchasePrice: 0, sellingPrice: 0, expiryDate: "" });
  }

  const productsList = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const totalPages = listData?.totalPages ?? 1;
  const kpis = kpiData?.products ?? [
    { title: "Total Products", value: "0", trend: "+0", isPositive: true },
    { title: "Low Stock Items", value: "0", trend: "0", isPositive: true },
    { title: "Out of Stock", value: "0", trend: "0", isPositive: true },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your medicines and products.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="rounded-xl flex-1 sm:flex-none shadow-sm border-border/50" onClick={() => toast({ title: "Export", description: "Export uses Reports -> CSV/PDF" })}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/25 flex-1 sm:flex-none" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiLoading ? (
          kpis.map((_, idx) => (
            <Card key={idx} className="card-container hover-elevate">
              <CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          ))
        ) : (
          kpis.map((kpi, idx) => (
            <Card key={idx} className="card-container hover-elevate">
              <CardContent className="p-0 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">{kpi.title}</p>
                  <h3 className="text-3xl font-bold text-foreground">{kpi.value}</h3>
                </div>
                <div className={`p-4 rounded-2xl ${kpi.title === "Out of Stock" ? "bg-red-50 text-red-500" : kpi.title === "Low Stock Items" ? "bg-amber-50 text-amber-500" : "bg-primary/10 text-primary"}`}>
                  <Package className="w-8 h-8" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat, i) => (
            <button
              type="button"
              key={i}
              className={`bg-card border rounded-2xl p-4 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all group ${
                selectedCategory === cat ? "border-primary shadow-md" : "border-border/50"
              }`}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
            >
              <div className="w-12 h-12 mx-auto bg-secondary group-hover:bg-primary/10 rounded-full flex items-center justify-center mb-3 transition-colors">
                <Package className="w-5 h-5 text-sidebar-background group-hover:text-primary" />
              </div>
              <p className="font-medium text-sm text-foreground">{cat}</p>
              <p className="text-xs text-muted-foreground mt-1">{categoryMeta?.counts?.[cat] ?? 0} items</p>
            </button>
          ))}
        </div>
      </div>

      <Card className="card-container p-0 overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or ID..."
              className="pl-10 bg-background border-border/50 rounded-xl focus-visible:ring-primary"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Button
            variant="outline"
            className="rounded-xl text-muted-foreground border-border/50"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
              setPage(1);
            }}
          >
            <Filter className="w-4 h-4 mr-2" /> Reset Filters
          </Button>
        </div>

        {search.trim().length >= 2 && (
          <div className="px-6 py-3 border-b border-border/50 bg-muted/20">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Medicine Master Suggestions {medicineMasterSearching ? "(loading...)" : ""}
            </div>
            <div className="flex flex-wrap gap-2">
              {(medicineMasterSearchData ?? []).slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background hover:border-primary hover:text-primary"
                  title={item.name}
                  onClick={() => {
                    setSearch(item.name);
                    setPage(1);
                  }}
                >
                  {item.name}
                </button>
              ))}
              {!medicineMasterSearching && (medicineMasterSearchData?.length ?? 0) === 0 && (
                <span className="text-xs text-muted-foreground">No medicine match</span>
              )}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background">
              <tr>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Batch</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Expiry Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-white">
              {listLoading ? (
                <tr><td colSpan={8} className="px-6 py-8"><Skeleton className="h-8 w-full" /></td></tr>
              ) : (
                productsList.map((product: ProductRow) => (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.id}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{product.category}</td>
                    <td className="px-6 py-4 text-muted-foreground">{product.batchNumber}</td>
                    <td className="px-6 py-4 font-medium">Rs {Number(product.sellingPrice).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{product.stock}</span> pcs
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{product.expiryDate}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`
                        border-0 capitalize
                        ${product.status === "in stock" ? "bg-emerald-100 text-emerald-700" : ""}
                        ${product.status === "low stock" ? "bg-amber-100 text-amber-700" : ""}
                        ${product.status === "out of stock" ? "bg-red-100 text-red-700" : ""}
                      `}>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 hover:bg-secondary">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-border/50">
                          <DropdownMenuItem className="cursor-pointer rounded-md" onClick={() => { setEditingId(product.id); setForm({ name: product.name, batchNumber: product.batchNumber, stock: product.stock, purchasePrice: product.purchasePrice, sellingPrice: product.sellingPrice, expiryDate: product.expiryDate }); }}>
                            <Edit className="w-4 h-4 mr-2"/> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer rounded-md text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => deleteMutation.mutate(product.id)}>
                            <Trash2 className="w-4 h-4 mr-2"/> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} entries</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} className="rounded-lg" onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" className="rounded-lg border-primary text-primary bg-primary/5">{page}</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} className="rounded-lg" onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Product name" />
                {form.name.trim().length >= 2 && (
                  <div className="rounded-lg border border-border p-2 bg-muted/20">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Medicine Master matches {medicineMasterAddLoading ? "(loading...)" : ""}
                    </div>
                    <div className="space-y-1 max-h-32 overflow-auto">
                      {(medicineMasterAddData ?? []).slice(0, 10).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-background border border-transparent hover:border-primary/40"
                          title={item.name}
                          onClick={() => setForm((f) => ({ ...f, name: item.name }))}
                        >
                          {item.name}
                        </button>
                      ))}
                      {!medicineMasterAddLoading && (medicineMasterAddData?.length ?? 0) === 0 && (
                        <div className="text-xs text-muted-foreground px-2 py-1">No medicine match</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Batch number</Label>
                <Input value={form.batchNumber} onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))} placeholder="Batch" />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" min={0} value={form.stock || ""} onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Expiry date (YYYY-MM-DD)</Label>
                <Input value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} placeholder="2025-12-31" />
              </div>
              <div className="space-y-2">
                <Label>Purchase price</Label>
                <Input type="number" min={0} step={0.01} value={form.purchasePrice || ""} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Selling price</Label>
                <Input type="number" min={0} step={0.01} value={form.sellingPrice || ""} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, expiryDate: form.expiryDate || new Date().toISOString().slice(0, 10) })} disabled={!form.name || !form.batchNumber || createMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Batch number</Label>
                <Input value={form.batchNumber} onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" min={0} value={form.stock || ""} onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Expiry date</Label>
                <Input value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Purchase price</Label>
                <Input type="number" min={0} step={0.01} value={form.purchasePrice || ""} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Selling price</Label>
                <Input type="number" min={0} step={0.01} value={form.sellingPrice || ""} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={() => editingId && updateMutation.mutate({ id: editingId, body: form })} disabled={updateMutation.isPending}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
