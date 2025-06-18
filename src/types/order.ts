import type { Product } from "./product";

export enum OrderStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}
export type PaymentMethod = "cash" | "card";

export type Item = { quantity: number; product: Product };
export type Order = {
  _id: string;
  _rev?: string;
  items: Item[];
  total: number;
  status: OrderStatus;
  terminal_id: string;
  operator_id?: string;
  customer_id?: string;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
  amount?: number | null; // Only for cash payments
};
