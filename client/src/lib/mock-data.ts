// Shared mock data to simulate a backend for the frontend prototype

export const kpiData = {
  overview: [
    { title: "Total Profit", value: "$45,231.89", trend: "+20.1%", isPositive: true },
    { title: "Total Customers", value: "2,405", trend: "+15.1%", isPositive: true },
    { title: "Total Orders", value: "12,234", trend: "+4.1%", isPositive: true },
    { title: "Total Revenue", value: "$89,432.00", trend: "-1.2%", isPositive: false },
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
  { id: "PRD-001", name: "Amoxicillin 500mg", quantity: 150, price: 12.99, expiryDate: "2025-10-12", status: "in stock", category: "Antibiotics" },
  { id: "PRD-002", name: "Ibuprofen 400mg", quantity: 24, price: 8.50, expiryDate: "2026-01-15", status: "low stock", category: "Pain Relievers" },
  { id: "PRD-003", name: "Lisinopril 200mg", quantity: 0, price: 15.00, expiryDate: "2024-11-20", status: "out of stock", category: "Blood Pressure" },
  { id: "PRD-004", name: "Omeprazole 10mg", quantity: 300, price: 9.99, expiryDate: "2026-05-01", status: "in stock", category: "Blood Pressure" },
  { id: "PRD-005", name: "Cetirizine 20mg", quantity: 85, price: 14.25, expiryDate: "2025-08-30", status: "in stock", category: "Antacids" },
  { id: "PRD-006", name: "Metformin 40mg", quantity: 12, price: 11.50, expiryDate: "2025-02-14", status: "low stock", category: "Antacids" },
  { id: "PRD-007", name: "Azithromycin 250mg", quantity: 210, price: 18.00, expiryDate: "2026-09-09", status: "in stock", category: "Antibiotics" },
];

export const ordersList = [
  { id: "ORD-7021", customerName: "Sarah Jenkins", orderDate: "2024-03-14", products: ["Amoxicillin", "Ibuprofen"], totalAmount: 21.49, paymentStatus: "Paid", orderStatus: "Completed" },
  { id: "ORD-7022", customerName: "Michael Chen", orderDate: "2024-03-14", products: ["Lisinopril"], totalAmount: 15.00, paymentStatus: "Pending", orderStatus: "In progress" },
  { id: "ORD-7023", customerName: "Emma Davis", orderDate: "2024-03-13", products: ["Omeprazole", "Cetirizine"], totalAmount: 24.24, paymentStatus: "Paid", orderStatus: "Completed" },
  { id: "ORD-7024", customerName: "James Wilson", orderDate: "2024-03-13", products: ["Metformin"], totalAmount: 11.50, paymentStatus: "Failed", orderStatus: "Cancelled" },
  { id: "ORD-7025", customerName: "Robert Taylor", orderDate: "2024-03-12", products: ["Azithromycin"], totalAmount: 18.00, paymentStatus: "Paid", orderStatus: "Completed" },
  { id: "ORD-7026", customerName: "Linda Anderson", orderDate: "2024-03-12", products: ["Ibuprofen", "Cetirizine"], totalAmount: 22.75, paymentStatus: "Pending", orderStatus: "Pending" },
];

export const customersList = [
  { id: "CUS-101", name: "Sarah Jenkins", email: "sarah.j@example.com", phone: "+1 (555) 123-4567", ordersPlaced: 12, totalSpend: 345.50, lastOrderDate: "2024-03-14" },
  { id: "CUS-102", name: "Michael Chen", email: "m.chen@example.com", phone: "+1 (555) 987-6543", ordersPlaced: 4, totalSpend: 120.00, lastOrderDate: "2024-03-14" },
  { id: "CUS-103", name: "Emma Davis", email: "emma.davis@example.com", phone: "+1 (555) 456-7890", ordersPlaced: 28, totalSpend: 890.25, lastOrderDate: "2024-03-13" },
  { id: "CUS-104", name: "James Wilson", email: "jwilson88@example.com", phone: "+1 (555) 222-3333", ordersPlaced: 1, totalSpend: 11.50, lastOrderDate: "2024-03-13" },
  { id: "CUS-105", name: "Robert Taylor", email: "rtaylor@example.com", phone: "+1 (555) 444-5555", ordersPlaced: 15, totalSpend: 450.75, lastOrderDate: "2024-03-12" },
];

export const paymentsList = [
  { transactionId: "TXN-9910", customerName: "Sarah Jenkins", paymentDate: "2024-03-14 10:23 AM", amount: 21.49, status: "Completed", paymentMethod: "Credit Card", orderId: "ORD-7021" },
  { transactionId: "TXN-9911", customerName: "Michael Chen", paymentDate: "2024-03-14 11:45 AM", amount: 15.00, status: "Pending", paymentMethod: "PayPal", orderId: "ORD-7022" },
  { transactionId: "TXN-9912", customerName: "Emma Davis", paymentDate: "2024-03-13 09:12 AM", amount: 24.24, status: "Completed", paymentMethod: "Credit Card", orderId: "ORD-7023" },
  { transactionId: "TXN-9913", customerName: "James Wilson", paymentDate: "2024-03-13 02:30 PM", amount: 11.50, status: "Failed", paymentMethod: "Bank Transfer", orderId: "ORD-7024" },
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
