import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProject, hasProjectAccess } from "@/lib/data/queries";
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
  const user = await requireUser();

  if (!(await hasProjectAccess(user.id, id))) {
    notFound();
  }

  const project = await getProject(id);

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
