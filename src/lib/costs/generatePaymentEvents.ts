import type { CostItem, PaymentEvent, PaymentRule, Task } from "@/types";
import { addDays } from "@/lib/scheduling/dateUtils";

function relevantAmount(costItem: CostItem): number {
  return costItem.actualAmount ?? costItem.contractedAmount ?? costItem.estimatedAmount;
}

export function generatePaymentEvents(
  costItems: CostItem[],
  tasks: Task[],
  paymentRules: PaymentRule[]
): PaymentEvent[] {
  const events: PaymentEvent[] = [];

  for (const costItem of costItems) {
    if (costItem.status === "cancelled") continue;

    const task = tasks.find((candidate) => candidate.code === costItem.taskCode);
    const rule = paymentRules.find((candidate) => candidate.code === costItem.paymentRuleCode);

    if (!task || !rule || !task.startDate || !task.endDate) {
      continue;
    }

    const amount = relevantAmount(costItem);

    for (const part of rule.parts) {
      const anchorDate = part.dateAnchor === "task_start"
        ? task.startDate
        : task.endDate;

      const plannedDate = addDays(anchorDate, part.lagDays);
      const plannedAmount = Math.round((amount * part.percent) / 100);

      events.push({
        id: crypto.randomUUID(),
        projectId: costItem.projectId,
        costItemId: costItem.id,
        taskCode: costItem.taskCode,
        name: `${costItem.name} - ${part.name}`,
        plannedDate,
        plannedAmount,
        fundingSourceType: costItem.defaultFundingSourceType ?? task.defaultFundingSourceType ?? "own_funds",
        status: "planned"
      });
    }
  }

  return events.sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
}
