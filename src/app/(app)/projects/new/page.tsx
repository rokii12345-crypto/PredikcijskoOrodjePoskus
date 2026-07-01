"use client";

import { useActionState } from "react";
import { createProject, type NewProjectState } from "../actions";

const initialState: NewProjectState = {};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewProjectPage() {
  const [state, action, pending] = useActionState(createProject, initialState);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900">Nov projekt — novogradnja hiše</h1>
      <p className="mt-2 text-sm text-slate-500">
        Aplikacija bo iz standardne predloge ustvarila terminski plan, demo stroške in tri
        privzete vire financiranja (lastna sredstva, kredit, rezerva), ki jih lahko kasneje
        prilagodiš.
      </p>

      <form action={action} className="mt-8 space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          Ime projekta
          <input
            name="name"
            type="text"
            required
            placeholder="npr. Hiša Novak"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Predviden datum začetka gradnje
          <input
            name="startDate"
            type="date"
            required
            defaultValue={todayIso()}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Predloga
          <select
            disabled
            className="mt-1 block w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
          >
            <option>Novogradnja hiše — standardni plan</option>
          </select>
        </label>

        {state.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Ustvarjam projekt..." : "Ustvari projekt"}
        </button>
      </form>
    </div>
  );
}
