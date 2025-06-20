<script lang="ts" setup>
import { computed } from "vue";
import type { Product } from "@/types/product";
import { useOrderStore } from "@/stores/order-store";
import { config, formatCurrency } from "@/config/env";

interface Props {
  products: Product[];
  title: string;
  subtitle?: string;
  type: "upsell" | "crosssell" | "popular";
}

const props = defineProps<Props>();
const orderStore = useOrderStore();

const displayProducts = computed(() =>
  props.products.slice(0, config.maxSuggestions),
);

const addToCart = (product: Product) => {
  orderStore.addProduct(product);
};

const formatPrice = (price: number) => {
  return formatCurrency(price);
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "upsell":
      return "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50";
    case "crosssell":
      return "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50";
    case "popular":
      return "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/50";
    default:
      return "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200/50";
  }
};

const getButtonColor = (type: string) => {
  switch (type) {
    case "upsell":
      return "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/25";
    case "crosssell":
      return "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/25";
    case "popular":
      return "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-purple-500/25";
    default:
      return "bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 shadow-gray-500/25";
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case "upsell":
      return "text-green-600";
    case "crosssell":
      return "text-blue-600";
    case "popular":
      return "text-purple-600";
    default:
      return "text-gray-600";
  }
};
</script>

<template>
  <div v-if="displayProducts.length > 0">
    <div class="mb-8 text-center">
      <h3 class="text-2xl font-bold text-gray-800 mb-2">{{ title }}</h3>
      <p v-if="subtitle" class="text-gray-600 max-w-2xl mx-auto">
        {{ subtitle }}
      </p>
    </div>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <div
        v-for="product in displayProducts"
        :key="product._id"
        :class="getTypeColor(type)"
        class="group relative border backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer overflow-hidden"
      >
        <!-- Decorative gradient overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"
        ></div>

        <!-- Stock indicator -->
        <div class="absolute top-4 right-4">
          <div
            :class="
              product.stock > 10
                ? 'bg-green-500'
                : product.stock > 0
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            "
            class="w-3 h-3 rounded-full animate-pulse"
          ></div>
        </div>

        <div class="relative z-10 flex flex-col h-full">
          <div class="flex-1 mb-4">
            <h4
              class="font-bold text-gray-800 text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors"
            >
              {{ product.name }}
            </h4>

            <div class="flex items-center gap-2 mb-3">
              <span
                v-if="product.category"
                :class="getIconColor(type)"
                class="text-xs font-medium px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm"
              >
                {{ product.category }}
              </span>
            </div>

            <div class="flex items-center justify-between mb-3">
              <div>
                <span class="text-xl font-bold text-gray-900">{{
                  formatPrice(product.price)
                }}</span>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500">In Stock</p>
                <p
                  :class="
                    product.stock > 10
                      ? 'text-green-600'
                      : product.stock > 0
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  "
                  class="font-semibold text-sm"
                >
                  {{ product.stock }}
                </p>
              </div>
            </div>
          </div>

          <button
            :class="getButtonColor(type)"
            class="w-full text-white text-sm py-3 px-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            @click="addToCart(product)"
            :disabled="product.stock <= 0"
          >
            <span v-if="product.stock <= 0">Out of Stock</span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add to Cart
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

/* Hover lift effect */
.group:hover {
  transform: translateY(-2px);
}

/* Card shine effect */
.group::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
  z-index: 1;
}

.group:hover::before {
  left: 100%;
}

/* Button pulse effect */
.group button:hover {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* Stock indicator animation */
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse-dot 2s infinite;
}
</style>
