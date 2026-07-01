"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDemoProject } from "@/lib/demo/createDemoProject";
import { recalculateProject } from "@/lib/data/projectData";
import {
  costItemToRow,
  fundingSourceToRow,
  investorToRow,
  taskToRow
} from "@/lib/data/mappers";

export type NewProjectState = {
  error?: string;
};

export async function createProject(
  _prevState: NewProjectState,
  formData: FormData
): Promise<NewProjectState> {
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");

  if (!name || !startDate) {
    return { error: "Vnesi ime projekta in datum začetka gradnje." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const draft = createDemoProject(user.id, startDate);
  draft.project.name = name;

  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .insert({
      owner_user_id: user.id,
      name: draft.project.name,
      project_type: draft.project.projectType,
      start_date: draft.project.startDate,
      scheduling_mode: draft.project.schedulingMode,
      currency: draft.project.currency,
      contingency_percent: draft.project.contingencyPercent
    })
    .select()
    .single();

  if (projectError || !projectRow) {
    return { error: `Ustvarjanje projekta ni uspelo: ${projectError?.message}` };
  }

  const projectId = projectRow.id as string;

  await supabase
    .from("investors")
    .insert(draft.investors.map((investor) => investorToRow({ ...investor, projectId })));

  await supabase
    .from("funding_sources")
    .insert(draft.fundingSources.map((source) => fundingSourceToRow({ ...source, projectId })));

  await supabase.from("tasks").insert(
    draft.tasks.map((task) => taskToRow({ ...task, projectId }))
  );

  await supabase.from("cost_items").insert(
    draft.costItems.map((item) => costItemToRow({ ...item, projectId }))
  );

  await recalculateProject(supabase, projectId);

  redirect(`/projects/${projectId}`);
}

export async function deleteProject(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", projectId);
  redirect("/projects");
}
