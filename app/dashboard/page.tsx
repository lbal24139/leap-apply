import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateTaskModal from './create-task-modal'
import LogoutButton from './logout-button'

type Task = {
  id: string
  name: string
  company: string
  notes: string | null
  created_at: string
}

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, name, company, notes, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-bold text-[#0F172A] tracking-tight">Leap Apply</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-[#64748B]">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* ── Content ────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">My Applications</h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              {tasks?.length ?? 0} task{tasks?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <CreateTaskModal />
        </div>

        {tasks && tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((task: Task) => (
              <li key={task.id}>
                <div className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group">
                  {/* Left accent border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 group-hover:bg-indigo-600 transition-colors duration-200" />
                  <Link
                    href={`/dashboard/${task.id}`}
                    className="block bg-white pl-6 pr-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A] truncate">{task.name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                            {task.company}
                          </span>
                          {task.notes && (
                            <span className="text-xs text-[#64748B] truncate hidden sm:block">
                              {task.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      <time
                        dateTime={task.created_at}
                        className="shrink-0 text-xs text-[#64748B] pt-0.5"
                      >
                        {new Date(task.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-5">
        <svg className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          />
          <path
            d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          />
          <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-[#0F172A] mb-1">No applications yet</h3>
      <p className="text-sm text-[#64748B] max-w-xs">
        Create your first task to start tailoring your resume for a role.
      </p>
    </div>
  )
}

function LogoMark() {
  return (
    <svg className="h-7 w-7 text-indigo-600" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="currentColor" fillOpacity="0.12" />
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
