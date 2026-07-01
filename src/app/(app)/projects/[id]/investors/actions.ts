"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { deleteInvestorRecord, hasProjectAccess, upsertInvestorRecord } from "@/lib/data/queries";

export async function upsertInvestor(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  if (!(await hasProjectAccess(user.id, projectId))) return;

  const investorId = String(formData.get("investorId") ?? "") || null;

  await upsertInvestorRecord(projectId, investorId, {
    name: String(formData.get("name") ?? ""),
    sharePercent: Number(formData.get("sharePercent") ?? 0),
    email: String(formData.get("email") ?? "") || null,
    note: String(formData.get("note") ?? "") || null
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/investors`);
}

export async function deleteInvestor(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  if (!(await hasProjectAccess(user.id, projectId))) return;

  const investorId = String(formData.get("investorId") ?? "");
  await deleteInvestorRecord(projectId, investorId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/investors`);
}
