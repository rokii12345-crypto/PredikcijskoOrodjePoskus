import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProjectFullData } from "@/lib/data/queries";
import { deleteInvestor, upsertInvestor } from "./actions";

export default async function InvestorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = await getProjectFullData(user.id, id);

  if (!data) {
    notFound();
  }

  const { project, investors } = data;
  const totalShare = investors.reduce((sum, investor) => sum + investor.sharePercent, 0);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Ime</th>
              <th className="px-3 py-2">Delež (%)</th>
              <th className="px-3 py-2">E-pošta</th>
              <th className="px-3 py-2">Opomba</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {investors.map((investor) => (
              <tr key={investor.id}>
                <td className="px-3 py-2">
                  <form id={`investor-${investor.id}`} action={upsertInvestor}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="investorId" value={investor.id} />
                    <input name="name" defaultValue={investor.name} className="w-40 rounded-md border border-slate-300 px-2 py-1" />
                  </form>
                </td>
                <td className="px-3 py-2">
                  <input
                    form={`investor-${investor.id}`}
                    type="number"
                    name="sharePercent"
                    defaultValue={investor.sharePercent}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input form={`investor-${investor.id}`} name="email" defaultValue={investor.email ?? ""} className="w-48 rounded-md border border-slate-300 px-2 py-1" />
                </td>
                <td className="px-3 py-2">
                  <input form={`investor-${investor.id}`} name="note" defaultValue={investor.note ?? ""} className="w-40 rounded-md border border-slate-300 px-2 py-1" />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <button form={`investor-${investor.id}`} type="submit" className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100">
                    Shrani
                  </button>
                  <form action={deleteInvestor} className="mt-1">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="investorId" value={investor.id} />
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

      <p className={`text-xs ${totalShare !== 100 ? "text-amber-600" : "text-slate-400"}`}>
        Skupni delež investitorjev: {totalShare}%{totalShare !== 100 ? " — priporočeno je, da vsota znaša 100 %." : ""}
      </p>

      <details className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">+ Dodaj investitorja</summary>
        <form action={upsertInvestor} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="projectId" value={project.id} />
          <label className="text-xs font-medium text-slate-600">
            Ime
            <input name="name" required className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Delež (%)
            <input name="sharePercent" type="number" required className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            E-pošta
            <input name="email" type="email" className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Dodaj
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
