import { useRouter } from 'vue-router';
import { createLogger } from '../services/logger-service';

/**
 * Composable for navigation actions
 */
export function useNavigationActions() {
  const router = useRouter();
  const logger = createLogger('NavigationActions');

  /**
   * Navigate to home
   */
  const goToHome = (source?: string) => {
    logger.debug('Navigating to home', { source, from: router.currentRoute.value.name });
    router.push('/');
  };

  /**
   * Navigate after successful entity creation/selection
   */
  const goToHomeAfterSuccess = (entityType: 'operator' | 'customer', entityName: string, source?: string) => {
    logger.debug('Navigating to home after success', {
      entityType,
      entityName,
      source,
      from: router.currentRoute.value.name
    });
    router.push('/');
  };

  /**
   * Navigate back
   */
  const goBack = (source?: string) => {
    logger.debug('Navigating back', { source, from: router.currentRoute.value.name });
    router.back();
  };

  /**
   * Navigate to specific route
   */
  const navigateTo = (route: string, source?: string, _metadata?: Record<string, string | number | boolean>) => {
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
