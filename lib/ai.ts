import { Scene, Character, ConflictOption } from '@/types'

export interface GenerateConflictParams {
  sourceScene: Scene
  targetScene: Scene
  characters: Character[]
  apiEndpoint: string
  model: string
}

export async function generateConflicts(params: GenerateConflictParams): Promise<ConflictOption[]> {
  const { sourceScene, targetScene, characters, apiEndpoint, model } = params

  const sceneChars = (ids: string[] | undefined) =>
    (ids || [])
      .map(id => characters.find(c => c.id === id))
      .filter(Boolean)
      .map(c => `${c!.name} (${c!.role || 'unknown role'})`)
      .join(', ')

  const prompt = `You are a story development assistant. Analyze two scenes and generate 3 compelling conflict options that could happen between them.

Scene A: "${sourceScene.title}"
Description: ${sourceScene.description || 'No description'}
Characters: ${sceneChars(sourceScene.character_ids) || 'None specified'}

Scene B: "${targetScene.title}"
Description: ${targetScene.description || 'No description'}
Characters: ${sceneChars(targetScene.character_ids) || 'None specified'}

Generate exactly 3 conflict options. Each must create narrative tension and make the story more interesting.

Respond ONLY with valid JSON in this exact format:
[
  {
    "id": 1,
    "title": "Short conflict title",
    "description": "2-3 sentence description of what happens",
    "tension": "The core tension: what is at stake"
  },
  {
    "id": 2,
    "title": "Short conflict title",
    "description": "2-3 sentence description of what happens",
    "tension": "The core tension: what is at stake"
  },
  {
    "id": 3,
    "title": "Short conflict title",
    "description": "2-3 sentence description of what happens",
    "tension": "The core tension: what is at stake"
  }
]`

  const response = await fetch(`${apiEndpoint}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a creative story development assistant. Always respond with valid JSON only, no markdown, no explanation.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.85,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  // Strip markdown code blocks if present
  const cleaned = content.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

  const options: ConflictOption[] = JSON.parse(cleaned)
  return options
}
