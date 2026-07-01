import { randomUUID } from "node:crypto";
import { batch, execute, queryAll, queryOne, type QueryArgs } from "@/lib/db";
import { scheduleTasks } from "@/lib/scheduling/scheduleTasks";
import { generatePaymentEvents } from "@/lib/costs/generatePaymentEvents";
import paymentRulesData from "@/data/templates/paymentRules.si.json";
import type {
  CostItem,
  CostStatus,
  DefaultFundingSourceType,
  FundingSource,
  FundingSourceType,
  Investor,
  PaymentEvent,
  PaymentRule,
  Project,
  Task
} from "@/types";

export const paymentRules = paymentRulesData as PaymentRule[];

/* ---------- row shapes returned by SQLite (aliased to camelCase) ---------- */

type ProjectRow = Omit<Project, "contingencyPercent"> & { contingencyPercent: number };

type TaskRow = Omit<Task, "dependencies" | "included"> & {
  dependencies: string;
  included: number;
};

type CostItemRow = Omit<CostItem, "amountIncludesVat"> & { amountIncludesVat: number };

function rowToTask(row: TaskRow): Task {
  return {
    ...row,
    dependencies: JSON.parse(row.dependencies || "[]"),
    included: row.included === 1
  };
}

function rowToCostItem(row: CostItemRow): CostItem {
  return {
    ...row,
    amountIncludesVat: row.amountIncludesVat === 1
  };
}

const TASK_SELECT = `select id, project_id as projectId, parent_code as parentCode, code, name, type,
  duration_days as durationDays, start_date as startDate, end_date as endDate,
  dependencies, progress_percent as progressPercent, status,
  default_funding_source_type as defaultFundingSourceType, sort_order as sortOrder,
  optional_key as optionalKey, included
 from tasks where project_id = :projectId order by sort_order`;

const COST_ITEM_SELECT = `select id, project_id as projectId, task_code as taskCode, name, supplier, status,
  estimated_amount as estimatedAmount, contracted_amount as contractedAmount,
  actual_amount as actualAmount, vat_rate as vatRate,
  amount_includes_vat as amountIncludesVat,
  default_funding_source_type as defaultFundingSourceType,
  payment_rule_code as paymentRuleCode, note
 from cost_items where project_id = :projectId`;

/* ---------- access control ---------- */

export async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const row = await queryOne(
    `select 1 from projects p
     where p.id = :projectId
     and (
       p.owner_user_id = :userId
       or exists (
         select 1 from project_members pm
         where pm.project_id = p.id and pm.user_id = :userId
       )
     )`,
    { projectId, userId }
  );

  return Boolean(row);
}

/* ---------- projects ---------- */

export async function getProjectsForUser(userId: string): Promise<Project[]> {
  return queryAll<ProjectRow>(
    `select
      id, owner_user_id as ownerUserId, name, project_type as projectType,
      start_date as startDate, target_end_date as targetEndDate,
      scheduling_mode as schedulingMode, currency,
      contingency_percent as contingencyPercent,
      created_at as createdAt, updated_at as updatedAt
    from projects
    where owner_user_id = :userId
    order by created_at desc`,
    { userId }
  );
}

export async function getProject(projectId: string): Promise<Project | null> {
  return queryOne<ProjectRow>(
    `select
      id, owner_user_id as ownerUserId, name, project_type as projectType,
      start_date as startDate, target_end_date as targetEndDate,
      scheduling_mode as schedulingMode, currency,
      contingency_percent as contingencyPercent,
      created_at as createdAt, updated_at as updatedAt
    from projects where id = :projectId`,
    { projectId }
  );
}

export async function getProjectFullData(userId: string, projectId: string) {
  if (!(await hasProjectAccess(userId, projectId))) return null;

  const project = await getProject(projectId);
  if (!project) return null;

  const [investors, fundingSources, taskRows, costItemRows, paymentEvents] = await Promise.all([
    queryAll<Investor>(
      `select id, project_id as projectId, name, share_percent as sharePercent, email, note
       from investors where project_id = :projectId order by name`,
      { projectId }
    ),
    queryAll<FundingSource>(
      `select id, project_id as projectId, name, type, available_amount as availableAmount,
        available_from as availableFrom, investor_id as investorId, note
       from funding_sources where project_id = :projectId order by name`,
      { projectId }
    ),
    queryAll<TaskRow>(TASK_SELECT, { projectId }),
    queryAll<CostItemRow>(COST_ITEM_SELECT, { projectId }),
    queryAll<PaymentEvent>(
      `select id, project_id as projectId, cost_item_id as costItemId, task_code as taskCode,
        name, planned_date as plannedDate, planned_amount as plannedAmount,
        actual_date as actualDate, actual_amount as actualAmount,
        funding_source_type as fundingSourceType, status
       from payment_events where project_id = :projectId order by planned_date`,
      { projectId }
    )
  ]);

  return {
    project,
    investors,
    fundingSources,
    tasks: taskRows.map(rowToTask),
    costItems: costItemRows.map(rowToCostItem),
    paymentEvents
  };
}

