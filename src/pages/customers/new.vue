<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useField, useForm } from "vee-validate";
import { ref } from "vue";
import * as z from "zod";
import { router } from "../../router";
import { useCustomerStore } from "../../stores/customer-store";

const customerStore = useCustomerStore();
const isSubmitting = ref(false);
const submitError = ref<string>("");

const validationSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must not exceed 100 characters"),
    document: z.string().min(3, "Document must be at least 3 characters").max(50, "Document must not exceed 50 characters"),
  })
);

const { handleSubmit, errors, resetForm } = useForm({
  validationSchema,
});

const { value: name } = useField("name");
const { value: document } = useField("document");

const onSubmit = handleSubmit(async (values) => {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  submitError.value = "";

  try {
    const { name, document } = values;
    const newCustomer = await customerStore.createCustomer({ name, document });
    await customerStore.setCustomer(newCustomer._id);
    router.push("/");
  } catch (error) {
    console.error("Error creating customer:", error);
    submitError.value = "Failed to create customer. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
});

const clearForm = () => {
  resetForm();
  submitError.value = "";
};

const goBack = () => {
  router.push("/customers");
};
</script>
<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <!-- Header Section -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
          Add New Customer
        </h1>
        <p class="text-gray-600 max-w-lg mx-auto">
          Create a new customer profile to personalize their shopping experience
        </p>
      </div>

      <!-- Navigation -->
      <div class="mb-6">
        <button
          @click="goBack"
          class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customer Selection
        </button>
      </div>

      <!-- Form Section -->
      <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
        <!-- Error Alert -->
        <div v-if="submitError" class="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-red-800">Error Creating Customer</h3>
              <p class="text-red-700 text-sm">{{ submitError }}</p>
            </div>
          </div>
        </div>

        <form @submit.prevent="onSubmit" class="space-y-6">
          <!-- Customer Name Field -->
          <div class="form-group">
            <label for="name" class="block text-sm font-semibold text-gray-700 mb-3">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Name
              </div>
            </label>
            <input
              id="name"
              v-model="name"
              type="text"
              placeholder="Enter customer's full name"
              class="w-full px-6 py-4 bg-white/90 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder-zinc-300 text-lg"
              :class="{ 'border-red-500 bg-red-50': errors.name }"
              :disabled="isSubmitting"
            />
            <p v-if="errors.name" class="text-red-600 text-sm mt-2 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {{ errors.name }}
            </p>
          </div>

          <!-- Document Field -->
          <div class="form-group">
            <label for="document" class="block text-sm font-semibold text-gray-700 mb-3">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Document ID
              </div>
            </label>
            <input
              id="document"
              v-model="document"
              type="text"
              placeholder="Enter ID, CPF, passport, or other document number"
              class="w-full px-6 py-4 bg-white/90 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder-zinc-300 text-lg"
              :class="{ 'border-red-500 bg-red-50': errors.document }"
              :disabled="isSubmitting"
            />
            <p v-if="errors.document" class="text-red-600 text-sm mt-2 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {{ errors.document }}
            </p>
            <p class="text-gray-500 text-sm mt-2">
              This will be used to identify the customer in future transactions
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              <svg v-if="isSubmitting" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {{ isSubmitting ? 'Creating Customer...' : 'Create Customer' }}
            </button>

            <button
              type="button"
              @click="clearForm"
              :disabled="isSubmitting"
              class="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Clear Form
            </button>
          </div>
        </form>

        <!-- Help Text -->
        <div class="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-blue-800 mb-2">Customer Information</h3>
              <ul class="text-blue-700 text-sm space-y-1">
                <li>• Customer name should be their full legal name</li>
                <li>• Document ID can be any form of identification (ID card, CPF, passport, etc.)</li>
                <li>• This information will be stored securely and used for future transactions</li>
                <li>• Once created, the customer will be automatically selected for the current order</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* New customer form animations and effects */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Page entrance animation */
.min-h-screen {
  animation: fadeInUp 0.6s ease-out;
}

/* Header animation */
.text-center:first-child {
  animation: slideInDown 0.8s ease-out;
}

/* Form section animation */
.bg-white\/80 {
  animation: fadeInUp 1s ease-out;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.bg-white\/80:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
}

/* Form group animations */
.form-group {
  animation: fadeInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.form-group:nth-child(1) {
  animation-delay: 0.1s;
}

.form-group:nth-child(2) {
  animation-delay: 0.2s;
}

/* Input field effects */
input {
  transition: all 0.3s ease;
}

input:focus {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(147, 51, 234, 0.1);
}

input:hover:not(:disabled) {
  transform: translateY(-1px);
}

/* Error state animation */
.border-red-500 {
  animation: shake 0.5s ease-in-out;
}

/* Label hover effects */
label {
  transition: all 0.2s ease;
}

.form-group:hover label {
  color: #7c3aed;
}

/* Icon animations */
svg {
  transition: all 0.2s ease;
}

.form-group:hover svg {
  transform: scale(1.1);
  color: #7c3aed;
}

/* Button animations */
button {
  transition: all 0.3s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

/* Submit button special effects */
button[type="submit"]:hover:not(:disabled) {
  animation: pulse 1s infinite;
}

/* Loading button effect */
.loading-button {
  position: relative;
  overflow: hidden;
}

.loading-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s infinite;
}

/* Error alert animation */
.bg-red-50 {
  animation: bounceIn 0.5s ease-out;
}

/* Help section animation */
.bg-gradient-to-r.from-blue-50 {
  animation: fadeInUp 0.8s ease-out;
  animation-delay: 0.3s;
  animation-fill-mode: both;
}

/* Gradient text animation */
.bg-clip-text {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Navigation button hover */
.inline-flex:hover {
  transform: translateX(-2px);
}

/* Form validation states */
.is-valid {
  border-color: #10b981;
  background-color: #f0fdf4;
}

.is-invalid {
  border-color: #ef4444;
  background-color: #fef2f2;
}

/* Focus within effects */
.form-group:focus-within label {
  color: #7c3aed;
  transform: translateY(-2px);
}

.form-group:focus-within svg {
  color: #7c3aed;
  transform: scale(1.1);
}

/* Placeholder animation */
input::placeholder {
  transition: all 0.3s ease;
}

input:focus::placeholder {
  transform: translateY(-2px);
  opacity: 0.7;
}

/* Help text hover effects */
.bg-gradient-to-r:hover {
  transform: scale(1.01);
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .flex-col {
    gap: 0.75rem;
  }

  .px-8 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .py-4 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .text-lg {
    font-size: 1rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Accessibility improvements */
input:focus,
button:focus {
  outline: 2px solid rgba(147, 51, 234, 0.5);
  outline-offset: 2px;
}

/* Form completion states */
.form-complete {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
}

.form-complete svg {
  color: white;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(147, 51, 234, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(147, 51, 234, 0.5);
}

/* Print styles */
@media print {
  .min-h-screen {
    min-height: auto;
  }

  .bg-gradient-to-br {
    background: white;
  }

  .shadow-xl {
    box-shadow: none;
  }

  button {
    display: none;
  }
}

/* Keyboard navigation enhancement */
.focus-ring:focus {
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.3);
}

/* Success state animation */
.success-state {
  animation: bounceIn 0.6s ease-out;
}

/* Error recovery animation */
.error-recovery {
  animation: fadeInUp 0.4s ease-out;
}
</style>
