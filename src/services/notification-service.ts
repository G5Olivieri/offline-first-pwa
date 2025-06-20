export interface NotificationService {
  showSuccess(title: string, message: string, duration?: number): void;
  showError(title: string, message: string, duration?: number): void;
  showWarning(title: string, message: string, duration?: number): void;
  showInfo(title: string, message: string, duration?: number): void;
}
