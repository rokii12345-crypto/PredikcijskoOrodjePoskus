import type { SupabaseClient } from "@supabase/supabase-js";
import paymentRulesData from "@/data/templates/paymentRules.si.json";
import { generatePaymentEvents } from "@/lib/costs/generatePaymentEvents";
import { scheduleTasks } from "@/lib/scheduling/scheduleTasks";
import type { PaymentRule, Task } from "@/types";
import {
  costItemFromRow,
  fundingSourceFromRow,
  investorFromRow,
  paymentEventFromRow,
  paymentEventToRow,
  projectFromRow,
  taskFromRow,
  taskToRow
} from "@/lib/data/mappers";

export const paymentRules = paymentRulesData as PaymentRule[];

export async function getProjectFullData(supabase: SupabaseClient, projectId: string) {
  const [projectRes, investorsRes, fundingRes, tasksRes, costItemsRes, paymentEventsRes] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("investors").select("*").eq("project_id", projectId).order("name"),
      supabase.from("funding_sources").select("*").eq("project_id", projectId).order("name"),
      supabase.from("tasks").select("*").eq("project_id", projectId).order("sort_order"),
      supabase.from("cost_items").select("*").eq("project_id", projectId),
      supabase
        .from("payment_events")
        .select("*")
        .eq("project_id", projectId)
        .order("planned_date")
    ]);

  if (projectRes.error || !projectRes.data) {
    return null;
  }

  return {
    project: projectFromRow(projectRes.data),
    investors: (investorsRes.data ?? []).map(investorFromRow),
    fundingSources: (fundingRes.data ?? []).map(fundingSourceFromRow),
    tasks: (tasksRes.data ?? []).map(taskFromRow),
    costItems: (costItemsRes.data ?? []).map(costItemFromRow),
    paymentEvents: (paymentEventsRes.data ?? []).map(paymentEventFromRow)
  };
}

/**
 * Recompute the schedule from tasks + project start date, persist the new
 * start/end dates, then regenerate and persist payment events from
 * tasks x cost items x payment rules. Called after any edit that can affect
 * dates or costs.
 */
export async function recalculateProject(supabase: SupabaseClient, projectId: string) {
  const { data: projectRow } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  const { data: taskRows } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");

  const { data: costItemRows } = await supabase
    .from("cost_items")
    .select("*")
    .eq("project_id", projectId);

  if (!projectRow || !taskRows) return;

  const tasks: Task[] = taskRows.map(taskFromRow);
  const scheduledTasks = scheduleTasks(projectRow.start_date, tasks);

  for (const task of scheduledTasks) {
    await supabase
      .from("tasks")
      .update(taskToRow(task))
      .eq("id", task.id);
  }

  const costItems = (costItemRows ?? []).map(costItemFromRow);
  const paymentEvents = generatePaymentEvents(costItems, scheduledTasks, paymentRules);

  await supabase.from("payment_events").delete().eq("project_id", projectId);

  if (paymentEvents.length > 0) {
    await supabase.from("payment_events").insert(paymentEvents.map(paymentEventToRow));
  }
}
