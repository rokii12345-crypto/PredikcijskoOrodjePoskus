"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Dashboard" },
  { href: "/schedule", label: "Terminski plan" },
  { href: "/costs", label: "Stroški" },
  { href: "/payments", label: "Plačilni plan" },
  { href: "/funding", label: "Viri financiranja" },
  { href: "/investors", label: "Investitorji" }
];

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive = pathname === href;

        return (
          <Link
            key={tab.href}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
