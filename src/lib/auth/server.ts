import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session) return null;

  return queryOne<CurrentUser>(
    "select id, email, display_name as displayName from users where id = :id",
    { id: session.userId }
  );
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
