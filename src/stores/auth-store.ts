import { router } from "@/router";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const isLoggedIn = ref(false);

  async function login(user: string, pass: string, couchUrl: string) {
    const res = await fetch(`${couchUrl}/_session`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "include",
      body: new URLSearchParams({ name: user, password: pass }),
    });
    if (!res.ok) throw new Error("Invalid credentials or server unreachable.");
    const data = await res.json();
    if (!data.ok) throw new Error("Login failed: " + data.reason);
    isLoggedIn.value = true;
  }

  async function logout() {
    await fetch(`${import.meta.env.VITE_COUCHDB_URL}/_session`, {
      method: "DELETE",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "include",
    });
    isLoggedIn.value = false;
  }

  async function handleUnauthorized() {
    isLoggedIn.value = false;
    router.push({ name: "login" });
  }

  async function checkLoginStatus() {
    try {
      const res = await fetch(`${import.meta.env.VITE_COUCHDB_URL}/_session`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to check login status.");
      const data = await res.json();
      if (!data.userCtx || !data.userCtx.name) {
        isLoggedIn.value = false;
        return false;
      }
      isLoggedIn.value = data.ok;
      return true;
    } catch (error) {
      console.error("Error checking login status:", error);
      isLoggedIn.value = false;
      return false;
    }
  }

  return { isLoggedIn, login, logout, checkLoginStatus, handleUnauthorized };
});
