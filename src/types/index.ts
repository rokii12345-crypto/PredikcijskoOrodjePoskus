export type Currency = "EUR";

export type ProjectType = "house_new_build" | "house_renovation";

export type SchedulingMode = "forward" | "backward";

export type Project = {
  id: string;
  ownerUserId: string;
  name: string;
  projectType: ProjectType;
  startDate: string;
  targetEndDate?: string;
  schedulingMode: SchedulingMode;
  currency: Currency;
  contingencyPercent: number;
  createdAt: string;
  updatedAt: string;
};

export type Investor = {
  id: string;
  projectId: string;
  name: string;
  sharePercent: number;
  email?: string;
  note?: string;
};

export type FundingSourceType =
  | "own_funds"
  | "loan"
  | "family_support"
  | "sale_income"
  | "grant"
  | "reserve"
  | "other";

export type FundingSource = {
  id: string;
  projectId: string;
  name: string;
  type: FundingSourceType;
  availableAmount: number;
  availableFrom: string;
  investorId?: string;
  note?: string;
};

export type TaskType = "summary" | "task" | "milestone";

export type DependencyType = "FS" | "SS" | "FF";

export type DefaultFundingSourceType = "own_funds" | "loan" | "mixed";

export type Dependency = {
  predecessorTaskCode: string;
  type: DependencyType;
  lagDays: number;
};

export type Task = {
  id: string;
  projectId: string;
  parentCode?: string | null;
  code: string;
  name: string;
  type: TaskType;
  durationDays: number;
  startDate?: string;
  endDate?: string;
  dependencies: Dependency[];
  progressPercent: number;
  status: "planned" | "in_progress" | "done" | "delayed";
  defaultFundingSourceType?: DefaultFundingSourceType;
  sortOrder: number;
  optionalKey?: string;
  included?: boolean;
};

export type CostStatus =
  | "estimate"
  | "inquiry"
  | "offer"
  | "contracted"
  | "partly_paid"
  | "paid"
  | "cancelled";

export type CostItem = {
  id: string;
  projectId: string;
  taskCode: string;
  name: string;
  supplier?: string;
  status: CostStatus;
  estimatedAmount: number;
  contractedAmount?: number;
  actualAmount?: number;
  vatRate?: number;
  amountIncludesVat: boolean;
  defaultFundingSourceType?: DefaultFundingSourceType;
  paymentRuleCode: string;
  note?: string;
};

export type PaymentRule = {
  code: string;
  name: string;
  description: string;
  parts: PaymentRulePart[];
};

export type PaymentRulePart = {
  name: string;
  percent: number;
  dateAnchor: "task_start" | "task_end" | "manual_date";
  lagDays: number;
};

export type PaymentEvent = {
  id: string;
  projectId: string;
  costItemId: string;
  taskCode: string;
  name: string;
  plannedDate: string;
  plannedAmount: number;
  actualDate?: string;
  actualAmount?: number;
  fundingSourceType?: DefaultFundingSourceType;
  status: "planned" | "due" | "paid" | "overdue" | "cancelled";
};

export type MonthlyCashflowRow = {
  month: string;
  totalPlanned: number;
  ownFunds: number;
  loan: number;
  mixed: number;
  cumulativeTotal: number;
  cumulativeLoan: number;
  investorShares: Record<string, number>;
};

export type ProjectAlertSeverity = "info" | "warning" | "error";

export type ProjectAlert = {
  id: string;
  severity: ProjectAlertSeverity;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: "task" | "cost_item" | "payment_event" | "funding_source";
};
