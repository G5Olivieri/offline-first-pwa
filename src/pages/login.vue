<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gray-50"
  >
    <div class="w-full max-w-xs p-8 bg-white rounded shadow">
      <h1 class="mb-6 text-2xl font-bold text-center">Login</h1>
      <form @submit.prevent="onLogin">
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Username</label>
          <input
            v-model="username"
            class="w-full px-3 py-2 border rounded"
            type="text"
            autocomplete="username"
          />
        </div>
        <div class="mb-6">
          <label class="block mb-1 text-sm font-medium">Password</label>
          <input
            v-model="password"
            class="w-full px-3 py-2 border rounded"
            type="password"
            autocomplete="current-password"
          />
        </div>
        <button
          :disabled="loading"
          class="w-full py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
          type="submit"
        >
          <span v-if="loading">Logging in...</span>
          <span v-else>Login</span>
        </button>
        <div v-if="error" class="mt-4 text-sm text-red-600 text-center">
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "LoginPage",
});
import { config } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";
import { useOnline } from "@vueuse/core";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const username = ref("");
const password = ref("");
const loading = ref(true);
const error = ref("");
const online = useOnline();
const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  auth
    .checkLoginStatus()
    .then((isLoggedIn) => {
      if (isLoggedIn) {
        const next = String(router.currentRoute.value.query.next || "/");
        router.push(next);
      }
    })
    .finally(() => {
      loading.value = false;
    });
});
async function onLogin() {
  error.value = "";
  loading.value = true;
  if (!online.value) {
    loading.value = false;
    return;
  }
  try {
    await auth.login(username.value, password.value, config.couchdbUrl);
    const next = String(router.currentRoute.value.query.next || "/");
    router.push(next);
  } catch (e) {
    console.error("Login error:", e);
    error.value = "Invalid credentials or server unreachable.";
  } finally {
    loading.value = false;
  }
}
</script>
