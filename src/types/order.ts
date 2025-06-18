import type { Product } from "./product";

export type Item = { quantity: number; product: Product };
export type Order = {
  _id: string;
  _rev?: string;
  items: Item[];
  total: number;
  status: "pending" | "completed" | "cancelled";
  operator_id?: string;
  customer_id?: string;
  createdAt: string;
  updatedAt: string;
};
