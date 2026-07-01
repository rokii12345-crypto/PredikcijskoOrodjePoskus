import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProjectFullData, paymentRules } from "@/lib/data/queries";
import { COST_STATUS_LABELS, FUNDING_SOURCE_TYPE_LABELS } from "@/lib/constants";
import { deleteCostItem, upsertCostItem } from "./actions";

export default async function CostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = getProjectFullData(user.id, id);

  if (!data) {
    notFound();
  }

  const { project, tasks, costItems } = data;
  const nonSummaryTasks = tasks.filter((task) => task.type !== "summary").sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Aktivnost</th>
              <th className="px-3 py-2">Naziv stroška</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ocenjeno</th>
              <th className="px-3 py-2">Pogodbeno</th>
              <th className="px-3 py-2">Dejansko</th>
              <th className="px-3 py-2">Plačilno pravilo</th>
              <th className="px-3 py-2">Vir financiranja</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {costItems.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2">
                  <form id={`cost-${item.id}`} action={upsertCostItem}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="costItemId" value={item.id} />
                    <select name="taskCode" defaultValue={item.taskCode} className="w-40 rounded-md border border-slate-300 px-2 py-1 text-xs">
                      {nonSummaryTasks.map((task) => (
                        <option key={task.code} value={task.code}>
                          {task.code} · {task.name}
                        </option>
                      ))}
                    </select>
                  </form>
                </td>
                <td className="px-3 py-2">
                  <input form={`cost-${item.id}`} name="name" defaultValue={item.name} className="w-48 rounded-md border border-slate-300 px-2 py-1" />
                </td>
                <td className="px-3 py-2">
                  <select form={`cost-${item.id}`} name="status" defaultValue={item.status} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                    {Object.entries(COST_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    form={`cost-${item.id}`}
                    type="number"
                    name="estimatedAmount"
                    defaultValue={item.estimatedAmount}
                    className="w-24 rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    form={`cost-${item.id}`}
                    type="number"
                    name="contractedAmount"
                    defaultValue={item.contractedAmount ?? ""}
                    className="w-24 rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    form={`cost-${item.id}`}
                    type="number"
                    name="actualAmount"
                    defaultValue={item.actualAmount ?? ""}
                    className="w-24 rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    form={`cost-${item.id}`}
                    name="paymentRuleCode"
                    defaultValue={item.paymentRuleCode}
                    className="w-48 rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    {paymentRules.map((rule) => (
                      <option key={rule.code} value={rule.code}>
                        {rule.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    form={`cost-${item.id}`}
                    name="defaultFundingSourceType"
                    defaultValue={item.defaultFundingSourceType ?? "own_funds"}
                    className="w-40 rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    {Object.entries(FUNDING_SOURCE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <button form={`cost-${item.id}`} type="submit" className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100">
                    Shrani
                  </button>
                  <form action={deleteCostItem} className="mt-1">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="costItemId" value={item.id} />
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

      <details className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">+ Dodaj nov strošek</summary>
        <form action={upsertCostItem} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="projectId" value={project.id} />
          <label className="text-xs font-medium text-slate-600">
            Aktivnost
            <select name="taskCode" className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm">
              {nonSummaryTasks.map((task) => (
                <option key={task.code} value={task.code}>
                  {task.code} · {task.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Naziv stroška
            <input name="name" required className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Ocenjeni znesek (€)
            <input name="estimatedAmount" type="number" required className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Plačilno pravilo
            <select name="paymentRuleCode" className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm">
              {paymentRules.map((rule) => (
                <option key={rule.code} value={rule.code}>
                  {rule.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Vir financiranja
            <select name="defaultFundingSourceType" className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm">
              {Object.entries(FUNDING_SOURCE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Dodaj strošek
            </button>
          </div>
        </form>
      </details>

      <p className="text-xs text-slate-400">Vsi zneski so v EUR, DDV je privzeto vključen v znesek.</p>
    </div>
  );
}
