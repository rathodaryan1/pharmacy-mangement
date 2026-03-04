import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowDownToLine, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
      const res = await fetch(`/api/reports/sales-summary/excel?start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement-${start}-${end}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Download", description: "Excel report downloaded." });
    } catch {
      toast({ title: "Error", description: "Could not download", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments</h1>
          <p className="mt-1 text-muted-foreground">Track transactions and payment statuses.</p>
        </div>
        <Button
          variant="outline"
          className="w-full rounded-xl border-border/50 shadow-sm sm:w-auto"
          onClick={handleDownload}
        >
          <ArrowDownToLine className="mr-2 h-4 w-4" /> Download Statement
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="card-container border-none shadow-md shadow-emerald-900/5">
          <CardContent className="flex items-center gap-4 p-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Successful Payments</p>
              <h3 className="text-2xl font-bold text-foreground">Rs {completedTotal.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="card-container border-none shadow-md shadow-amber-900/5">
          <CardContent className="flex items-center gap-4 p-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Processing</p>
              <h3 className="text-2xl font-bold text-foreground">Rs {pendingTotal.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="card-container border-none shadow-md shadow-red-900/5">
          <CardContent className="flex items-center gap-4 p-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Failed Transactions</p>
              <h3 className="text-2xl font-bold text-foreground">Rs {failedTotal.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-container overflow-hidden p-0">
        <div className="border-b border-border/50 bg-muted/30 p-4 sm:p-6">
          <h3 className="text-lg font-semibold">Transaction History</h3>
        </div>

        <Table className="min-w-[760px] md:min-w-full">
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="font-medium">Transaction ID</TableHead>
              <TableHead className="hidden font-medium md:table-cell">Date & Time</TableHead>
              <TableHead className="font-medium">Customer</TableHead>
              <TableHead className="font-medium">Amount</TableHead>
              <TableHead className="hidden font-medium lg:table-cell">Method</TableHead>
              <TableHead className="hidden font-medium md:table-cell">Order Ref</TableHead>
              <TableHead className="font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8"><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ) : (
              paymentsList.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/20">
                  <TableCell className="font-mono font-medium text-foreground">{payment.transactionId ?? payment.id}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{payment.paymentDate}</TableCell>
                  <TableCell className="font-medium">{payment.customerName}</TableCell>
                  <TableCell className="font-bold">Rs {payment.amount?.toFixed(2) ?? "0.00"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4" /> {payment.method}
                    </div>
                  </TableCell>
                  <TableCell className="hidden cursor-pointer text-primary underline md:table-cell">{payment.orderId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      rounded-full border-0 px-3 py-1
                      ${payment.status === "PAID" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" : ""}
                      ${payment.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200" : ""}
                      ${payment.status === "FAILED" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200" : ""}
                    `}>
                      {payment.status === "PAID" && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                      {payment.status === "PENDING" && <Clock className="mr-1 inline h-3 w-3" />}
                      {payment.status === "FAILED" && <AlertCircle className="mr-1 inline h-3 w-3" />}
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
