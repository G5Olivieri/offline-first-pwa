import { useRouter } from 'vue-router';
import { analytics } from '../services/analytics-service';
import { createLogger } from '../services/logger-service';

/**
 * Composable for navigation actions with analytics tracking
 */
export function useNavigationActions() {
  const router = useRouter();
  const logger = createLogger('NavigationActions');

  /**
   * Navigate to home with analytics tracking
   */
  const goToHome = (source?: string) => {
    analytics.trackUserAction({
      action: 'navigate_to_home',
      category: 'navigation',
      label: 'user_initiated',
      metadata: {
        source: source || 'unknown',
        fromRoute: router.currentRoute.value.name as string,
      },
    });

    logger.debug('Navigating to home', { source, from: router.currentRoute.value.name });
    router.push('/');
  };

  /**
   * Navigate after successful entity creation/selection
   */
  const goToHomeAfterSuccess = (entityType: 'operator' | 'customer', entityName: string, source?: string) => {
    analytics.trackUserAction({
      action: 'navigate_after_success',
      category: 'navigation',
      label: `${entityType}_success`,
      metadata: {
        entityType,
        entityName,
        source: source || 'unknown',
        fromRoute: router.currentRoute.value.name as string,
      },
    });

    logger.debug('Navigating to home after success', {
      entityType,
      entityName,
      source,
      from: router.currentRoute.value.name
    });
    router.push('/');
  };

  /**
   * Navigate back with analytics tracking
   */
  const goBack = (source?: string) => {
    analytics.trackUserAction({
      action: 'navigate_back',
      category: 'navigation',
      label: 'user_initiated',
      metadata: {
        source: source || 'unknown',
        fromRoute: router.currentRoute.value.name as string,
      },
    });

    logger.debug('Navigating back', { source, from: router.currentRoute.value.name });
    router.back();
  };

  /**
   * Navigate to specific route with analytics tracking
   */
  const navigateTo = (route: string, source?: string, metadata?: Record<string, string | number | boolean>) => {
    analytics.trackUserAction({
      action: 'navigate_to_route',
      category: 'navigation',
      label: route,
      metadata: {
        targetRoute: route,
        source: source || 'unknown',
        fromRoute: router.currentRoute.value.name as string,
        ...metadata,
      },
    });

    logger.debug('Navigating to route', { route, source, from: router.currentRoute.value.name });
    router.push(route);
  };

  return {
    goToHome,
    goToHomeAfterSuccess,
    goBack,
    navigateTo,
  };
}
