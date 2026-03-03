import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, CreditCard, Activity } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type ChartPoint = { name: string; total: number; profit: number };
type Summary = { totalRevenue: number; totalOrders: number; byMonth: ChartPoint[] };

export default function Sales() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["reports", "sales-summary", year],
    queryFn: async () => {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      return apiGet<Summary>(`/api/reports/sales-summary?start=${start}&end=${end}`);
    },
  });

  const chartData = summary?.byMonth ?? [];
  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const profitEstimate = totalRevenue * 0.3;

  const metrics = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Profit", value: `₹${profitEstimate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/20" },
    { title: "Avg. Order Value", value: `₹${avgOrderValue.toFixed(2)}`, icon: CreditCard, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Conversion Rate", value: "—", icon: Activity, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  const token = typeof window !== "undefined" ? localStorage.getItem("pharmacy_token") : null;
  const handleExport = async (type: "csv" | "pdf") => {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const url = `/api/reports/sales-summary/${type}?start=${start}&end=${end}`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `sales-${start}-${end}.${type}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast({ title: "Export", description: `${type.toUpperCase()} downloaded.` });
    } catch {
      toast({ title: "Error", description: "Could not download", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sales Dashboard</h1>
        <p className="text-muted-foreground mt-1">Detailed analysis of your revenue streams.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryLoading ? (
          metrics.map((_, i) => (
            <Card key={i} className="card-container hover-elevate border-none bg-white">
              <CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          ))
        ) : (
          metrics.map((m, i) => (
            <Card key={i} className="card-container hover-elevate border-none bg-white">
              <CardContent className="p-0 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${m.bg} ${m.color}`}>
                  <m.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{m.title}</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{m.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="card-container p-0 mb-8 border-none bg-white">
        <CardHeader className="border-b border-border/50 px-6 py-5">
          <CardTitle className="text-xl flex justify-between items-center">
            Revenue Overview
            <select
              className="text-sm font-normal bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
            >
              <option value={new Date().getFullYear()}>This Year</option>
              <option value={new Date().getFullYear() - 1}>Last Year</option>
            </select>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 h-[400px]">
          {summaryLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--sidebar-background))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--sidebar-background))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--sidebar-background))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="card-container border-none bg-white">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-border/50">
            <CardTitle className="text-lg">Orders Heatmap (Simulated)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-6">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => {
                const intensity = Math.random();
                return (
                  <div
                    key={i}
                    className="h-10 rounded-md transition-all hover:scale-105 cursor-pointer"
                    style={{
                      backgroundColor: `rgba(132, 204, 22, ${0.1 + intensity * 0.9})`,
                      opacity: intensity < 0.2 ? 0.3 : 1,
                    }}
                    title={`Orders: ${Math.floor(intensity * 50)}`}
                  ></div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-4">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-container border-none bg-white">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-border/50">
            <CardTitle className="text-lg">Export Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-6 space-y-5">
            <Button className="w-full rounded-xl" onClick={() => handleExport("csv")}>Download CSV</Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => handleExport("pdf")}>Download PDF</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
