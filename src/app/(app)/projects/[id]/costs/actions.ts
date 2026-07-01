"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { deleteCostItemRecord, hasProjectAccess, upsertCostItemRecord } from "@/lib/data/queries";
import type { CostItem, DefaultFundingSourceType } from "@/types";

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function afterChange(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/costs`);
  revalidatePath(`/projects/${projectId}/payments`);
}

export async function upsertCostItem(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  if (!(await hasProjectAccess(user.id, projectId))) return;

  const costItemId = String(formData.get("costItemId") ?? "") || null;

  await upsertCostItemRecord(projectId, costItemId, {
    taskCode: String(formData.get("taskCode") ?? ""),
    name: String(formData.get("name") ?? ""),
    status: String(formData.get("status") ?? "estimate") as CostItem["status"],
    estimatedAmount: numberOrNull(formData.get("estimatedAmount")) ?? 0,
    contractedAmount: numberOrNull(formData.get("contractedAmount")),
    actualAmount: numberOrNull(formData.get("actualAmount")),
    defaultFundingSourceType: String(
      formData.get("defaultFundingSourceType") ?? "own_funds"
    ) as DefaultFundingSourceType,
    paymentRuleCode: String(formData.get("paymentRuleCode") ?? "")
  });

  afterChange(projectId);
}

export async function deleteCostItem(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  if (!(await hasProjectAccess(user.id, projectId))) return;

  const costItemId = String(formData.get("costItemId") ?? "");
  await deleteCostItemRecord(projectId, costItemId);

  afterChange(projectId);
}