export async function createProject(input: {
  ownerUserId: string;
  name: string;
  startDate: string;
  contingencyPercent: number;
  investors: Omit<Investor, "id" | "projectId">[];
  fundingSources: Omit<FundingSource, "id" | "projectId">[];
  tasks: Omit<Task, "id" | "projectId">[];
  costItems: Omit<CostItem, "id" | "projectId">[];
}): Promise<string> {
  const projectId = randomUUID();

  const statements: Array<{ sql: string; args: QueryArgs }> = [
    {
      sql: `insert into projects (id, owner_user_id, name, project_type, start_date, scheduling_mode, currency, contingency_percent)
       values (:id, :ownerUserId, :name, 'house_new_build', :startDate, 'forward', 'EUR', :contingencyPercent)`,
      args: {
        id: projectId,
        ownerUserId: input.ownerUserId,
        name: input.name,
        startDate: input.startDate,
        contingencyPercent: input.contingencyPercent
      }
    }
  ];

  for (const investor of input.investors) {
    statements.push({
      sql: `insert into investors (id, project_id, name, share_percent, email, note)
       values (:id, :projectId, :name, :sharePercent, :email, :note)`,
      args: {
        id: randomUUID(),
        projectId,
        name: investor.name,
        sharePercent: investor.sharePercent,
        email: investor.email ?? null,
        note: investor.note ?? null
      }
    });
  }

  for (const source of input.fundingSources) {
    statements.push({
      sql: `insert into funding_sources (id, project_id, name, type, available_amount, available_from, note)
       values (:id, :projectId, :name, :type, :availableAmount, :availableFrom, :note)`,
      args: {
        id: randomUUID(),
        projectId,
        name: source.name,
        type: source.type,
        availableAmount: source.availableAmount,
        availableFrom: source.availableFrom,
        note: source.note ?? null
      }
    });
  }

  for (const task of input.tasks) {
    statements.push({
      sql: `insert into tasks (id, project_id, parent_code, code, name, type, duration_days, dependencies, progress_percent, status, default_funding_source_type, sort_order, optional_key, included)
       values (:id, :projectId, :parentCode, :code, :name, :type, :durationDays, :dependencies, :progressPercent, :status, :defaultFundingSourceType, :sortOrder, :optionalKey, :included)`,
      args: {
        id: randomUUID(),
        projectId,
        parentCode: task.parentCode ?? null,
        code: task.code,
        name: task.name,
        type: task.type,
        durationDays: task.durationDays,
        dependencies: JSON.stringify(task.dependencies ?? []),
        progressPercent: task.progressPercent ?? 0,
        status: task.status ?? "planned",
        defaultFundingSourceType: task.defaultFundingSourceType ?? null,
        sortOrder: task.sortOrder,
        optionalKey: task.optionalKey ?? null,
        included: task.included === false ? 0 : 1
      }
    });
  }

  for (const item of input.costItems) {
    statements.push({
      sql: `insert into cost_items (id, project_id, task_code, name, status, estimated_amount, amount_includes_vat, default_funding_source_type, payment_rule_code)
       values (:id, :projectId, :taskCode, :name, :status, :estimatedAmount, :amountIncludesVat, :defaultFundingSourceType, :paymentRuleCode)`,
      args: {
        id: randomUUID(),
        projectId,
        taskCode: item.taskCode,
        name: item.name,
        status: item.status,
        estimatedAmount: item.estimatedAmount,
        amountIncludesVat: item.amountIncludesVat ? 1 : 0,
        defaultFundingSourceType: item.defaultFundingSourceType ?? null,
        paymentRuleCode: item.paymentRuleCode
      }
    });
  }

  await batch(statements);
  await recalculateProject(projectId);

  return projectId;
}

export async function deleteProjectRecord(projectId: string) {
  await execute("delete from projects where id = :projectId", { projectId });
}

export async function updateProjectStartDate(projectId: string, startDate: string) {
  await execute(
    "update projects set start_date = :startDate, updated_at = datetime('now') where id = :projectId",
    { startDate, projectId }
  );
  await recalculateProject(projectId);
}

/* ---------- tasks ---------- */

export async function updateTaskFields(
  taskId: string,
  projectId: string,
  fields: { name: string; durationDays: number; included: boolean }
) {
  await execute(
    `update tasks set name = :name, duration_days = :durationDays, included = :included
     where id = :taskId and project_id = :projectId`,
    {
      name: fields.name,
      durationDays: fields.durationDays,
      included: fields.included ? 1 : 0,
      taskId,
      projectId
    }
  );
  await recalculateProject(projectId);
}

/* ---------- cost items ---------- */

