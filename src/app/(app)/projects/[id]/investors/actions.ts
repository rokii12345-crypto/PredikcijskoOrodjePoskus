"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertInvestor(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const investorId = String(formData.get("investorId") ?? "");

  const row = {
    project_id: projectId,
    name: String(formData.get("name") ?? ""),
    share_percent: Number(formData.get("sharePercent") ?? 0),
    email: String(formData.get("email") ?? "") || null,
    note: String(formData.get("note") ?? "") || null
  };

  const supabase = await createClient();

  if (investorId) {
    await supabase.from("investors").update(row).eq("id", investorId);
  } else {
    await supabase.from("investors").insert(row);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/investors`);
}

export async function deleteInvestor(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const investorId = String(formData.get("investorId") ?? "");

  const supabase = await createClient();
  await supabase.from("investors").delete().eq("id", investorId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/investors`);
}
