import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProjectFullData, paymentRules } from "@/lib/data/queries";
import { calculateCashflow } from "@/lib/costs/calculateCashflow";
import { validateProject } from "@/lib/costs/validateProject";
import { todayIso } from "@/lib/scheduling/dateUtils";
import { DashboardCharts } from "@/components/DashboardCharts";
import { AlertsList } from "@/components/AlertsList";
import type { CostItem } from "@/types";

function relevantAmount(costItem: CostItem): number {
  return costItem.actualAmount ?? costItem.contractedAmount ?? costItem.estimatedAmount;
}

function formatEur(value: number) {
  return value.toLocaleString("sl-SI", { maximumFractionDigits: 0 }) + " €";
}

export default async function ProjectDashboardPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const data = getProjectFullData(user.id, id);

  if (!data) {
    notFound();
  }

  const { project, investors, fundingSources, tasks, costItems, paymentEvents } = data;

  const cashflow = calculateCashflow(paymentEvents, costItems, tasks, fundingSources, investors);
  const alerts = validateProject(project, tasks, costItems, paymentEvents, fundingSources, paymentRules);

  const totalPlanned = costItems.reduce((sum, item) => sum + relevantAmount(item), 0);
  const planWithContingency = totalPlanned * (1 + project.contingencyPercent / 100);

  const ownFundsAvailable = fundingSources
    .filter((source) => source.type === "own_funds")
    .reduce((sum, source) => sum + source.availableAmount, 0);

  const loanAvailable = fundingSources
    .filter((source) => source.type === "loan")
    .reduce((sum, source) => sum + source.availableAmount, 0);

  const loanPlanned = cashflow.length > 0 ? cashflow[cashflow.length - 1].cumulativeLoan : 0;
  const loanRemaining = loanAvailable - loanPlanned;

  const today = todayIso();
  const next30 = new Date(`${today}T00:00:00`);
  next30.setDate(next30.getDate() + 30);
  const next30Iso = next30.toISOString().slice(0, 10);

  const next30Amount = paymentEvents
    .filter((event) => event.plannedDate >= today && event.plannedDate <= next30Iso && event.status !== "cancelled")
    .reduce((sum, event) => sum + event.plannedAmount, 0);

  const mostExpensiveMonth = cashflow.reduce(
    (max, row) => (row.totalPlanned > (max?.totalPlanned ?? -1) ? row : max),
    cashflow[0]
  );

  const moveInTask = tasks.find((task) => task.code === "G030");
  const moveInDate = moveInTask?.endDate ?? tasks.reduce<string | undefined>((latest, task) => {
    if (!task.endDate) return latest;
    return !latest || task.endDate > latest ? task.endDate : latest;
  }, undefined);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Skupni planirani strošek" value={formatEur(totalPlanned)} />
        <SummaryCard label={`Plan z rezervo (${project.contingencyPercent}%)`} value={formatEur(planWithContingency)} />
        <SummaryCard label="Lastna sredstva na voljo" value={formatEur(ownFundsAvailable)} />
        <SummaryCard label="Kredit na voljo" value={formatEur(loanAvailable)} />
        <SummaryCard label="Planirano črpanje kredita" value={formatEur(loanPlanned)} />
        <SummaryCard label="Preostanek kredita" value={formatEur(loanRemaining)} tone={loanRemaining < 0 ? "negative" : "default"} />
        <SummaryCard label="Plačila v naslednjih 30 dneh" value={formatEur(next30Amount)} />
        <SummaryCard
          label="Najdražji mesec"
          value={mostExpensiveMonth ? `${mostExpensiveMonth.month} · ${formatEur(mostExpensiveMonth.totalPlanned)}` : "—"}
        />
        <SummaryCard label="Predvidena vselitev" value={moveInDate ?? "—"} />
      </div>

      <DashboardCharts rows={cashflow} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Opozorila</h2>
        <AlertsList alerts={alerts} />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "negative";
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${tone === "negative" ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
