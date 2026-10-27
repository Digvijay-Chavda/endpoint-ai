import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import { upsertUserWithSample } from '@/lib/users';

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user'];
  }
}

/**
 * Google sign-in with stateless JWT sessions. The Google account's stable `sub` is the user id and
 * the owner of every project. Needs AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google' || !profile?.sub) return false;
      if (profile.email_verified === false) return false;
      try {
        // First sign-in also creates the user's sample project.
        await upsertUserWithSample({
          id: profile.sub,
          email: profile.email ?? null,
          name: profile.name ?? null,
          image: typeof profile.picture === 'string' ? profile.picture : null,
        });
      } catch (error) {
        console.error('Failed to save user on sign-in', error);
        return false;
      }
      return true;
    },
    jwt({ token, account, profile }) {
      if (account && profile?.sub) token.uid = profile.sub;
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === 'string') session.user.id = token.uid;
      return session;
    },
  },
});
