"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recalculateProject } from "@/lib/data/projectData";

export async function updateTask(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const name = String(formData.get("name") ?? "");
  const durationDays = Number(formData.get("durationDays") ?? 0);
  const included = formData.get("included") === "on";

  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ name, duration_days: durationDays, included })
    .eq("id", taskId);

  await recalculateProject(supabase, projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/schedule`);
  revalidatePath(`/projects/${projectId}/payments`);
}

export async function updateProjectStartDate(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const startDate = String(formData.get("startDate") ?? "");

  const supabase = await createClient();
  await supabase.from("projects").update({ start_date: startDate }).eq("id", projectId);

  await recalculateProject(supabase, projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/schedule`);
  revalidatePath(`/projects/${projectId}/payments`);
}
