'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-indigo-50 to-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 md:min-h-[560px] md:shadow-2xl md:rounded-3xl overflow-hidden">

        {/* ── Left: hero ─────────────────────────────────── */}
        <div className="hidden md:flex flex-col justify-center bg-gradient-to-br from-indigo-600 to-indigo-500 px-12 py-16 text-white">
          <div className="flex items-center gap-2.5 mb-10">
            <LogoMark />
            <span className="text-xl font-bold tracking-tight">Leap Apply</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Tailor your resume.<br />Land your dream job.
          </h1>

          <p className="mt-4 text-indigo-100 text-base leading-relaxed">
            AI-powered tools that help you stand out for every role you apply to.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              'Tailored resume generated for each application',
              'Gap analysis so you know what to prepare',
              'One-click PDF export ready to send',
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-indigo-100">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-200" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: sign-in card ─────────────────────────── */}
        <div className="flex flex-col justify-center bg-white px-8 py-12 md:px-12">
          {/* Mobile-only brand mark */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <LogoMark className="text-indigo-600" />
            <span className="text-lg font-bold tracking-tight text-[#0F172A]">Leap Apply</span>
          </div>

          <h2 className="text-2xl font-bold text-[#0F172A]">Welcome back</h2>
          <p className="mt-1.5 text-sm text-[#64748B]">
            Sign in to continue to Leap Apply
          </p>

          <button
            onClick={signInWithGoogle}
            className="mt-8 w-full inline-flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#0F172A] shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <ErrorMessage />

          <p className="mt-8 text-center text-xs text-[#64748B]">
            By signing in you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </main>
  )
}

function ErrorMessage() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  if (!params.get('error')) return null
  return (
    <p className="mt-4 text-center text-sm text-red-500">
      Authentication failed. Please try again.
    </p>
  )
}

function LogoMark({ className = 'text-white' }: { className?: string }) {
  return (
    <svg className={`h-7 w-7 ${className}`} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M8 20l5-12 5 12M10.5 15h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}
