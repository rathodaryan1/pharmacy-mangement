import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, MoreHorizontal, Edit, Trash2, Package } from "lucide-react";
import { productsList, kpiData } from "@/lib/mock-data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Products() {
  const categories = ["Antibiotics", "Pain Relievers", "Blood Pressure", "Antacids", "Vitamins", "First Aid"];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your medicines and products.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="rounded-xl flex-1 sm:flex-none shadow-sm border-border/50">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/25 flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiData.products.map((kpi, idx) => (
          <Card key={idx} className="card-container hover-elevate">
            <CardContent className="p-0 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">{kpi.title}</p>
                <h3 className="text-3xl font-bold text-foreground">{kpi.value}</h3>
              </div>
              <div className={`p-4 rounded-2xl ${kpi.title === 'Out of Stock' ? 'bg-red-50 text-red-500' : kpi.title === 'Low Stock Items' ? 'bg-amber-50 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                <Package className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Categories Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white border border-border/50 rounded-2xl p-4 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all group">
              <div className="w-12 h-12 mx-auto bg-secondary group-hover:bg-primary/10 rounded-full flex items-center justify-center mb-3 transition-colors">
                <Package className="w-5 h-5 text-sidebar-background group-hover:text-primary" />
              </div>
              <p className="font-medium text-sm text-foreground">{cat}</p>
              <p className="text-xs text-muted-foreground mt-1">{Math.floor(Math.random() * 50 + 10)} Items</p>
            </div>
          ))}
        </div>
      </div>

      {/* Product Table Area */}
      <Card className="card-container p-0 overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search products by name or ID..." 
              className="pl-10 bg-background border-border/50 rounded-xl focus-visible:ring-primary"
            />
          </div>
          <Button variant="outline" className="rounded-xl text-muted-foreground border-border/50">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background">
              <tr>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Expiry Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-white">
              {productsList.map((product) => (
                <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.id}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{product.category}</td>
                  <td className="px-6 py-4 font-medium">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">{product.quantity}</span> pcs
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{product.expiryDate}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`
                      border-0 capitalize
                      ${product.status === 'in stock' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${product.status === 'low stock' ? 'bg-amber-100 text-amber-700' : ''}
                      ${product.status === 'out of stock' ? 'bg-red-100 text-red-700' : ''}
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
                        <DropdownMenuItem className="cursor-pointer rounded-md"><Edit className="w-4 h-4 mr-2"/> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-md text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to {productsList.length} of {productsList.length} entries</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="rounded-lg">Previous</Button>
            <Button variant="outline" size="sm" className="rounded-lg border-primary text-primary bg-primary/5">1</Button>
            <Button variant="outline" size="sm" className="rounded-lg">Next</Button>
          </div>
        </div>
      </Card>
    </>
  );
}
