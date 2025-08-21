import NextAuth, { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // SECURITY: Only allow specific email to access admin panel
      // Check against server-side environment variable for security
      const allowedEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      const userEmail = user.email?.toLowerCase();
      
      console.log(`🔐 Login attempt by: ${userEmail}`);
      
      if (allowedEmail && userEmail === allowedEmail) {
        console.log(`✅ Access granted to ${userEmail}`);
        return true;
      } else {
        console.log(`❌ Access denied to ${userEmail} (expected: ${allowedEmail})`);
        return false;
      }
    },
    async session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

export default NextAuth(authOptions);
