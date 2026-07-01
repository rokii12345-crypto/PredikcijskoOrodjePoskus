"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recalculateProject } from "@/lib/data/projectData";
import type { CostItem } from "@/types";

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

async function afterChange(projectId: string) {
  const supabase = await createClient();
  await recalculateProject(supabase, projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/costs`);
  revalidatePath(`/projects/${projectId}/payments`);
}

export async function upsertCostItem(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const costItemId = String(formData.get("costItemId") ?? "");

  const row = {
    project_id: projectId,
    task_code: String(formData.get("taskCode") ?? ""),
    name: String(formData.get("name") ?? ""),
    status: String(formData.get("status") ?? "estimate") as CostItem["status"],
    estimated_amount: numberOrNull(formData.get("estimatedAmount")) ?? 0,
    contracted_amount: numberOrNull(formData.get("contractedAmount")),
    actual_amount: numberOrNull(formData.get("actualAmount")),
    amount_includes_vat: true,
    default_funding_source_type: String(formData.get("defaultFundingSourceType") ?? "own_funds"),
    payment_rule_code: String(formData.get("paymentRuleCode") ?? "")
  };

  const supabase = await createClient();

  if (costItemId) {
    await supabase.from("cost_items").update(row).eq("id", costItemId);
  } else {
    await supabase.from("cost_items").insert(row);
  }

  await afterChange(projectId);
}

export async function deleteCostItem(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const costItemId = String(formData.get("costItemId") ?? "");

  const supabase = await createClient();
  await supabase.from("cost_items").delete().eq("id", costItemId);

  await afterChange(projectId);
}
