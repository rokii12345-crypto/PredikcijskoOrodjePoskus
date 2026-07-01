import type {
  CostItem,
  FundingSource,
  Investor,
  MonthlyCashflowRow,
  PaymentEvent,
  Task
} from "@/types";
import { toMonthKey } from "@/lib/scheduling/dateUtils";

function getFundingTypeForEvent(
  event: PaymentEvent,
  costItems: CostItem[],
  tasks: Task[]
): "own_funds" | "loan" | "mixed" {
  if (event.fundingSourceType) {
    return event.fundingSourceType;
  }

  const costItem = costItems.find((item) => item.id === event.costItemId);
  if (costItem?.defaultFundingSourceType) {
    return costItem.defaultFundingSourceType;
  }

  const task = tasks.find((candidate) => candidate.code === event.taskCode);
  return task?.defaultFundingSourceType ?? "own_funds";
}

export function calculateCashflow(
  paymentEvents: PaymentEvent[],
  costItems: CostItem[],
  tasks: Task[],
  _fundingSources: FundingSource[],
  investors: Investor[]
): MonthlyCashflowRow[] {
  const rowsByMonth = new Map<string, MonthlyCashflowRow>();

  for (const event of paymentEvents) {
    if (event.status === "cancelled") continue;

    const month = toMonthKey(event.plannedDate);

    if (!rowsByMonth.has(month)) {
      rowsByMonth.set(month, {
        month,
        totalPlanned: 0,
        ownFunds: 0,
        loan: 0,
        mixed: 0,
        cumulativeTotal: 0,
        cumulativeLoan: 0,
        investorShares: {}
      });
    }

    const row = rowsByMonth.get(month)!;
    const amount = event.plannedAmount;
    const fundingType = getFundingTypeForEvent(event, costItems, tasks);

    row.totalPlanned += amount;

    if (fundingType === "loan") {
      row.loan += amount;
    } else if (fundingType === "mixed") {
      row.mixed += amount;
      row.loan += amount * 0.5;
      row.ownFunds += amount * 0.5;
    } else {
      row.ownFunds += amount;
    }

    for (const investor of investors) {
      const current = row.investorShares[investor.id] ?? 0;
      row.investorShares[investor.id] = current + (amount * investor.sharePercent) / 100;
    }
  }

  const rows = Array.from(rowsByMonth.values()).sort((a, b) => a.month.localeCompare(b.month));

  let cumulativeTotal = 0;
  let cumulativeLoan = 0;

  return rows.map((row) => {
    cumulativeTotal += row.totalPlanned;
    cumulativeLoan += row.loan;

    return {
      ...row,
      ownFunds: Math.round(row.ownFunds),
      loan: Math.round(row.loan),
      mixed: Math.round(row.mixed),
      totalPlanned: Math.round(row.totalPlanned),
      cumulativeTotal: Math.round(cumulativeTotal),
      cumulativeLoan: Math.round(cumulativeLoan),
      investorShares: Object.fromEntries(
        Object.entries(row.investorShares).map(([key, value]) => [key, Math.round(value)])
      )
    };
  });
}
