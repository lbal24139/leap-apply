import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic()

const SYSTEM_PROMPT = `You are an expert resume writer and career coach.`

const USER_PROMPT = (profile: string, jd: string) => `\
Given the candidate's existing profile and the job description below, produce two outputs.

<EXISTING_PROFILE>
${profile}
</EXISTING_PROFILE>

<JOB_DESCRIPTION>
${jd}
</JOB_DESCRIPTION>

Format your response EXACTLY as follows — include the XML tags exactly as shown:

<TAILORED_RESUME>
Rewrite the candidate's resume to best match the job requirements. Use relevant keywords and phrases from the JD. Reorganise and emphasise experiences that align with the role. Do not fabricate skills or experience.
</TAILORED_RESUME>

<GAP_ANALYSIS>
List the specific skills, experiences, certifications, tools, or qualifications required by the JD that are absent or underrepresented in the candidate's profile. Be specific and actionable.
</GAP_ANALYSIS>`

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let taskId: string, existing_profile: string, job_description: string
  try {
    const body = await request.json()
    taskId = body.taskId
    existing_profile = body.existing_profile
    job_description = body.job_description
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!existing_profile?.trim() || !job_description?.trim()) {
    return Response.json(
      { error: 'Both profile and job description are required.' },
      { status: 400 },
    )
  }

  // Verify the task belongs to this user before generating
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (!task) {
    return Response.json({ error: 'Task not found.' }, { status: 404 })
  }

  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = anthropic.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 8192,
          thinking: { type: 'adaptive' },
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: USER_PROMPT(existing_profile, job_description),
            },
          ],
        })

        for await (const event of messageStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullText += event.delta.text
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }

        // After streaming completes, extract gaps and persist to Supabase
        const gapsMatch = fullText.match(/<GAP_ANALYSIS>([\s\S]*?)<\/GAP_ANALYSIS>/)
        const gaps = gapsMatch?.[1]?.trim() ?? null

        if (gaps) {
          await supabase
            .from('tasks')
            .update({ gaps })
            .eq('id', taskId)
            .eq('user_id', user.id)
        }

        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
