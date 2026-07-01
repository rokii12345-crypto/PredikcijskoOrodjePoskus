"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthActionState } from "./actions";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);

  const state = mode === "login" ? signInState : signUpState;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">GradnjaPlan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Terminski plan in denarni tok za gradnjo hiše.
        </p>

        <div className="mt-6 flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-2 ${mode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            Prijava
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-md py-2 ${mode === "register" ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            Registracija
          </button>
        </div>

        {mode === "login" ? (
          <form action={signInAction} className="mt-6 space-y-4">
            <Field label="E-pošta" name="email" type="email" />
            <Field label="Geslo" name="password" type="password" />
            <SubmitButton pending={signInPending} label="Prijava" />
          </form>
        ) : (
          <form action={signUpAction} className="mt-6 space-y-4">
            <Field label="Ime in priimek" name="displayName" type="text" required={false} />
            <Field label="E-pošta" name="email" type="email" />
            <Field label="Geslo (vsaj 6 znakov)" name="password" type="password" />
            <SubmitButton pending={signUpPending} label="Ustvari račun" />
          </form>
        )}

        {state.error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
        {state.info && (
          <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.info}</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  required = true
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
      />
    </label>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
    >
      {pending ? "Prosim počakaj..." : label}
    </button>
  );
}
