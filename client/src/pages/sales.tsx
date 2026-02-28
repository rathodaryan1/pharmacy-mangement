import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { salesChartData } from "@/lib/mock-data";
import { DollarSign, TrendingUp, CreditCard, Activity } from "lucide-react";

export default function Sales() {
  const metrics = [
    { title: "Total Revenue", value: "$124,563", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Profit", value: "$45,231", icon: TrendingUp, color: "text-primary", bg: "bg-primary/20" },
    { title: "Avg. Order Value", value: "$142.50", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Conversion Rate", value: "3.24%", icon: Activity, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sales Dashboard</h1>
        <p className="text-muted-foreground mt-1">Detailed analysis of your revenue streams.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((m, i) => (
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
        ))}
      </div>

      <Card className="card-container p-0 mb-8 border-none bg-white">
        <CardHeader className="border-b border-border/50 px-6 py-5">
          <CardTitle className="text-xl flex justify-between items-center">
            Revenue Overview
            <select className="text-sm font-normal bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Last 12 Months</option>
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
            </select>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--sidebar-background))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Revenue" />
              <Area type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="card-container border-none bg-white">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-border/50">
            <CardTitle className="text-lg">Orders Heatmap (Simulated)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-6">
            <div className="grid grid-cols-7 gap-2">
              {/* Simulate a heatmap grid */}
              {Array.from({length: 35}).map((_, i) => {
                const intensity = Math.random();
                return (
                  <div 
                    key={i} 
                    className="h-10 rounded-md transition-all hover:scale-105 cursor-pointer"
                    style={{ 
                      backgroundColor: `rgba(132, 204, 22, ${0.1 + (intensity * 0.9)})`,
                      opacity: intensity < 0.2 ? 0.3 : 1
                    }}
                    title={`Orders: ${Math.floor(intensity * 50)}`}
                  ></div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-4">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-container border-none bg-white">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-border/50">
            <CardTitle className="text-lg">Top Performing Regions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-6 space-y-5">
            {[
              { region: "North America", value: "$45k", percentage: 45 },
              { region: "Europe", value: "$32k", percentage: 32 },
              { region: "Asia Pacific", value: "$15k", percentage: 15 },
              { region: "Middle East", value: "$8k", percentage: 8 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{item.region}</span>
                  <span className="font-bold text-sidebar-background">{item.value}</span>
                </div>
                <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-sidebar-background rounded-full" style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
