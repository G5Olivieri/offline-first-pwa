<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 relative"
  >
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1
          class="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
        >
          Import Products
        </h1>
        <p class="text-gray-600 mt-2">
          Upload a JSONL file to bulk import products.
        </p>
      </div>

      <!-- Import Form -->
      <div
        class="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-8"
      >
        <div class="space-y-6">
          <!-- File Upload -->
          <div>
            <label
              for="file-upload"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Select JSONL File
            </label>
            <div class="relative">
              <input
                id="file-upload"
                type="file"
                accept=".jsonl"
                @change="handleFileUpload"
                :disabled="isImporting"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded-lg p-3"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500">
              Only .jsonl files are supported. Each line should contain a valid
              JSON product object.
            </p>
          </div>

          <!-- Selected File Info -->
          <div
            v-if="file && !isImporting"
            class="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div class="flex items-center gap-3">
              <svg
                class="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <p class="text-sm font-medium text-blue-900">{{ file.name }}</p>
                <p class="text-xs text-blue-600">
                  {{ (file.size / 1024).toFixed(1) }} KB
                </p>
              </div>
            </div>
          </div>

          <!-- Import Button -->
          <button
            @click="importProducts"
            :disabled="!file || isImporting"
            class="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
          >
            <svg
              v-if="!isImporting"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isImporting ? "Importing..." : "Import Products" }}
          </button>
        </div>
      </div>

      <!-- Help Section -->
      <div
        v-if="!isImporting"
        class="mt-8 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-800 mb-3">
          File Format Requirements
        </h3>
        <div class="space-y-2 text-sm text-gray-600">
          <p>
            • Each line must contain a valid JSON object representing a product
          </p>
          <p>
            • Required fields:
            <code class="bg-gray-100 px-1 rounded">name</code>,
            <code class="bg-gray-100 px-1 rounded">barcode</code>,
            <code class="bg-gray-100 px-1 rounded">price</code>
          </p>
          <p>
            • Optional fields:
            <code class="bg-gray-100 px-1 rounded">category</code>,
            <code class="bg-gray-100 px-1 rounded">description</code>,
            <code class="bg-gray-100 px-1 rounded">tags</code>
            <code class="bg-gray-100 px-1 rounded">activeIngredient</code>
            <code class="bg-gray-100 px-1 rounded">prescriptionStatus</code>
            <code class="bg-gray-100 px-1 rounded">nonProprietaryName</code>
            <code class="bg-gray-100 px-1 rounded">isProprietary</code>
          </p>
        </div>
        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Example format:</p>
          <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{"name":"20 Bi","url":"https://consultaremedios.com.br/20-bi/p","description":"O Lactobacillus acidophilus NCFM®, Lactobacillus paracasei Lpc-37™, Bifidobacterium lactis Bi-04™, Bifidobacterium lactis Bi-07™, Bifidobacterium bifidum Bb-02™ (probióticos) contribuem para o equilíbrio da flora intestinal.Seu consumo deve estar associado a uma alimentação equilibrada e hábitos de vida saudáveis.","dosageForm":"Cápsula","prescriptionStatus":"OTC","isProprietary":true,"isAvailableGenerically":false,"nonProprietaryName":"Lactobacillus acidophilus + Lactobacillus paracasei + Bifidobacterium lactis + Bifidobacterium bifidum","indication":"O Lactobacillus acidophilus NCFM®, Lactobacillus paracasei Lpc-37™, Bifidobacterium lactis Bi-04™, Bifidobacterium lactis Bi-07™, Bifidobacterium bifidum Bb-02™ (probióticos) contribuem para o equilíbrio da flora intestinal.Seu consumo deve estar associado a uma alimentação equilibrada e hábitos de vida saudáveis.","contraindication":"Hipersensibilidade aos componentes da fórmula.","drugClass":null,"category":"Remédios para o Aparelho Digestivo &gt; Remédios Restauradores da Flora Intestinal","manufacturer":"Momenta Farma","reviewedBy":{"@id":"https://consultaremedios.com.br/editorial/equipe/karime-halmenschlager-sleiman","@type":"Person","name":"Karime Halmenschlager Sleiman (CRF-PR 39421)","description":"Farmacêutica generalista graduada pela Faculdade Paranaense e responsável técnica da Consulta Remédios, Farmácia Online.","jobTitle":"Farmacêutica Responsável","affiliation":{"@type":"Organization","name":"Faculdade Paranaense"},"lastReviewed":"2025-03-27T10:49:59"},"barcode":"7891317129941","price":87.02,"stock":"10","_id":"968122df-dc73-4131-9b44-8b015784d5c5","activeIngredient":"Lactobacillus acidophilus + Lactobacillus paracasei + Bifidobacterium lactis + Bifidobacterium bifidum"}
{"name":"Hipomed","url":"https://consultaremedios.com.br/hipomed/p","description":"Hipomed é uma pomada para prevenir e tratar a pele que sofre com os sintomas da assaduras.","dosageForm":"Pomada dermatológica","prescriptionStatus":"OTC","isProprietary":true,"isAvailableGenerically":false,"nonProprietaryName":"Palmitato de Retinol + Colecalciferol + Óxido de Zinco","indication":"Hipomed é uma pomada para prevenir e tratar a pele que sofre com os sintomas da assaduras.","contraindication":"Hipersensibilidade aos componentes da fórmula.","adverseOutcome":"Caso apresente sintomas colaterais ao uso, avise um médico.","drugClass":null,"category":"Remédios para Tratamentos de Pele e Mucosa &gt; Remédios para Assaduras","manufacturer":"1Farma","reviewedBy":{"@id":"https://consultaremedios.com.br/editorial/equipe/karime-halmenschlager-sleiman","@type":"Person","name":"Karime Halmenschlager Sleiman (CRF-PR 39421)","description":"Farmacêutica generalista graduada pela Faculdade Paranaense e responsável técnica da Consulta Remédios, Farmácia Online.","jobTitle":"Farmacêutica Responsável","affiliation":{"@type":"Organization","name":"Faculdade Paranaense"},"lastReviewed":"2022-12-01T13:32:52"},"barcode":"7896523219189","price":0.01,"stock":"27","_id":"b8475b73-cf16-4eee-a606-97ccf4e15fe0","activeIngredient":"Palmitato de Retinol + Colecalciferol + Óxido de Zinco"}</pre
          >
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isImporting"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div
        class="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
      >
        <div class="text-center">
          <div class="mb-6">
            <div class="w-16 h-16 mx-auto">
              <svg
                class="w-full h-full animate-spin text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          </div>

          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            Importing Products...
          </h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "ImportProducts",
});

import { ref } from "vue";
import { useRouter } from "vue-router";
import { productService } from "@/services/product-service";
import { useNotificationStore } from "@/stores/notification-store";

const notificationStore = useNotificationStore();

const file = ref<File | null>(null);
const isImporting = ref(false);
const router = useRouter();

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    file.value = target.files[0];
  }
};

const importProducts = async () => {
  if (!file.value) {
    notificationStore.showError(
      "No File Selected",
      "Please upload a JSONL file first.",
    );
    return;
  }

  isImporting.value = true;

  try {
    const text = await file.value.text();

    const lines = text.split("\n");
    const rawProducts = lines
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line));

    const products = rawProducts.map((product) => {
      return {
        ...product,
        price: parseFloat(product.price),
        stock: Math.ceil(Math.random() * 30),
      };
    });

    await productService.bulkInsertProducts(products);

    router.push({ name: "products" });
  } catch (error) {
    notificationStore.showError(
      "Import Failed",
      `Failed to import products. Please check your file format and try again. ${error}`,
    );
  } finally {
    isImporting.value = false;
  }
};
</script>
