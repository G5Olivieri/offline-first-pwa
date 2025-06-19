import { defineStore } from "pinia";
import { getProductDB } from "../db";
import { searchService } from "../services/search-service";
import type { Product } from "../types/product";

export const useProductStore = defineStore("productStore", () => {
  const productDB = getProductDB();

  // Main search method - uses search service if available, fallback to database
  const searchProducts = async (
    query: string,
    { limit = 100, skip = 0 } = {}
  ) => {
    const searchResult = searchService.search(query, { limit, skip });

    const products = await productDB
      .bulkGet({
        docs: searchResult.productIds.map((id) => ({ id })),
      })
      .then((result) => {
        return result.results.map(
          (r) =>
            ((r.docs && r.docs[0] && "ok" in r.docs[0] && r.docs[0].ok) ||
              null) as Product | null
        );
      })
      .catch(() => {
        return [];
      });

    return {
      count: searchResult.count,
      products: products.filter((p) => p !== null) as Product[],
    };
  };

  // Legacy method for backward compatibility - now uses main search
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
            [
              ...errors,
              new Error(String((result.docs[0] as { error: unknown }).error)),
            ],
          ];
        }
        success.push((result.docs[0] as { ok: Product }).ok);
        return [success, errors];
      },
      [[], []] as [Product[], Error[]]
    );

    if (errors.length > 0) {
      throw new Error(`Errors occurred while fetching products: ${errors}`);
    }
    const productsToUpdate = success.map((result) => ({
      ...result,
      stock: input.get(result._id) ?? result.stock, // Update stock if input has a value for this product
    }));

    productDB.bulkDocs(productsToUpdate).then((response) => {
      return response;
    });
  };

  const listProducts = async ({ limit = 100, skip = 0 } = {}) => {
    const count = await productDB.info().then((info) => info.doc_count);

    const result = {
      count,
      products: await productDB
        .allDocs({ include_docs: true, limit, skip })
        .then((result) => {
          return result.rows.map((row) => row.doc as Product);
        })
        .catch(() => {
          return [];
        }),
    };

    return result;
  };

  const createProduct = async (product: Omit<Product, "_id" | "rev">) => {
    const newProduct = {
      _id: crypto.randomUUID(),
      ...product,
    };
    await productDB.put(newProduct);

    await searchService.add({
      id: newProduct._id,
      name: newProduct.name,
      barcode: newProduct.barcode,
    });

    return newProduct;
  };

  const updateProduct = async (product: Product) => {
    await productDB.put(product);
    await searchService.add({
      id: product._id,
      name: product.name,
      barcode: product.barcode,
    });

    return product;
  };

  const deleteProduct = async (id: string) => {
    const productToDelete = await productDB.get(id);

    await productDB.remove(productToDelete);
    await searchService.remove(id);

    return id;
  };

  const bulkInsertProducts = async (products: Product[]) => {
    const docs = products.map((product) => ({
      ...product,
      _id: product._id || crypto.randomUUID(),
    }));
    const response = await productDB.bulkDocs(docs);

    const indexableProducts = docs.map((product) => ({
      id: product._id,
      name: product.name,
      barcode: product.barcode,
    }));

    await searchService.bulkAdd(indexableProducts);

    return response;
  };

  return {
    findProductByBarcode,
    searchProducts,
    changeStock,
    listProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkInsertProducts,
  };
});
