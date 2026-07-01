import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProjectFullData } from "@/lib/data/queries";
import { GanttChart } from "@/components/GanttChart";
import { updateProjectStartDate, updateTask } from "./actions";

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = getProjectFullData(user.id, id);

  if (!data) {
    notFound();
  }

  const { project, tasks } = data;
  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <form action={updateProjectStartDate} className="flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="projectId" value={project.id} />
        <label className="text-sm font-medium text-slate-700">
          Datum začetka projekta
          <input
            type="date"
            name="startDate"
            defaultValue={project.startDate}
            className="mt-1 block rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
          />
        </label>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Preračunaj plan
        </button>
      </form>

      <GanttChart tasks={sortedTasks} />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">WBS</th>
              <th className="px-4 py-2">Naziv</th>
              <th className="px-4 py-2">Trajanje (dni)</th>
              <th className="px-4 py-2">Začetek</th>
              <th className="px-4 py-2">Konec</th>
              <th className="px-4 py-2">Predhodniki</th>
              <th className="px-4 py-2">Vključena</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTasks.map((task) => (
              <tr key={task.id} className={task.type === "summary" ? "bg-slate-50 font-semibold" : ""}>
                <td className="px-4 py-2 text-slate-500">{task.code}</td>
                <td className="px-4 py-2">
                  <form id={`task-${task.id}`} action={updateTask} className="flex items-center gap-2">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <input
                      name="name"
                      defaultValue={task.name}
                      className="w-56 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </form>
                </td>
                <td className="px-4 py-2">
                  <input
                    form={`task-${task.id}`}
                    type="number"
                    min={0}
                    name="durationDays"
                    defaultValue={task.durationDays}
                    disabled={task.type === "summary"}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
                  />
                </td>
                <td className="px-4 py-2 text-slate-600">{task.startDate ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{task.endDate ?? "—"}</td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {task.dependencies.map((dep) => dep.predecessorTaskCode).join(", ") || "—"}
                </td>
                <td className="px-4 py-2">
                  <input
                    form={`task-${task.id}`}
                    type="checkbox"
                    name="included"
                    defaultChecked={task.included !== false}
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    form={`task-${task.id}`}
                    type="submit"
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Shrani
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
