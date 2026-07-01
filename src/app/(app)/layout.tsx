import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/projects" className="text-lg font-semibold text-slate-900">
            GradnjaPlan
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>{user.displayName ?? user.email}</span>
            <form action={signOut}>
              <button type="submit" className="text-slate-500 hover:text-slate-900">
                Odjava
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
