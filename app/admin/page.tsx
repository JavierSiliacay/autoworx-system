"use client"

import React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react" // Using NextAuth
import { Wrench, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession() // Check if user is authenticated

  useEffect(() => {
    // If authenticated with Google, redirect to dashboard
    if (status === "authenticated") {
      router.push("/admin/dashboard")
    }
  }, [status, router])

  const handleGoogleSignIn = async () => {
    try {
      // Use Google OAuth to sign in
      await signIn("google", {
        callbackUrl: "/admin/dashboard",
        redirect: true,
      })
    } catch (error) {
      console.error("Sign in error:", error)
    }
  }

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't show login if already authenticated
  if (status === "authenticated") {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Same logo section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Wrench className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Admin Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Autoworx Repairs</p>
        </div>

        {/* Google OAuth button instead of form */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-2">Sign in to continue</h2>
              <p className="text-sm text-muted-foreground">
                Only authorized Google accounts can access this portal
              </p>
            </div>

            {/* Google Sign-In Button */}
            <Button
              onClick={handleGoogleSignIn}
              className="w-full"
              size="lg"
            >
              <svg
                className="mr-2 h-5 w-5"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Sign in with Google
            </Button>
          </div>
        </div>

        {/* Shows which emails are authorized */}
        <div className="mt-4 p-4 bg-secondary rounded-lg text-center">
          <p className="text-xs text-muted-foreground">
            Only the following email addresses are authorized:
          </p>
          <ul className="mt-2 space-y-1">
            <li className="text-xs font-mono text-foreground">
              autoworxcagayan2025@gmail.com
            </li>
            <li className="text-xs font-mono text-foreground">
              paulsuazo64@gmail.com
            </li>
            <li className="text-xs font-mono text-foreground">
              siliacay.javier@gmail.com
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}