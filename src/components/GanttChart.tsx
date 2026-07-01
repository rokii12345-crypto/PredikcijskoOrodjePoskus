import type { Task } from "@/types";

function daysBetween(a: string, b: string): number {
  const diff = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function GanttChart({ tasks }: { tasks: Task[] }) {
  const scheduled = tasks.filter((task) => task.startDate && task.endDate && task.included !== false);

  if (scheduled.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        Ni planiranih aktivnosti.
      </p>
    );
  }

  const minStart = scheduled.reduce((min, task) => (task.startDate! < min ? task.startDate! : min), scheduled[0].startDate!);
  const maxEnd = scheduled.reduce((max, task) => (task.endDate! > max ? task.endDate! : max), scheduled[0].endDate!);
  const totalDays = Math.max(daysBetween(minStart, maxEnd), 1);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-[640px]">
        {scheduled.map((task) => {
          const offsetDays = daysBetween(minStart, task.startDate!);
          const durationDays = Math.max(daysBetween(task.startDate!, task.endDate!), task.type === "milestone" ? 0 : 1);
          const leftPercent = (offsetDays / totalDays) * 100;
          const widthPercent = Math.max((durationDays / totalDays) * 100, task.type === "milestone" ? 0.6 : 0.8);
          const isSummary = task.type === "summary";
          const isMilestone = task.type === "milestone";

          return (
            <div key={task.id} className="flex items-center gap-3 py-1">
              <div
                className={`w-56 shrink-0 truncate text-sm ${isSummary ? "font-semibold text-slate-900" : "text-slate-600"}`}
                title={task.name}
              >
                {task.code} · {task.name}
              </div>
              <div className="relative h-5 flex-1 rounded bg-slate-100">
                <div
                  className={`absolute top-0 h-5 rounded ${
                    isMilestone ? "bg-amber-500" : isSummary ? "bg-slate-400" : "bg-teal-600"
                  }`}
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  title={`${task.startDate} → ${task.endDate}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
