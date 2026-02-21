'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createTask(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const name = (formData.get('name') as string)?.trim()
  const company = (formData.get('company') as string)?.trim()
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!name || !company) {
    throw new Error('Task name and company name are required.')
  }

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    name,
    company,
    notes,
  })

  if (error) {
    throw new Error(error.message)
  }

  redirect('/dashboard')
}
