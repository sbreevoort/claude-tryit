interface AnthropicResponse {
  content: { type: string; text: string }[];
}

export interface PitchResult {
  pitch: string;
  coreStrength: string;
}

export const generatePitch = async (cvNotes: string): Promise<PitchResult> => {
  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content:
            "You are an expert recruiter. Analyze the following rough candidate notes. CRUCIAL RULE: Detect the language of the input (e.g. Dutch or English) and write your response in that EXACT SAME language. Return ONLY a valid JSON object with exactly two keys: 'pitch' (a persuasive, 3-sentence professional introduction of the candidate for a client) and 'coreStrength' (a 2-to-3 word summary of their best trait). Candidate notes: " +
            cvNotes,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data: AnthropicResponse = await response.json();
  const rawText = data.content[0].text;

  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

  const result: PitchResult = JSON.parse(jsonString);
  return result;
};
