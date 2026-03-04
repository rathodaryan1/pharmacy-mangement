import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar as CalendarIcon, Eye, Plus, Trash2, FileDown } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type OrderRow = {
  id: string;
  customerName: string;
  orderDate: string;
  products: string[];
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  orderStatus: string;
};

type Kpi = { title: string; value: string; trend: string; isPositive: boolean };
type CustomerOption = { id: string; name: string; email: string; phone?: string | null };
type ProductOption = {
  id: string;
  name: string;
  batchNumber: string;
  stock: number;
  sellingPrice: number;
};

type PaymentMethod = "CASH" | "UPI" | "CARD" | "BANK" | "PENDING";
type CreateOrderItem = { productId: string; quantity: number; query: string };

export default function Orders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [createOpen, setCreateOpen] = useState(false);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [customerSearch, setCustomerSearch] = useState("");
  const [createCustomerId, setCreateCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  const [productLookupQuery, setProductLookupQuery] = useState("");
  const [activeProductRow, setActiveProductRow] = useState<number | null>(null);
  const [productCatalog, setProductCatalog] = useState<Record<string, ProductOption>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PENDING");
  const [createItems, setCreateItems] = useState<CreateOrderItem[]>([{ productId: "", quantity: 1, query: "" }]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => apiGet<{ orders: Kpi[] }>("/api/dashboard/kpis"),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "All") params.set("status", statusFilter);
      return apiGet<{ items: OrderRow[]; total: number; totalPages: number }>(`/api/orders?${params}`);
    },
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers-options", customerSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (customerSearch.trim()) params.set("search", customerSearch.trim());
      return apiGet<{ items: CustomerOption[] }>(`/api/customers/options${params.toString() ? `?${params}` : ""}`);
    },
    enabled: createOpen && customerMode === "existing",
  });

  const { data: productsData, isFetching: productsLoading } = useQuery({
    queryKey: ["products-create-search", productLookupQuery],
    queryFn: () => apiGet<ProductOption[]>(`/api/products/search?q=${encodeURIComponent(productLookupQuery.trim())}`),
    enabled: createOpen && productLookupQuery.trim().length >= 2,
  });

  // Cache searched products locally so selected items remain resolvable after search text changes.
  useEffect(() => {
    if (!productsData?.length) return;
    setProductCatalog((prev) => {
      const next = { ...prev };
      for (const product of productsData) next[product.id] = product;
      return next;
    });
  }, [productsData]);

  const searchedProducts = productsData ?? [];
  const productsById = useMemo(
    () => new Map(Object.values(productCatalog).map((product) => [product.id, product])),
    [productCatalog]
  );

  const detailedItems = useMemo(
    () =>
      createItems.map((it) => {
        const product = productsById.get(it.productId);
        const unitPrice = product?.sellingPrice ?? 0;
        const subtotal = unitPrice * it.quantity;
        return { ...it, product, unitPrice, subtotal };
      }),
    [createItems, productsById]
  );

  const totalAmount = detailedItems.reduce((sum, it) => sum + it.subtotal, 0);

  const getOptionsForRow = (rowQuery: string, selectedProductId: string) => {
    const q = rowQuery.trim().toLowerCase();
    const fromCatalog = Object.values(productCatalog).filter((product) => {
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.batchNumber.toLowerCase().includes(q)
      );
    });

    const selectedProduct = productsById.get(selectedProductId);
    const merged = [...fromCatalog, ...searchedProducts];
    const deduped = Array.from(new Map(merged.map((p) => [p.id, p])).values());

    if (!selectedProduct) return deduped.slice(0, 10);
    if (deduped.some((p) => p.id === selectedProduct.id)) return deduped.slice(0, 10);
    return [selectedProduct, ...deduped].slice(0, 10);
  };

  const resetCreateOrderForm = () => {
    setCustomerMode("existing");
    setCustomerSearch("");
    setCreateCustomerId("");
    setShowCustomerSuggestions(false);
    setNewCustomer({ name: "", email: "", phone: "" });
    setProductLookupQuery("");
    setActiveProductRow(null);
    setProductCatalog({});
    setPaymentMethod("PENDING");
    setCreateItems([{ productId: "", quantity: 1, query: "" }]);
  };

  const closeCreateDialog = () => {
    setCreateOpen(false);
    resetCreateOrderForm();
  };

  const createOrderMutation = useMutation({
    mutationFn: (body: {
      customerId?: string;
      customer?: { name: string; email: string; phone?: string };
      paymentMethod: PaymentMethod;
      items: Array<{ productId: string; quantity: number }>;
    }) => apiPost("/api/orders", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });

      closeCreateDialog();

      toast({ title: "Order created successfully" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const kpis = kpiData?.orders ?? [];
  const ordersList = ordersData?.items ?? [];
  const totalPages = ordersData?.totalPages ?? 1;

  const downloadInvoice = async (orderId: string) => {
    const token = localStorage.getItem("pharmacy_token");
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Invoice download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Invoice downloaded", description: `Invoice for order ${orderId} is ready.` });
    } catch {
      toast({ title: "Error", description: "Could not download invoice", variant: "destructive" });
    }
  };

  const submitCreateOrder = () => {
    const validItems = createItems
      .filter((i) => i.productId && i.quantity > 0)
      .map((i) => ({ productId: i.productId, quantity: i.quantity }));

    if (validItems.length === 0) {
      toast({ title: "Error", description: "Add at least one valid product item", variant: "destructive" });
      return;
    }

    for (const item of validItems) {
      const product = productsById.get(item.productId);
      if (!product) {
        toast({ title: "Error", description: "Some selected products are invalid", variant: "destructive" });
        return;
      }
      if (item.quantity > product.stock) {
        toast({
          title: "Error",
          description: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          variant: "destructive",
        });
        return;
      }
    }

    if (customerMode === "existing") {
      if (!createCustomerId) {
        toast({ title: "Error", description: "Select a customer", variant: "destructive" });
        return;
      }
      createOrderMutation.mutate({ customerId: createCustomerId, items: validItems, paymentMethod });
      return;
    }

    if (!newCustomer.name.trim() || !newCustomer.email.trim()) {
      toast({ title: "Error", description: "Enter new customer name and email", variant: "destructive" });
      return;
    }

    createOrderMutation.mutate({
      customer: {
        name: newCustomer.name.trim(),
        email: newCustomer.email.trim(),
        phone: newCustomer.phone.trim() || undefined,
      },
      items: validItems,
      paymentMethod,
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders.</p>
        </div>
        <Button
          className="w-full rounded-xl border border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 sm:w-auto"
          onClick={() => setCreateOpen(true)}
        >
          Create Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="card-container p-5 hover-elevate"><Skeleton className="h-20 w-full" /></Card>
          ))
        ) : (
          kpis.map((kpi, idx) => (
            <Card key={idx} className="card-container p-5 hover-elevate">
              <p className="text-muted-foreground text-sm font-medium mb-2">{kpi.title}</p>
              <h3 className="text-3xl font-bold text-foreground mb-1">{kpi.value}</h3>
              <p className={`text-xs font-medium ${kpi.isPositive ? "text-emerald-600" : "text-red-500"}`}>
                {kpi.trend} from last month
              </p>
            </Card>
          ))
        )}
      </div>

      <Card className="card-container p-0 overflow-hidden">
        <div className="bg-muted/30 p-4 sm:p-6 border-b border-border/50 flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-10 bg-background border-border/50 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="rounded-xl border-border/50 px-3 w-full sm:w-auto">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", "Completed", "Pending", "Cancelled"].map((status) => (
              <Button
                key={status}
                variant={status === statusFilter ? "default" : "outline"}
                className={`rounded-xl whitespace-nowrap ${status === statusFilter ? "bg-sidebar-background text-white shadow-md" : "border-border/50 text-muted-foreground"}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <Table className="min-w-[760px] md:min-w-full">
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="font-medium">Order ID</TableHead>
              <TableHead className="font-medium">Customer</TableHead>
              <TableHead className="hidden font-medium md:table-cell">Date</TableHead>
              <TableHead className="font-medium">Amount</TableHead>
              <TableHead className="hidden font-medium sm:table-cell">Payment</TableHead>
              <TableHead className="font-medium">Order Status</TableHead>
              <TableHead className="text-right font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8">
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : (
              ordersList.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/20">
                  <TableCell className="font-semibold text-sidebar-background">{order.id}</TableCell>
                  <TableCell className="font-medium">{order.customerName}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{order.orderDate}</TableCell>
                  <TableCell className="font-bold text-foreground">Rs {order.totalAmount?.toFixed(2) ?? "0.00"}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className={`
                      border-0
                      ${order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" : ""}
                      ${order.paymentStatus === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200" : ""}
                      ${order.paymentStatus === "FAILED" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200" : ""}
                    `}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      border-0
                      ${order.orderStatus === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" : ""}
                      ${order.orderStatus === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200" : ""}
                      ${order.orderStatus === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200" : ""}
                      ${order.orderStatus === "CANCELLED" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200" : ""}
                    `}>
                      {order.orderStatus?.replace("_", " ") ?? order.orderStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        onClick={() =>
                          apiGet(`/api/orders/${order.id}`).then((o: unknown) =>
                            toast({ title: "Order", description: JSON.stringify((o as { totalAmount?: number })?.totalAmount ?? o) })
                          )
                        }
                      >
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-border/60"
                        onClick={() => downloadInvoice(order.id)}
                      >
                        <FileDown className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Invoice</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateOrderForm();
        }}
      >
        <DialogContent className="rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Order</DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="p-3 border-border/60 bg-muted/20">
                <p className="text-xs text-muted-foreground">Items</p>
                <p className="text-xl font-semibold">{createItems.length}</p>
              </Card>
              <Card className="p-3 border-border/60 bg-muted/20">
                <p className="text-xs text-muted-foreground">Payment Status</p>
                <p className="text-xl font-semibold">{paymentMethod === "PENDING" ? "PENDING" : "PAID"}</p>
              </Card>
              <Card className="p-3 border-border/60 bg-muted/20">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-xl font-semibold">Rs {totalAmount.toFixed(2)}</p>
              </Card>
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <Label className="text-sm font-semibold">Customer</Label>
              <div className="flex gap-2">
                <Button type="button" variant={customerMode === "existing" ? "default" : "outline"} onClick={() => setCustomerMode("existing")}>
                  Existing
                </Button>
                <Button type="button" variant={customerMode === "new" ? "default" : "outline"} onClick={() => setCustomerMode("new")}>
                  New Customer
                </Button>
              </div>

              {customerMode === "existing" ? (
                <div className="grid gap-2 relative">
                  <Input
                    placeholder="Type customer name/email/phone"
                    value={customerSearch}
                    onFocus={() => setShowCustomerSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 120)}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCreateCustomerId("");
                    }}
                  />
                  {showCustomerSuggestions && (
                    <div className="absolute top-full z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-background shadow-md">
                      {(customersData?.items ?? []).length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          {customersLoading ? "Loading customers..." : "No customer found"}
                        </div>
                      ) : (
                        (customersData?.items ?? []).map((c) => (
                          <Button
                            key={c.id}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto w-full justify-start px-3 py-2 text-left hover:bg-muted/50"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCreateCustomerId(c.id);
                              setCustomerSearch(`${c.name} | ${c.email}${c.phone ? ` | ${c.phone}` : ""}`);
                              setShowCustomerSuggestions(false);
                            }}
                          >
                            <div className="text-sm font-medium">{c.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {c.email}
                              {c.phone ? ` | ${c.phone}` : ""}
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  )}
                  {createCustomerId && (
                    <p className="text-xs text-emerald-600">Customer selected</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Customer name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer((v) => ({ ...v, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Customer email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer((v) => ({ ...v, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Customer phone (optional)"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer((v) => ({ ...v, phone: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <Label className="text-sm font-semibold">Products</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start typing medicine name in each row. A dropdown will appear automatically.
                  </p>
                </div>
              </div>

              {createItems.map((item, idx) => {
                const selectedProduct = productsById.get(item.productId);
                const unitPrice = selectedProduct?.sellingPrice ?? 0;
                const subtotal = unitPrice * item.quantity;
                const outOfStock = !!selectedProduct && item.quantity > selectedProduct.stock;
                const rowOptions = getOptionsForRow(item.query, item.productId);
                const showRowSuggestions = activeProductRow === idx && item.query.trim().length >= 2;

                return (
                  <Card key={idx} className="p-3 border-border/60 bg-muted/10">
                    <div className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-12 md:col-span-6 relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="Type medicine name (e.g., azithro)"
                            value={item.query}
                            onFocus={() => setActiveProductRow(idx)}
                            onBlur={() => setTimeout(() => setActiveProductRow((prev) => (prev === idx ? null : prev)), 120)}
                            onChange={(e) => {
                              const query = e.target.value;
                              setCreateItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, query, productId: "" } : it))
                              );
                              setProductLookupQuery(query);
                              setActiveProductRow(idx);
                            }}
                          />
                        </div>
                        {showRowSuggestions && (
                          <div className="absolute top-full z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-background shadow-md">
                            {item.query.trim().length < 2 ? (
                              <div className="px-3 py-2 text-xs text-muted-foreground">Type at least 2 characters</div>
                            ) : productsLoading ? (
                              <div className="px-3 py-2 text-xs text-muted-foreground">Loading products...</div>
                            ) : rowOptions.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-muted-foreground">No matching medicines found</div>
                            ) : (
                              rowOptions.map((p) => (
                                <Button
                                  key={p.id}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto w-full justify-start px-3 py-2 text-left hover:bg-muted/50"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setCreateItems((prev) =>
                                      prev.map((it, i) =>
                                        i === idx
                                          ? { ...it, productId: p.id, query: `${p.name} ${p.batchNumber}` }
                                          : it
                                      )
                                    );
                                    setActiveProductRow(null);
                                  }}
                                >
                                  <div className="text-sm font-medium">{p.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Batch: {p.batchNumber} | Stock: {p.stock} | Rs {p.sellingPrice}
                                  </div>
                                </Button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      <Input
                        className="col-span-4 md:col-span-2"
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value, 10) || 1;
                          setCreateItems((prev) => prev.map((it, i) => (i === idx ? { ...it, quantity } : it)));
                        }}
                      />

                      <div className="col-span-6 md:col-span-3 text-xs text-muted-foreground">
                        <div className="font-semibold text-foreground">Rs {subtotal.toFixed(2)}</div>
                        {selectedProduct && <div>Stock: {selectedProduct.stock}</div>}
                        {outOfStock && <div className="text-red-600">Insufficient stock</div>}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="col-span-2 md:col-span-1"
                        disabled={createItems.length === 1}
                        onClick={() => setCreateItems((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </div>
                  </Card>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-primary/40 text-primary hover:bg-primary/10"
                onClick={() => setCreateItems((prev) => [...prev, { productId: "", quantity: 1, query: "" }])}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Product Row
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 rounded-xl border border-border/60 p-4">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="BANK">Bank</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Payment status will be {paymentMethod === "PENDING" ? "PENDING" : "PAID"}.</p>
              </div>

              <div className="space-y-2 rounded-xl border border-border/60 p-4">
                <Label>Order Summary</Label>
                <div className="text-sm text-muted-foreground">Valid line items: {detailedItems.filter((item) => item.productId).length}</div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2 font-semibold">Rs {totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeCreateDialog}>
              Cancel
            </Button>
            <Button onClick={submitCreateOrder} disabled={createOrderMutation.isPending}>
              {createOrderMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
