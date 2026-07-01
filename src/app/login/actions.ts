"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { execute, queryOne } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/session";

export type AuthActionState = {
  error?: string;
  info?: string;
};

async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
}

export async function signIn(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await queryOne<{ id: string; passwordHash: string }>(
    "select id, password_hash as passwordHash from users where email = :email",
    { email }
  );

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Prijava ni uspela. Preveri e-pošto in geslo." };
  }

  await setSessionCookie(user.id);
  redirect("/projects");
}

export async function signUp(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Vnesi veljaven e-poštni naslov." };
  }

  if (password.length < 6) {
    return { error: "Geslo mora imeti vsaj 6 znakov." };
  }

  const existing = await queryOne("select id from users where email = :email", { email });
  if (existing) {
    return { error: "Uporabnik s to e-pošto že obstaja. Prijavi se." };
  }

  const userId = randomUUID();
  await execute(
    "insert into users (id, email, password_hash, display_name) values (:id, :email, :passwordHash, :displayName)",
    { id: userId, email, passwordHash: hashPassword(password), displayName: displayName || null }
  );

  await setSessionCookie(userId);
  redirect("/projects");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
