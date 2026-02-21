'use client'

import { useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createTask } from './actions'

export default function CreateTaskModal() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  function open() { dialogRef.current?.showModal() }
  function close() { dialogRef.current?.close() }

  return (
    <>
      <button
        onClick={open}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-all duration-200"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        New Task
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl p-0 shadow-2xl border-0"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-[#0F172A]">New Task</h2>
            <button
              onClick={close}
              aria-label="Close"
              className="rounded-md p-1 text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A] transition-all duration-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <form action={createTask} className="space-y-4">
            <Field id="name" label="Task name" required placeholder="e.g. Submit application" />
            <Field id="company" label="Company name" required placeholder="e.g. Acme Corp" />

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Any additional details…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-slate-50 transition-all duration-200"
              >
                Cancel
              </button>
              <SubmitButton />
            </div>
          </form>
        </div>
      </dialog>
    </>
  )
}

function Field({
  id,
  label,
  required,
  placeholder,
}: {
  id: string
  label: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#0F172A] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        required={required}
        autoComplete="off"
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
      />
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all duration-200"
    >
      {pending ? 'Saving…' : 'Save Task'}
    </button>
  )
}
