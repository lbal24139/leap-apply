'use client'

import { useFormState, useFormStatus } from 'react-dom'
import type { UpdateResult } from './actions'

type Props = {
  action: (prevState: UpdateResult, formData: FormData) => Promise<UpdateResult>
  existingProfile: string | null
  jobDescription: string | null
}

const initialState: UpdateResult = { success: false }

export default function TaskDetailForm({ action, existingProfile, jobDescription }: Props) {
  const [state, formAction] = useFormState(action, initialState)

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="existing_profile"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Existing profile / resume
        </label>
        <textarea
          id="existing_profile"
          name="existing_profile"
          rows={12}
          defaultValue={existingProfile ?? ''}
          placeholder="Paste your current resume or profile summary here…"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 resize-y"
        />
      </div>

      <div>
        <label
          htmlFor="job_description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Job description
        </label>
        <textarea
          id="job_description"
          name="job_description"
          rows={12}
          defaultValue={jobDescription ?? ''}
          placeholder="Paste the job description here…"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 resize-y"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          {state.success && (
            <p className="text-sm text-green-600 font-medium">Changes saved.</p>
          )}
          {state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}
        </div>
        <SaveButton />
      </div>
    </form>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
  )
}
