import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowDownToLine, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type PaymentRow = {
  id: string;
  transactionId: string;
  orderId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  method: string;
  status: string;
};

export default function Payments() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => apiGet<{ items: PaymentRow[] }>("/api/payments?limit=50"),
  });

  const paymentsList = data?.items ?? [];

  const completedTotal = paymentsList.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const pendingTotal = paymentsList.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const failedTotal = paymentsList.filter((p) => p.status === "FAILED").reduce((s, p) => s + p.amount, 0);

  const handleDownload = async () => {
    const token = localStorage.getItem("pharmacy_token");
    const start = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const end = new Date().toISOString().slice(0, 10);
    try {
      const res = await fetch(`/api/reports/sales-summary/csv?start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement-${start}-${end}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Download", description: "CSV downloaded." });
    } catch {
      toast({ title: "Error", description: "Could not download", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">Track transactions and payment statuses.</p>
        </div>
        <Button variant="outline" className="rounded-xl shadow-sm border-border/50" onClick={handleDownload}>
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
              <h3 className="text-2xl font-bold text-foreground">₹{completedTotal.toFixed(2)}</h3>
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
              <h3 className="text-2xl font-bold text-foreground">₹{pendingTotal.toFixed(2)}</h3>
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
              <h3 className="text-2xl font-bold text-foreground">₹{failedTotal.toFixed(2)}</h3>
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
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-8"><Skeleton className="h-8 w-full" /></td></tr>
              ) : (
                paymentsList.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-sidebar-background">{payment.transactionId ?? payment.id}</td>
                    <td className="px-6 py-4 text-muted-foreground">{payment.paymentDate}</td>
                    <td className="px-6 py-4 font-medium">{payment.customerName}</td>
                    <td className="px-6 py-4 font-bold">₹{payment.amount?.toFixed(2) ?? "0.00"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="w-4 h-4" /> {payment.method}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary underline cursor-pointer">{payment.orderId}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`
                        border-0 px-3 py-1 rounded-full
                        ${payment.status === "PAID" ? "bg-emerald-100 text-emerald-700" : ""}
                        ${payment.status === "PENDING" ? "bg-amber-100 text-amber-700" : ""}
                        ${payment.status === "FAILED" ? "bg-red-100 text-red-700" : ""}
                      `}>
                        {payment.status === "PAID" && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                        {payment.status === "PENDING" && <Clock className="w-3 h-3 mr-1 inline" />}
                        {payment.status === "FAILED" && <AlertCircle className="w-3 h-3 mr-1 inline" />}
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
