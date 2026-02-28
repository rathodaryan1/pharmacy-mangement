// Shared mock data to simulate a backend for the frontend prototype

export const kpiData = {
  overview: [
    { title: "Total Profit", value: "₹45,231.89", trend: "+20.1%", isPositive: true },
    { title: "Total Customers", value: "2,405", trend: "+15.1%", isPositive: true },
    { title: "Total Orders", value: "12,234", trend: "+4.1%", isPositive: true },
    { title: "Total Revenue", value: "₹89,432.00", trend: "-1.2%", isPositive: false },
  ],
  products: [
    { title: "Total Products", value: "1,204", trend: "+12", isPositive: true },
    { title: "Low Stock Items", value: "48", trend: "-5", isPositive: true },
    { title: "Out of Stock", value: "12", trend: "+2", isPositive: false },
  ],
  orders: [
    { title: "Total Orders", value: "12,234", trend: "+450", isPositive: true },
    { title: "Completed", value: "11,800", trend: "+420", isPositive: true },
    { title: "Pending", value: "384", trend: "+12", isPositive: false },
    { title: "Cancelled", value: "50", trend: "-2", isPositive: true },
  ]
};

export const productsList = [
  { id: "PRD-001", name: "Amoxycillin 500mg", quantity: 150, price: 120.99, expiryDate: "2025-10-12", status: "in stock", category: "Antibiotics" },
  { id: "PRD-002", name: "Combiflam", quantity: 24, price: 45.50, expiryDate: "2026-01-15", status: "low stock", category: "Pain Relievers" },
  { id: "PRD-003", name: "Amlokind 5mg", quantity: 0, price: 65.00, expiryDate: "2024-11-20", status: "out of stock", category: "Blood Pressure" },
  { id: "PRD-004", name: "Pantocid 40mg", quantity: 300, price: 110.99, expiryDate: "2026-05-01", status: "in stock", category: "Gastrointestinal" },
  { id: "PRD-005", name: "Limcee Vitamin C", quantity: 85, price: 25.25, expiryDate: "2025-08-30", status: "in stock", category: "Vitamins" },
  { id: "PRD-006", name: "Digene Gel", quantity: 12, price: 115.50, expiryDate: "2025-02-14", status: "low stock", category: "Gastrointestinal" },
  { id: "PRD-007", name: "Azithral 500mg", quantity: 210, price: 118.00, expiryDate: "2026-09-09", status: "in stock", category: "Antibiotics" },
];

export const ordersList = [
  { id: "ORD-7021", customerName: "Rahul Sharma", orderDate: "2024-03-14", products: ["Amoxycillin", "Combiflam"], totalAmount: 210.49, paymentStatus: "Paid", orderStatus: "Completed" },
  { id: "ORD-7022", customerName: "Priya Patel", orderDate: "2024-03-14", products: ["Amlokind"], totalAmount: 150.00, paymentStatus: "Pending", orderStatus: "In progress" },
  { id: "ORD-7023", customerName: "Amit Gupta", orderDate: "2024-03-13", products: ["Pantocid", "Limcee"], totalAmount: 240.24, paymentStatus: "Paid", orderStatus: "Completed" },
  { id: "ORD-7024", customerName: "Sneha Reddy", orderDate: "2024-03-13", products: ["Digene"], totalAmount: 115.50, paymentStatus: "Failed", orderStatus: "Cancelled" },
  { id: "ORD-7025", customerName: "Vikram Singh", orderDate: "2024-03-12", products: ["Azithral"], totalAmount: 180.00, paymentStatus: "Paid", orderStatus: "Completed" },
  { id: "ORD-7026", customerName: "Anjali Verma", orderDate: "2024-03-12", products: ["Combiflam", "Limcee"], totalAmount: 220.75, paymentStatus: "Pending", orderStatus: "Pending" },
];

export const customersList = [
  { id: "CUS-101", name: "Rahul Sharma", email: "rahul.s@example.in", phone: "+91 98765 43210", ordersPlaced: 12, totalSpend: 3450.50, lastOrderDate: "2024-03-14" },
  { id: "CUS-102", name: "Priya Patel", email: "priya.p@example.in", phone: "+91 91234 56789", ordersPlaced: 4, totalSpend: 1200.00, lastOrderDate: "2024-03-14" },
  { id: "CUS-103", name: "Amit Gupta", email: "amit.g@example.in", phone: "+91 99887 76655", ordersPlaced: 28, totalSpend: 8900.25, lastOrderDate: "2024-03-13" },
  { id: "CUS-104", name: "Sneha Reddy", email: "sneha.r@example.in", phone: "+91 90000 11111", ordersPlaced: 1, totalSpend: 115.50, lastOrderDate: "2024-03-13" },
  { id: "CUS-105", name: "Vikram Singh", email: "vikram.s@example.in", phone: "+91 92222 33333", ordersPlaced: 15, totalSpend: 4500.75, lastOrderDate: "2024-03-12" },
];

export const paymentsList = [
  { transactionId: "TXN-9910", customerName: "Rahul Sharma", paymentDate: "2024-03-14 10:23 AM", amount: 210.49, status: "Completed", paymentMethod: "UPI", orderId: "ORD-7021" },
  { transactionId: "TXN-9911", customerName: "Priya Patel", paymentDate: "2024-03-14 11:45 AM", amount: 150.00, status: "Pending", paymentMethod: "Net Banking", orderId: "ORD-7022" },
  { transactionId: "TXN-9912", customerName: "Amit Gupta", paymentDate: "2024-03-13 09:12 AM", amount: 240.24, status: "Completed", paymentMethod: "UPI", orderId: "ORD-7023" },
  { transactionId: "TXN-9913", customerName: "Sneha Reddy", paymentDate: "2024-03-13 02:30 PM", amount: 115.50, status: "Failed", paymentMethod: "Debit Card", orderId: "ORD-7024" },
];

export const salesChartData = [
  { name: "Jan", total: 4500, profit: 2400 },
  { name: "Feb", total: 5200, profit: 2800 },
  { name: "Mar", total: 6100, profit: 3200 },
  { name: "Apr", total: 4800, profit: 2500 },
  { name: "May", total: 7000, profit: 3900 },
  { name: "Jun", total: 8200, profit: 4500 },
  { name: "Jul", total: 7800, profit: 4200 },
  { name: "Aug", total: 8500, profit: 4800 },
  { name: "Sep", total: 9100, profit: 5100 },
  { name: "Oct", total: 8800, profit: 4900 },
  { name: "Nov", total: 9500, profit: 5400 },
  { name: "Dec", total: 11000, profit: 6200 },
];
