import Link from "next/link"

type Props = {
  searchParams?: Promise<{
    error?: string
    callbackUrl?: string
  }> | {
    error?: string
    callbackUrl?: string
  }
}

const ERROR_HINTS: Record<string, string> = {
  Configuration:
    "Auth is misconfigured in production. Check NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET.",
  AccessDenied:
    "Your Google account is not on the authorized admin email list. Please sign in using an authorized Autoworx Google account.",
  OAuthSignin: "Google sign-in failed to start. Try again or check your Google OAuth settings.",
  OAuthCallback:
    "Google redirected back with an error. Verify the authorized redirect URI in Google Cloud Console matches this domain.",
  OAuthCreateAccount: "Could not create user account in the provider.",
  EmailCreateAccount: "Could not create user account via email.",
  Callback: "Error during authentication callback.",
  OAuthAccountNotLinked: "This email is already associated with another account.",
  EmailSignin: "Email sign-in failed.",
  CredentialsSignin: "The credentials you provided are invalid.",
  SessionRequired: "Please sign in to access this page.",
}

export default async function AdminAuthErrorPage({ searchParams }: Props) {
  const resolvedParams = searchParams ? await searchParams : {}
  const error = resolvedParams?.error ?? "Unknown"
  const callbackUrl = resolvedParams?.callbackUrl
  const hint = ERROR_HINTS[error] || "An unexpected authentication error occurred. Please try logging in again."

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-foreground">Admin Sign-in Notice</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Authentication could not be completed.
        </p>

        <div className="mt-4 rounded-lg bg-muted/50 p-4 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Error Code</p>
          <p className="mt-1 font-mono text-sm text-foreground break-all font-semibold">{error}</p>
          {callbackUrl ? (
            <>
              <p className="mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attempted Page</p>
              <p className="mt-1 font-mono text-sm text-foreground break-all">{callbackUrl}</p>
            </>
          ) : null}
        </div>

        {hint ? (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm">
            {hint}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Back to Admin Login
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
