'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UpdateResult = { success: boolean; error?: string }

export async function updateTask(
  id: string,
  prevState: UpdateResult,
  formData: FormData,
): Promise<UpdateResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const existingProfile = (formData.get('existing_profile') as string)?.trim() || null
  const jobDescription = (formData.get('job_description') as string)?.trim() || null

  const { error } = await supabase
    .from('tasks')
    .update({ existing_profile: existingProfile, job_description: jobDescription })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
