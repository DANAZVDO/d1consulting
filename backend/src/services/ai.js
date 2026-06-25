/**
 * AI Content Generation Service
 *
 * Handles interactions with OpenAI API for content generation.
 * Supports: social media posts, ad copy, blog posts, lead qualification.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const OPENAI_MODEL_MINI = 'gpt-4o-mini';

/**
 * Generate content using OpenAI
 */
export async function generateContent(template, variables, options = {}) {
  const { model = OPENAI_MODEL, n = 1, temperature = 0.7 } = options;

  // Substitute variables into prompt
  let prompt = template.prompt_text;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
  }

  const systemPrompt = `You are an expert marketing content creator. 
Write content that is engaging, appropriate for the platform, and drives results.
Tone: ${template.tone || 'professional'}
Max length: ${template.max_length || 'no limit'} characters.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      n,
      temperature,
      max_tokens: Math.min(template.max_length || 1000, 2000),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices.map(choice => choice.message.content.trim());
}

/**
 * Generate ad copy (uses GPT-4o for higher quality)
 */
export async function generateAdCopy(params) {
  return generateContent(
    {
      prompt_text: `Create a ${params.platform} ad:\nHeadline (max ${params.headlineMax} chars):\nPrimary text (max ${params.bodyMax} chars):\nCall to action: ${params.cta}\nTarget: ${params.audience}\nOffer: ${params.offer}`,
      tone: 'urgent',
      max_length: params.bodyMax || 500,
    },
    {},
    { model: 'gpt-4o', temperature: 0.8 }
  );
}

/**
 * Analyze lead conversation and generate summary + score
 */
export async function analyzeLeadConversation(conversationHistory) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL_MINI, // Use cheaper model for classification
      messages: [
        {
          role: 'system',
          content: `You are a lead qualification assistant. Analyze the conversation and return a JSON object with:
- summary: A one-sentence summary of what the lead wants
- score: A number 0-100 indicating readiness to buy
- interest: The product/service the lead is interested in
- urgency: 'low', 'medium', or 'high'
- suggested_action: 'contact_immediately', 'schedule_followup', or 'add_to_nurture'`,
        },
        {
          role: 'user',
          content: `Conversation:\n${conversationHistory}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}