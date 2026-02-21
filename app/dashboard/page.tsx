import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateTaskModal from './create-task-modal'

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

  if (!user) {
    redirect('/login')
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, name, company, notes, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          </div>
          <CreateTaskModal />
        </div>

        {/* Task list */}
        {tasks && tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((task: Task) => (
              <li key={task.id}>
                <Link
                  href={`/dashboard/${task.id}`}
                  className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{task.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{task.company}</p>
                    </div>
                    <time
                      dateTime={task.created_at}
                      className="text-xs text-gray-400 shrink-0 pt-0.5"
                    >
                      {new Date(task.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  {task.notes && (
                    <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-50">
                      {task.notes}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 text-sm">No tasks yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Click <span className="font-medium text-gray-600">Create Task</span> to add your first one.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
