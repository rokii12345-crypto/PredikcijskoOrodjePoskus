import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectNav } from "@/components/ProjectNav";
import { DeleteProjectForm } from "@/components/DeleteProjectForm";

export default async function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id, name").eq("id", id).single();

  if (!project) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
        <DeleteProjectForm projectId={id} />
      </div>
      <ProjectNav projectId={id} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
