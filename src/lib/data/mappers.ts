import type {
  CostItem,
  FundingSource,
  Investor,
  PaymentEvent,
  Project,
  Task
} from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function projectFromRow(row: any): Project {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    projectType: row.project_type,
    startDate: row.start_date,
    targetEndDate: row.target_end_date ?? undefined,
    schedulingMode: row.scheduling_mode,
    currency: row.currency,
    contingencyPercent: Number(row.contingency_percent),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function investorFromRow(row: any): Investor {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    sharePercent: Number(row.share_percent),
    email: row.email ?? undefined,
    note: row.note ?? undefined
  };
}

export function investorToRow(investor: Partial<Investor> & { projectId: string }) {
  return {
    project_id: investor.projectId,
    name: investor.name,
    share_percent: investor.sharePercent,
    email: investor.email ?? null,
    note: investor.note ?? null
  };
}

export function fundingSourceFromRow(row: any): FundingSource {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    type: row.type,
    availableAmount: Number(row.available_amount),
    availableFrom: row.available_from,
    investorId: row.investor_id ?? undefined,
    note: row.note ?? undefined
  };
}

export function fundingSourceToRow(source: Partial<FundingSource> & { projectId: string }) {
  return {
    project_id: source.projectId,
    name: source.name,
    type: source.type,
    available_amount: source.availableAmount,
    available_from: source.availableFrom,
    investor_id: source.investorId ?? null,
    note: source.note ?? null
  };
}

export function taskFromRow(row: any): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    parentCode: row.parent_code ?? undefined,
    code: row.code,
    name: row.name,
    type: row.type,
    durationDays: Number(row.duration_days),
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    dependencies: row.dependencies ?? [],
    progressPercent: Number(row.progress_percent),
    status: row.status,
    defaultFundingSourceType: row.default_funding_source_type ?? undefined,
    sortOrder: Number(row.sort_order),
    optionalKey: row.optional_key ?? undefined,
    included: row.included
  };
}

export function taskToRow(task: Partial<Task> & { projectId: string; code: string }) {
  return {
    project_id: task.projectId,
    parent_code: task.parentCode ?? null,
    code: task.code,
    name: task.name,
    type: task.type,
    duration_days: task.durationDays,
    start_date: task.startDate ?? null,
    end_date: task.endDate ?? null,
    dependencies: task.dependencies ?? [],
    progress_percent: task.progressPercent ?? 0,
    status: task.status ?? "planned",
    default_funding_source_type: task.defaultFundingSourceType ?? null,
    sort_order: task.sortOrder,
    optional_key: task.optionalKey ?? null,
    included: task.included ?? true
  };
}

export function costItemFromRow(row: any): CostItem {
  return {
    id: row.id,
    projectId: row.project_id,
    taskCode: row.task_code,
    name: row.name,
    supplier: row.supplier ?? undefined,
    status: row.status,
    estimatedAmount: Number(row.estimated_amount),
    contractedAmount: row.contracted_amount != null ? Number(row.contracted_amount) : undefined,
    actualAmount: row.actual_amount != null ? Number(row.actual_amount) : undefined,
    vatRate: row.vat_rate != null ? Number(row.vat_rate) : undefined,
    amountIncludesVat: row.amount_includes_vat,
    defaultFundingSourceType: row.default_funding_source_type ?? undefined,
    paymentRuleCode: row.payment_rule_code,
    note: row.note ?? undefined
  };
}

export function costItemToRow(cost: Partial<CostItem> & { projectId: string }) {
  return {
    project_id: cost.projectId,
    task_code: cost.taskCode,
    name: cost.name,
    supplier: cost.supplier ?? null,
    status: cost.status,
    estimated_amount: cost.estimatedAmount,
    contracted_amount: cost.contractedAmount ?? null,
    actual_amount: cost.actualAmount ?? null,
    vat_rate: cost.vatRate ?? null,
    amount_includes_vat: cost.amountIncludesVat ?? true,
    default_funding_source_type: cost.defaultFundingSourceType ?? null,
    payment_rule_code: cost.paymentRuleCode,
    note: cost.note ?? null
  };
}

export function paymentEventFromRow(row: any): PaymentEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    costItemId: row.cost_item_id,
    taskCode: row.task_code,
    name: row.name,
    plannedDate: row.planned_date,
    plannedAmount: Number(row.planned_amount),
    actualDate: row.actual_date ?? undefined,
    actualAmount: row.actual_amount != null ? Number(row.actual_amount) : undefined,
    fundingSourceType: row.funding_source_type ?? undefined,
    status: row.status
  };
}

export function paymentEventToRow(event: PaymentEvent) {
  return {
    project_id: event.projectId,
    cost_item_id: event.costItemId,
    task_code: event.taskCode,
    name: event.name,
    planned_date: event.plannedDate,
    planned_amount: event.plannedAmount,
    actual_date: event.actualDate ?? null,
    actual_amount: event.actualAmount ?? null,
    funding_source_type: event.fundingSourceType ?? null,
    status: event.status
  };
}
