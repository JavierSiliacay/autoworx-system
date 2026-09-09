import { NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware"
import { isAuthorizedAdminEmail, isAccountingEmail } from "@/lib/auth"

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl?.pathname || ""
        // Always allow the error page to be viewed
        if (pathname === "/admin/error" || pathname.startsWith("/admin/error")) {
          return true
        }
        return isAuthorizedAdminEmail(token?.email) || isAccountingEmail(token?.email)
      },
    },
  }
)

export const config = {
  matcher: ["/admin/:path+"],
}