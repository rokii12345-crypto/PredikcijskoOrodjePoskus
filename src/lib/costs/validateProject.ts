import type {
  CostItem,
  FundingSource,
  PaymentEvent,
  PaymentRule,
  Project,
  ProjectAlert,
  Task
} from "@/types";
import { todayIso } from "@/lib/scheduling/dateUtils";

function sumPaymentsForCostItem(costItemId: string, paymentEvents: PaymentEvent[]): number {
  return paymentEvents
    .filter((event) => event.costItemId === costItemId && event.status !== "cancelled")
    .reduce((sum, event) => sum + event.plannedAmount, 0);
}

function costAmount(costItem: CostItem): number {
  return costItem.actualAmount ?? costItem.contractedAmount ?? costItem.estimatedAmount;
}

export function validateProject(
  _project: Project,
  tasks: Task[],
  costItems: CostItem[],
  paymentEvents: PaymentEvent[],
  fundingSources: FundingSource[],
  paymentRules: PaymentRule[]
): ProjectAlert[] {
  const alerts: ProjectAlert[] = [];

  const loanSources = fundingSources.filter((source) => source.type === "loan");
  const totalLoanAvailable = loanSources.reduce((sum, source) => sum + source.availableAmount, 0);
  const earliestLoanDate = loanSources
    .map((source) => source.availableFrom)
    .sort((a, b) => a.localeCompare(b))[0];

  const loanPayments = paymentEvents.filter((event) => event.fundingSourceType === "loan");
  const totalLoanPlanned = loanPayments.reduce((sum, event) => sum + event.plannedAmount, 0);

  if (totalLoanPlanned > totalLoanAvailable && totalLoanAvailable > 0) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: "error",
      title: "Kredit je presežen",
      message: `Planirano črpanje kredita je ${totalLoanPlanned.toLocaleString("sl-SI")} €, razpoložljivi kredit pa ${totalLoanAvailable.toLocaleString("sl-SI")} €.`
    });
  }

  if (earliestLoanDate) {
    for (const event of loanPayments) {
      if (event.plannedDate < earliestLoanDate) {
        alerts.push({
          id: crypto.randomUUID(),
          severity: "warning",
          title: "Plačilo iz kredita je pred razpoložljivostjo kredita",
          message: `Plačilo "${event.name}" je planirano ${event.plannedDate}, kredit pa je na voljo od ${earliestLoanDate}.`,
          relatedEntityId: event.id,
          relatedEntityType: "payment_event"
        });
      }
    }
  }

  for (const task of tasks.filter((candidate) => candidate.type !== "summary")) {
    if (!task.startDate || !task.endDate) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: "warning",
        title: "Aktivnost nima datuma",
        message: `Aktivnost "${task.name}" nima izračunanega začetka ali konca.`,
        relatedEntityId: task.id,
        relatedEntityType: "task"
      });
    }
  }

  for (const costItem of costItems) {
    const task = tasks.find((candidate) => candidate.code === costItem.taskCode);
    const paymentRule = paymentRules.find((candidate) => candidate.code === costItem.paymentRuleCode);

    if (!task) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: "error",
        title: "Strošek je vezan na neobstoječo aktivnost",
        message: `Strošek "${costItem.name}" je vezan na aktivnost ${costItem.taskCode}, ki ne obstaja.`,
        relatedEntityId: costItem.id,
        relatedEntityType: "cost_item"
      });
    }

    if (!paymentRule) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: "error",
        title: "Plačilno pravilo ne obstaja",
        message: `Strošek "${costItem.name}" uporablja pravilo ${costItem.paymentRuleCode}, ki ne obstaja.`,
        relatedEntityId: costItem.id,
        relatedEntityType: "cost_item"
      });
    }

    const expected = costAmount(costItem);
    const actualPaymentSum = sumPaymentsForCostItem(costItem.id, paymentEvents);
    const difference = Math.abs(expected - actualPaymentSum);

    if (actualPaymentSum > 0 && difference > 1) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: "warning",
        title: "Vsota plačil ni enaka znesku stroška",
        message: `Strošek "${costItem.name}" znaša ${expected.toLocaleString("sl-SI")} €, plačilni dogodki pa skupaj znašajo ${actualPaymentSum.toLocaleString("sl-SI")} €.`,
        relatedEntityId: costItem.id,
        relatedEntityType: "cost_item"
      });
    }
  }

  const today = todayIso();
  const next30 = new Date(`${today}T00:00:00`);
  next30.setDate(next30.getDate() + 30);
  const next30Iso = next30.toISOString().slice(0, 10);

  const next30Payments = paymentEvents.filter(
    (event) => event.plannedDate >= today && event.plannedDate <= next30Iso && event.status === "planned"
  );
  const next30Amount = next30Payments.reduce((sum, event) => sum + event.plannedAmount, 0);

  if (next30Amount > 0) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: "info",
      title: "Plačila v naslednjih 30 dneh",
      message: `V naslednjih 30 dneh je planiranih ${next30Amount.toLocaleString("sl-SI")} € plačil.`
    });
  }

  return alerts;
}
