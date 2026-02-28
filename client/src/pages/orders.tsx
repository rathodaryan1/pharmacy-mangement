import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar as CalendarIcon, Eye } from "lucide-react";
import { ordersList, kpiData } from "@/lib/mock-data";

export default function Orders() {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/25">
          Create Order
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.orders.map((kpi, idx) => (
          <Card key={idx} className="card-container p-5 hover-elevate">
            <p className="text-muted-foreground text-sm font-medium mb-2">{kpi.title}</p>
            <h3 className="text-3xl font-bold text-foreground mb-1">{kpi.value}</h3>
            <p className={`text-xs font-medium ${kpi.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {kpi.trend} from last month
            </p>
          </Card>
        ))}
      </div>

      <Card className="card-container p-0 overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row justify-between gap-4 bg-white/50">
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search orders..." 
                className="pl-10 bg-background border-border/50 rounded-xl"
              />
            </div>
            <Button variant="outline" className="rounded-xl border-border/50 px-3">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex gap-2">
            {['All', 'Completed', 'Pending', 'Cancelled'].map(status => (
              <Button key={status} variant={status === 'All' ? 'default' : 'outline'} className={`rounded-xl ${status === 'All' ? 'bg-sidebar-background text-white shadow-md' : 'border-border/50 text-muted-foreground'}`}>
                {status}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Order Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-white">
              {ordersList.map((order) => (
                <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-semibold text-sidebar-background">{order.id}</td>
                  <td className="px-6 py-4 font-medium">{order.customerName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{order.orderDate}</td>
                  <td className="px-6 py-4 font-bold text-foreground">${order.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`
                      border-0 
                      ${order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : ''}
                      ${order.paymentStatus === 'Pending' ? 'bg-amber-50 text-amber-700' : ''}
                      ${order.paymentStatus === 'Failed' ? 'bg-red-50 text-red-700' : ''}
                    `}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`
                      border-0
                      ${order.orderStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${order.orderStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : ''}
                      ${order.orderStatus === 'In progress' ? 'bg-blue-100 text-blue-700' : ''}
                      ${order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {order.orderStatus}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground">
                      <Eye className="w-4 h-4 mr-2" /> View
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
