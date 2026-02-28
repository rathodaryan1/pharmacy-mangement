import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { paymentsList } from "@/lib/mock-data";
import { CreditCard, ArrowDownToLine, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function Payments() {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">Track transactions and payment statuses.</p>
        </div>
        <Button variant="outline" className="rounded-xl shadow-sm border-border/50">
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Download Statement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-container border-none shadow-md shadow-emerald-900/5">
          <CardContent className="p-2 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Successful Payments</p>
              <h3 className="text-2xl font-bold text-foreground">$124,500.00</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="card-container border-none shadow-md shadow-amber-900/5">
          <CardContent className="p-2 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Pending Processing</p>
              <h3 className="text-2xl font-bold text-foreground">$12,450.00</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="card-container border-none shadow-md shadow-red-900/5">
          <CardContent className="p-2 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Failed Transactions</p>
              <h3 className="text-2xl font-bold text-foreground">$840.00</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-container p-0 overflow-hidden border-none">
        <div className="p-6 border-b border-border/50 bg-white/50">
          <h3 className="text-lg font-semibold">Transaction History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background">
              <tr>
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Order Ref</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-white">
              {paymentsList.map((payment) => (
                <tr key={payment.transactionId} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium font-mono text-sidebar-background">{payment.transactionId}</td>
                  <td className="px-6 py-4 text-muted-foreground">{payment.paymentDate}</td>
                  <td className="px-6 py-4 font-medium">{payment.customerName}</td>
                  <td className="px-6 py-4 font-bold">${payment.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="w-4 h-4" /> {payment.paymentMethod}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-primary underline cursor-pointer">{payment.orderId}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`
                      border-0 px-3 py-1 rounded-full
                      ${payment.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${payment.status === 'Pending' ? 'bg-amber-100 text-amber-700' : ''}
                      ${payment.status === 'Failed' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {payment.status === 'Completed' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                      {payment.status === 'Pending' && <Clock className="w-3 h-3 mr-1 inline" />}
                      {payment.status === 'Failed' && <AlertCircle className="w-3 h-3 mr-1 inline" />}
                      {payment.status}
                    </Badge>
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