export async function upsertCostItemRecord(
  projectId: string,
  costItemId: string | null,
  fields: {
    taskCode: string;
    name: string;
    status: CostStatus;
    estimatedAmount: number;
    contractedAmount: number | null;
    actualAmount: number | null;
    defaultFundingSourceType: DefaultFundingSourceType;
    paymentRuleCode: string;
  }
) {
  if (costItemId) {
    await execute(
      `update cost_items set
        task_code = :taskCode, name = :name, status = :status,
        estimated_amount = :estimatedAmount, contracted_amount = :contractedAmount,
        actual_amount = :actualAmount, default_funding_source_type = :defaultFundingSourceType,
        payment_rule_code = :paymentRuleCode, updated_at = datetime('now')
       where id = :id and project_id = :projectId`,
      { id: costItemId, projectId, ...fields }
    );
  } else {
    await execute(
      `insert into cost_items (id, project_id, task_code, name, status, estimated_amount, contracted_amount, actual_amount, amount_includes_vat, default_funding_source_type, payment_rule_code)
       values (:id, :projectId, :taskCode, :name, :status, :estimatedAmount, :contractedAmount, :actualAmount, 1, :defaultFundingSourceType, :paymentRuleCode)`,
      { id: randomUUID(), projectId, ...fields }
    );
  }

  await recalculateProject(projectId);
}

export async function deleteCostItemRecord(projectId: string, costItemId: string) {
  await execute("delete from cost_items where id = :costItemId and project_id = :projectId", {
    costItemId,
    projectId
  });
  await recalculateProject(projectId);
}

/* ---------- funding sources ---------- */

export async function upsertFundingSourceRecord(
  projectId: string,
  fundingSourceId: string | null,
  fields: {
    name: string;
    type: FundingSourceType;
    availableAmount: number;
    availableFrom: string;
    note: string | null;
  }
) {
  if (fundingSourceId) {
    await execute(
      `update funding_sources set name = :name, type = :type, available_amount = :availableAmount,
        available_from = :availableFrom, note = :note
       where id = :id and project_id = :projectId`,
      { id: fundingSourceId, projectId, ...fields }
    );
  } else {
    await execute(
      `insert into funding_sources (id, project_id, name, type, available_amount, available_from, note)
       values (:id, :projectId, :name, :type, :availableAmount, :availableFrom, :note)`,
      { id: randomUUID(), projectId, ...fields }
    );
  }

  await recalculateProject(projectId);
}

export async function deleteFundingSourceRecord(projectId: string, fundingSourceId: string) {
  await execute("delete from funding_sources where id = :fundingSourceId and project_id = :projectId", {
    fundingSourceId,
    projectId
  });
}

/* ---------- investors ---------- */

export async function upsertInvestorRecord(
  projectId: string,
  investorId: string | null,
  fields: { name: string; sharePercent: number; email: string | null; note: string | null }
) {
  if (investorId) {
    await execute(
      `update investors set name = :name, share_percent = :sharePercent, email = :email, note = :note
       where id = :id and project_id = :projectId`,
      { id: investorId, projectId, ...fields }
    );
  } else {
    await execute(
      `insert into investors (id, project_id, name, share_percent, email, note)
       values (:id, :projectId, :name, :sharePercent, :email, :note)`,
      { id: randomUUID(), projectId, ...fields }
    );
  }
}

export async function deleteInvestorRecord(projectId: string, investorId: string) {
  await execute("delete from investors where id = :investorId and project_id = :projectId", {
    investorId,
    projectId
  });
}

/* ---------- recalculation ---------- */

/**
 * Recompute the schedule from tasks + project start date, persist the new
 * start/end dates, then regenerate and persist payment events from
 * tasks x cost items x payment rules. Called after any edit that can affect
 * dates or costs.
 */
export async function recalculateProject(projectId: string) {
  const project = await getProject(projectId);
  if (!project) return;

  const taskRows = await queryAll<TaskRow>(TASK_SELECT, { projectId });
  const tasks = taskRows.map(rowToTask);
  const scheduledTasks = scheduleTasks(project.startDate, tasks);

  const costItemRows = await queryAll<CostItemRow>(COST_ITEM_SELECT, { projectId });
  const costItems = costItemRows.map(rowToCostItem);
  const paymentEvents = generatePaymentEvents(costItems, scheduledTasks, paymentRules);

  const statements: Array<{ sql: string; args: QueryArgs }> = scheduledTasks.map((task) => ({
    sql: "update tasks set start_date = :startDate, end_date = :endDate where id = :id",
    args: { startDate: task.startDate ?? null, endDate: task.endDate ?? null, id: task.id }
  }));

  statements.push({ sql: "delete from payment_events where project_id = :projectId", args: { projectId } });

  for (const event of paymentEvents) {
    statements.push({
      sql: `insert into payment_events (id, project_id, cost_item_id, task_code, name, planned_date, planned_amount, funding_source_type, status)
       values (:id, :projectId, :costItemId, :taskCode, :name, :plannedDate, :plannedAmount, :fundingSourceType, :status)`,
      args: {
        id: event.id,
        projectId: event.projectId,
        costItemId: event.costItemId,
        taskCode: event.taskCode,
        name: event.name,
        plannedDate: event.plannedDate,
        plannedAmount: event.plannedAmount,
        fundingSourceType: event.fundingSourceType ?? null,
        status: event.status
      }
    });
  }

  await batch(statements);
}
