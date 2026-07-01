import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { getProjectsForUser } from "@/lib/data/queries";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = getProjectsForUser(user.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Moji projekti</h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Nov projekt
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Še nimaš nobenega projekta. Ustvari prvega s klikom na &quot;Nov projekt&quot;.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-400"
              >
                <h2 className="font-semibold text-slate-900">{project.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Začetek gradnje: {project.startDate}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  {project.projectType === "house_new_build" ? "Novogradnja hiše" : project.projectType}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
