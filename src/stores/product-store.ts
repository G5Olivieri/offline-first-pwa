import { defineStore } from "pinia";
import { getProductDB } from "../db";
import type { Product } from "../types/product";

export const useProductStore = defineStore("productStore", () => {
  const productDB = getProductDB();

  const findProductByBarcode = async (barcode: string) => {
    const result = await productDB.find({
      selector: { barcode },
      limit: 1,
    });
    if (result.docs.length > 0) {
      return result.docs[0];
    }
    return null;
  };

  const changeStock = async (input: Map<string, number>) => {
    const products = await productDB.bulkGet({
      docs: Array.from(input.keys()).map((id) => ({ id })),
    });
    console.log("Bulk get products response:", products);
    if (products.results.length === 0) {
      throw new Error("No products found");
    }
    const [success, errors] = products.results.reduce(
      ([success, errors], result) => {
        if (result.docs.length === 0) {
          return [
            success,
            [...errors, new Error(`Product with ID ${result.id} not found`)],
          ];
        }

        if (Object.getOwnPropertyDescriptor(result.docs[0], "error")) {
          return [
            success,
            [...errors, new Error((result.docs[0] as any).error)],
          ];
        }
        success.push((result.docs[0] as any).ok);
        return [success, errors];
      },
      [[], []] as [Product[], Error[]]
    );
    console.log("Bulk get products success:", success);
    console.log("Bulk get products errors:", errors);
    if (errors.length > 0) {
      throw new Error(`Errors occurred while fetching products: ${errors}`);
    }
    const productsToUpdate = success.map((result) => ({
      ...result,
      stock: input.get(result._id) ?? result.stock, // Update stock if input has a value for this product
    }));
    console.log("Products to update:", productsToUpdate);
    productDB
      .bulkDocs(productsToUpdate)
      .then((response) => {
        console.log("Bulk update response:", response);
        return response;
      })
      .catch((error) => {
        console.error("Error updating products:", error);
      });
  };

  const listProducts = async ({ limit = 100, skip = 0 } = {}) => {
    console.log("Listing all products");
    const count = await productDB.info().then((info) => info.doc_count);
    console.log(`Total products count: ${count}`);
    return {
      count,
      products: await productDB
        .allDocs({ include_docs: true, limit, skip })
        .then((result) => {
          return result.rows.map((row) => row.doc as Product);
        })
        .catch((error) => {
          console.error("Error fetching products:", error);
          return [];
        }),
    };
  };

  const createProduct = async (product: Omit<Product, "_id" | "rev">) => {
    console.log("Creating product:", product);
    const newProduct = {
      _id: crypto.randomUUID(),
      ...product,
    };
    await productDB.put(newProduct);
    console.log("Product created:", newProduct);
    return newProduct;
  };

  const deleteProduct = async (id: string) => {
    console.log("Deleting product with ID:", id);
    const productToDelete = await productDB.get(id);
    await productDB.remove(productToDelete);
    console.log("Product deleted:", id);
    return id;
  };

  const bulkInsertProducts = async (products: Product[]) => {
    console.log("Bulk inserting products:", products.length);
    const docs = products.map((product) => ({
      ...product,
      _id: product._id || crypto.randomUUID(), // Ensure each product has a unique ID
    }));
    try {
      const response = await productDB.bulkDocs(docs);
      console.log("Bulk insert response:", response.length);
      return response;
    } catch (error) {
      console.error("Error during bulk insert:", error);
      throw error;
    }
  };

  return {
    findProductByBarcode,
    changeStock,
    listProducts,
    createProduct,
    deleteProduct,
    bulkInsertProducts,
  };
});
