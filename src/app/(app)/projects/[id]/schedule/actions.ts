"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { hasProjectAccess, updateProjectStartDate as updateProjectStartDateRecord, updateTaskFields } from "@/lib/data/queries";

export async function updateTask(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  if (!hasProjectAccess(user.id, projectId)) return;

  const taskId = String(formData.get("taskId") ?? "");
  const name = String(formData.get("name") ?? "");
  const durationDays = Number(formData.get("durationDays") ?? 0);
  const included = formData.get("included") === "on";

  updateTaskFields(taskId, projectId, { name, durationDays, included });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/schedule`);
  revalidatePath(`/projects/${projectId}/payments`);
}

export async function updateProjectStartDate(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  if (!hasProjectAccess(user.id, projectId)) return;

  const startDate = String(formData.get("startDate") ?? "");
  updateProjectStartDateRecord(projectId, startDate);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/schedule`);
  revalidatePath(`/projects/${projectId}/payments`);
}
