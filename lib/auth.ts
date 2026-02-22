import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"

// Authorized emails for admin access
const AUTHORIZED_EMAILS = [
  "autoworxcagayan2025@gmail.com",
  "siliacay.javier@gmail.com",
  "paulsuazo64@gmail.com",
  "alfred_autoworks@yahoo.com",
  "javiersiliacaysiliacay1234@gmail.com"
]

export function isAuthorizedAdminEmail(email?: string | null) {
  return !!email && AUTHORIZED_EMAILS.includes(email)
}

type SignInCallbackParams = { user: { email?: string | null } }
type JwtCallbackParams = { token: JWT; user?: { email?: string | null } | null }
type SessionCallbackParams = {
  session: {
    user?: { name?: string | null; email?: string | null; image?: string | null; role?: "admin" }
    expires: string
  }
  token: JWT
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }: SignInCallbackParams) {
      // Check if user's email is in the authorized list
      if (!isAuthorizedAdminEmail(user.email)) {
        return false
      }
      return true
    },
    async jwt({ token, user }: JwtCallbackParams) {
      // Persist admin role in the token once the user is known
      if (user?.email && isAuthorizedAdminEmail(user.email)) token.role = "admin"
      return token
    },
    async session({ session, token }: SessionCallbackParams) {
      // Expose role to the client session
      if (session.user) session.user.role = token.role === "admin" ? "admin" : undefined
      return session
    },
  },
  pages: {
    signIn: "/admin",
    error: "/admin/error",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
