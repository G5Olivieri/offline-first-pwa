<template>
  <div class="homepage-recommendations space-y-6">
    <!-- Trending Products -->
    <RecommendationList
      :recommendations="trendingRecommendations"
      :context="RecommendationContext.HOMEPAGE"
      :is-loading="isLoading"
      :error="error"
      :max-visible="6"
      title="Trending Now"
      @add-to-cart="handleAddToCart"
      @click-recommendation="handleClickRecommendation"
      @dismiss-recommendation="handleDismissRecommendation"
    />

    <!-- Personalized Recommendations -->
    <RecommendationList
      v-if="customer && personalizedRecommendations.length > 0"
      :recommendations="personalizedRecommendations"
      :context="RecommendationContext.CUSTOMER_PROFILE"
      :is-loading="isLoading"
      :error="error"
      :max-visible="4"
      title="Recommended for You"
      @add-to-cart="handleAddToCart"
      @click-recommendation="handleClickRecommendation"
      @dismiss-recommendation="handleDismissRecommendation"
    />

    <!-- High Stock Items -->
    <RecommendationList
      v-if="inventoryRecommendations.length > 0"
      :recommendations="inventoryRecommendations"
      :context="RecommendationContext.HOMEPAGE"
      :is-loading="isLoading"
      :error="error"
      :max-visible="4"
      title="High Availability"
      @add-to-cart="handleAddToCart"
      @click-recommendation="handleClickRecommendation"
      @dismiss-recommendation="handleDismissRecommendation"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref } from "vue";
import type { ProductRecommendation } from "@/types/recommendation";
import {
  RecommendationContext,
  RecommendationType,
} from "@/types/recommendation";
import type { Customer } from "@/customer/customer";
import { useRecommendationStore } from "@/stores/recommendation-store";
import RecommendationList from "./recommendation-list.vue";

interface Props {
  customer?: Customer;
}

interface Emits {
  (
    e: "add-recommendation-to-cart",
    recommendation: ProductRecommendation,
  ): void;
  (e: "view-product", recommendation: ProductRecommendation): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const recommendationStore = useRecommendationStore();
const allRecommendations = ref<ProductRecommendation[]>([]);

// Computed
const isLoading = computed(() => recommendationStore.isLoading);
const error = computed(() => recommendationStore.error);

const trendingRecommendations = computed(() =>
  allRecommendations.value.filter(
    (rec) =>
      rec.type === RecommendationType.TRENDING ||
      rec.type === RecommendationType.SEASONAL,
  ),
);

const personalizedRecommendations = computed(() =>
  allRecommendations.value.filter(
    (rec) =>
      rec.type === RecommendationType.CUSTOMER_BASED ||
      rec.type === RecommendationType.REORDER,
  ),
);

const inventoryRecommendations = computed(() =>
  allRecommendations.value.filter(
    (rec) => rec.type === RecommendationType.INVENTORY_BASED,
  ),
);

// Methods
async function loadRecommendations(): Promise<void> {
  const recommendations =
    await recommendationStore.getRecommendationsForHomepage(props.customer);
  allRecommendations.value = recommendations;
}

async function loadPersonalizedRecommendations(): Promise<void> {
  if (props.customer) {
    const personalizedRecs =
      await recommendationStore.getRecommendationsForCustomer(props.customer);
    // Merge with existing recommendations, avoiding duplicates
    const existingIds = new Set(
      allRecommendations.value.map((r) => r.product._id),
    );
    const newRecs = personalizedRecs.filter(
      (rec) => !existingIds.has(rec.product._id),
    );
    allRecommendations.value = [...allRecommendations.value, ...newRecs];
  }
}

function handleAddToCart(recommendation: ProductRecommendation): void {
  emit("add-recommendation-to-cart", recommendation);
}

function handleClickRecommendation(
  recommendation: ProductRecommendation,
): void {
  emit("view-product", recommendation);
}

function handleDismissRecommendation(
  recommendation: ProductRecommendation,
): void {
  // Remove the recommendation from the current list
  allRecommendations.value = allRecommendations.value.filter(
    (rec) => rec.id !== recommendation.id,
  );
}

// Lifecycle
onMounted(async () => {
  await loadRecommendations();
  if (props.customer) {
    await loadPersonalizedRecommendations();
  }
});

// Watch for customer changes
watch(
  () => props.customer,
  async (newCustomer) => {
    if (newCustomer) {
      await loadPersonalizedRecommendations();
    } else {
      // Remove personalized recommendations when customer is removed
      allRecommendations.value = allRecommendations.value.filter(
        (rec) =>
          rec.type !== RecommendationType.CUSTOMER_BASED &&
          rec.type !== RecommendationType.REORDER,
      );
    }
  },
);
</script>

<style scoped>
.homepage-recommendations {
  padding: 1rem 0;
}
</style>
