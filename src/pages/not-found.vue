<template>
  <div
    class="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4"
  >
    <div class="max-w-md w-full text-center">
      <!-- 404 Icon -->
      <div class="mb-8">
        <svg
          class="mx-auto h-32 w-32 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0l3-3m1 8.291A7.962 7.962 0 0120 12h4l-3-3"
          />
        </svg>
      </div>

      <!-- Error Content -->
      <div class="mb-8">
        <h1 class="text-8xl font-bold text-gray-900 mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">
          Page Not Found
        </h2>
        <p class="text-gray-600 text-lg mb-8">
          Sorry, we couldn't find the page you're looking for. The page may have
          been moved, deleted, or you may have entered an incorrect URL.
        </p>
      </div>

      <!-- Actions -->
      <div class="space-y-4">
        <button
          @click="goHome"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg
            class="inline-block w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Go to Home
        </button>

        <button
          @click="goBack"
          class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <svg
            class="inline-block w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Go Back
        </button>
      </div>

      <!-- Additional Help -->
      <div
        class="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <h3 class="text-lg font-medium text-gray-900 mb-3">Need help?</h3>
        <div class="text-sm text-gray-600 space-y-2">
          <p>Try one of these popular pages:</p>
          <div class="flex flex-wrap gap-2 mt-3">
            <router-link
              to="/products"
              class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
            >
              Products
            </router-link>
            <router-link
              to="/customers"
              class="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full hover:bg-green-200 transition-colors"
            >
              Customers
            </router-link>
            <router-link
              to="/checkout"
              class="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full hover:bg-purple-200 transition-colors"
            >
              Checkout
            </router-link>
            <router-link
              to="/operators"
              class="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full hover:bg-orange-200 transition-colors"
            >
              Operators
            </router-link>
          </div>

          <!-- Report Issue Button -->
          <div class="mt-4 pt-3 border-t border-gray-200">
            <button
              @click="reportIssue"
              class="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Report this missing page
            </button>
          </div>
        </div>
      </div>

      <!-- Current URL Info (Development Mode) -->
      <div
        v-if="isDevelopment"
        class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left"
      >
        <h4 class="text-sm font-medium text-yellow-800 mb-2">
          Debug Info (Development Mode)
        </h4>
        <div class="text-xs text-yellow-700 space-y-1">
          <p><strong>Current URL:</strong> {{ currentUrl }}</p>
          <p><strong>Route Path:</strong> {{ $route.path }}</p>
          <p><strong>Route Name:</strong> {{ $route.name || "No name" }}</p>
          <p><strong>Params:</strong> {{ JSON.stringify($route.params) }}</p>
          <p><strong>Query:</strong> {{ JSON.stringify($route.query) }}</p>
          <p>
            <strong>Online Status:</strong>
            {{ isOnline ? "Online" : "Offline" }}
          </p>
          <p><strong>Timestamp:</strong> {{ new Date().toISOString() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { errorTrackingService } from "@/error/error-tracking-service";
import { useNotificationStore } from "@/stores/notification-store";
import { useOnlineStatusStore } from "@/stores/online-status-store";
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({
  name: "NotFound",
});

const router = useRouter();
const route = useRoute();
const notificationStore = useNotificationStore();
const onlineStatusStore = useOnlineStatusStore();

const isDevelopment = computed(() => import.meta.env.DEV);
const currentUrl = computed(() => window.location.href);
const isOnline = computed(() => onlineStatusStore.isOnline);
const canGoBack = computed(() => window.history.length > 1);

// Track 404 errors for analytics with enhanced context
onMounted(() => {
  const context = {
    component: "NotFound",
    operation: "404Navigation",
    url: route.fullPath,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    timestamp: new Date(),
  };

  errorTrackingService.track(
    new Error(`Page not found: ${route.fullPath}`),
    context
  );
});

const goHome = async () => {
  try {
    await router.push("/");
    notificationStore.showSuccess(
      "Navigation",
      "Successfully returned to home page"
    );
  } catch (error) {
    errorTrackingService.track(new Error("Failed to navigate to home page"), {
      error,
      component: "NotFound",
      operation: "goHome",
      url: route.fullPath,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
    });
    notificationStore.showError(
      "Navigation Error",
      "Failed to navigate to home page. Please try again."
    );
  }
};

const goBack = async () => {
  try {
    if (canGoBack.value) {
      window.history.back();
    } else {
      await goHome();
    }
  } catch (error) {
    console.error("Navigation error:", error);
    notificationStore.showError(
      "Navigation Error",
      "Unable to go back. Redirecting to home page."
    );
    await goHome();
  }
};

const reportIssue = () => {
  const context = {
    component: "NotFound",
    operation: "UserReportedIssue",
    url: route.fullPath,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    timestamp: new Date(),
  };

  // Track the user's report action
  errorTrackingService.track(
    new Error(`User reported 404 issue for path: ${route.fullPath}`),
    context
  );

  // Show confirmation notification
  notificationStore.showInfo(
    "Issue Reported",
    "Thank you for your feedback. Our team has been notified and will investigate this issue.",
    5000
  );
};
</script>

<style scoped>
/* Additional styles for the 404 page */
@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.animate-bounce-slow {
  animation: bounce 2s infinite;
}

/* Hover effects for interactive elements */
.hover-lift {
  transition: transform 0.2s ease-in-out;
}

.hover-lift:hover {
  transform: translateY(-2px);
}
</style>
