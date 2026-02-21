import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { updateTask } from './actions'
import TaskDetailForm from './task-detail-form'

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: task } = await supabase
    .from('tasks')
    .select('id, name, company, notes, existing_profile, job_description')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!task) notFound()

  const boundAction = updateTask.bind(null, task.id)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Sticky Navbar ────────────────────────────────── */}
      <nav className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex items-center justify-center h-8 w-8 rounded-lg text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A] transition-all duration-200 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="h-4 w-px bg-slate-200 shrink-0" />
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-semibold text-[#0F172A] truncate">{task.name}</h1>
            <span className="shrink-0 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {task.company}
            </span>
          </div>
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <TaskDetailForm
          taskId={task.id}
          company={task.company}
          action={boundAction}
          existingProfile={task.existing_profile}
          jobDescription={task.job_description}
        />
      </main>
    </div>
  )
}
