import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProjectFullData } from "@/lib/data/queries";
import { FUNDING_SOURCE_TYPE_LABELS, PAYMENT_EVENT_STATUS_LABELS } from "@/lib/constants";

function formatEur(value: number) {
  return value.toLocaleString("sl-SI", { maximumFractionDigits: 0 }) + " €";
}

export default async function PaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = await getProjectFullData(user.id, id);

  if (!data) {
    notFound();
  }

  const { tasks, costItems, paymentEvents } = data;
  const taskByCode = new Map(tasks.map((task) => [task.code, task]));
  const costItemById = new Map(costItems.map((item) => [item.id, item]));

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Datum</th>
            <th className="px-3 py-2">Aktivnost</th>
            <th className="px-3 py-2">Strošek</th>
            <th className="px-3 py-2">Naziv plačila</th>
            <th className="px-3 py-2">Znesek</th>
            <th className="px-3 py-2">Vir financiranja</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paymentEvents.map((event) => {
            const task = taskByCode.get(event.taskCode);
            const costItem = costItemById.get(event.costItemId);

            return (
              <tr key={event.id}>
                <td className="px-3 py-2 text-slate-600">{event.plannedDate}</td>
                <td className="px-3 py-2 text-slate-600">
                  {task ? `${task.code} · ${task.name}` : event.taskCode}
                </td>
                <td className="px-3 py-2 text-slate-600">{costItem?.name ?? "—"}</td>
                <td className="px-3 py-2">{event.name}</td>
                <td className="px-3 py-2 font-medium">{formatEur(event.plannedAmount)}</td>
                <td className="px-3 py-2 text-slate-600">
                  {event.fundingSourceType ? FUNDING_SOURCE_TYPE_LABELS[event.fundingSourceType] : "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">{PAYMENT_EVENT_STATUS_LABELS[event.status]}</td>
              </tr>
            );
          })}
          {paymentEvents.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                Ni plačilnih dogodkov. Dodaj stroške na strani &quot;Stroški&quot;.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
