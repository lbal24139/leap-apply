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

  if (!user) {
    redirect('/login')
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('id, name, company, notes, existing_profile, job_description')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!task) {
    notFound()
  }

  const boundAction = updateTask.bind(null, task.id)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          My Tasks
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{task.name}</h1>
          <p className="text-gray-500 mt-1">{task.company}</p>
          {task.notes && (
            <p className="text-sm text-gray-500 mt-3 border-t border-gray-200 pt-3">
              {task.notes}
            </p>
          )}
        </div>

        <TaskDetailForm
          taskId={task.id}
          company={task.company}
          action={boundAction}
          existingProfile={task.existing_profile}
          jobDescription={task.job_description}
        />
      </div>
    </main>
  )
}
