import { NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware"
import { isAuthorizedAdminEmail, isAccountingEmail } from "@/lib/auth"

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }: { token?: { email?: string | null } | null }) =>
        isAuthorizedAdminEmail(token?.email) || isAccountingEmail(token?.email),
    },
  }
)

export const config = {
  matcher: ["/admin/:path+"],
}