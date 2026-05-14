import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const loading = ref(true);

  const isLoggedIn = computed(() => !!user.value && !!accessToken.value);

  async function init() {
    loading.value = true;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      user.value = session.user;
      accessToken.value = session.access_token;
    }
    loading.value = false;

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null;
      accessToken.value = session?.access_token ?? null;
    });
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }

  async function loginWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    user.value = data.user;
    accessToken.value = data.session?.access_token ?? null;
    return data;
  }

  async function registerWithEmail(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  }

  async function logout() {
    await supabase.auth.signOut();
    user.value = null;
    accessToken.value = null;
  }

  return { user, accessToken, loading, isLoggedIn, init, loginWithGoogle, loginWithEmail, registerWithEmail, logout };
});
