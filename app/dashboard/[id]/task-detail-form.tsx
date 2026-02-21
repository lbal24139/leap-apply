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

// ── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatInline(s: string) {
  return escapeHtml(s).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

function resumeToHTML(markdown: string): string {
  const lines = markdown.split('\n')
  const parts: string[] = []
  let inList = false

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push('<span class="resume-spacer"></span>')
      continue
    }

    // Markdown heading (## or #)
    if (/^#{1,3}\s/.test(line)) {
      if (inList) { parts.push('</ul>'); inList = false }
      const heading = line.replace(/^#{1,3}\s/, '').replace(/\*\*/g, '')
      parts.push(`<h3>${escapeHtml(heading)}</h3>`)
      continue
    }

    // ALL CAPS section header (e.g. "WORK EXPERIENCE")
    if (/^[A-Z][A-Z &\-/]{2,}$/.test(line)) {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<h3>${escapeHtml(line)}</h3>`)
      continue
    }

    // Bullet point
    if (/^[-•*]\s/.test(line)) {
      if (!inList) { parts.push('<ul>'); inList = true }
      parts.push(`<li>${formatInline(line.replace(/^[-•*]\s/, ''))}</li>`)
      continue
    }

    if (inList) { parts.push('</ul>'); inList = false }
    parts.push(`<p>${formatInline(line)}</p>`)
  }

  if (inList) parts.push('</ul>')
  return parts.join('\n')
}

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

// ── Component ──────────────────────────────────────────────────────────────

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
    <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">

      {/* ── Left: Save form ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-[#0F172A] mb-5">Application Details</h2>
        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="existing_profile"
              className="block text-sm font-medium text-[#0F172A] mb-0.5"
            >
              Existing profile / resume
            </label>
            <p className="text-xs text-[#64748B] mb-2">Your current CV or career summary</p>
            <textarea
              ref={profileRef}
              id="existing_profile"
              name="existing_profile"
              rows={14}
              defaultValue={existingProfile ?? ''}
              placeholder="Paste your current resume or profile summary here…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="job_description"
              className="block text-sm font-medium text-[#0F172A] mb-0.5"
            >
              Job description
            </label>
            <p className="text-xs text-[#64748B] mb-2">The role you're applying for</p>
            <textarea
              ref={jobDescRef}
              id="job_description"
              name="job_description"
              rows={14}
              defaultValue={jobDescription ?? ''}
              placeholder="Paste the job description here…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              {saveState.success && (
                <p className="text-sm text-emerald-600 font-medium">Changes saved.</p>
              )}
              {saveState.error && (
                <p className="text-sm text-red-500">{saveState.error}</p>
              )}
            </div>
            <SaveButton />
          </div>
        </form>
      </div>

      {/* ── Right: Generate section ───────────────────────── */}
      <div className="mt-6 lg:mt-0 lg:sticky lg:top-24 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">AI Generation</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Tailored resume + gap analysis via Claude
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 transition-all duration-200"
            >
              {generating ? (
                <>
                  <Spinner />
                  Generating…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>

          {genError && (
            <p className="mt-3 text-sm text-red-500">{genError}</p>
          )}

          {/* Live stream preview */}
          {generating && streamText && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#64748B]">
                Generating…
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#64748B]">
                {streamText.replace(/<\/?(?:TAILORED_RESUME|GAP_ANALYSIS)>/g, '')}
              </p>
            </div>
          )}
        </div>

        {/* Parsed results */}
        {genResult && (
          <div className="space-y-4">
            {/* Tailored Resume */}
            {genResult.resume && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#0F172A]">Tailored Resume</h3>
                  <button
                    type="button"
                    onClick={() =>
                      downloadAsPDF(
                        genResult.resume,
                        `resume-${company.toLowerCase().replace(/\s+/g, '-')}.pdf`,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] transition-all duration-200"
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
                </div>
                <div
                  className="resume-content"
                  dangerouslySetInnerHTML={{ __html: resumeToHTML(genResult.resume) }}
                />
              </div>
            )}

            {/* Gap Analysis */}
            {genResult.gaps && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Gap Analysis</h3>
                <div className="space-y-2">
                  {genResult.gaps
                    .split('\n')
                    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
                    .filter(Boolean)
                    .map((gap, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
                      >
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M8 6v3M8 11.5v.5M3.5 13.5h9a1 1 0 00.87-1.5l-4.5-7.8a1 1 0 00-1.74 0l-4.5 7.8a1 1 0 00.87 1.5z"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p
                          className="text-sm text-amber-900 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatInline(gap) }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-all duration-200"
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
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
