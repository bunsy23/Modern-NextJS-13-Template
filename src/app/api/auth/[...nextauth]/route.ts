import { compare } from 'bcrypt';
import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Sign in',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'example@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: `${user.id}`,
          email: user.email,
          name: user.name,
          role: 'admin',
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const u = user as unknown as any;
        return { ...token, id: u.id, role: u.role };
      }

      return token;
    },
    session: ({ session, token }) => {
      return {
        ...session,
        user: { ...session.user, id: token.id, role: token.role },
      };
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };