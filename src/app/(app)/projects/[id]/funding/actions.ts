"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recalculateProject } from "@/lib/data/projectData";
import type { FundingSourceType } from "@/types";

async function afterChange(projectId: string) {
  const supabase = await createClient();
  await recalculateProject(supabase, projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/funding`);
  revalidatePath(`/projects/${projectId}/payments`);
}

export async function upsertFundingSource(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const fundingSourceId = String(formData.get("fundingSourceId") ?? "");

  const row = {
    project_id: projectId,
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "own_funds") as FundingSourceType,
    available_amount: Number(formData.get("availableAmount") ?? 0),
    available_from: String(formData.get("availableFrom") ?? ""),
    note: String(formData.get("note") ?? "") || null
  };

  const supabase = await createClient();

  if (fundingSourceId) {
    await supabase.from("funding_sources").update(row).eq("id", fundingSourceId);
  } else {
    await supabase.from("funding_sources").insert(row);
  }

  await afterChange(projectId);
}

export async function deleteFundingSource(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const fundingSourceId = String(formData.get("fundingSourceId") ?? "");

  const supabase = await createClient();
  await supabase.from("funding_sources").delete().eq("id", fundingSourceId);

  await afterChange(projectId);
}
