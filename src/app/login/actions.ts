"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  info?: string;
};

export async function signIn(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Prijava ni uspela. Preveri e-pošto in geslo." };
  }

  redirect("/projects");
}

export async function signUp(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");

  if (password.length < 6) {
    return { error: "Geslo mora imeti vsaj 6 znakov." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: `Registracija ni uspela: ${error.message}` };
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      display_name: displayName || null
    });
  }

  if (!data.session) {
    return { info: "Registracija je uspela. Preveri e-pošto in potrdi račun, nato se prijavi." };
  }

  redirect("/projects");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
