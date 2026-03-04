import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Package, ShoppingCart, DollarSign, Users, MoreVertical } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { apiGet } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Kpi = { title: string; value: string; trend: string; isPositive: boolean };
type ChartPoint = { name: string; total: number; profit: number };
type OrderRow = { id: string; customerName: string; orderDate: string; products: string[]; totalAmount: number; orderStatus: string };

const icons = [DollarSign, Users, ShoppingCart, Package];

export default function Dashboard() {
  const { toast } = useToast();

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => apiGet<{ overview: Kpi[] }>("/api/dashboard/kpis"),
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["dashboard", "sales-chart"],
    queryFn: () => apiGet<ChartPoint[]>("/api/dashboard/sales-chart"),
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ["dashboard", "recent-orders"],
    queryFn: () => apiGet<{ items: OrderRow[] }>("/api/dashboard/recent-orders?limit=5"),
  });

  const overview = kpiData?.overview ?? [];
  const salesChartData = chartData ?? [];
  const ordersList = recentData?.items ?? [];

  const handleDownloadReport = async () => {
    const token = localStorage.getItem("pharmacy_token");
    const start = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const end = new Date().toISOString().slice(0, 10);
    try {
      const res = await fetch(`/api/reports/sales-summary/excel?start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${start}-${end}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Report", description: "Excel downloaded." });
    } catch {
      toast({ title: "Error", description: "Could not download report", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Here is the summary of your pharmacy performance.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 sm:px-6 shadow-lg shadow-primary/25 w-full sm:w-auto" onClick={handleDownloadReport}>
          Download Excel Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="card-container hover-elevate"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))
        ) : (
          overview.map((kpi, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <Card key={idx} className="card-container hover-elevate">
                <CardContent className="p-0">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2.5 py-1 ${kpi.isPositive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}
                    >
                      {kpi.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {kpi.trend}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">{kpi.title}</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{kpi.value}</h3>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 card-container">
          <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Sales Analytics</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Revenue vs Profit over time</p>
            </div>
            <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </CardHeader>
          <CardContent className="p-0 h-[300px]">
            {chartLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--sidebar-background))" radius={[4, 4, 0, 0]} maxBarSize={40} name="Revenue" />
                  <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 card-container flex flex-col">
          <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Top Selling</CardTitle>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col gap-4">
            {[
              { name: "Amoxicillin 500mg", sales: 1245, amount: "15.5k", progress: 85 },
              { name: "Ibuprofen 400mg", sales: 980, amount: "8.2k", progress: 65 },
              { name: "Paracetamol", sales: 850, amount: "5.1k", progress: 55 },
              { name: "Cetirizine", sales: 620, amount: "4.8k", progress: 40 },
              { name: "Omeprazole", sales: 410, amount: "3.9k", progress: 25 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="w-full">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="font-bold text-sidebar-background">₹{item.amount}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="card-container overflow-hidden">
        <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Latest Orders</CardTitle>
          <Link href="/orders"><Button variant="outline" className="rounded-xl">View All</Button></Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 rounded-lg">
                <tr>
                  <th className="px-4 py-4 rounded-l-xl font-medium">Order ID</th>
                  <th className="px-4 py-4 font-medium">Customer</th>
                  <th className="px-4 py-4 font-medium">Products</th>
                  <th className="px-4 py-4 font-medium">Total</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 rounded-r-xl font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8"><Skeleton className="h-8 w-full" /></td></tr>
                ) : (
                  ordersList.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-4 font-semibold text-foreground">{order.id}</td>
                      <td className="px-4 py-4">{order.customerName}</td>
                      <td className="px-4 py-4 text-muted-foreground">{order.products?.join(", ") ?? ""}</td>
                      <td className="px-4 py-4 font-semibold">₹{order.totalAmount?.toFixed(2) ?? "0.00"}</td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className={`
                          border-0
                          ${order.orderStatus === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : ""}
                          ${order.orderStatus === "PENDING" ? "bg-amber-100 text-amber-700" : ""}
                          ${order.orderStatus === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : ""}
                          ${order.orderStatus === "CANCELLED" ? "bg-red-100 text-red-700" : ""}
                        `}>
                          {order.orderStatus?.replace("_", " ") ?? order.orderStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`/orders`}><Button variant="ghost" size="sm" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Details</Button></Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
