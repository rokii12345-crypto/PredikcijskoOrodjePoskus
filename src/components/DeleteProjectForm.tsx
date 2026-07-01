"use client";

import { deleteProject } from "@/app/(app)/projects/actions";

export function DeleteProjectForm({ projectId }: { projectId: string }) {
  return (
    <form
      action={deleteProject}
      onSubmit={(event) => {
        if (!confirm("Izbriši projekt in vse povezane podatke?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" className="text-sm text-red-600 hover:text-red-800">
        Izbriši projekt
      </button>
    </form>
  );
}
