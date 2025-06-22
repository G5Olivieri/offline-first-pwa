export type Product = {
  _id: string;
  _rev?: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category?: string;
  description?: string;
  dosageForm?: string;
  drugClass?: string;
  isProprietary?: boolean;
  manufacturer?: string;
  nonProprietaryName?: string;
  prescriptionStatus?: "OTC" | "PrescriptionOnly" | "Controlled";
  contraindication?: string;
  activeIngredient?: string;
  tags?: string[];
};
