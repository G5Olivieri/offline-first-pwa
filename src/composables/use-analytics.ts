import { onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { analytics } from '../services/analytics-service';
import type {
  UserAction,
  ProductEvent,
  OrderEvent,
  ErrorEvent,
  PerformanceEvent
} from '../types/analytics';

export function useAnalytics() {
  const route = useRoute();

  let navigationStartTime = Date.now();
  let currentPage = route.name as string;

  // Track page views automatically
  onMounted(() => {
    trackPageView();
    // Note: Navigation tracking is now handled centrally in router.ts
  });

  // Cleanup on unmount
  onUnmounted(() => {
    // Track time spent on page
    const timeSpent = Date.now() - navigationStartTime;
    trackPerformance({
      metric: 'page_time',
      value: timeSpent,
      unit: 'ms',
      context: {
        page: currentPage,
      },
    });
  });

  const trackPageView = (pageName?: string) => {
    const page = pageName || route.name as string || route.path;
    analytics.page(page, {
      path: route.path,
      query: JSON.stringify(route.query),
      params: JSON.stringify(route.params),
    });
    currentPage = page;
    navigationStartTime = Date.now();
  };

  // User action tracking
  const trackAction = (action: UserAction) => {
    analytics.trackUserAction(action);
  };

  // Product-related tracking
  const trackProduct = (eventName: string, product: ProductEvent) => {
    analytics.trackProduct(eventName, product);
  };

  // Order-related tracking
  const trackOrder = (eventName: string, order: OrderEvent) => {
    analytics.trackOrder(eventName, order);
  };

  // Error tracking
  const trackError = (error: ErrorEvent) => {
    analytics.trackError(error);
  };

  // Performance tracking
  const trackPerformance = (performance: PerformanceEvent) => {
    analytics.trackPerformance(performance);
  };

  // Common POS actions
  const trackProductScan = (barcode: string, productName?: string) => {
    trackProduct('product_scanned', {
      barcode,
      productName,
    });
  };

  const trackProductAdd = (product: ProductEvent, quantity = 1) => {
    trackProduct('product_added_to_cart', {
      ...product,
      quantity,
    });
  };

  const trackOrderComplete = (order: OrderEvent) => {
    trackOrder('order_completed', order);
  };

  const trackOrderAbandon = (order: Partial<OrderEvent>) => {
    trackOrder('order_abandoned', order as OrderEvent);
  };

  const trackLogin = (operatorId: string) => {
    trackAction({
      action: 'login',
      category: 'authentication',
      metadata: {
        operatorId,
      },
    });
  };

  const trackLogout = (operatorId: string, sessionDuration?: number) => {
    trackAction({
      action: 'logout',
      category: 'authentication',
      metadata: {
        operatorId,
        sessionDuration: sessionDuration || 0,
      },
    });
  };

  const trackSearch = (query: string, resultCount: number, category = 'products') => {
    trackAction({
      action: 'search',
      category: 'search',
      label: query,
      value: resultCount,
      metadata: {
        searchCategory: category,
      },
    });
  };

  const trackButtonClick = (buttonName: string, context?: Record<string, string | number | boolean>) => {
    trackAction({
      action: 'button_click',
      category: 'ui_interaction',
      label: buttonName,
      metadata: context,
    });
  };

  const trackFormSubmit = (formName: string, success: boolean, errors?: string[]) => {
    trackAction({
      action: 'form_submit',
      category: 'form_interaction',
      label: formName,
      value: success ? 1 : 0,
      metadata: {
        success,
        errors: errors?.join(', ') || '',
      },
    });
  };

  const trackDialogOpen = (dialogName: string) => {
    trackAction({
      action: 'dialog_open',
      category: 'ui_interaction',
      label: dialogName,
    });
  };

  const trackDialogClose = (dialogName: string, action = 'close') => {
    trackAction({
      action: 'dialog_close',
      category: 'ui_interaction',
      label: dialogName,
      metadata: {
        closeAction: action,
      },
    });
  };

  // Return all tracking functions
  return {
    // Generic tracking
    trackAction,
    trackProduct,
    trackOrder,
    trackError,
    trackPerformance,
    trackPageView,

    // POS-specific tracking
    trackProductScan,
    trackProductAdd,
    trackOrderComplete,
    trackOrderAbandon,
    trackLogin,
    trackLogout,
    trackSearch,

    // UI interaction tracking
    trackButtonClick,
    trackFormSubmit,
    trackDialogOpen,
    trackDialogClose,

    // Analytics instance access
    analytics,
  };
}
