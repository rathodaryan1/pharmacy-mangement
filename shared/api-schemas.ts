import { z } from "zod";

// Auth
export const RegisterBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "STAFF"]).optional().default("STAFF"),
});
export type RegisterBody = z.infer<typeof RegisterBodySchema>;

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginBody = z.infer<typeof LoginBodySchema>;

// Product
export const CreateProductBodySchema = z.object({
  name: z.string().min(1),
  batchNumber: z.string().min(1),
  stock: z.number().int().min(0),
  purchasePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  expiryDate: z.string().min(1),
});
export type CreateProductBody = z.infer<typeof CreateProductBodySchema>;

export const UpdateProductBodySchema = CreateProductBodySchema.partial();
export type UpdateProductBody = z.infer<typeof UpdateProductBodySchema>;

// Customer
export const CreateCustomerBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});
export type CreateCustomerBody = z.infer<typeof CreateCustomerBodySchema>;

export const UpdateCustomerBodySchema = CreateCustomerBodySchema.partial();
export type UpdateCustomerBody = z.infer<typeof UpdateCustomerBodySchema>;

// Order
export const OrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
});

export const NewOrderCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Customer email is invalid"),
  phone: z.string().optional(),
});

export const PaymentMethodSchema = z.enum(["CASH", "UPI", "CARD", "BANK", "PENDING"]);

export const CreateOrderBodySchema = z.object({
  customerId: z.string().optional(),
  customer: NewOrderCustomerSchema.optional(),
  items: z.array(OrderItemSchema).min(1),
  paymentMethod: PaymentMethodSchema.optional().default("PENDING"),
}).superRefine((data, ctx) => {
  if (!data.customerId && !data.customer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either customerId or customer details are required",
      path: ["customerId"],
    });
  }
});
export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>;

export const UpdateOrderBodySchema = z.object({
  paymentStatus: z.enum(["PAID", "PENDING", "FAILED"]).optional(),
  orderStatus: z.enum(["COMPLETED", "IN_PROGRESS", "PENDING", "CANCELLED"]).optional(),
  paymentMethod: PaymentMethodSchema.optional(),
});
export type UpdateOrderBody = z.infer<typeof UpdateOrderBodySchema>;

// Payment
export const CreatePaymentBodySchema = z.object({
  orderId: z.string(),
  amount: z.number().min(0),
  method: z.string().min(1),
  status: z.enum(["PAID", "PENDING", "FAILED"]).optional().default("PAID"),
});
export type CreatePaymentBody = z.infer<typeof CreatePaymentBodySchema>;

// Supplier
export const CreateSupplierBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
});
export type CreateSupplierBody = z.infer<typeof CreateSupplierBodySchema>;

// Purchase order
export const PurchaseItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  cost: z.number().min(0),
});
export const CreatePurchaseOrderBodySchema = z.object({
  supplierId: z.string(),
  items: z.array(PurchaseItemSchema).min(1),
});
export type CreatePurchaseOrderBody = z.infer<typeof CreatePurchaseOrderBodySchema>;

export const UpdatePurchaseOrderBodySchema = z.object({
  status: z.enum(["PENDING", "RECEIVED", "CANCELLED"]).optional(),
});
export type UpdatePurchaseOrderBody = z.infer<typeof UpdatePurchaseOrderBodySchema>;
