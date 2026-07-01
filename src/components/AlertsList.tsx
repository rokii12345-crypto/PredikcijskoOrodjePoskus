import type { ProjectAlert } from "@/types";

const SEVERITY_STYLES: Record<ProjectAlert["severity"], string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-slate-200 bg-slate-50 text-slate-700"
};

export function AlertsList({ alerts }: { alerts: ProjectAlert[] }) {
  if (alerts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        Ni opozoril.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => (
        <li key={alert.id} className={`rounded-md border px-3 py-2 text-sm ${SEVERITY_STYLES[alert.severity]}`}>
          <p className="font-medium">{alert.title}</p>
          <p className="mt-0.5">{alert.message}</p>
        </li>
      ))}
    </ul>
  );
}
