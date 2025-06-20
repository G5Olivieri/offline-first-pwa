import { ref, computed } from "vue";
import { useNotificationStore } from "@/stores/notification-store";

export interface FormError {
  field: string;
  message: string;
}

export interface FormErrorState {
  errors: Record<string, string>;
  hasErrors: boolean;
  isSubmitting: boolean;
}

export function useFormErrors() {
  const notificationStore = useNotificationStore();

  const state = ref<FormErrorState>({
    errors: {},
    hasErrors: false,
    isSubmitting: false,
  });

  const hasFieldError = (field: string) => {
    return field in state.value.errors;
  };

  const getFieldError = (field: string) => {
    return state.value.errors[field] || "";
  };

  const setFieldError = (field: string, message: string) => {
    state.value.errors[field] = message;
    state.value.hasErrors = true;
  };

  const clearFieldError = (field: string) => {
    delete state.value.errors[field];
    state.value.hasErrors = Object.keys(state.value.errors).length > 0;
  };

  const clearAllErrors = () => {
    state.value.errors = {};
    state.value.hasErrors = false;
  };

  const setErrors = (errors: FormError[] | Record<string, string>) => {
    if (Array.isArray(errors)) {
      state.value.errors = errors.reduce(
        (acc, error) => {
          acc[error.field] = error.message;
          return acc;
        },
        {} as Record<string, string>,
      );
    } else {
      state.value.errors = { ...errors };
    }
    state.value.hasErrors = Object.keys(state.value.errors).length > 0;
  };

  const handleSubmissionError = (
    error: Error & { details?: FormError[]; status?: number },
  ) => {
    if (error.name === "ValidationError" && error.details) {
      // Handle validation errors
      setErrors(error.details);
      notificationStore.showWarning(
        "Validation Error",
        "Please check the highlighted fields and try again.",
      );
    } else if (error.message.includes("duplicate") || error.status === 409) {
      // Handle conflict errors
      notificationStore.showError(
        "Duplicate Entry",
        "A record with this information already exists.",
      );
    } else if (
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      // Handle network errors
      notificationStore.showError(
        "Connection Error",
        "Unable to save changes. Please check your connection and try again.",
      );
    } else {
      // Handle generic errors
      notificationStore.showError(
        "Submission Error",
        "Failed to save changes. Please try again.",
      );
    }
  };

  const withSubmission = async <T>(
    operation: () => Promise<T>,
    options?: {
      successMessage?: string;
      showSuccessMessage?: boolean;
    },
  ): Promise<T | null> => {
    try {
      state.value.isSubmitting = true;
      clearAllErrors();

      const result = await operation();

      if (options?.showSuccessMessage !== false) {
        notificationStore.showSuccess(
          "Success",
          options?.successMessage || "Changes saved successfully.",
        );
      }

      return result;
    } catch (error) {
      handleSubmissionError(
        error as Error & { details?: FormError[]; status?: number },
      );
      return null;
    } finally {
      state.value.isSubmitting = false;
    }
  };

  const validateField = (
    field: string,
    value: unknown,
    rules: ValidationRule[],
  ): boolean => {
    clearFieldError(field);

    for (const rule of rules) {
      const result = rule.validate(value);
      if (!result.valid) {
        setFieldError(field, result.message);
        return false;
      }
    }

    return true;
  };

  const validateForm = (
    formData: Record<string, unknown>,
    validationRules: Record<string, ValidationRule[]>,
  ): boolean => {
    clearAllErrors();
    let isValid = true;

    for (const [field, rules] of Object.entries(validationRules)) {
      const fieldValid = validateField(field, formData[field], rules);
      if (!fieldValid) {
        isValid = false;
      }
    }

    return isValid;
  };

  return {
    // State
    errors: computed(() => state.value.errors),
    hasErrors: computed(() => state.value.hasErrors),
    isSubmitting: computed(() => state.value.isSubmitting),

    // Methods
    hasFieldError,
    getFieldError,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setErrors,
    handleSubmissionError,
    withSubmission,
    validateField,
    validateForm,
  };
}

// Validation rule interface and common rules
export interface ValidationRule {
  validate: (value: unknown) => { valid: boolean; message: string };
}

export const ValidationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    validate: (value: unknown) => ({
      valid: value !== null && value !== undefined && value !== "",
      message,
    }),
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: unknown) => ({
      valid: !value || (typeof value === "string" && value.length >= min),
      message: message || `Must be at least ${min} characters long`,
    }),
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: unknown) => ({
      valid: !value || (typeof value === "string" && value.length <= max),
      message: message || `Must be no more than ${max} characters long`,
    }),
  }),

  email: (message = "Please enter a valid email address"): ValidationRule => ({
    validate: (value: unknown) => ({
      valid:
        !value ||
        (typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
      message,
    }),
  }),

  numeric: (message = "Please enter a valid number"): ValidationRule => ({
    validate: (value: unknown) => ({
      valid: !value || !isNaN(Number(value)),
      message,
    }),
  }),

  positiveNumber: (message = "Must be a positive number"): ValidationRule => ({
    validate: (value: unknown) => ({
      valid: !value || Number(value) >= 0,
      message,
    }),
  }),

  barcode: (message = "Please enter a valid barcode"): ValidationRule => ({
    validate: (value: unknown) => ({
      valid: !value || (typeof value === "string" && /^[0-9]{8,}$/.test(value)),
      message,
    }),
  }),
};
