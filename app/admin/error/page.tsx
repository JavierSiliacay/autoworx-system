import Link from "next/link"

type Props = {
  searchParams?: {
    error?: string
    callbackUrl?: string
  }
}

const ERROR_HINTS: Record<string, string> = {
  Configuration:
    "Auth is misconfigured in production. On Vercel, set NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET, then redeploy.",
  AccessDenied:
    "Your Google account isn’t authorized for this admin portal (email allowlist). Try a different account.",
  OAuthSignin: "Google sign-in failed to start. Try again or check your Google OAuth settings.",
  OAuthCallback:
    "Google redirected back with an error. Verify the authorized redirect URI in Google Cloud Console matches this site.",
}

export default function AdminAuthErrorPage({ searchParams }: Props) {
  const error = searchParams?.error ?? "Unknown"
  const callbackUrl = searchParams?.callbackUrl
  const hint = ERROR_HINTS[error]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold text-foreground">Admin sign-in error</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          NextAuth returned an error while trying to sign you in.
        </p>

        <div className="mt-4 rounded-lg bg-secondary p-4">
          <p className="text-xs text-muted-foreground">Error</p>
          <p className="mt-1 font-mono text-sm text-foreground break-all">{error}</p>
          {callbackUrl ? (
            <>
              <p className="mt-3 text-xs text-muted-foreground">Callback URL</p>
              <p className="mt-1 font-mono text-sm text-foreground break-all">{callbackUrl}</p>
            </>
          ) : null}
        </div>

        {hint ? <p className="mt-4 text-sm text-foreground">{hint}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to Admin login
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

