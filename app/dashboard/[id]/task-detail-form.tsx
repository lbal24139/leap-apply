'use client'

import { useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import type { UpdateResult } from './actions'

type Props = {
  taskId: string
  company: string
  action: (prevState: UpdateResult, formData: FormData) => Promise<UpdateResult>
  existingProfile: string | null
  jobDescription: string | null
}

type GenerateResult = {
  resume: string
  gaps: string
}

const initialSaveState: UpdateResult = { success: false }

async function downloadAsPDF(content: string, filename: string) {
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 40
  const marginY = 40
  const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2
  const pageHeight = doc.internal.pageSize.getHeight()
  const fontSize = 10
  const lineHeight = 14

  doc.setFont('courier', 'normal')
  doc.setFontSize(fontSize)

  let y = marginY + fontSize

  for (const rawLine of content.split('\n')) {
    const wrapped = doc.splitTextToSize(rawLine || ' ', maxWidth) as string[]
    for (const line of wrapped) {
      if (y + lineHeight > pageHeight - marginY) {
        doc.addPage()
        y = marginY + fontSize
      }
      doc.text(line, marginX, y)
      y += lineHeight
    }
  }

  doc.save(filename)
}

export default function TaskDetailForm({
  taskId,
  company,
  action,
  existingProfile,
  jobDescription,
}: Props) {
  const [saveState, formAction] = useFormState(action, initialSaveState)

  const profileRef = useRef<HTMLTextAreaElement>(null)
  const jobDescRef = useRef<HTMLTextAreaElement>(null)

  const [generating, setGenerating] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [genResult, setGenResult] = useState<GenerateResult | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  async function handleGenerate() {
    const profile = profileRef.current?.value?.trim() ?? ''
    const jd = jobDescRef.current?.value?.trim() ?? ''

    if (!profile || !jd) {
      setGenError('Fill in both fields before generating.')
      return
    }

    setGenerating(true)
    setGenError(null)
    setGenResult(null)
    setStreamText('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, existing_profile: profile, job_description: jd }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error ?? 'Generation failed.')
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setStreamText(accumulated)
      }

      const resumeMatch = accumulated.match(/<TAILORED_RESUME>([\s\S]*?)<\/TAILORED_RESUME>/)
      const gapsMatch = accumulated.match(/<GAP_ANALYSIS>([\s\S]*?)<\/GAP_ANALYSIS>/)

      setGenResult({
        resume: resumeMatch?.[1]?.trim() ?? accumulated.trim(),
        gaps: gapsMatch?.[1]?.trim() ?? '',
      })
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setGenerating(false)
      setStreamText('')
    }
  }

  return (
    <div className="space-y-8">
      {/* Save form */}
      <form action={formAction} className="space-y-6">
        <div>
          <label
            htmlFor="existing_profile"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Existing profile / resume
          </label>
          <textarea
            ref={profileRef}
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
            ref={jobDescRef}
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
            {saveState.success && (
              <p className="text-sm text-green-600 font-medium">Changes saved.</p>
            )}
            {saveState.error && (
              <p className="text-sm text-red-500">{saveState.error}</p>
            )}
          </div>
          <SaveButton />
        </div>
      </form>

      {/* Generate section */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI Generation</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tailored resume + gap analysis via Claude
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="shrink-0 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Generating…
              </span>
            ) : (
              'Generate'
            )}
          </button>
        </div>

        {genError && (
          <p className="mt-3 text-sm text-red-500">{genError}</p>
        )}

        {/* Live stream preview */}
        {generating && streamText && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Generating…
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
              {streamText.replace(/<\/?(?:TAILORED_RESUME|GAP_ANALYSIS)>/g, '')}
            </p>
          </div>
        )}

        {/* Parsed results */}
        {genResult && (
          <div className="mt-6 space-y-6">
            {genResult.resume && (
              <ResultCard
                title="Tailored Resume"
                content={genResult.resume}
                variant="default"
                onDownload={() =>
                  downloadAsPDF(
                    genResult.resume,
                    `resume-${company.toLowerCase().replace(/\s+/g, '-')}.pdf`,
                  )
                }
              />
            )}
            {genResult.gaps && (
              <ResultCard
                title="Gap Analysis"
                content={genResult.gaps}
                variant="amber"
              />
            )}
          </div>
        )}
      </div>
    </div>
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

function ResultCard({
  title,
  content,
  variant,
  onDownload,
}: {
  title: string
  content: string
  variant: 'default' | 'amber'
  onDownload?: () => void
}) {
  const bg = variant === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1v9m0 0L5 7m3 3 3-3M2 12v1a2 2 0 002 2h8a2 2 0 002-2v-1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download PDF
          </button>
        )}
      </div>
      <div className={`rounded-xl border p-5 ${bg}`}>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
          {content}
        </pre>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
