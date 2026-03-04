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
    {
      title: "Total Revenue",
      value: `Rs ${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-300",
      bg: "bg-emerald-100 dark:bg-emerald-500/20",
    },
    {
      title: "Total Profit",
      value: `Rs ${profitEstimate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/20 dark:bg-primary/25",
    },
    {
      title: "Avg. Order Value",
      value: `Rs ${avgOrderValue.toFixed(2)}`,
      icon: CreditCard,
      color: "text-blue-600 dark:text-blue-300",
      bg: "bg-blue-100 dark:bg-blue-500/20",
    },
    {
      title: "Conversion Rate",
      value: "--",
      icon: Activity,
      color: "text-purple-600 dark:text-purple-300",
      bg: "bg-purple-100 dark:bg-purple-500/20",
    },
  ];

  const token = typeof window !== "undefined" ? localStorage.getItem("pharmacy_token") : null;
  const handleExport = async (type: "excel" | "pdf") => {
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
      a.download = `sales-${start}-${end}.${type === "excel" ? "xls" : "pdf"}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast({ title: "Export", description: `${type === "excel" ? "Excel" : "PDF"} downloaded.` });
    } catch {
      toast({ title: "Error", description: "Could not download", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sales Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Detailed analysis of your revenue streams.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          metrics.map((_, i) => (
            <Card key={i} className="card-container hover-elevate">
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((m, i) => (
            <Card key={i} className="card-container hover-elevate">
              <CardContent className="flex items-center gap-4 p-0">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${m.bg} ${m.color}`}>
                  <m.icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{m.title}</p>
                  <h3 className="mt-1 text-2xl font-bold text-foreground">{m.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="card-container mb-8 p-0">
        <CardHeader className="border-b border-border/50 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl">Revenue Overview</CardTitle>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
            >
              <option value={new Date().getFullYear()}>This Year</option>
              <option value={new Date().getFullYear() - 1}>Last Year</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="h-[320px] p-4 sm:h-[400px] sm:p-6">
          {summaryLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--sidebar-background))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--sidebar-background))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.18)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--sidebar-background))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="card-container">
          <CardHeader className="border-b border-border/50 px-0 pb-4 pt-0">
            <CardTitle className="text-lg">Orders Heatmap (Simulated)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-6">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => {
                const intensity = Math.random();
                return (
                  <div
                    key={i}
                    className="h-10 cursor-pointer rounded-md transition-all hover:scale-105"
                    style={{
                      backgroundColor: `rgba(132, 204, 22, ${0.1 + intensity * 0.9})`,
                      opacity: intensity < 0.2 ? 0.3 : 1,
                    }}
                    title={`Orders: ${Math.floor(intensity * 50)}`}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex justify-between text-xs text-muted-foreground">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-container">
          <CardHeader className="border-b border-border/50 px-0 pb-4 pt-0">
            <CardTitle className="text-lg">Export Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-0 pt-6">
            <Button className="w-full rounded-xl" onClick={() => handleExport("excel")}>
              Download Excel
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => handleExport("pdf")}>
              Download PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
