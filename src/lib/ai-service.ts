import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key',
})

export async function categorizeIssueAndSuggestContractor(description: string, contractors: any[]) {
  const contractorList = contractors.map(c => `${c.id}: ${c.full_name} (${c.trade})`).join('\n')

  const prompt = `
    Analyze the following maintenance issue: "${description}"

    Categorize it (e.g., Plumbing, Electrical, Structural, etc.) and pick the best contractor from this list:
    ${contractorList}

    Return ONLY a JSON object with keys: "category", "suggested_contractor_id", "reasoning".
  `

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
  })

  return JSON.parse(chatCompletion.choices[0].message.content || '{}')
}
