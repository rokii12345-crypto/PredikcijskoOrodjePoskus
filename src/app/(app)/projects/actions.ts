"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { createDemoProject } from "@/lib/demo/createDemoProject";
import { createProject as createProjectRecord, deleteProjectRecord, hasProjectAccess } from "@/lib/data/queries";

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

  const user = await requireUser();
  const draft = createDemoProject(user.id, startDate);

  const projectId = await createProjectRecord({
    ownerUserId: user.id,
    name,
    startDate,
    contingencyPercent: draft.project.contingencyPercent,
    investors: draft.investors,
    fundingSources: draft.fundingSources,
    tasks: draft.tasks,
    costItems: draft.costItems
  });

  redirect(`/projects/${projectId}`);
}

export async function deleteProject(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  if (await hasProjectAccess(user.id, projectId)) {
    await deleteProjectRecord(projectId);
  }

  redirect("/projects");
}
