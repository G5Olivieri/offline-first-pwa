<template>
  <div class="checkout-recommendations">
    <RecommendationList
      :recommendations="checkoutRecommendations"
      :context="RecommendationContext.CHECKOUT"
      :is-loading="isLoading"
      :error="error"
      :max-visible="4"
      :show-dismiss="true"
      title="Frequently Bought Together"
      @add-to-cart="handleAddToCart"
      @click-recommendation="handleClickRecommendation"
      @dismiss-recommendation="handleDismissRecommendation"
      @dismiss-all="handleDismissAll"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import type { ProductRecommendation } from '../types/recommendation';
import { RecommendationContext } from '../types/recommendation';
import type { Item } from '../types/order';
import type { Customer } from '../types/customer';
import { useRecommendationStore } from '../stores/recommendation-store';
import RecommendationList from './recommendation-list.vue';

interface Props {
  cartItems: Item[];
  customer?: Customer;
}

interface Emits {
  (e: 'add-recommendation-to-cart', recommendation: ProductRecommendation): void;
  (e: 'view-product', recommendation: ProductRecommendation): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const recommendationStore = useRecommendationStore();

// Computed
const checkoutRecommendations = computed(() => recommendationStore.checkoutRecommendations);
const isLoading = computed(() => recommendationStore.isLoading);
const error = computed(() => recommendationStore.error);

// Methods
async function loadRecommendations(): Promise<void> {
  if (props.cartItems.length > 0) {
    await recommendationStore.getRecommendationsForCheckout(props.cartItems, props.customer);
  }
}

function handleAddToCart(recommendation: ProductRecommendation): void {
  emit('add-recommendation-to-cart', recommendation);
}

function handleClickRecommendation(recommendation: ProductRecommendation): void {
  emit('view-product', recommendation);
}

function handleDismissRecommendation(recommendation: ProductRecommendation): void {
  // Remove the recommendation from the current list
  // The tracking is already handled in the RecommendationList component
  console.log('Dismissed recommendation:', recommendation.product.name);
}

function handleDismissAll(): void {
  // Clear all checkout recommendations
  recommendationStore.refreshRecommendations(RecommendationContext.CHECKOUT);
}

// Lifecycle
onMounted(() => {
  loadRecommendations();
});

// Watch for cart changes
watch(
  () => props.cartItems,
  () => {
    loadRecommendations();
  },
  { deep: true }
);

// Watch for customer changes
watch(
  () => props.customer,
  () => {
    loadRecommendations();
  }
);
</script>

<style scoped>
.checkout-recommendations {
  margin-top: 1rem;
}
</style>
