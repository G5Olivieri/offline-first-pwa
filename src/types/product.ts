export type Product = {
  _id: string;
  rev?: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category?: string;
  tags?: string[];
  description?: string;
};
