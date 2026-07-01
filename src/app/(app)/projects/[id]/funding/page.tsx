import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProjectFullData } from "@/lib/data/queries";
import { FUNDING_SOURCE_KIND_LABELS } from "@/lib/constants";
import { deleteFundingSource, upsertFundingSource } from "./actions";

function formatEur(value: number) {
  return value.toLocaleString("sl-SI", { maximumFractionDigits: 0 }) + " €";
}

export default async function FundingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = getProjectFullData(user.id, id);

  if (!data) {
    notFound();
  }

  const { project, fundingSources } = data;

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Naziv</th>
              <th className="px-3 py-2">Vrsta</th>
              <th className="px-3 py-2">Najvišji znesek</th>
              <th className="px-3 py-2">Na voljo od</th>
              <th className="px-3 py-2">Opomba</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fundingSources.map((source) => (
              <tr key={source.id}>
                <td className="px-3 py-2">
                  <form id={`funding-${source.id}`} action={upsertFundingSource}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="fundingSourceId" value={source.id} />
                    <input name="name" defaultValue={source.name} className="w-40 rounded-md border border-slate-300 px-2 py-1" />
                  </form>
                </td>
                <td className="px-3 py-2">
                  <select form={`funding-${source.id}`} name="type" defaultValue={source.type} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                    {Object.entries(FUNDING_SOURCE_KIND_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    form={`funding-${source.id}`}
                    type="number"
                    name="availableAmount"
                    defaultValue={source.availableAmount}
                    className="w-28 rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    form={`funding-${source.id}`}
                    type="date"
                    name="availableFrom"
                    defaultValue={source.availableFrom}
                    className="rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input form={`funding-${source.id}`} name="note" defaultValue={source.note ?? ""} className="w-40 rounded-md border border-slate-300 px-2 py-1" />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <button form={`funding-${source.id}`} type="submit" className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100">
                    Shrani
                  </button>
                  <form action={deleteFundingSource} className="mt-1">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="fundingSourceId" value={source.id} />
                    <button type="submit" className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                      Izbriši
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Skupaj razpoložljivo: {formatEur(fundingSources.reduce((sum, s) => sum + s.availableAmount, 0))}. Kredit je v MVP
        poenostavljen vir financiranja, ne bančni kalkulator obresti in anuitet.
      </p>

      <details className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">+ Dodaj vir financiranja</summary>
        <form action={upsertFundingSource} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="projectId" value={project.id} />
          <label className="text-xs font-medium text-slate-600">
            Naziv
            <input name="name" required className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Vrsta
            <select name="type" className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm">
              {Object.entries(FUNDING_SOURCE_KIND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Najvišji znesek (€)
            <input name="availableAmount" type="number" required className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Na voljo od
            <input name="availableFrom" type="date" required defaultValue={project.startDate} className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Dodaj vir financiranja
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
