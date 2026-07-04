/**
 * Replace this with your real auth lookup (NextAuth `auth()`, Clerk
 * `currentUser()`, Supabase `getUser()`, etc). It just needs to return the
 * logged-in user's id (and email, if you want Stripe to pre-fill checkout).
 */
export async function getCurrentUser(): Promise<{
  id: string;
  email?: string;
} | null> {
  // TODO: wire up real session lookup
  throw new Error(
    "getCurrentUser() is a stub — connect it to your auth provider."
  );
}
