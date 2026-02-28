import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  expiryDate: z.string(),
  status: z.enum(["in stock", "low stock", "out of stock"]),
  category: z.string()
});
export type Product = z.infer<typeof ProductSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  orderDate: z.string(),
  products: z.array(z.string()),
  totalAmount: z.number(),
  paymentStatus: z.enum(["Paid", "Pending", "Failed"]),
  orderStatus: z.enum(["Completed", "In progress", "Pending", "Cancelled"])
});
export type Order = z.infer<typeof OrderSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  ordersPlaced: z.number(),
  totalSpend: z.number(),
  lastOrderDate: z.string()
});
export type Customer = z.infer<typeof CustomerSchema>;

export const PaymentSchema = z.object({
  transactionId: z.string(),
  customerName: z.string(),
  paymentDate: z.string(),
  amount: z.number(),
  status: z.enum(["Completed", "Pending", "Failed"]),
  paymentMethod: z.string(),
  orderId: z.string()
});
export type Payment = z.infer<typeof PaymentSchema>;
