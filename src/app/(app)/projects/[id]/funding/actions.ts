"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { deleteFundingSourceRecord, hasProjectAccess, upsertFundingSourceRecord } from "@/lib/data/queries";
import type { FundingSourceType } from "@/types";

function afterChange(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/funding`);
  revalidatePath(`/projects/${projectId}/payments`);
}

export async function upsertFundingSource(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  if (!(await hasProjectAccess(user.id, projectId))) return;

  const fundingSourceId = String(formData.get("fundingSourceId") ?? "") || null;

  await upsertFundingSourceRecord(projectId, fundingSourceId, {
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "own_funds") as FundingSourceType,
    availableAmount: Number(formData.get("availableAmount") ?? 0),
    availableFrom: String(formData.get("availableFrom") ?? ""),
    note: String(formData.get("note") ?? "") || null
  });

  afterChange(projectId);
}

export async function deleteFundingSource(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  if (!(await hasProjectAccess(user.id, projectId))) return;

  const fundingSourceId = String(formData.get("fundingSourceId") ?? "");
  await deleteFundingSourceRecord(projectId, fundingSourceId);

  afterChange(projectId);
}
