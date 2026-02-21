'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] transition-all duration-200"
    >
      Sign out
    </button>
  )
}
